import { Schema, model } from "mongoose";

// Conta bancária simulada do cliente. O saldo define se Pix e cartão são autorizados.
const schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    balanceCents: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const AccountModel = model("Account", schema);
