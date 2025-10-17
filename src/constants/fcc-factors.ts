/**
 * Fatores de Conversão em Crédito (FCC) - Res. BCB 229/2022 e Circular BCB 3.809/2016
 * Para cálculo de EAD em exposições fora do balanço patrimonial (off-balance sheet)
 */

import { FCCTipo } from "../types";

// Fatores de Conversão em Crédito (Art. 13-17 Circ. 3.809, Art. 6º Res. BCB 229)
export const FCC_FACTORS: Record<FCCTipo, number> = {
  // Linhas irrevogáveis (não podem ser canceladas unilateralmente) - FCC 50%
  linha_irrevogavel: 0.5,

  // Linhas revogáveis (podem ser canceladas unilateralmente pela IF) - FCC 10%
  linha_revogavel: 0.1,

  // Garantias prestadas (avais, fianças, etc) - FCC 100%
  garantia_prestada: 1.0,

  // Operações de comércio exterior com prazo ≤ 1 ano - FCC 20%
  comercio_exterior: 0.2,

  // Outras exposições off-balance - FCC 100% (conservador)
  outro: 1.0,
};

// FCC detalhado por tipo de operação (granularidade adicional)
export const FCC_DETALHADO = {
  // Compromissos de crédito
  compromisso: {
    irrevogavel_ate1ano: 0.2, // FCC 20%
    irrevogavel_mais1ano: 0.5, // FCC 50%
    revogavel_incondicional: 0.1, // FCC 10%
    revogavel_condicional: 0.0, // FCC 0%
  },

  // Garantias e fianças
  garantias: {
    aval_fianca: 1.0, // FCC 100%
    carta_credito: 0.2, // FCC 20%
    garantia_performance: 0.5, // FCC 50%
  },

  // Derivativos (tratados separadamente via SA-CCR/CEM)
  derivativos: {
    // Fator adicional de risco potencial futuro
    addon_factor: 0.0, // Calculado via SA-CCR ou CEM (não usa FCC tradicional)
  },

  // Securitização
  securitizacao: {
    linha_liquidez: 0.5, // FCC 50%
    melhoria_credito: 1.0, // FCC 100%
  },
} as const;

// FCC para varejo elegível (pode ter tratamento diferenciado)
export const FCC_VAREJO = {
  cartao_revogavel: 0.1, // FCC 10% - cliente transactor
  cartao_irrevogavel: 0.5, // FCC 50% - cliente revolvente
  limite_cheque_especial: 0.1, // FCC 10%
  outros: 0.5, // FCC 50% (conservador)
} as const;
