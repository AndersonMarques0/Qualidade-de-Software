import { Schema, model } from "mongoose";
const item = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);
const schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    items: { type: [item], default: [] },
  },
  { timestamps: true },
);
export const CartModel = model("Cart", schema);
