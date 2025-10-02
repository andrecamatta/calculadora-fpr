/**
 * Calculadora de Haircuts (Ajustes de Volatilidade) - Single Responsibility Principle
 * Responsável pelo cálculo de ajustes em colaterais financeiros (Circular BCB 3.809)
 */

import { FPRInputs, ColateralInfo, HaircutResult, Moeda } from "../types";
import {
  HAIRCUT_COLATERAL,
  HAIRCUT_EXPOSICAO,
  HAIRCUT_CAMBIAL,
} from "../constants/haircuts";

/**
 * Calcula haircut de colateral (Hc)
 */
function calculateHc(colateral: ColateralInfo): number {
  return HAIRCUT_COLATERAL[colateral.tipo] ?? HAIRCUT_COLATERAL.outro;
}

/**
 * Calcula haircut de exposição (He)
 * Normalmente 0% se não há descasamento de prazo
 */
function calculateHe(hasDescasamentoPrazo: boolean = false): number {
  return hasDescasamentoPrazo ? HAIRCUT_EXPOSICAO.descasamento : HAIRCUT_EXPOSICAO.default;
}

/**
 * Calcula haircut cambial (Hfx)
 * 8% se há descasamento entre moeda da exposição e moeda do colateral
 */
function calculateHfx(moedaExposicao: Moeda, moedaColateral: Moeda): number {
  if (moedaExposicao === moedaColateral) {
    return HAIRCUT_CAMBIAL.semDescasamento;
  }
  return HAIRCUT_CAMBIAL.comDescasamento;
}

/**
 * Calcula exposição mitigada usando abordagem abrangente (Comprehensive Approach)
 * E* = max(0, E × (1 + He) - C × (1 - Hc - Hfx))
 *
 * Onde:
 * E = Valor da exposição
 * C = Valor do colateral
 * He = Haircut de exposição
 * Hc = Haircut de colateral
 * Hfx = Haircut cambial
 */
export function calculateMitigatedExposure(
  exposicao: number,
  colateral: ColateralInfo,
  moedaExposicao: Moeda,
  hasDescasamentoPrazo: boolean = false
): HaircutResult {
  const He = calculateHe(hasDescasamentoPrazo);
  const Hc = calculateHc(colateral);
  const Hfx = calculateHfx(moedaExposicao, colateral.moeda);

  // E* = max(0, E × (1 + He) - C × (1 - Hc - Hfx))
  const exposicaoAjustada = exposicao * (1 + He);
  const colateralAjustado = colateral.valor * (1 - Hc - Hfx);
  const valorAjustado = Math.max(0, exposicaoAjustada - colateralAjustado);

  return {
    He,
    Hc,
    Hfx,
    valorAjustado,
  };
}

/**
 * Calcula exposição mitigada com múltiplos colaterais
 */
export function calculateMitigatedExposureMultiple(
  exposicao: number,
  colaterais: ColateralInfo[],
  moedaExposicao: Moeda,
  hasDescasamentoPrazo: boolean = false
): HaircutResult {
  if (!colaterais || colaterais.length === 0) {
    return {
      He: 0,
      Hc: 0,
      Hfx: 0,
      valorAjustado: exposicao,
    };
  }

  const He = calculateHe(hasDescasamentoPrazo);

  // Soma dos colaterais ajustados
  let totalColateralAjustado = 0;
  let maxHc = 0;
  let maxHfx = 0;

  for (const colateral of colaterais) {
    const Hc = calculateHc(colateral);
    const Hfx = calculateHfx(moedaExposicao, colateral.moeda);

    totalColateralAjustado += colateral.valor * (1 - Hc - Hfx);

    // Guarda os maiores haircuts para referência
    maxHc = Math.max(maxHc, Hc);
    maxHfx = Math.max(maxHfx, Hfx);
  }

  const exposicaoAjustada = exposicao * (1 + He);
  const valorAjustado = Math.max(0, exposicaoAjustada - totalColateralAjustado);

  return {
    He,
    Hc: maxHc,
    Hfx: maxHfx,
    valorAjustado,
  };
}

/**
 * Calcula fator de mitigação percentual para aplicar no EAD
 * Retorna um valor entre 0 e 1 representando quanto da exposição foi mitigada
 */
export function calculateMitigationFactor(
  exposicao: number,
  haircutResult: HaircutResult
): number {
  if (exposicao <= 0) return 0;

  const mitigado = exposicao - haircutResult.valorAjustado;
  return Math.min(1, Math.max(0, mitigado / exposicao));
}

/**
 * Aplica abordagem simples (Simple Approach) - substitui FPR do colateral
 * Usado quando o colateral é elegível e cumpre requisitos mínimos
 */
export function applySimpleApproach(
  fprExposicao: number,
  fprColateral: number,
  percentualCobertura: number
): number {
  // A parte coberta usa FPR do colateral, a parte não coberta usa FPR da exposição
  const parteCoberta = percentualCobertura * fprColateral;
  const parteNaoCoberta = (1 - percentualCobertura) * fprExposicao;

  return parteCoberta + parteNaoCoberta;
}

/**
 * Valida elegibilidade de colateral para CRM
 */
export function isColateralElegivel(colateral: ColateralInfo): boolean {
  // Tipos sempre elegíveis
  const tiposElegiveis = [
    "deposito_vista",
    "deposito_poupanca",
    "ouro",
    "titulo_publico",
  ];

  return tiposElegiveis.includes(colateral.tipo);
}

/**
 * Descrição textual dos ajustes aplicados
 */
export function getHaircutDescription(result: HaircutResult): string[] {
  const desc: string[] = [];

  if (result.He > 0) {
    desc.push(`Haircut de exposição (He): ${(result.He * 100).toFixed(1)}%`);
  }
  if (result.Hc > 0) {
    desc.push(`Haircut de colateral (Hc): ${(result.Hc * 100).toFixed(1)}%`);
  }
  if (result.Hfx > 0) {
    desc.push(`Haircut cambial (Hfx): ${(result.Hfx * 100).toFixed(1)}%`);
  }

  return desc;
}
