/**
 * Calculadora de FPR Base - Single Responsibility Principle
 * Responsável apenas pelo cálculo do FPR base por classe de ativo/contraparte
 */

import { FPRInputs } from "../types";
import {
  SOBERANO_FPR,
  IF_FPR,
  CORPORATE_FPR,
  VAREJO_FPR,
  IMOB_RES_SEM_DEP,
  IMOB_RES_COM_DEP,
  IMOB_NAO_RES_FPR,
  IMOB_OBRA_ANDAMENTO_FPR,
  ESPECIAIS_FPR,
  FPR_DEFAULT,
  FPR_ZERO_ENTITIES,
  SETOR_PUBLICO_FPR,
  OUTRAS_EXPOSICOES_FPR,
  INADIMPLENCIA_FPR,
  FUNDOS_MANDATO_FPR,
  AJUSTES,
} from "../constants/fpr-rates";

export interface FPRBaseResult {
  fpr: number;
  classe: string;
}

/**
 * Calcula FPR para exposições em inadimplência / ativos problemáticos
 * MÁXIMA PRIORIDADE - sobrepõe TODOS os outros casos
 */
function calcularInadimplencia(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { inadimplencia } = inputs;

  if (!inadimplencia.emInadimplencia) return null;

  const provisao = inadimplencia.provisaoPercentual;

  if (provisao >= 50) {
    steps.push(`Exposição em inadimplência, provisão ≥ 50% (${provisao}%) ⇒ FPR 50%`);
    return { fpr: INADIMPLENCIA_FPR.provisaoMaior50, classe: "inadimplencia_prov_alta" };
  }

  if (provisao >= 20) {
    steps.push(`Exposição em inadimplência, provisão 20-50% (${provisao}%) ⇒ FPR 100%`);
    return { fpr: INADIMPLENCIA_FPR.provisao20a50, classe: "inadimplencia_prov_media" };
  }

  steps.push(`Exposição em inadimplência, provisão < 20% (${provisao}%) ⇒ FPR 150%`);
  return { fpr: INADIMPLENCIA_FPR.provisaoMenor20, classe: "inadimplencia_prov_baixa" };
}

/**
 * Calcula FPR para outras exposições (Art. 66)
 * Caixa, Ouro, Ações, Ativos Fixos, etc
 */
function calcularOutrasExposicoes(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { outrasExposicoes, produto } = inputs;

  // Só aplica se produto for "outro" e tivermos tipo especificado
  if (produto !== "outro") return null;

  const { tipo } = outrasExposicoes;

  switch (tipo) {
    case "caixa":
      steps.push("Caixa/Moeda (Art. 66) ⇒ FPR 0%");
      return { fpr: OUTRAS_EXPOSICOES_FPR.caixa, classe: "caixa" };

    case "ouro":
      steps.push("Ouro (Art. 66) ⇒ FPR 0%");
      return { fpr: OUTRAS_EXPOSICOES_FPR.ouro, classe: "ouro" };

    case "acoes_listadas":
      steps.push("Ações listadas em bolsa (Art. 66) ⇒ FPR 250%");
      return { fpr: OUTRAS_EXPOSICOES_FPR.acoesListadas, classe: "acoes_listadas" };

    case "acoes_nao_listadas":
      steps.push("Ações não listadas (Art. 66) ⇒ FPR 400%");
      return { fpr: OUTRAS_EXPOSICOES_FPR.acoesNaoListadas, classe: "acoes_nao_listadas" };

    case "ativo_fixo":
      steps.push("Ativo fixo (Art. 66) ⇒ FPR 100%");
      return { fpr: OUTRAS_EXPOSICOES_FPR.ativoFixo, classe: "ativo_fixo" };

    case "outros":
      steps.push("Outros ativos (Art. 66) ⇒ FPR 100%");
      return { fpr: OUTRAS_EXPOSICOES_FPR.outros, classe: "outros_ativos" };

    default:
      return null;
  }
}

/**
 * Calcula FPR para casos especiais que sobrepõem outras regras
 * (Subordinado, Equity, Créditos Tributários, Precatórios)
 */
function calcularEspeciais(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { especiais } = inputs;

  if (especiais.ajusteNegativoPL) {
    steps.push("Ajuste negativo em PL (Res. 452/2025) ⇒ FPR 100%");
    return { fpr: ESPECIAIS_FPR.ajusteNegativoPL, classe: "ajuste_negativo_pl" };
  }

  if (especiais.subordinado) {
    steps.push("Instrumento subordinado ⇒ FPR 150%");
    return { fpr: ESPECIAIS_FPR.subordinado, classe: "subordinado" };
  }

  if (especiais.equity === "250") {
    steps.push("Participação (equity) significativa não deduzida ⇒ FPR 250%");
    return { fpr: ESPECIAIS_FPR.equity250, classe: "equity" };
  }

  if (especiais.equity === "1250") {
    steps.push("Excedente/alguns casos de equity ⇒ FPR 1.250%");
    return { fpr: ESPECIAIS_FPR.equity1250, classe: "equity" };
  }

  if (especiais.creditoTributario !== "nao") {
    const fprMap = {
      "100": ESPECIAIS_FPR.creditoTributario100,
      "600": ESPECIAIS_FPR.creditoTributario600,
      "1250": ESPECIAIS_FPR.creditoTributario1250,
    };
    const fpr = fprMap[especiais.creditoTributario as keyof typeof fprMap];
    if (fpr) {
      steps.push(`Crédito tributário ⇒ FPR ${fpr}%`);
      return { fpr, classe: "credito_tributario" };
    }
  }

  if (especiais.precatorioRecebiveis !== "nao") {
    const fprMap = {
      "100": ESPECIAIS_FPR.creditoTributario100,
      "600": ESPECIAIS_FPR.creditoTributario600,
      "1250": ESPECIAIS_FPR.creditoTributario1250,
    };
    const fpr = fprMap[especiais.precatorioRecebiveis as keyof typeof fprMap];
    if (fpr) {
      steps.push(`Precatórios/recebíveis ⇒ FPR ${fpr}%`);
      return { fpr, classe: "precatorios" };
    }
  }

  return null;
}

/**
 * Calcula FPR para soberanos e multilaterais
 */
function calcularSoberano(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { contraparte, soberano } = inputs;

  if (contraparte === "soberano_br") {
    steps.push("Soberano BR/BCB em BRL ⇒ FPR 0%");
    return { fpr: FPR_ZERO_ENTITIES.soberanoBR, classe: "soberano" };
  }

  if (soberano.multilateralListada) {
    steps.push("Organização multilateral/MDE listada ⇒ FPR 0%");
    return { fpr: FPR_ZERO_ENTITIES.multilateralListada, classe: "multilateral" };
  }

  if (contraparte === "soberano_estrangeiro") {
    // Validação: soberano estrangeiro deve ter rating
    if (!soberano.ratingBucket) {
      steps.push(
        "⚠️ Soberano estrangeiro sem rating ⇒ FPR conservador 150% (conforme Basel)"
      );
      return { fpr: 150, classe: "soberano_estrangeiro_sem_rating" };
    }

    const fpr = SOBERANO_FPR[soberano.ratingBucket];
    steps.push(
      `Soberano estrangeiro (bucket ${soberano.ratingBucket}) ⇒ FPR ${fpr}%`
    );
    return { fpr, classe: "soberano_estrangeiro" };
  }

  return null;
}

/**
 * Calcula FPR para setor público (estados, municípios, PSP, estatais)
 * IMPORTANTE: Res. BCB 229/2022 NÃO prevê diferenciação por rating para entes subnacionais
 * FPR fixo de 100% para todos os tipos
 */
function calcularSetorPublico(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { contraparte, setorPublico } = inputs;

  if (contraparte !== "setor_publico") return null;

  const { tipo } = setorPublico;

  // FPR fixo de 100% para todos os entes subnacionais (sem diferenciação por rating)
  const fpr = SETOR_PUBLICO_FPR.default;

  const tipoNome = {
    estado: "Estado",
    municipio: "Município",
    df: "Distrito Federal",
    psp: "Prestador de Serviço Público",
    estatal: "Empresa Estatal"
  }[tipo] || tipo;

  steps.push(`Setor Público (${tipoNome}) ⇒ FPR fixo 100% (Art. 57-58)`);
  return { fpr, classe: `setor_publico_${tipo}` };
}

/**
 * Calcula FPR para instituições financeiras
 */
function calcularIF(inputs: FPRInputs, steps: string[]): FPRBaseResult | null {
  const { contraparte, ifinfo } = inputs;

  if (contraparte !== "if") return null;

  const { categoria, prazo90, tier1High, lrHigh, comercioExteriorAte1Ano, nettingElegivel } = ifinfo;

  let fpr: number = IF_FPR.C.default;

  if (categoria === "A") {
    // Precedência conforme Art. 33 da Res. BCB 229/2022:
    // 1º) Comércio exterior SEMPRE tem prioridade (FPR 20%)
    // 2º) Para demais características, aplicar o MENOR FPR (mais favorável)
    //     - Prazo é característica BASE da operação
    //     - Tier1/LR e netting são modificadores/mitigadores

    if (comercioExteriorAte1Ano) {
      fpr = IF_FPR.A.comercioExterior; // 20%
      steps.push("IF categoria A ⇒ comércio exterior ≤1 ano: 20%");
    } else {
      // Aplicar menor FPR entre características aplicáveis
      const candidatos: number[] = [];
      const caracteristicas: string[] = [];

      // Prazo é base
      if (prazo90) {
        candidatos.push(IF_FPR.A.prazo90);
        caracteristicas.push("prazo ≤90d (20%)");
      } else {
        candidatos.push(IF_FPR.A.prazoMaior90);
        caracteristicas.push("prazo >90d (40%)");
      }

      // Tier1/LR como mitigador
      if (tier1High && lrHigh) {
        candidatos.push(IF_FPR.A.tier1LRAlto);
        caracteristicas.push("Tier1≥14% E LR≥5% (30%)");
      }

      // Netting como mitigador
      if (nettingElegivel) {
        candidatos.push(IF_FPR.A.netting);
        caracteristicas.push("netting elegível (40%)");
      }

      fpr = Math.min(...candidatos);
      steps.push(`IF categoria A ⇒ ${caracteristicas.join(" + ")} → FPR ${fpr}%`);
    }
  } else if (categoria === "B") {
    // Precedência conforme Art. 34 da Res. BCB 229/2022:
    // 1º) Comércio exterior SEMPRE tem prioridade (FPR 50%)
    // 2º) Para demais características, aplicar o MENOR FPR (mais favorável)

    if (comercioExteriorAte1Ano) {
      fpr = IF_FPR.B.comercioExterior; // 50%
      steps.push("IF categoria B ⇒ comércio exterior ≤1 ano: 50%");
    } else {
      // Aplicar menor FPR entre características aplicáveis
      const candidatos: number[] = [];
      const caracteristicas: string[] = [];

      // Prazo é base
      if (prazo90) {
        candidatos.push(IF_FPR.B.prazo90);
        caracteristicas.push("prazo ≤90d (50%)");
      } else {
        candidatos.push(IF_FPR.B.prazoMaior90);
        caracteristicas.push("prazo >90d (75%)");
      }

      // Netting como mitigador
      if (nettingElegivel) {
        candidatos.push(IF_FPR.B.netting);
        caracteristicas.push("netting elegível (75%)");
      }

      fpr = Math.min(...candidatos);
      steps.push(`IF categoria B ⇒ ${caracteristicas.join(" + ")} → FPR ${fpr}%`);
    }
  } else {
    steps.push("IF categoria C ⇒ FPR 150%");
  }

  return { fpr, classe: "if" };
}

/**
 * Calcula FPR para crédito imobiliário
 */
function calcularImobiliario(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { produto, imobiliario } = inputs;

  const isImob = produto === "credito_imobiliario" || imobiliario.garantiaElegivel;
  if (!isImob) return null;

  const { tipo, dependenciaFluxo, ltv, garantiaElegivel, imovelConcluido } = imobiliario;

  // Obra em andamento - tratamento especial
  if (!imovelConcluido) {
    if (imobiliario.contratoAte2023) {
      steps.push(
        "Imobiliário - obra em andamento (contrato até 2023) ⇒ FPR 50%"
      );
      return { fpr: IMOB_OBRA_ANDAMENTO_FPR.contratoAte2023, classe: "imob_obra_2023" };
    }

    if (imobiliario.contratoApos2024) {
      steps.push(
        "Imobiliário - obra em andamento (contrato após 2024) ⇒ FPR 150% (ou FPR devedor conforme características)"
      );
      return { fpr: IMOB_OBRA_ANDAMENTO_FPR.contratoApos2024, classe: "imob_obra_2024" };
    }

    // Sem informação de data de contrato
    steps.push(
      "Imobiliário - obra não concluída (sem data contrato) ⇒ usar FPR do devedor"
    );
    return null;
  }

  if (!garantiaElegivel) {
    steps.push(
      "Imobiliário sem garantia elegível ⇒ usar FPR do devedor"
    );
    return null;
  }

  if (tipo === "residencial") {
    const table = dependenciaFluxo ? IMOB_RES_COM_DEP : IMOB_RES_SEM_DEP;
    const fpr = table.find((row) => ltv <= row.maxLTV)?.fpr ?? 105;

    steps.push(
      `Imobiliário residencial ${dependenciaFluxo ? "(com dependência)" : "(sem dependência)"}, LTV ${ltv}% ⇒ FPR ${fpr}%`
    );

    return {
      fpr,
      classe: dependenciaFluxo ? "imob_res_dep" : "imob_res",
    };
  } else {
    // Não residencial
    if (!dependenciaFluxo) {
      if (ltv <= 60) {
        // FPR = min(60%, FPR_devedor) conforme Res. BCB 229
        // Retorna null para calcular FPR do devedor e depois aplicar mínimo
        steps.push(
          "Imobiliário não residencial (sem dependência), LTV ≤ 60% ⇒ Aplicar min(60%, FPR devedor)"
        );
        return null; // Sinaliza que precisa calcular FPR devedor e aplicar min
      }
      steps.push(
        "Imobiliário não residencial (sem dependência), LTV > 60% ⇒ FPR do devedor"
      );
      return null;
    } else {
      const fpr =
        ltv <= 60
          ? IMOB_NAO_RES_FPR.comDependenciaLTV60
          : IMOB_NAO_RES_FPR.comDependenciaLTVMaior60;

      steps.push(
        `Imobiliário não residencial (com dependência), LTV ${ltv}% ⇒ FPR ${fpr}%`
      );
      return { fpr, classe: "imob_nr_dep" };
    }
  }
}

/**
 * Calcula FPR para varejo / pessoa física
 */
function calcularVarejo(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { contraparte, varejo } = inputs;

  if (contraparte !== "pf") return null;

  // Consignado com prazo > 5 anos (caso especial)
  if (varejo.consignadoPrazoAnos && varejo.consignadoPrazoAnos > 5) {
    steps.push(
      `Consignado prazo > 5 anos (${varejo.consignadoPrazoAnos} anos) ⇒ FPR 150% (antes 300%)`
    );
    return { fpr: AJUSTES.consignadoMais5Anos, classe: "consignado_longo_prazo" };
  }

  if (varejo.elegivel) {
    if (varejo.transactor || varejo.linhaSemSaques360) {
      steps.push(
        "Varejo PF 'transactor'/linha sem saques em 360d ⇒ FPR 45%"
      );
      return { fpr: VAREJO_FPR.transactor, classe: "varejo_transactor" };
    }

    steps.push("Varejo PF elegível (≤R$ 5MM por cliente) ⇒ FPR 75%");
    return { fpr: VAREJO_FPR.elegivel, classe: "varejo" };
  }

  steps.push("PF fora de varejo elegível ⇒ FPR 100%");
  return { fpr: VAREJO_FPR.naoElegivel, classe: "pf_nao_varejo" };
}

/**
 * Calcula FPR para corporates (empresas não financeiras)
 */
function calcularCorporate(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { contraparte, corporate } = inputs;

  if (contraparte !== "corporate") return null;

  // 1º) Financiamentos Especializados TÊM PRIORIDADE
  //     (estrutura da operação define o risco)
  if (corporate.financiamento === "project") {
    steps.push("Project finance ⇒ FPR 130%");
    return { fpr: CORPORATE_FPR.projectFinance, classe: "corp_project" };
  }

  if (
    corporate.financiamento === "objeto" ||
    corporate.financiamento === "commodities"
  ) {
    steps.push("Financiamento especializado (objeto/commodities) ⇒ FPR 100%");
    return { fpr: CORPORATE_FPR.financiamentoObjeto, classe: "corp_fin_esp" };
  }

  // 2º) Se NÃO for financiamento especializado,
  //     avaliar características da CONTRAPARTE

  // Grande baixo risco (Art. 37, atualizado pela Res. BCB 323/2023):
  // Critérios objetivos: (1) demonstrações auditadas, (2) ativos > R$ 240MM OU receita > R$ 300MM,
  // (3) não ser ativo problemático, (4) ações em bolsa
  // Rating NÃO é requisito de elegibilidade
  if (corporate.grandeBaixoRisco) {
    steps.push("Corporate grande de baixo risco (Art. 37) ⇒ FPR 65%");
    return { fpr: CORPORATE_FPR.grandeBaixoRisco, classe: "corp_grande_baixo_risco" };
  }

  // PME: receita ≤ R$ 300MM
  if (corporate.pme) {
    steps.push(`PME (receita ≤ R$ 300MM) ⇒ FPR 85%`);
    return { fpr: CORPORATE_FPR.pme, classe: "corp_pme" };
  }

  steps.push("Demais empresas não financeiras ⇒ FPR 100%");
  return { fpr: CORPORATE_FPR.default, classe: "corp" };
}

/**
 * Calcula FPR para fundos
 */
function calcularFundos(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { produto, fundos } = inputs;

  if (produto !== "fundo") return null;

  // Look-through (preferencial)
  if (fundos.abordagem === "look-through" && typeof fundos.fprLookThrough === "number") {
    // Sanitização: FPR deve estar entre 0% e 1250%
    const fprSanitizado = Math.min(Math.max(fundos.fprLookThrough, 0), 1250);

    if (fprSanitizado !== fundos.fprLookThrough) {
      steps.push(
        `⚠️ FPR look-through (${fundos.fprLookThrough}%) fora dos limites, ajustado para ${fprSanitizado}%`
      );
    }

    steps.push(`Fundo (look-through) ⇒ FPR médio informado: ${fprSanitizado}%`);
    return { fpr: fprSanitizado, classe: "fundo_lt" };
  }

  // Mandato (baseado no tipo do fundo)
  if (fundos.abordagem === "mandato" && fundos.tipo) {
    const fprMap = {
      equity: FUNDOS_MANDATO_FPR.equity,
      fixedIncome: FUNDOS_MANDATO_FPR.fixedIncome,
      mixed: FUNDOS_MANDATO_FPR.mixed,
      outros: FUNDOS_MANDATO_FPR.outros,
    };

    const fpr = fprMap[fundos.tipo];
    steps.push(`Fundo (mandato ${fundos.tipo}) ⇒ FPR ${fpr}%`);
    return { fpr, classe: `fundo_${fundos.tipo}` };
  }

  // Regulamento ou sem informação
  steps.push("Fundo sem look-through/mandato ⇒ FPR conservador 100%");
  return { fpr: FPR_DEFAULT, classe: "fundo" };
}

/**
 * Calcula FPR para derivativos (usa FPR da contraparte)
 */
function calcularDerivativo(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult | null {
  const { produto } = inputs;

  if (produto !== "derivativo") return null;

  steps.push("Derivativo (CCR) ⇒ usar FPR da contraparte");

  // Recalcula FPR como se fosse exposição direta
  // Usa "emprestimo" em vez de "outro" para evitar recursão infinita
  const simulatedInputs = { ...inputs, produto: "emprestimo" as const };
  const tempSteps: string[] = [];
  const result = computeFPRBase(simulatedInputs, tempSteps);

  // Adiciona os passos da contraparte, mas com prefixo
  tempSteps.forEach(step => {
    steps.push(`  └─ ${step}`);
  });

  return { ...result, classe: "derivativo_ccr" };
}

/**
 * Calcula FPR base por classe de ativo/contraparte
 * Aplica cascata de regras seguindo hierarquia da Res. BCB 229
 */
export function computeFPRBase(
  inputs: FPRInputs,
  steps: string[]
): FPRBaseResult {
  // Hierarquia de cálculo (ordem importa!)

  // 0. Inadimplência (MÁXIMA PRIORIDADE - sobrepõe TUDO)
  const inadimplencia = calcularInadimplencia(inputs, steps);
  if (inadimplencia) return inadimplencia;

  // 1. Outras Exposições (Art. 66 - caixa, ouro, ações, etc)
  const outrasExposicoes = calcularOutrasExposicoes(inputs, steps);
  if (outrasExposicoes) return outrasExposicoes;

  // 2. Especiais (subordinado, equity, crédito tributário, etc)
  const especiais = calcularEspeciais(inputs, steps);
  if (especiais) return especiais;

  // 3. Soberanos e multilaterais
  const soberano = calcularSoberano(inputs, steps);
  if (soberano) return soberano;

  // 4. Setor Público
  const setorPublico = calcularSetorPublico(inputs, steps);
  if (setorPublico) return setorPublico;

  // 5. Instituições Financeiras
  const ifResult = calcularIF(inputs, steps);
  if (ifResult) return ifResult;

  // 6. Imobiliário (se elegível)
  const imobiliario = calcularImobiliario(inputs, steps);
  if (imobiliario) return imobiliario;

  // 7. Varejo / PF (inclui consignado)
  const varejo = calcularVarejo(inputs, steps);
  if (varejo) return varejo;

  // 8. Corporate (inclui validações PME/grande)
  const corporate = calcularCorporate(inputs, steps);
  if (corporate) return corporate;

  // 9. Fundos (inclui mandato)
  const fundos = calcularFundos(inputs, steps);
  if (fundos) return fundos;

  // 10. Derivativos
  const derivativo = calcularDerivativo(inputs, steps);
  if (derivativo) return derivativo;

  // 11. Tratamento especial para imobiliário não residencial sem dependência e LTV ≤ 60%
  // Aplica min(60%, FPR_devedor) quando imobiliário retornou null
  if (
    (inputs.produto === "credito_imobiliario" || inputs.imobiliario.garantiaElegivel) &&
    inputs.imobiliario.tipo === "nao_residencial" &&
    !inputs.imobiliario.dependenciaFluxo &&
    inputs.imobiliario.imovelConcluido &&
    inputs.imobiliario.ltv <= 60
  ) {
    // Calcula FPR do devedor (já foi calculado no fluxo acima, mas retornou null)
    // Precisa recalcular sem considerar garantia imobiliária
    const inputsSemImob = { ...inputs, imobiliario: { ...inputs.imobiliario, garantiaElegivel: false } };
    const stepsDevedor: string[] = [];
    const fprDevedor = computeFPRBase(inputsSemImob, stepsDevedor);

    const fpr60 = IMOB_NAO_RES_FPR.semDependenciaLTV60;
    const fprFinal = Math.min(fpr60, fprDevedor.fpr);

    steps.push(`FPR devedor calculado: ${fprDevedor.fpr}%`);
    steps.push(`FPR final = min(60%, ${fprDevedor.fpr}%) = ${fprFinal}%`);

    return { fpr: fprFinal, classe: "imob_nr_sem_dep" };
  }

  // Default conservador
  steps.push("Classe não mapeada ⇒ FPR conservador 100%");
  return { fpr: FPR_DEFAULT, classe: "outros" };
}
