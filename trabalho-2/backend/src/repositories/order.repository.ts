import type { ClientSession, Types } from "mongoose";
import {
  CustomerProfile,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Region,
} from "../domain/enums.js";
import { OrderModel } from "../models/order.model.js";

export interface CreateOrderData {
  customerId: string;
  idempotencyKey: string;
  items: Array<{
    bookId: Types.ObjectId;
    title: string;
    unitPrice: number;
    quantity: number;
  }>;
  region: Region;
  customerProfile: CustomerProfile;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
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

export class OrderRepository {
  async create(data: CreateOrderData, session: ClientSession) {
    const [order] = await OrderModel.create([data], { session });
    return order;
  }

  findByCustomerAndIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
    session?: ClientSession,
  ) {
    const query = OrderModel.findOne({ customerId, idempotencyKey });
    return session ? query.session(session) : query;
  }

  findByCustomer(customerId: string) {
    return OrderModel.find({ customerId }).sort({ createdAt: -1 });
  }

  findByIdForCustomer(orderId: string, customerId: string) {
    return OrderModel.findOne({ _id: orderId, customerId });
  }

  updatePayment(
    orderId: string,
    data: Record<string, unknown>,
    session?: ClientSession,
  ) {
    return OrderModel.findByIdAndUpdate(
      orderId,
      { $set: data },
      { new: true, runValidators: true, session },
    );
  }

  findExpired(now: Date = new Date()) {
    return OrderModel.find({
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.DECLINED,
      cancellationDueAt: { $lte: now },
    });
  }

  cancelOneIfExpired(
    orderId: string,
    now: Date,
    session: ClientSession,
  ) {
    return OrderModel.findOneAndUpdate(
      {
        _id: orderId,
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.DECLINED,
        cancellationDueAt: { $lte: now },
      },
      { $set: { status: OrderStatus.CANCELLED } },
      { new: true, session, runValidators: true },
    );
  }

  async advanceAll(from: OrderStatus, to: OrderStatus): Promise<number> {
    const result = await OrderModel.updateMany(
      { status: from },
      { $set: { status: to } },
    );
    return result.modifiedCount;
  }
}
