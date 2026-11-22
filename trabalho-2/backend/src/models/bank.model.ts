import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true },
);

export const BankModel = model("Bank", schema);
