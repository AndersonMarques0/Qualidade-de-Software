import mongoose from "mongoose";
import { env } from "./env.js";
import { OrderModel } from "../models/order.model.js";

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  await OrderModel.init();
  console.log("MongoDB conectado.");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
