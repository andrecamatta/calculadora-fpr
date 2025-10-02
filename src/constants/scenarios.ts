/**
 * Cenários de Teste - Casos práticos para validação
 */

import { FPRInputs } from "../types";

export type ScenarioLoader = (baseInputs: FPRInputs) => Partial<FPRInputs>;

export const SCENARIOS: Record<string, ScenarioLoader> = {
  "PF transactor (cartão)": (_) => ({
    produto: "cartao",
    contraparte: "pf",
    varejo: { elegivel: true, transactor: true, linhaSemSaques360: false },
    moedaExposicao: "BRL",
    moedaRenda: "BRL",
    hedge90: false,
  }),

  "Corporate grande baixo risco": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: { grandeBaixoRisco: true, pme: false, financiamento: "nenhum" },
    moedaExposicao: "BRL",
    moedaRenda: "BRL",
  }),

  "PME elegível": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: { grandeBaixoRisco: false, pme: true, financiamento: "nenhum" },
  }),

  "Imob residencial LTV 55% (sem dependência)": (_) => ({
    produto: "credito_imobiliario",
    contraparte: "pf",
    imobiliario: {
      tipo: "residencial",
      dependenciaFluxo: false,
      ltv: 55,
      garantiaElegivel: true,
      imovelConcluido: true,
      contratoApos2024: false,
    },
    moedaExposicao: "BRL",
    moedaRenda: "USD",
    hedge90: false, // aciona ajuste cambial
  }),

  "Imob residencial LTV 25% (com descasamento cambial)": (_) => ({
    produto: "credito_imobiliario",
    contraparte: "pf",
    imobiliario: {
      tipo: "residencial",
      dependenciaFluxo: false,
      ltv: 25,
      garantiaElegivel: true,
      imovelConcluido: true,
    },
    moedaExposicao: "USD",
    moedaRenda: "BRL",
    hedge90: false,
  }),

  // ===== IF - Testes de Precedência =====

  "IF cat A ≤90d (Tier1/LR ok)": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "A",
      prazo90: true,
      tier1High: true,
      lrHigh: true,
      nettingElegivel: false,
      comercioExteriorAte1Ano: false,
    },
  }),

  "IF cat B >90d comércio exterior": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "B",
      prazo90: false,
      tier1High: false,
      lrHigh: false,
      nettingElegivel: false,
      comercioExteriorAte1Ano: true,
    },
  }),

  // CENÁRIOS CRÍTICOS DE PRECEDÊNCIA:

  "🔍 IF A: Tier1/LR + Prazo≤90d": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "A",
      prazo90: true,            // 20%
      tier1High: true,           // 30%
      lrHigh: true,
      nettingElegivel: false,
      comercioExteriorAte1Ano: false,
    },
    // Atual: 30% (tier1/LR tem precedência)
    // Deveria?: 20% (prazo melhor) ou 30%?
  }),

  "🔍 IF A: Netting + Prazo≤90d": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "A",
      prazo90: true,            // 20%
      tier1High: false,
      lrHigh: false,
      nettingElegivel: true,    // 40%
      comercioExteriorAte1Ano: false,
    },
    // Atual: 40% (netting tem precedência)
    // Deveria?: 20% (prazo melhor) ou 40%?
  }),

  "🔍 IF A: Comércio Ext. + Tier1/LR": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "A",
      prazo90: false,
      tier1High: true,           // 30%
      lrHigh: true,
      nettingElegivel: false,
      comercioExteriorAte1Ano: true,  // 20%
    },
    // Atual: 20% (comércio exterior)
    // Deveria: 20% ✅ (comércio tem prioridade máxima)
  }),

  "🔍 IF A: TUDO marcado": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "A",
      prazo90: true,            // 20%
      tier1High: true,           // 30%
      lrHigh: true,
      nettingElegivel: true,    // 40%
      comercioExteriorAte1Ano: true,  // 20%
    },
    // Atual: 20% (comércio exterior tem precedência)
    // Deveria: 20% ✅ (comércio tem prioridade máxima)
  }),

  "🔍 IF B: Netting + Prazo≤90d": (_) => ({
    produto: "emprestimo",
    contraparte: "if",
    ifinfo: {
      categoria: "B",
      prazo90: true,            // 50%
      tier1High: false,
      lrHigh: false,
      nettingElegivel: true,    // 75%
      comercioExteriorAte1Ano: false,
    },
    // Atual: 75% (netting tem precedência)
    // Deveria?: 50% (prazo melhor) ou 75%?
  }),

  // ===== CORPORATE - Testes de Precedência =====

  "🔍 Corporate: PME + Project Finance": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: {
      grandeBaixoRisco: false,
      pme: true,                // 85%
      financiamento: "project", // 130%
    },
    // Antes: 85% (PME tinha precedência)
    // Agora: 130% ✅ (financiamento especializado tem prioridade)
  }),

  "🔍 Corporate: Grande BR + Project Finance": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: {
      grandeBaixoRisco: true,   // 65%
      pme: false,
      financiamento: "project", // 130%
    },
    // Antes: 65% (Grande BR tinha precedência)
    // Agora: 130% ✅ (financiamento especializado tem prioridade)
  }),

  "🔍 Corporate: PME + Fin. Objeto": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: {
      grandeBaixoRisco: false,
      pme: true,                // 85%
      financiamento: "objeto",  // 100%
    },
    // Antes: 85% (PME tinha precedência)
    // Agora: 100% ✅ (financiamento especializado tem prioridade)
  }),

  "🔍 Corporate: Grande BR + Fin. Objeto": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: {
      grandeBaixoRisco: true,   // 65%
      pme: false,
      financiamento: "objeto",  // 100%
    },
    // Antes: 65% (Grande BR tinha precedência)
    // Agora: 100% ✅ (financiamento especializado tem prioridade)
  }),

  "Derivativo contra corporate": (_) => ({
    produto: "derivativo",
    contraparte: "corporate",
    corporate: { grandeBaixoRisco: false, pme: false, financiamento: "nenhum" },
  }),

  "BNDES (FPR 0%)": (_) => ({
    produto: "emprestimo",
    contraparte: "bndes",
  }),

  "Soberano BR": (_) => ({
    produto: "emprestimo",
    contraparte: "soberano_br",
    moedaExposicao: "BRL",
  }),

  "Equity 250%": (base) => ({
    produto: "outro",
    contraparte: "corporate",
    especiais: {
      ...base.especiais,
      equity: "250",
    },
  }),

  "Crédito tributário 1250%": (base) => ({
    produto: "outro",
    contraparte: "corporate",
    especiais: {
      ...base.especiais,
      creditoTributario: "1250",
    },
  }),

  "Project Finance": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: { grandeBaixoRisco: false, pme: false, financiamento: "project" },
  }),

  "Varejo com EAD e CCF": (_) => ({
    produto: "cartao",
    contraparte: "pf",
    varejo: { elegivel: true, transactor: false, linhaSemSaques360: false },
    ead: {
      saldoDevedor: 10000,
      limiteNaoUtilizado: 5000,
      ccfTipo: "linha_revogavel",
    },
  }),

  "Corporate com garantia (CRM)": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: { grandeBaixoRisco: false, pme: false, financiamento: "nenhum" },
    crm: {
      substituicaoGarantidor: true,
      fprGarantidor: 20,
      seguroCredito: false,
      nettingAgreement: false,
      colaterais: [],
    },
  }),

  // Novos cenários - Outras Exposições
  "Caixa (FPR 0%)": (_) => ({
    produto: "outro",
    contraparte: "corporate",
    outrasExposicoes: { tipo: "caixa" },
  }),

  "Ouro (FPR 0%)": (_) => ({
    produto: "outro",
    contraparte: "corporate",
    outrasExposicoes: { tipo: "ouro" },
  }),

  "Ações listadas (FPR 250%)": (_) => ({
    produto: "outro",
    contraparte: "corporate",
    outrasExposicoes: { tipo: "acoes_listadas" },
  }),

  "Ações não listadas (FPR 400%)": (_) => ({
    produto: "outro",
    contraparte: "corporate",
    outrasExposicoes: { tipo: "acoes_nao_listadas" },
  }),

  // Inadimplência
  "Inadimplência provisão 15% (FPR 150%)": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    inadimplencia: { emInadimplencia: true, provisaoPercentual: 15 },
  }),

  "Inadimplência provisão 30% (FPR 100%)": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    inadimplencia: { emInadimplencia: true, provisaoPercentual: 30 },
  }),

  "Inadimplência provisão 60% (FPR 50%)": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    inadimplencia: { emInadimplencia: true, provisaoPercentual: 60 },
  }),

  // Setor Público
  "Estado sem rating (FPR 100%)": (_) => ({
    produto: "emprestimo",
    contraparte: "setor_publico",
    setorPublico: { tipo: "estado", rating: undefined },
  }),

  "Município com rating A+ (FPR 20%)": (_) => ({
    produto: "emprestimo",
    contraparte: "setor_publico",
    setorPublico: { tipo: "municipio", rating: "A+_A-" },
  }),

  // Imobiliário - Obra em Andamento
  "Imob obra andamento - contrato 2023 (FPR 50%)": (_) => ({
    produto: "credito_imobiliario",
    contraparte: "pf",
    imobiliario: {
      tipo: "residencial",
      dependenciaFluxo: false,
      ltv: 55,
      garantiaElegivel: true,
      imovelConcluido: false,
      contratoAte2023: true,
      contratoApos2024: false,
    },
  }),

  "Imob obra andamento - contrato 2024+ (FPR 150%)": (_) => ({
    produto: "credito_imobiliario",
    contraparte: "pf",
    imobiliario: {
      tipo: "residencial",
      dependenciaFluxo: false,
      ltv: 55,
      garantiaElegivel: true,
      imovelConcluido: false,
      contratoAte2023: false,
      contratoApos2024: true,
    },
  }),

  // Corporate - Validações
  "PME (FPR 85%)": (_) => ({
    produto: "emprestimo",
    contraparte: "corporate",
    corporate: {
      grandeBaixoRisco: false,
      pme: true,
      financiamento: "nenhum",
    },
  }),

  // Consignado
  "Consignado 7 anos (FPR 150%)": (_) => ({
    produto: "emprestimo",
    contraparte: "pf",
    varejo: {
      elegivel: true,
      transactor: false,
      linhaSemSaques360: false,
      consignadoPrazoAnos: 7,
    },
  }),

  // Fundos por Mandato
  "Fundo Equity (mandato - FPR 400%)": (_) => ({
    produto: "fundo",
    contraparte: "corporate",
    fundos: {
      abordagem: "mandato",
      fprLookThrough: 0,
      tipo: "equity",
    },
  }),

  "Fundo Renda Fixa (mandato - FPR 100%)": (_) => ({
    produto: "fundo",
    contraparte: "corporate",
    fundos: {
      abordagem: "mandato",
      fprLookThrough: 0,
      tipo: "fixedIncome",
    },
  }),
};

/**
 * Aplica cenário aos inputs base
 */
export function applyScenario(
  baseInputs: FPRInputs,
  scenarioName: string
): FPRInputs {
  const loader = SCENARIOS[scenarioName];
  if (!loader) return baseInputs;

  const partial = loader(baseInputs);
  return { ...baseInputs, ...partial };
}

/**
 * Lista de nomes de cenários
 */
export function getScenarioNames(): string[] {
  return Object.keys(SCENARIOS);
}
