import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    // Cada cartão pertence a um banco: é o banco que autoriza a compra.
    bankId: { type: Schema.Types.ObjectId, ref: "Bank", required: true },
    holderName: { type: String, required: true, trim: true },
    last4: { type: String, required: true, minlength: 4, maxlength: 4 },
    creditLimit: { type: Number, required: true, min: 0 },
    availableLimit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const CardModel = model("Card", schema);
