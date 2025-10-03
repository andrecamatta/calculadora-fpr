/**
 * Orquestrador Principal - Dependency Inversion Principle
 * Coordena todas as calculadoras e retorna resultado completo
 */

import { FPRInputs, FPRResult } from "../types";
import { computeFPRBase } from "./fpr-base";
import { calculateEAD } from "./ead-calculator";
import {
  calculateMitigatedExposureMultiple,
  getHaircutDescription,
} from "./haircut-calculator";
import { applyAllAdjustments } from "./adjustments";

/**
 * Calcula FPR completo com todos os ajustes e mitigadores
 * Esta é a função principal que deve ser chamada pela UI
 */
export function calculateFPRComplete(inputs: FPRInputs): FPRResult {
  const steps: string[] = [];

  // 1. Calcula FPR base por classe de ativo/contraparte
  const baseResult = computeFPRBase(inputs, steps);
  let fpr = baseResult.fpr;

  // 2. Aplica ajustes (cambial, CRM, pisos)
  fpr = applyAllAdjustments(fpr, baseResult.classe, inputs, steps);

  // 3. Calcula EAD (se informações disponíveis)
  const eadResult = calculateEAD(inputs);

  let eadFinal: number | undefined;
  let eadAjustado: number | undefined;
  let rwacpad: number | undefined;

  if (eadResult) {
    eadFinal = eadResult.ead;

    // Adiciona passos de EAD
    steps.push("📊 Cálculo de EAD:");
    steps.push(...eadResult.steps);

    // 4. Aplica haircuts se houver colaterais
    if (inputs.crm.colaterais && inputs.crm.colaterais.length > 0) {
      const haircutResult = calculateMitigatedExposureMultiple(
        eadResult.ead,
        inputs.crm.colaterais,
        inputs.moedaExposicao
      );

      eadAjustado = haircutResult.valorAjustado;

      const haircutDesc = getHaircutDescription(haircutResult);
      if (haircutDesc.length > 0) {
        steps.push("🛡️ Mitigação por colaterais:");
        steps.push(...haircutDesc);
        steps.push(
          `EAD ajustado: ${eadAjustado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        );
      }
    } else {
      eadAjustado = eadFinal;
    }

    // 5. Calcula RWACPAD = EAD × FPR
    rwacpad = (eadAjustado * fpr) / 100;

    steps.push("💰 RWACPAD:");
    steps.push(
      `RWACPAD = EAD × FPR = ${eadAjustado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} × ${fpr.toFixed(1)}% = ${rwacpad.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    );
  }

  return {
    fpr,
    fprBase: baseResult.fpr,
    classe: baseResult.classe,
    steps,
    ead: eadFinal,
    eadAjustado,
    rwacpad,
  };
}

// Re-exporta funções específicas para uso avançado
export { computeFPRBase } from "./fpr-base";
export { calculateEAD } from "./ead-calculator";
export {
  calculateMitigatedExposure,
  calculateMitigatedExposureMultiple,
} from "./haircut-calculator";
export {
  applyCurrencyMismatchAdjustment,
  applyCRMSubstitution,
  applyFloors,
} from "./adjustments";
