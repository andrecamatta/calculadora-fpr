/**
 * Fatores de Conversão de Crédito (CCF/FCC) - Circular BCB 3.809
 * Para cálculo de EAD em exposições off-balance sheet
 */

import { CCFTipo, CCFDetalhadoTipo } from "../types";

// Fatores de Conversão de Crédito (Art. 13-17 Circ. 3.809)
export const CCF_FACTORS: Record<CCFTipo, number> = {
  // Linhas irrevogáveis (não podem ser canceladas unilateralmente)
  linha_irrevogavel: 0.5, // 50%

  // Linhas revogáveis (podem ser canceladas unilateralmente pela IF)
  linha_revogavel: 0.1, // 10%

  // Garantias prestadas (avais, fianças, etc)
  garantia_prestada: 1.0, // 100%

  // Operações de comércio exterior com prazo ≤ 1 ano
  comercio_exterior: 0.2, // 20%

  // Outras exposições off-balance
  outro: 1.0, // 100% (conservador)
};

// CCF detalhado por tipo de operação (granularidade adicional)
export const CCF_DETALHADO = {
  // Compromissos de crédito
  compromisso: {
    irrevogavel_ate1ano: 0.2,
    irrevogavel_mais1ano: 0.5,
    revogavel_incondicional: 0.1,
    revogavel_condicional: 0.0,
  },

  // Garantias e fianças
  garantias: {
    aval_fianca: 1.0,
    carta_credito: 0.2,
    garantia_performance: 0.5,
  },

  // Derivativos (tratados separadamente via SA-CCR/CEM)
  derivativos: {
    // Fator adicional de risco potencial futuro
    addon_factor: 0.0, // Calculado via SA-CCR ou CEM
  },

  // Securitização
  securitizacao: {
    linha_liquidez: 0.5,
    melhoria_credito: 1.0,
  },
} as const;

// CCF para varejo elegível (pode ter tratamento diferenciado)
export const CCF_VAREJO = {
  cartao_revogavel: 0.1,
  cartao_irrevogavel: 0.5,
  limite_cheque_especial: 0.1,
  outros: 0.5,
} as const;
