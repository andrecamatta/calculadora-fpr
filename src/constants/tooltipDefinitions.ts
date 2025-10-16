/**
 * Definições de Tooltips com Referências Normativas
 * Mapeamento completo de campos do formulário FPR
 */

import { TooltipConfig } from "../components/ui/Tooltip";

interface TooltipDefinitions {
  [key: string]: TooltipConfig;
}

export const TOOLTIPS: TooltipDefinitions = {
  // ===== IDENTIFICAÇÃO =====
  produto: {
    description:
      "Tipo de produto financeiro que caracteriza a exposição ao risco de crédito (empréstimo, financiamento, derivativo, etc.)",
    article: "Arts. 5-6 (definições gerais de exposição)",
    regulation: "Res. BCB 229/2022",
  },

  contraparte: {
    description:
      "Classificação da contraparte que determina o FPR base: soberano, instituição financeira, corporate, pessoa física, entes subnacionais/estatais, etc.",
    article: "Arts. 27-66 (seção completa de FPRs por contraparte)",
    regulation: "Res. BCB 229/2022",
  },

  moedaExposicao: {
    description:
      "Moeda na qual a exposição está denominada. Relevante para cálculo de descasamento cambial.",
    article: "Arts. 45-46, 51-52 (ajuste cambial por classe)",
    regulation: "Res. BCB 229/2022",
  },

  moedaRenda: {
    description:
      "Moeda na qual a contraparte aufere sua renda principal. Usado para identificar descasamento cambial.",
    article: "Arts. 45-46, 51-52 (ajuste cambial por classe)",
    regulation: "Res. BCB 229/2022",
  },

  hedge90: {
    description:
      "Indica se existe hedge cambial que cubra pelo menos 90% do descasamento. Se sim, não há ajuste de FPR por descasamento cambial. APLICÁVEL APENAS A: varejo elegível e imobiliário residencial (ajuste FPR × 1,5, máx. 150%).",
    article: "Arts. 45-46, 51-52 (ajuste cambial para varejo/imobiliário)",
    regulation: "Res. BCB 229/2022",
  },

  // ===== INADIMPLÊNCIA =====
  inadimplencia: {
    description:
      "Exposições em inadimplência têm PRIORIDADE MÁXIMA e sobrepõem todos os outros cálculos de FPR. FPR varia conforme nível de provisão.",
    article: "Arts. 63-64",
    regulation: "Res. BCB 229/2022",
  },

  provisaoPercentual: {
    description:
      "Percentual de provisão constituída sobre o saldo devedor. Determina: (1) FPR para ativos problemáticos (<20%=150%, 20-50%=100%, ≥50%=50%) conforme Art. 64, e (2) valor em R$ deduzido da exposição (Provisão R$ = % × Saldo) conforme Art. 6º. A exposição líquida não pode ser negativa.",
    article: "Arts. 6º e 64",
    regulation: "Res. BCB 229/2022",
  },

  // ===== CORPORATE =====
  grandeBaixoRisco: {
    description:
      "Empresas não financeiras de grande porte com baixo risco. Critérios objetivos: (1) demonstrações financeiras auditadas por auditor independente registrado na CVM, (2) ativos totais > R$ 240 MM OU receita bruta anual > R$ 300 MM, (3) não ser ativo problemático (Res. 4.557/2017), (4) entidade ou controladora com ações negociadas em bolsa. FPR reduzido para 65%. Rating externo NÃO é requisito de elegibilidade.",
    article: "Art. 37 (atualizado pela Res. BCB 323/2023)",
    regulation: "Res. BCB 229/2022",
  },

  pme: {
    description:
      "Pequenas e Médias Empresas com receita anual ≤ R$ 300 milhões. FPR de 85%.",
    article: "Art. 38",
    regulation: "Res. BCB 229/2022",
  },

  financiamentoEspecializado: {
    description:
      "Financiamento de objeto específico, commodities ou project finance. FPRs: objeto/commodities=100%, project finance varia conforme fase (130%/100%/80%).",
    article: "Arts. 40-42",
    regulation: "Res. BCB 229/2022",
  },

  projectFinanceFase: {
    description:
      "Fase do project finance determina o FPR: (1) Pré-operacional/greenfield: 130%, (2) Operacional: 100% (requer fluxo de caixa positivo, projeções financeiras suficientes, passivos de longo prazo decrescentes), (3) Operacional alta qualidade: 80% (operacional + capacidade de pagamento adequada + receitas contratuais definidas + contrapartes com FPR ≤ 80% + garantias + step-in rights).",
    article: "Art. 42",
    regulation: "Res. BCB 229/2022",
  },

  receitaAnual: {
    description:
      "Receita bruta anual da empresa. Usado para VALIDAÇÃO de elegibilidade (não afeta o cálculo do FPR): PME ≤R$ 300MM e Grande Baixo Risco ≥R$ 15bi. O FPR é determinado pelo checkbox marcado (PME=85%, Grande=65%), independente da receita informada.",
    article: "Arts. 37-38",
    regulation: "Res. BCB 229/2022",
  },

  ratingCorporate: {
    description:
      "Rating de crédito da contraparte. Usado para VALIDAÇÃO de elegibilidade Grande Baixo Risco (requer rating ≥ BB-). NÃO afeta o cálculo do FPR - apenas emite aviso se rating for inferior ao mínimo regulatório. O FPR de Grande Baixo Risco é sempre 65%.",
    article: "Art. 37",
    regulation: "Res. BCB 229/2022",
  },

  // ===== VAREJO =====
  varejoElegivel: {
    description:
      "Exposição total com mesmo cliente ≤ R$ 5 milhões (atualização 2024). FPR base de 75%.",
    article: "Arts. 43-47",
    regulation: "Res. BCB 229/2022",
  },

  transactor: {
    description:
      "Cliente de cartão que não gerou juros nos últimos 360 dias. FPR reduzido para 45%.",
    article: "Art. 46",
    regulation: "Res. BCB 229/2022",
  },

  linhaSemSaques: {
    description:
      "Linha de crédito ou limite sem saques nos últimos 360 dias corridos. FPR de 45%.",
    article: "Art. 46",
    regulation: "Res. BCB 229/2022",
  },

  consignadoPrazo: {
    description:
      "Prazo do empréstimo consignado em anos. Se > 5 anos, FPR é 150% (atualização 2024, antes 300%).",
    article: "Art. 47",
    regulation: "Res. BCB 229/2022",
  },

  // ===== IMOBILIÁRIO =====
  tipoImovel: {
    description:
      "Classificação do imóvel dado em garantia: residencial ou não residencial (comercial). Determina tabela LTV aplicável.",
    article: "Arts. 48-54 (48-52: residencial, 53-54: não residencial)",
    regulation: "Res. BCB 229/2022",
  },

  dependenciaFluxo: {
    description:
      "Indica se há dependência significativa do fluxo de caixa gerado pelo imóvel para pagamento da dívida. Aumenta FPRs.",
    article: "Arts. 48-54 (48-52: residencial, 53-54: não residencial)",
    regulation: "Res. BCB 229/2022",
  },

  ltv: {
    description:
      "Loan-to-Value: percentual entre o saldo devedor e o valor de avaliação da garantia. Determina FPR por faixas.",
    article: "Arts. 48-54 (48-52: residencial, 53-54: não residencial)",
    regulation: "Res. BCB 229/2022",
  },

  garantiaElegivel: {
    description:
      "Garantia atende requisitos de elegibilidade (alienação fiduciária, hipoteca, etc.). Necessário para aplicar FPR imobiliário.",
    article: "Art. 49",
    regulation: "Res. BCB 229/2022",
  },

  imovelConcluido: {
    description:
      "Indica se o imóvel está concluído. Obras em andamento têm tratamento especial conforme data do contrato.",
    article: "Art. 50",
    regulation: "Res. BCB 229/2022",
  },

  contratoAte2023: {
    description:
      "Contrato de obra em andamento firmado até 2023. FPR de 50% (regra de transição).",
    article: "Art. 50",
    regulation: "Res. BCB 229/2022",
  },

  contratoApos2024: {
    description:
      "Contrato de obra em andamento firmado após 2024. FPR de 150% ou FPR do devedor, conforme características.",
    article: "Art. 50",
    regulation: "Res. BCB 229/2022",
  },

  // ===== INSTITUIÇÕES FINANCEIRAS =====
  categoriaIF: {
    description:
      "Categoria da instituição financeira: A (menor risco), B (médio risco) ou C (maior risco). Determina FPR base.",
    article: "Arts. 31-36",
    regulation: "Res. BCB 229/2022",
  },

  prazo90: {
    description:
      "Indica se o prazo da operação é ≤ 90 dias. IFs categoria A e B têm FPR reduzido para operações curtas.",
    article: "Arts. 32-35",
    regulation: "Res. BCB 229/2022",
  },

  tier1LR: {
    description:
      "IF categoria A com Tier 1 ≥ 14% e Leverage Ratio ≥ 5%. FPR de 30% (melhor que prazo ≤90d).",
    article: "Art. 33",
    regulation: "Res. BCB 229/2022",
  },

  comercioExterior: {
    description:
      "Operação de comércio exterior com prazo ≤ 1 ano. Tem PRIORIDADE sobre outras regras de IF. FPR: A=20%, B=50%.",
    article: "Arts. 32, 34",
    regulation: "Res. BCB 229/2022",
  },

  nettingElegivel: {
    description:
      "Acordo de compensação (netting) elegível que reduz exposição. FPR específico: A=40%, B=75%.",
    article: "Arts. 32, 34",
    regulation: "Res. BCB 229/2022",
  },

  // ===== ENTES SUBNACIONAIS / ESTATAIS =====
  tipoSetorPublico: {
    description:
      "Entes subnacionais (estados, municípios, DF), prestadores de serviço público (PSP) e empresas estatais. Todos com FPR fixo de 100%.",
    article: "Arts. 57-58",
    regulation: "Res. BCB 229/2022",
  },

  ratingSetorPublico: {
    description:
      "[DESCONTINUADO] Não há diferenciação por rating para entes subnacionais na Res. BCB 229/2022. FPR fixo de 100%.",
    article: "Arts. 57-58",
    regulation: "Res. BCB 229/2022",
  },

  // ===== SOBERANO ESTRANGEIRO =====
  tipoSoberano: {
    description:
      "Classificação mutuamente excludente: (1) Soberano estrangeiro regular, (2) Multilateral listada no Art. 27 (BIS, FMI, Banco Mundial - FPR 0%), ou (3) Multilateral NÃO listada (FPR depende de rating).",
    article: "Arts. 27-30",
    regulation: "Res. BCB 229/2022",
  },

  ratingSoberanoEstrangeiro: {
    description:
      "Rating de crédito do soberano estrangeiro (e seus BCs). Determina o FPR: AA- ou acima (0%), A- a <AA- (20%), BBB- a <A- (50%), B- a <BBB- OU sem rating (100%), inferior a B- (150%). IMPORTANTE: 'sem rating' = 100%, não 150%.",
    article: "Arts. 28-30",
    regulation: "Res. BCB 229/2022",
  },

  multilateralListada: {
    description:
      "[DESCONTINUADO - usar campo 'Tipo de entidade'] Organização multilateral listada no Art. 27 (BIS, FMI, Banco Mundial, BID, BIRD, etc.) ou MDE listada. FPR fixo de 0%.",
    article: "Art. 27",
    regulation: "Res. BCB 229/2022",
  },

  multilateralNaoListada: {
    description:
      "[DESCONTINUADO - usar campo 'Tipo de entidade'] Organismo multilateral de desenvolvimento NÃO listado no Art. 27. FPR depende de rating externo.",
    article: "Arts. 27-30 (multilaterais não listadas)",
    regulation: "Res. BCB 229/2022",
  },

  ratingMultilateral: {
    description:
      "Rating de crédito da multilateral NÃO listada. Tabela específica: AA- ou acima (20%), A- a <AA- (30%), BBB- a <A- OU sem rating (50%), B- a <BBB- (100%), <B- (150%). DIFERENTE da tabela de soberanos estrangeiros.",
    article: "Arts. 27-30",
    regulation: "Res. BCB 229/2022",
  },

  // ===== OUTRAS EXPOSIÇÕES =====
  outrasExposicoes: {
    description:
      "Tipos especiais de exposição: caixa (0%), ouro (0%), ações listadas (250%), ações não listadas (400%), ativos fixos (100%).",
    article: "Art. 66",
    regulation: "Res. BCB 229/2022",
  },

  // ===== FUNDOS =====
  abordagemFundos: {
    description:
      "Método para calcular FPR: look-through (FPR médio dos ativos), mandato (FPR por tipo) ou regulamento (FPR conservador 100%).",
    article: "Arts. 55-58",
    regulation: "Res. BCB 229/2022",
  },

  fprLookThrough: {
    description:
      "FPR médio ponderado calculado através da análise detalhada dos ativos subjacentes do fundo (look-through). Deve estar entre 0% e 1250%.",
    article: "Art. 56",
    regulation: "Res. BCB 229/2022",
  },

  tipoFundo: {
    description:
      "Classificação por mandato: equity (400%), renda fixa (100%), misto (150%). Aplicado quando não há look-through.",
    article: "Art. 57",
    regulation: "Res. BCB 229/2022",
  },

  // ===== EAD (EXPOSURE AT DEFAULT) =====
  saldoDevedor: {
    description:
      "Valor principal da exposição já desembolsado/utilizado. Componente on-balance para cálculo de EAD.",
    article: "Arts. 13-14",
    regulation: "Circular BCB 3.809/2016",
  },

  limiteNaoUtilizado: {
    description:
      "Valor do limite de crédito ainda não utilizado pela contraparte. Componente off-balance convertido via CCF.",
    article: "Arts. 13-14",
    regulation: "Circular BCB 3.809/2016",
  },

  tipoCCF: {
    description:
      "Fator de Conversão de Crédito que converte limite não utilizado em EAD. Varia por tipo de operação: irrevogável (50%), revogável (10%), garantia (100%), comércio exterior (20%).",
    article: "Arts. 13-17",
    regulation: "Circular BCB 3.809/2016",
  },

  // ===== CRM (CREDIT RISK MITIGATION) =====
  crmEspeciaisCard: {
    description:
      "CRM (Credit Risk Mitigation) são técnicas regulatórias de mitigação de risco de crédito, incluindo substituição por garantidor, seguros de crédito, etc. 'Especiais' engloba exposições com tratamento diferenciado como instrumentos subordinados, equity, créditos tributários e ajustes negativos no PL.",
    article: "Arts. 18-21 (CRM), Arts. 57-62 (Especiais)",
    regulation: "Res. BCB 229/2022 e Circular BCB 3.809/2016",
  },

  substituicaoGarantidor: {
    description:
      "Substituição do FPR do devedor pelo FPR de um garantidor elegível (avalista, fiador, seguradora, etc.).",
    article: "Arts. 18-21",
    regulation: "Circular BCB 3.809/2016",
  },

  fprGarantidor: {
    description:
      "FPR da entidade garantidora que substituirá o FPR do devedor original. Deve ser calculado conforme Res. BCB 229.",
    article: "Arts. 18-21",
    regulation: "Circular BCB 3.809/2016",
  },

  seguroCredito: {
    description:
      "Seguro de crédito reconhecido como mitigador de risco. Aplica-se o FPR da seguradora conforme regulamentação específica.",
    article: "Res. BCB 324/2023",
    regulation: "Res. BCB 324/2023",
  },

  // ===== ESPECIAIS =====
  subordinado: {
    description:
      "Instrumento de dívida subordinada (paga após credores seniores). FPR de 150%.",
    article: "Art. 59",
    regulation: "Res. BCB 229/2022",
  },

  equity: {
    description:
      "Participação societária (ações, quotas) não deduzida do capital. FPR: participação significativa 250%, excedentes 1250%.",
    article: "Arts. 60-61",
    regulation: "Res. BCB 229/2022",
  },

  creditoTributario: {
    description:
      "Créditos tributários (IR diferido, PIS/COFINS, etc.). FPR varia: 100%, 600% ou 1250% conforme características.",
    article: "Art. 62",
    regulation: "Res. BCB 229/2022",
  },

  ajusteNegativoPL: {
    description:
      "Ajuste negativo registrado no patrimônio líquido em valor absoluto. FPR de 100% (regulamentação em vigor a partir de 2025).",
    article: "Res. BCB 452/2025 (ou norma vigente)",
    regulation: "Res. BCB 452/2025 (ou norma vigente)",
  },

  // ===== PISOS =====
  caixaForaPosse: {
    description:
      "Caixa custodiado em terceiros ou em trânsito (não na posse direta da IF). FPR mínimo de 20%.",
    article: "Art. 65",
    regulation: "Res. BCB 229/2022",
  },
};
