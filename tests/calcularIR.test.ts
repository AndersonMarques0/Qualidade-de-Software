import { describe, expect, it } from "vitest";
import { calcularIR } from "../src/impostoderenda.ts";

describe("calcularIR - partições de equivalência", () => {
  it("C2: deve conceder isenção total até R$ 5.000", () => {
    const resultado = calcularIR(4000);

    expect(resultado.faixa).toBe("Isenção total");
    expect(resultado.descontoPercentual).toBe(100);
    expect(resultado.impostoDevido).toBe(0);
  });

  it("C3: deve aplicar desconto de 75%", () => {
    const resultado = calcularIR(5200, 1000);

    expect(resultado.descontoPercentual).toBe(75);
    expect(resultado.impostoDevido).toBe(250);
  });

  it("C4: deve aplicar desconto de 50%", () => {
    const resultado = calcularIR(5800, 1000);

    expect(resultado.descontoPercentual).toBe(50);
    expect(resultado.impostoDevido).toBe(500);
  });

  it("C5: deve aplicar desconto de 25%", () => {
    const resultado = calcularIR(6200, 1000);

    expect(resultado.descontoPercentual).toBe(25);
    expect(resultado.impostoDevido).toBe(750);
  });

  it("C6: deve aplicar desconto de 10%", () => {
    const resultado = calcularIR(7000, 1000);

    expect(resultado.descontoPercentual).toBe(10);
    expect(resultado.impostoDevido).toBe(900);
  });

  it("C7: deve aplicar a regra didática de 27,5%", () => {
    const resultado = calcularIR(8000);

    expect(resultado.descontoPercentual).toBe(0);
    expect(resultado.impostoDevido).toBe(2200);
  });
});

describe("calcularIR - análise de valor limite", () => {
  it.each([
    [4999.99, "Isenção total", 100],
    [5000.00, "Isenção total", 100],
    [5000.01, "Até R$ 5.500,00", 75],

    [5499.99, "Até R$ 5.500,00", 75],
    [5500.00, "Até R$ 5.500,00", 75],
    [5500.01, "Até R$ 6.000,00", 50],

    [5999.99, "Até R$ 6.000,00", 50],
    [6000.00, "Até R$ 6.000,00", 50],
    [6000.01, "Até R$ 6.500,00", 25],

    [6499.99, "Até R$ 6.500,00", 25],
    [6500.00, "Até R$ 6.500,00", 25],
    [6500.01, "Até R$ 7.350,00", 10],

    [7349.99, "Até R$ 7.350,00", 10],
    [7350.00, "Até R$ 7.350,00", 10],
    [7350.01, "Acima de R$ 7.350,00", 0],
  ])(
    "rendimento %s: faixa e desconto corretos",
    (rendimento, faixaEsperada, descontoEsperado) => {
      const resultado = calcularIR(rendimento, 1000);

      expect(resultado.faixa).toBe(faixaEsperada);
      expect(resultado.descontoPercentual).toBe(
        descontoEsperado,
      );
    },
  );

  it("deve aceitar rendimento zero", () => {
    expect(calcularIR(0).impostoDevido).toBe(0);
  });

  it("deve aceitar o rendimento mínimo positivo", () => {
    expect(calcularIR(0.01).faixa).toBe("Isenção total");
  });
});

describe("calcularIR - entradas inválidas", () => {
  it.each([
    [NaN, 0],
    [Infinity, 0],
    [-1, 0],
    [5000, NaN],
    [5000, Infinity],
    [5000, -1],
  ])(
    "deve rejeitar rendimento=%s e imposto=%s",
    (rendimento, imposto) => {
      expect(() => calcularIR(rendimento, imposto)).toThrow(
        "Informe valores numéricos válidos e não negativos.",
      );
    },
  );
});

describe("calcularIR - caminhos do GFC", () => {
  it("P1: percorre o caminho de erro", () => {
    expect(() => calcularIR(-1)).toThrow();
  });

  it("P2: percorre o caminho de isenção", () => {
    expect(calcularIR(5000).impostoDevido).toBe(0);
  });

  it("P3: percorre o caminho do desconto de 75%", () => {
    expect(calcularIR(5200, 1000).impostoDevido).toBe(250);
  });

  it("P4: percorre o caminho do desconto de 50%", () => {
    expect(calcularIR(5800, 1000).impostoDevido).toBe(500);
  });

  it("P5: percorre o caminho do desconto de 25%", () => {
    expect(calcularIR(6200, 1000).impostoDevido).toBe(750);
  });

  it("P6: percorre o caminho do desconto de 10%", () => {
    expect(calcularIR(7000, 1000).impostoDevido).toBe(900);
  });

  it("P7: percorre o caminho da alíquota de 27,5%", () => {
    expect(calcularIR(8000).impostoDevido).toBe(2200);
  });
});
