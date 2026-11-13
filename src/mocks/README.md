# Camada de mocks (G-29)

Os mocks ficam desligados por padrão (G-51); ative-os explicitamente com
`EXPO_PUBLIC_USE_MOCKS=true` em desenvolvimento. Este módulo instala um
adaptador Axios customizado em `apiClient`
(`src/api/client.ts`, sem editá-lo) que responde aos endpoints registrados
com dados fictícios tipados por `src/api/types.ts`.

## Ligar/desligar

Controlado por `EXPO_PUBLIC_USE_MOCKS` (lido em `src/config/env.ts`,
`getRuntimeUseMocks`):

- Ausente ou vazia: `false` em todos os ambientes.
- `"true"`/`"false"` (case-insensitive): força o valor; `true` é proibido em `production`.

`src/mocks/install.ts#installApiMocks()` é chamado uma vez no boot do app
(`src/app-shell/AppProviders.tsx`). Se a flag for `false`, não faz nada —
`apiClient` mantém o adaptador HTTP real do Axios.

## Endpoints mockados

Autenticação (T-401):

- `POST /educator/sign-in`
- `GET /educator/me`

Dados da Home (T-601):

- `GET /appointment/`
- `GET /student/`
- `GET /educator/get-last-sessions`
- `GET /task-notebook/`

Grupo por id (FEC-04): `GET /task-group/:id` devolve grupo próprio ou de outro
educador quando está em caderno do usuário (ex.: `group-shared` no `notebook-1`).
`group-private` simula `403 UNAUTHORIZED`; id inexistente retorna
`404 TASK_GROUP_NOT_FOUND`. A lista por educador omite os grupos alheios.

Agendamentos (T-901, AGE-03):

- `GET /appointment/:id`
- `POST /appointment/`
- `PUT /appointment/:id`
- `DELETE /appointment/:id`

Sessão (SES-01, provisório por G-06/G-29):

- `POST /task-notebook-session/start` aceita somente `studentId` e `name`; retorna uma sessão fictícia aberta. O nome literal `erro de validação` simula `400 { message: "Validation error" }`.
- `GET /task-notebook-session/student/:studentId` retorna as sessões fictícias; `student-5` inicia com uma sessão aberta para o cenário de retomada.
- `POST /task-notebook-session/finish` finaliza uma sessão aberta. O mock não cria vínculo com caderno porque esse campo não existe no contrato da API (G-06).

Os handlers de agendamento mantem estado somente em memoria durante a sessao do
app, usam ids ficticios e devolvem `400 NOT_FOUND` para GET/PUT/DELETE de id
ausente. O `DELETE` responde o texto `OK`. As regras do backend (AGE-03):

- Transições de status: `PENDING → COMPLETED | CANCELLED` e `CANCELLED → PENDING`;
  qualquer outra devolve `409 { message: "INVALID_STATUS_TRANSITION" }`.
- Mudar `scheduledAt`, `type` ou `durationMinutes` de um atendimento que continua
  `CANCELLED` ou `COMPLETED` devolve `409 { message: "APPOINTMENT_NOT_EDITABLE" }`; a
  observação pode mudar. Reativar e remarcar juntos (`{ status: "PENDING", scheduledAt }`) vale.
- Se o intervalo `[scheduledAt, scheduledAt + durationMinutes)` se sobrepõe ao de outro
  `PENDING`, devolve `409 { message: "APPOINTMENT_CONFLICT", conflictingAppointmentId }`;
  horários encostados não conflitam. A duração padrão é 50 minutos.
- Os `409` são entregues como resposta com `status: 409` (o adaptador não carrega
  campos extras num erro); `src/api/endpoints/appointment.ts` aceita o `409` por
  `validateStatus` e lança `AppointmentApiError` com `conflictingAppointmentId`.
  Para acionar no app: crie dois atendimentos sobrepostos no mesmo horário.

## Cenários (e-mails reservados, `src/mocks/fixtures.ts`)

| E-mail                          | Senha      | Resultado                                  |
| ------------------------------- | ---------- | ------------------------------------------ |
| `educadora.mock@labirinto.test` | `senha123` | Sucesso: token fictício + `Educator` mock. |
| `invalido.mock@labirinto.test`  | qualquer   | `401 INVALID_CREDENTIALS`.                 |
| `semrede.mock@labirinto.test`   | qualquer   | Falha de rede (sem `response`).            |
| Qualquer outro e-mail           | qualquer   | `401 INVALID_CREDENTIALS` (mesmo padrão).  |

Todos os dados são fictícios (nome, e-mail, token); nenhum dado real de
usuários ou crianças é usado.

## Como estender (para tarefas futuras)

1. Adicionar fixtures fictícias em `src/mocks/fixtures.ts` (ou um arquivo de
   fixtures próprio do domínio, se preferir).
2. Registrar um handler com `registerMockHandler({ method, path }, handler)`
   de `src/mocks/handlers/registry.ts`, em um arquivo próprio dentro de
   `src/mocks/handlers/` (ex.: `student.ts`, `content.ts`), seguindo o
   padrão de `src/mocks/handlers/educator.ts`.
3. Importar esse arquivo por efeito colateral em `src/mocks/install.ts`
   (`import "@/mocks/handlers/<novo>";`) para garantir o registro no boot.
4. Erros: lance `MockApiError(status, code, message?)` para respostas de
   erro com `status`/`response`, ou `MockNetworkError()` para simular falha
   de rede. Ambos em `src/mocks/handlers/types.ts`.

Não recriar o adaptador nem duplicar a instalação — um único
`installApiMocks()` cobre todos os handlers registrados.

## Cenários da Home

As fixtures da Home usam somente nomes e dados fictícios. Os agendamentos são
gerados para o dia atual em `America/Sao_Paulo`, incluindo `PENDING`,
`COMPLETED` e `CANCELLED`; o último não entra na contagem da Home. Durante o
desenvolvimento, chame `setMockHomeScenario("no-sessions")` de
`src/mocks/fixtures` para o cenário `no-sessions`, que devolve `404
EDUCATOR_DOES_NOT_HAVE_SESSIONS` para últimas sessões e `no-appointments`
devolve uma agenda vazia, permitindo observar o estado 03.

## Limitação atual

Os endpoints de autenticação e Home acima estão cobertos. Telas seguintes que
dependam de outros endpoints devem estender o registro (item acima), não criar
um segundo adaptador.

## Atividades com IA

- `POST /ai-task/generate` devolve rascunhos textuais `multipleChoice`, sem persistir.
- `POST /task/batch` persiste as tarefas recebidas e cria o grupo correspondente.
- Envie `quantity` fora de 1--15 para receber `400 INVALID_QUANTITY`; inclua
  `[AI_GENERATION_FAILED]` nas instruções para simular `500 AI_GENERATION_FAILED`.

## Player da sessão (SES-02)

`POST /task-notebook-session/answer` responde com sucesso por padrão. Durante o
desenvolvimento, importe `setMockSessionAnswerScenario` de
`src/mocks/handlers/session-analysis` e passe `"already-answered"` para retornar
`400 TASK_ALREADY_ANSWERED`, ou `"network-error"` para uma falha sem resposta;
volte para `"success"` ao terminar. Os cenários mantêm o contrato do endpoint:
corpo com `sessionId`, `taskId`, `selectedAlternativeId` e `timeToAnswer`, e
sucesso com `200 TaskNotebookSession`.

### Sessão ligada ao caderno (SES-05)

`POST /task-notebook-session/start` guarda `taskNotebookId` e `appointmentId`
(opcionais; `null` quando ausentes) e `GET /task-notebook-session/student/:studentId`
os devolve. Quando a sessão tem caderno, `POST /task-notebook-session/answer`
responde `400 TASK_NOT_IN_NOTEBOOK` para uma tarefa que não está no caderno nem
nos grupos dele (`MOCK_TASK_NOTEBOOKS`); sessão sem caderno aceita qualquer tarefa.

### Sessão ligada ao atendimento (AGE-04)

`POST /task-notebook-session/start` com `appointmentId` de um atendimento que não
existe, ou que é de outro paciente, responde `404 APPOINTMENT_NOT_FOUND`.
`POST /task-notebook-session/finish` de uma sessão iniciada com `appointmentId` muda
o atendimento de `PENDING` para `COMPLETED` no mock de `/appointment/` (os demais
status ficam como estão), como o backend faz.

## Relatório da sessão

- `GET /task-notebook-session/report/:sessionId` responde aos relatórios fictícios
  de `mock-session-1` e `mock-session-2`, incluindo métricas nulas para validar a
  apresentação de "—".
- Use `session-not-found` como `sessionId` para receber `404 SESSION_NOT_FOUND`.

## Relatórios do aluno

- `POST /task-notebook-session/analysis/student/:studentId/snapshot` gera e guarda
  em memória um snapshot com o mesmo filtro da análise (`limit` ou datas; os dois
  juntos devolvem `400 INVALID_ANALYSIS_FILTER`). O contrato não devolve `id` nem
  data de criação.
- `GET /task-notebook-session/analysis/student/:studentId/history` lista os
  snapshots salvos do paciente; vazio quando não há nenhum.

## Análise psicopedagógica com IA

- `GET /task-notebook-session/analysis/student/:studentId/ai` devolve `{ analysis }`
  em Markdown com as sete seções do contrato. `templateId` acrescenta uma frase
  sobre a anamnese. `limit` junto de datas devolve `400 Bad Request`.
- Para simular `500 AI_ANALYSIS_FAILED`, chame `setMockAiAnalysisScenario("failure")`
  de `src/mocks/handlers/session-analysis`; `"success"` volta ao normal.
- `GET /anamnese/templates/` lista dois modelos fictícios.

## Modelos de anamnese (PAC-08)

- `GET /anamnese/templates/` lista os modelos do educador mockado; `GET /anamnese/templates/:templateId` detalha um modelo.
- `POST /anamnese/templates/` cria e `PUT /anamnese/templates/:templateId` edita com título, descrição e perguntas; `DELETE /anamnese/templates/:templateId` remove e devolve `200 null`.
- Um ID inexistente devolve `404 TEMPLATE_NOT_FOUND`. Use `has-responses` como ID em PUT ou DELETE para receber `400 TEMPLATE_HAS_RESPONSES`.

## Respostas de anamnese (PAC-06)

- `GET /anamnese/responses/student/:studentId` lista as respostas completas do paciente (`student-1` tem `response-1`, do modelo `template-1`).
- `POST /anamnese/templates/:templateId/responses` cria; `PUT /anamnese/responses/:responseId` edita com o mesmo `answers`, grava `updatedAt` e mantém `answeredAt`.
- Validações: `MISSING_REQUIRED_ANSWER`, `MISSING_TEXT_VALUE`, `MISSING_SELECTED_OPTION(S)`, `MISSING_FILE_URL`, `INVALID_QUESTION_ID`, `INVALID_OPTION_ID`; `404 TEMPLATE_NOT_FOUND`, `STUDENT_NOT_FOUND`, `RESPONSE_NOT_FOUND`.
- `response-other` é de outro educador: `PUT` devolve `403 UNAUTHORIZED` e `GET /anamnese/responses/:responseId` devolve `401 Unauthorized` (D4). O app não chama essa rota.
- `POST /anamnese/responses/upload-file` (multipart `file`) devolve `{ url }`; sem arquivo, `400 FILE_REQUIRED`.

## Fidelidade ao backend real (2026-10-09)

Conferido contra `https://labirinto-do-saber.vercel.app`; os mocks seguem estas escalas:

- `accuracy` da análise do aluno é **fração de 0 a 1** (G-43); `percentageByCategory` e
  `percentageByType` do relatório da sessão são de 0 a 100.
- `timeToAnswer` e as médias do relatório (`averageTimePerQuestion`, `averageCorrectTime`,
  `averageIncorrectTime`) são em **milissegundos**; `totalTimeSession` é em **segundos** (G-07).
- `GET /educator/me` exige token no backend real (o mock não exige, o que escondeu o defeito do
  login: ver PR #65). O login real chama `getMe(token)` com o token recém-emitido.
- As rotas de IA (`/ai-task/generate`, `.../analysis/student/:id/ai`) levam de 30 a 45 s no
  backend real; o cliente usa `AI_TIMEOUT_MS` (90 s) nelas.
- O backend real não devolve tarefas no `start` da sessão (G-06): o player usa o conteúdo
  escolhido no app.

## Contrato de 2026-10-29 (API-03)

### Edição de paciente (PAC-07)

`PUT /student/update/:id` recebe multipart com campos opcionais. Altera o aluno
fictício em memória e o resultado aparece em `GET /student/`. Campos vazios do
responsável são ignorados; o telefone exige 7 a 15 dígitos. Use
`student-not-assigned` como ID para simular `400
STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`; um ID inexistente retorna `404
STUDENT_NOT_FOUND`.

- Atendimentos devolvem `durationMinutes` (50 por padrão), `type`, `observation` e
  `notifiedAt`; criação e edição aceitam `type` e `durationMinutes` e respondem sem
  campos prefixados por `_`. Transições de status e conflitos ficam para AGE-03.
- Alunos devolvem `guardianName`, `guardianPhone` e `guardianRelationship` como `null`
  quando vazios. A criação aceita esses campos opcionais, com telefone só em dígitos.
  O endpoint do app remove `educators` antes de expor a resposta ao cache.
- O educador fictício tem `profession: null`. Sessões devolvem `taskNotebookId` e
  `appointmentId` como `null` quando não vinculadas; o início aceita os dois IDs.

## Perfil e conta (REC-02)

- `PUT /educator/update-educator` aceita somente `newName`, `newContact` e `newProfession` opcionais de 3 a 100 caracteres. A resposta imita o formato real com campos `_name`, `_contact`, `_profession`, `_photoUrl` e `_password`; o app a descarta e refaz `GET /educator/me`.
- `PUT /educator/update-profile-picture` exige multipart `photo` e atualiza a URL fictícia da foto. O cliente recusa arquivos acima de 5 MB.

## Planos com IA (PLN-01)

`GET /plan/` devolve os planos do educador fictício como `PlanSummary` (tudo menos `goals`,
mais `studentName`), `ACTIVE` primeiro e depois `updatedAt` decrescente, e aceita `studentId`,
`status` e `type`. `GET /plan/:id` devolve o plano com as metas. Há um PDI ativo, um PE ativo e
um PDI concluído; `progress` é calculado das metas com a regra do servidor. Use
`mock-student-foreign` no filtro para simular `403 UNAUTHORIZED`; o plano `mock-plan-foreign`
responde `403` no detalhe, e um ID inexistente responde `404 PLAN_NOT_FOUND`. Os dados ficam em
`mockPlans` (src/mocks/handlers/plans.ts) para as próximas tarefas de planos estenderem.

## Gerar plano com IA (PLN-02)

`POST /plan/generate` devolve um `PlanDraft` fictício em português com três metas e datas
sugeridas; não acrescenta nada a `mockPlans`. Para PDI, use `durationMonths: 3` ou `6`;
para PE, use `sessionDate` e opcionalmente `parentPlanId: "mock-plan-1"`. O mock usa a
data de hoje em `America/Sao_Paulo` para o PDI. `studentId: "unknown"` simula
`404 STUDENT_NOT_FOUND` e `mock-student-foreign` simula `403 UNAUTHORIZED`.
Modelo inexistente simula `404 TEMPLATE_NOT_FOUND`, um PE
como plano pai simula `400 INVALID_PARENT_PLAN`, e marcadores no foco
`[AI_GENERATION_FAILED]` e `[AI_INVALID_OUTPUT]` simulam as falhas 500. A rota já
é registrada pelo import existente de `src/mocks/handlers/plans.ts` em
`src/mocks/install.ts`.

## Salvar plano (PLN-03)

`POST /plan/` acrescenta um plano `ACTIVE` a `mockPlans`, com metas ordenadas,
progresso inicial calculado e, no PE, vigência igual à data da sessão. Um segundo
PDI ativo para `student-1` devolve `409 ACTIVE_PDI_ALREADY_EXISTS` com
`activePlanId: "mock-plan-1"`. O handler valida limites das metas, datas e os
campos exclusivos do PE. A rota usa o import de `plans.ts` já presente em
`src/mocks/install.ts`.

## Detalhe do plano (PLN-04)

`PUT /plan/:id` edita título, objetivo, notas, vigência e a lista completa de metas: `id`
existente atualiza, ausência de `id` cria e meta omitida é removida. Meta atingida não pode
ser removida (`409 GOAL_ACHIEVED_CANNOT_BE_REMOVED`). O mock valida `DUPLICATE_GOAL_ID`,
`GOAL_NOT_FOUND`, `PLAN_WITHOUT_GOALS`, `TOO_MANY_GOALS` e `INVALID_DATES`. Notas e próxima
revisão vazias mantêm o valor anterior, como no backend.

`PUT /plan/:id/goals/:goalId` troca o status da meta, grava ou limpa `achievedAt` e
recalcula `progress`. `POST /plan/:id/reviews` guarda nota, próxima revisão opcional e
retrato dos status das metas; `GET /plan/:id/reviews` devolve as revisões mais recentes
primeiro. `PUT /plan/:id/status` encerra o plano com `closedAt`. Todas as escritas de um
plano encerrado respondem `409 PLAN_NOT_EDITABLE`. As rotas usam o import de `plans.ts`
já presente em `src/mocks/install.ts`.

## Sugestões da IA (PLN-05)

`POST /plan/:id/suggestions/generate` cria sugestões fictícias em português até o plano ter 3
pendentes (`UPDATE_GOAL_STATUS`, `ADD_GOAL`, `SCHEDULE_REVIEW` e `REWRITE_GOAL`, coerentes com as
metas do plano) e responde `201` com as novas, ou `200 []` quando já há 3 ou nada muda. Plano
encerrado responde `409 PLAN_NOT_EDITABLE`; um título com `[AI_GENERATION_FAILED]` simula
`500 AI_GENERATION_FAILED`. `GET /plan/suggestions` aceita `?status=` (inválido: `400`) e
devolve as mais recentes primeiro; `mock-plan-1` já começa com uma pendente
(`mock-suggestion-1`). `POST /plan/suggestions/:id/accept` aplica a mudança no plano com as
regras da edição e devolve o `Plan`; meta removida, plano encerrado ou limite de 10 metas
respondem `409 SUGGESTION_NOT_APPLICABLE` e a sugestão vira `DISMISSED`. Sugestão já resolvida
responde `409 SUGGESTION_ALREADY_RESOLVED`, ID inexistente `404 SUGGESTION_NOT_FOUND`.
`POST /plan/suggestions/:id/dismiss` devolve a sugestão `DISMISSED`. Encerrar um plano descarta
as pendentes dele. As rotas usam o import de `plans.ts` já presente em `src/mocks/install.ts`.

## Senha e evolução da sessão (API-05, leva 1)

Contrato **provisório**, copiado de `docs/entrega-4/ESPECIFICACAO-BACKEND.md` §2 e §3 (G-29, mock-first)
e a conferir em API-04. Os tipos estão em `src/api/types.ts`, as leituras em
`src/api/endpoints/evolution.ts` e os mocks em `handlers/password.ts` e `handlers/evolution.ts`.

### Senha (`handlers/password.ts`)

- `PUT /educator/generate-token` (`{ email }`; `educatorEmail` também é aceito, como no contrato
  atual) responde sempre `200 { message: "TOKEN_SENT" }`, exista ou não a conta. Só a conta fictícia
  (`educadora.mock@labirinto.test`) recebe o código `123456`, válido por 15 min; um envio novo
  invalida o anterior. O 4º envio em 15 min para o mesmo e-mail dá `429 TOO_MANY_REQUESTS`.
- `POST /educator/verify-token` confere o código sem consumi-lo: `200 { valid: true }`,
  `400 INVALID_TOKEN` ou `400 EXPIRED_TOKEN`. E-mail sem conta também responde `INVALID_TOKEN`.
- `POST /educator/update-password` exige `token` (sem ele, `400 Validation error`) e senha de 6 a
  100 caracteres. Erros: `INVALID_TOKEN`, `EXPIRED_TOKEN`, `PASSWORD_SAME_AS_OLD`; a 5ª tentativa
  errada (somando verify e update) invalida o código e a seguinte dá `429 TOO_MANY_ATTEMPTS`.
  Sucesso consome o código e responde `200 { message: "PASSWORD_UPDATED" }` (corpo não definido na
  especificação).
- `PUT /educator/change-password` (exige o login do mock; senão `401`) devolve `200 { token }` com o
  mesmo token do mock, porque `GET /educator/me` só reconhece esse (SN-08 não é simulado).
  Erros: `INVALID_CURRENT_PASSWORD`, `PASSWORD_SAME_AS_OLD`.
- A senha vigente fica só no estado do módulo (começa em `senha123`); o `sign-in` do mock continua
  não conferindo senha. Testes usam `resetMockPasswordState()` e `expireMockPasswordToken(email)`.

### Evolução (`handlers/evolution.ts`)

- `GET /session-evolution/context/:sessionId` escolhe o plano pela regra G-57 (PE ativo do mesmo
  atendimento; senão PE ativo da data; **nunca PDI**) e devolve os critérios sugeridos (metas
  `NOT_STARTED` e `IN_PROGRESS`). `mock-evo-session-pe` tem PE (`mock-plan-2`);
  `mock-session-1` só tem PDI e vem sem plano.
- `POST /session-evolution/` valida o corpo e grava de forma atômica: `404 SESSION_NOT_FOUND`,
  `403 UNAUTHORIZED`, `409 SESSION_NOT_FINISHED` (use `mock-open-session`), `400 INVALID_PLAN` (`planId` precisa ser um PE do paciente; PDI é recusado, EV-05/G-57),
  `GOAL_NOT_IN_PLAN`, `INVALID_ATTEMPTS`, `409 PLAN_NOT_EDITABLE` (plano encerrado do paciente).
  A segunda evolução da mesma sessão responde `409` com `{ message: "EVOLUTION_ALREADY_EXISTS",
evolutionId }` como **resposta** (não erro lançado), como o `409` de conflito de atendimentos;
  `goalUpdates` muda as metas do plano em `mockPlans` e o registro vira a observação da sessão.
- `GET /session-evolution/` (`studentId`, `from`, `to`, `limit` 1 a 100), `GET /session-evolution/:id`,
  `PUT /session-evolution/:id` (`goalUpdates` aplica só a diferença; nunca exclui) e
  `GET /session-evolution/pending` (`days` 1 a 90; padrão 30). `mock-session-2` já tem a evolução
  `mock-evolution-1`; `mock-evolution-foreign` e `mock-evo-session-foreign` simulam `403`.
  `mock-evo-session-recent` está pendente; `mock-evo-session-old` (60 dias) só com `days` maior.
- `POST /session-evolution/next-session-suggestion` devolve `{ suggestion, rationale }` sem persistir.
  `[AI_GENERATION_FAILED]` ou `[AI_INVALID_OUTPUT]` no `descriptiveRecord` simulam as falhas `500`.
- As sessões vêm de `mock-session-*` (fluxo de sessão do app) mais as do próprio arquivo.
- `resetMockEvolutionState()` (`handlers/evolution.ts`) restaura as evoluções semente, as sessões do
  arquivo e uma cópia limpa dos planos (metas, progresso; planos criados depois saem de `mockPlans`).
  Não há reset global dos mocks; os testes o chamam em `beforeEach` e `afterEach`.
- **EV-08:** o registro descritivo aparece como `observation` em
  `GET /task-notebook-session/report/:sessionId`. O handler de `session-report.ts` só conhece
  `mock-session-1` e `mock-session-2`; `handlers/evolution.ts` o envolve: a observação vem da
  evolução (inclusive após `PUT`) e, para uma sessão finalizada criada pelo fluxo do app, o
  relatório é montado com o nome e as respostas da sessão.

### Pendências e lacunas da especificação (mocks da leva 1)

- **EV-10/EV-11 não simulados:** `evolutionId` em `GET /task-notebook-session/student/:studentId` e
  no detalhe da sessão fica para o EVO-05.
- **EV-05 × BE-EV-03:** EV-05 manda `INVALID_PLAN` para plano que não seja PE `ACTIVE`, mas BE-EV-03
  pede `409 PLAN_NOT_EDITABLE` para plano encerrado. O mock segue BE-EV-03 para um PE encerrado do
  paciente (409) e `INVALID_PLAN` para PDI, inexistente ou de outro paciente. A confirmar na API-04.
- **`TOO_MANY_ATTEMPTS` em `verify-token` revela conta real:** só o e-mail com conta acumula
  tentativas e chega ao `429`; e-mail sem conta responde sempre `INVALID_TOKEN`. Lacuna da
  especificação (SN-02 quer não revelar contas); a confirmar na API-04.

## Escalas e síntese da anamnese (API-05, leva 2)

Contrato **provisório**, copiado de `docs/entrega-4/ESPECIFICACAO-BACKEND.md` §4 e §5 (G-29,
mock-first) e a conferir em API-04. Tipos em `src/api/types.ts`, leituras em
`src/api/endpoints/scales.ts` e mocks em `handlers/scales.ts` e `handlers/anamnese-summary.ts`.
As escritas (iniciar, responder, concluir, insight, excluir, gerar síntese) **só têm mock**: as
funções de endpoint ficam com as telas AVA-\* e PAC-\*.

### Escala fictícia (G-55)

O catálogo tem a escala `mock-scale-1` (versão 2, 6 itens "Item de exemplo N", opções Nunca, Às
vezes, Frequentemente, Muito, soma de 0 a 18, duas subescalas de 3 itens) e `mock-scale-inactive`
(`active: false`). **Itens, opções e faixas são inventados**: o instrumento real vem do responsável
clínico e do seed do backend. Faixas do total (v2): 0-5 baixo, 6-11 moderado, 12-18 alto; a v1 (só
usada pela aplicação semente) tem 0-6, 7-12 e 13-18, para provar que a aplicação lê a sua versão.

### Rotas (`handlers/scales.ts`)

- `GET /scale-template/` (resumo com `itemCount`, sem `items`) e `GET /scale-template/:id`
  (`404 SCALE_NOT_FOUND`).
- `POST /scale-application/` (`201`): `400 Validation error`, `403 UNAUTHORIZED` (paciente alheio),
  `404 STUDENT_NOT_FOUND`/`SCALE_NOT_FOUND`, `409 SCALE_INACTIVE`. Se já existe rascunho do mesmo
  paciente e escala, responde `409` com `{ message: "DRAFT_ALREADY_EXISTS", applicationId }` como
  **resposta** (não erro lançado), como o `EVOLUTION_ALREADY_EXISTS` da leva 1: a tela precisa de
  `validateStatus` que aceite 409 para ler o `applicationId`.
- `GET /scale-application/` (`studentId`, `status` `DRAFT`/`COMPLETED`, `limit` 1 a 100, padrão 50;
  `400` em filtro inválido, `403` em paciente alheio): só do educador, **mais recente primeiro**
  (por `updatedAt`), sem `answers`. `GET /scale-application/:id`: `403`, `404 APPLICATION_NOT_FOUND`.
- `PUT /scale-application/:id/answers` valida tudo antes de gravar (`400 Validation error`,
  `ITEM_NOT_IN_SCALE`, `INVALID_ANSWER_VALUE`), faz upsert por `itemId` e recalcula o escore.
- `POST /scale-application/:id/complete`: com itens faltando responde `400` com
  `{ message: "SCALE_INCOMPLETE", missingItemIds }` como **resposta** (mesma razão do 409 acima:
  a tela precisa de `validateStatus` que aceite 400); completo, vira `COMPLETED` com `completedAt`
  e fica somente leitura.
- `POST /scale-application/:id/insight` (texto determinístico de até 800 caracteres, sem
  diagnóstico; `preliminary` é `true` em rascunho; gerar de novo substitui), sem atraso simulado.
  `DELETE /scale-application/:id` (`204`, só rascunho).
- Erros comuns: `403 UNAUTHORIZED` (aplicação de outro educador) e `404 APPLICATION_NOT_FOUND`;
  `409 APPLICATION_NOT_EDITABLE` ao editar, concluir ou excluir uma aplicação `COMPLETED`.
- Sementes: `mock-scale-app-completed` (`student-1`, v1, soma 12, `COMPLETED`),
  `mock-scale-app-draft` (`student-2`, 3 de 6 itens) e `mock-scale-app-foreign` (outro educador).
- Falha de IA simulada por `setMockScaleAiFailure("AI_GENERATION_FAILED" | "AI_INVALID_OUTPUT" | null)`;
  `resetMockScaleState()` restaura as sementes e desliga a falha. Os testes o chamam em
  `beforeEach` e `afterEach`.

### Síntese da anamnese (`handlers/anamnese-summary.ts`)

- `POST /anamnese/responses/:responseId/summary` gera uma síntese determinística (até 1500
  caracteres, em tópicos, sem diagnóstico), persiste em memória e devolve **a resposta da anamnese**
  com `summary` e `summaryOutdated: false`. `404 RESPONSE_NOT_FOUND`, `403 UNAUTHORIZED` (resposta de
  outro educador), `500 AI_GENERATION_FAILED`/`AI_INVALID_OUTPUT` via
  `setMockAnamneseSummaryFailure(...)`; `resetMockAnamneseSummaryState()` limpa tudo.
- O arquivo **envolve** os handlers existentes de `anamnese-responses.ts`:
  `GET .../student/:studentId`, `GET .../:responseId` e `PUT .../:responseId` só ganham `summary` e
  `summaryOutdated` quando há síntese; sem síntese o corpo é idêntico ao de antes. Editar a resposta
  (`PUT`) depois da síntese marca `summaryOutdated: true`; gerar de novo zera. O `GET` por id de
  resposta alheia continua `401` (D4), não `403`.

### Interpretações e lacunas (mocks da leva 2)

- **AV-06 (G-60):** a faixa parcial usa a soma dos itens respondidos contra as faixas do total da
  escala (não proporcional) e some quando nenhum item foi respondido.
- **Ordem das validações no `PUT .../answers`:** `404`/`403`, depois `409 APPLICATION_NOT_EDITABLE`,
  depois `400`. A especificação não fixa a ordem.
- **Insight (IN-01 a IN-04):** permitido em `DRAFT` e `COMPLETED`, mesmo sem respostas; não envia
  nada a provedor real. Responder de novo depois do insight não o apaga.
- **AS-01:** a especificação não define o corpo de resposta do `POST .../summary`; o mock devolve a
  resposta da anamnese completa.
- **Tipo da anamnese:** `AnamneseSummaryFields` (`src/api/types.ts`) traz os campos opcionais
  novos; a interface `AnamneseResponse` (em `endpoints/anamnese-responses.ts`) deve estendê-la na
  tarefa de tela que a usar.
- **`RESPONSE_NOT_FOUND` e `STUDENT_NOT_FOUND` sem tradução** em `normalizeApiError`, porque
  testes e telas da anamnese já leem o texto cru.

## Relatórios e notificações (API-05, leva 3)

Contrato do backend **publicado**: segue `docs/entrega-4/BACKEND-ENTREGUE.md` §3.6, §3.7, §4 e §5.
Tipos em `src/api/types.ts`, leituras em `src/api/endpoints/{reports,notifications}.ts` e mocks em
`handlers/reports.ts` e `handlers/notifications.ts` (reset: `resetMockReportState()`,
`resetMockNotificationState()`). Geração, envio, exclusão e marcar como lida **só têm mock**: as
funções de endpoint ficam com as telas REL-\* e NOT-01. A geração usa IA e a tela deve usar
`AI_TIMEOUT_MS` (90 s), sem reenvio. O app monta o PDF a partir do `content` (G-58).

### Relatórios (`handlers/reports.ts`)

- `GET /report/options` (estático: `defaultSections` = `allowedSections`; períodos `30d`/`90d`/`180d`;
  `maxPeriodDays` 365); `POST /report/` (`201`); `GET /report/` (`studentId?`, `limit?` 1-100,
  `ReportSummary[]` com `lastShare?` no lugar de `shares`, mais recente primeiro); `GET /report/:id`;
  `POST /report/:id/share` (`{ channel: "SHARE" | "PRINT" }`, `200 Report`); `DELETE /report/:id` (`204`).
- Erros: `400 Bad Request` (campos, nenhuma seção ou mais de 20), `400 INVALID_PERIOD` (`from > to` ou
  mais de 365 dias), `400 SECTION_NOT_ALLOWED`, `400 REPORT_EMPTY_PERIOD`, `403 UNAUTHORIZED`
  (paciente ou relatório alheio: `mock-report-foreign`), `404 STUDENT_NOT_FOUND`, `404 REPORT_NOT_FOUND`.
- `REPORT_EMPTY_PERIOD` só quando nenhuma das seções pedidas tem dado: `PATIENT_DATA` e
  `AI_SYNTHESIS` não contam; `ANAMNESIS_SUMMARY` vale independente do período; no mock, `student-5`
  não tem dado e as demais seções não têm dado em período que termina antes de 2026-01-01.
- `Report.synthesisFailed` é sempre booleano. `setMockReportSynthesisFailure(true)` faz a próxima
  geração sair sem `synthesis` e com `synthesisFailed: true`. `sections` volta sem repetição e na
  ordem do tipo. O `content` é congelado na geração e nunca traz telefone, endereço, documentos nem
  responsável. `accuracy` é fração de 0 a 1.

### Notificações (`handlers/notifications.ts`)

- `GET /notification/` (`unreadOnly?`, `limit?` 1-50 padrão 20, `cursor?`; resposta
  `{ items, nextCursor? }`; `400 Bad Request`, `400 INVALID_CURSOR`), `GET /notification/unread-count`
  (`{ count }`), `POST /notification/:id/read` (`AppNotification`, idempotente;
  `404 NOTIFICATION_NOT_FOUND`), `POST /notification/read-all` (`{ updated }`).
- A lista já vem semeada com 5 notificações (uma de cada tipo e uma lida); não há cron. O destino
  `AGENDA_DAY` tem como `id` a data `AAAA-MM-DD`.

### Lacunas dos mocks da leva 3

- **Conteúdo:** as seções vêm com valores fictícios fixos; só o nome e a idade do paciente vêm de
  `MOCK_STUDENTS`. `schoolGrade` nunca é preenchido.
- **RP-01:** o backend não separa as seções sensíveis nos padrões; o app as tira para FAMILY e SCHOOL.
- **Cursor:** o mock usa o deslocamento numérico; o app deve tratá-lo como opaco e continuar até não
  vir `nextCursor` (uma página real pode vir vazia com `nextCursor`).
- **`STUDENT_NOT_FOUND`** segue sem tradução em `normalizeApiError`.
