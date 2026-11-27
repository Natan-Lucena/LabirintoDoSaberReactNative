# Entrega 5: o que o backend entregou

> **Transcrição** do documento do backend recebido em 2026-11-26. Vale a partir do deploy dos PRs #35 a #42 do backend (commit `945af87`). O resumo do contrato que o app consome está em [PROJECT.md](../PROJECT.md); este arquivo guarda os detalhes de cada rota nova. Não foi validado contra o código do backend por este repositório.

> Para o time do app (React Native). Escrito em 2026-11-26 a partir do código da pilha de PRs #35 a
> #42 (commit `945af87`). Vale a partir do deploy desses PRs em
> `https://labirinto-do-saber.vercel.app`. Swagger: `https://labirinto-do-saber.vercel.app/api-docs/`.
> Os IDs (AT, RS, EQ, PA, RC, PU, AJ, PP) são os da especificação que o app mandou em 2026-11-24.

## ⚠️ Muda o comportamento de rotas que o app já usa

1. **`GET /task/`** só traz as tarefas que o educador pode usar: as dele, as antigas sem dono que estão
   num caderno ou grupo dele, e as antigas avulsas (fora de qualquer caderno ou grupo). Antes vinham
   as tarefas de todos. A biblioteca **não** aparece aqui; ela está em `GET /task/catalog`.
2. **Tarefa de outro educador** num caderno, grupo ou sessão sem caderno agora responde
   `403 UNAUTHORIZED`.
3. **`GET /student/`** passa a trazer os pacientes compartilhados com o educador (`access: "SHARED"`) e
   deixa de fora os arquivados (padrão `status=ACTIVE`).
4. **Ids inválidos viram 404.** Os códigos `INVALID_TASK_GROUP_ID` e `INVALID_TASK_NOTEBOOK_ID` (400)
   não existem mais. Id que não é UUID em grupo, caderno, tarefa e sessão responde 404 com o código de
   "não encontrado" do recurso (§3.10).
5. **`POST /student/assign-educator`**: `STUDENT_NOT_FOUND` e `NEW_EDUCATOR_NOT_FOUND` passaram de
   400 para **404**. A transferência troca o dono e apaga os compartilhamentos (§3.3).
6. **Notificações de pendência não se repetem mais a cada dia** (PP-07). Só `APPOINTMENTS_TODAY`
   continua diária (§3.7).
7. **Tempo de resposta:** use o campo novo `timeToAnswerMs` nas respostas de sessão. As médias do
   relatório da sessão agora vêm normalizadas em ms e podem vir `null` (§3.2).

O resto acrescenta rotas e campos opcionais.

## 1. Resumo por PR

| PR  | Leva                                    | O que entrou                                                                                                                                                                                                                                   | IDs                               |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| #35 | Banco de atividades                     | Tipos `wordBuilder`, `colorMatch`, `memoryGame` e `printable` com `content`; habilidades; biblioteca por seed; catálogo com busca e cursor; recomendação por regra; duplicar; `POST /task/create` devolve `201 Task`; regra de uso das tarefas | AT-01 a AT-12                     |
| #36 | Resultado de atividade                  | `POST /task-notebook-session/activity-result`, `activitySummary` e `activityResults` no relatório da sessão, na lista de sessões e no contexto da evolução                                                                                     | RS-01 a RS-08                     |
| #37 | Clínica e convites                      | `/clinic` com papéis ADMIN e PROFESSIONAL, convites por código, prévia pública, cadastro com `inviteCode`, `clinic` em `GET /educator/me`                                                                                                      | EQ-01 a EQ-08                     |
| #38 | Paciente compartilhado                  | Compartilhar com colega da clínica, acesso dono ou compartilhado em todas as rotas clínicas, `access`/`ownerName`, `authorName`, transferência que troca o dono                                                                                | EQ-09 a EQ-15                     |
| #39 | Status, arquivamento, overview e `null` | `status` do paciente, arquivar com confirmação, `GET /student/overview`, `GET /student/:id`, `409 STUDENT_ARCHIVED`, `null` apagando campos                                                                                                    | PA-01 a PA-07, PP-05, PP-09       |
| #40 | Agenda recorrente                       | `/appointment/series`: criar, ver, "este e os seguintes", cancelar a partir de uma ocorrência; `seriesId` no atendimento                                                                                                                       | RC-01 a RC-08                     |
| #41 | Push e ajuda                            | Token de push, preferências, um push diário pela Expo; `GET /help/tutorials`                                                                                                                                                                   | PU-01 a PU-07, AJ-01 a AJ-04      |
| #42 | Pequenos pedidos                        | Nome abreviado no relatório SCHOOL, uma notificação por pendência, `timeToAnswerMs`, 404 nos ids inválidos, `summaryOutdated` no POST/PUT da anamnese, Swagger conferido por teste                                                             | PP-06, PP-07, PP-08, PP-10, PP-11 |

## 2. Convenções comuns

Valem as da Entrega 4 (auth, formato de erro, datas, opcionais ausentes do JSON). O que muda:

- **Acesso ao paciente.** Dois modos:
  - **clínico**: dono **ou** educador com quem o paciente foi compartilhado. Vale para sessões,
    resultados de jogo, análises, evolução, planos, escalas, anamnese, relatórios, atendimentos e séries;
  - **dono**: só o dono. Vale para editar o cadastro e os documentos, compartilhar, desfazer o
    compartilhamento, transferir e arquivar.
  - Fora do alcance: `403 { "message": "UNAUTHORIZED" }`. Paciente inexistente: `404 STUDENT_NOT_FOUND`.
- **Vale o acesso atual.** Quem perde o acesso deixa de ver o paciente na hora, inclusive os registros que criou.
- **Autor.** Sessões, evoluções, planos e relatórios trazem `authorName` **só quando o autor não é quem lê** (EQ-12).
- **Paciente arquivado.** Não recebe atendimento, série, sessão, plano nem aplicação de escala novos:
  `409 { "message": "STUDENT_ARCHIVED" }` (PA-04). Os dados continuam legíveis.
- **Id de path que não é UUID** responde 404 com o código do recurso. Exceções antigas em §8.
- **`null` apaga** nos campos listados em §3.8 (PP-05). Ausente mantém o valor atual.
- **Novos 429.** As rotas de convite têm limite por IP: `429 { "message": "TOO_MANY_REQUESTS" }`.

## 3. Contratos

### 3.1 Banco de atividades (`/task`, Bearer)

```ts
type TaskType =
  | "multipleChoice"
  | "multipleChoiceWithMedia"
  | "wordBuilder"
  | "colorMatch"
  | "memoryGame"
  | "printable";
type TaskFormat = "INTERACTIVE" | "PRINTABLE"; // derivado do tipo
type TaskSource = "EDUCATOR" | "LIBRARY";
type TaskTone = "mint" | "peach" | "lavender" | "yellow";
type TaskCategory = "reading" | "writing" | "vocabulary" | "comprehension";

interface Task {
  id: string;
  category: TaskCategory;
  type: TaskType;
  format: TaskFormat;
  source: TaskSource; // tarefas antigas vêm EDUCATOR
  educatorId?: string; // dono; ausente na biblioteca e nas tarefas antigas
  prompt: string;
  alternatives: { id: string; text: string; isCorrect: boolean }[]; // vazio nos tipos novos
  skills: string[]; // 0–5 códigos de GET /task/skills
  theme?: string; // até 60
  tone: TaskTone;
  content?: TaskContent; // obrigatório nos tipos novos
  imageFile?: string;
  audioFile?: string; // só multipleChoiceWithMedia
  createdAt: string;
}
interface WordBuilderContent {
  kind: "wordBuilder";
  word: string /*2–12 letras, maiúsculas*/;
  distractors?: string[] /*0–6, uma letra*/;
  hintImageUrl?: string;
  hintAudioUrl?: string;
}
interface ColorMatchContent {
  kind: "colorMatch";
  pairs: {
    id: string;
    word: string /*1–20*/;
    colorHex: string; /*#RRGGBB maiúsc.*/
  }[]; /*2–6, sem cor repetida*/
}
interface MemoryGameContent {
  kind: "memoryGame";
  cards: { id: string; label?: string /*1–40*/; imageUrl?: string }[]; /*2–8*/
}
interface PrintableContent {
  kind: "printable";
  title: string /*1–80*/;
  instructions: string /*1–500*/;
  layout: "LIST" | "GRID" | "SEQUENCE";
  items: {
    id: string;
    text?: string /*1–200*/;
    imageUrl?: string;
    answerLines?: number; /*0–5*/
  }[]; /*1–20*/
}
interface TaskSkill {
  code: string;
  label: string;
  learningTopics: string[];
}
interface TaskSummary {
  id: string;
  type: TaskType;
  format: TaskFormat;
  source: TaskSource;
  category: TaskCategory;
  title: string; // prompt (múltipla escolha), a palavra (wordBuilder), "Associe as cores", "Memória visual" ou o título do imprimível
  skills: { code: string; label: string }[];
  theme?: string;
  tone: TaskTone;
  thumbnailUrl?: string;
}
interface RecommendedTask extends TaskSummary {
  reason: string;
}
```

Erros de conteúdo: `{ "message": "INVALID_CONTENT", "errors": [{ "field": "content.word", "message": "..." }] }`.
`INVALID_MEDIA_URL` usa o mesmo formato.

Regra de uso (editar, excluir, duplicar, pôr em caderno, grupo ou sessão sem caderno): biblioteca todos usam,
ninguém edita/exclui (`403 LIBRARY_TASK_READ_ONLY`); tarefa com dono: só o dono; antiga sem dono: donos dos
cadernos/grupos em que está; fora de caderno/grupo, todos. Fora da regra: `403 UNAUTHORIZED`.

- `GET /task/catalog` — query `search` (1–100), `format`, `type`, `skill`, `category`, `source`, `limit` (1–50, padrão 20), `cursor`. `200 { items: TaskSummary[], nextCursor? }`. Erros: 400 validação; 400 `INVALID_CURSOR`.
- `GET /task/skills` — `200 TaskSkill[]`. Códigos atuais: CONSCIENCIA_FONOLOGICA, RECONHECIMENTO_LETRAS, DECODIFICACAO, FORMACAO_PALAVRAS, VOCABULARIO, COMPREENSAO_LEITORA, ESCRITA_ORTOGRAFIA, COORDENACAO_GRAFOMOTORA, ATENCAO_VISUAL, MEMORIA_TRABALHO, CORES_ASSOCIACAO, SEQUENCIA_LOGICA, NOCAO_NUMERICA. Ler da rota.
- `GET /task/recommended?studentId=` — até 6 `RecommendedTask`, por regra. Arquivado ou sem match: `200 []`. Erros 400, 403 UNAUTHORIZED, 404 STUDENT_NOT_FOUND.
- `GET /task/:id` — `200 Task`; 404 `TASK_NOT_FOUND` (inexistente ou não-UUID; antes 500).
- `POST /task/create` (multipart; campos JSON como string JSON: `alternatives`, `content`, `skills`; mais `category`, `type`, `prompt`, `imageFile`/`audioFile` só múltipla escolha com mídia, `theme`, `tone`) — **agora `201 Task`** (antes 201 sem corpo). Erros: 400 validação; 400 `INVALID_CONTENT` + errors (também `imageFile`/`audioFile` num tipo novo); 400 `INVALID_MEDIA_URL` + errors; 400 `ALTERNATIVES_NOT_ALLOWED`; 400 `INVALID_SKILL`; 400 `INVALID_ALTERNATIVES_FORMAT`; 400 `TEXT_TASK_CANNOT_HAVE_MEDIA`, `MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO`, `AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT`, `INVALID_TASK_DATA`.
- `PUT /task/update` (JSON) — `id` + campos opcionais; `type` só troca entre as duas múltiplas escolhas; `content` substitui inteiro; `imageFile`/`audioFile` URL de upload-media, `null` apaga. `200 Task`. Erros: os de create; 400 `TYPE_CHANGE_NOT_ALLOWED`; 403 `LIBRARY_TASK_READ_ONLY`; 403 `UNAUTHORIZED`; 404 `TASK_NOT_FOUND`.
- `POST /task/:id/duplicate` — `201 Task` (cópia EDUCATOR do educador). 403 UNAUTHORIZED; 404 TASK_NOT_FOUND.
- `DELETE /task/delete/:id` — `200` texto "OK". 403 LIBRARY_TASK_READ_ONLY / UNAUTHORIZED; 404 TASK_NOT_FOUND (antes 500).
- `GET /task/` — `Task[]` filtrada pela regra de uso; query `type` aceita tipos novos.
- `POST /task/batch` — URLs de mídia precisam vir de upload-media, senão 400 INVALID_MEDIA_URL (`tasks.N.imageFile`).
- Cadernos e grupos (`POST /task-notebook/create`, `POST /task-group/create`, `PUT /task-group/update`) aceitam biblioteca e jogáveis novos; imprimível → 400 `PRINTABLE_NOT_PLAYABLE`; tarefa de outro → 403 UNAUTHORIZED; `GET /task-group/:id` vale para dono ou grupo usado em caderno do educador, senão 403.

### 3.2 Sessão: resultado de jogo e tempo de resposta

`POST /task-notebook-session/activity-result` (Bearer, acesso clínico). Corpo
`{ sessionId, taskId, completed: boolean, correct: boolean, attempts: 1–50, errors: 0–50, durationMs: 0–3600000 }`.
`201 { id, sessionId, taskId, taskType, completed, correct, attempts, errors, durationMs, recordedAt }`.
Erros: 400 validação; 400 `TASK_NOT_IN_NOTEBOOK`; 400 `USE_ANSWER_ROUTE` (múltipla escolha); 400 `PRINTABLE_NOT_PLAYABLE`;
403 UNAUTHORIZED; 404 SESSION_NOT_FOUND / STUDENT_NOT_FOUND / TASK_NOT_FOUND / NOTEBOOK_NOT_FOUND;
409 `SESSION_ALREADY_FINISHED`; 409 `RESULT_ALREADY_EXISTS` + `resultId` (tratar como sucesso).

Onde aparecem (não entram em accuracy/totalQuestions/answeredCount/correctCount):

- `GET /task-notebook-session/report/:sessionId`: `activitySummary { total, completed, correct }` e `activityResults: ActivityResult[]`;
- `GET /task-notebook-session/student/:studentId`: cada sessão traz `activityResults` (vazio quando não há);
- `GET /session-evolution/context/:sessionId`: `activityResults` com `{ taskId, title?, taskType, completed, correct, attempts, errors }`.

`POST /task-notebook-session/answer` (mudou): tipo jogável novo → 400 `USE_ACTIVITY_RESULT_ROUTE`; imprimível → 400 PRINTABLE_NOT_PLAYABLE;
sem caderno com tarefa não usável → 403 UNAUTHORIZED; ids não-UUID → 404; sessão finalizada continua 400 SESSION_ALREADY_FINISHED.
`POST /task-notebook-session/start` (mudou): acesso clínico; appointmentId de qualquer educador do mesmo paciente; caderno do educador; arquivado → 409 STUDENT_ARCHIVED.

`timeToAnswerMs` (PP-08): toda resposta de sessão (`answers[]` em start, answer, finish, observation e lista por paciente) ganha
`timeToAnswerMs`. `timeToAnswer` fica como gravado (antes de 2026-10-09, em segundos na maior parte). Usar sempre `timeToAnswerMs`.
No relatório, `averageTimePerQuestion`, `averageCorrectTime`, `averageIncorrectTime` em ms normalizados e podem vir `null`.
Nas rotas `/task-notebook-session` (finish, observation, report, student, analysis/student) id não-UUID → 404.

### 3.3 Clínica, convites e compartilhamento

```ts
type TeamRole = "ADMIN" | "PROFESSIONAL";
interface Clinic {
  id: string;
  name: string;
  createdAt: string;
}
interface ClinicMember {
  educatorId: string;
  name: string;
  email: string;
  photoUrl?: string;
  profession?: string;
  role: TeamRole;
  joinedAt: string;
}
interface ClinicView {
  clinic: Clinic;
  myRole: TeamRole;
  members: ClinicMember[];
} // ADMIN primeiro, depois nome
interface ClinicInvite {
  id: string;
  code: string /*8, A–Z e 2–9 sem 0,O,1,I*/;
  role: TeamRole;
  createdBy: string;
  expiresAt: string /*7 dias*/;
  shareMessage: string /*sem link*/;
  createdAt: string;
}
interface InvitePreview {
  clinicName: string;
  role: TeamRole;
  expiresAt: string;
}
interface StudentShare {
  educatorId: string;
  name: string;
  role?: TeamRole;
  sharedAt: string;
}
```

| Rota                                          | Corpo                                          | Sucesso                                        | Erros                                                                        |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `POST /clinic/`                               | `{ name }` 2–80                                | `201 ClinicView` (criador ADMIN)               | 400; 409 ALREADY_IN_CLINIC                                                   |
| `GET /clinic/`                                | —                                              | `200 ClinicView`                               | 404 NOT_IN_CLINIC                                                            |
| `PUT /clinic/`                                | `{ name }`                                     | `200 ClinicView`                               | 400; 403 FORBIDDEN_ROLE; 404 NOT_IN_CLINIC                                   |
| `POST /clinic/invites`                        | `{ role }`                                     | `201 ClinicInvite`                             | 400; 403 FORBIDDEN_ROLE; 404 NOT_IN_CLINIC; 409 TOO_MANY_INVITES (20 ativos) |
| `GET /clinic/invites`                         | —                                              | `200 ClinicInvite[]` ativos, recentes primeiro | 403 FORBIDDEN_ROLE; 404 NOT_IN_CLINIC                                        |
| `DELETE /clinic/invites/:id`                  | —                                              | `204` (idempotente)                            | 403 FORBIDDEN_ROLE; 404 NOT_IN_CLINIC, INVITE_NOT_FOUND                      |
| `GET /clinic/invites/preview/:code` (público) | —                                              | `200 InvitePreview`                            | 404 INVITE_INVALID; 429 TOO_MANY_REQUESTS                                    |
| `POST /clinic/invites/accept`                 | `{ code }` 1–32 (minúsculas e espaços aceitos) | `200 ClinicView`                               | 400; 404 INVITE_INVALID; 409 ALREADY_IN_CLINIC; 429 TOO_MANY_REQUESTS        |
| `PUT /clinic/members/:educatorId`             | `{ role }`                                     | `200 ClinicView`                               | 400; 403 FORBIDDEN_ROLE; 404 NOT_IN_CLINIC, MEMBER_NOT_FOUND; 409 LAST_ADMIN |
| `DELETE /clinic/members/:educatorId`          | — (próprio id = sair)                          | `204`                                          | 403 FORBIDDEN_ROLE; 404 NOT_IN_CLINIC, MEMBER_NOT_FOUND; 409 LAST_ADMIN      |

`POST /educator/register` (público): `{ name 3–100, email, password 6–100, inviteCode? 1–32 }` → `200 { id, name }`.
Erros: 400 validação/EDUCATOR_ALREADY_EXISTS/FAIL; 404 INVITE_INVALID (nenhuma conta criada); 429 TOO_MANY_REQUESTS (só com inviteCode).
`GET /educator/me` ganha `clinic?: { id, name, role }`.

Compartilhamento:

| Rota                                     | Corpo            | Sucesso                                 | Erros                                                                             |
| ---------------------------------------- | ---------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| `GET /student/:id/shares`                | —                | `200 StudentShare[]` (ordem de criação) | 403 UNAUTHORIZED; 404 STUDENT_NOT_FOUND                                           |
| `POST /student/:id/shares`               | `{ educatorId }` | `200 StudentShare[]`                    | 400; 400 NOT_IN_SAME_CLINIC; 403 UNAUTHORIZED (não é dono); 404 STUDENT_NOT_FOUND |
| `DELETE /student/:id/shares/:educatorId` | —                | `200 StudentShare[]`                    | 403 UNAUTHORIZED; 404 STUDENT_NOT_FOUND, SHARE_NOT_FOUND                          |

GET vale para dono e compartilhado. NOT_IN_SAME_CLINIC também quando dono sem clínica ou educatorId inexistente. Idempotente.
`role` some se o colega saiu da clínica.

`POST /student/assign-educator` (mudou): corpo igual; `200 StudentWithEducators` com novo dono em `educatorId`. Só dono
(compartilhado → 400 STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR). Novo educador vira dono; antigo perde acesso; todos os
compartilhamentos apagados. Dono em clínica só transfere para membro dela (400 NOT_IN_SAME_CLINIC). 404 STUDENT_NOT_FOUND
(antes 400); 404 NEW_EDUCATOR_NOT_FOUND (antes 400).

### 3.4 Pacientes (`/student`, Bearer)

```ts
type StudentStatus = "ACTIVE" | "ARCHIVED";
interface Student {
  /* campos atuais */ status: StudentStatus;
  archivedAt?: string;
}
interface StudentListItem extends Student {
  access: "OWNER" | "SHARED";
  ownerName?: string; /*só SHARED*/
}
type PatientPrimaryStatus =
  "PDI_ACTIVE" | "ASSESSMENT_PENDING" | "PLAN_REVIEW" | "NO_PLAN";
type PatientPendingKind =
  "EVOLUTION_PENDING" | "PLAN_REVIEW_DUE" | "SCALE_DRAFT" | "ANAMNESIS_MISSING";
interface PatientOverview {
  studentId: string;
  primaryStatus: PatientPrimaryStatus;
  activePlan?: {
    id: string;
    type: "PDI" | "PE";
    title: string;
    percent: number;
  };
  nextAppointment?: { id: string; scheduledAt: string };
  pendings: { kind: PatientPendingKind; count: number; targetId?: string }[];
}
```

- `GET /student/?status=ACTIVE|ARCHIVED|ALL` (padrão ACTIVE) → `200 StudentListItem[]` (donos + compartilhados). 400 validação.
- `GET /student/:id` (novo) → `200 StudentListItem`. 403 UNAUTHORIZED; 404 STUDENT_NOT_FOUND.
- `PUT /student/:id/status` (novo) `{ status, cancelFutureAppointments? }` → `200 StudentListItem`. Só dono (403 UNAUTHORIZED).
  Com atendimento futuro PENDING sem confirmação → `409 { "message": "HAS_FUTURE_APPOINTMENTS", "count": 3 }`.
  Reativar não recria cancelados. Repetir status → 200. 404 STUDENT_NOT_FOUND.
- `GET /student/overview?status=` (novo) → `200 PatientOverview[]`. 400 validação.
- `PUT /student/update/:id`: guardianName/guardianPhone/guardianRelationship aceitam texto `null` (multipart) ou null (JSON) para apagar.

### 3.5 Agenda recorrente (`/appointment`, Bearer)

```ts
type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY";
interface Appointment {
  id;
  educatorId;
  studentId;
  seriesId?: string;
  scheduledAt;
  observation?;
  type?;
  durationMinutes;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  notifiedAt?;
  createdAt;
}
interface AppointmentSeries {
  id;
  studentId;
  educatorId;
  frequency;
  firstScheduledAt;
  occurrences /*2–26*/;
  type?;
  durationMinutes;
  observation?;
  endedAt?;
  createdAt;
}
interface SeriesResult {
  series: AppointmentSeries;
  created: Appointment[]; // criadas (POST), alteradas (PUT) ou canceladas (cancel)
  skipped: {
    appointmentId?: string /*só PUT*/;
    scheduledAt: string;
    reason: "CONFLICT";
    conflictingAppointmentId: string;
  }[];
}
```

- `POST /appointment/series` `{ studentId, scheduledAt, frequency, occurrences 2–26 (máx 6 meses: 26 semanais/13 quinzenais), type? 1–50, durationMinutes? 15–240 (padrão 50), observation? }` → `201 SeriesResult`.
  Erros: 400 validação; 400 SERIES_TOO_LONG; 403 UNAUTHORIZED; 404 STUDENT_NOT_FOUND; 409 APPOINTMENT_CONFLICT + conflictingAppointmentId (todas colidem); 409 STUDENT_ARCHIVED.
- `GET /appointment/series/:id` → `200 AppointmentSeries & { appointments: Appointment[] }`. 403; 404 SERIES_NOT_FOUND.
- `PUT /appointment/series/:id` `{ fromAppointmentId, scheduledAt? (só horário SP), durationMinutes?, type?, observation?: string|null }` → `200 SeriesResult`.
  Erros: 400 validação (sem campo além de fromAppointmentId); 400 APPOINTMENT_NOT_IN_SERIES; 403; 404 SERIES_NOT_FOUND; 409 APPOINTMENT_NOT_EDITABLE.
- `POST /appointment/series/:id/cancel` `{ fromAppointmentId }` → `200 SeriesResult` (canceladas em created; series com endedAt). 400; 400 APPOINTMENT_NOT_IN_SERIES; 403; 404 SERIES_NOT_FOUND.
- `POST /appointment/`: acesso clínico; novos erros 403 UNAUTHORIZED, 404 STUDENT_NOT_FOUND, 409 STUDENT_ARCHIVED; conflito igual.
- `GET /appointment/?studentId=` (novo query): sem = agenda do educador (só pacientes que ainda acessa); com = atendimentos do paciente de qualquer educador (403/404).
- `GET/PUT/DELETE /appointment/:id`: para quem acessa o paciente; sem acesso → 400 NOT_FOUND (como antes). PUT só aquela ocorrência; arquivado: reativar/remarcar → 409 STUDENT_ARCHIVED.

### 3.6 Push (`/notification`, Bearer)

- `POST /notification/push-token` `{ token (≤255, ExponentPushToken[...] ou ExpoPushToken[...]), platform: "android"|"ios" }` → `200 { token, platform, createdAt, lastSeenAt }`. Upsert; até 5 aparelhos. Chamar depois de cada login e sempre que obtiver o token. 400 validação; 400 INVALID_PUSH_TOKEN.
- `DELETE /notification/push-token` `{ token }` → `204` (desconhecido também 204). 400 validação.
- `GET /notification/preferences` → `{ pushEnabled: true, kinds: { APPOINTMENTS_TODAY, EVOLUTION_PENDING, PLAN_REVIEW_DUE, SCALE_DRAFT_STALE } }` (tudo true sem preferências).
- `PUT /notification/preferences` parcial (kinds parcial; chave desconhecida 400) → `200` completas.

### 3.7 Notificações (PP-07)

APPOINTMENTS_TODAY uma por dia; EVOLUTION_PENDING, PLAN_REVIEW_DUE, SCALE_DRAFT_STALE uma por pendência. Destinatários:
APPOINTMENTS_TODAY → educador do atendimento; EVOLUTION_PENDING → quem conduziu; PLAN_REVIEW_DUE → dono; SCALE_DRAFT_STALE → quem começou.
Arquivado não gera notificação.

### 3.8 `null` apagando (PP-05)

| Rota                                  | Campos                                                             |
| ------------------------------------- | ------------------------------------------------------------------ |
| `PUT /student/update/:id` (multipart) | guardianName, guardianPhone, guardianRelationship (texto `null`)   |
| `PUT /plan/:id`                       | `professionalNotes`, `nextReviewDate` (não `notes`/`nextReviewAt`) |
| `PUT /task/update`                    | imageFile, audioFile                                               |
| `PUT /appointment/series/:id`         | observation                                                        |

Campo apagado fica ausente do JSON (responsáveis vêm `null`).

### 3.9 Ajuda: `GET /help/tutorials`

```ts
interface HelpTutorial {
  id;
  order;
  title /*≤80*/;
  description /*≤200*/;
  durationSeconds;
  featured /*máx 1*/;
  videoUrl?;
  thumbnailUrl?;
  steps?: string[]; /*≤10*/
}
```

`200 HelpTutorial[]` por order. Hoje 5 tutoriais, todos sem vídeo (só steps).

### 3.10 Outras mudanças

| Rota                                                                                | Mudança                                                                       |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| task-group update/delete/get                                                        | id não-UUID: 404 TASK_GROUP_NOT_FOUND (antes 400 INVALID_TASK_GROUP_ID)       |
| task-notebook update/delete                                                         | id não-UUID: 404 TASK_NOTEBOOK_NOT_FOUND (antes 400 INVALID_TASK_NOTEBOOK_ID) |
| GET /task/:id, DELETE /task/delete/:id                                              | 404 TASK_NOT_FOUND (antes 500)                                                |
| POST /anamnese/templates/:templateId/responses, PUT /anamnese/responses/:responseId | resposta traz `summary` e `summaryOutdated` como o GET; não precisa reler     |
| Anamnese por paciente                                                               | acesso clínico                                                                |
| GET /report, GET /report/:id, POST /report                                          | SCHOOL: studentName e content.patient.displayName abreviados ("Paciente S.")  |
| Sessões, evoluções, planos, relatórios                                              | authorName quando autor ≠ leitor                                              |
| GET /plan sem studentId                                                             | inclui planos de compartilhados                                               |
| POST /plan, POST /plan/generate                                                     | 409 STUDENT_ARCHIVED                                                          |
| POST /plan/{id}/suggestions/generate                                                | limite 3 pendentes por plano e educador                                       |
| POST /scale-application                                                             | 409 STUDENT_ARCHIVED                                                          |
| GET /session-evolution/pending                                                      | de quem conduziu, enquanto acessa                                             |
| POST /session-evolution                                                             | planId de qualquer autor                                                      |
| GET /session-evolution/context/:sessionId                                           | ganha activityResults                                                         |

## 4. Regras de comportamento

- 4.1 format vem do servidor. Mídia dos tipos novos: `POST /task/upload-media` e URL em content. wordBuilder em maiúsculas. Biblioteca: duplicar para editar. Imprimível fora de caderno/grupo/sessão; PDF é do app.
- 4.2 Resultado antes do finish. 409 RESULT_ALREADY_EXISTS = sucesso. Acerto só múltipla escolha.
- 4.3 Uma clínica por educador. Clínica não dá acesso automático. INVITE_INVALID único para vencido/usado/revogado/inexistente. Limite 10 tentativas por IP / 15 min: consultar prévia só com 8 caracteres. Último ADMIN: 409 LAST_ADMIN; se único membro, sair apaga a clínica. Rebaixar/remover ADMIN revoga convites dele. Quem sai leva seus pacientes; compartilhamentos desfeitos.
- 4.4 Arquivar: PUT status → 409 HAS_FUTURE_APPOINTMENTS com count → confirmar → repetir com cancelFutureAppointments:true. Arquivado sai de lista, overview, recomendação e notificações. Status principal: PLAN_REVIEW > ASSESSMENT_PENDING (rascunho de escala ou sem anamnese) > PDI_ACTIVE > NO_PLAN. activePlan: PDI ativo, senão PE ativo mais recente. nextAppointment: próximo PENDING futuro de qualquer educador. Overview × sino diferem (EVOLUTION_PENDING na hora vs 24h; SCALE_DRAFT qualquer vs 7 dias; ANAMNESIS_MISSING sem notificação). targetId só com alvo único, nunca em ANAMNESIS_MISSING.
- 4.5 Série: mesmo dia da semana e horário de SP. Conflito vai para skipped (mostrar datas). Todas colidem → 409. PUT série: muda indicada e seguintes PENDING futuras; skipped com appointmentId. Cancelar: indicada e seguintes PENDING futuras; endedAt.
- 4.6 Push: um por educador por dia (após 06:00 SP); texto genérico; `data = { notificationIds: string[], target?: { type, id } }` (target só com uma notificação). pushEnabled false não manda; kind desligado só sai do push. **Logout: chamar DELETE /notification/push-token antes de descartar o JWT.**
- 4.7 SCHOOL: "Paciente Souza Lima" → "Paciente S."; texto livre não filtrado — avisar o usuário na tela de geração para SCHOOL.
- 4.8 timeToAnswer ≤ 600 antes de 2026-10-09 tratado como segundos; usar timeToAnswerMs.

## 5. Decisões e respostas

Decisões §12 todas adotadas. POST /appointment/notify é job (não chamar). Acesso centralizado. 18 atividades de biblioteca
(4 wordBuilder, 3 colorMatch, 3 memoryGame, 3 múltipla escolha, 5 imprimíveis) e 5 tutoriais por seed; pedem revisão pedagógica
e conferência dos nomes de tela nos tutoriais. EAS/Firebase são do app. timeToAnswer normalizado na leitura.

## 6. Diferenças em relação à especificação do app

| ID       | Pedido                       | Entregue                                                                                           |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| AT-05    | INVALID_MEDIA_URL            | também INVALID_CONTENT com field imageFile/audioFile em tipo novo com arquivo no multipart         |
| AT-06    | ≥3 de cada                   | 4/3/3/5 + 3 múltipla escolha                                                                       |
| AT-07    | duplicar → 403               | 403 só para tarefa não usável                                                                      |
| AT-11    | GET /task/ só do educador    | também antigas avulsas sem dono                                                                    |
| RS       | 409 SESSION_ALREADY_FINISHED | 409 em activity-result; em answer continua 400                                                     |
| EQ-10    | NOT_IN_SAME_CLINIC           | também dono sem clínica e educatorId inexistente                                                   |
| EQ-14    | escala                       | SCALE_DRAFT_STALE para quem começou                                                                |
| EQ-15    | transferir dentro da clínica | troca o dono, apaga compartilhamentos; 404 nos inexistentes                                        |
| PA-02    | count                        | futuros PENDING de qualquer educador                                                               |
| §5       | GET /student/:id → Student   | StudentListItem; PUT status também                                                                 |
| RC-03/05 | skipped                      | no PUT com appointmentId                                                                           |
| RC-05    | —                            | 400 APPOINTMENT_NOT_IN_SERIES; 409 APPOINTMENT_NOT_EDITABLE também quando o novo horário já passou |
| RC-01    | 2–26, 6 meses                | 400 SERIES_TOO_LONG acima de 13 quinzenais                                                         |
| PU-04    | contagem por tipo            | só não lidas criadas no dia                                                                        |
| PP-05    | nextReviewAt/notes           | nextReviewDate/professionalNotes                                                                   |
| PP-08    | migrar/marcar                | timeToAnswerMs na leitura                                                                          |

## 7. Efeitos do deploy

1. Mais uma notificação por pendência aberta, uma vez, na primeira rodada.
2. Push só com token registrado; primeiro push na manhã seguinte.
3. Pacientes antigos ACTIVE; tarefas antigas source EDUCATOR, skills [], tone do servidor.
4. Biblioteca e tutoriais depois do seed em produção.

## 8. Pendências conhecidas

1. Texto livre no relatório SCHOOL não filtrado.
2. Conflito de agenda pode citar atendimento de outro educador: tratar como "horário ocupado", sem abrir o id.
3. GET/PUT/DELETE /appointment/:id: inexistente ou sem acesso dá 400 NOT_FOUND; id não-UUID dá 500.
4. Tutoriais sem vídeo.
5. Conteúdo a revisar (atividades e tutoriais).
6. Fora: WhatsApp, IA para jogáveis, escalas do educador, financeiro, relatórios da clínica, ADMIN vendo todos.
