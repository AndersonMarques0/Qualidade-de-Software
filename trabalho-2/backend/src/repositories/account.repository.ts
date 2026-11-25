import type { ClientSession } from "mongoose";
import { AccountModel } from "../models/account.model.js";

export class AccountRepository {
  findByCustomer(customerId: string) {
    return AccountModel.findOne({ customerId });
  }

  // Cria a conta se não existir e soma o valor, em uma única operação atômica.
  deposit(customerId: string, cents: number) {
    return AccountModel.findOneAndUpdate(
      { customerId },
      { $inc: { balanceCents: cents } },
      { upsert: true, new: true },
    );
  }

  // Débito condicional e atômico; também pode participar de uma transação do checkout.
  async debit(
    customerId: string,
    cents: number,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await AccountModel.updateOne(
      { customerId, balanceCents: { $gte: cents } },
      { $inc: { balanceCents: -cents } },
      { session },
    );
    return result.matchedCount === 1;
  }
}
