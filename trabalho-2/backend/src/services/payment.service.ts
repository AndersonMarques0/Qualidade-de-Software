import type { ClientSession } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../domain/enums.js";
import { BankService } from "./bank.service.js";

const bank = new BankService();

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  customerId: string;
}

export class PaymentService {
  pay(
    input: PaymentInput,
    session?: ClientSession,
  ): Promise<{ status: PaymentStatus; reference: string }> {
    return bank.authorize(
      input.customerId,
      input.amount,
      input.method,
      session,
    );
  }
}
