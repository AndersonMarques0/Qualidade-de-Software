import { Schema, model } from "mongoose";
import {
  CustomerProfile,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Region,
} from "../domain/enums.js";

const item = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    title: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false },
);

const address = new Schema(
  {
    postalCode: { type: String, required: true },
    street: { type: String, required: true },
    number: { type: String, required: true },
    complement: String,
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
  },
  { _id: false },
);

const schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
    },
    items: { type: [item], required: true },
    region: { type: String, enum: Object.values(Region), required: true },
    customerProfile: {
      type: String,
      enum: Object.values(CustomerProfile),
      required: true,
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
    },
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    paymentReference: String,
    cardId: { type: Schema.Types.ObjectId, ref: "Card" },
    cancellationDueAt: Date,
    deliveryAddress: { type: address, required: true },
  },
  { timestamps: true },
);

schema.index({ status: 1, cancellationDueAt: 1 });
schema.index(
  { customerId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

export const OrderModel = model("Order", schema);
