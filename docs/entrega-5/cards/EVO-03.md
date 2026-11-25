# EVO-03 — Atividade durante a sessão

> Refino da ficha [EVO-03 do BACKLOG](../BACKLOG.md#evo-03--atividade-durante-a-sessão), escrito
> em 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em [PLANO](../PLANO.md).
> Rotas propostas na
> [especificação §3](../ESPECIFICACAO-BACKEND.md#3-resultado-de-atividade-na-sessão--p1); a
> API-06 confirma.

| Campo           | Valor                                                                                                                                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-4                                                                                                                                                                                                                                                                               |
| Classe / modelo | B (Codex ou Sonnet, esforço alto) **com revisão A (Opus)** do fluxo de sessão: o player é o fluxo mais sensível do app (G-08)                                                                                                                                                      |
| Estimativa      | G · 9 h de worker + 1 h de revisão                                                                                                                                                                                                                                                 |
| Dependências    | ATV-04a e ATV-04b (jogos e `GameResult`); API-07 leva 1 (tipos `ActivityResult`, `activityResults` no contexto e no relatório); G-65                                                                                                                                               |
| Backend         | Leva 1 (§3). Mock-first. **Pode ir para a `main` antes da leva**: o envio só acontece com um jogo na sessão, e jogos só existem depois da leva                                                                                                                                     |
| Dona nesta onda | `src/features/sessions/player/**`, `src/stores/session-flow.ts`, `src/features/sessions/useContentCatalog.ts` (só o filtro), `src/api/endpoints/session.ts` (só a função nova), `src/features/evolution/register/**` (só a seção), `src/features/reports/session/**` (só o resumo) |

## 1. Objetivo e valor

Histórias **US2-06** e **US2-10**. Hoje a sessão só registra múltipla escolha. Com os jogos, a
criança joga "Forme a palavra" no atendimento e o resultado (concluiu, tentativas, erros) fica
registrado na sessão e aparece na **Evolução**, onde o profissional usa a informação no registro
descritivo (G-65: sem virar critério automático e fora do acerto das análises).

## 2. Diagnóstico do código (o que o backlog não dizia)

- O **player da sessão não usa o motor**: `SessionPlayerScreen.tsx` desenha o quiz por conta
  própria (alternativas, `answerSession`, "Tentar reenviar", "Próxima"). O `ActivityEngine` só é
  usado no `ActivityPlayScreen` (fora da sessão). Por isso a tarefa **acrescenta um ramo de
  jogo** ao player, sem reescrever o quiz.
- A retomada (`findActivityIndex`) considera só `confirmedAnswers`; o `seedFromServerSession`
  monta o estado a partir de `session.answers`. Os resultados de jogo precisam entrar nos dois.
- `resolveSessionTasks` resolve caderno, grupo e atividade avulsa; um imprimível não pode entrar
  (AT-10). A escolha do conteúdo (`useContentCatalog`, aba "Atividades") hoje lista qualquer
  tarefa.

## 3. Referência de design

Sem tela nova. O jogo aparece dentro do player com a mesma casca (progresso "Atividade N de M",
`ProgressBar`) e os componentes da ATV-04a/b. Na Evolução, a seção usa `SectionTitle` e
`InfoCard`/linhas como o resto do `EvolutionScreen`. Lacuna do conector Figma: ver
[ATV-04a §2](ATV-04a.md#2-referência-de-design).

## 4. Fluxo do usuário

1. Início → "Iniciar sessão" → paciente → conteúdo (caderno, grupo ou atividade) → player
   (`/session/player`), como hoje.
2. Para cada tarefa:
   - **múltipla escolha**: exatamente o fluxo atual;
   - **jogo** (`wordBuilder`, `colorMatch`, `memoryGame`): o player renderiza
     `renderActivity(task.type, { task, onAttempt: () => {}, onSolved, onGameResult })`; ao
     terminar, envia o resultado **uma vez** e mostra "Resultado registrado"; "Próxima" aparece
     depois do envio confirmado;
   - **tipo não jogável** (imprimível ou desconhecido): "Tipo de atividade indisponível" e
     "Pular" (avança sem registro).
3. Fim da sessão → "Encerrar" → `/session/finish` → Evolução (`/evolution/[sessionId]`), como
   hoje.
4. Na **Evolução**, acima dos critérios, a seção **"Atividades da sessão"** lista os jogos:
   "{título}" e a linha "{tipo} · Concluída · {n} tentativas · {e} erros" (ou "Não concluída").
   Só leitura.
5. No **relatório da sessão** (`/reports/session/...`), um bloco "Atividades jogadas" com "{total}
   jogos · {completed} concluídos · {correct} sem erro", na tela e no PDF.

## 5. Estados

| Estado                                            | Comportamento e texto                                                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enviando o resultado                              | Indicador no lugar de "Próxima"; o jogo fica bloqueado (já terminou)                                                                                                    |
| Sucesso                                           | `SuccessPanel` "Resultado registrado" + "Próxima"/"Encerrar sessão"                                                                                                     |
| `409 RESULT_ALREADY_EXISTS`                       | Tratado como registrado ("Resultado registrado"); confirma no estado local                                                                                              |
| Rede ou timeout                                   | "Não foi possível confirmar o resultado. Tente reenviar quando a conexão voltar." + "Tentar reenviar"; sem reenvio automático (G-08); "Próxima" escondida, como no quiz |
| Outro erro do servidor (5xx, 400 genérico)        | "Não foi possível registrar o resultado. Tente reenviar." + "Tentar reenviar"                                                                                           |
| `400 TASK_NOT_IN_NOTEBOOK`                        | "Esta atividade não faz parte do caderno da sessão." (texto atual do quiz); não fica pendente; "Próxima" liberada                                                       |
| `400 USE_ANSWER_ROUTE` / `PRINTABLE_NOT_PLAYABLE` | Mensagem do `normalizeApiError`; não fica pendente; "Próxima" liberada                                                                                                  |
| `409 SESSION_ALREADY_FINISHED`                    | "A sessão já foi encerrada; o resultado não foi registrado." + "Ir para o encerramento" (`handleFinish`)                                                                |
| `404 SESSION_NOT_FOUND`                           | Mesmo tratamento do erro genérico, sem pendência                                                                                                                        |
| Evolução sem jogos                                | A seção não aparece                                                                                                                                                     |
| Contexto sem `activityResults` (backend antigo)   | A seção não aparece                                                                                                                                                     |

## 6. Contrato de dados

| Método e rota                                   | Função                                                    | Uso                                         |
| ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `POST /task-notebook-session/activity-result`   | `submitActivityResult(input)` (**novo**, em `session.ts`) | fim de cada jogo                            |
| `GET /task-notebook-session/student/:studentId` | `listSessionsByStudent` (existente)                       | retomada: `session.activityResults` (RS-07) |
| `GET /session-evolution/context/:sessionId`     | `getEvolutionContext` (existente)                         | `activityResults` (RS-06)                   |
| `GET /task-notebook-session/report/:sessionId`  | `getSessionReport` (existente)                            | `activitySummary`, `activityResults`        |

```ts
// src/api/endpoints/session.ts (esta tarefa)
export interface SubmitActivityResultInput {
  sessionId: string;
  taskId: string;
  completed: boolean;
  correct: boolean;
  attempts: number;
  errors: number;
  durationMs: number;
}
export async function submitActivityResult(
  input: SubmitActivityResultInput,
): Promise<ActivityResult>;
```

Os tipos `ActivityResult`, `EvolutionContext.activityResults?`,
`TaskNotebookSession.activityResults?` e `SessionReport.activitySummary?`/`activityResults?`
são da API-07 (opcionais até a API-06).

**Estado local** (`src/stores/session-flow.ts`, persistido como hoje em `session:flow`):

- `confirmedActivityResults: string[]` (ids das tarefas com resultado confirmado);
- `pendingActivityResults: SubmitActivityResultInput[]`;
- ações `confirmActivityResult(taskId)` (remove da pendência, soma em `activityIndex`) e
  `markActivityResultPending(input)`, só na etapa `running`, como `confirmAnswer` e
  `markAnswerPending`;
- `initialSessionFlowData` com os dois campos vazios (o `hydrate` já completa estados antigos com
  `...initialSessionFlowData`);
- `seedFromServerSession`: `confirmedActivityResults` = `session.activityResults?.map(r =>
r.taskId) ?? []` e `activityIndex` = respostas + resultados.

Invalidações depois de encerrar: as que o fluxo já faz (`["task-notebook-session"]`,
`evolutionQueryKeys.all`); nada novo.

## 7. Regras de negócio e casos de borda

1. **Uma vez por atividade e sessão** (RS-04, G-08): o player chama `submitActivityResult` uma
   vez quando o jogo termina; nunca reenvia sozinho. "Tentar reenviar" usa o mesmo corpo
   guardado em `pendingActivityResults`.
2. **Retomada**: a tarefa com `taskId` em `confirmedActivityResults` (ou em `confirmedAnswers`)
   é pulada; `findActivityIndex` passa a considerar os dois conjuntos.
3. **Pendência na retomada**: se o app reabrir com um resultado pendente, o jogo correspondente
   aparece já como terminado com "Tentar reenviar" (não pede para jogar de novo).
4. **Só jogos completos geram resultado** (regra da ATV-04a: `completed: true`); "Pular" num tipo
   não jogável não envia nada.
5. **G-65**: o resultado não entra no acerto (`answeredCount`/`correctCount`) nem nos critérios;
   a seção da Evolução é só leitura e não pré-preenche nada.
6. **Imprimível fora da sessão** (AT-10): `useContentCatalog` não lista tarefas `printable` na
   aba de atividades avulsas; se mesmo assim uma aparecer (caderno antigo), vira "Tipo de
   atividade indisponível" + "Pular".
7. **Sem paciente não há registro** (G-35): o `ActivityPlayScreen` (fora da sessão) continua sem
   envio e com o aviso atual.
8. O quiz não muda: `answerSession`, `TASK_ALREADY_ANSWERED`, `markAnswerConflict` e os textos
   atuais ficam como estão.

## 8. Plano de implementação

1. `src/api/endpoints/session.ts`: `submitActivityResult`. Mock em
   `src/mocks/handlers/session-analysis.ts` (onde fica o `answer`) ou num arquivo novo
   `activity-result.ts` registrado no `install.ts`: valida sessão ativa, `TASK_NOT_IN_NOTEBOOK`,
   tipo jogável, duplicado (`409 RESULT_ALREADY_EXISTS` com `resultId`), e passa a devolver
   `activityResults` na listagem de sessões do aluno. Teste pelo `apiClient` real (sucesso,
   duplicado e sessão encerrada). Seção no `src/mocks/README.md`.
2. `src/stores/session-flow.ts`: campos e ações do §6 + testes em `src/stores/__tests__/`.
3. `src/features/sessions/player/SessionPlayerScreen.tsx`:
   - extrair o corpo do quiz atual para `QuizStep.tsx` (mesmo JSX e mesmos textos, sem mudar
     comportamento) e criar `GameStep.tsx` (jogo pelo registro + envio + estados do §5);
   - o player escolhe o passo pelo tipo (`isMultipleChoice(task.type)`, `isActivityTypePlayable`);
   - `findActivityIndex` com os dois conjuntos de confirmados.
4. `src/features/sessions/useContentCatalog.ts`: filtrar `type === "printable"` (e
   `format === "PRINTABLE"`) na aba de atividades.
5. `src/features/evolution/register/SessionActivitiesBlock.tsx` (novo) e uma linha no
   `EvolutionScreen.tsx`, acima de `EvolutionFormSections`, só quando houver resultados.
6. `src/features/reports/session/SessionReportScreen.tsx` e `sessionReport.ts`
   (`buildSessionReportHtml`): bloco "Atividades jogadas" quando `activitySummary?.total > 0`.
7. Testes dos AC; os testes existentes do player (`SessionPlayerScreen.test.tsx`) continuam
   passando sem alteração de asserção (prova de que o quiz não mudou).

## 9. Arquivos

- **Permitidos:** `src/features/sessions/player/**`, `src/stores/session-flow.ts` e
  `src/stores/__tests__/session-flow*.test.ts`, `src/features/sessions/useContentCatalog.ts`,
  `src/api/endpoints/session.ts`, `src/mocks/handlers/session-analysis.ts` ou
  `src/mocks/handlers/activity-result.ts` (novo) + `src/mocks/install.ts` (uma linha) +
  `src/mocks/README.md` (seção), `src/features/evolution/register/EvolutionScreen.tsx` (uma
  linha) e `SessionActivitiesBlock.tsx` (novo), `src/features/reports/session/**` (só o bloco).
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts` (API-07),
  `src/features/activities/engine/**` (ATV-04a/b; se o motor precisar mudar, escalar),
  `src/features/evolution/register/{EvolutionFormSections,schema,EvolutionEditForm}.tsx`,
  `app/**`, `package.json`.

## 10. Critérios de aceite

| ID           | Critério                                                                                                  | Verif. |
| ------------ | --------------------------------------------------------------------------------------------------------- | ------ |
| AC-EVO-03-01 | O resultado é enviado uma vez por atividade; falha mostra "Tentar reenviar" sem reenvio automático        | `CT`   |
| AC-EVO-03-02 | A Evolução mostra os resultados do contexto do servidor; sem resultados, a seção não aparece              | `CT`   |
| AC-EVO-03-03 | O fluxo sessão → jogo → evolução funciona no emulador contra o backend real                               | `MAN`  |
| AC-EVO-03-04 | A retomada pula o jogo com resultado confirmado e mostra o pendente como terminado, com "Tentar reenviar" | `UT`   |
| AC-EVO-03-05 | `RESULT_ALREADY_EXISTS` é tratado como registrado; os testes atuais do quiz no player passam sem mudança  | `CT`   |

## 11. Como testar manualmente (Victor)

Expo Go Android, backend real com a leva 1. Precisa de um caderno com uma múltipla escolha e um
"Forme a palavra" (crie o caderno no app com uma atividade pronta duplicada).

1. Início → "Iniciar sessão" → "Paciente Teste A" → o caderno → iniciar.
2. Responda a múltipla escolha como sempre.
3. No "Forme a palavra", erre uma vez e acerte: aparece "Resultado registrado" → "Próxima".
4. Ative o modo avião antes de terminar o próximo jogo: aparece "Não foi possível confirmar o
   resultado..." → desligue o modo avião → "Tentar reenviar" → "Resultado registrado".
5. Feche o app no meio do caderno e reabra: a sessão retoma na atividade seguinte, sem pedir o
   jogo de novo.
6. Encerre: na Evolução, "Atividades da sessão" mostra o jogo com "2 tentativas · 1 erro".
7. Relatório da sessão: aparece "Atividades jogadas" na tela e no PDF.
8. "Iniciar sessão" → aba de atividades avulsas: nenhum imprimível na lista.

## 12. Riscos e perguntas em aberto

- **Regressão do quiz no player**: o maior risco da entrega no fluxo crítico. Mitigação: o
  quiz é extraído sem mudar JSX nem textos; os testes atuais não podem ter asserção alterada;
  revisão A antes do merge.
- **RS-07** (sessão com `activityResults`) pode não vir na leva 1: sem ele, a retomada usa só o
  estado local (`confirmedActivityResults` persistido) — funciona no mesmo aparelho; anotar na
  API-06.
- **G-65** (proposta): se o usuário decidir contar o jogo no acerto, a mudança é do backend
  (RS-05); o app só mostra o que vier.
- Grupo e atividade avulsa não têm vínculo no servidor (comentário de `sessionTasks.ts`); o
  `TASK_NOT_IN_NOTEBOOK` só acontece em caderno.

## 13. Fora do escopo

Jogar fora da sessão com registro (G-35), transformar o resultado em critério ou meta, abrir um
jogo recomendado a partir da Evolução (ideia da EVO-03 da Entrega 2), resultado de imprimível.
