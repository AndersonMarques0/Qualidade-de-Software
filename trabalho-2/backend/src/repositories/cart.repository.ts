import { Types } from "mongoose";
import { CartModel } from "../models/cart.model.js";

export class CartRepository {
  findByCustomer(customerId: string) {
    return CartModel.findOne({ customerId })
      .populate("items.bookId");
  }

  findRawByCustomer(customerId: string) {
    return CartModel.findOne({ customerId });
  }

  async addItem(
    customerId: string,
    bookId: string,
    quantity: number
  ) {
    let cart = await CartModel.findOne({ customerId });

    if (!cart) {
      return CartModel.create({
        customerId: new Types.ObjectId(customerId),
        items: [
          {
            bookId: new Types.ObjectId(bookId),
            quantity
          }
        ]
      });
    }

    const found = cart.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (found) {
      found.quantity += quantity;
    } else {
      cart.items.push({
        bookId: new Types.ObjectId(bookId),
        quantity
      });
    }

    await cart.save();

    return cart;
  }

  async updateItem(
    customerId: string,
    bookId: string,
    quantity: number
  ) {
    const cart = await CartModel.findOne({ customerId });

    if (!cart) return null;

    const item = cart.items.find(
      (entry) => entry.bookId.toString() === bookId
    );

    if (!item) return null;

    item.quantity = quantity;

    await cart.save();

    return cart;
  }

  async removeItem(
    customerId: string,
    bookId: string
  ) {
    const cart = await CartModel.findOne({ customerId });

    if (!cart) return null;

    // Percorre o array de trás para frente para remover
    // os itens sem comprometer os índices restantes.
    for (let i = cart.items.length - 1; i >= 0; i--) {
      if (cart.items[i].bookId.toString() === bookId) {
        cart.items.splice(i, 1);
      }
    }

    await cart.save();

    return cart;
  }

  clear(customerId: string) {
    return CartModel.findOneAndUpdate(
      { customerId },
      { $set: { items: [] } }
    );
  }
}
