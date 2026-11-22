import { z } from "zod";

export const createCardSchema = z.object({
  bankId: z.string().min(1),
  holderName: z.string().trim().min(2).max(80),
  // Número FICTÍCIO de 16 dígitos. Só os 4 últimos são guardados.
  number: z.string().regex(/^\d{16}$/, "Informe 16 dígitos."),
  creditLimit: z.number().positive(),
});
