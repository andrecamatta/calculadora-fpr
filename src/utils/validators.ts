/**
 * Utilitários de Validação (DRY)
 * Funções reutilizáveis para validação de dados
 */

import { FPRInputs } from "../types";
import { VAREJO_FPR } from "../constants/fpr-rates";

/**
 * Valida se LTV está dentro de limites razoáveis
 */
export const isValidLTV = (ltv: number): boolean => {
  return ltv >= 0 && ltv <= 200;
};

/**
 * Valida se FPR está dentro dos limites regulatórios
 */
export const isValidFPR = (fpr: number): boolean => {
  return fpr >= 0 && fpr <= 1250;
};

/**
 * Verifica se exposição é elegível para varejo
 * (Total com mesmo cliente ≤ R$ 5MM - atualização 2024)
 */
export const isElegivelVarejo = (
  totalExposicao: number,
  inputs: FPRInputs
): boolean => {
  if (inputs.contraparte !== "pf") return false;
  if (!inputs.varejo.elegivel) return false;
  return totalExposicao <= VAREJO_FPR.limiteMaximo;
};

/**
 * Verifica se há descasamento cambial
 */
export const hasDescasamentoCambial = (inputs: FPRInputs): boolean => {
  return (
    inputs.moedaExposicao !== inputs.moedaRenda &&
    !inputs.hedge90
  );
};

/**
 * Verifica se descasamento cambial é aplicável para ajuste FPR
 * (Somente varejo e imobiliário residencial)
 */
export const isDescasamentoCambialAplicavel = (
  inputs: FPRInputs,
  classe: string
): boolean => {
  if (!hasDescasamentoCambial(inputs)) return false;

  const classesAplicaveis = [
    "varejo",
    "varejo_transactor",
    "imob_res",
    "imob_res_dep",
  ];

  return classesAplicaveis.includes(classe);
};

/**
 * Valida completude de dados para cálculo de EAD
 */
export const canCalculateEAD = (inputs: FPRInputs): boolean => {
  if (!inputs.ead) return false;
  const { saldoDevedor, limiteNaoUtilizado } = inputs.ead;
  return (
    typeof saldoDevedor === "number" &&
    typeof limiteNaoUtilizado === "number" &&
    !isNaN(saldoDevedor) &&
    !isNaN(limiteNaoUtilizado)
  );
};
