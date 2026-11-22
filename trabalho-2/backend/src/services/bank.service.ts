import mongoose from "mongoose";
import { PaymentStatus } from "../domain/enums.js";
import { AppError } from "../domain/errors/app-error.js";
import { BankRepository } from "../repositories/bank.repository.js";
import { CardRepository } from "../repositories/card.repository.js";

const banks = new BankRepository();
const cards = new CardRepository();

export class BankService {
  list() {
    return banks.findAll();
  }

  async create(input: { name: string; code: string }) {
    return banks.create(input); // código duplicado vira 409 no error middleware
  }

  // Simulação do banco: autoriza se o cartão for do cliente e tiver limite.
  async authorize(
    customerId: string,
    cardId: string,
    amount: number,
  ): Promise<{ status: PaymentStatus; reference: string }> {
    if (!mongoose.isValidObjectId(cardId))
      throw new AppError("ID de cartão inválido.");

    const card: any = await cards.findByIdForCustomer(cardId, customerId);
    if (!card) throw new AppError("Cartão não encontrado.", 404);

    const bank = card.bankId; // populado
    const reference = `${bank?.code ?? "BANK"}_${Date.now()}`;

    if (!bank) return { status: PaymentStatus.DECLINED, reference };

    const ok = await cards.reserveLimit(cardId, customerId, amount);
    return {
      status: ok ? PaymentStatus.APPROVED : PaymentStatus.DECLINED,
      reference,
    };
  }
}
