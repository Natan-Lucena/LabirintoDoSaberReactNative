# API-07 — Tipos, endpoints de leitura e mocks do contrato novo

> Refino da ficha
> [API-07 do BACKLOG](../BACKLOG.md#api-07--tipos-endpoints-de-leitura-e-mocks-do-contrato-novo),
> escrito em 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em
> [PLANO](../PLANO.md). A **leva 1** (atividades) está detalhada aqui; as levas 2 a 4 seguem o
> mesmo roteiro (§8) com os tipos da especificação de cada domínio.

| Campo           | Valor                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Onda            | E5-1 (leva 1), E5-5 (leva 2), E5-7 (leva 3), E5-9 (leva 4)                                                                                             |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio (fidelidade campo a campo, sem tela)                                                                    |
| Estimativa      | M por leva · leva 1: 6 h; levas 2 e 3: 5 h cada; leva 4: 4 h                                                                                           |
| Dependências    | G-61 e o gate do domínio (leva 1: G-64); a API-06 da leva para o contrato real. **Pode começar pela especificação** (mock-first) e ser ajustada depois |
| Backend         | Mock-first. **Vai para a `main` antes da leva** (tipos opcionais, funções e mocks não mudam nada para quem usa o backend real)                         |
| Dona nesta onda | `src/api/types.ts`, `src/api/errors.ts`, os arquivos novos de `src/api/endpoints/`, os handlers da leva, `src/mocks/install.ts`, `src/mocks/README.md` |
| Libera          | Todas as telas da leva                                                                                                                                 |

## 1. Objetivo e valor

Dar às telas da leva tipos, funções de leitura e mocks fiéis, para que os workers de tela
trabalhem em paralelo ao backend (G-29) e a integração seja trocar o mock pelo servidor sem
mudar a tela. É o mesmo papel da API-05 na Entrega 4.

## 2. Referência de design

Não se aplica (sem tela).

## 3. Fluxo

1. Antes do contrato real: implementar a partir da
   [especificação](../ESPECIFICACAO-BACKEND.md) e abrir o PR "mock-first".
2. Quando a leva sair: a API-06 registra o contrato no `PROJECT.md`; esta tarefa reabre (novo PR)
   só para as diferenças, campo a campo.

## 4. Estados

Não se aplica. Cada função devolve o dado ou lança `ApiError` (`normalizeApiError`).

## 5. Contrato de dados — leva 1 (atividades, §2 e §3 da especificação)

**Tipos em `src/api/types.ts`**

- `TaskType` ganha `"wordBuilder" | "colorMatch" | "memoryGame" | "printable"`.
- Novos: `TaskFormat`, `TaskSource`, `TaskTone`, `WordBuilderContent`, `ColorMatchContent`,
  `MemoryGameContent`, `PrintableContent`, `TaskContent`, `TaskSkill`, `TaskSummary`,
  `RecommendedTask`, `TaskCatalogPage` (`{ items: TaskSummary[]; nextCursor?: string }`),
  `ActivityResult`, `ActivitySummary` (`{ total; completed; correct }`).
- `Task` ganha `format?`, `source?`, `skills?: string[]`, `theme?`, `tone?`, `content?`.
  **Opcionais** enquanto o backend real não os mandar (hoje não manda); a API-06 da leva 1 decide
  se viram obrigatórios.
- `TaskNotebookSession.activityResults?: ActivityResult[]` (RS-07);
  `EvolutionContext.activityResults?: { taskId; title; taskType; completed; correct; attempts;
errors }[]` (RS-06).
- Em `src/api/endpoints/session-report.ts` (o tipo mora lá): `SessionReport.activitySummary?` e
  `activityResults?`.
- O `TaskInput` (IA e lote) **não** muda: a IA continua só na múltipla escolha.

**Auxiliares** (em `src/api/endpoints/task-catalog.ts`): `taskFormat(task)` (`printable` →
`PRINTABLE`, resto → `INTERACTIVE`, quando o campo faltar), `taskSource(task)` (ausente →
`EDUCATOR`), `isMultipleChoice(type)`.

**Funções de leitura** (`src/api/endpoints/task-catalog.ts`, novo)

| Função                            | Rota                    | Query key                                                              |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `listTaskCatalog(params)`         | `GET /task/catalog`     | `taskCatalogQueryKeys.list(params)` = `["task", "catalog", params]`    |
| `listTaskSkills()`                | `GET /task/skills`      | `taskCatalogQueryKeys.skills` = `["task", "skills"]`                   |
| `listRecommendedTasks(studentId)` | `GET /task/recommended` | `taskCatalogQueryKeys.recommended(id)` = `["task", "recommended", id]` |

- Parâmetros **na URL** (`URLSearchParams`, como `withQuery` em `evolution.ts`), omitindo os
  `undefined`: o adaptador de mocks lê `searchParams`, não `config.params`.
- Prefixo `["task", …]` de propósito: as invalidações existentes de `["task"]` cobrem o catálogo.
- Escritas **não** entram aqui: `duplicateTask` (ATV-09), `createActivity`/`updateTask` (ATV-11),
  `submitActivityResult` (EVO-03).

**Rótulos dos tipos novos**: acrescentar em `typeLabels` de
`src/features/reports/session/sessionReport.ts` (usado por `getTypeLabel` no detalhe e no
relatório): `wordBuilder` "Forme a palavra", `colorMatch` "Associe as cores", `memoryGame`
"Memória visual", `printable` "Imprimível". Fica aqui porque esta tarefa entra na `main` antes
das telas.

**Erros em `src/api/errors.ts`** (mensagem em português; o `code` continua o do servidor):

| Código                     | Mensagem                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `INVALID_CONTENT`          | "O conteúdo da atividade é inválido. Revise os campos marcados."                         |
| `ALTERNATIVES_NOT_ALLOWED` | "Este tipo de atividade não usa alternativas."                                           |
| `INVALID_MEDIA_URL`        | "Uma imagem ou um áudio não foi enviado pelo app. Escolha o arquivo de novo."            |
| `INVALID_SKILL`            | "Uma das habilidades escolhidas não existe mais. Atualize a lista."                      |
| `LIBRARY_TASK_READ_ONLY`   | "Atividades prontas não podem ser alteradas. Use \"Duplicar para editar\"."              |
| `TYPE_CHANGE_NOT_ALLOWED`  | "O tipo da atividade não pode ser alterado."                                             |
| `PRINTABLE_NOT_PLAYABLE`   | "Atividades imprimíveis não entram em cadernos, grupos ou sessões."                      |
| `USE_ANSWER_ROUTE`         | "Esta atividade não pode ser registrada como jogo."                                      |
| `RESULT_ALREADY_EXISTS`    | "O resultado desta atividade já foi registrado."                                         |
| `SESSION_ALREADY_FINISHED` | "A sessão já foi encerrada; o resultado não foi registrado."                             |
| `INVALID_CURSOR` (muda)    | "Não foi possível carregar mais itens. Atualize a lista." (hoje fala só de notificações) |

`TASK_NOT_FOUND`, `STUDENT_NOT_FOUND` e `SESSION_NOT_FOUND` continuam **sem** tradução (as telas
tratam pelo `code`; ver o comentário do `API_ERROR_MESSAGES`). Atualizar o teste de
`INVALID_CURSOR` em `src/api/__tests__/errors-leva-3.test.ts` se ele ler a mensagem.

## 6. Regras dos mocks (leva 1)

1. **Arquivo novo** `src/mocks/handlers/task-catalog.ts`, registrado em `src/mocks/install.ts`.
2. **Biblioteca fictícia** (`source: "LIBRARY"`, `educatorId` da plataforma): 3 `wordBuilder`
   ("BOLA", "PÃO", "GATO"), 3 `colorMatch` (3 a 4 pares: Azul, Vermelho, Amarelo, Verde), 3
   `memoryGame` (2, 3 e 4 cartas, uma com imagem), 5 `printable` (um de cada `layout`, um com
   imagem, um com `answerLines`), e 2 múltiplas escolhas; mais **uma de cada tipo novo do
   educador** (`source: "EDUCATOR"`). Tons variados. Sem dado de criança.
3. **6 habilidades** com `code`, `label` e `learningTopics` coerentes com os `learningTopics`
   dos pacientes fictícios de `src/mocks/fixtures.ts`.
4. `GET /task/catalog`: filtros `format`, `type`, `skill`, `category`, `source`; `search` sem
   acento e sem maiúscula (`normalize("NFD")` + remoção de diacríticos) em prompt, tema, título
   e rótulo da habilidade; `limit` 1–50 (padrão 20, fora disso `400`); cursor = deslocamento em
   string; cursor que não é número → `400 INVALID_CURSOR`.
5. `GET /task/recommended`: paciente fictício conhecido → até 6 itens com `reason`
   ("{habilidade} · dificuldade mapeada"); paciente sem `learningTopics` → `[]`; id desconhecido
   → `404 STUDENT_NOT_FOUND`; sem `studentId` → `400`.
6. `GET /task/:id` (hoje registrado em `src/mocks/handlers/task-delete.ts`) passa a encontrar as
   tarefas novas, com `content`; `GET /task/` (em `content.ts`) devolve também as do educador
   dos tipos novos, com os campos novos (AT-11).
7. `GET /session-evolution/context/:sessionId` (`evolution.ts`): uma sessão fictícia com dois
   `activityResults`; as outras sem o campo.
8. `GET /task-notebook-session/report/:sessionId` (`session-report.ts`): `activitySummary` na
   mesma sessão.
9. Seção "Banco de atividades (API-07, leva 1)" no `src/mocks/README.md`: rotas, cenários e
   lacunas.

## 7. Plano de implementação (leva 1)

1. Tipos (§5) em `src/api/types.ts` e `session-report.ts`.
2. `src/api/endpoints/task-catalog.ts` com funções, chaves e auxiliares.
3. Mocks (§6) e `install.ts`.
4. Erros e rótulos (§5).
5. Testes: `src/api/endpoints/__tests__/task-catalog.test.ts` pelo `apiClient` real com o
   `mockAdapter` (padrão de `notifications.test.ts`: `vi.mock("@/config/env")`, troca do
   `adapter` no `beforeEach`), sucesso e erro principal de cada rota;
   `src/api/__tests__/errors-e5-leva-1.test.ts` para as mensagens.
6. `pnpm run typecheck` deve continuar verde: os campos novos opcionais não quebram as telas.

## 8. Levas 2 a 4 (mesmo roteiro)

| Leva | Onda | Tipos (especificação)                                                                                                    | Endpoints de leitura (arquivo novo)                                                                                              | Mocks                                        | Telas que usam                 |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| 2    | E5-5 | §4.3: clínica, membro, papel, convite (com prévia), compartilhamento; `Educator.clinic?`, `Student.access?`/`ownerName?` | `clinic.ts`: `GET /clinic/`, `GET /clinic/invites`, `GET /clinic/invites/preview/:code`; `GET /student/:id/shares`               | `clinic.ts`, `student.ts`                    | EQP-01, EQP-02, EQP-03, EQP-04 |
| 3    | E5-7 | §5.2 e §6.2: status, overview e pendências do paciente; série de atendimentos                                            | `student-status.ts`: `GET /student/overview`, `GET /student/:id` (PP-09); `appointment-series.ts`: `GET /appointment/series/:id` | `student-status.ts`, `appointment-series.ts` | PAC-10, PAC-11, AGE-06, FEC-06 |
| 4    | E5-9 | §7.2 e §8.2: token de push, preferências, tutorial                                                                       | `push.ts`: `GET /notification/preferences`; `help.ts`: `GET /help/tutorials`                                                     | `push.ts`, `help.ts`                         | NOT-02, AJD-01                 |

Em cada leva: códigos de erro novos do domínio com mensagem em português, testes pelo
`apiClient` real (sucesso e erro principal) e seção no `src/mocks/README.md`. O detalhe de uso
de cada rota fica no card da tela (blocos C a E).

## 9. Arquivos

- **Permitidos (leva 1):** `src/api/types.ts`, `src/api/errors.ts`,
  `src/api/endpoints/task-catalog.ts` (novo), `src/api/endpoints/session-report.ts` (só tipos),
  `src/mocks/handlers/{task-catalog (novo),task-delete,content,evolution,session-report}.ts`,
  `src/mocks/install.ts`, `src/mocks/README.md`,
  `src/features/reports/session/sessionReport.ts` (só `typeLabels`), testes de `src/api` e
  `src/mocks`.
- **Proibidos:** telas (`src/features/**` exceto a linha dos rótulos, `app/**`), escritas
  usadas só por uma tela, `package.json`.

## 10. Critérios de aceite

| ID           | Critério                                                                                        | Verif. |
| ------------ | ----------------------------------------------------------------------------------------------- | ------ |
| AC-API-07-01 | Tipos e mocks seguem o contrato registrado (ou a especificação, no mock-first), campo a campo   | `REV`  |
| AC-API-07-02 | Cada rota tem teste pelo `apiClient` real com sucesso e com o erro principal                    | `UT`   |
| AC-API-07-03 | Os códigos de erro novos têm mensagem em português                                              | `UT`   |
| AC-API-07-04 | A biblioteca mock tem ao menos uma atividade de cada tipo novo e um imprimível de cada `layout` | `UT`   |
| AC-API-07-05 | Com os mocks desligados, o app continua funcionando contra o backend atual (campos opcionais)   | `REV`  |

## 11. Como testar manualmente (Victor)

Nada visível sozinho: a tarefa é verificada pelos testes e pela revisão. Com a ATV-09 na `main`,
o roteiro dela usa estes mocks.

## 12. Riscos e perguntas em aberto

- Mock-first exige uma segunda passada quando o contrato real sair (como na Entrega 4); por isso
  a tarefa aparece em várias ondas.
- **Arquivo único `types.ts`**: duas levas não podem estar abertas ao mesmo tempo; o PLANO
  sequencia.
- Se o backend mudar a resposta de `POST /task/create` para `201 Task` só numa rota nova, a
  ATV-11 trata; aqui só o tipo.

## 13. Fora do escopo

Telas, escritas de uma tela só, mudança no cliente HTTP (`src/api/client.ts`) ou no persister.
