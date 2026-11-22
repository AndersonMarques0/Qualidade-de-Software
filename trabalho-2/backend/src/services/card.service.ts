import mongoose from "mongoose";
import { AppError } from "../domain/errors/app-error.js";
import { BankRepository } from "../repositories/bank.repository.js";
import { CardRepository } from "../repositories/card.repository.js";

const banks = new BankRepository();
const cards = new CardRepository();

function toDto(card: any) {
  return {
    id: card.id,
    holderName: card.holderName,
    last4: card.last4,
    creditLimit: card.creditLimit,
    availableLimit: card.availableLimit,
    bank: card.bankId
      ? { id: card.bankId.id, name: card.bankId.name, code: card.bankId.code }
      : null,
  };
}

export class CardService {
  async create(
    customerId: string,
    input: {
      bankId: string;
      holderName: string;
      number: string;
      creditLimit: number;
    },
  ) {
    if (!mongoose.isValidObjectId(input.bankId))
      throw new AppError("ID de banco inválido.");
    if (!(await banks.findById(input.bankId)))
      throw new AppError("Banco não encontrado.", 404);

    const created = await cards.create({
      customerId,
      bankId: input.bankId,
      holderName: input.holderName,
      last4: input.number.slice(-4),
      creditLimit: input.creditLimit,
    });
    return toDto(await cards.findByIdForCustomer(created.id, customerId));
  }

  async list(customerId: string) {
    return (await cards.findByCustomer(customerId)).map(toDto);
  }

  async assertOwned(customerId: string, cardId: string) {
    if (!mongoose.isValidObjectId(cardId))
      throw new AppError("ID de cartão inválido.");
    if (!(await cards.findByIdForCustomer(cardId, customerId)))
      throw new AppError("Cartão não encontrado.", 404);
  }
}
