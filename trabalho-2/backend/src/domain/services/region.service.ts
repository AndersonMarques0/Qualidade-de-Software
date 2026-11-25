import { Region } from "../enums.js";
import { AppError } from "../errors/app-error.js";

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const VALID_STATES = new Set<string>(BRAZILIAN_STATES);
const SOUTHEAST_STATES = new Set(["SP", "RJ", "MG", "ES"]);

// A região do frete é definida pelo estado (UF) do endereço de entrega.
export function getRegionByState(state: string): Region {
  const uf = state.trim().toUpperCase();

  if (!VALID_STATES.has(uf)) {
    throw new AppError("Estado de entrega inválido.", 400);
  }

  return SOUTHEAST_STATES.has(uf) ? Region.SOUTHEAST : Region.OTHER;
}
