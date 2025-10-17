/**
 * Constantes de FPR - Res. BCB 229 e atualizações
 * Centraliza todos os fatores de ponderação de risco
 */

import { RatingBucket, RatingBucketMultilateral } from "../types";

// FPR Soberanos estrangeiros por rating (Arts. 28-30)
// AA- ou acima: 0%
// A- a <AA-: 20%
// BBB- a <A-: 50%
// B- a <BBB- OU sem rating: 100%
// <B-: 150%
export const SOBERANO_FPR: Record<RatingBucket, number> = {
  "AAA_AA-": 0,
  "A+_A-": 20,
  "BBB+_BBB-": 50,
  "BB+_B-_sem_rating": 100, // B- a <BBB- OU sem rating
  "inferior_B-": 150, // <B-
};

// FPR Multilaterais NÃO listadas (não incluídas no Art. 27)
// Tabela diferente dos soberanos estrangeiros
// AA- ou acima: 20%
// A- a <AA-: 30%
// BBB- a <A- OU sem rating: 50%
// B- a <BBB-: 100%
// <B-: 150%
export const MULTILATERAL_FPR: Record<RatingBucketMultilateral, number> = {
  "AAA_AA-": 20,
  "A+_A-": 30,
  "BBB+_BBB-_sem_rating": 50, // BBB- a <A- OU sem rating
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
} as const;

// FPR Project Finance - Fases (Art. 42)
export const PROJECT_FINANCE_FPR = {
  pre_operacional: 130, // Greenfield/construção
  operacional: 100, // Fluxo de caixa positivo, projeções suficientes, passivos decrescentes
  operacional_alta_qualidade: 80, // + Capacidade de pagamento adequada, receitas contratuais, contrapartes FPR ≤ 80%, garantias, step-in rights
} as const;

// FPR Varejo (Art. 43-47) - Atualizado Res. 229
export const VAREJO_FPR = {
  elegivel: 75,
  transactor: 45,
  linhaSemSaques360: 45,
  naoElegivel: 100,
  limiteMaximo: 5_000_000, // R$ 5MM (atualização 2024)
} as const;

// FPR Imobiliário Residencial (Arts. 48-52)
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

// FPR Imobiliário Não Residencial (Arts. 53-54)
export const IMOB_NAO_RES_FPR = {
  semDependenciaLTV60: 60,
  comDependenciaLTV60: 70,
  comDependenciaLTVMaior60: 100, // Corrigido: era 90%, deve ser 100% conforme Res. BCB 229
} as const;

// FPR Especiais (Arts. 59-62: subordinado, equity, crédito tributário)
export const ESPECIAIS_FPR = {
  subordinado: 150,
  equityCooperativa: 100, // Art. 43, II - Participação em cooperativa do mesmo sistema
  equity250: 250, // Art. 43, III - Participação significativa padrão
  equity400: 400, // Art. 43, I - Participação não listada não integrada
  equity1250: 1250, // Art. 45 - Excesso de participação significativa
  creditoTributario100: 100,
  creditoTributario600: 600,
  creditoTributario1250: 1250,
  ajusteNegativoPL: 100, // Res. BCB 452/2025 (ou norma vigente)
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

// FPR Fundos por Tipo (Arts. 55-58: look-through, mandato, regulamento)
export const FUNDOS_MANDATO_FPR = {
  equity: 400,
  fixedIncome: 100,
  mixed: 150,
  outros: 100,
} as const;
