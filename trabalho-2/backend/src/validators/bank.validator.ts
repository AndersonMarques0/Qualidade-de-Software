import { z } from "zod";

export const createBankSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(10),
});
