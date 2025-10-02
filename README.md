# Calculadora FPR - Res. BCB 229/2022

Calculadora de Fator de Ponderação de Risco (FPR) conforme Resolução BCB 229/2022, Circular BCB 3.809/2016 e atualizações regulatórias 2024-2025.

## Funcionalidades

### Implementado ✅

- **FPR por classe de ativo/contraparte**
  - ✅ Soberanos (BR, estrangeiro, BNDES)
  - ✅ Setor Público (Estados, Municípios, DF, PSP, Estatais)
  - ✅ Instituições Financeiras (categorias A/B/C)
  - ✅ Corporate (grande baixo risco com validação receita/rating, PME com validação R$ 300MM, project finance)
  - ✅ Varejo PF (elegível R$ 5MM, transactor, consignado >5 anos)
  - ✅ Crédito Imobiliário (residencial/não residencial, LTV, obra em andamento por ano)
  - ✅ Derivativos (CCR)
  - ✅ Fundos (look-through e mandato: equity/renda fixa/misto)
  - ✅ Outras Exposições (caixa, ouro, ações listadas/não listadas, ativos fixos)
  - ✅ Ativos em Inadimplência (por nível de provisão: <20%, 20-50%, ≥50%)

- **EAD (Exposure at Default)**
  - Cálculo: EAD = Saldo + (CCF × Limite)
  - Fatores de Conversão de Crédito (CCF) diferenciados
  - Linhas revogáveis/irrevogáveis
  - Garantias prestadas
  - Comércio exterior

- **Haircuts e CRM**
  - Abordagem abrangente (Comprehensive Approach)
  - Haircut de colateral (Hc)
  - Haircut cambial (Hfx - 8%)
  - Haircut de exposição (He)
  - Substituição por garantidor
  - Seguro de crédito (Res. BCB 324/2023)

- **Ajustes e Pisos**
  - Descasamento cambial (varejo/residencial: 1,5x, máx 150%)
  - Piso caixa fora da posse (20%)
  - Sanitização (0% - 1250%)

- **Atualizações 2024-2025**
  - ✅ BNDES tratado como soberano (FPR 0%)
  - ✅ Limite varejo aumentado para R$ 5MM (antes R$ 3MM)
  - ✅ Consignado > 5 anos (FPR 150% vs 300% anterior)
  - ✅ Obra em andamento: contratos ≤2023 (FPR 50%), contratos 2024+ (FPR 150%)
  - ✅ Ajuste negativo em PL (Res. 452/2025 - FPR 100%)
  - ✅ Validações PME (receita ≤ R$ 300MM)
  - ✅ Validações grande baixo risco (receita ≥ R$ 15bi + rating ≥ BB-)

### Calculado Automaticamente
- **RWACPAD** = EAD × FPR
- Trilha de decisão completa com todos os passos

## Arquitetura

### Princípios Aplicados

**SOLID**
- **S**ingle Responsibility: cada módulo tem uma responsabilidade
- **O**pen/Closed: extensível via estratégias
- **L**iskov Substitution: interfaces consistentes
- **I**nterface Segregation: interfaces específicas
- **D**ependency Inversion: orquestrador coordena dependências

**DRY** (Don't Repeat Yourself)
- Constantes centralizadas
- Componentes UI reutilizáveis
- Utilitários compartilhados

### Estrutura de Arquivos

```
src/
├── types/
│   └── index.ts              # Definições TypeScript
├── constants/
│   ├── fpr-rates.ts          # Taxas FPR por classe
│   ├── haircuts.ts           # Fatores de haircut
│   ├── ccf-factors.ts        # Fatores de conversão
│   └── scenarios.ts          # Cenários de teste
├── calculators/
│   ├── fpr-base.ts           # Calculadora FPR base (SRP)
│   ├── ead-calculator.ts     # Calculadora EAD (SRP)
│   ├── haircut-calculator.ts # Calculadora haircuts (SRP)
│   ├── adjustments.ts        # Ajustes (cambial, CRM, pisos)
│   └── index.ts              # Orquestrador principal
├── utils/
│   ├── formatters.ts         # Formatação reutilizável
│   └── validators.ts         # Validações
├── components/
│   └── ui/
│       └── index.tsx         # Componentes UI (DRY)
├── hooks/
│   └── useFPRCalculator.ts   # Hook customizado
└── App.tsx                    # Aplicação principal
```

## Como Usar

### Desenvolvimento

```bash
npm install
npm run dev
```

### Uso Programático

```typescript
import { calculateFPRComplete } from './calculators';
import { FPRInputs } from './types';

const inputs: FPRInputs = {
  produto: "emprestimo",
  contraparte: "corporate",
  // ... outros campos
};

const result = calculateFPRComplete(inputs);
// result.fpr: FPR final
// result.rwacpad: RWACPAD calculado
// result.steps: trilha de decisão
```

### Cenários de Teste (30+)

A aplicação inclui cenários pré-configurados organizados por categoria:

**Básicos:**
- PF transactor (cartão) → 45%
- Corporate grande baixo risco → 65%
- PME → 85%
- IF categoria A ≤90d → 20%
- BNDES → 0%
- Soberano BR → 0%

**Novas Exposições:**
- Caixa → 0%
- Ouro → 0%
- Ações listadas → 250%
- Ações não listadas → 400%

**Inadimplência:**
- Provisão 15% → 150%
- Provisão 30% → 100%
- Provisão 60% → 50%

**Setor Público:**
- Estado sem rating → 100%
- Município com rating A+ → 20%

**Imobiliário:**
- Obra andamento contrato 2023 → 50%
- Obra andamento contrato 2024+ → 150%
- LTV 25% com descasamento cambial

**Corporate:**
- PME receita R$ 250MM → 85%
- PME receita R$ 400MM (inelegível) → 100%

**Consignado:**
- Prazo 7 anos → 150%

**Fundos:**
- Equity (mandato) → 400%
- Renda Fixa (mandato) → 100%

**E mais...**

## Regulamentação

- **Resolução BCB 229/2022**: FPR e RWACPAD
- **Circular BCB 3.809/2016**: CRM e haircuts
- **Resolução BCB 324/2023**: Seguro de crédito
- **Resolução BCB 447/2024**: Alterações diversas
- **Resolução BCB 452/2025**: Ajuste negativo em PL
- **Basileia III**: Padrões internacionais

## Limitações e TODOs

### Não Implementado (Baixa Prioridade)
- ❌ SA-CCR/CEM completo para derivativos (apenas FPR da contraparte)
- ❌ CVA (Res. BCB 291/2023) - risco de ajuste de valor
- ❌ Securitização completa (rating-based approach)
- ❌ Risco de liquidação
- ❌ Abordagem IRB (modelos internos)

### Próximos Passos
- 📝 Testes unitários automatizados
- ✅ Validação com casos regulatórios
- 📊 Exportação para Excel/PDF
- 🌐 API REST

## Contribuição

Ao contribuir:
1. Mantenha princípios SOLID e DRY
2. Adicione testes para novos recursos
3. Atualize documentação
4. Cite fonte regulatória

## Licença

MIT

## Aviso Legal

Esta calculadora é educacional. Para uso regulatório, consulte advogados e especialistas. Os valores podem divergir de interpretações oficiais do BCB.
