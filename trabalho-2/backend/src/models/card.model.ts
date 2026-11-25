import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    // Cada cartão pertence a um banco emissor.
    bankId: { type: Schema.Types.ObjectId, ref: "Bank", required: true },
    holderName: { type: String, required: true, trim: true },
    last4: { type: String, required: true, minlength: 4, maxlength: 4 },
  },
  { timestamps: true },
);

export const CardModel = model("Card", schema);
