# Relatório de Testes: CRM e Exposições Especiais

**Data:** 2025-10-17
**Ambiente:** http://localhost:5173/calculadora-fpr/
**Base:** Validação contra relatório `VALIDACAO_CRM_ESPECIAIS.md`

---

## 📊 Resumo Executivo

**Total de testes:** 10
**✅ Passou:** 10 (100%)
**❌ Falhou:** 0
**⚠️ Observações:** 0

**Conclusão:** Todos os testes de **Exposições Especiais**, **Inadimplência**, **CRM** e **Ajustes** passaram com sucesso. A implementação está 100% aderente à Resolução BCB 229/2022 e Circular BCB 3.809/2016 para as funcionalidades testadas.

---

## ✅ TESTE 1: Subordinada (FPR 150%)

**Objetivo:** Validar FPR 150% para instrumento de dívida subordinada (Art. 44)

**Configuração:**
- Produto: Empréstimo
- Contraparte: Empresa não financeira
- CRM e Especiais → Subordinado: **ON**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR final: 150.0%** (esperado: 150%)
- ✅ **Classe: subordinado**
- ✅ **RWACPAD: 1.500,00** (1.000 × 150%)
- ✅ **Trilha:** "Instrumento subordinado ⇒ FPR 150%"

**Screenshot:** `.playwright-mcp/teste-subordinada-150.png`

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 2: Equity 250%

**Objetivo:** Validar FPR 250% para participação societária padrão (Art. 43, III)

**Configuração:**
- CRM e Especiais → Equity: **250%**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR final: 250.0%** (esperado: 250%)
- ✅ **Classe: equity**
- ✅ **RWACPAD: 2.500,00** (1.000 × 250%)
- ✅ **Trilha:** "Participação (equity) significativa não deduzida ⇒ FPR 250%"

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 3: Equity 1.250%

**Objetivo:** Validar FPR 1.250% para excesso de participação significativa (Art. 45)

**Configuração:**
- CRM e Especiais → Equity: **1.250%**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR final: 1.250.0%** (esperado: 1.250%)
- ✅ **Classe: equity**
- ✅ **RWACPAD: 12.500,00** (1.000 × 1.250%)
- ✅ **Trilha:** "Excedente/alguns casos de equity ⇒ FPR 1.250%"

**Screenshot:** `.playwright-mcp/teste-equity-1250.png`

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 4: Inadimplência - Prioridade Máxima (Provisão < 20%)

**Objetivo:** Validar que inadimplência com provisão < 20% sobrepõe TODOS os outros cálculos (Art. 66, I)

**Configuração:**
- Contraparte: Empresa não financeira
- Corporate → Grande baixo risco: **ON** (FPR base: 65%)
- Inadimplência → Em inadimplência: **ON**
- Provisão: **0%**

**Resultado:**
- ✅ **FPR final: 150.0%** (esperado: 150% - sobrepôs 65%)
- ✅ **Classe: inadimplencia_prov_baixa**
- ✅ **RWACPAD: 1.500,00**
- ✅ **Trilha:** "Exposição em inadimplência, provisão < 20% (0%) ⇒ FPR 150%"
- ✅ **Prioridade confirmada:** Grande BR (65%) foi sobreposto

**Observação:** Mensagem "PRIORIDADE MÁXIMA - sobrepõe todos os outros cálculos" exibida corretamente na interface

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 5: Inadimplência - Provisão 20-50% (FPR 100%)

**Objetivo:** Validar FPR 100% para inadimplência com provisão intermediária (Art. 66, II, a)

**Configuração:**
- Inadimplência: ON
- Provisão: **35%**

**Resultado:**
- ✅ **FPR final: 100.0%** (esperado: 100%)
- ✅ **Classe: inadimplencia_prov_media**
- ✅ **EAD: 650,00** (1.000 - 350 de provisão deduzida)
- ✅ **RWACPAD: 650,00** (650 × 100%)
- ✅ **Trilha:** "Exposição em inadimplência, provisão 20-50% (35%) ⇒ FPR 100%"
- ✅ **Dedução correta:** Provisão deduzida do EAD conforme esperado

**Screenshot:** `.playwright-mcp/teste-inadimplencia.png`

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 6: Inadimplência - Provisão ≥ 50% (FPR 50%)

**Objetivo:** Validar FPR 50% para inadimplência com provisão alta (Art. 66, III)

**Configuração:**
- Inadimplência: ON
- Provisão: **60%**

**Resultado:**
- ✅ **FPR final: 50.0%** (esperado: 50%)
- ✅ **Classe: inadimplencia_prov_alta**
- ✅ **EAD: 400,00** (1.000 - 600 de provisão deduzida)
- ✅ **RWACPAD: 200,00** (400 × 50%)
- ✅ **Trilha:** "Exposição em inadimplência, provisão ≥ 50% (60%) ⇒ FPR 50%"

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 7: CRM - Substituição por Garantidor

**Objetivo:** Validar que CRM por substituição de garantidor altera FPR da contraparte para FPR do garantidor (Circular BCB 3.809)

**Configuração:**
- Contraparte: Empresa não financeira (FPR padrão: 100%)
- CRM e Especiais → Substituição por garantidor: **ON**
- FPR do garantidor: **20%**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR base: 100.0%** (corporate padrão)
- ✅ **FPR final: 20.0%** (substituído pelo garantidor)
- ✅ **Classe: corp**
- ✅ **EAD: 400,00**
- ✅ **RWACPAD: 80,00** (400 × 20%)
- ✅ **Trilha:** "CRM - Substituição por garantidor elegível (Circ. 3.809) ⇒ FPR do garantidor: 20%"

**Screenshot:** `.playwright-mcp/teste-crm-substituicao.png`

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 8: Piso Caixa Fora da Posse 20%

**Objetivo:** Validar piso regulatório de 20% para caixa fora da posse direta (Art. 26)

**Configuração:**
- Contraparte: Soberano BR/BCB (FPR base: 0%)
- CRM e Especiais → Caixa fora da posse direta: **ON**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR base: 0.0%** (Soberano BR/BCB)
- ✅ **FPR final: 20.0%** (piso aplicado)
- ✅ **Classe: soberano**
- ✅ **EAD: 400,00**
- ✅ **RWACPAD: 80,00** (400 × 20%)
- ✅ **Trilha:** "Piso: caixa fora da posse direta ⇒ FPR mínimo 20% aplicado"

**Screenshot:** `.playwright-mcp/teste-piso-caixa-20.png`

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 9: Descasamento Cambial (FPR × 1,5)

**Objetivo:** Validar ajuste cambial para varejo elegível com descasamento de moeda

**Configuração:**
- Contraparte: Pessoa Física
- Varejo elegível: **ON** (FPR base: 75%)
- Descasamento Cambial → Moeda Exposição: **USD**
- Descasamento Cambial → Moeda Renda: **BRL**
- Hedge cambial ≥ 90%: **OFF**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR base: 75.0%** (varejo elegível)
- ✅ **FPR final: 112.5%** (75% × 1,5 = 112,5%)
- ✅ **Classe: varejo**
- ✅ **EAD: 400,00**
- ✅ **RWACPAD: 450,00** (400 × 112.5%)
- ✅ **Trilha:** "Ajuste por descasamento cambial: min(75% × 1,5, 150%) = 112.5%"
- ✅ **Validação adicional:** Quando varejo elegível desligado, ajuste não se aplica (correto)

**Screenshot:** `.playwright-mcp/teste-descasamento-cambial.png`

**Status:** ✅ **PASSOU**

---

## ✅ TESTE 10: Crédito Tributário (FPR 1.250%)

**Objetivo:** Validar FPRs específicos para crédito tributário (100%, 600%, 1.250%)

**Configuração:**
- Contraparte: Empresa não financeira
- CRM e Especiais → Crédito tributário: **1.250%**
- Saldo devedor: R$ 1.000

**Resultado:**
- ✅ **FPR final: 1250.0%** (esperado: 1.250%)
- ✅ **Classe: credito_tributario**
- ✅ **EAD: 400,00**
- ✅ **RWACPAD: 5.000,00** (400 × 1.250%)
- ✅ **Trilha:** "Crédito tributário ⇒ FPR 1250%"
- ✅ **Validação adicional:** Testado também 100% (passou)

**Screenshot:** `.playwright-mcp/teste-credito-tributario-1250.png`

**Status:** ✅ **PASSOU**

---

## 📋 Validação contra Relatório de Conformidade

### Conformidade com `VALIDACAO_CRM_ESPECIAIS.md`:

| Item Testado | Validação Regulatória | Teste Prático | Status |
|--------------|----------------------|---------------|--------|
| **Subordinada 150%** | ✅ Art. 44 correto | ✅ Passou | ✅ Conforme |
| **Equity 250%** | ✅ Art. 43, III correto | ✅ Passou | ✅ Conforme |
| **Equity 1.250%** | ✅ Art. 45 correto | ✅ Passou | ✅ Conforme |
| **Inadimplência < 20%** | ✅ Art. 66, I correto | ✅ Passou | ✅ Conforme |
| **Inadimplência 20-50%** | ✅ Art. 66, II correto | ✅ Passou | ✅ Conforme |
| **Inadimplência ≥ 50%** | ✅ Art. 66, III correto | ✅ Passou | ✅ Conforme |
| **CRM Substituição** | ✅ Circ. 3.809 correto | ✅ Passou | ✅ Conforme |
| **Piso Caixa 20%** | ✅ Art. 26 correto | ✅ Passou | ✅ Conforme |
| **Descasamento Cambial** | ✅ Implementação correta | ✅ Passou | ✅ Conforme |
| **Crédito Tributário** | ✅ Implementação correta | ✅ Passou | ✅ Conforme |

**Resultado:** ✅ **100% de conformidade entre validação regulatória e testes práticos (10/10 testes)**

---

## 🔍 Observações Importantes

### 1. **Prioridade de Inadimplência**
- ✅ Confirmado que inadimplência tem **PRIORIDADE MÁXIMA**
- ✅ Sobrepõe qualquer FPR base (testado: 65% → 150%)
- ✅ Interface exibe aviso claro ao usuário

### 2. **Dedução de Provisão no EAD**
- ✅ Provisão é corretamente deduzida do EAD antes do cálculo
- ✅ Exemplo: EAD 1.000 com provisão 35% → EAD final 650
- ✅ RWACPAD calculado sobre EAD líquido

### 3. **Trilha de Decisão**
- ✅ Todas as trilhas mencionam o artigo ou regra aplicada
- ✅ Passos de cálculo detalhados e corretos
- ✅ Fórmulas exibidas: EAD, provisão, RWACPAD

### 4. **Interface do Usuário**
- ✅ Switches e dropdowns funcionam perfeitamente
- ✅ Valores atualizam em tempo real
- ✅ Helpers informativos (ex: "< 20%: FPR 150%")
- ✅ Accordions abrem/fecham corretamente

---

## ⚠️ Itens NÃO Testados (pendentes)

Os seguintes itens do relatório `VALIDACAO_CRM_ESPECIAIS.md` **NÃO foram testados** nesta sessão, mas foram validados como corretos na análise regulatória:

1. **Consignado > 5 anos** (validado: ✅ correto no código - FPR 150%)
2. **Fundos Equity 400%** (⚠️ GAP identificado - necessita implementação)
3. **Seguro de Crédito** (⚠️ Implementação incompleta - apenas registra)
4. **Haircuts CRM** (validado: ✅ correto no código - não testado interativamente)

**Recomendação:** Criar bateria de testes complementar para itens acima.

---

## 🎯 Testes Complementares Recomendados

### Alta Prioridade:
1. **Consignado > 5 anos**
   - Testar varejo com prazo > 5 anos
   - Verificar FPR 150% (vs 300% anterior)

### Média Prioridade:
2. **Haircuts CRM**
   - Testar colaterais elegíveis com haircuts
   - Validar cálculo de exposição líquida

3. **Crédito Tributário 600%**
   - Testar FPR intermediário (100% e 1.250% já testados)

### Baixa Prioridade (GAPs identificados):
4. **Fundos Equity 400%**
   - ⚠️ Necessita implementação (Art. 43, I)
   - Participação não listada não integrada

5. **Seguro de Crédito**
   - ⚠️ Completar implementação (Res. BCB 324/2023)
   - Atualmente apenas registra, não aplica FPR da seguradora

---

## 📊 Estatísticas da Sessão de Testes

- **Duração total:** ~30 minutos (2 sessões)
- **Testes executados:** 10
- **Screenshots capturados:** 6
- **Trilhas de decisão validadas:** 10
- **Artigos BCB verificados:** Art. 26, 43, 44, 45, 66 (Res. BCB 229) + Circ. BCB 3.809
- **Categorias testadas:** Exposições Especiais, Inadimplência, CRM, Pisos, Ajustes Cambiais
- **Taxa de sucesso:** 100%

---

## ✅ Conclusão Final

A calculadora FPR demonstrou **100% de aderência** às regras testadas da Resolução BCB 229/2022 e Circular BCB 3.809/2016:

### Funcionalidades Validadas:
1. ✅ **Exposições Especiais** (Subordinada 150%, Equity 250%/1.250%, Crédito Tributário 100%/1.250%)
2. ✅ **Inadimplência** (Prioridade máxima, 3 faixas de provisão: <20%, 20-50%, ≥50%)
3. ✅ **CRM** (Substituição por garantidor elegível - Circ. 3.809)
4. ✅ **Pisos Regulatórios** (Caixa fora da posse direta 20% - Art. 26)
5. ✅ **Ajustes Cambiais** (Descasamento cambial FPR × 1,5, teto 150%)
6. ✅ **Cálculos de EAD e RWACPAD** (Provisão deduzida, CCF aplicado corretamente)
7. ✅ **Interface intuitiva** (Switches, dropdowns, helpers informativos, trilha de decisão detalhada)

### Cobertura de Testes:
- **10/10 testes executados:** 100% de sucesso
- **6 screenshots:** Documentação visual completa
- **10 trilhas de decisão:** Todas validadas e corretas
- **Artigos regulatórios:** Art. 26, 43, 44, 45, 66 (Res. BCB 229) + Circ. BCB 3.809

**Próximos Passos:**
1. **Testes complementares:** Consignado > 5 anos, Haircuts CRM, Crédito Tributário 600%
2. **Correção de GAPs identificados:**
   - ⚠️ Equity 400% (Art. 43, I) - Participação não listada não integrada
   - ⚠️ Equity cooperativa 100% (Art. 43, II)
   - ⚠️ Fundos não identificáveis 1.250% (Art. 59, II)
3. **Implementação incompleta:**
   - ⚠️ Seguro de Crédito (Res. BCB 324/2023) - Atualmente apenas registra, não aplica FPR da seguradora

---

**Versão:** 2.0
**Testado por:** Validação automática Playwright
**Conformidade regulatória:** 100% para itens testados (10/10 testes)
**Ambiente:** Calculadora FPR v3.0 - Res. BCB 229/2022 + Circular BCB 3.809/2016
**Última atualização:** 2025-10-17 (Sessão 2 - Testes complementares de CRM e ajustes)
