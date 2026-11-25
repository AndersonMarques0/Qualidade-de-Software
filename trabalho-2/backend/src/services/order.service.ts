import mongoose, { type ClientSession } from "mongoose";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Region,
} from "../domain/enums.js";
import { AppError } from "../domain/errors/app-error.js";
import {
  calculatePricing,
  yearsSince,
} from "../domain/services/pricing.service.js";
import { getRegionByState } from "../domain/services/region.service.js";
import {
  AUTO_ADVANCE_STEPS,
  assertOrderTransition,
} from "../domain/services/order-status.service.js";
import { BookRepository } from "../repositories/book.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { PaymentService } from "./payment.service.js";
import { CardService } from "./card.service.js";

const books = new BookRepository();
const carts = new CartRepository();
const customers = new CustomerRepository();
const orders = new OrderRepository();
const payments = new PaymentService();
const cardsService = new CardService();

const CANCELLATION_WINDOW_MS = 48 * 60 * 60 * 1000;

export interface CheckoutInput {
  region?: Region;
  paymentMethod: PaymentMethod;
  cardId?: string;
  deliveryAddress: {
    postalCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function checkoutMessage(paymentStatus: PaymentStatus): string {
  return paymentStatus === PaymentStatus.APPROVED
    ? "Pedido confirmado com sucesso."
    : "Pagamento não autorizado. O pedido poderá ser cancelado após 2 dias.";
}

export class OrderService {
  private async loadPreviewData(
    customerId: string,
    region: Region,
    now: Date,
    session?: ClientSession,
  ) {
    const customer = await customers.findById(customerId, session);
    if (!customer) throw new AppError("Cliente não encontrado.", 404);

    const cart = await carts.findByCustomer(customerId, session);
    if (!cart || cart.items.length === 0) {
      throw new AppError("Não é possível prosseguir sem itens no carrinho.");
    }

    const items = cart.items.map((entry: any) => {
      const book = entry.bookId;
      if (!book || !book._id) {
        throw new AppError("Livro indisponível no carrinho.", 409);
      }

      return {
        bookId: book._id.toString(),
        title: book.title,
        unitPrice: book.price,
        quantity: entry.quantity,
        lineTotal: Number((book.price * entry.quantity).toFixed(2)),
      };
    });

    const subtotal = Number(
      items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );
    const customerYears = yearsSince(customer.createdAt, now);
    const preview = {
      items,
      subtotal,
      ...calculatePricing({
        subtotal,
        yearsAsCustomer: customerYears,
        region,
      }),
    };

    return { cart, preview };
  }

  async preview(customerId: string, region: Region, now: Date = new Date()) {
    const { preview } = await this.loadPreviewData(customerId, region, now);
    return preview;
  }

  async checkout(
    customerId: string,
    input: CheckoutInput,
    idempotencyKey: string,
  ) {
    const existing = await orders.findByCustomerAndIdempotencyKey(
      customerId,
      idempotencyKey,
    );
    if (existing) {
      return {
        order: existing,
        message: checkoutMessage(existing.paymentStatus),
      };
    }

    if (input.paymentMethod === PaymentMethod.CREDIT_CARD) {
      if (!input.cardId) throw new AppError("Informe o cartão (cardId).");
      await cardsService.assertOwned(customerId, input.cardId);
    }

    const region = getRegionByState(input.deliveryAddress.state);
    const session = await mongoose.startSession();
    let response: { order: unknown; message: string } | undefined;

    try {
      await session.withTransaction(async () => {
        const previous = await orders.findByCustomerAndIdempotencyKey(
          customerId,
          idempotencyKey,
          session,
        );

        if (previous) {
          response = {
            order: previous,
            message: checkoutMessage(previous.paymentStatus),
          };
          return;
        }

        const now = new Date();
        const { preview } = await this.loadPreviewData(
          customerId,
          region,
          now,
          session,
        );

        for (const item of preview.items) {
          const reserved = await books.decreaseStock(
            item.bookId,
            item.quantity,
            session,
          );
          if (!reserved) {
            throw new AppError(
              "Estoque insuficiente para um ou mais livros.",
              409,
            );
          }
        }

        const createdOrder = await orders.create(
          {
            customerId,
            idempotencyKey,
            items: preview.items.map((item) => ({
              bookId: new mongoose.Types.ObjectId(item.bookId),
              title: item.title,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            })),
            region,
            customerProfile: preview.profile,
            subtotal: preview.subtotal,
            discount: preview.discount,
            shipping: preview.shipping,
            total: preview.total,
            paymentMethod: input.paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            status: OrderStatus.CREATED,
            ...(input.paymentMethod === PaymentMethod.CREDIT_CARD
              ? { cardId: input.cardId }
              : {}),
            deliveryAddress: input.deliveryAddress,
          },
          session,
        );

        const payment = await payments.pay(
          {
            method: input.paymentMethod,
            amount: preview.total,
            customerId,
          },
          session,
        );

        const cancellationDueAt =
          payment.status === PaymentStatus.DECLINED
            ? new Date(Date.now() + CANCELLATION_WINDOW_MS)
            : undefined;

        const updatedOrder = await orders.updatePayment(
          createdOrder.id,
          {
            paymentStatus: payment.status,
            status:
              payment.status === PaymentStatus.APPROVED
                ? OrderStatus.CONFIRMED
                : OrderStatus.PROCESSING,
            paymentReference: payment.reference,
            ...(cancellationDueAt ? { cancellationDueAt } : {}),
          },
          session,
        );

        if (!updatedOrder) {
          throw new Error(
            "Não foi possível atualizar o pedido após o pagamento.",
          );
        }

        const clearedCart = await carts.clear(customerId, session);
        if (!clearedCart) {
          throw new Error("Não foi possível limpar o carrinho.");
        }

        response = {
          order: updatedOrder,
          message: checkoutMessage(payment.status),
        };
      });
    } catch (error) {
      // Duas requisições com a mesma chave podem disputar o índice único.
      if (isDuplicateKeyError(error)) {
        const duplicate = await orders.findByCustomerAndIdempotencyKey(
          customerId,
          idempotencyKey,
        );
        if (duplicate) {
          return {
            order: duplicate,
            message: checkoutMessage(duplicate.paymentStatus),
          };
        }
      }
      throw error;
    } finally {
      await session.endSession();
    }

    if (!response) {
      throw new Error("O checkout foi encerrado sem produzir um resultado.");
    }
    return response;
  }

  list(customerId: string) {
    return orders.findByCustomer(customerId);
  }

  async get(customerId: string, id: string) {
    if (!mongoose.isObjectIdOrHexString(id)) {
      throw new AppError("ID de pedido inválido.", 400);
    }

    const order = await orders.findByIdForCustomer(id, customerId);
    if (!order) throw new AppError("Pedido não encontrado.", 404);
    return order;
  }

  async cancelExpired(now: Date = new Date()): Promise<number> {
    const expired = await orders.findExpired(now);
    let cancelled = 0;

    for (const candidate of expired) {
      const session = await mongoose.startSession();
      let didCancel = false;

      try {
        await session.withTransaction(async () => {
          didCancel = false;
          const order = await orders.cancelOneIfExpired(
            candidate.id,
            now,
            session,
          );
          if (!order) return;

          for (const item of order.items) {
            const restored = await books.increaseStock(
              item.bookId.toString(),
              item.quantity,
              session,
            );
            if (restored.matchedCount !== 1) {
              throw new Error(
                `Não foi possível devolver o estoque do livro ${item.bookId.toString()}.`,
              );
            }
          }

          didCancel = true;
        });

        if (didCancel) cancelled += 1;
      } finally {
        await session.endSession();
      }
    }

    return cancelled;
  }

  async advanceOrders(): Promise<number> {
    let moved = 0;
    for (const [from, to] of AUTO_ADVANCE_STEPS) {
      assertOrderTransition(from, to);
      moved += await orders.advanceAll(from, to);
    }
    return moved;
  }

  async processOrders(
    now: Date = new Date(),
  ): Promise<{ advanced: number; cancelled: number }> {
    const advanced = await this.advanceOrders();
    const cancelled = await this.cancelExpired(now);
    return { advanced, cancelled };
  }
}
