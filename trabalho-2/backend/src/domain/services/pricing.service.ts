import { CustomerProfile, Region } from "../enums.js";
export interface PricingInput {
  subtotal: number;
  yearsAsCustomer: number;
  region: Region;
}
export interface PricingResult {
  profile: CustomerProfile;
  discountRate: number;
  discount: number;
  shippingRate: number;
  shipping: number;
  total: number;
}
const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
// Tempo de vínculo em anos: anos completos de calendário + fração do ano corrente
// (aniversário -> próximo aniversário). Evita o erro de dividir por 365,25 dias, que
// fazia "1 ano" (365 dias) valer 0,9993 e ficar sem desconto.
export function yearsSince(since: Date, now: Date = new Date()): number {
  if (since.getTime() >= now.getTime()) return 0;
  const anniversary = (n: number) => {
    const date = new Date(since);
    date.setUTCFullYear(since.getUTCFullYear() + n);
    return date.getTime();
  };
  let full = now.getUTCFullYear() - since.getUTCFullYear();
  if (anniversary(full) > now.getTime()) full -= 1;
  const start = anniversary(full);
  const end = anniversary(full + 1);
  return full + (now.getTime() - start) / (end - start);
}
export function getCustomerProfile(years: number): {
  profile: CustomerProfile;
  discountRate: number;
} {
  if (!Number.isFinite(years) || years < 0)
    throw new Error("Tempo de vínculo inválido.");
  if (years < 1) return { profile: CustomerProfile.NONE, discountRate: 0 };
  if (years < 3) return { profile: CustomerProfile.BRONZE, discountRate: 0.03 };
  if (years <= 5)
    return { profile: CustomerProfile.SILVER, discountRate: 0.05 };
  return { profile: CustomerProfile.GOLD, discountRate: 0.1 };
}
export function calculatePricing(input: PricingInput): PricingResult {
  if (!Number.isFinite(input.subtotal) || input.subtotal < 0)
    throw new Error("Subtotal inválido.");
  const { profile, discountRate } = getCustomerProfile(input.yearsAsCustomer);
  const shippingRate = input.region === Region.SOUTHEAST ? 0.05 : 0.1;
  const discount = money(input.subtotal * discountRate);
  const shipping = money(input.subtotal * shippingRate);
  return {
    profile,
    discountRate,
    discount,
    shippingRate,
    shipping,
    total: money(input.subtotal - discount + shipping),
  };
}
