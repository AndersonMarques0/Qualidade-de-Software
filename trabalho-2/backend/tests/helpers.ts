import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../src/config/env.js";
import { AccountModel } from "../src/models/account.model.js";
import { BankModel } from "../src/models/bank.model.js";
import { BookModel } from "../src/models/book.model.js";
import { CardModel } from "../src/models/card.model.js";
import { CartModel } from "../src/models/cart.model.js";
import { CustomerModel } from "../src/models/customer.model.js";

export async function createCustomer(createdAt = new Date()) {
  const customer = await CustomerModel.create({
    name: "Cliente de Teste",
    email: `cliente-${randomUUID()}@example.test`,
    passwordHash: "hash-apenas-para-testes",
    createdAt,
  });

  const token = jwt.sign({ sub: customer.id }, env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return { customer, token };
}

export async function createBook(
  price = 10,
  stock = 50,
) {
  return BookModel.create({
    title: "Livro para Teste",
    author: "Autor de Teste",
    price,
    stock,
  });
}

export async function createCartItem(
  customerId: string,
  bookId: string,
  quantity: number,
) {
  return CartModel.create({
    customerId: new Types.ObjectId(customerId),
    items: [{ bookId: new Types.ObjectId(bookId), quantity }],
  });
}

export async function createAccount(customerId: string, balance: number) {
  return AccountModel.create({
    customerId: new Types.ObjectId(customerId),
    balanceCents: Math.round(balance * 100),
  });
}

export async function createCard(customerId: string) {
  const bank = await BankModel.create({
    name: "Banco de Teste",
    code: `TEST-${randomUUID()}`,
  });

  const card = await CardModel.create({
    customerId: new Types.ObjectId(customerId),
    bankId: bank._id,
    holderName: "CLIENTE DE TESTE",
    last4: "4242",
  });

  return card;
}

export const deliveryAddress = {
  postalCode: "01001-000",
  street: "Praça da Sé",
  number: "100",
  neighborhood: "Sé",
  city: "São Paulo",
  state: "SP",
};

export function idempotencyKey(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}
