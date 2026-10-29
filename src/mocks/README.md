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
