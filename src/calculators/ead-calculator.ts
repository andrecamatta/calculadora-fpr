/**
 * Calculadora de EAD (Exposure at Default) - Single Responsibility Principle
 * Responsável pelo cálculo de exposição em caso de inadimplência
 */

import { FPRInputs, EADInfo } from "../types";
import { CCF_FACTORS, CCF_VAREJO } from "../constants/ccf-factors";
import { toNumber } from "../utils/formatters";

export interface EADResult {
  ead: number;
  saldoDevedor: number;
  limiteNaoUtilizado: number;
  ccf: number;
  ccfAplicado: number;
  steps: string[];
}

/**
 * Determina o fator de conversão de crédito (CCF) apropriado
 */
function determineCCF(eadInfo: EADInfo, inputs: FPRInputs): number {
  // Se CCF customizado foi fornecido, usa ele
  if (eadInfo.ccfCustom != null && !isNaN(eadInfo.ccfCustom)) {
    return eadInfo.ccfCustom;
  }

  const { ccfTipo } = eadInfo;

  // Varejo pode ter CCF diferenciados
  if (inputs.contraparte === "pf" && inputs.varejo.elegivel) {
    if (inputs.produto === "cartao") {
      return CCF_VAREJO.cartao_revogavel;
    }
    if (inputs.produto === "limite") {
      return CCF_VAREJO.limite_cheque_especial;
    }
  }

  // Usa CCF padrão por tipo
  return CCF_FACTORS[ccfTipo] ?? CCF_FACTORS.outro;
}

/**
 * Calcula EAD = Saldo Devedor + (CCF × Limite Não Utilizado)
 * Conforme Art. 13-17 da Circular BCB 3.809
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
      ccf: 0,
      ccfAplicado: 0,
      steps,
    };
  }

  // Determina CCF
  const ccf = determineCCF(inputs.ead, inputs);
  const ccfAplicado = ccf * limite;

  steps.push(
    `Saldo devedor: ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );
  steps.push(
    `Limite não utilizado: ${limite.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );
  steps.push(`CCF (${inputs.ead.ccfTipo}): ${(ccf * 100).toFixed(1)}%`);
  steps.push(
    `CCF aplicado ao limite: ${ccfAplicado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );

  // Fórmula: EAD = Saldo + (CCF × Limite)
  const ead = saldo + ccfAplicado;

  steps.push(
    `EAD = Saldo + (CCF × Limite) = ${ead.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );

  return {
    ead,
    saldoDevedor: saldo,
    limiteNaoUtilizado: limite,
    ccf,
    ccfAplicado,
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
 * Informações descritivas sobre CCF por tipo
 */
export function getCCFDescription(ccfTipo: string): string {
  const descriptions: Record<string, string> = {
    linha_irrevogavel:
      "Linha de crédito irrevogável (não pode ser cancelada unilateralmente) - CCF 50%",
    linha_revogavel:
      "Linha de crédito revogável (pode ser cancelada unilateralmente) - CCF 10%",
    garantia_prestada: "Garantia prestada (aval, fiança) - CCF 100%",
    comercio_exterior:
      "Operação de comércio exterior com prazo ≤ 1 ano - CCF 20%",
    outro: "Outras exposições off-balance - CCF 100% (conservador)",
  };

  return descriptions[ccfTipo] || descriptions.outro;
}
