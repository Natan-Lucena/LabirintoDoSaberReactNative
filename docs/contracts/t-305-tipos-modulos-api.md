# T-305 - Tipos e módulos de API da entrega

## Objetivo

Definir os tipos de domínio e as assinaturas dos módulos de API usados na
Entrega 1, cobrindo exatamente os endpoints listados em
docs/entrega-1/API-TELAS.md §1, sem implementar comportamento de chamada real
nesta fase (fase vermelha).

## Criterios

| ID        | Resultado                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------ |
| AC-305-01 | Cada função chama método e caminho exatos, com corpo/params corretos (tabela de casos). — `UT`   |
| AC-305-02 | `typecheck` passa e revisão confirma tipos iguais à Parte II de docs/PROJECT.md. — `CMD` + `REV` |

## Interfaces

Tipos em `src/api/types.ts`: `Gender`, `TaskCategory`, `TaskType`,
`AppointmentStatus`, `Educator`, `StudentDocument`, `Student`,
`TaskAlternative`, `Task`, `TaskGroup`, `TaskNotebook`,
`TaskNotebookSessionAnswer`, `TaskNotebookSession`, `Appointment`,
`EducatorLastSession` (item de `GET /educator/get-last-sessions`,
`{ studentName?, sessionName }`), `TaskNotebookWithGroups` (item de
`GET /task-notebook/`, `{ notebook, taskGroups }`). Campos e opcionalidade
(`?`/`| null`) replicam a Parte II literalmente; nenhum campo foi acrescentado.

### `src/api/endpoints/educator.ts`

| Função            | Método | Caminho                       | Corpo                             | Retorno                 |
| ----------------- | ------ | ----------------------------- | --------------------------------- | ----------------------- |
| `signIn`          | POST   | `/educator/sign-in`           | `{ email, password }`             | `{ token }`             |
| `getMe`           | GET    | `/educator/me`                | —                                 | `Educator`              |
| `generateToken`   | PUT    | `/educator/generate-token`    | `{ educatorEmail }` (não `email`) | `void`                  |
| `updatePassword`  | POST   | `/educator/update-password`   | `{ email, newPassword }`          | `void`                  |
| `getLastSessions` | GET    | `/educator/get-last-sessions` | —                                 | `EducatorLastSession[]` |

### `src/api/endpoints/student.ts`

| Função         | Método | Caminho                   | Corpo | Retorno     |
| -------------- | ------ | ------------------------- | ----- | ----------- |
| `listStudents` | GET    | `/student/` (barra final) | —     | `Student[]` |

### `src/api/endpoints/content.ts`

| Função                     | Método | Caminho                         | Corpo/Params                                                   | Retorno                    |
| -------------------------- | ------ | ------------------------------- | -------------------------------------------------------------- | -------------------------- |
| `listTaskNotebooks`        | GET    | `/task-notebook/` (barra final) | params `{ id?, educatorId?, category?, descriptionContains? }` | `TaskNotebookWithGroups[]` |
| `listTaskGroupsByEducator` | GET    | `/task-group/list-by-educator`  | —                                                              | `TaskGroup[]`              |
| `listTasks`                | GET    | `/task/` (barra final)          | params `{ id?, category?, type?, promptContains? }`            | `Task[]`                   |
| `getTaskById`              | GET    | `/task/:id`                     | —                                                              | `Task`                     |

`descriptionContains` e `promptContains` só existem porque documentados
explicitamente na Parte II (query de `GET /task-notebook/` e `GET /task/`).
`GET /task-group/list-by-educator` foi incluída porque a matriz API-TELAS §1
lista `GET /task/`, `GET /task/:id` como "Condicionado a G-06" junto de
`task-group`; mantida no mesmo módulo `content` por consumo conjunto na tela 05.

### `src/api/endpoints/session.ts`

| Função                  | Método | Caminho                                     | Corpo                                                        | Retorno                 |
| ----------------------- | ------ | ------------------------------------------- | ------------------------------------------------------------ | ----------------------- |
| `startSession`          | POST   | `/task-notebook-session/start`              | `{ studentId, name }`                                        | `TaskNotebookSession`   |
| `answerSession`         | POST   | `/task-notebook-session/answer`             | `{ sessionId, taskId, selectedAlternativeId, timeToAnswer }` | `TaskNotebookSession`   |
| `finishSession`         | POST   | `/task-notebook-session/finish`             | `{ sessionId }`                                              | `TaskNotebookSession`   |
| `addSessionObservation` | POST   | `/task-notebook-session/observation`        | `{ sessionId, observation }`                                 | `TaskNotebookSession`   |
| `listSessionsByStudent` | GET    | `/task-notebook-session/student/:studentId` | —                                                            | `TaskNotebookSession[]` |

`timeToAnswer` mantido como `number` sem unidade (pendência G-07, Parte I).
`answerSession`/reenvio não têm garantia de idempotência documentada (G-08) —
não tratado nesta fase, apenas registrado como pendência.

### `src/api/endpoints/appointment.ts`

| Função              | Método | Caminho                       | Corpo                                                        | Retorno         |
| ------------------- | ------ | ----------------------------- | ------------------------------------------------------------ | --------------- |
| `listAppointments`  | GET    | `/appointment/` (barra final) | —                                                            | `Appointment[]` |
| `createAppointment` | POST   | `/appointment/` (barra final) | `{ studentId, scheduledAt, observation? }`                   | `Appointment`   |
| `updateAppointment` | PUT    | `/appointment/:id`            | `{ scheduledAt?, observation? }` (`observation: null` limpa) | `Appointment`   |
| `deleteAppointment` | DELETE | `/appointment/:id`            | —                                                            | `void`          |

`GET /appointment/:id` **não foi implementada** nesta entrega: API-TELAS §1 a
marca como "Não necessário na entrega" (o formulário usa o item já carregado
na listagem). Se vier a ser necessária, exige contrato novo — não foi
inventada aqui.

## Limites

Fase 1 (contrato + testes + vermelho): stubs em
`src/api/endpoints/{educator,student,content,session,appointment}.ts` lançam
`Error("not implemented")` — nenhuma chamada real ao `apiClient` ainda.
Executor pode editar apenas `src/api/types.ts`,
`src/api/endpoints/{educator,student,content,session,appointment}.ts`,
`src/api/__tests__/endpoints.test.ts`, este contrato e
`docs/entrega-1/TRACKING.md`. Proibido: alterar `src/api/client.ts`,
`src/api/errors.ts`, backlog/roadmap/gates, instalar dependências,
commit/push, chamar backend real. Validação: `pnpm exec vitest run
src/api/__tests__/endpoints.test.ts`, `pnpm run typecheck`,
`pnpm run lint`, `pnpm exec prettier --write` nos arquivos tocados.

## Pendências

- `GET /appointment/:id` fora do escopo desta tarefa (ver acima). Registrado
  aqui para não ser reintroduzida sem contrato.
- Fase 2 (implementação real com `apiClient`) depende de aprovação do vermelho
  pelo orquestrador antes de prosseguir.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-305, após leitura de BACKLOG, API-TELAS e PROJECT
  Parte II.
