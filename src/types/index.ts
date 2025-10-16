/**
 * Tipos e Interfaces - Calculadora FPR (Res. BCB 229)
 * Centraliza todas as definições de tipos para garantir consistência
 */

export type Moeda = "BRL" | "USD" | "EUR" | "Outra";

export type Produto =
  | "emprestimo"
  | "limite"
  | "cartao"
  | "derivativo"
  | "garantia"
  | "credito_imobiliario"
  | "fundo"
  | "outro";

export type Contraparte =
  | "soberano_br"
  | "soberano_estrangeiro"
  | "if"
  | "corporate"
  | "pf"
  | "setor_publico";

export type RatingBucket =
  | "AAA_AA-"
  | "A+_A-"
  | "BBB+_BBB-"
  | "BB+_B-_sem_rating" // B- a <BBB- OU sem rating (soberanos)
  | "inferior_B-"; // <B- (soberanos)

export type RatingBucketMultilateral =
  | "AAA_AA-" // 20%
  | "A+_A-" // 30%
  | "BBB+_BBB-_sem_rating" // 50% (inclui sem rating)
  | "BB+_B-" // 100%
  | "inferior_B-"; // 150%

export type IFCategoria = "A" | "B" | "C";

export type FinanciamentoEspecializado =
  | "nenhum"
  | "objeto"
  | "commodities"
  | "project";

export type ProjectFinanceFase =
  | "pre_operacional" // Greenfield/construção - FPR 130%
  | "operacional" // Fase operacional - FPR 100%
  | "operacional_alta_qualidade"; // Alta qualidade - FPR 80%

export type TipoImovel = "residencial" | "nao_residencial";

export type FundosAbordagem = "sem-informacao" | "look-through" | "regulamento" | "mandato";

export type FundoTipo = "equity" | "fixedIncome" | "mixed" | "outros";

export type SetorPublicoTipo = "estado" | "municipio" | "df" | "psp" | "estatal";

export type OutraExposicaoTipo = "caixa" | "ouro" | "acoes_listadas" | "acoes_nao_listadas" | "ativo_fixo" | "outros";

export type EquityFPR = "nao" | "250" | "1250";

export type CreditoTributarioFPR = "nao" | "100" | "600" | "1250";

export type SegmentoPrudencial = "S1" | "S2" | "S3" | "S4" | "S5";

export type CCFTipo =
  | "linha_irrevogavel"
  | "linha_revogavel"
  | "garantia_prestada"
  | "comercio_exterior"
  | "outro";

// CCF Detalhado (granularidade adicional)
export type CCFDetalhadoTipo =
  // Compromissos de crédito
  | "compromisso_irrevogavel_ate1ano"
  | "compromisso_irrevogavel_mais1ano"
  | "compromisso_revogavel_incondicional"
  | "compromisso_revogavel_condicional"
  // Garantias
  | "aval_fianca"
  | "carta_credito"
  | "garantia_performance"
  // Securitização
  | "securitizacao_linha_liquidez"
  | "securitizacao_melhoria_credito"
  // Varejo
  | "cartao_revogavel"
  | "cartao_irrevogavel"
  | "limite_cheque_especial";

export type ColateralTipo =
  | "deposito_vista"
  | "deposito_poupanca"
  | "ouro"
  | "titulo_publico"
  | "titulo_privado"
  | "outro";

// Interfaces principais
export type TipoSoberano = "soberano_regular" | "multilateral_listada" | "multilateral_nao_listada";

export interface SoberanoInfo {
  tipoSoberano: TipoSoberano; // Tipo mutuamente excludente
  ratingBucket: RatingBucket; // Para soberanos estrangeiros regulares
  ratingBucketMultilateral?: RatingBucketMultilateral; // Para multilaterais não listadas
}

export interface IFInfo {
  categoria: IFCategoria;
  prazo90: boolean;
  tier1High: boolean;
  lrHigh: boolean;
  nettingElegivel: boolean;
  comercioExteriorAte1Ano: boolean;
}

export interface CorporateInfo {
  grandeBaixoRisco: boolean;
  pme: boolean;
  financiamento: FinanciamentoEspecializado;
  projectFinanceFase?: ProjectFinanceFase; // Fase do project finance (quando aplicável)
  receitaAnual?: number; // Para validar PME (≤ R$ 300MM)
  rating?: RatingBucket; // Para validar grande baixo risco
}

export interface VarejoInfo {
  elegivel: boolean;
  transactor: boolean;
  linhaSemSaques360: boolean;
  consignadoPrazoAnos?: number; // Para consignado > 5 anos
}

export interface ImobiliarioInfo {
  tipo: TipoImovel;
  dependenciaFluxo: boolean;
  ltv: number;
  garantiaElegivel: boolean;
  imovelConcluido: boolean;
  contratoApos2024?: boolean; // Res. BCB - obra em andamento
  contratoAte2023?: boolean; // Contratos até 2023 têm FPR 50%
}

export interface FundosInfo {
  abordagem: FundosAbordagem;
  fprLookThrough: number;
  tipo?: FundoTipo; // Para abordagem por mandato
}

export interface EspeciaisInfo {
  subordinado: boolean;
  equity: EquityFPR;
  creditoTributario: CreditoTributarioFPR;
  precatorioRecebiveis: CreditoTributarioFPR;
  ajusteNegativoPL?: boolean; // Res. BCB 452/2025
}

export interface CRMInfo {
  substituicaoGarantidor: boolean;
  fprGarantidor: number;
  seguroCredito?: boolean; // Res. BCB 324/2023
  nettingAgreement?: boolean;
  colaterais?: ColateralInfo[];
}

export interface ColateralInfo {
  tipo: ColateralTipo;
  valor: number;
  moeda: Moeda;
}

export interface SetorPublicoInfo {
  tipo: SetorPublicoTipo;
  rating?: RatingBucket;
}

export interface OutrasExposicoesInfo {
  tipo: OutraExposicaoTipo;
}

export interface InadimplenciaInfo {
  emInadimplencia: boolean;
  provisaoPercentual: number; // % de provisão (determina FPR conforme Art. 64)
  provisaoValor?: number; // Valor absoluto da provisão em R$ (deduzido da exposição conforme Art. 6º)
}

export interface PisosInfo {
  caixaForaPosseDireta: boolean;
}

export interface EADInfo {
  saldoDevedor: number;
  limiteNaoUtilizado: number;
  ccfTipo: CCFTipo;
  ccfDetalhadoTipo?: CCFDetalhadoTipo; // Granularidade adicional
  ccfCustom?: number; // Override manual
}

export interface FPRInputs {
  produto: Produto;
  contraparte: Contraparte;
  moedaExposicao: Moeda;
  moedaRenda: Moeda;
  hedge90: boolean;
  soberano: SoberanoInfo;
  ifinfo: IFInfo;
  corporate: CorporateInfo;
  varejo: VarejoInfo;
  imobiliario: ImobiliarioInfo;
  fundos: FundosInfo;
  especiais: EspeciaisInfo;
  crm: CRMInfo;
  pisos: PisosInfo;
  setorPublico: SetorPublicoInfo;
  outrasExposicoes: OutrasExposicoesInfo;
  inadimplencia: InadimplenciaInfo;
  ead?: EADInfo;
  segmentoPrudencial?: SegmentoPrudencial;
}

export interface FPRResult {
  fpr: number;
  fprBase: number;
  classe: string;
  steps: string[];
  ead?: number;
  eadAjustado?: number;
  rwacpad?: number;
}

export interface HaircutResult {
  He: number; // Ajuste exposição
  Hc: number; // Ajuste colateral
  Hfx: number; // Ajuste cambial
  valorAjustado: number;
}

export interface CCFFactors {
  [key: string]: number;
}
