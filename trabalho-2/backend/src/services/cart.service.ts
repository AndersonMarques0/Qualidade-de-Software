import mongoose from "mongoose";
import { AppError } from "../domain/errors/app-error.js";
import { BookRepository } from "../repositories/book.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
const books = new BookRepository(),
  carts = new CartRepository();
export class CartService {
  async get(customerId: string) {
    const cart = await carts.findByCustomer(customerId);
    if (!cart) return { items: [], subtotal: 0 };
    const items = cart.items.map((entry: any) => {
      const book = entry.bookId;
      return {
        bookId: book?._id?.toString(),
        title: book?.title,
        unitPrice: book?.price,
        quantity: entry.quantity,
        lineTotal: Number(((book?.price ?? 0) * entry.quantity).toFixed(2)),
      };
    });
    return {
      items,
      subtotal: Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
      ),
    };
  }
  async add(customerId: string, bookId: string, quantity: number) {
    if (!mongoose.isValidObjectId(bookId))
      throw new AppError("ID de livro inválido.");
    const book = await books.findById(bookId);
    if (!book) throw new AppError("Livro não encontrado.", 404);
    if (book.stock < quantity) throw new AppError("Estoque insuficiente.", 409);
    await carts.addItem(customerId, bookId, quantity);
    return this.get(customerId);
  }
  async update(customerId: string, bookId: string, quantity: number) {
    if (!mongoose.isValidObjectId(bookId))
      throw new AppError("ID de livro inválido.");
    const book = await books.findById(bookId);
    if (!book) throw new AppError("Livro não encontrado.", 404);
    if (book.stock < quantity) throw new AppError("Estoque insuficiente.", 409);
    if (!(await carts.updateItem(customerId, bookId, quantity)))
      throw new AppError("Item não encontrado no carrinho.", 404);
    return this.get(customerId);
  }
  async remove(customerId: string, bookId: string) {
    if (!mongoose.isValidObjectId(bookId))
      throw new AppError("ID de livro inválido.");
    if (!(await carts.removeItem(customerId, bookId)))
      throw new AppError("Carrinho não encontrado.", 404);
    return this.get(customerId);
  }
}
