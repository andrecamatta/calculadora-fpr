/**
 * Hook customizado para cálculo de FPR
 * Encapsula a lógica de cálculo e memoização
 */

import { useMemo } from "react";
import { FPRInputs, FPRResult } from "../types";
import { calculateFPRComplete } from "../calculators";

/**
 * Hook que calcula FPR completo com memoização
 * Recalcula apenas quando inputs mudam
 */
export function useFPRCalculator(inputs: FPRInputs): FPRResult {
  return useMemo(() => {
    return calculateFPRComplete(inputs);
  }, [inputs]);
}

/**
 * Hook auxiliar para criar valores iniciais de inputs
 */
export function useInitialInputs(): FPRInputs {
  return useMemo(
    () => ({
      produto: "emprestimo",
      contraparte: "corporate",
      moedaExposicao: "BRL",
      moedaRenda: "BRL",
      hedge90: false,

      soberano: {
        multilateralListada: false,
        ratingBucket: "BBB+_BBB-",
      },

      ifinfo: {
        categoria: "A",
        prazo90: false,
        tier1High: false,
        lrHigh: false,
        nettingElegivel: false,
        comercioExteriorAte1Ano: false,
      },

      corporate: {
        grandeBaixoRisco: false,
        pme: false,
        financiamento: "nenhum",
        receitaAnual: undefined,
        rating: undefined,
      },

      varejo: {
        elegivel: false,
        transactor: false,
        linhaSemSaques360: false,
        consignadoPrazoAnos: undefined,
      },

      imobiliario: {
        tipo: "residencial",
        dependenciaFluxo: false,
        ltv: 55,
        garantiaElegivel: false,
        imovelConcluido: false,
        contratoApos2024: false,
        contratoAte2023: false,
      },

      fundos: {
        abordagem: "sem-informacao",
        fprLookThrough: 75,
        tipo: undefined,
      },

      especiais: {
        subordinado: false,
        equity: "nao",
        creditoTributario: "nao",
        precatorioRecebiveis: "nao",
        ajusteNegativoPL: false,
      },

      crm: {
        substituicaoGarantidor: false,
        fprGarantidor: 20,
        seguroCredito: false,
        nettingAgreement: false,
        colaterais: [],
      },

      pisos: {
        caixaForaPosseDireta: false,
      },

      setorPublico: {
        tipo: "estado",
        rating: undefined,
      },

      outrasExposicoes: {
        tipo: "outros",
      },

      inadimplencia: {
        emInadimplencia: false,
        provisaoPercentual: 0,
      },

      ead: {
        saldoDevedor: 1000,
        limiteNaoUtilizado: 0,
        ccfTipo: "outro",
      },

      segmentoPrudencial: "S2",
    }),
    []
  );
}
