import type { ClientSession } from "mongoose";
import { CustomerModel } from "../models/customer.model.js";

export class CustomerRepository {
  findByEmail(email: string) {
    return CustomerModel.findOne({ email }).select("+passwordHash");
  }

  findById(id: string, session?: ClientSession) {
    const query = CustomerModel.findById(id);
    return session ? query.session(session) : query;
  }

  create(data: { name: string; email: string; passwordHash: string }) {
    return CustomerModel.create(data);
  }
}
