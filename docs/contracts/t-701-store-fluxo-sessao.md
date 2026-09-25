# T-701 - Store do fluxo de sessão

## Objetivo

Expor uma store Zustand (`src/stores/session-flow.ts`) com máquina de estados
explícita para o fluxo de sessão (telas 04-07), que persiste no MMKV
criptografado do educador (T-303) a cada transição válida e reidrata o mesmo
estado, sem chamar a API (T-704/T-802/T-803/T-804 fazem as chamadas; esta
store só guarda o resultado local delas). Fase 1: contrato + testes + stubs
sem comportamento (fase vermelha).

## Máquina de estados

| Estado                | Descrição                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `idle`                | Nenhum fluxo em andamento.                                                                  |
| `studentSelected`     | Aluno escolhido (tela 04).                                                                  |
| `configured`          | Nome e conteúdo definidos (tela 05).                                                        |
| `starting`            | `start` foi enviado, aguardando resposta (T-704).                                           |
| `startUncertain`      | Resultado do `start` é desconhecido (timeout/rede); ver G-08.                               |
| `running`             | Sessão iniciada (`sessionId` conhecido), respondendo atividades.                            |
| `finishing`           | Última resposta confirmada, aguardando `finish` (T-804).                                    |
| `awaitingObservation` | `finish` confirmado, aguardando Pular/Salvar observação.                                    |
| `closed`              | Fluxo encerrado (observação enviada ou pulada); store volta a `idle` ao ser lido novamente. |
| `error`               | Falha irrecuperável sem correspondência possível (conflito visível, G-08).                  |

### Transições permitidas

| De                                                                              | Ação                           | Para                  | Efeito no estado                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `idle`                                                                          | `selectStudent(student)`       | `studentSelected`     | grava `student`.                                                                                                                                                                 |
| `studentSelected`                                                               | `selectStudent(student)`       | `studentSelected`     | troca `student` (permite voltar à 04 e escolher outro, AC-702).                                                                                                                  |
| `studentSelected`                                                               | `configure({ name, content })` | `configured`          | grava `sessionName`, `content`.                                                                                                                                                  |
| `configured`                                                                    | `configure({ name, content })` | `configured`          | atualiza `sessionName`/`content` (AC-703-07, preserva ao ir/voltar 04↔05).                                                                                                       |
| `configured`                                                                    | `selectStudent(student)`       | `studentSelected`     | trocar de aluno depois de configurar reabre a etapa 05 (nome/conteúdo preservados no estado, mas a etapa volta para `studentSelected`).                                          |
| `configured`                                                                    | `requestStart()`               | `starting`            | grava `startRequestedAt` (instante do envio).                                                                                                                                    |
| `starting`                                                                      | `confirmStart(sessionId)`      | `running`             | grava `sessionId`; `activityIndex = 0`.                                                                                                                                          |
| `starting`                                                                      | `markStartUncertain()`         | `startUncertain`      | mantém `startRequestedAt`.                                                                                                                                                       |
| `starting`                                                                      | `failStart(reason)`            | `error`               | grava `errorReason`.                                                                                                                                                             |
| `startUncertain`                                                                | `confirmStart(sessionId)`      | `running`             | adota o `sessionId` reconciliado (G-08); `activityIndex = 0`.                                                                                                                    |
| `startUncertain`                                                                | `failStart(reason)`            | `error`               | grava `errorReason` (nenhuma ou mais de uma correspondência, ou listagem indisponível).                                                                                          |
| `running`                                                                       | `confirmAnswer(answer)`        | `running`             | move de `pendingAnswers`/nova resposta para `confirmedAnswers`; incrementa `activityIndex`. Requer `sessionId` não nulo.                                                         |
| `running`                                                                       | `markAnswerPending(answer)`    | `running`             | adiciona a `pendingAnswers` (aguardando reenvio, T-803). Requer `sessionId` não nulo.                                                                                            |
| `running`                                                                       | `markAnswerConflict(answer)`   | `running`             | move para `conflictedAnswers`. Requer `sessionId` não nulo.                                                                                                                      |
| `running`                                                                       | `finish()`                     | `finishing`           | —                                                                                                                                                                                |
| `finishing`                                                                     | `awaitObservation()`           | `awaitingObservation` | —                                                                                                                                                                                |
| `awaitingObservation`                                                           | `close()`                      | `closed`              | limpa o fluxo persistido (`clearSessionFlow`); o estado em memória fica `closed` até a próxima leitura — `hydrate()` sem dado persistido volta a `idle` (comportamento do boot). |
| `idle`/`studentSelected`/`configured`                                           | `cancel()`                     | `idle`                | limpa todo o estado e o fluxo persistido (AC-701-03, "antes do start").                                                                                                          |
| `starting`/`startUncertain`/`running`/`finishing`/`awaitingObservation`/`error` | `discard({ confirmed: true })` | `idle`                | só executa com `confirmed: true` explícito (AC-701-03, "depois do start"); limpa estado e fluxo persistido.                                                                      |

Qualquer chamada de ação fora da linha correspondente ao estado atual (ex.:
`configure` em `idle`, `confirmAnswer` em `configured`, `discard` sem
`confirmed: true`) é uma **transição inválida**: lança
`SessionFlowInvalidTransitionError` e não altera o estado em memória nem o
persistido (AC-701-02).

## Estado guardado

```ts
type SessionFlowState = {
  step: SessionFlowStep; // um dos estados da tabela acima
  educatorId: string | null; // dono do fluxo persistido
  student: Student | null;
  sessionName: string | null;
  content: SessionFlowContent | null; // referência mínima ao conteúdo escolhido (T-703)
  sessionId: string | null;
  startRequestedAt: string | null; // ISO, instante do envio do start (G-08)
  activityIndex: number;
  confirmedAnswers: TaskNotebookSessionAnswer[];
  pendingAnswers: TaskNotebookSessionAnswer[];
  conflictedAnswers: TaskNotebookSessionAnswer[];
  errorReason: string | null;
};
```

`SessionFlowContent` é `{ kind: "notebook" | "group" | "task"; id: string; name: string }`
— referência mínima suficiente para a T-704 buscar as atividades; não duplica
tipos de `src/api/types.ts`.

## Persistência (T-303)

- O `educatorId` do fluxo é capturado de `getActiveEducatorId()` (T-303,
  `src/storage/mmkv.ts`) no momento da primeira transição (`selectStudent` a
  partir de `idle`), não de `useAuthStore` (cujo `educatorId` só será
  preenchido pela T-401/`GET /educator/me`, ainda não implementada). Se
  `getActiveEducatorId()` retornar `null` nesse momento, a transição é
  inválida (não há como persistir com segurança um fluxo sem educador ativo).
- Chave: **`session:flow`** (desvio deliberado da convenção
  `session:<notebookSessionId>` do contrato T-303: o `sessionId` só existe a
  partir de `running`, mas o fluxo já precisa persistir desde `studentSelected`
  para sobreviver ao fechamento do app antes do `start`; só existe um fluxo em
  andamento por educador). Registrado como decisão a confirmar na aprovação
  do vermelho.
- `getStorage(educatorId)` (T-303) grava o estado inteiro serializado em JSON
  em `session:flow` a cada transição válida (inclusive `idle`→`studentSelected`
  em diante); `cancel()`/`discard()`/`close()` chamam `clearSessionFlow(educatorId)`
  em vez de gravar um `idle` vazio.
- `hydrate(currentEducatorId: string): Promise<void>` — lê `session:flow` da
  instância de `currentEducatorId`; se não houver dado, define o estado em
  memória como `idle` (comportamento de boot; também usado por `close()`, que
  só limpa o persistido e deixa o estado em memória se resolver na próxima
  leitura). Se houver dado com `educatorId` diferente de `currentEducatorId`,
  **descarta sem exibir** (chama `clearSessionFlow` da instância do
  `currentEducatorId` — não deveria conter nada de outro educador, dado o
  isolamento por instância do T-303; esta checagem é defesa em profundidade
  contra reidratação incorreta, AC-701-04) e mantém `idle`. Caso contrário,
  aplica o estado lido (mesmo `step` e campos).

## Critérios

| ID        | Resultado                                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-701-01 | Cada transição válida da tabela persiste em `session:flow` e `hydrate()` reidrata o mesmo estado (`step` e campos). — `UT`                                                                     |
| AC-701-02 | Transição inválida (ex.: `confirmAnswer` fora de `running`, ou sem `sessionId`) lança e não altera o estado em memória nem o persistido. — `UT`                                                |
| AC-701-03 | `cancel()` em `idle`/`studentSelected`/`configured` limpa tudo; `discard()` sem `confirmed: true` a partir de `starting` em diante lança sem alterar nada; com `confirmed: true` limpa. — `UT` |
| AC-701-04 | `hydrate(currentEducatorId)` com fluxo persistido de outro `educatorId` não expõe esse estado; store permanece `idle`. — `UT`                                                                  |

## Erros cobertos nos testes

- `SessionFlowInvalidTransitionError` — toda ação chamada fora do estado
  permitido pela tabela de transições, incluindo `discard()` sem confirmação.
- Falha de `getStorage`/persistência (rejeição) propaga; estado em memória já
  aplicado não é revertido silenciosamente (documentado como limitação: sem
  transação atômica entre memória e MMKV nesta entrega).

## Plano de testes (`src/stores/__tests__/session-flow.test.ts`)

- Mock de `@/storage/mmkv` (`getStorage`, `clearSessionFlow`) com uma
  instância MMKV em memória local (mesmo padrão do A-20 em
  `src/storage/__tests__/mmkv.test.ts`: `set`/`getString`/`remove`/`getAllKeys`,
  sem depender do preset `vitest-native`).
- Percorre a cadeia completa `idle → studentSelected → configured → starting →
running → finishing → awaitingObservation → closed`, verificando persistência
  e reidratação a cada passo (AC-701-01).
- Cadeia alternativa `starting → startUncertain → running` (G-08) e
  `starting → error` / `startUncertain → error` (AC-701-01 nas transições que
  existem, mais o caso de reconciliação sem correspondência).
- Ações inválidas por estado: `confirmAnswer` em `configured` (sem
  `sessionId`), `configure` em `idle`, `finish` em `studentSelected`,
  `discard()` sem `confirmed` em `running` — todas rejeitadas sem mudar o
  estado (AC-701-02).
- `cancel()` em `studentSelected` e `configured` limpa (AC-701-03); `discard()`
  em `running`/`awaitingObservation` sem confirmação lança; com
  `confirmed: true` limpa (AC-701-03).
- `hydrate("educator-b")` depois de um fluxo persistido para `"educator-a"`
  mantém `idle` e não expõe os campos do fluxo de A (AC-701-04).

## Tabela de tarefas

| Arquivo                                     | Dono            | Depende de   |
| ------------------------------------------- | --------------- | ------------ |
| `src/stores/session-flow.ts`                | Executor Sonnet | T-303, T-305 |
| `src/stores/__tests__/session-flow.test.ts` | Executor Sonnet | —            |

Modelo/esforço: Sonnet, médio-alto (classe C, risco de perda de progresso),
fase 1 e 2 no mesmo executor (tarefa fechada e coesa).

## Comandos de validação

- Fase 1: `pnpm exec vitest run src/stores/__tests__/session-flow.test.ts`
  (esperado: falhas por comportamento ausente); `pnpm run typecheck`
  (esperado: 0).
- Fase 2: os mesmos testes (esperado: verde); `pnpm run test`;
  `pnpm run typecheck`; `pnpm run lint`; `pnpm exec prettier --check` nos
  arquivos tocados; `python scripts/check-docs.py`; `git diff --check`.

## Limites

Fase 1: `session-flow.ts` contém apenas tipos, a tabela de transições como
dado e funções que lançam `Error("not implemented")`. Fase 2: implementação
real das transições, persistência e `hydrate`. Não implementa chamadas de API
(T-704/T-802/T-803/T-804) nem UI. Não altera `src/storage/**` nem
`src/stores/auth.ts`.

Executor pode editar: `docs/contracts/t-701-store-fluxo-sessao.md`;
`src/stores/session-flow.ts`; `src/stores/__tests__/session-flow.test.ts`.
Proibido: `docs/entrega-1/TRACKING.md`; outros contratos; AGENTS/BACKLOG/GATES;
`src/storage/**`; `src/stores/auth.ts`; instalar dependências; commit/push
sem autorização do fluxo da tarefa; backend real; dados reais de crianças.

## Pendências

- Confirmar com o orquestrador a chave `session:flow` (desvio da convenção
  `session:<notebookSessionId>` do T-303, justificado acima).
- `SessionFlowContent` é uma referência mínima; T-703/T-704 podem pedir campos
  adicionais quando o contrato de conteúdo for fechado — não antecipado aqui.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-701, após leitura de AGENTS §4/§6, BACKLOG (T-701,
  T-704, T-803), PROJECT §6, GATES (G-04, G-08, G-16, G-21), contratos T-303 e
  T-305, `src/stores/auth.ts` e `src/storage/mmkv.ts`.
