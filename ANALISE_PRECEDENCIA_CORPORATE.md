# Análise de Precedência - Corporate / Empresa Não Financeira

## Problema Identificado

A implementação atual de cálculo de FPR para Corporate usa **if-else em cascata**, similar ao problema identificado em IF.

### Implementação Atual (fpr-base.ts:446-503)

```typescript
function calcularCorporate(...) {
  // Grande baixo risco: 65%
  if (corporate.grandeBaixoRisco) return 65%;

  // PME: 85%
  if (corporate.pme) return 85%;

  // Financiamento objeto/commodities: 100%
  if (corporate.financiamento === "objeto" || === "commodities") return 100%;

  // Project finance: 130%
  if (corporate.financiamento === "project") return 130%;

  // Default: 100%
  return 100%;
}
```

---

## Cenários Problemáticos

### Cenário 1: PME + Project Finance
- **Atual**: 85% (PME tem precedência)
- **Problema**: Project finance deveria dar 130%?
- **Regulação**: PME pode ter project finance?

### Cenário 2: Grande Baixo Risco + Project Finance
- **Atual**: 65% (Grande BR tem precedência)
- **Problema**: Project finance deveria dar 130%?

### Cenário 3: PME + Financiamento de Objeto
- **Atual**: 85% (PME tem precedência)
- **Problema**: Ambos dão 100% na média, mas significados diferentes

---

## Análise Regulatória (Arts. 35-41)

### Características da CONTRAPARTE (tamanho/qualidade)

**Art. 35 - Grande de Baixo Risco (FPR 65%)**
- Receita ≥ R$ 15bi OU ativo ≥ R$ 240MM + receita ≥ R$ 300MM
- Rating adequado
- ID ≤ 0,05% no SCR
- Ações listadas em bolsa
- **Natureza**: Qualidade creditícia da empresa

**Art. 36 - PME (FPR 85%)**
- Ativo < R$ 240MM E receita < R$ 300MM
- **Natureza**: Tamanho da empresa

**Art. 41 - Demais (FPR 100%)**
- **Natureza**: Default

### Características da OPERAÇÃO (estrutura de pagamento)

**Art. 37 - Financiamento de Objeto/Commodities (FPR 100%)**
- Pagamento depende das **rendas do bem/commodity**
- Garantia é o próprio bem
- Tomador não tem outros recursos
- **Natureza**: Estrutura da operação

**Art. 38 - Project Finance (FPR 130%)**
- Pagamento depende das **rendas do projeto**
- Garantia são as rendas do projeto
- Tomador não tem outros recursos
- **Natureza**: Estrutura da operação

**Arts. 39-40 - Project Finance Operacional**
- FPR 100% (fase operacional básica)
- FPR 80% (alta qualidade operacional)
- **Natureza**: Fase + qualidade do projeto

---

## Diferença Fundamental vs. IF

### IF (Instituições Financeiras)
- Todas características eram da **OPERAÇÃO**:
  - Prazo (≤90d vs >90d)
  - Tier1/LR (características de capital da IF)
  - Netting (mecanismo de compensação)
  - Comércio exterior (tipo de operação)
- **Solução**: Math.min() - menor FPR aplicável

### Corporate
- **CONTRAPARTE**: Grande BR (65%), PME (85%), Default (100%)
- **OPERAÇÃO**: Financiamento especializado (100-130%)
- Características são **ORTOGONAIS** (independentes)

---

## Interpretação Regulatória

### Análise Lógica

1. **Financiamentos Especializados** definem FPR pela estrutura de risco da operação
2. Uma PME **pode** fazer project finance
3. Uma grande empresa **pode** fazer project finance
4. A estrutura da operação cria um perfil de risco específico

### Precedência Regulatória Correta ⭐

**Conclusão: Financiamentos Especializados têm PRIORIDADE**

**Motivo:**
- Arts. 37-40 definem FPR pela estrutura de pagamento/garantias
- Quando o pagamento depende exclusivamente do projeto/bem, o risco é diferente
- O tamanho da contraparte se torna secundário
- A regulação coloca financiamentos especializados em seção separada (Arts. 37-40)

**Ordem de Precedência:**
1. **Financiamentos Especializados** (Arts. 37-40) → FPR específico pela estrutura
2. **Grande Baixo Risco** (Art. 35) → 65%
3. **PME** (Art. 36) → 85%
4. **Demais** (Art. 41) → 100%

---

## Implementação Correta

```typescript
function calcularCorporate(...) {
  if (contraparte !== "corporate") return null;

  // 1º) Financiamentos Especializados TÊM PRIORIDADE
  //     (estrutura da operação define o risco)

  if (corporate.financiamento === "project") {
    steps.push("Project finance ⇒ FPR 130%");
    return { fpr: 130, classe: "corp_project" };
  }

  if (corporate.financiamento === "objeto" ||
      corporate.financiamento === "commodities") {
    steps.push("Financiamento especializado (objeto/commodities) ⇒ FPR 100%");
    return { fpr: 100, classe: "corp_fin_esp" };
  }

  // 2º) Se NÃO for financiamento especializado,
  //     avaliar características da CONTRAPARTE

  if (corporate.grandeBaixoRisco) {
    // validações...
    steps.push("Corporate grande de baixo risco ⇒ FPR 65%");
    return { fpr: 65, classe: "corp_grande_baixo_risco" };
  }

  if (corporate.pme) {
    const receita = corporate.receitaAnual;
    if (receita && receita > 300_000_000) {
      steps.push("⚠️ PME com receita > R$ 300MM - não elegível. Usando FPR padrão 100%");
      return { fpr: 100, classe: "corp" };
    }
    steps.push("PME (receita ≤ R$ 300MM) ⇒ FPR 85%");
    return { fpr: 85, classe: "corp_pme" };
  }

  // 3º) Default
  steps.push("Demais empresas não financeiras ⇒ FPR 100%");
  return { fpr: 100, classe: "corp" };
}
```

---

## Resultados Esperados

### Com Precedência Correta

| Cenário | Atual | Correto | Mudança |
|---------|-------|---------|---------|
| PME + Project Finance | 85% | **130%** | ✅ Mudou |
| Grande BR + Project Finance | 65% | **130%** | ✅ Mudou |
| PME + Fin. Objeto | 85% | **100%** | ✅ Mudou |
| Grande BR + Fin. Objeto | 65% | **100%** | ✅ Mudou |
| PME sozinho | 85% | 85% | ✓ OK |
| Grande BR sozinho | 65% | 65% | ✓ OK |
| Project Finance sozinho | 130% | 130% | ✓ OK |

---

## Ação Necessária

1. ✅ Análise regulatória concluída
2. ⏳ Implementar correção em `fpr-base.ts` (linhas 446-503)
3. ⏳ Adicionar cenários de teste em `scenarios.ts`
4. ⏳ Validar através da interface

---

## Diferença da Solução vs. IF

**IF**: Usamos `Math.min()` porque todas características eram mitigadores/atributos da operação que podiam coexistir.

**Corporate**: Usamos **precedência hierárquica** porque:
- Financiamentos especializados definem estrutura de risco específica
- Características de contraparte são secundárias neste caso
- A regulação separa claramente "tipo de operação" vs "tipo de contraparte"

---

## Referências

- Res. BCB 229/2022, Art. 35 (Grande Baixo Risco - 65%)
- Res. BCB 229/2022, Art. 36 (PME - 85%)
- Res. BCB 229/2022, Art. 37 (Fin. Objeto/Commodities - 100%)
- Res. BCB 229/2022, Art. 38 (Project Finance - 130%)
- Res. BCB 229/2022, Arts. 39-40 (Project Finance Operacional)
- Res. BCB 229/2022, Art. 41 (Demais - 100%)
