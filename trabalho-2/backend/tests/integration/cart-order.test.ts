import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { OrderModel } from "../../src/models/order.model.js";
import { CartModel } from "../../src/models/cart.model.js";
import {
  createAccount,
  createBook,
  createCustomer,
  deliveryAddress,
  idempotencyKey,
} from "../helpers.js";

async function createOrderForQuantity(quantity: number, prefix: string, stock = 25) {
  const { customer, token } = await createCustomer();
  const book = await createBook(10, stock);
  await createAccount(customer.id, 10_000);

  const added = await request(app)
    .post("/api/cart/items")
    .set("Authorization", `Bearer ${token}`)
    .send({ bookId: book.id, quantity })
    .expect(201);

  expect(added.body.items[0].quantity).toBe(quantity);

  const checkout = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${token}`)
    .set("Idempotency-Key", idempotencyKey(prefix))
    .send({ paymentMethod: "PIX", deliveryAddress })
    .expect(201);

  expect(checkout.body.order.paymentStatus).toBe("APPROVED");
  expect(checkout.body.order.items[0].quantity).toBe(quantity);
  expect(await CartModel.findOne({ customerId: customer.id }).then((cart) => cart?.items.length ?? 0)).toBe(0);

  return checkout.body.order;
}

describe("CT01–CT03 — quantidade de livros no carrinho e criação do pedido", () => {
  it("CT01 — quantidade zero ou negativa não permite adicionar item nem criar pedido", async () => {
    const { customer, token } = await createCustomer();
    const book = await createBook(10, 50);

    for (const quantity of [-1, 0, 0.9]) {
      await request(app)
        .post("/api/cart/items")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookId: book.id, quantity })
        .expect(400);
    }

    expect(await CartModel.countDocuments({ customerId: customer.id })).toBe(0);
    expect(await OrderModel.countDocuments({ customerId: customer.id })).toBe(0);
  });

  it("CT02 — exatamente 1 livro permite criar o pedido", async () => {
    const order = await createOrderForQuantity(1, "ct02");
    expect(order.status).toBe("CONFIRMED");
  });

  it.each([2, 3, 10])("CT03 — quantidade %i (> 1) permite criar o pedido", async (quantity) => {
    const order = await createOrderForQuantity(quantity, "ct03");
    expect(order.status).toBe("CONFIRMED");
  });

  it("CT03 — LSV = 25: aceita a quantidade igual ao estoque disponível", async () => {
    const order = await createOrderForQuantity(25, "ct03-lsv", 25);
    expect(order.status).toBe("CONFIRMED");
    expect(order.items[0].quantity).toBe(25);
  });

  it("CT03 — LSI = 30: rejeita quantidade superior ao estoque de 25 livros", async () => {
    const { customer, token } = await createCustomer();
    const book = await createBook(10, 25);

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book.id, quantity: 30 })
      .expect(409);

    expect(await CartModel.countDocuments({ customerId: customer.id })).toBe(0);
    expect(await OrderModel.countDocuments({ customerId: customer.id })).toBe(0);
  });
});
