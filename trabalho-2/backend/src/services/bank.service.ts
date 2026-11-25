import { randomUUID } from "node:crypto";
import type { ClientSession } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../domain/enums.js";
import { AccountRepository } from "../repositories/account.repository.js";
import { BankRepository } from "../repositories/bank.repository.js";

const banks = new BankRepository();
const accounts = new AccountRepository();
const toCents = (reais: number) => Math.round(reais * 100);
const toReais = (cents: number) => cents / 100;

export class BankService {
  list() {
    return banks.findAll();
  }

  async create(input: { name: string; code: string }) {
    return banks.create(input);
  }

  async getAccount(customerId: string) {
    const account = await accounts.findByCustomer(customerId);
    return { balance: toReais(account?.balanceCents ?? 0) };
  }

  async deposit(customerId: string, amount: number) {
    const account = await accounts.deposit(customerId, toCents(amount));
    return { balance: toReais(account?.balanceCents ?? 0) };
  }

  // No projeto acadêmico, a conta é simulada no mesmo MongoDB e pode participar da transação.
  async authorize(
    customerId: string,
    amount: number,
    method: PaymentMethod,
    session?: ClientSession,
  ): Promise<{ status: PaymentStatus; reference: string }> {
    const approved = await accounts.debit(
      customerId,
      toCents(amount),
      session,
    );

    return {
      status: approved ? PaymentStatus.APPROVED : PaymentStatus.DECLINED,
      reference: `${method}_${randomUUID()}`,
    };
  }
}
