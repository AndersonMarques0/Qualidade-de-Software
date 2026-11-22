import { BankModel } from "../models/bank.model.js";

export class BankRepository {
  findAll() {
    return BankModel.find().sort({ name: 1 });
  }
  findById(id: string) {
    return BankModel.findById(id);
  }
  create(data: { name: string; code: string }) {
    return BankModel.create(data);
  }
}
