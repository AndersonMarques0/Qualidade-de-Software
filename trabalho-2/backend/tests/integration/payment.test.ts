import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { PaymentMethod, PaymentStatus } from "../../src/domain/enums.js";
import { AccountModel } from "../../src/models/account.model.js";
import { OrderModel } from "../../src/models/order.model.js";
import {
  createAccount,
  createBook,
  createCard,
  createCartItem,
  createCustomer,
  deliveryAddress,
  idempotencyKey,
} from "../helpers.js";

async function checkoutWithPayment(
  method: PaymentMethod,
  balance: number,
  prefix: string,
) {
  const { customer, token } = await createCustomer();
  const book = await createBook(100, 2);
  await createCartItem(customer.id, book.id, 1);
  await createAccount(customer.id, balance);

  const card = method === PaymentMethod.CREDIT_CARD
    ? await createCard(customer.id)
    : undefined;

  const response = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${token}`)
    .set("Idempotency-Key", idempotencyKey(prefix))
    .send({
      paymentMethod: method,
      ...(card ? { cardId: card.id } : {}),
      deliveryAddress,
    })
    .expect(201);

  return { customer, response: response.body, orderCount: await OrderModel.countDocuments({ customerId: customer.id }) };
}

describe("CT10–CT13 — autorização de pagamento", () => {
  it("CT10 — cartão com saldo suficiente autoriza o pedido", async () => {
    // Subtotal R$ 100 + frete Sudeste de 5% = R$ 105.
    const { customer, response, orderCount } = await checkoutWithPayment(
      PaymentMethod.CREDIT_CARD,
      105,
      "ct10-cartao-aprovado",
    );

    expect(response.order.paymentStatus).toBe(PaymentStatus.APPROVED);
    expect(response.order.status).toBe("CONFIRMED");
    expect(orderCount).toBe(1);
    const account = await AccountModel.findOne({ customerId: customer.id });
    expect(account?.balanceCents).toBe(0);
  });

  it("CT11 — cartão sem saldo suficiente não autoriza o pedido", async () => {
    const { customer, response, orderCount } = await checkoutWithPayment(
      PaymentMethod.CREDIT_CARD,
      104.99,
      "ct11-cartao-recusado",
    );

    expect(response.order.paymentStatus).toBe(PaymentStatus.DECLINED);
    expect(response.order.status).toBe("PROCESSING");
    expect(orderCount).toBe(1);
    const account = await AccountModel.findOne({ customerId: customer.id });
    expect(account?.balanceCents).toBe(10_499);
  });

  it("CT12 — Pix com saldo suficiente autoriza o pedido", async () => {
    const { customer, response, orderCount } = await checkoutWithPayment(
      PaymentMethod.PIX,
      105,
      "ct12-pix-aprovado",
    );

    expect(response.order.paymentStatus).toBe(PaymentStatus.APPROVED);
    expect(response.order.status).toBe("CONFIRMED");
    expect(orderCount).toBe(1);
    const account = await AccountModel.findOne({ customerId: customer.id });
    expect(account?.balanceCents).toBe(0);
  });

  it("CT13 — Pix sem saldo suficiente não autoriza o pedido", async () => {
    const { customer, response, orderCount } = await checkoutWithPayment(
      PaymentMethod.PIX,
      104.99,
      "ct13-pix-recusado",
    );

    expect(response.order.paymentStatus).toBe(PaymentStatus.DECLINED);
    expect(response.order.status).toBe("PROCESSING");
    expect(orderCount).toBe(1);
    const account = await AccountModel.findOne({ customerId: customer.id });
    expect(account?.balanceCents).toBe(10_499);
  });
});
