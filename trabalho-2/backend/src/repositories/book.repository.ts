import type { ClientSession } from "mongoose";
import { BookModel } from "../models/book.model.js";

export class BookRepository {
  findAll() {
    return BookModel.find().sort({ title: 1 });
  }

  findById(id: string) {
    return BookModel.findById(id);
  }

  async decreaseStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await BookModel.updateOne(
      { _id: id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { session },
    );
    return result.modifiedCount === 1;
  }

  increaseStock(id: string, quantity: number, session?: ClientSession) {
    return BookModel.updateOne(
      { _id: id },
      { $inc: { stock: quantity } },
      { session },
    );
  }
}
