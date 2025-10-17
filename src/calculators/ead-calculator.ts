/**
 * Calculadora de EAD (Exposure at Default) - Single Responsibility Principle
 * Responsável pelo cálculo de exposição em caso de inadimplência
 *
 * FCC (Fator de Conversão em Crédito) conforme Res. BCB 229/2022 e Circular BCB 3.809/2016
 */

import { FPRInputs, EADInfo } from "../types";
import { FCC_FACTORS, FCC_VAREJO } from "../constants/fcc-factors";
import { toNumber } from "../utils/formatters";

export interface EADResult {
  ead: number;
  saldoDevedor: number;
  limiteNaoUtilizado: number;
  fcc: number;
  fccAplicado: number;
  steps: string[];
}

/**
 * Determina o Fator de Conversão em Crédito (FCC) apropriado
 * Conforme Art. 13-17 da Circular BCB 3.809/2016
 */
function determineFCC(eadInfo: EADInfo, inputs: FPRInputs): number {
  // Se FCC customizado foi fornecido, usa ele
  if (eadInfo.fccCustom != null && !isNaN(eadInfo.fccCustom)) {
    return eadInfo.fccCustom;
  }

  const { fccTipo } = eadInfo;

  // Varejo pode ter FCC diferenciados
  if (inputs.contraparte === "pf" && inputs.varejo.elegivel) {
    if (inputs.produto === "cartao") {
      return FCC_VAREJO.cartao_revogavel;
    }
    if (inputs.produto === "limite") {
      return FCC_VAREJO.limite_cheque_especial;
    }
  }

  // Usa FCC padrão por tipo
  return FCC_FACTORS[fccTipo] ?? FCC_FACTORS.outro;
}

/**
 * Calcula EAD = Saldo Devedor + (FCC × Limite Não Utilizado)
 * Conforme Art. 6º Res. BCB 229/2022 e Art. 13-17 Circular BCB 3.809/2016
 */
export function calculateEAD(inputs: FPRInputs): EADResult | null {
  if (!inputs.ead) return null;

  const { saldoDevedor, limiteNaoUtilizado } = inputs.ead;
  const steps: string[] = [];

  // Validação
  const saldo = toNumber(saldoDevedor, 0);
  const limite = toNumber(limiteNaoUtilizado, 0);

  if (saldo < 0 || limite < 0) {
    steps.push("⚠️ Valores negativos não são permitidos para EAD");
    return {
      ead: 0,
      saldoDevedor: saldo,
      limiteNaoUtilizado: limite,
      fcc: 0,
      fccAplicado: 0,
      steps,
    };
  }

  // Determina FCC
  const fcc = determineFCC(inputs.ead, inputs);
  const fccAplicado = fcc * limite;

  steps.push(
    `Saldo devedor: ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );
  steps.push(
    `Limite não utilizado: ${limite.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );
  steps.push(`FCC (${inputs.ead.fccTipo}): ${(fcc * 100).toFixed(1)}%`);
  steps.push(
    `FCC aplicado ao limite: ${fccAplicado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );

  // Fórmula: EAD = Saldo + (FCC × Limite) - Provisão (Art. 6º Res. BCB 229/2022)
  let exposicaoBruta = saldo + fccAplicado;

  steps.push(
    `Exposição bruta = Saldo + (FCC × Limite) = ${exposicaoBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );

  // Calcula provisão automaticamente: Provisão (R$) = Provisão (%) × Saldo Devedor
  // Conforme Art. 6º da Res. BCB 229/2022
  const provisaoPercentual = inputs.inadimplencia.provisaoPercentual;
  const provisaoValor = (provisaoPercentual / 100) * saldo;

  if (provisaoValor > 0) {
    steps.push(
      `Provisão (${provisaoPercentual}% × ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) = ${provisaoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    );
  }

  // EAD = max(0, Exposição - Provisão) conforme Art. 6º §1º
  const ead = Math.max(0, exposicaoBruta - provisaoValor);

  if (provisaoValor > 0) {
    steps.push(
      `EAD = max(0, Exposição - Provisão) = max(0, ${exposicaoBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} - ${provisaoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) = ${ead.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    );
  } else {
    steps.push(
      `EAD = ${ead.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (sem provisão dedutível)`
    );
  }

  return {
    ead,
    saldoDevedor: saldo,
    limiteNaoUtilizado: limite,
    fcc,
    fccAplicado,
    steps,
  };
}

/**
 * Calcula EAD ajustado após aplicação de mitigadores
 */
export function calculateAdjustedEAD(
  eadResult: EADResult,
  haircutAdjustment: number
): number {
  // EAD ajustado = EAD × (1 - fator de mitigação)
  // Fator de mitigação vem da calculadora de haircuts
  return Math.max(0, eadResult.ead * (1 - haircutAdjustment));
}

/**
 * Informações descritivas sobre FCC por tipo
 */
export function getFCCDescription(fccTipo: string): string {
  const descriptions: Record<string, string> = {
    linha_irrevogavel:
      "Linha de crédito irrevogável (não pode ser cancelada unilateralmente) - FCC 50%",
    linha_revogavel:
      "Linha de crédito revogável (pode ser cancelada unilateralmente) - FCC 10%",
    garantia_prestada: "Garantia prestada (aval, fiança) - FCC 100%",
    comercio_exterior:
      "Operação de comércio exterior com prazo ≤ 1 ano - FCC 20%",
    outro: "Outras exposições off-balance - FCC 100% (conservador)",
  };

  return descriptions[fccTipo] || descriptions.outro;
}
