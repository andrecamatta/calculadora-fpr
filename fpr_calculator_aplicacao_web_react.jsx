import React, { useMemo, useState } from "react";

/**
 * FPR Calculator – Res. BCB 229 (simplificado)
 *
 * Observações importantes:
 * - Este módulo calcula apenas o FPR (em %) e, opcionalmente, RWACPAD (EAD × FPR).
 * - Mitigadores (CRM) aqui são representados por SUBSTITUIÇÃO do FPR pelo do garantidor (via Circular 3.809).
 *   Haircuts normalmente ajustam EAD, não FPR; por simplicidade, esta UI foca em FPR.
 * - Ajuste por descasamento cambial se aplica a VAREJO e IMOBILIÁRIO RESIDENCIAL: FPR_final = min(1,5 × FPR_base, 150%).
 * - Pisos específicos: caixa fora da posse direta (piso 20%).
 * - Regras e rótulos em PT-BR. Este é um MVP extensível.
 */

// Utilidades simples
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const pct = (n) => (n != null && !Number.isNaN(n) ? `${n.toFixed(1)}%` : "–");

// Buckets de rating soberano (simplificado, estilo Basileia)
const soberanoRatingToFPR = (bucket) => {
  switch (bucket) {
    case "AAA_AA-":
      return 0;
    case "A+_A-":
      return 20;
    case "BBB+_BBB-":
      return 50;
    case "BB+_B-":
      return 100;
    case "inferior_B-":
      return 150;
    default:
      return 100; // conservador
  }
};

// Cálculo FPR base por classe
function computeFPRBase(inputs, steps) {
  const {
    produto,
    contraparte,
    moedaExposicao,
    moedaRenda,
    hedge90,
    soberano,
    ifinfo,
    corporate,
    varejo,
    imobiliario,
    especiais,
    fundos,
  } = inputs;

  // 0) Casos especiais que sobrepõem (subordinado/equity/tributário/precatório)
  if (especiais?.subordinado) {
    steps.push("Instrumento subordinado ⇒ FPR 150%.");
    return { fpr: 150, classe: "subordinado" };
  }
  if (especiais?.equity === "250") {
    steps.push("Participação (equity) significativa não deduzida ⇒ FPR 250%.");
    return { fpr: 250, classe: "equity" };
  }
  if (especiais?.equity === "1250") {
    steps.push("Excedente/alguns casos de equity ⇒ FPR 1.250%.");
    return { fpr: 1250, classe: "equity" };
  }
  const tribMap = { "100": 100, "600": 600, "1250": 1250 };
  if (especiais?.creditoTributario && tribMap[especiais.creditoTributario]) {
    const f = tribMap[especiais.creditoTributario];
    steps.push(`Crédito tributário ⇒ FPR ${f}%`);
    return { fpr: f, classe: "credito_tributario" };
  }
  if (especiais?.precatorioRecebiveis && tribMap[especiais.precatorioRecebiveis]) {
    const f = tribMap[especiais.precatorioRecebiveis];
    steps.push(`Precatórios/recebíveis ⇒ FPR ${f}%`);
    return { fpr: f, classe: "precatorios" };
  }

  // 1) Soberanos / Multilaterais / Moeda
  if (contraparte === "soberano_br") {
    steps.push("Soberano BR/BCB em BRL ⇒ FPR 0%.");
    return { fpr: 0, classe: "soberano" };
  }
  if (soberano?.multilateralListada) {
    steps.push("Organização multilateral/MDE listada ⇒ FPR 0%.");
    return { fpr: 0, classe: "multilateral" };
  }
  if (contraparte === "soberano_estrangeiro") {
    const f = soberanoRatingToFPR(soberano?.ratingBucket);
    steps.push(`Soberano estrangeiro (bucket ${soberano?.ratingBucket || "?"}) ⇒ FPR ${f}%`);
    return { fpr: f, classe: "soberano_estrangeiro" };
  }

  // 2) Instituições financeiras (IF)
  if (contraparte === "if") {
    const cat = ifinfo?.categoria || "C";
    const prazo90 = !!ifinfo?.prazo90;
    const tier1ok = !!ifinfo?.tier1High;
    const lrok = !!ifinfo?.lrHigh;
    const netting = !!ifinfo?.nettingElegivel;
    const comercioExt = !!ifinfo?.comercioExteriorAte1Ano;

    let f = 150;
    if (cat === "A") {
      f = prazo90 ? 20 : 40;
      if (tier1ok && lrok) f = 30; // opcional com indicadores fortes
      if (comercioExt) f = 20; // exp. comércio ext. ≤ 1 ano
      if (netting && !prazo90) f = Math.min(f, 40);
      steps.push(`IF categoria A ⇒ base ${prazo90 ? 20 : 40}%` + (tier1ok && lrok ? " (30% com Tier1/LR altos)" : "") + (comercioExt ? " (20% comércio exterior ≤1 ano)" : "") + (netting && !prazo90 ? " (netting até 40%)" : ""));
    } else if (cat === "B") {
      f = prazo90 ? 50 : 75;
      if (comercioExt) f = 50;
      if (netting && !prazo90) f = Math.min(f, 75);
      steps.push(`IF categoria B ⇒ base ${prazo90 ? 50 : 75}%` + (comercioExt ? " (50% comércio exterior ≤1 ano)" : "") + (netting && !prazo90 ? " (netting até 75%)" : ""));
    } else {
      f = 150;
      steps.push("IF categoria C ⇒ 150%");
    }
    return { fpr: f, classe: "if" };
  }

  // 3) Imobiliário com garantia real (depende de flags)
  const isImob = produto === "credito_imobiliario" || imobiliario?.garantiaElegivel;
  if (isImob) {
    const tipo = imobiliario?.tipo || "residencial";
    const depFluxo = !!imobiliario?.dependenciaFluxo;
    const ltv = Number(imobiliario?.ltv || 0);
    const elegivel = !!imobiliario?.garantiaElegivel && !!imobiliario?.imovelConcluido;

    if (!elegivel) {
      steps.push("Imobiliário não elegível (sem perfeição/execução/obra concluída) ⇒ usar FPR do devedor (corporate/PF). Voltando ao fluxo geral.");
    } else {
      if (tipo === "residencial") {
        // Ladder por LTV (simplificada). Valores ilustrativos compatíveis c/ norma (ex.: 20/25/30/35/45/60/75/105)**
        const laddersSemDep = [
          { max: 10, f: 20 },
          { max: 20, f: 25 },
          { max: 30, f: 30 },
          { max: 40, f: 35 },
          { max: 50, f: 45 },
          { max: 60, f: 60 },
          { max: 70, f: 75 },
          { max: 200, f: 105 },
        ];
        const laddersComDep = [
          { max: 10, f: 30 },
          { max: 20, f: 35 },
          { max: 30, f: 45 },
          { max: 40, f: 60 },
          { max: 50, f: 75 },
          { max: 60, f: 90 },
          { max: 70, f: 105 },
          { max: 200, f: 150 },
        ];
        const table = depFluxo ? laddersComDep : laddersSemDep;
        let f = table.find((row) => ltv <= row.max)?.f ?? 105;
        steps.push(`Imobiliário residencial ${depFluxo ? "(com dependência)" : "(sem dependência)"}, LTV ${ltv}% ⇒ FPR ${f}%`);
        return { fpr: f, classe: depFluxo ? "imob_res_dep" : "imob_res" };
      } else {
        // Não residencial
        if (!depFluxo) {
          if (ltv <= 60) {
            // min(60%, FPR do devedor) – aqui aproximamos por 60% e deixamos nota
            steps.push("Imobiliário não residencial (sem dependência), LTV ≤ 60% ⇒ min(60%, FPR devedor). Aproximação: 60% (ajuste manual se necessário).");
            return { fpr: 60, classe: "imob_nr_sem_dep" };
          }
          steps.push("Imobiliário não residencial (sem dependência), LTV > 60% ⇒ FPR do devedor. Voltando ao fluxo geral.");
        } else {
          const f = ltv <= 60 ? 70 : 90;
          steps.push(`Imobiliário não residencial (com dependência), LTV ${ltv}% ⇒ FPR ${f}%`);
          return { fpr: f, classe: "imob_nr_dep" };
        }
      }
    }
  }

  // 4) Varejo / PF
  if (contraparte === "pf") {
    if (varejo?.elegivel) {
      if (varejo?.transactor || varejo?.linhaSemSaques360) {
        steps.push("Varejo PF ‘transactor’/linha sem saques em 360d ⇒ 45%.");
        return { fpr: 45, classe: "varejo_transactor" };
      }
      steps.push("Varejo PF elegível ⇒ 75%.");
      return { fpr: 75, classe: "varejo" };
    }
    steps.push("PF fora de varejo elegível e sem garantia real ⇒ 100%.");
    return { fpr: 100, classe: "pf_nao_varejo" };
  }

  // 5) Corporates (não financeiras)
  if (contraparte === "corporate") {
    if (corporate?.grandeBaixoRisco) {
      steps.push("Corporate grande de baixo risco ⇒ 65%.");
      return { fpr: 65, classe: "corp_grande_baixo_risco" };
    }
    if (corporate?.pme) {
      steps.push("PME (critérios de porte) ⇒ 85%.");
      return { fpr: 85, classe: "corp_pme" };
    }
    if (corporate?.financiamento === "objeto" || corporate?.financiamento === "commodities") {
      steps.push("Financiamento especializado (objeto/commodities) ⇒ 100%.");
      return { fpr: 100, classe: "corp_fin_esp" };
    }
    if (corporate?.financiamento === "project") {
      steps.push("Project finance ⇒ 130%.");
      return { fpr: 130, classe: "corp_project" };
    }
    steps.push("Demais empresas não financeiras ⇒ 100%.");
    return { fpr: 100, classe: "corp" };
  }

  // 6) Fundos (look-through simplificado)
  if (produto === "fundo") {
    if (fundos?.abordagem === "look-through" && typeof fundos?.fprLookThrough === "number") {
      steps.push(`Fundo (look-through) ⇒ FPR médio informado: ${fundos.fprLookThrough}%`);
      return { fpr: clamp(fundos.fprLookThrough, 0, 1250), classe: "fundo_lt" };
    }
    steps.push("Fundo sem look-through ⇒ usar regra conservadora: 100% (ajuste conforme regulamento quando disponível).");
    return { fpr: 100, classe: "fundo" };
  }

  // 7) Derivativos (CCR) – FPR da contraparte
  if (produto === "derivativo") {
    steps.push("Derivativo (CCR) ⇒ FPR da contraparte.");
    // Recursão suave: derive FPR como se fosse exposição direta à contraparte
    const simulatedInputs = { ...inputs, produto: "outro" };
    const { fpr } = computeFPRBase(simulatedInputs, steps);
    return { fpr, classe: "derivativo_ccr" };
  }

  // Default conservador
  steps.push("Classe não mapeada de forma específica ⇒ 100% (conservador).");
  return { fpr: 100, classe: "outros" };
}

// Ajuste por descasamento cambial (aplicável a varejo e residencial)
function applyCurrencyMismatchAdjust(base, classe, inputs, steps) {
  const { moedaExposicao, moedaRenda, hedge90 } = inputs;
  const mismatch = moedaExposicao && moedaRenda && moedaExposicao !== moedaRenda && !hedge90;
  const aplicavel = classe === "varejo" || classe === "varejo_transactor" || classe === "imob_res" || classe === "imob_res_dep";
  if (mismatch && aplicavel) {
    const f = Math.min(base * 1.5, 150);
    steps.push(`Ajuste por descasamento cambial (aplicável) ⇒ min(1,5×${base.toFixed(1)}%, 150%) = ${f.toFixed(1)}%`);
    return f;
  }
  if (mismatch) {
    steps.push("Descasamento cambial identificado, mas classe não é varejo/residencial ⇒ sem ajuste de FPR (pode afetar EAD/gestão de risco). ");
  }
  return base;
}

// Mitigadores (substituição do FPR pelo do garantidor)
function applyCRMSubstitution(current, inputs, steps) {
  const fprg = Number(inputs?.crm?.fprGarantidor);
  if (inputs?.crm?.substituicaoGarantidor && !Number.isNaN(fprg)) {
    steps.push(`Substituição por garantidor elegível (Circ. 3.809) ⇒ FPR do garantidor: ${fprg}%`);
    return clamp(fprg, 0, 1250);
  }
  return current;
}

// Pisos específicos
function applyFloors(current, inputs, steps) {
  if (inputs?.pisos?.caixaForaPosseDireta) {
    const f = Math.max(current, 20);
    if (f !== current) steps.push("Piso: caixa fora da posse direta ⇒ mínimo 20% aplicado.");
    return f;
  }
  return current;
}

function useFPRCalculator(inputs) {
  return useMemo(() => {
    const steps = [];
    // 1) Base
    const base = computeFPRBase(inputs, steps);
    let f = base.fpr;
    // 2) Ajuste cambial
    f = applyCurrencyMismatchAdjust(f, base.classe, inputs, steps);
    // 3) CRM substituição
    f = applyCRMSubstitution(f, inputs, steps);
    // 4) Pisos
    f = applyFloors(f, inputs, steps);
    // 5) Sanitização
    f = clamp(f, 0, 1250);
    return { fpr: f, steps, classe: base.classe, baseFpr: base.fpr };
  }, [inputs]);
}

// Componentes UI auxiliares
const Section = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="grid gap-3">{children}</div>
  </section>
);

const Row = ({ children }) => <div className="grid md:grid-cols-3 gap-3">{children}</div>;

const Card = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border p-4 shadow-sm bg-white/5">
    {title && <h3 className="font-medium mb-1">{title}</h3>}
    {subtitle && <p className="text-sm text-neutral-500 mb-3">{subtitle}</p>}
    {children}
  </div>
);

const Label = ({ children }) => <label className="text-sm font-medium">{children}</label>;

const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border px-3 py-2 bg-transparent"
  >
    {children}
  </select>
);

const Input = ({ value, onChange, type = "text", placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full rounded-xl border px-3 py-2 bg-transparent"
  />
);

const Switch = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-neutral-400"}`}
      aria-pressed={checked}
    >
      <span
        className={`block h-5 w-5 bg-white rounded-full transform transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
    {label && <span className="text-sm">{label}</span>}
  </div>
);

const Helper = ({ children }) => (
  <p className="text-xs text-neutral-500 leading-relaxed">{children}</p>
);

// Cenários de teste
const SCENARIOS = {
  "PF transactor (cartão)": (setters) => {
    setters.setInputs((s) => ({
      ...s,
      produto: "cartao",
      contraparte: "pf",
      varejo: { ...s.varejo, elegivel: true, transactor: true, linhaSemSaques360: false },
      moedaExposicao: "BRL",
      moedaRenda: "BRL",
      hedge90: false,
      pisos: { caixaForaPosseDireta: false },
    }));
  },
  "Corporate grande baixo risco": (setters) => {
    setters.setInputs((s) => ({
      ...s,
      produto: "emprestimo",
      contraparte: "corporate",
      corporate: { ...s.corporate, grandeBaixoRisco: true, pme: false, financiamento: "nenhum" },
      moedaExposicao: "BRL",
      moedaRenda: "BRL",
      hedge90: false,
    }));
  },
  "Imob residencial LTV 55% (sem dependência)": (setters) => {
    setters.setInputs((s) => ({
      ...s,
      produto: "credito_imobiliario",
      contraparte: "pf",
      imobiliario: { tipo: "residencial", dependenciaFluxo: false, ltv: 55, garantiaElegivel: true, imovelConcluido: true },
      moedaExposicao: "BRL",
      moedaRenda: "USD",
      hedge90: false, // aciona ajuste cambial
    }));
  },
  "IF cat A >90d (Tier1/LR ok)": (setters) => {
    setters.setInputs((s) => ({
      ...s,
      produto: "emprestimo",
      contraparte: "if",
      ifinfo: { categoria: "A", prazo90: false, tier1High: true, lrHigh: true, nettingElegivel: false, comercioExteriorAte1Ano: false },
      moedaExposicao: "BRL",
      moedaRenda: "BRL",
      hedge90: false,
    }));
  },
  "Derivativo contra corporate (padrão)": (setters) => {
    setters.setInputs((s) => ({
      ...s,
      produto: "derivativo",
      contraparte: "corporate",
      corporate: { grandeBaixoRisco: false, pme: false, financiamento: "nenhum" },
    }));
  },
};

export default function App() {
  const [inputs, setInputs] = useState({
    produto: "emprestimo", // emprestimo | limite | cartao | derivativo | garantia | credito_imobiliario | fundo | outro
    contraparte: "corporate", // soberano_br | soberano_estrangeiro | if | corporate | pf

    // Moeda & Hedge
    moedaExposicao: "BRL",
    moedaRenda: "BRL",
    hedge90: false,

    // Soberano/Multilateral
    soberano: {
      multilateralListada: false,
      ratingBucket: "BBB+_BBB-", // AAA_AA- | A+_A- | BBB+_BBB- | BB+_B- | inferior_B-
    },

    // IF
    ifinfo: {
      categoria: "B", // A | B | C
      prazo90: true, // <= 90d?
      tier1High: false,
      lrHigh: false,
      nettingElegivel: false,
      comercioExteriorAte1Ano: false,
    },

    // Corporate
    corporate: {
      grandeBaixoRisco: false,
      pme: false,
      financiamento: "nenhum", // nenhum | objeto | commodities | project
    },

    // Varejo/PF
    varejo: {
      elegivel: false,
      transactor: false,
      linhaSemSaques360: false,
    },

    // Imobiliário
    imobiliario: {
      tipo: "residencial", // residencial | nao_residencial
      dependenciaFluxo: false,
      ltv: 55,
      garantiaElegivel: false,
      imovelConcluido: false,
    },

    // Fundos
    fundos: {
      abordagem: "sem-informacao", // look-through | regulamento | sem-informacao
      fprLookThrough: 75,
    },

    // Especiais
    especiais: {
      subordinado: false,
      equity: "nao", // nao | 250 | 1250
      creditoTributario: "nao", // nao | 100 | 600 | 1250
      precatorioRecebiveis: "nao", // nao | 100 | 600 | 1250
    },

    // CRM (substituição)
    crm: {
      substituicaoGarantidor: false,
      fprGarantidor: 20,
    },

    // Pisos
    pisos: {
      caixaForaPosseDireta: false,
    },

    // EAD (opcional) para RWACPAD
    ead: 0,
  });

  const { fpr, steps, classe, baseFpr } = useFPRCalculator(inputs);
  const rwacpad = useMemo(() => {
    const e = Number(inputs.ead);
    if (!e || Number.isNaN(e)) return null;
    return (e * fpr) / 100;
  }, [inputs.ead, fpr]);

  const set = {
    setInputs,
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto text-sm">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Calculadora de FPR (Res. BCB 229) – MVP</h1>
        <p className="text-neutral-600 mt-1">Informe os parâmetros e veja o <b>FPR</b> resultante, com trilha de decisão. Ajustes: descasamento cambial (varejo/residencial), CRM (substituição do FPR), pisos (caixa fora da posse direta).</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna 1: Entradas principais */}
        <div className="md:col-span-2 grid gap-6">
          <Card title="Identificação da Exposição" subtitle="Produto, contraparte e moeda/hedge">
            <Row>
              <div>
                <Label>Produto</Label>
                <Select
                  value={inputs.produto}
                  onChange={(v) => setInputs((s) => ({ ...s, produto: v }))}
                >
                  <option value="emprestimo">Empréstimo</option>
                  <option value="limite">Limite/Linha</option>
                  <option value="cartao">Cartão pós-pago</option>
                  <option value="derivativo">Derivativo (CCR)</option>
                  <option value="garantia">Garantia/Fiança</option>
                  <option value="credito_imobiliario">Crédito Imobiliário</option>
                  <option value="fundo">Fundo</option>
                  <option value="outro">Outro</option>
                </Select>
              </div>
              <div>
                <Label>Contraparte</Label>
                <Select
                  value={inputs.contraparte}
                  onChange={(v) => setInputs((s) => ({ ...s, contraparte: v }))}
                >
                  <option value="corporate">Empresa não financeira</option>
                  <option value="pf">Pessoa Física</option>
                  <option value="if">Instituição Financeira</option>
                  <option value="soberano_br">Soberano BR/BCB (BRL)</option>
                  <option value="soberano_estrangeiro">Soberano estrangeiro</option>
                </Select>
              </div>
              <div>
                <Label>Moeda da exposição</Label>
                <Select
                  value={inputs.moedaExposicao}
                  onChange={(v) => setInputs((s) => ({ ...s, moedaExposicao: v }))}
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="Outra">Outra</option>
                </Select>
                <Helper>Para ajuste por descasamento cambial, compare com a renda do devedor.</Helper>
              </div>
            </Row>
            <Row>
              <div>
                <Label>Moeda da renda do devedor</Label>
                <Select
                  value={inputs.moedaRenda}
                  onChange={(v) => setInputs((s) => ({ ...s, moedaRenda: v }))}
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="Outra">Outra</option>
                </Select>
              </div>
              <div>
                <Label>Hedge cambial ≥ 90%?</Label>
                <Switch
                  checked={inputs.hedge90}
                  onChange={(v) => setInputs((s) => ({ ...s, hedge90: v }))}
                />
              </div>
              <div>
                <Label>EAD (opcional) – para RWACPAD</Label>
                <Input
                  type="number"
                  value={inputs.ead}
                  onChange={(v) => setInputs((s) => ({ ...s, ead: v }))}
                  placeholder="0,00"
                />
              </div>
            </Row>
          </Card>

          <Card title="Soberano / Multilateral / IF" subtitle="Parâmetros específicos quando aplicável">
            <Row>
              <div>
                <Label>Multilateral/MDE listada (art. 27)</Label>
                <Switch
                  checked={inputs.soberano.multilateralListada}
                  onChange={(v) => setInputs((s) => ({ ...s, soberano: { ...s.soberano, multilateralListada: v } }))}
                />
              </div>
              <div>
                <Label>Rating soberano (estrangeiro)</Label>
                <Select
                  value={inputs.soberano.ratingBucket}
                  onChange={(v) => setInputs((s) => ({ ...s, soberano: { ...s.soberano, ratingBucket: v } }))}
                >
                  <option value="AAA_AA-">AAA a AA-</option>
                  <option value="A+_A-">A+ a A-</option>
                  <option value="BBB+_BBB-">BBB+ a BBB-</option>
                  <option value="BB+_B-">BB+ a B-</option>
                  <option value="inferior_B-">Abaixo de B-</option>
                </Select>
              </div>
              <div>
                <Label>IF – Categoria</Label>
                <Select
                  value={inputs.ifinfo.categoria}
                  onChange={(v) => setInputs((s) => ({ ...s, ifinfo: { ...s.ifinfo, categoria: v } }))}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </Select>
              </div>
            </Row>
            <Row>
              <div>
                <Label>IF – Prazo original ≤ 90 dias?</Label>
                <Switch
                  checked={inputs.ifinfo.prazo90}
                  onChange={(v) => setInputs((s) => ({ ...s, ifinfo: { ...s.ifinfo, prazo90: v } }))}
                />
              </div>
              <div>
                <Label>IF – Tier 1 ≥ 14% e LR ≥ 5%?</Label>
                <Switch
                  checked={inputs.ifinfo.tier1High && inputs.ifinfo.lrHigh}
                  onChange={(v) => setInputs((s) => ({ ...s, ifinfo: { ...s.ifinfo, tier1High: v, lrHigh: v } }))}
                />
              </div>
              <div>
                <Label>IF – Comércio exterior ≤ 1 ano?</Label>
                <Switch
                  checked={inputs.ifinfo.comercioExteriorAte1Ano}
                  onChange={(v) => setInputs((s) => ({ ...s, ifinfo: { ...s.ifinfo, comercioExteriorAte1Ano: v } }))}
                />
              </div>
            </Row>
            <Row>
              <div>
                <Label>IF – Netting elegível (Circ. 3.809)?</Label>
                <Switch
                  checked={inputs.ifinfo.nettingElegivel}
                  onChange={(v) => setInputs((s) => ({ ...s, ifinfo: { ...s.ifinfo, nettingElegivel: v } }))}
                />
              </div>
            </Row>
          </Card>

          <Card title="Corporate / Varejo" subtitle="Critérios de porte e varejo PF">
            <Row>
              <div>
                <Label>Corporate – grande de baixo risco?</Label>
                <Switch
                  checked={inputs.corporate.grandeBaixoRisco}
                  onChange={(v) => setInputs((s) => ({ ...s, corporate: { ...s.corporate, grandeBaixoRisco: v } }))}
                />
              </div>
              <div>
                <Label>Corporate – PME?</Label>
                <Switch
                  checked={inputs.corporate.pme}
                  onChange={(v) => setInputs((s) => ({ ...s, corporate: { ...s.corporate, pme: v } }))}
                />
              </div>
              <div>
                <Label>Financiamento especializado</Label>
                <Select
                  value={inputs.corporate.financiamento}
                  onChange={(v) => setInputs((s) => ({ ...s, corporate: { ...s.corporate, financiamento: v } }))}
                >
                  <option value="nenhum">Nenhum</option>
                  <option value="objeto">Objeto específico</option>
                  <option value="commodities">Commodities</option>
                  <option value="project">Project finance</option>
                </Select>
              </div>
            </Row>
            <Row>
              <div>
                <Label>Varejo PF elegível?</Label>
                <Switch
                  checked={inputs.varejo.elegivel}
                  onChange={(v) => setInputs((s) => ({ ...s, varejo: { ...s.varejo, elegivel: v } }))}
                />
              </div>
              <div>
                <Label>PF ‘transactor’ (cartão) em 360d?</Label>
                <Switch
                  checked={inputs.varejo.transactor}
                  onChange={(v) => setInputs((s) => ({ ...s, varejo: { ...s.varejo, transactor: v } }))}
                />
              </div>
              <div>
                <Label>Linha sem saques em 360d?</Label>
                <Switch
                  checked={inputs.varejo.linhaSemSaques360}
                  onChange={(v) => setInputs((s) => ({ ...s, varejo: { ...s.varejo, linhaSemSaques360: v } }))}
                />
              </div>
            </Row>
          </Card>

          <Card title="Imobiliário" subtitle="Elegibilidade, LTV e dependência do fluxo do imóvel">
            <Row>
              <div>
                <Label>Tipo de imóvel</Label>
                <Select
                  value={inputs.imobiliario.tipo}
                  onChange={(v) => setInputs((s) => ({ ...s, imobiliario: { ...s.imobiliario, tipo: v } }))}
                >
                  <option value="residencial">Residencial</option>
                  <option value="nao_residencial">Não residencial</option>
                </Select>
              </div>
              <div>
                <Label>Dependência do fluxo do imóvel?</Label>
                <Switch
                  checked={inputs.imobiliario.dependenciaFluxo}
                  onChange={(v) => setInputs((s) => ({ ...s, imobiliario: { ...s.imobiliario, dependenciaFluxo: v } }))}
                />
              </div>
              <div>
                <Label>LTV (%)</Label>
                <Input
                  type="number"
                  value={inputs.imobiliario.ltv}
                  onChange={(v) => setInputs((s) => ({ ...s, imobiliario: { ...s.imobiliario, ltv: Number(v) } }))}
                  placeholder="0–200"
                />
              </div>
            </Row>
            <Row>
              <div>
                <Label>Garantia perfeccionada/exequível?</Label>
                <Switch
                  checked={inputs.imobiliario.garantiaElegivel}
                  onChange={(v) => setInputs((s) => ({ ...s, imobiliario: { ...s.imobiliario, garantiaElegivel: v } }))}
                />
              </div>
              <div>
                <Label>Imóvel concluído?</Label>
                <Switch
                  checked={inputs.imobiliario.imovelConcluido}
                  onChange={(v) => setInputs((s) => ({ ...s, imobiliario: { ...s.imobiliario, imovelConcluido: v } }))}
                />
              </div>
            </Row>
          </Card>

          <Card title="Fundos / Especiais / CRM / Pisos" subtitle="Look-through e substituição por garantidor">
            <Row>
              <div>
                <Label>Fundos – abordagem</Label>
                <Select
                  value={inputs.fundos.abordagem}
                  onChange={(v) => setInputs((s) => ({ ...s, fundos: { ...s.fundos, abordagem: v } }))}
                >
                  <option value="sem-informacao">Sem informação</option>
                  <option value="look-through">Look-through</option>
                  <option value="regulamento">Conforme regulamento</option>
                </Select>
              </div>
              <div>
                <Label>FPR (look-through) %</Label>
                <Input
                  type="number"
                  value={inputs.fundos.fprLookThrough}
                  onChange={(v) => setInputs((s) => ({ ...s, fundos: { ...s.fundos, fprLookThrough: Number(v) } }))}
                  placeholder="0–1250"
                />
              </div>
              <div>
                <Label>Subordinação?</Label>
                <Switch
                  checked={inputs.especiais.subordinado}
                  onChange={(v) => setInputs((s) => ({ ...s, especiais: { ...s.especiais, subordinado: v } }))}
                />
              </div>
            </Row>
            <Row>
              <div>
                <Label>Equity</Label>
                <Select
                  value={inputs.especiais.equity}
                  onChange={(v) => setInputs((s) => ({ ...s, especiais: { ...s.especiais, equity: v } }))}
                >
                  <option value="nao">Não</option>
                  <option value="250">250%</option>
                  <option value="1250">1.250%</option>
                </Select>
              </div>
              <div>
                <Label>Crédito tributário</Label>
                <Select
                  value={inputs.especiais.creditoTributario}
                  onChange={(v) => setInputs((s) => ({ ...s, especiais: { ...s.especiais, creditoTributario: v } }))}
                >
                  <option value="nao">Não</option>
                  <option value="100">100%</option>
                  <option value="600">600%</option>
                  <option value="1250">1.250%</option>
                </Select>
              </div>
              <div>
                <Label>Precatórios/recebíveis</Label>
                <Select
                  value={inputs.especiais.precatorioRecebiveis}
                  onChange={(v) => setInputs((s) => ({ ...s, especiais: { ...s.especiais, precatorioRecebiveis: v } }))}
                >
                  <option value="nao">Não</option>
                  <option value="100">100%</option>
                  <option value="600">600%</option>
                  <option value="1250">1.250%</option>
                </Select>
              </div>
            </Row>
            <Row>
              <div>
                <Label>CRM – Substituição por garantidor elegível?</Label>
                <Switch
                  checked={inputs.crm.substituicaoGarantidor}
                  onChange={(v) => setInputs((s) => ({ ...s, crm: { ...s.crm, substituicaoGarantidor: v } }))}
                />
              </div>
              <div>
                <Label>FPR do garantidor (%)</Label>
                <Input
                  type="number"
                  value={inputs.crm.fprGarantidor}
                  onChange={(v) => setInputs((s) => ({ ...s, crm: { ...s.crm, fprGarantidor: Number(v) } }))}
                  placeholder="ex.: 20"
                />
              </div>
              <div>
                <Label>Piso – caixa fora da posse direta?</Label>
                <Switch
                  checked={inputs.pisos.caixaForaPosseDireta}
                  onChange={(v) => setInputs((s) => ({ ...s, pisos: { ...s.pisos, caixaForaPosseDireta: v } }))}
                />
              </div>
            </Row>
          </Card>
        </div>

        {/* Coluna 2: Resultado */}
        <div className="grid gap-6">
          <Card title="Resultado" subtitle="FPR final e RWACPAD (se EAD informado)">
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-bold">{pct(fpr)}</div>
              <div className="text-neutral-500">FPR final</div>
            </div>
            <Helper>Classe base: <b>{classe}</b> {baseFpr !== fpr ? `(FPR base ${pct(baseFpr)})` : ""}</Helper>
            <div className="mt-4 grid gap-2">
              {rwacpad != null && (
                <div className="text-sm">
                  RWACPAD = EAD × FPR = {Number(inputs.ead).toLocaleString()} × {pct(fpr)} = <b>{rwacpad.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>
                </div>
              )}
            </div>
          </Card>

          <Card title="Trilha de decisão" subtitle="Explicação passo a passo">
            <ol className="list-decimal ml-5 grid gap-2">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Card>

          <Card title="Cenários de teste" subtitle="Carregue presets para validar a regra">
            <div className="grid gap-2">
              {Object.keys(SCENARIOS).map((k) => (
                <button
                  key={k}
                  className="rounded-xl border px-3 py-2 text-left hover:bg-white/5"
                  onClick={() => SCENARIOS[k](set)}
                >
                  {k}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Exportar/Compartilhar" subtitle="Copie as entradas atuais em JSON">
            <button
              className="rounded-xl border px-3 py-2 hover:bg-white/5"
              onClick={() => {
                const txt = JSON.stringify(inputs, null, 2);
                navigator.clipboard.writeText(txt);
                alert("JSON copiado para a área de transferência.");
              }}
            >
              Copiar JSON das entradas
            </button>
            <Helper>Você pode salvar o JSON como caso de teste e reimportar manualmente no código.</Helper>
          </Card>
        </div>
      </div>

      <footer className="mt-8 text-neutral-500 text-xs">
        MVP educacional. Ajuste as faixas/LTV conforme tabela oficial da 229. Integre haircuts de CRM no módulo de EAD, caso necessário.
      </footer>
    </div>
  );
}