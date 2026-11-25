import { z } from "zod";

export const createBankSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(10),
});

// Valor em reais com no máximo 2 casas decimais.
export const depositSchema = z.object({
  amount: z
    .number()
    .positive()
    .max(1_000_000)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
      "Use no máximo 2 casas decimais.",
    ),
});
