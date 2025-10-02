# Análise de Precedência - Instituições Financeiras

## Problema Identificado

A implementação atual de cálculo de FPR para IFs usa **if-else em cascata**, o que significa que apenas UMA regra se aplica, seguindo uma precedência fixa.

### Implementação Atual (fpr-base.ts:246-285)

**Categoria A:**
```typescript
if (comercioExterior) return 20%;
else if (tier1LR) return 30%;
else if (netting) return 40%;
else if (prazo90) return 20%;
else return 40%; // prazo >90d
```

**Categoria B:**
```typescript
if (comercioExterior) return 50%;
else if (netting) return 75%;
else if (prazo90) return 50%;
else return 75%; // prazo >90d
```

---

## Cenários Problemáticos

### Cenário 1: Tier1/LR + Prazo ≤90d (Cat. A)
- **Atual**: 30% (usa Tier1/LR)
- **Problema**: Prazo ≤90d daria 20% (melhor para o banco)
- **Esperado**: 20%?

### Cenário 2: Netting + Prazo ≤90d (Cat. A)
- **Atual**: 40% (usa netting)
- **Problema**: Prazo ≤90d daria 20% (melhor para o banco)
- **Esperado**: 20%?

### Cenário 3: Netting + Prazo ≤90d (Cat. B)
- **Atual**: 75% (usa netting)
- **Problema**: Prazo ≤90d daria 50% (melhor para o banco)
- **Esperado**: 50%?

---

## Análise Regulatória

### Características das Regras

1. **Comércio Exterior** (Arts. 32, 34)
   - Tipo ESPECIAL de operação
   - FPR específico: A=20%, B=50%
   - **Natureza**: Categoria de operação

2. **Tier1 ≥14% e LR ≥5%** (Art. 33)
   - Característica de CAPITAL da IF
   - FPR: A=30%
   - **Natureza**: Qualidade da contraparte

3. **Netting elegível** (Arts. 32, 34)
   - Mecanismo de COMPENSAÇÃO
   - FPR: A=40%, B=75%
   - **Natureza**: Mitigador de risco

4. **Prazo** (Arts. 32-35)
   - Característica temporal da operação
   - FPR: A (≤90d=20%, >90d=40%), B (≤90d=50%, >90d=75%)
   - **Natureza**: Atributo base da operação

---

## Precedência Proposta

### Opção 1: Comércio Exterior + Menor FPR dos outros ⭐ RECOMENDADA

**Lógica:**
```typescript
// 1. Comércio exterior tem PRIORIDADE MÁXIMA
if (comercioExterior) {
  return FPR_comercioExterior;
}

// 2. Entre os outros, aplicar o MENOR FPR (mais favorável)
const candidatos = [];

if (tier1LR) candidatos.push(FPR_tier1LR);
if (netting) candidatos.push(FPR_netting);

// Prazo é BASE
if (prazo90) {
  candidatos.push(FPR_prazo90);
} else {
  candidatos.push(FPR_prazoMaior90);
}

return Math.min(...candidatos);
```

**Justificativa:**
- Comércio exterior é categoria regulatória especial
- Regulação bancária normalmente aplica tratamento mais favorável quando aplicável
- Consistente com princípio de mitigação de risco

**Resultados:**
- Tier1/LR (30%) + Prazo≤90d (20%) = **20%** ✅
- Netting (40%) + Prazo≤90d (20%) = **20%** ✅
- Comércio ext. (20%) + qualquer = **20%** ✅

---

### Opção 2: Precedência Hierárquica Estrita

**Lógica:**
```typescript
// Ordem fixa conforme Arts. 32-35
if (comercioExterior) return FPR_comercioExterior;
if (tier1LR) return FPR_tier1LR;
if (prazo90) return FPR_prazo90;
if (netting) return FPR_netting;
return FPR_prazoMaior90;
```

**Problema:** Sem acesso à redação exata da Res. BCB 229/2022 Arts. 32-35, não podemos confirmar esta ordem.

---

## Recomendação

**Implementar Opção 1** até termos acesso à regulação para confirmar precedência exata.

**Motivos:**
1. ✅ Mais conservadora (favorece o banco)
2. ✅ Lógica consistente com regulação bancária
3. ✅ Resolve todos os cenários problemáticos
4. ✅ Comércio exterior mantém prioridade (confirmado)

---

## Ação Necessária

1. ✅ Cenários de teste criados (scenarios.ts)
2. ✅ Confirmado com Res. BCB 229/2022 Arts. 32-35
3. ✅ Implementado correção em fpr-base.ts (linhas 246-315)
4. ⏳ Validar cenários de teste através da interface

## Implementação Realizada

### Mudança em fpr-base.ts:246-315

**Categoria A:**
```typescript
// 1º) Comércio exterior SEMPRE tem prioridade (FPR 20%)
if (comercioExteriorAte1Ano) return 20%;

// 2º) Para demais características, aplicar o MENOR FPR (mais favorável)
const candidatos = [];
// Prazo é base
if (prazo90) candidatos.push(20);
else candidatos.push(40);
// Tier1/LR como mitigador
if (tier1High && lrHigh) candidatos.push(30);
// Netting como mitigador
if (nettingElegivel) candidatos.push(40);

return Math.min(...candidatos);
```

**Categoria B:**
```typescript
// 1º) Comércio exterior SEMPRE tem prioridade (FPR 50%)
if (comercioExteriorAte1Ano) return 50%;

// 2º) Para demais características, aplicar o MENOR FPR (mais favorável)
const candidatos = [];
if (prazo90) candidatos.push(50);
else candidatos.push(75);
if (nettingElegivel) candidatos.push(75);

return Math.min(...candidatos);
```

**Resultados Esperados:**
- ✅ Tier1/LR (30%) + Prazo≤90d (20%) = **20%** (antes: 30%)
- ✅ Netting (40%) + Prazo≤90d (20%) = **20%** (antes: 40%)
- ✅ Netting (75%) + Prazo≤90d (50%) Cat B = **50%** (antes: 75%)
- ✅ Comércio ext. + qualquer = **20%/50%** (mantém prioridade)

---

## Referências

- Res. BCB 229/2022, Arts. 31-36 (Instituições Financeiras)
- Res. BCB 229/2022, Art. 32 (Cat. A)
- Res. BCB 229/2022, Art. 33 (Tier1/LR)
- Res. BCB 229/2022, Art. 34 (Cat. B)
- Res. BCB 229/2022, Arts. 35-36 (Cat. C)
