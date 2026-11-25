import "dotenv/config";
import { z } from "zod";
const schema = z.object({
 NODE_ENV:z.enum(["development","test","production"]).default("development"),
 PORT:z.coerce.number().int().positive().default(3333),
 MONGODB_URI:z.string().min(1),
 JWT_SECRET:z.string().min(32),
 JWT_EXPIRES_IN:z.string().default("1d"),
 // Intervalo da rotina que avança/cancela pedidos (ms). Curto = ciclo de vida rápido.
 ORDER_JOB_INTERVAL_MS:z.coerce.number().int().positive().default(5000)
});
export const env = schema.parse(process.env);
