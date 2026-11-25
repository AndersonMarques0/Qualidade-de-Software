import { z } from "zod";
import { PaymentMethod, Region } from "../domain/enums.js";
import { BRAZILIAN_STATES } from "../domain/services/region.service.js";

const stateSchema = z
  .string()
  .trim()
  .transform((state) => state.toUpperCase())
  .pipe(z.enum(BRAZILIAN_STATES));

const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}-?\d{3}$/, "CEP inválido.");

// Informe a UF de entrega ou, por compatibilidade, a região.
export const previewOrderSchema = z
  .object({
    region: z.enum(Region).optional(),
    state: stateSchema.optional(),
  })
  .refine((value) => Boolean(value.region || value.state), {
    message: "Informe state (UF) ou region.",
  });

export const checkoutSchema = z.object({
  region: z.enum(Region).optional(),
  paymentMethod: z.enum(PaymentMethod),
  cardId: z.string().optional(),
  deliveryAddress: z.object({
    postalCode: postalCodeSchema,
    street: z.string().trim().min(2),
    number: z.string().trim().min(1),
    complement: z.string().trim().optional(),
    neighborhood: z.string().trim().min(2),
    city: z.string().trim().min(2),
    state: stateSchema,
  }),
});

export const idempotencyKeySchema = z.string().trim().min(16).max(128);
