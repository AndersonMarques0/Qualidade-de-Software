import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { CustomerProfile, Region } from "../../src/domain/enums.js";
import { OrderService } from "../../src/services/order.service.js";
import {
  createBook,
  createCartItem,
  createCustomer,
} from "../helpers.js";

const NOW = new Date("2026-11-23T12:00:00.000Z");

async function previewForCustomerCreatedAt(createdAt: Date) {
  const { customer } = await createCustomer(createdAt);
  const book = await createBook(100, 10);
  await createCartItem(customer.id, book.id, 1);

  return new OrderService().preview(customer.id, Region.SOUTHEAST, NOW);
}

describe("CT04–CT07 — classificação do cliente na prévia do pedido", () => {
  it.each([
    ["CT04 / 10 meses", "2026-01-23T12:00:00.000Z", CustomerProfile.NONE, 0],
    ["CT05 / 1 ano", "2025-11-23T12:00:00.000Z", CustomerProfile.BRONZE, 0.03],
    ["CT05 / 1 ano e 5 meses", "2025-06-23T12:00:00.000Z", CustomerProfile.BRONZE, 0.03],
    ["CT05 / 2 anos e 11 meses", "2023-12-23T12:00:00.000Z", CustomerProfile.BRONZE, 0.03],
    ["CT06 / 3 anos", "2023-11-23T12:00:00.000Z", CustomerProfile.SILVER, 0.05],
    ["CT06 / 4 anos", "2022-11-23T12:00:00.000Z", CustomerProfile.SILVER, 0.05],
    ["CT06 LSV / exatamente 5 anos", "2021-11-23T12:00:00.000Z", CustomerProfile.SILVER, 0.05],
    ["CT07 / 7 anos", "2019-11-23T12:00:00.000Z", CustomerProfile.GOLD, 0.1],
    ["CT07 / 9 anos", "2017-11-23T12:00:00.000Z", CustomerProfile.GOLD, 0.1],
  ] as const)("%s: a prévia deve aplicar o perfil e desconto corretos", async (_label, createdAt, profile, discountRate) => {
    const preview = await previewForCustomerCreatedAt(new Date(createdAt));

    expect(preview.profile).toBe(profile);
    expect(preview.discountRate).toBe(discountRate);
    expect(preview.discount).toBe(100 * discountRate);
  });

  it("limites de 1, 3 e 5 anos são classificados sem sobreposição", async () => {
    const oneYearMinusOneDay = await previewForCustomerCreatedAt(
      new Date("2025-11-24T12:00:00.000Z"),
    );
    const threeYearsMinusOneDay = await previewForCustomerCreatedAt(
      new Date("2023-11-24T12:00:00.000Z"),
    );
    const fiveYearsPlusOneDay = await previewForCustomerCreatedAt(
      new Date("2021-11-22T12:00:00.000Z"),
    );

    expect(oneYearMinusOneDay.profile).toBe(CustomerProfile.NONE);
    expect(threeYearsMinusOneDay.profile).toBe(CustomerProfile.BRONZE);
    expect(fiveYearsPlusOneDay.profile).toBe(CustomerProfile.GOLD);
  });
});

describe("CT08–CT09 — cálculo do frete pela entrada da API", () => {
  it.each([
    ["São Paulo", 0.05],
    ["Espírito Santo", 0.05],
    ["Minas Gerais", 0.05],
    ["Rio de Janeiro", 0.05],
    ["Pernambuco", 0.1],
    ["Amazonas", 0.1],
    ["Santa Catarina", 0.1],
    ["Amapá", 0.1],
  ] as const)("%s: /orders/preview aplica frete de %s", async (state, expectedRate) => {
    const { customer, token } = await createCustomer();
    const book = await createBook(100, 10);
    await createCartItem(customer.id, book.id, 1);

    const preview = await request(app)
      .post("/api/orders/preview")
      .set("Authorization", `Bearer ${token}`)
      .send({ state })
      .expect(200);

    expect(preview.body.shippingRate).toBe(expectedRate);
    expect(preview.body.shipping).toBe(expectedRate * 100);
  });
});
