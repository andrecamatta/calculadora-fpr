import { useState } from "react";
import { FPRInputs } from "./types";
import { useFPRCalculator, useInitialInputs } from "./hooks/useFPRCalculator";
import { applyScenario, getScenarioNames } from "./constants/scenarios";
import { formatPercent, formatCurrency } from "./utils/formatters";
import { TOOLTIPS } from "./constants/tooltipDefinitions";
import {
  Row,
  Card,
  Select,
  Input,
  Switch,
  Button,
  FieldGroup,
  Helper,
} from "./components/ui";

/**
 * Calculadora de FPR - Res. BCB 229
 * Refatorada com SOLID e DRY
 */
export default function App() {
  const initialInputs = useInitialInputs();
  const [inputs, setInputs] = useState<FPRInputs>(initialInputs);

  // Hook que calcula FPR automaticamente quando inputs mudam
  const result = useFPRCalculator(inputs);

  // Helpers para atualizar inputs
  const updateField = <K extends keyof FPRInputs>(
    field: K,
    value: FPRInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const updateNested = <K extends keyof FPRInputs>(
    parent: K,
    field: keyof NonNullable<FPRInputs[K]>,
    value: any
  ) => {
    setInputs((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] as object), [field]: value },
    }));
  };

  // Carrega cenário de teste
  const loadScenario = (scenarioName: string) => {
    const newInputs = applyScenario(initialInputs, scenarioName);
    setInputs(newInputs);
  };

  // Exporta inputs como JSON
  const exportJSON = () => {
    const json = JSON.stringify(inputs, null, 2);
    navigator.clipboard.writeText(json);
    alert("JSON copiado para área de transferência");
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-sm">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">
          Calculadora FPR - Res. BCB 229/2022
        </h1>
        <p className="text-neutral-600 mt-2">
          Calcula Fator de Ponderação de Risco (FPR), EAD e RWACPAD. Implementa
          Res. BCB 229, Circular 3.809 e atualizações 2024-2025.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Formulários */}
        <div className="lg:col-span-2 grid gap-6">
          {/* Identificação */}
          <Card title="Identificação" subtitle="Produto, contraparte e moeda">
            <Row>
              <FieldGroup label="Produto" tooltip={TOOLTIPS.produto}>
                <Select
                  value={inputs.produto}
                  onChange={(v: any) => updateField("produto", v)}
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
              </FieldGroup>

              <FieldGroup label="Contraparte" tooltip={TOOLTIPS.contraparte}>
                <Select
                  value={inputs.contraparte}
                  onChange={(v: any) => updateField("contraparte", v)}
                >
                  <option value="corporate">Empresa não financeira</option>
                  <option value="pf">Pessoa Física</option>
                  <option value="if">Instituição Financeira</option>
                  <option value="soberano_br">Soberano BR/BCB</option>
                  <option value="bndes">BNDES</option>
                  <option value="soberano_estrangeiro">
                    Soberano estrangeiro
                  </option>
                  <option value="setor_publico">Setor Público</option>
                </Select>
              </FieldGroup>

              <FieldGroup label="Moeda Exposição" tooltip={TOOLTIPS.moedaExposicao}>
                <Select
                  value={inputs.moedaExposicao}
                  onChange={(v: any) => updateField("moedaExposicao", v)}
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="Outra">Outra</option>
                </Select>
              </FieldGroup>
            </Row>

            <Row>
              <FieldGroup label="Moeda Renda" tooltip={TOOLTIPS.moedaRenda}>
                <Select
                  value={inputs.moedaRenda}
                  onChange={(v: any) => updateField("moedaRenda", v)}
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="Outra">Outra</option>
                </Select>
              </FieldGroup>

              <FieldGroup label="Hedge cambial ≥ 90%?" tooltip={TOOLTIPS.hedge90}>
                <Switch
                  checked={inputs.hedge90}
                  onChange={(v) => updateField("hedge90", v)}
                />
              </FieldGroup>
            </Row>
          </Card>

          {/* Inadimplência - PRIORIDADE MÁXIMA */}
          <Card title="Inadimplência / Ativos Problemáticos">
            <Row>
              <FieldGroup label="Em inadimplência?" tooltip={TOOLTIPS.inadimplencia}>
                <Switch
                  checked={inputs.inadimplencia.emInadimplencia}
                  onChange={(v) =>
                    updateNested("inadimplencia", "emInadimplencia", v)
                  }
                />
                <Helper>PRIORIDADE MÁXIMA - sobrepõe todos os outros cálculos</Helper>
              </FieldGroup>

              {inputs.inadimplencia.emInadimplencia && (
                <FieldGroup label="Provisão (%)" tooltip={TOOLTIPS.provisao}>
                  <Input
                    type="number"
                    value={inputs.inadimplencia.provisaoPercentual}
                    onChange={(v) =>
                      updateNested("inadimplencia", "provisaoPercentual", Number(v))
                    }
                    placeholder="0-100"
                  />
                  <Helper>
                    &lt;20%: FPR 150% | 20-50%: FPR 100% | ≥50%: FPR 50%
                  </Helper>
                </FieldGroup>
              )}
            </Row>
          </Card>

          {/* Corporate */}
          {inputs.contraparte === "corporate" && (
            <Card title="Corporate / Empresa Não Financeira">
              <Row>
                <FieldGroup label="Grande baixo risco" tooltip={TOOLTIPS.grandeBaixoRisco}>
                  <Switch
                    checked={inputs.corporate.grandeBaixoRisco}
                    onChange={(v) =>
                      updateNested("corporate", "grandeBaixoRisco", v)
                    }
                  />
                  <Helper>Receita ≥ R$ 15bi + rating ≥ BB-</Helper>
                </FieldGroup>

                <FieldGroup label="PME" tooltip={TOOLTIPS.pme}>
                  <Switch
                    checked={inputs.corporate.pme}
                    onChange={(v) => updateNested("corporate", "pme", v)}
                  />
                  <Helper>Receita ≤ R$ 300MM</Helper>
                </FieldGroup>

                <FieldGroup label="Financiamento especializado" tooltip={TOOLTIPS.financiamentoEspecializado}>
                  <Select
                    value={inputs.corporate.financiamento}
                    onChange={(v) => updateNested("corporate", "financiamento", v)}
                  >
                    <option value="nenhum">Nenhum</option>
                    <option value="objeto">Objeto específico</option>
                    <option value="commodities">Commodities</option>
                    <option value="project">Project finance</option>
                  </Select>
                </FieldGroup>
              </Row>

              <Row>
                <FieldGroup label="Receita anual (R$)" tooltip={TOOLTIPS.receitaAnual}>
                  <Input
                    type="number"
                    value={inputs.corporate.receitaAnual ?? ""}
                    onChange={(v) =>
                      updateNested("corporate", "receitaAnual", v ? Number(v) : undefined)
                    }
                    placeholder="Ex: 250000000"
                  />
                  <Helper>Para validação PME/Grande baixo risco</Helper>
                </FieldGroup>

                <FieldGroup label="Rating" tooltip={TOOLTIPS.ratingCorporate}>
                  <Select
                    value={inputs.corporate.rating ?? ""}
                    onChange={(v) =>
                      updateNested("corporate", "rating", v || undefined)
                    }
                  >
                    <option value="">Sem rating</option>
                    <option value="AAA_AA-">AAA a AA-</option>
                    <option value="A+_A-">A+ a A-</option>
                    <option value="BBB+_BBB-">BBB+ a BBB-</option>
                    <option value="BB+_B-">BB+ a B-</option>
                    <option value="inferior_B-">Inferior a B-</option>
                  </Select>
                  <Helper>Para validação Grande baixo risco</Helper>
                </FieldGroup>
              </Row>
            </Card>
          )}

          {/* Varejo */}
          {inputs.contraparte === "pf" && (
            <Card title="Varejo / Pessoa Física">
              <Row>
                <FieldGroup label="Varejo elegível" tooltip={TOOLTIPS.varejoElegivel}>
                  <Switch
                    checked={inputs.varejo.elegivel}
                    onChange={(v) => updateNested("varejo", "elegivel", v)}
                  />
                  <Helper>Total exposição ≤ R$ 5MM (atualização 2024)</Helper>
                </FieldGroup>

                <FieldGroup label="Transactor (360d)" tooltip={TOOLTIPS.transactor}>
                  <Switch
                    checked={inputs.varejo.transactor}
                    onChange={(v) => updateNested("varejo", "transactor", v)}
                  />
                </FieldGroup>

                <FieldGroup label="Linha sem saques 360d" tooltip={TOOLTIPS.linhaSemSaques}>
                  <Switch
                    checked={inputs.varejo.linhaSemSaques360}
                    onChange={(v) =>
                      updateNested("varejo", "linhaSemSaques360", v)
                    }
                  />
                </FieldGroup>
              </Row>

              <Row>
                <FieldGroup label="Consignado - prazo (anos)" tooltip={TOOLTIPS.consignadoPrazo}>
                  <Input
                    type="number"
                    value={inputs.varejo.consignadoPrazoAnos ?? ""}
                    onChange={(v) =>
                      updateNested("varejo", "consignadoPrazoAnos", v ? Number(v) : undefined)
                    }
                    placeholder="Ex: 7"
                  />
                  <Helper>Se &gt; 5 anos: FPR 150% (vs 300% anterior)</Helper>
                </FieldGroup>
              </Row>
            </Card>
          )}

          {/* Imobiliário */}
          {inputs.produto === "credito_imobiliario" && (
            <Card title="Crédito Imobiliário">
              <Row>
                <FieldGroup label="Tipo de imóvel" tooltip={TOOLTIPS.tipoImovel}>
                  <Select
                    value={inputs.imobiliario.tipo}
                    onChange={(v) => updateNested("imobiliario", "tipo", v)}
                  >
                    <option value="residencial">Residencial</option>
                    <option value="nao_residencial">Não residencial</option>
                  </Select>
                </FieldGroup>

                <FieldGroup label="Dependência do fluxo" tooltip={TOOLTIPS.dependenciaFluxo}>
                  <Switch
                    checked={inputs.imobiliario.dependenciaFluxo}
                    onChange={(v) =>
                      updateNested("imobiliario", "dependenciaFluxo", v)
                    }
                  />
                </FieldGroup>

                <FieldGroup label="LTV (%)" tooltip={TOOLTIPS.ltv}>
                  <Input
                    type="number"
                    value={inputs.imobiliario.ltv}
                    onChange={(v) => updateNested("imobiliario", "ltv", Number(v))}
                    placeholder="0-200"
                  />
                </FieldGroup>
              </Row>

              <Row>
                <FieldGroup label="Garantia elegível" tooltip={TOOLTIPS.garantiaElegivel}>
                  <Switch
                    checked={inputs.imobiliario.garantiaElegivel}
                    onChange={(v) =>
                      updateNested("imobiliario", "garantiaElegivel", v)
                    }
                  />
                </FieldGroup>

                <FieldGroup label="Imóvel concluído" tooltip={TOOLTIPS.imovelConcluido}>
                  <Switch
                    checked={inputs.imobiliario.imovelConcluido}
                    onChange={(v) =>
                      updateNested("imobiliario", "imovelConcluido", v)
                    }
                  />
                </FieldGroup>
              </Row>

              {!inputs.imobiliario.imovelConcluido && (
                <Row>
                  <FieldGroup label="Contrato até 2023" tooltip={TOOLTIPS.contratoAte2023}>
                    <Switch
                      checked={inputs.imobiliario.contratoAte2023 ?? false}
                      onChange={(v) =>
                        updateNested("imobiliario", "contratoAte2023", v)
                      }
                    />
                    <Helper>Obra em andamento: FPR 50%</Helper>
                  </FieldGroup>

                  <FieldGroup label="Contrato após 2024" tooltip={TOOLTIPS.contratoApos2024}>
                    <Switch
                      checked={inputs.imobiliario.contratoApos2024 ?? false}
                      onChange={(v) =>
                        updateNested("imobiliario", "contratoApos2024", v)
                      }
                    />
                    <Helper>Obra em andamento: FPR 150%</Helper>
                  </FieldGroup>
                </Row>
              )}
            </Card>
          )}

          {/* IF */}
          {inputs.contraparte === "if" && (
            <Card title="Instituições Financeiras">
              <Row>
                <FieldGroup label="Categoria" tooltip={TOOLTIPS.categoriaIF}>
                  <Select
                    value={inputs.ifinfo.categoria}
                    onChange={(v) => updateNested("ifinfo", "categoria", v)}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </Select>
                </FieldGroup>

                <FieldGroup label="Prazo ≤ 90 dias" tooltip={TOOLTIPS.prazo90}>
                  <Switch
                    checked={inputs.ifinfo.prazo90}
                    onChange={(v) => updateNested("ifinfo", "prazo90", v)}
                  />
                </FieldGroup>

                <FieldGroup label="Tier1 ≥ 14% e LR ≥ 5%" tooltip={TOOLTIPS.tier1LR}>
                  <Switch
                    checked={inputs.ifinfo.tier1High && inputs.ifinfo.lrHigh}
                    onChange={(v) => {
                      updateNested("ifinfo", "tier1High", v);
                      updateNested("ifinfo", "lrHigh", v);
                    }}
                  />
                </FieldGroup>
              </Row>

              <Row>
                <FieldGroup label="Comércio exterior ≤ 1 ano" tooltip={TOOLTIPS.comercioExterior}>
                  <Switch
                    checked={inputs.ifinfo.comercioExteriorAte1Ano}
                    onChange={(v) =>
                      updateNested("ifinfo", "comercioExteriorAte1Ano", v)
                    }
                  />
                </FieldGroup>

                <FieldGroup label="Netting elegível" tooltip={TOOLTIPS.nettingElegivel}>
                  <Switch
                    checked={inputs.ifinfo.nettingElegivel}
                    onChange={(v) => updateNested("ifinfo", "nettingElegivel", v)}
                  />
                </FieldGroup>
              </Row>
            </Card>
          )}

          {/* Setor Público */}
          {inputs.contraparte === "setor_publico" && (
            <Card title="Setor Público">
              <Row>
                <FieldGroup label="Tipo" tooltip={TOOLTIPS.tipoSetorPublico}>
                  <Select
                    value={inputs.setorPublico.tipo}
                    onChange={(v) => updateNested("setorPublico", "tipo", v)}
                  >
                    <option value="estado">Estado</option>
                    <option value="municipio">Município</option>
                    <option value="df">Distrito Federal</option>
                    <option value="psp">Prestador Serviço Público</option>
                    <option value="estatal">Empresa Estatal</option>
                  </Select>
                </FieldGroup>

                <FieldGroup label="Rating (opcional)" tooltip={TOOLTIPS.ratingSetorPublico}>
                  <Select
                    value={inputs.setorPublico.rating ?? ""}
                    onChange={(v) =>
                      updateNested("setorPublico", "rating", v || undefined)
                    }
                  >
                    <option value="">Sem rating (FPR 100%)</option>
                    <option value="AAA_AA-">AAA a AA-</option>
                    <option value="A+_A-">A+ a A-</option>
                    <option value="BBB+_BBB-">BBB+ a BBB-</option>
                    <option value="BB+_B-">BB+ a B-</option>
                    <option value="inferior_B-">Inferior a B-</option>
                  </Select>
                  <Helper>Com rating, aplica FPR soberano</Helper>
                </FieldGroup>
              </Row>
            </Card>
          )}

          {/* Outras Exposições */}
          {inputs.produto === "outro" && (
            <Card title="Outras Exposições (Art. 66)">
              <Row>
                <FieldGroup label="Tipo de exposição" tooltip={TOOLTIPS.outrasExposicoes}>
                  <Select
                    value={inputs.outrasExposicoes.tipo}
                    onChange={(v) => updateNested("outrasExposicoes", "tipo", v)}
                  >
                    <option value="outros">Outros (100%)</option>
                    <option value="caixa">Caixa/Moeda (0%)</option>
                    <option value="ouro">Ouro (0%)</option>
                    <option value="acoes_listadas">Ações listadas (250%)</option>
                    <option value="acoes_nao_listadas">Ações não listadas (400%)</option>
                    <option value="ativo_fixo">Ativo fixo (100%)</option>
                  </Select>
                </FieldGroup>
              </Row>
            </Card>
          )}

          {/* Fundos */}
          {inputs.produto === "fundo" && (
            <Card title="Fundos">
              <Row>
                <FieldGroup label="Abordagem" tooltip={TOOLTIPS.abordagemFundos}>
                  <Select
                    value={inputs.fundos.abordagem}
                    onChange={(v) => updateNested("fundos", "abordagem", v)}
                  >
                    <option value="sem-informacao">Sem informação (conservador)</option>
                    <option value="look-through">Look-through</option>
                    <option value="mandato">Mandato</option>
                  </Select>
                </FieldGroup>

                {inputs.fundos.abordagem === "look-through" && (
                  <FieldGroup label="FPR Look-Through (%)" tooltip={TOOLTIPS.fprLookThrough}>
                    <Input
                      type="number"
                      value={inputs.fundos.fprLookThrough}
                      onChange={(v) =>
                        updateNested("fundos", "fprLookThrough", Number(v))
                      }
                      placeholder="0-1250"
                    />
                    <Helper>FPR médio ponderado dos ativos</Helper>
                  </FieldGroup>
                )}

                {inputs.fundos.abordagem === "mandato" && (
                  <FieldGroup label="Tipo de fundo" tooltip={TOOLTIPS.tipoFundo}>
                    <Select
                      value={inputs.fundos.tipo ?? ""}
                      onChange={(v) =>
                        updateNested("fundos", "tipo", v || undefined)
                      }
                    >
                      <option value="">Selecione...</option>
                      <option value="equity">Equity (400%)</option>
                      <option value="fixedIncome">Renda Fixa (100%)</option>
                      <option value="mixed">Misto (150%)</option>
                      <option value="outros">Outros (100%)</option>
                    </Select>
                  </FieldGroup>
                )}
              </Row>
            </Card>
          )}

          {/* EAD */}
          <Card title="EAD (Exposure at Default)">
            <Row>
              <FieldGroup label="Saldo devedor" tooltip={TOOLTIPS.saldoDevedor}>
                <Input
                  type="number"
                  value={inputs.ead?.saldoDevedor ?? 0}
                  onChange={(v) =>
                    updateNested("ead", "saldoDevedor", Number(v))
                  }
                  placeholder="0,00"
                />
              </FieldGroup>

              <FieldGroup label="Limite não utilizado" tooltip={TOOLTIPS.limiteNaoUtilizado}>
                <Input
                  type="number"
                  value={inputs.ead?.limiteNaoUtilizado ?? 0}
                  onChange={(v) =>
                    updateNested("ead", "limiteNaoUtilizado", Number(v))
                  }
                  placeholder="0,00"
                />
              </FieldGroup>

              <FieldGroup label="Tipo CCF" tooltip={TOOLTIPS.tipoCCF}>
                <Select
                  value={inputs.ead?.ccfTipo ?? "linha_revogavel"}
                  onChange={(v) => updateNested("ead", "ccfTipo", v)}
                >
                  <option value="linha_irrevogavel">Linha irrevogável (50%)</option>
                  <option value="linha_revogavel">Linha revogável (10%)</option>
                  <option value="garantia_prestada">Garantia (100%)</option>
                  <option value="comercio_exterior">Comércio ext. (20%)</option>
                  <option value="outro">Outro (100%)</option>
                </Select>
              </FieldGroup>
            </Row>
          </Card>

          {/* CRM e Especiais */}
          <Card title="CRM e Especiais">
            <Row>
              <FieldGroup label="Substituição por garantidor" tooltip={TOOLTIPS.substituicaoGarantidor}>
                <Switch
                  checked={inputs.crm.substituicaoGarantidor}
                  onChange={(v) =>
                    updateNested("crm", "substituicaoGarantidor", v)
                  }
                />
              </FieldGroup>

              <FieldGroup label="FPR do garantidor (%)" tooltip={TOOLTIPS.fprGarantidor}>
                <Input
                  type="number"
                  value={inputs.crm.fprGarantidor}
                  onChange={(v) =>
                    updateNested("crm", "fprGarantidor", Number(v))
                  }
                />
              </FieldGroup>

              <FieldGroup label="Seguro de crédito (Res. 324/2023)" tooltip={TOOLTIPS.seguroCredito}>
                <Switch
                  checked={inputs.crm.seguroCredito ?? false}
                  onChange={(v) => updateNested("crm", "seguroCredito", v)}
                />
              </FieldGroup>
            </Row>

            <Row>
              <FieldGroup label="Subordinado" tooltip={TOOLTIPS.subordinado}>
                <Switch
                  checked={inputs.especiais.subordinado}
                  onChange={(v) => updateNested("especiais", "subordinado", v)}
                />
              </FieldGroup>

              <FieldGroup label="Equity" tooltip={TOOLTIPS.equity}>
                <Select
                  value={inputs.especiais.equity}
                  onChange={(v) => updateNested("especiais", "equity", v)}
                >
                  <option value="nao">Não</option>
                  <option value="250">250%</option>
                  <option value="1250">1.250%</option>
                </Select>
              </FieldGroup>

              <FieldGroup label="Crédito tributário" tooltip={TOOLTIPS.creditoTributario}>
                <Select
                  value={inputs.especiais.creditoTributario}
                  onChange={(v) =>
                    updateNested("especiais", "creditoTributario", v)
                  }
                >
                  <option value="nao">Não</option>
                  <option value="100">100%</option>
                  <option value="600">600%</option>
                  <option value="1250">1.250%</option>
                </Select>
              </FieldGroup>
            </Row>

            <Row>
              <FieldGroup label="Ajuste negativo PL (Res. 452/2025)" tooltip={TOOLTIPS.ajusteNegativoPL}>
                <Switch
                  checked={inputs.especiais.ajusteNegativoPL ?? false}
                  onChange={(v) =>
                    updateNested("especiais", "ajusteNegativoPL", v)
                  }
                />
              </FieldGroup>

              <FieldGroup label="Caixa fora da posse direta" tooltip={TOOLTIPS.caixaForaPosse}>
                <Switch
                  checked={inputs.pisos.caixaForaPosseDireta}
                  onChange={(v) =>
                    updateNested("pisos", "caixaForaPosseDireta", v)
                  }
                />
                <Helper>Piso de 20%</Helper>
              </FieldGroup>
            </Row>
          </Card>
        </div>

        {/* Coluna 3: Resultado */}
        <div className="grid gap-6 h-fit sticky top-6">
          <Card title="Resultado">
            <div className="flex items-baseline gap-3 mb-4">
              <div className="text-4xl font-bold text-emerald-500">
                {formatPercent(result.fpr)}
              </div>
              <div className="text-neutral-500">FPR final</div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <strong>Classe:</strong> {result.classe}
              </div>
              {result.fprBase !== result.fpr && (
                <div className="text-neutral-600">
                  FPR base: {formatPercent(result.fprBase)}
                </div>
              )}
              {result.ead != null && (
                <>
                  <div>
                    <strong>EAD:</strong> {formatCurrency(result.ead)}
                  </div>
                  {result.eadAjustado != null &&
                    result.eadAjustado !== result.ead && (
                      <div>
                        <strong>EAD ajustado:</strong>{" "}
                        {formatCurrency(result.eadAjustado)}
                      </div>
                    )}
                  {result.rwacpad != null && (
                    <div className="pt-2 border-t">
                      <strong>RWACPAD:</strong>{" "}
                      <span className="text-lg font-semibold">
                        {formatCurrency(result.rwacpad)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card title="Trilha de decisão">
            <ol className="list-decimal ml-5 space-y-1 text-xs">
              {result.steps.map((step, i) => (
                <li key={i} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Cenários de teste">
            <div className="space-y-2">
              {getScenarioNames().map((name) => (
                <Button
                  key={name}
                  onClick={() => loadScenario(name)}
                  className="w-full text-left text-xs"
                >
                  {name}
                </Button>
              ))}
            </div>
          </Card>

          <Button onClick={exportJSON} variant="primary">
            📋 Exportar JSON
          </Button>
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t text-xs text-neutral-500">
        <p>
          <strong>Calculadora FPR v3.0</strong> - Res. BCB 229/2022, Circular
          3.809/2016 e atualizações 2024-2025
        </p>
        <p className="mt-1">
          Implementa: FPR base por classe (soberanos, IF, corporate, varejo, imobiliário, fundos, setor público),
          inadimplência por nível de provisão, outras exposições (caixa, ouro, ações),
          validações PME/grande baixo risco, consignado &gt;5 anos, obra em andamento por ano,
          EAD com CCF, haircuts, CRM, descasamento cambial, seguro de crédito, ajuste negativo PL.
        </p>
      </footer>
    </div>
  );
}
