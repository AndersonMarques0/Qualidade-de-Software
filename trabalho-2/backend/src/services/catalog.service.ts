import { AppError } from "../domain/errors/app-error.js";
import { BookRepository } from "../repositories/book.repository.js";
const repo = new BookRepository();
export class CatalogService {
  list() {
    return repo.findAll();
  }
  async get(id: string) {
    const book = await repo.findById(id);
    if (!book) throw new AppError("Livro não encontrado.", 404);
    return book;
  }
}
