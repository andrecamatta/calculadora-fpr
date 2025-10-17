/**
 * Ajustes de FPR - Single Responsibility Principle
 * Responsável por aplicar ajustes ao FPR base (cambial, CRM, pisos)
 */

import { FPRInputs } from "../types";
import { AJUSTES, PISOS_FPR } from "../constants/fpr-rates";
import { isDescasamentoCambialAplicavel } from "../utils/validators";
import { clamp } from "../utils/formatters";

/**
 * Aplica ajuste por descasamento cambial
 * Aplicável apenas a varejo e imobiliário residencial
 * Ajuste: min(1.5 × FPR_base, 150%)
 */
export function applyCurrencyMismatchAdjustment(
  fprBase: number,
  classe: string,
  inputs: FPRInputs,
  steps: string[]
): number {
  if (!isDescasamentoCambialAplicavel(inputs, classe)) {
    const { moedaExposicao, moedaRenda, hedge90 } = inputs;
    const mismatch = moedaExposicao !== moedaRenda && !hedge90;

    if (mismatch) {
      steps.push(
        "Descasamento cambial identificado, mas classe não é varejo/residencial ⇒ sem ajuste de FPR (avaliar impacto no risco)"
      );
    }

    return fprBase;
  }

  const fprAjustado = Math.min(
    fprBase * AJUSTES.descasamentoCambialMultiplicador,
    AJUSTES.descasamentoCambialMaximo
  );

  steps.push(
    `Ajuste por descasamento cambial: min(${fprBase}% × 1,5, 150%) = ${fprAjustado.toFixed(1)}%`
  );

  return fprAjustado;
}

/**
 * Aplica mitigador por substituição de garantidor (CRM)
 * Circular BCB 3.809 - substitui FPR pela da garantia
 */
export function applyCRMSubstitution(
  fprCurrent: number,
  inputs: FPRInputs,
  steps: string[]
): number {
  const { crm } = inputs;

  // Substituição por garantidor elegível
  if (crm.substituicaoGarantidor) {
    const fprGarantidor = Number(crm.fprGarantidor);

    if (!isNaN(fprGarantidor)) {
      const fprFinal = clamp(fprGarantidor, PISOS_FPR.minimo, PISOS_FPR.maximo);

      steps.push(
        `CRM - Substituição por garantidor elegível (Circ. 3.809) ⇒ FPR do garantidor: ${fprFinal}%`
      );

      return fprFinal;
    }
  }

  // Seguro de crédito (Res. BCB 324/2023)
  if (crm.seguroCredito) {
    const fprSeguradora = Number(crm.fprSeguradora);

    if (!isNaN(fprSeguradora)) {
      const fprFinal = clamp(fprSeguradora, PISOS_FPR.minimo, PISOS_FPR.maximo);

      steps.push(
        `Seguro de crédito reconhecido (Res. BCB 324/2023) ⇒ FPR da seguradora: ${fprFinal}%`
      );

      return fprFinal;
    } else {
      steps.push(
        "⚠️ Seguro de crédito ativo, mas FPR da seguradora não informado ⇒ sem ajuste aplicado"
      );
    }
  }

  // Netting agreement
  if (crm.nettingAgreement) {
    steps.push(
      "Acordo de netting elegível identificado ⇒ reduz exposição (calculado via SA-CCR/CEM)"
    );
    // Nota: Netting afeta EAD, não FPR diretamente
  }

  return fprCurrent;
}

/**
 * Aplica pisos regulatórios ao FPR
 */
export function applyFloors(
  fprCurrent: number,
  inputs: FPRInputs,
  steps: string[]
): number {
  const { pisos } = inputs;

  // Piso para caixa fora da posse direta
  if (pisos.caixaForaPosseDireta) {
    const fprComPiso = Math.max(fprCurrent, PISOS_FPR.caixaForaPosseDireta);

    if (fprComPiso !== fprCurrent) {
      steps.push(
        `Piso: caixa fora da posse direta ⇒ FPR mínimo ${PISOS_FPR.caixaForaPosseDireta}% aplicado`
      );
      return fprComPiso;
    }
  }

  return fprCurrent;
}

/**
 * Aplica todos os ajustes em sequência
 * Ordem: Base → Cambial → CRM → Pisos → Sanitização
 */
export function applyAllAdjustments(
  fprBase: number,
  classe: string,
  inputs: FPRInputs,
  steps: string[]
): number {
  let fpr = fprBase;

  // 1. Ajuste cambial (se aplicável)
  fpr = applyCurrencyMismatchAdjustment(fpr, classe, inputs, steps);

  // 2. CRM (substituição)
  fpr = applyCRMSubstitution(fpr, inputs, steps);

  // 3. Pisos
  fpr = applyFloors(fpr, inputs, steps);

  // 4. Sanitização (limites regulatórios)
  const fprSanitizado = clamp(fpr, PISOS_FPR.minimo, PISOS_FPR.maximo);

  if (fprSanitizado !== fpr) {
    steps.push(`Sanitização: FPR limitado entre ${PISOS_FPR.minimo}% e ${PISOS_FPR.maximo}%`);
  }

  return fprSanitizado;
}

/**
 * Calcula ajuste específico para consignado > 5 anos
 * Res. BCB - FPR reduzido de 300% para 150%
 */
export function applyConsignadoAdjustment(
  prazoAnos: number,
  steps: string[]
): number {
  if (prazoAnos > 5) {
    steps.push(
      `Consignado com prazo > 5 anos ⇒ FPR ${AJUSTES.consignadoMais5Anos}% (antes 300%)`
    );
    return AJUSTES.consignadoMais5Anos;
  }

  return 100; // FPR padrão para consignado ≤ 5 anos
}
