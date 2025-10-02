/**
 * Constantes de FPR - Res. BCB 229 e atualizações
 * Centraliza todos os fatores de ponderação de risco
 */

import { RatingBucket } from "../types";

// FPR Soberanos por rating (Art. 30)
export const SOBERANO_FPR: Record<RatingBucket, number> = {
  "AAA_AA-": 0,
  "A+_A-": 20,
  "BBB+_BBB-": 50,
  "BB+_B-": 100,
  "inferior_B-": 150,
};

// FPR Instituições Financeiras (Art. 31-36)
export const IF_FPR = {
  A: {
    prazo90: 20,
    prazoMaior90: 40,
    tier1LRAlto: 30,
    comercioExterior: 20,
    netting: 40,
  },
  B: {
    prazo90: 50,
    prazoMaior90: 75,
    comercioExterior: 50,
    netting: 75,
  },
  C: {
    default: 150,
  },
} as const;

// FPR Corporate (Art. 37-42)
export const CORPORATE_FPR = {
  grandeBaixoRisco: 65,
  pme: 85,
  default: 100,
  financiamentoObjeto: 100,
  financiamentoCommodities: 100,
  projectFinance: 130,
} as const;

// FPR Varejo (Art. 43-47) - Atualizado Res. 229
export const VAREJO_FPR = {
  elegivel: 75,
  transactor: 45,
  linhaSemSaques360: 45,
  naoElegivel: 100,
  limiteMaximo: 5_000_000, // R$ 5MM (atualização 2024)
} as const;

// FPR Imobiliário Residencial (Art. 48-52)
// LTV ladders sem dependência do fluxo
export const IMOB_RES_SEM_DEP = [
  { maxLTV: 10, fpr: 20 },
  { maxLTV: 20, fpr: 25 },
  { maxLTV: 30, fpr: 30 },
  { maxLTV: 40, fpr: 35 },
  { maxLTV: 50, fpr: 45 },
  { maxLTV: 60, fpr: 60 },
  { maxLTV: 70, fpr: 75 },
  { maxLTV: 200, fpr: 105 },
] as const;

// LTV ladders com dependência do fluxo
export const IMOB_RES_COM_DEP = [
  { maxLTV: 10, fpr: 30 },
  { maxLTV: 20, fpr: 35 },
  { maxLTV: 30, fpr: 45 },
  { maxLTV: 40, fpr: 60 },
  { maxLTV: 50, fpr: 75 },
  { maxLTV: 60, fpr: 90 },
  { maxLTV: 70, fpr: 105 },
  { maxLTV: 200, fpr: 150 },
] as const;

// FPR Imobiliário Não Residencial (Art. 53-54)
export const IMOB_NAO_RES_FPR = {
  semDependenciaLTV60: 60,
  comDependenciaLTV60: 70,
  comDependenciaLTVMaior60: 90,
} as const;

// FPR Especiais (Art. 55-65)
export const ESPECIAIS_FPR = {
  subordinado: 150,
  equity250: 250,
  equity1250: 1250,
  creditoTributario100: 100,
  creditoTributario600: 600,
  creditoTributario1250: 1250,
  ajusteNegativoPL: 100, // Res. BCB 452/2025
} as const;

// Pisos regulatórios
export const PISOS_FPR = {
  caixaForaPosseDireta: 20,
  minimo: 0,
  maximo: 1250,
} as const;

// Ajustes
export const AJUSTES = {
  descasamentoCambialMultiplicador: 1.5,
  descasamentoCambialMaximo: 150,
  consignadoMais5Anos: 150, // Res. BCB (antes era 300)
} as const;

// FPR Default conservador
export const FPR_DEFAULT = 100;

// Multilaterais e instituições especiais com FPR 0% (Art. 27-29)
export const FPR_ZERO_ENTITIES = {
  soberanoBR: 0,
  multilateralListada: 0,
  bcb: 0,
  bndes: 0, // Atualização regulatória - BNDES como soberano
} as const;

// FPR Setor Público
export const SETOR_PUBLICO_FPR = {
  default: 100, // Estados, Municípios, DF sem rating
  psp: 100, // Prestadores de Serviços Públicos
  estatal: 100, // Empresas Estatais
} as const;

// FPR Outras Exposições (Art. 66)
export const OUTRAS_EXPOSICOES_FPR = {
  caixa: 0,
  ouro: 0,
  acoesListadas: 250,
  acoesNaoListadas: 400,
  ativoFixo: 100,
  outros: 100,
} as const;

// FPR Inadimplência / Ativos Problemáticos
export const INADIMPLENCIA_FPR = {
  provisaoMenor20: 150,
  provisao20a50: 100,
  provisaoMaior50: 50,
} as const;

// FPR Imobiliário - Obra em Andamento
export const IMOB_OBRA_ANDAMENTO_FPR = {
  contratoAte2023: 50,
  contratoApos2024: 150, // ou FPR do devedor quando aplicável
} as const;

// FPR Fundos por Tipo (Mandato)
export const FUNDOS_MANDATO_FPR = {
  equity: 400,
  fixedIncome: 100,
  mixed: 150,
  outros: 100,
} as const;
