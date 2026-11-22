import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../domain/errors/app-error.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
const repo = new CustomerRepository();
export class AuthService {
  async register(input: { name: string; email: string; password: string }) {
    if (await repo.findByEmail(input.email)) throw new AppError("E-mail já cadastrado.", 409);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const customer = await repo.create({ name: input.name, email: input.email, passwordHash });
    return { id: customer.id, name: customer.name, email: customer.email };
  }
  async login(input: { email: string; password: string }) {
    const customer = await repo.findByEmail(input.email);
    if (!customer || !(await bcrypt.compare(input.password, customer.passwordHash))) throw new AppError("E-mail ou senha inválidos.", 401);
    const token = jwt.sign({ sub: customer.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    return { token, customer: { id: customer.id, name: customer.name, email: customer.email } };
  }
}
