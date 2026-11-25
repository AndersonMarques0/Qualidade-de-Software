import { Region } from "../enums.js";
import { AppError } from "../errors/app-error.js";

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const VALID_STATES = new Set<string>(BRAZILIAN_STATES);
const SOUTHEAST_STATES = new Set(["SP", "RJ", "MG", "ES"]);

const STATE_NAME_TO_UF: Record<string, string> = {
  ACRE: "AC",
  "ALAGOAS": "AL",
  "AMAPA": "AP",
  AMAZONAS: "AM",
  BAHIA: "BA",
  CEARA: "CE",
  "DISTRITO FEDERAL": "DF",
  "ESPIRITO SANTO": "ES",
  GOIAS: "GO",
  MARANHAO: "MA",
  "MATO GROSSO": "MT",
  "MATO GROSSO DO SUL": "MS",
  "MINAS GERAIS": "MG",
  PARA: "PA",
  "PARAIBA": "PB",
  PARANA: "PR",
  PERNAMBUCO: "PE",
  PIAUI: "PI",
  "RIO DE JANEIRO": "RJ",
  "RIO GRANDE DO NORTE": "RN",
  "RIO GRANDE DO SUL": "RS",
  RONDONIA: "RO",
  RORAIMA: "RR",
  "SANTA CATARINA": "SC",
  "SAO PAULO": "SP",
  SERGIPE: "SE",
  TOCANTINS: "TO",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

/** Aceita a UF ou o nome completo do estado e retorna a UF normalizada. */
export function normalizeBrazilianState(state: string): string | null {
  const normalized = normalizeText(state);

  if (VALID_STATES.has(normalized)) return normalized;
  return STATE_NAME_TO_UF[normalized] ?? null;
}

// A região do frete é definida pelo estado (UF ou nome completo) do endereço.
export function getRegionByState(state: string): Region {
  const uf = normalizeBrazilianState(state);

  if (!uf) {
    throw new AppError("Estado de entrega inválido.", 400);
  }

  return SOUTHEAST_STATES.has(uf) ? Region.SOUTHEAST : Region.OTHER;
}
