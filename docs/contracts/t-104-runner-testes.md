# T-104 — Runner Vitest e React Native Testing Library

## Objetivo e decisões

Implementar apenas a T-104 do [BACKLOG](../entrega-1/BACKLOG.md#t-104--runner-de-testes-unitários-e-de-componente-vitest), dependente de T-102 (concluída). G-22 resolvido. Usuário autorizou este contrato e `pnpm-workspace.yaml` em 2026-09-24, além de atualização contínua dos registros desatualizados. Prioridade a executores OpenAI menores, com trabalho independente em paralelo.

Fonte de versões: [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md), §3 e A-06/A-11–A-15. Instalar somente devDependencies da receita: `vitest@5.0.1`, `vitest-native@0.13.0`, `vite@8.3.0`, `@react-native/babel-preset@0.86.3`, `@babel/core@7.29.7` (versão validada na tabela §3), `@testing-library/react-native@14.0.1`, `test-renderer@~1.2.0`. Não atualizar runtime. Nova versão ou dependência direta exige escalonamento.

Fora: telas de produto, provider de queries (T-304), NativeWind em testes, integração real com API, lint (T-103), build nativo/emulador e alterações de AGENTS/GATES.

## Critérios e verificações

| ID | Resultado | Evidência |
|---|---|---|
| AC-104-01 | `pnpm run test` executa `vitest run`; componente RN é renderizado de modo assíncrono, consultado e interagido com RNTL | Código 0 e contagem real de testes |
| AC-104-02 | Asserção deliberadamente falsa é detectada pelo runner já funcional; removida depois da revisão do vermelho | Comando e código não zero, falha de asserção identificada; ausência do teste deliberado no diff final |
| AC-104-03 | Mocks de Nitro/MMKV, SecureStore e Expo Router documentados, com limites e forma de reset/override | README em `src/test-utils/`, revisão de código e testes focados |

Configuração mínima do runner pode preceder o vermelho (AGENTS §4, bootstrap). Testes do wrapper/mocks devem ser escritos antes do comportamento correspondente, usando stubs tipados se necessário. Após atingir ambiente funcional, executor envia evidência e pergunta ao orquestrador antes de remover a falha deliberada e concluir implementação. Falhas de import, sintaxe ou ambiente não satisfazem AC-104-02. Não criar testes de negócio artificiais.

## Interfaces e invariantes

- `vitest.config.mts`: motor `native`, plataforma Android, transforms para `react-native-calendars`, `recyclerlistview`, `react-native-swipe-gestures`; alias `@/` corresponde a `src/`.
- `vitest.setup.ts`: mocks explícitos; imports do Vitest; limpeza entre testes sem apagar implementações padrão dos mocks acidentalmente.
- `src/test-utils/render.tsx`: render assíncrono compatível com RNTL 14, wrapper extensível por teste; sem QueryClient nesta tarefa. Exportar utilitários necessários com tipos compatíveis.
- Nitro: mock mínimo da receita. Preferir instância em memória do próprio MMKV, documentando isolamento/limitações; não alegar comprovação de criptografia nativa.
- SecureStore: armazenamento simulado em memória, API assíncrona usada na entrega, isolado entre testes; permitir simular rejeições via spies.
- Expo Router: spies de navegação e parâmetros controláveis; sem simular integração real de navegação. API suportada e reset documentados.
- Fixtures fictícias, sem credenciais ou dados pessoais. Nenhuma chamada ao backend. Fonte de testes independente de regras de produto.
- Verificar smoke com componente real RN e wrapper customizado; verificar estado/reset relevante dos mocks. Usar `await render(...)` e imports explícitos de `vitest`.
- Não considerar classes NativeWind evidência visual; os testes rodam no Node com plataforma RN Android configurada, não no Hermes de um aparelho.

## Propriedade e execução

Run Orca: `run_8d21709c445e`. Ferramenta OpenCode, autenticação OpenAI OAuth confirmada por `opencode auth list`; modelos abaixo listados por `opencode models openai`. Modelo do launch deve ser registrado no TRACKING. Orca 1.4.197, runtime pronto.

| Frente | Papel/modelo | Esforço | Arquivos exclusivos | Dependência |
|---|---|---|---|---|
| Coordenação/revisão | Orquestrador OpenCode `openai/gpt-6-astra` | Médio, integração e revisão | Este contrato, `docs/entrega-1/TRACKING.md`; Git/PR | Autorizações do usuário já recebidas |
| Runner/testes | Executor OpenCode `openai/gpt-5.6-terra` | Médio, tarefa delimitada e receita validada | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vitest.config.mts`, `vitest.setup.ts`, `src/test-utils/**` | Contrato aprovado; R-01 e R-04 exclusivos |
| Documentação factual | Executor OpenCode `openai/gpt-5.6-terra` | Baixo, correções de estado com evidência | `docs/PROJECT.md`, `docs/entrega-1/ROADMAP.md`, `docs/entrega-1/BACKLOG.md`, `docs/bootstrap/COMPATIBILIDADE.md` | Independente do runner; corrigir somente fatos existentes, sem antecipar conclusão |

Máximo de dois workers em paralelo, mesmo checkout/branch `feat/t-104-vitest-rntl`; nenhum worker escreve TRACKING ou contratos, faz Git de escrita, inicia build nativo ou cria subagentes. Esforço é orientação (sem flag não confirmada). Uma única instalação por vez, exclusiva do executor do runner. Orçamento financeiro não configurável; reduzir discovery repetido. `worker-start --timeout-ms 180000` obrigatório.

## Validação e entrega

Executor: `pnpm peers check` após instalar; vermelho e verde de `pnpm run test`; `pnpm run typecheck`. Documentação: `python scripts/check-docs.py`, `git diff --check`.

Integração após estabilizar: `pnpm install --frozen-lockfile`, testes/typecheck pertinentes, `pnpm exec expo export --platform android --output-dir dist-android`; CI existente deve ficar verde no PR. Não rodar instalação/build concorrentes. Ausência de lint até T-103 é limitação registrada. Smoke Node não comprova runtime Android/iOS.

Cada worker entrega arquivos, comandos completos, códigos de saída, resultados, limitações e perguntas. Orquestrador revisa diff e evidências, mantém cards atualizados a cada transição, abre um PR da tarefa e acompanha CI. T-104 permanece em revisão até o merge do usuário; dependentes não são liberados antes.

## Paradas e histórico

Parar e perguntar em conflito de critérios, nova dependência/versão, arquivo fora da propriedade, duas falhas pelo mesmo motivo ou necessidade de enfraquecer testes. A documentação não pode mudar decisões nem contratos da API. Se o mini não resolver diagnóstico, escalar com evidência para um modelo OpenAI mais capaz.

- 2026-09-24: contrato inicial aprovado pelo orquestrador após autorização explícita do usuário; delegação econômica e paralelismo documental.
- 2026-09-24: mini listado mas recusado pela autenticação ChatGPT antes de executar trabalho; substituído por `openai/gpt-5.6-terra`, confirmado por chamada real `opencode run --model openai/gpt-5.6-terra` (resposta OK, código 0). Sem mudança de escopo.
