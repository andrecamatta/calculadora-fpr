/**
 * Fatores de Haircut (Ajustes de Volatilidade) - Circular BCB 3.809
 * Para ajuste de colaterais financeiros
 */

import { ColateralTipo } from "../types";

// Haircut de colateral (Hc) - Art. 22 Circ. 3.809
export const HAIRCUT_COLATERAL: Record<ColateralTipo, number> = {
  // Depósitos à vista / poupança / ouro na própria IF
  deposito_vista: 0.0, // 0%
  deposito_poupanca: 0.0, // 0%
  ouro: 0.0, // 0%

  // Títulos públicos federais
  titulo_publico: 0.0, // 0% (títulos soberanos em moeda local)

  // Títulos privados sênior
  titulo_privado: 0.25, // 25%

  // Outros colaterais
  outro: 0.3, // 30% (conservador)
};

// Haircut de exposição (He) - Art. 23 Circ. 3.809
// Aplica-se à exposição quando há descasamento de prazo
export const HAIRCUT_EXPOSICAO = {
  default: 0.0, // Normalmente 0% se prazos casam
  descasamento: 0.3, // 30% para outros ativos
};

// Haircut de câmbio (Hfx) - Art. 24 Circ. 3.809
export const HAIRCUT_CAMBIAL = {
  semDescasamento: 0.0, // 0%
  comDescasamento: 0.08, // 8%
};

// Tabela completa de haircuts por tipo de ativo e prazo
// (Simplificada - versão completa depende de prazo residual e volatilidade)
export const HAIRCUT_TABLE = {
  // Ativos com haircut 0%
  zero: {
    depositoVista: 0.0,
    tituloPublicoFederal: 0.0,
    ouro: 0.0,
  },

  // Títulos de dívida corporativa por rating
  corporativo: {
    AAA_AA: 0.02, // 2%
    A_BBB: 0.04, // 4%
    BB: 0.15, // 15%
    abaixoBB: 0.25, // 25%
  },

  // Ações e fundos
  acoes: {
    indiceAmplo: 0.15, // 15%
    individual: 0.25, // 25%
  },

  // Ajuste por prazo (multiplicador adicional)
  prazos: {
    ate1mes: 1.0,
    ate3meses: 1.2,
    ate6meses: 1.4,
    ate1ano: 1.6,
    mais1ano: 2.0,
  },
} as const;

// Fórmula para cálculo de exposição mitigada
// E* = max(0, E × (1 + He) - C × (1 - Hc - Hfx))
// Onde:
// E = Valor da exposição
// C = Valor do colateral
// He = Haircut de exposição
// Hc = Haircut de colateral
// Hfx = Haircut cambial
