import { Types, type ClientSession } from "mongoose";
import { CartModel } from "../models/cart.model.js";

export class CartRepository {
  findByCustomer(customerId: string, session?: ClientSession) {
    const query = CartModel.findOne({ customerId }).populate("items.bookId");
    return session ? query.session(session) : query;
  }

  findRawByCustomer(customerId: string) {
    return CartModel.findOne({ customerId });
  }

  async quantityOfBook(customerId: string, bookId: string): Promise<number> {
    const cart = await CartModel.findOne({ customerId }).select("items");
    const item = cart?.items.find(
      (entry) => entry.bookId.toString() === bookId,
    );
    return item?.quantity ?? 0;
  }

  async addItem(customerId: string, bookId: string, quantity: number) {
    let cart = await CartModel.findOne({ customerId });

    if (!cart) {
      return CartModel.create({
        customerId: new Types.ObjectId(customerId),
        items: [{ bookId: new Types.ObjectId(bookId), quantity }],
      });
    }

    const found = cart.items.find(
      (item) => item.bookId.toString() === bookId,
    );

    if (found) {
      found.quantity += quantity;
    } else {
      cart.items.push({ bookId: new Types.ObjectId(bookId), quantity });
    }

    await cart.save();
    return cart;
  }

  async updateItem(customerId: string, bookId: string, quantity: number) {
    const cart = await CartModel.findOne({ customerId });
    if (!cart) return null;

    const item = cart.items.find(
      (entry) => entry.bookId.toString() === bookId,
    );
    if (!item) return null;

    item.quantity = quantity;
    await cart.save();
    return cart;
  }

  async removeItem(customerId: string, bookId: string): Promise<boolean> {
    const result = await CartModel.updateOne(
      {
        customerId,
        "items.bookId": new Types.ObjectId(bookId),
      },
      {
        $pull: { items: { bookId: new Types.ObjectId(bookId) } },
      },
    );

    return result.modifiedCount > 0;
  }

  clear(customerId: string, session?: ClientSession) {
    return CartModel.findOneAndUpdate(
      { customerId },
      { $set: { items: [] } },
      { new: true, session },
    );
  }
}
