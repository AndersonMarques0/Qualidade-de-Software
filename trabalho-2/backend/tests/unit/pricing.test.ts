import { describe, expect, it } from "vitest";
import { CustomerProfile, Region } from "../../src/domain/enums.js";
import {
  calculatePricing,
  getCustomerProfile,
  yearsSince,
} from "../../src/domain/services/pricing.service.js";
import { getRegionByState } from "../../src/domain/services/region.service.js";

const NOW = new Date("2026-11-23T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function createdDaysAgo(days: number) {
  return new Date(NOW.getTime() - days * DAY);
}

function expectProfile(
  createdAt: Date,
  profile: CustomerProfile,
  rate: number,
) {
  const years = yearsSince(createdAt, NOW);
  const result = getCustomerProfile(years);

  expect(result.profile).toBe(profile);
  expect(result.discountRate).toBe(rate);
}

describe("CT04–CT07 — tempo de vínculo com a loja", () => {
  it("CT04 — menos de 1 ano: perfil sem classificação e desconto de 0%", () => {
    const inputs = [
      new Date("2026-10-23T12:00:00.000Z"), // 1 mês
      new Date("2026-06-23T12:00:00.000Z"), // 5 meses
      new Date("2026-01-23T12:00:00.000Z"), // 10 meses
      NOW,
      createdDaysAgo(1), // 1 dia
      createdDaysAgo(364), // 364 dias
    ];

    for (const createdAt of inputs) {
      expectProfile(createdAt, CustomerProfile.NONE, 0);
    }

    expectProfile(
      new Date("2025-11-23T12:00:00.000Z"),
      CustomerProfile.BRONZE,
      0.03,
    );
  });

  it("CT05 — de 1 ano até antes de 3 anos: perfil Bronze e desconto de 3%", () => {
    const bronzeDates = [
      new Date("2025-11-23T12:00:00.000Z"), // 1 ano
      new Date("2025-06-23T12:00:00.000Z"), // 1 ano e 5 meses
      new Date("2023-12-23T12:00:00.000Z"), // 2 anos e 11 meses
    ];

    for (const createdAt of bronzeDates) {
      expectProfile(createdAt, CustomerProfile.BRONZE, 0.03);
    }

    expectProfile(createdDaysAgo(364), CustomerProfile.NONE, 0);
    expectProfile(
      new Date("2023-11-23T12:00:00.000Z"),
      CustomerProfile.SILVER,
      0.05,
    );
  });

  it("CT06 — de 3 até 5 anos, inclusive: perfil Prata e desconto de 5%", () => {
    const silverDates = [
      new Date("2023-11-23T12:00:00.000Z"), // 3 anos
      new Date("2022-11-23T12:00:00.000Z"), // 4 anos
      new Date("2021-11-23T12:00:00.000Z"), // 5 anos
    ];

    for (const createdAt of silverDates) {
      expectProfile(createdAt, CustomerProfile.SILVER, 0.05);
    }

    expectProfile(
      new Date("2023-11-24T12:00:00.000Z"),
      CustomerProfile.BRONZE,
      0.03,
    );
    expectProfile(
      new Date("2021-11-22T12:00:00.000Z"),
      CustomerProfile.GOLD,
      0.1,
    );
  });

  it("CT07 — acima de 5 anos: perfil Ouro e desconto de 10%", () => {
    const goldDates = [
      new Date("2021-11-22T12:00:00.000Z"), // 5 anos e 1 dia
      new Date("2019-11-23T12:00:00.000Z"), // 7 anos
      new Date("2017-11-23T12:00:00.000Z"), // 9 anos
      new Date("1996-11-23T12:00:00.000Z"), // 30 anos
    ];

    for (const createdAt of goldDates) {
      expectProfile(createdAt, CustomerProfile.GOLD, 0.1);
    }

    expectProfile(
      new Date("2021-11-23T12:00:00.000Z"),
      CustomerProfile.SILVER,
      0.05,
    );
  });

  it("calcula desconto, frete e total corretamente para subtotal de R$ 100", () => {
    const bronze = calculatePricing({
      subtotal: 100,
      yearsAsCustomer: 1,
      region: Region.SOUTHEAST,
    });

    expect(bronze.discount).toBe(3);
    expect(bronze.shipping).toBe(5);
    expect(bronze.total).toBe(102);
  });
});

describe("CT08–CT09 — região de entrega e frete", () => {
  it.each(["São Paulo", "Espírito Santo", "Minas Gerais", "Rio de Janeiro"])(
    "CT08 — %s deve aplicar frete de 5%",
    (state) => {
      expect(getRegionByState(state)).toBe(Region.SOUTHEAST);
      const result = calculatePricing({
        subtotal: 100,
        yearsAsCustomer: 0,
        region: getRegionByState(state),
      });
      expect(result.shippingRate).toBe(0.05);
      expect(result.shipping).toBe(5);
    },
  );

  it.each(["Pernambuco", "Amazonas", "Santa Catarina", "Amapá"])(
    "CT09 — %s deve aplicar frete de 10%",
    (state) => {
      expect(getRegionByState(state)).toBe(Region.OTHER);
      const result = calculatePricing({
        subtotal: 100,
        yearsAsCustomer: 0,
        region: getRegionByState(state),
      });
      expect(result.shippingRate).toBe(0.1);
      expect(result.shipping).toBe(10);
    },
  );
});
