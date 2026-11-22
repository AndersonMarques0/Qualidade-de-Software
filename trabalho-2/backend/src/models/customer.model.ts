import { Schema, model } from "mongoose";
const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
});
export const CustomerModel = model("Customer", schema);
