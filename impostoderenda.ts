type ResultadoIR = {
  rendimentoMensal: number;
  faixa: string;
  descontoPercentual: number;
  impostoDevido: number;
};

function calcularIR(
  rendimentoMensal: number,
  impostoAntesDoDesconto: number = 0,
): ResultadoIR {
  // Validar as entradas
  if (
    !Number.isFinite(rendimentoMensal) ||
    !Number.isFinite(impostoAntesDoDesconto) ||
    rendimentoMensal < 0 ||
    impostoAntesDoDesconto < 0
  ) {
    throw new Error("Informe valores numéricos válidos e não negativos.");
  }

  let faixa: string;
  let descontoPercentual: number;
  let impostoDevido: number;

  if (rendimentoMensal <= 5000) {
    faixa = "Isenção total";
    descontoPercentual = 100;
    impostoDevido = 0;
  } else if (rendimentoMensal <= 5500) {
    faixa = "Até R$ 5.500,00";
    descontoPercentual = 75;
    impostoDevido = impostoAntesDoDesconto * 0.25;
  } else if (rendimentoMensal <= 6000) {
    faixa = "Até R$ 6.000,00";
    descontoPercentual = 50;
    impostoDevido = impostoAntesDoDesconto * 0.50;
  } else if (rendimentoMensal <= 6500) {
    faixa = "Até R$ 6.500,00";
    descontoPercentual = 25;
    impostoDevido = impostoAntesDoDesconto * 0.75;
  } else if (rendimentoMensal <= 7350) {
    faixa = "Até R$ 7.350,00";
    descontoPercentual = 10;
    impostoDevido = impostoAntesDoDesconto * 0.90;
  } else {
    faixa = "Acima de R$ 7.350,00";
    descontoPercentual = 0;
    impostoDevido = rendimentoMensal * 0.275;
  }

  return {
    rendimentoMensal,
    faixa,
    descontoPercentual,
    impostoDevido: Number(impostoDevido.toFixed(2)),
  };
}

export default { calcularIR }
