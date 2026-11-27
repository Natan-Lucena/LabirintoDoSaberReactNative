# Entrega 5 — Contratos do backend

> **O que é:** o contrato que o backend precisa cumprir para o app fechar a Entrega 5, a entrega
> final do produto. Para cada rota: método e caminho, quem pode chamar, parâmetros, corpo com
> tipos e validações, resposta de sucesso com exemplo, todos os erros, efeitos colaterais, regras
> de negócio e critérios de aceite testáveis (`BK-<leva>-NN`). Escrito em 2026-11-26.
>
> **Relação com os outros documentos:**
>
> - A [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md) explica **por que** cada domínio existe e
>   as regras de negócio (IDs AT, RS, EQ, PA, RC, PU, AJ e PP, reaproveitados aqui). Este
>   documento fecha **como**: nomes, formatos, códigos e casos de borda.
> - O resumo para o time do backend continua no [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md).
> - As decisões de produto G-61 a G-72 estão **resolvidas** pelo usuário
>   ([GATES](../entrega-1/GATES.md), 2026-11-25).
> - Convenções reais já em produção: [BACKEND-ENTREGUE da Entrega 4](../entrega-4/BACKEND-ENTREGUE.md)
>   e [PROJECT.md, Parte II](../PROJECT.md#parte-ii--referência-global-da-api).
>
> **Precedência:** na leva 1 o app já tem código na `main` (API-07 leva 1, ATV-04a, ATV-04b e
> EVO-03; `src/api/types.ts`, `src/api/errors.ts`, `src/api/endpoints/task-catalog.ts`,
> `src/api/endpoints/session.ts`, `src/mocks/handlers/*`). Onde a especificação e o código
> divergem, **o código do app manda**, e a divergência está registrada no §3.14. Nas levas 2 a 5,
> este documento é o contrato que as telas vão seguir.
>
> **Decisões marcadas "decisão do app; o backend confirma"** são escolhas do app para perguntas
> que os cards deixaram abertas (§8). O backend pode propor outra forma; a resposta vai para o
> `BACKEND-ENTREGUE.md` da Entrega 5 (API-06), e o app segue o que for publicado.

## Índice

- [0. Mapa das levas](#0-mapa-das-levas)
- [1. Convenções gerais](#1-convenções-gerais)
- [2. Modelos de dados](#2-modelos-de-dados)
- [3. Leva 1 — Atividades e resultados de jogo](#3-leva-1--atividades-e-resultados-de-jogo)
- [4. Leva 2 — Equipe](#4-leva-2--equipe)
- [5. Leva 3 — Status do paciente, recorrência e `null`](#5-leva-3--status-do-paciente-recorrência-e-null)
- [6. Leva 4 — Push e central de ajuda](#6-leva-4--push-e-central-de-ajuda)
- [7. Leva 5 — Ajustes pequenos](#7-leva-5--ajustes-pequenos)
- [8. Perguntas abertas e decisões do contrato](#8-perguntas-abertas-e-decisões-do-contrato)
- [9. Seeds e Swagger](#9-seeds-e-swagger)
- [10. Homologação por leva](#10-homologação-por-leva)
- [11. Rota → telas e cards do app](#11-rota--telas-e-cards-do-app)
- [12. Fora do contrato](#12-fora-do-contrato)
- [13. Histórico](#13-histórico)

## 0. Mapa das levas

| Leva | Conteúdo                                                       | Rotas novas | Rotas alteradas | Cards do app que destrava                        |
| ---- | -------------------------------------------------------------- | ----------- | --------------- | ------------------------------------------------ |
| 1    | Banco de atividades e resultado de jogo na sessão              | 5           | 12              | ATV-09, ATV-04a, ATV-04b, ATV-05, ATV-11, EVO-03 |
| 2    | Equipe: clínica, papéis, convites e paciente compartilhado     | 13          | 3 + regra geral | EQP-01, EQP-02, EQP-03, EQP-04                   |
| 3    | Status e arquivamento do paciente, recorrência, `null` (PP-05) | 7           | 5 + `409` geral | PAC-10, PAC-11, AGE-06, FEC-06                   |
| 4    | Push e central de ajuda                                        | 5           | 0 + job diário  | NOT-02, AJD-01 (BLD-01 é do app)                 |
| 5    | Ajustes pequenos (G-71, G-72, PP-08, PP-10, PP-11)             | 0           | 3               | nenhum bloqueado; melhora relatórios e avisos    |

A cada leva publicada, o backend avisa as rotas que saíram e o que mudou em relação a este
documento, como no BACKEND-ENTREGUE da Entrega 4. O app só integra o que estiver publicado.

## 1. Convenções gerais

### 1.1 Base, versão e compatibilidade

- Produção: `https://labirinto-do-saber.vercel.app`. Swagger em `/api-docs/`.
- Express na Vercel, **sem** prefixo `/api` e **sem** versão na rota. Não criar `/v2`.
- **Compatibilidade por acréscimo:** campos novos entram nas respostas existentes sem mudar os
  antigos. Versões anteriores do app ignoram campos desconhecidos e mostram tipos de atividade
  desconhecidos como "indisponível" (o motor já faz isso).
- Quebra de contrato (renomear campo, mudar status de sucesso, mudar formato de erro) só com
  aviso prévio, como o "⚠️ Quebra o app hoje" da Entrega 4.

### 1.2 Autenticação

- `Authorization: Bearer <jwt>` (HS256, 7 dias, payload `{ id }`) em **todas** as rotas novas,
  exceto as marcadas **Pública**: `GET /clinic/invites/preview/:code` e o `POST /educator/register`
  (que já é público).
- O educador vem **sempre do token**, nunca do corpo nem da query.
- Respostas 401, com a grafia atual: `Missing or invalid token`, `Invalid or expired token`,
  `Educator not found`. O app trata qualquer 401 como sessão expirada.

### 1.3 Quem pode chamar

Notação usada em cada rota:

| Marca          | Significado                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Pública**    | Sem token                                                                                         |
| **Educador**   | Qualquer educador autenticado                                                                     |
| **Dono**       | O educador dono do paciente (`Student.educatorId`)                                                |
| **Com acesso** | O dono **ou** um educador com quem o paciente foi compartilhado (G-62, EQ-11), a partir da leva 2 |
| **ADMIN**      | Educador com papel `ADMIN` na própria clínica (G-62, EQ-03)                                       |
| **Membro**     | Educador de uma clínica, com qualquer papel                                                       |

Fora do alcance: `403 { "message": "UNAUTHORIZED" }` (paciente ou recurso de outro educador) ou
`403 { "message": "FORBIDDEN_ROLE" }` (papel insuficiente na clínica). Até a leva 2 sair, "Com
acesso" equivale a "Dono".

### 1.4 Formato de erro

O contrato **mantém o formato real da API**, que o app já interpreta em `normalizeApiError`
(`src/api/errors.ts`): o **código** do erro vai em `message`.

```jsonc
// Regra de negócio (400, 403, 404, 409, 429)
{ "message": "LIBRARY_TASK_READ_ONLY" }

// Regra de negócio com dado extra: campos extras no MESMO nível de "message"
{ "message": "HAS_FUTURE_APPOINTMENTS", "count": 3 }

// Validação (Zod)
{
  "message": "Bad Request",
  "errors": [{ "message": "String must contain at least 2 character(s)", "field": "content.word" }]
}

// Exceção não tratada
{ "message": "An unexpected error occurred", "error": "..." }
```

- **Não** trocar para `{ code, message }`: o app lê o código de `message`. Se o backend quiser
  acrescentar `code` igual ao `message`, pode; `message` continua obrigatório com o código.
- Códigos em MAIÚSCULAS com `_`. O app traduz os conhecidos; os desconhecidos aparecem crus.
- `errors[].field`: nas rotas da Entrega 5, o **caminho completo** com pontos e índices
  (`content.pairs.2.word`), não só o primeiro nível. O app aceita os dois (decisão do app; o
  backend confirma, §8 Q3).
- **Inexistente é 404, nunca 500.** Id de **caminho** que não é UUID também dá 404 com o código
  do recurso. UUID inválido em **corpo ou query** dá 400 de validação.
- Todos os códigos estão no [§2.9](#29-catálogo-de-códigos-de-erro).

### 1.5 Paginação

- Só nas listas que podem crescer: `GET /task/catalog` (nova) e `GET /notification/` (existente).
- Formato: query `limit?` (1–50, padrão 20) e `cursor?`; resposta `{ "items": [...], "nextCursor"?: string }`.
- Sem `nextCursor`, acabou. O cursor é opaco para o app; cursor adulterado: `400 INVALID_CURSOR`.
- Uma página pode vir com menos itens que `limit`. A ordem precisa ser estável (desempate por `id`).
- As outras listas novas (membros, convites, compartilhamentos, tutoriais, overview, ocorrências
  da série) são pequenas e vêm inteiras, sem paginação.

### 1.6 Datas e fuso

- Com hora: ISO 8601 em UTC (`"2026-12-01T17:00:00.000Z"`).
- Sem hora: `"AAAA-MM-DD"`, com "hoje" calculado em `America/Sao_Paulo`.
- Regras de calendário (recorrência, vencimento, "hoje", "dd/mm" em textos) sempre no fuso de
  São Paulo.

### 1.7 JSON e multipart

- JSON em tudo, exceto as rotas que já são `multipart/form-data` (`POST /task/create`,
  `PUT /student/update/:id`, uploads).
- Em multipart, objetos e arrays vão como **string JSON** (`content`, `skills`, `alternatives`) e
  números como string.
- Limite de arquivo: 10 MB nos uploads de atividade (`POST /task/upload-media`), 5 MB na foto.
  Excedido: `400 { "message": "THIS FILE IS TO LARGE" }` (grafia atual).

### 1.8 Campos opcionais e `null`

- **Resposta:** campo sem valor **não aparece** no JSON (nada de `null`), como na Entrega 4. As
  exceções são os campos antigos que já vinham `null`.
- **Corpo, rotas JSON:** campo ausente = "não mudar"; `null` = "apagar o valor". `null` só é
  aceito nos campos listados no [§5.9](#59-pp-05-apagar-campos-com-null); em outro campo, `400`
  de validação.
- **Corpo, rotas multipart:** não existe `null`. Em `PUT /student/update/:id`, a **string vazia
  `""`** num campo apagável significa "apagar" (decisão do app; o backend confirma, §8 Q8).

### 1.9 Idempotência e repetição

O app **não repete** escrita sozinho (G-08): o usuário toca em "Tentar de novo". Por isso as
escritas precisam ser seguras para repetir ou devolver um conflito que o app reconcilia.

| Operação                                          | Comportamento ao repetir                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `POST /task-notebook-session/activity-result`     | `409 RESULT_ALREADY_EXISTS` com `resultId`; o app conta como registrado                 |
| `POST /student/:id/shares`                        | Idempotente: `200` com a mesma lista                                                    |
| `DELETE /student/:id/shares/:educatorId`          | Segunda vez: `404 SHARE_NOT_FOUND`                                                      |
| `PUT /student/:id/status`                         | Idempotente: mesmo status devolve `200 Student` sem mudar nada                          |
| `POST /notification/push-token`                   | Upsert pelo token                                                                       |
| `DELETE /notification/push-token`                 | Idempotente: `204` mesmo se o token não existir                                         |
| `PUT /notification/preferences`                   | Idempotente                                                                             |
| `POST /appointment/series/:id/cancel`             | Segunda vez com a mesma ocorrência: `200`, nada novo a cancelar                         |
| `POST /clinic/invites/accept`, `register` c/ code | Código de uso único: a segunda vez dá `404 INVITE_INVALID` (ou `409 ALREADY_IN_CLINIC`) |

### 1.10 Limites

| Limite                      | Valor                                        | Erro                    |
| --------------------------- | -------------------------------------------- | ----------------------- |
| `limit` em listas paginadas | 1–50, padrão 20                              | `400` validação         |
| Prévia pública do convite   | 10 consultas por IP a cada 15 min            | `429 TOO_MANY_REQUESTS` |
| Convites ativos por clínica | 20                                           | `409 TOO_MANY_INVITES`  |
| Tokens de push por educador | 5 (o mais antigo sai)                        | —                       |
| Ocorrências de uma série    | 2–26, última até 183 dias depois da primeira | `400` validação         |
| Habilidades por atividade   | 0–5                                          | `400` validação         |
| Recomendações por paciente  | 0–6                                          | —                       |

### 1.11 Privacidade

- Nada de conteúdo clínico nem nome de paciente em log.
- Push (texto na tela bloqueada) **sem** nome nem dado de paciente (PU-03).
- Nenhuma rota nova de IA nesta entrega.
- Dados de teste fictícios ("Paciente Teste A", "Profissional Teste Dois").

### 1.12 Swagger

Toda rota nova ou alterada aparece em `/api-docs/` com corpo, resposta, exemplos e **todos** os
códigos de erro deste documento (PP-10). O app confere o Swagger e uma chamada real a cada leva
(API-06).

## 2. Modelos de dados

Os tipos estão em TypeScript, como o app os declara. **Obrigatório** é o que não tem `?`.

### 2.1 Atividades (leva 1)

```ts
type TaskCategory = "reading" | "writing" | "vocabulary" | "comprehension"; // existente

type TaskType =
  | "multipleChoice" // existente: "Leia e responda"
  | "multipleChoiceWithMedia" // existente
  | "wordBuilder" // "Forme a palavra"
  | "colorMatch" // "Associe as cores"
  | "memoryGame" // "Memória visual"
  | "printable"; // atividade imprimível

type TaskFormat = "INTERACTIVE" | "PRINTABLE"; // derivado do tipo pelo servidor (AT-03)
type TaskSource = "EDUCATOR" | "LIBRARY"; // LIBRARY = atividade pronta, só leitura (AT-06)
type TaskTone = "mint" | "peach" | "lavender" | "yellow"; // cor da miniatura

interface WordBuilderContent {
  kind: "wordBuilder";
  word: string; // 2–12 letras (\p{L}), MAIÚSCULAS, acento permitido: "BOLA", "PÃO"
  distractors?: string[]; // 0–6 itens, cada um UMA letra maiúscula, sem repetir
  hintImageUrl?: string; // URL de POST /task/upload-media
  hintAudioUrl?: string; // URL de POST /task/upload-media
}

interface ColorMatchContent {
  kind: "colorMatch";
  pairs: { id: string; word: string; colorHex: string }[]; // 2–6; word 1–20; "#RRGGBB"; ids únicos
}

interface MemoryGameContent {
  kind: "memoryGame";
  cards: { id: string; label?: string; imageUrl?: string }[]; // 2–8; cada carta com label OU imageUrl; ids únicos
}

interface PrintableContent {
  kind: "printable";
  title: string; // 1–80
  instructions: string; // 1–500
  layout: "LIST" | "GRID" | "SEQUENCE";
  items: {
    id: string; // único no conteúdo
    text?: string; // até 200
    imageUrl?: string;
    answerLines?: number; // inteiro 0–5
  }[]; // 1–20; cada item com text OU imageUrl
}

type TaskContent =
  WordBuilderContent | ColorMatchContent | MemoryGameContent | PrintableContent;

interface TaskAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
} // existente

interface Task {
  id: string;
  category: TaskCategory;
  type: TaskType;
  prompt: string; // obrigatório em todos os tipos; nos novos é a instrução à criança
  alternatives: TaskAlternative[]; // [] nos tipos novos
  createdAt: string;
  imageFile?: string; // só múltipla escolha
  audioFile?: string; // só múltipla escolha
  // Entrega 5: o servidor SEMPRE envia os quatro abaixo (decisão do app; o backend confirma, §8 Q1)
  format: TaskFormat;
  source: TaskSource;
  skills: string[]; // códigos de GET /task/skills; [] quando não houver
  tone: TaskTone; // escolhido pelo servidor quando não vier na criação
  theme?: string; // até 60
  content?: TaskContent; // obrigatório nos tipos novos; ausente na múltipla escolha
}

interface TaskSkill {
  code: string; // "PHONOLOGICAL_AWARENESS"
  label: string; // "Consciência fonológica"
  learningTopics: string[]; // dificuldades do paciente ligadas à habilidade (AT-08)
}

interface TaskSummary {
  id: string;
  type: TaskType;
  format: TaskFormat;
  source: TaskSource;
  category: TaskCategory;
  title: string; // ver regra AT-13
  skills: { code: string; label: string }[];
  theme?: string;
  tone: TaskTone;
  thumbnailUrl?: string; // ver regra AT-14
}

interface RecommendedTask extends TaskSummary {
  reason: string; // até 120: "Consciência fonológica · dificuldade mapeada"
}

interface TaskCatalogPage {
  items: TaskSummary[];
  nextCursor?: string;
}
```

> No app, `format`, `source`, `skills` e `tone` de `Task` ainda são opcionais no TypeScript
> (`src/api/types.ts`), porque o backend atual não os manda. Quando a leva 1 sair com os quatro
> sempre presentes, a segunda passada da API-07 os torna obrigatórios.

### 2.2 Resultado de jogo (leva 1)

O motor do app chama o resultado de `GameResult` (`completed`, `correct`, `attempts`, `errors`,
`durationMs`); gravado, ele vira `ActivityResult`.

```ts
interface ActivityResult {
  id: string;
  sessionId: string;
  taskId: string;
  taskType: TaskType; // "wordBuilder" | "colorMatch" | "memoryGame"
  completed: boolean; // a criança chegou ao fim do jogo
  correct: boolean; // completou SEM NENHUM erro (regra do app; ver RS-09)
  attempts: number; // inteiro 1–50
  errors: number; // inteiro 0–50
  durationMs: number; // inteiro 0–3 600 000
  recordedAt: string; // ISO UTC, do servidor
}

interface ActivitySummary {
  total: number; // resultados da sessão
  completed: number; // com completed = true
  correct: number; // com correct = true
}

/** Item de EvolutionContext.activityResults (sem id, sessionId, durationMs, recordedAt). */
interface EvolutionActivityResult {
  taskId: string;
  title: string; // mesmo cálculo de TaskSummary.title
  taskType: TaskType;
  completed: boolean;
  correct: boolean;
  attempts: number;
  errors: number;
}
```

### 2.3 Equipe (leva 2)

```ts
type TeamRole = "ADMIN" | "PROFESSIONAL";

interface Clinic {
  id: string;
  name: string; // 2–80, sem espaços nas pontas
  createdAt: string;
}

interface ClinicMember {
  educatorId: string;
  name: string;
  email: string;
  photoUrl?: string;
  profession?: string; // "Psicopedagoga"
  role: TeamRole;
  joinedAt: string;
}

interface ClinicInvite {
  id: string;
  code: string; // 8 caracteres de A–Z e 2–9, sem 0, O, 1 e I: /^[A-HJ-NP-Z2-9]{8}$/
  role: TeamRole;
  createdBy: string; // educatorId
  expiresAt: string; // createdAt + 7 dias
  shareMessage: string; // texto pronto para o Share (EQ-05)
  createdAt: string;
}

interface ClinicView {
  clinic: Clinic;
  myRole: TeamRole;
  members: ClinicMember[]; // ADMIN primeiro, depois por nome (pt-BR, sem acento/maiúscula)
}

interface InvitePreview {
  clinicName: string;
  role: TeamRole;
  expiresAt: string;
}

interface StudentShare {
  educatorId: string;
  name: string;
  role: TeamRole;
  sharedAt: string;
}

// Acréscimos em tipos existentes
interface Educator {
  // ...campos atuais
  clinic?: { id: string; name: string; role: TeamRole }; // ausente = sem clínica
}

interface Student {
  // ...campos atuais
  access: "OWNER" | "SHARED"; // relativo a quem lê
  ownerName?: string; // presente quando access = "SHARED"
}

// Sessões, evoluções, planos e relatórios ganham:
//   authorName?: string  // presente só quando o autor NÃO é quem está lendo (EQ-12)
```

### 2.4 Status do paciente (leva 3)

```ts
type StudentStatus = "ACTIVE" | "ARCHIVED";

interface Student {
  // ...campos atuais e os da leva 2
  status: StudentStatus; // todos nascem ACTIVE (migração PA-01)
  archivedAt?: string; // presente só quando ARCHIVED
}

type PatientPrimaryStatus =
  | "PDI_ACTIVE" // "PDI ativo"
  | "ASSESSMENT_PENDING" // "Avaliação pendente"
  | "PLAN_REVIEW" // "PDI em revisão" / "PE em revisão"
  | "NO_PLAN"; // "Sem plano"

type PatientPendingKind =
  | "EVOLUTION_PENDING" // sessão finalizada sem evolução
  | "PLAN_REVIEW_DUE" // revisão de plano ACTIVE vencida
  | "SCALE_DRAFT" // aplicação de escala em rascunho
  | "ANAMNESIS_MISSING"; // nenhuma resposta de anamnese

interface PatientOverview {
  studentId: string;
  primaryStatus: PatientPrimaryStatus;
  activePlan?: {
    id: string;
    type: "PDI" | "PE";
    title: string;
    percent: number;
  }; // percent inteiro 0–100
  nextAppointment?: { id: string; scheduledAt: string };
  pendings: { kind: PatientPendingKind; count: number; targetId?: string }[]; // [] = sem pendência
}
```

### 2.5 Recorrência da agenda (leva 3, G-68)

```ts
type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY";

interface AppointmentSeries {
  id: string;
  studentId: string;
  educatorId: string;
  frequency: RecurrenceFrequency;
  firstScheduledAt: string; // ISO UTC; dia da semana e hora de São Paulo vêm daqui
  occurrences: number; // pedidas na criação, 2–26
  type?: string;
  durationMinutes: number;
  observation?: string;
  endedAt?: string; // série encerrada pelo cancelamento "este e os seguintes"
  createdAt: string;
}

interface AppointmentSeriesDetail extends AppointmentSeries {
  appointments: Appointment[]; // TODAS as ocorrências criadas, inclusive canceladas e concluídas, por scheduledAt
}

interface SeriesResult {
  series: AppointmentSeries;
  created: Appointment[]; // criadas ou alteradas nesta chamada (cancel: as canceladas)
  skipped: {
    scheduledAt: string;
    reason: "CONFLICT";
    conflictingAppointmentId: string;
  }[];
}

interface Appointment {
  // ...campos atuais
  seriesId?: string; // presente nas ocorrências de série
}
```

### 2.6 Push (leva 4, G-67)

```ts
type NotificationKind =
  | "APPOINTMENTS_TODAY"
  | "EVOLUTION_PENDING"
  | "PLAN_REVIEW_DUE"
  | "SCALE_DRAFT_STALE"; // existente

interface PushToken {
  token: string; // "ExponentPushToken[...]"
  platform: "android" | "ios";
  createdAt: string;
  lastSeenAt: string;
}

interface NotificationPreferences {
  pushEnabled: boolean; // padrão true
  kinds: Record<NotificationKind, boolean>; // padrão: todos true; sempre com as 4 chaves
}

/** `data` do push enviado pela API da Expo (PU-04). */
interface PushData {
  notificationIds: string[]; // ids de AppNotification incluídos no push
  target?: AppNotification["target"]; // só quando notificationIds tem 1 item
}
```

### 2.7 Central de ajuda (leva 4, G-69)

O "artigo de ajuda" do produto é o `HelpTutorial`: um tutorial com vídeo opcional e passos em
texto.

```ts
interface HelpTutorial {
  id: string;
  order: number; // inteiro, único, crescente
  title: string; // até 80
  description: string; // até 200
  durationSeconds: number; // inteiro > 0
  featured: boolean; // "Comece por aqui"; no máximo UM true
  videoUrl?: string; // https, MP4 (H.264) ou HLS (.m3u8), com suporte a Range
  thumbnailUrl?: string; // https
  steps?: string[]; // até 10 passos, cada um até 200; obrigatório quando não há videoUrl
}
```

### 2.8 Notificação de pendência (leva 5, G-72)

`AppNotification` **não muda** de formato (BACKEND-ENTREGUE §3.7). Muda a regra de geração:

```ts
/** Chave de deduplicação das notificações de pendência (interna ao backend). */
interface PendingNotificationKey {
  educatorId: string;
  kind: "EVOLUTION_PENDING" | "PLAN_REVIEW_DUE" | "SCALE_DRAFT_STALE";
  targetId: string; // sessionId, planId ou applicationId
  // PLAN_REVIEW_DUE inclui também a data de revisão (nextReviewDate), para avisar de novo
  // quando o plano for revisto e vencer outra vez
}
```

### 2.9 Catálogo de códigos de erro

Códigos novos ou com uso novo na Entrega 5. Os já existentes mantêm o significado atual.

| Código                     | Status | Leva | Onde                                                                                    |
| -------------------------- | ------ | ---- | --------------------------------------------------------------------------------------- |
| `INVALID_CURSOR`           | 400    | 1    | `GET /task/catalog` (já existe nas notificações)                                        |
| `INVALID_CONTENT`          | 400    | 1    | criar e editar atividade; vem com `errors[]`                                            |
| `ALTERNATIVES_NOT_ALLOWED` | 400    | 1    | criar e editar atividade de tipo novo com `alternatives`                                |
| `INVALID_MEDIA_URL`        | 400    | 1    | URL de mídia fora do armazenamento do backend                                           |
| `INVALID_SKILL`            | 400    | 1    | `skills` com código fora do catálogo                                                    |
| `TYPE_CHANGE_NOT_ALLOWED`  | 400    | 1    | `PUT /task/update` que troca o tipo (fora da múltipla escolha)                          |
| `PRINTABLE_NOT_PLAYABLE`   | 400    | 1    | imprimível em caderno, grupo ou resultado de jogo                                       |
| `USE_ANSWER_ROUTE`         | 400    | 1    | resultado de jogo para múltipla escolha                                                 |
| `TASK_NOT_IN_NOTEBOOK`     | 400    | 1    | resultado de jogo de tarefa fora do caderno da sessão (já existe no `answer`)           |
| `LIBRARY_TASK_READ_ONLY`   | 403    | 1    | editar ou excluir atividade da biblioteca                                               |
| `TASK_NOT_FOUND`           | 404    | 1    | todas as rotas de atividade (hoje vem 500, PP-11)                                       |
| `SESSION_NOT_FOUND`        | 404    | 1    | resultado de jogo                                                                       |
| `SESSION_ALREADY_FINISHED` | 409    | 1    | resultado de jogo depois do `finish`                                                    |
| `RESULT_ALREADY_EXISTS`    | 409    | 1    | segundo resultado da mesma tarefa na sessão; com `resultId`                             |
| `NOT_IN_SAME_CLINIC`       | 400    | 2    | compartilhar ou transferir para quem não é da clínica                                   |
| `FORBIDDEN_ROLE`           | 403    | 2    | ação de `ADMIN` feita por `PROFESSIONAL`                                                |
| `NOT_IN_CLINIC`            | 404    | 2    | rotas de clínica sem clínica                                                            |
| `INVITE_NOT_FOUND`         | 404    | 2    | revogar convite inexistente ou de outra clínica                                         |
| `INVITE_INVALID`           | 404    | 2    | código vencido, usado, revogado ou inexistente (um só código)                           |
| `MEMBER_NOT_FOUND`         | 404    | 2    | membro que não é da clínica                                                             |
| `SHARE_NOT_FOUND`          | 404    | 2    | desfazer compartilhamento que não existe                                                |
| `ALREADY_IN_CLINIC`        | 409    | 2    | criar clínica ou aceitar convite já estando numa                                        |
| `TOO_MANY_INVITES`         | 409    | 2    | 21º convite ativo                                                                       |
| `LAST_ADMIN`               | 409    | 2    | último `ADMIN` sair, ser removido ou rebaixado                                          |
| `TOO_MANY_REQUESTS`        | 429    | 2    | prévia pública do convite (já existe na senha)                                          |
| `STUDENT_NOT_FOUND`        | 404    | 1–3  | rotas por paciente (já existe)                                                          |
| `HAS_FUTURE_APPOINTMENTS`  | 409    | 3    | arquivar com atendimentos futuros; com `count`                                          |
| `STUDENT_ARCHIVED`         | 409    | 3    | criar atendimento, série, sessão, plano ou aplicação de escala para arquivado           |
| `SERIES_NOT_FOUND`         | 404    | 3    | rotas de série                                                                          |
| `APPOINTMENT_NOT_FOUND`    | 404    | 3    | `fromAppointmentId` inexistente ou de outra série                                       |
| `APPOINTMENT_NOT_EDITABLE` | 409    | 3    | "este e os seguintes" a partir de ocorrência que não está `PENDING`, ou série encerrada |
| `APPOINTMENT_CONFLICT`     | 409    | 3    | todas as ocorrências da série em conflito (já existe no atendimento)                    |
| `INVALID_PUSH_TOKEN`       | 400    | 4    | token fora do formato da Expo                                                           |

## 3. Leva 1 — Atividades e resultados de jogo

Regras da ESPECIFICACAO §2.3 (AT-01 a AT-12) e §3.3 (RS-01 a RS-08), mais as regras novas
AT-13 a AT-17 e RS-09 a RS-11 deste contrato.

### 3.1 Regras novas da leva 1

| ID    | Regra                                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AT-13 | **Título do resumo** (`TaskSummary.title` e `EvolutionActivityResult.title`): `printable` → `content.title`; `wordBuilder` → `content.word`; `colorMatch` → `"Associe as cores"`; `memoryGame` → `"Memória visual"`; múltipla escolha → `prompt` |
| AT-14 | **Miniatura** (`thumbnailUrl`): `wordBuilder` → `hintImageUrl`; `memoryGame` → `imageUrl` da primeira carta com imagem; `printable` → `imageUrl` do primeiro item com imagem; múltipla escolha → `imageFile`; senão ausente                      |
| AT-15 | **Ordem do catálogo:** `LIBRARY` primeiro, depois `EDUCATOR`; dentro de cada origem, `createdAt` desc e desempate por `id`                                                                                                                       |
| AT-16 | **Tom padrão:** sem `tone` na criação, o servidor escolhe de forma determinística (por exemplo, pelo tipo: `wordBuilder` mint, `colorMatch` peach, `memoryGame` lavender, `printable` yellow, múltipla escolha mint)                             |
| AT-17 | **Troca de tipo:** só entre `multipleChoice` e `multipleChoiceWithMedia` (a FEC-06 tira a mídia e manda `type: "multipleChoice"`). Qualquer outra troca: `400 TYPE_CHANGE_NOT_ALLOWED`                                                           |
| RS-09 | **Semântica de `correct`:** é do app ("completou sem nenhum erro"); o servidor grava como veio. Só valida a coerência: `correct: true` exige `completed: true` (senão `400` de validação, `field: "correct"`)                                    |
| RS-10 | **Título no contexto:** `activityResults` do contexto da evolução usa o título da AT-13, calculado na leitura (se a atividade for excluída depois, o título salvo no resultado serve de reserva)                                                 |
| RS-11 | **Ordem dos resultados:** em todas as respostas, `activityResults` vem por `recordedAt` asc                                                                                                                                                      |

### 3.2 `GET /task/catalog` (nova)

- **Quem:** Educador. Devolve a biblioteca (`LIBRARY`) e as atividades do próprio educador.
- **Query** (todas opcionais):

  | Parâmetro  | Tipo                         | Regra                                                                                       |
  | ---------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
  | `search`   | string 1–100                 | Sem acento e maiúscula; procura em `prompt`, `theme`, título (AT-13) e rótulo da habilidade |
  | `format`   | `INTERACTIVE` \| `PRINTABLE` |                                                                                             |
  | `type`     | `TaskType`                   |                                                                                             |
  | `skill`    | código de habilidade         | Código desconhecido devolve lista vazia (não é erro)                                        |
  | `category` | `TaskCategory`               |                                                                                             |
  | `source`   | `EDUCATOR` \| `LIBRARY`      | Ausente = as duas                                                                           |
  | `limit`    | inteiro 1–50                 | Padrão 20                                                                                   |
  | `cursor`   | string                       | O `nextCursor` da página anterior                                                           |

- **200:**

  ```json
  {
    "items": [
      {
        "id": "4f7c1f0e-0000-4000-8000-000000000001",
        "type": "wordBuilder",
        "format": "INTERACTIVE",
        "source": "LIBRARY",
        "category": "reading",
        "title": "BOLA",
        "skills": [
          {
            "code": "PHONOLOGICAL_AWARENESS",
            "label": "Consciência fonológica"
          }
        ],
        "theme": "Brinquedos",
        "tone": "mint",
        "thumbnailUrl": "https://<bucket>.s3.amazonaws.com/library/bola.png"
      }
    ],
    "nextCursor": "eyJvIjoyMH0"
  }
  ```

- **Erros:** `400` validação (valor fora do enum, `limit` fora de 1–50); `400 INVALID_CURSOR`.
- **Regras:** AT-09, AT-15. Filtros se combinam com E. Os parâmetros de filtro do cursor são os
  da chamada atual: mudar um filtro recomeça sem cursor.
- **Efeitos:** nenhum.

### 3.3 `GET /task/skills` (nova)

- **Quem:** Educador.
- **200:** `TaskSkill[]`, na ordem do seed.

  ```json
  [
    {
      "code": "PHONOLOGICAL_AWARENESS",
      "label": "Consciência fonológica",
      "learningTopics": ["leitura", "sons das letras"]
    }
  ]
  ```

- **Erros:** só `401`.
- **Regras:** AT-12. Catálogo fixo por seed ([§9.1](#91-seeds)); o app guarda em cache por 24 h.

### 3.4 `GET /task/recommended` (nova)

- **Quem:** Com acesso ao paciente.
- **Query:** `studentId` (UUID, obrigatório).
- **200:** `RecommendedTask[]` com 0 a 6 itens, só `INTERACTIVE`.

  ```json
  [
    {
      "id": "4f7c1f0e-0000-4000-8000-000000000001",
      "type": "wordBuilder",
      "format": "INTERACTIVE",
      "source": "LIBRARY",
      "category": "reading",
      "title": "BOLA",
      "skills": [
        { "code": "PHONOLOGICAL_AWARENESS", "label": "Consciência fonológica" }
      ],
      "tone": "mint",
      "reason": "Consciência fonológica · dificuldade mapeada"
    }
  ]
  ```

- **Erros:** `400` validação (sem `studentId` ou não-UUID); `403 UNAUTHORIZED`;
  `404 STUDENT_NOT_FOUND`.
- **Regras:**
  1. AT-08: habilidades ligadas às `learningTopics` do paciente (comparação sem acento e
     maiúscula) e à categoria de menor acerto nas últimas 5 sessões finalizadas; sem repetir
     atividades das 3 últimas sessões. Sem IA.
  2. Sem `learningTopics` e sem sessões: `200 []` (estado vazio, não erro).
  3. `reason` em pt-BR, até 120: "{rótulo da habilidade} · dificuldade mapeada" ou
     "{categoria} · menor acerto recente".
  4. Paciente arquivado (a partir da leva 3): `200 []` (PA-03).

### 3.5 `GET /task/:id` (alterada)

- **Quem:** Educador. Atividade `LIBRARY`: qualquer educador. Atividade `EDUCATOR`: a mesma regra
  de hoje (a Entrega 5 não restringe mais).
- **200:** `Task` completo, com `content` nos tipos novos.

  ```json
  {
    "id": "4f7c1f0e-0000-4000-8000-000000000002",
    "category": "vocabulary",
    "type": "colorMatch",
    "prompt": "Ligue cada palavra à sua cor",
    "alternatives": [],
    "createdAt": "2026-11-20T13:00:00.000Z",
    "format": "INTERACTIVE",
    "source": "LIBRARY",
    "skills": ["VOCABULARY"],
    "tone": "peach",
    "content": {
      "kind": "colorMatch",
      "pairs": [
        { "id": "p1", "word": "AZUL", "colorHex": "#2F6FDE" },
        { "id": "p2", "word": "VERMELHO", "colorHex": "#D93B3B" }
      ]
    }
  }
  ```

- **Erros:** `404 TASK_NOT_FOUND` (inexistente ou id não-UUID; **hoje vem 500**, PP-11).
- **Nota:** o app já trata `TASK_NOT_FOUND` pelo código, qualquer que seja o status.

### 3.6 `GET /task/` (alterada)

- **Quem:** Educador. Continua devolvendo `Task[]` **só do educador** (nunca a biblioteca), com
  os campos novos a mais (AT-11). Query atual mantida.
- **Erros:** os atuais.

### 3.7 `POST /task/create` (alterada)

- **Quem:** Educador. Cria atividade `source: "EDUCATOR"` do educador do token.
- **Corpo** (`multipart/form-data`):

  ```ts
  // Múltipla escolha: exatamente como hoje (alternatives, imageFile/audioFile como arquivo)
  // Tipos novos:
  {
    category: TaskCategory;
    type: "wordBuilder" | "colorMatch" | "memoryGame" | "printable";
    prompt: string; // 1–300
    content: string; // JSON de TaskContent, com kind === type
    skills?: string; // JSON de string[] (0–5 códigos)
    theme?: string; // 1–60
    tone?: TaskTone;
    // SEM alternatives, imageFile, audioFile
  }
  ```

- **201:** `Task` completo (hoje `201` vazio). O app aceita `201` vazio como reserva, mas o
  contrato é `201 Task`.
- **Erros:**

  | Status | Código                     | Quando                                                                        |
  | ------ | -------------------------- | ----------------------------------------------------------------------------- |
  | 400    | `Bad Request` + `errors`   | campo fora do formato (`category`, `type`, `prompt`, `theme`, `tone`)         |
  | 400    | `INVALID_CONTENT`          | `content` ausente, JSON inválido, `kind` ≠ `type` ou fora dos limites do §2.1 |
  | 400    | `ALTERNATIVES_NOT_ALLOWED` | tipo novo com `alternatives`                                                  |
  | 400    | `INVALID_MEDIA_URL`        | URL em `content` que não veio de `POST /task/upload-media` (AT-05)            |
  | 400    | `INVALID_SKILL`            | código de habilidade fora do catálogo                                         |
  | 400    | erros atuais               | regras atuais da múltipla escolha                                             |

- **`INVALID_CONTENT` com campos:** `{ "message": "INVALID_CONTENT", "errors": [{ "field": "content.pairs.2.word", "message": "..." }] }`.
  Um item por campo inválido; `field: "content"` quando o problema é o objeto inteiro.
- **Regras:** AT-01 a AT-05, AT-12, AT-16. `wordBuilder` aceita imagem e áudio de dica;
  `memoryGame` e `printable`, só imagens. As letras de `word` e `distractors` são gravadas em
  maiúsculas.
- **Efeitos:** a atividade aparece em `GET /task/`, `GET /task/catalog?source=EDUCATOR` e
  `GET /task/:id`.

### 3.8 `PUT /task/update` (alterada)

- **Quem:** Educador dono da atividade.
- **Corpo** (JSON):

  ```ts
  {
    id: string; // UUID
    category?: TaskCategory;
    type?: TaskType; // só entre multipleChoice e multipleChoiceWithMedia (AT-17)
    prompt?: string;
    alternatives?: { text: string; isCorrect: boolean }[]; // só múltipla escolha
    imageFile?: string | null; // null apaga (leva 3, PP-05)
    audioFile?: string | null; // null apaga (leva 3, PP-05)
    content?: TaskContent; // lista completa; ids dos itens preservados pelo app
    skills?: string[]; // substitui a lista
    theme?: string;
    tone?: TaskTone;
  }
  ```

- **200:** `Task` atualizado (hoje `200` vazio; o app aceita os dois).
- **Erros:** os do `create`; `400 TYPE_CHANGE_NOT_ALLOWED`; `403 LIBRARY_TASK_READ_ONLY`;
  `404 TASK_NOT_FOUND` (hoje 500, PP-11).
- **Regras:** AT-07, AT-17. `content.kind` precisa continuar igual ao `type`.

### 3.9 `POST /task/:id/duplicate` (nova)

- **Quem:** Educador. Duplica uma atividade `LIBRARY` ou uma do próprio educador.
- **Corpo:** nenhum.
- **201:** `Task` novo, `source: "EDUCATOR"`, do educador do token, com o mesmo `type`,
  `category`, `prompt`, `content` (mesmas URLs de mídia), `skills`, `theme` e `tone`; `id` e
  `createdAt` novos.
- **Erros:** `403 UNAUTHORIZED` (atividade `EDUCATOR` de outro educador); `404 TASK_NOT_FOUND`.
- **Efeitos:** a cópia aparece no catálogo do educador. Não é idempotente: cada chamada cria uma
  cópia (o app só chama por toque).

### 3.10 `DELETE /task/delete/:id` (alterada)

- **Quem:** Educador dono.
- **200:** como hoje (`null`).
- **Erros:** `403 LIBRARY_TASK_READ_ONLY`; `404 TASK_NOT_FOUND` (hoje 500, PP-11).

### 3.11 Cadernos, grupos e lote (alteradas)

`POST /task-notebook/create`, `PUT /task-notebook/update`, `POST /task-group/create` e
`PUT /task-group/update`:

- Aceitam ids de atividades `LIBRARY` e dos tipos jogáveis novos (AT-10).
- Atividade `printable` na lista: `400 PRINTABLE_NOT_PLAYABLE`.
- Id de atividade inexistente: `404 TASK_NOT_FOUND` (PP-11).
- `TASK_GROUP_NOT_FOUND` e `TASK_NOTEBOOK_NOT_FOUND`: `404` (hoje 500, PP-11).

`POST /task/batch` **não muda**: continua só com múltipla escolha (a IA não gera jogos); outro
tipo em `tasks[]` dá `400 INVALID_TASK_DATA`.

### 3.12 `POST /task-notebook-session/activity-result` (nova)

- **Quem:** Com acesso ao paciente da sessão (RS-08).
- **Corpo** (JSON), exatamente o que o app envia hoje (`SubmitActivityResultInput` em
  `src/api/endpoints/session.ts`):

  ```ts
  {
    sessionId: string; // UUID
    taskId: string; // UUID (ou id da biblioteca)
    completed: boolean;
    correct: boolean; // true exige completed true (RS-09)
    attempts: number; // inteiro 1–50
    errors: number; // inteiro 0–50
    durationMs: number; // inteiro 0–3 600 000
  }
  ```

- **201:** `ActivityResult`.

  ```json
  {
    "id": "9a1e0c55-0000-4000-8000-000000000010",
    "sessionId": "3c2b1a00-0000-4000-8000-000000000020",
    "taskId": "4f7c1f0e-0000-4000-8000-000000000001",
    "taskType": "wordBuilder",
    "completed": true,
    "correct": true,
    "attempts": 5,
    "errors": 0,
    "durationMs": 48000,
    "recordedAt": "2026-12-01T17:20:00.000Z"
  }
  ```

- **Erros**, na ordem em que o app espera a checagem (é a ordem dos mocks):

  | Status | Código                     | Quando                                                        |
  | ------ | -------------------------- | ------------------------------------------------------------- |
  | 400    | `Bad Request` + `errors`   | corpo fora do formato ou dos limites                          |
  | 404    | `SESSION_NOT_FOUND`        | sessão inexistente                                            |
  | 403    | `UNAUTHORIZED`             | paciente da sessão fora do alcance                            |
  | 409    | `SESSION_ALREADY_FINISHED` | sessão com `finishedAt`                                       |
  | 400    | `TASK_NOT_IN_NOTEBOOK`     | sessão com caderno e tarefa fora dele e dos grupos dele       |
  | 404    | `TASK_NOT_FOUND`           | tarefa inexistente                                            |
  | 400    | `USE_ANSWER_ROUTE`         | tarefa de múltipla escolha                                    |
  | 400    | `PRINTABLE_NOT_PLAYABLE`   | tarefa `printable`                                            |
  | 409    | `RESULT_ALREADY_EXISTS`    | já existe resultado da tarefa na sessão; corpo com `resultId` |

  ```json
  {
    "message": "RESULT_ALREADY_EXISTS",
    "resultId": "9a1e0c55-0000-4000-8000-000000000010"
  }
  ```

- **Regras:** RS-01 a RS-05, RS-09. Sessão sem caderno (grupo ou atividade avulsa) aceita
  qualquer tarefa jogável. O resultado **não entra** no `accuracy` das análises (G-65).
- **Efeitos:** o resultado aparece no relatório da sessão, na listagem de sessões do paciente e
  no contexto da evolução (§3.13). Nenhuma notificação.

### 3.13 Leituras de sessão e evolução (alteradas)

| Rota                                            | Acréscimo                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /task-notebook-session/report/:sessionId`  | `activitySummary: ActivitySummary` e `activityResults: ActivityResult[]` quando houver resultado |
| `GET /task-notebook-session/student/:studentId` | cada sessão com `activityResults: ActivityResult[]` quando houver (RS-07, usado na retomada)     |
| `GET /session-evolution/context/:sessionId`     | `activityResults: EvolutionActivityResult[]` quando houver (RS-06, RS-10)                        |

- Sem resultado, os campos ficam **ausentes** (o app trata ausência como "sem jogos").
- `accuracy`, `percentageByType`, `percentageByCategory` e as análises do aluno **não mudam**
  (RS-05). A evolução salva não muda.

### 3.14 Divergências entre a especificação e o código do app (o código manda)

| Ponto                        | ESPECIFICACAO §2–§3                               | Código do app na `main` (contrato)                                                                            |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Campos novos de `Task`       | `format`, `source`, `skills`, `tone` obrigatórios | Opcionais no TypeScript e derivados quando faltam (`taskFormat`, `taskSource`); o servidor deve mandar sempre |
| `correct`                    | "terminou sem pedir para pular"                   | "completou sem nenhum erro" (`correct: state.errors === 0` nos três jogos); RS-09                             |
| `RESULT_ALREADY_EXISTS`      | com `resultId`                                    | O app não lê o `resultId`: conta o `409` como registrado e segue (`GameStep.tsx`)                             |
| Ordem dos erros do resultado | não definida                                      | A do mock (`src/mocks/handlers/session-analysis.ts`), reproduzida no §3.12                                    |
| Ordem do catálogo            | não definida                                      | Biblioteca primeiro (mock `allCatalogTasks`); AT-15                                                           |
| Título e miniatura do resumo | "prompt ou content.title / palavra / …"           | Regras exatas do mock (`titleOf`, `thumbnailOf`): AT-13 e AT-14                                               |
| Tom padrão                   | "escolhido pelo servidor"                         | O mock usa `mint` quando falta; AT-16 deixa a escolha ao servidor, sempre presente                            |
| Recomendação                 | por tópicos **e** sessões recentes                | O mock só usa `learningTopics`; o backend aplica a regra completa (AT-08)                                     |
| `GET /task/:id` inexistente  | `404 TASK_NOT_FOUND`                              | O mock ainda devolve `500 TASK_NOT_FOUND`; o app trata pelo código, então `404` não quebra                    |
| `INVALID_CURSOR`             | só notificações                                   | Mensagem do app generalizada ("Não foi possível carregar mais itens"); vale para o catálogo                   |

### 3.15 Critérios de aceite do backend — leva 1

| ID      | Critério                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| BK-1-01 | `GET /task/catalog?format=PRINTABLE` só traz `printable`; `?source=LIBRARY` só traz a biblioteca; sem filtros, biblioteca primeiro     |
| BK-1-02 | `GET /task/catalog?search=pao` encontra a atividade "PÃO" (sem acento e maiúscula)                                                     |
| BK-1-03 | Percorrer o catálogo com `limit=5` e `nextCursor` devolve todos os itens uma vez só; cursor adulterado dá `400 INVALID_CURSOR`         |
| BK-1-04 | `GET /task/skills` devolve o catálogo do seed com `learningTopics`                                                                     |
| BK-1-05 | `GET /task/recommended` de paciente de outro educador dá `403`; sem sessões, recomenda pelas `learningTopics`; sem nada, `[]`          |
| BK-1-06 | `GET /task/:id` inexistente dá `404 TASK_NOT_FOUND`; de uma atividade da biblioteca traz `content`                                     |
| BK-1-07 | Criar `wordBuilder` sem `content.word` dá `400 INVALID_CONTENT` com `field: "content.word"`; criado, a resposta é `201 Task`           |
| BK-1-08 | Criar `colorMatch` com `alternatives` dá `400 ALTERNATIVES_NOT_ALLOWED`; com URL externa, `400 INVALID_MEDIA_URL`                      |
| BK-1-09 | Editar ou excluir atividade da biblioteca dá `403 LIBRARY_TASK_READ_ONLY`; duplicar dá `201` com `source: "EDUCATOR"`, editável        |
| BK-1-10 | Trocar `wordBuilder` para `colorMatch` dá `400 TYPE_CHANGE_NOT_ALLOWED`; `multipleChoiceWithMedia` → `multipleChoice` é aceito         |
| BK-1-11 | Um `printable` num caderno ou grupo dá `400 PRINTABLE_NOT_PLAYABLE`                                                                    |
| BK-1-12 | `GET /task/` de um cliente antigo continua funcionando, com os campos novos a mais e sem a biblioteca                                  |
| BK-1-13 | O mesmo resultado enviado duas vezes dá `409 RESULT_ALREADY_EXISTS` com `resultId`; depois do `finish`, `409 SESSION_ALREADY_FINISHED` |
| BK-1-14 | Resultado de múltipla escolha dá `400 USE_ANSWER_ROUTE`; `correct: true` com `completed: false` dá `400`                               |
| BK-1-15 | Depois de um resultado, relatório, listagem de sessões e contexto da evolução trazem os jogos; o `accuracy` da análise não muda        |

## 4. Leva 2 — Equipe

Regras EQ-01 a EQ-15 da ESPECIFICACAO §4.4 (G-62, G-63), mais EQ-16 a EQ-20 deste contrato.

### 4.1 Regras novas da leva 2

| ID    | Regra                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| EQ-16 | **Código do convite** normalizado na entrada: maiúsculas, sem espaços e hífens. `"ab3k-7mpq"` e `"AB3K7MPQ"` são o mesmo código                                    |
| EQ-17 | **`shareMessage`** exatamente: `Use o código {CÓDIGO} para entrar na equipe {clínica} no app Labirinto do Saber. Vale até {dd/mm}.` (data em São Paulo; sem link)  |
| EQ-18 | **ADMIN remove ADMIN:** permitido, salvo o último (`409 LAST_ADMIN`). O próprio membro sai com `DELETE /clinic/members/{seu id}`, com qualquer papel               |
| EQ-19 | **Leitura dos compartilhamentos:** quem tem acesso (dono ou compartilhado) lê `GET /student/:id/shares`; só o dono cria e desfaz                                   |
| EQ-20 | **Notificações da colega:** a evolução pendente vai para quem conduziu a sessão; atendimentos para o educador do atendimento; revisão de plano para o dono (EQ-14) |

### 4.2 `GET /educator/me` (alterada)

- **Quem:** Educador.
- **200:** o `Educator` atual com `clinic?: { id, name, role }` (ausente sem clínica).

  ```json
  {
    "id": "e1",
    "name": "Profissional Teste",
    "email": "profissional.teste@example.com",
    "profession": "Psicopedagoga",
    "clinic": { "id": "c1", "name": "Clínica Teste", "role": "ADMIN" }
  }
  ```

- **Uso:** é a fonte do papel no app (`usePermissions`, EQP-02). Precisa sair na leva 2.

### 4.3 `POST /clinic/` (nova)

- **Quem:** Educador sem clínica.
- **Corpo:** `{ name: string }` (2–80 depois do `trim`).
- **201:** `ClinicView` com o criador como único membro, `role: "ADMIN"` e `myRole: "ADMIN"`.

  ```json
  {
    "clinic": {
      "id": "c1",
      "name": "Clínica Teste",
      "createdAt": "2026-12-01T13:00:00.000Z"
    },
    "myRole": "ADMIN",
    "members": [
      {
        "educatorId": "e1",
        "name": "Profissional Teste",
        "email": "profissional.teste@example.com",
        "role": "ADMIN",
        "joinedAt": "2026-12-01T13:00:00.000Z"
      }
    ]
  }
  ```

- **Erros:** `400` validação; `409 ALREADY_IN_CLINIC`.
- **Regras:** EQ-01, EQ-02. **Efeitos:** `GET /educator/me` passa a trazer `clinic`.

### 4.4 `GET /clinic/` (nova)

- **Quem:** Educador.
- **200:** `ClinicView` (members na ordem do §2.3).
- **Erros:** `404 NOT_IN_CLINIC` (sem clínica; o app mostra o estado vazio, não erro).

### 4.5 `PUT /clinic/` (nova)

- **Quem:** ADMIN.
- **Corpo:** `{ name: string }` (2–80).
- **200:** `ClinicView`.
- **Erros:** `400`; `403 FORBIDDEN_ROLE`; `404 NOT_IN_CLINIC`.
- **Efeitos:** `shareMessage` de convites criados depois usa o nome novo (os já criados não mudam).

### 4.6 `POST /clinic/invites` (nova)

- **Quem:** ADMIN.
- **Corpo:** `{ role: TeamRole }`.
- **201:** `ClinicInvite`.

  ```json
  {
    "id": "i1",
    "code": "AB3K7MPQ",
    "role": "PROFESSIONAL",
    "createdBy": "e1",
    "expiresAt": "2026-12-08T13:00:00.000Z",
    "shareMessage": "Use o código AB3K7MPQ para entrar na equipe Clínica Teste no app Labirinto do Saber. Vale até 08/12.",
    "createdAt": "2026-12-01T13:00:00.000Z"
  }
  ```

- **Erros:** `400` validação; `403 FORBIDDEN_ROLE`; `404 NOT_IN_CLINIC`; `409 TOO_MANY_INVITES`.
- **Regras:** EQ-04, EQ-05, EQ-17. Código único entre os convites ativos de todas as clínicas.

### 4.7 `GET /clinic/invites` (nova)

- **Quem:** ADMIN.
- **200:** `ClinicInvite[]` **ativos** (não usados, não revogados, não vencidos), por `createdAt` desc.
- **Erros:** `403 FORBIDDEN_ROLE`; `404 NOT_IN_CLINIC`.

### 4.8 `DELETE /clinic/invites/:id` (nova)

- **Quem:** ADMIN.
- **204** sem corpo. O código passa a dar `INVITE_INVALID`.
- **Erros:** `403 FORBIDDEN_ROLE`; `404 INVITE_NOT_FOUND` (inexistente, de outra clínica, já usado
  ou já revogado).

### 4.9 `GET /clinic/invites/preview/:code` (nova, **Pública**)

- **Quem:** Pública (tela "Tenho um convite", antes do login).
- **200:** `InvitePreview`.

  ```json
  {
    "clinicName": "Clínica Teste",
    "role": "PROFESSIONAL",
    "expiresAt": "2026-12-08T13:00:00.000Z"
  }
  ```

- **Erros:** `404 INVITE_INVALID` (vencido, usado, revogado, inexistente ou fora do formato);
  `429 TOO_MANY_REQUESTS` (EQ-07).
- **Regras:** EQ-07, EQ-16. Não consome o convite. Não revela nada além dos três campos.

### 4.10 `POST /clinic/invites/accept` (nova)

- **Quem:** Educador sem clínica.
- **Corpo:** `{ code: string }`.
- **200:** `ClinicView` com o novo membro e `myRole` igual ao papel do convite.
- **Erros:** `400` validação; `404 INVITE_INVALID`; `409 ALREADY_IN_CLINIC`.
- **Efeitos:** o convite fica usado; `GET /educator/me` passa a trazer `clinic`.

### 4.11 `POST /educator/register` (alterada, **Pública**)

- **Corpo:** o atual (`name` 3–100, `email`, `password` 6–100) mais `inviteCode?: string`.
- **200:** o atual, `{ id, name }` (sem token; o app faz `sign-in` em seguida).
- **Erros:** os atuais (`400` validação, `400 EDUCATOR_ALREADY_EXISTS`); `404 INVITE_INVALID`.
- **Regras:** EQ-06. Com `inviteCode`, conta e membro são criados **na mesma transação**: código
  inválido não cria a conta. Sem `inviteCode`, o comportamento é o de hoje. Nenhuma confirmação de
  e-mail: o `sign-in` funciona logo depois.

### 4.12 `PUT /clinic/members/:educatorId` (nova)

- **Quem:** ADMIN.
- **Corpo:** `{ role: TeamRole }`.
- **200:** `ClinicView`.
- **Erros:** `400`; `403 FORBIDDEN_ROLE`; `404 MEMBER_NOT_FOUND`; `409 LAST_ADMIN`.
- **Regras:** EQ-08. Mudar para o mesmo papel é idempotente.

### 4.13 `DELETE /clinic/members/:educatorId` (nova)

- **Quem:** ADMIN (remover outro) ou o próprio membro (sair, com o próprio id).
- **204** sem corpo.
- **Erros:** `403 FORBIDDEN_ROLE` (PROFESSIONAL removendo outro); `404 MEMBER_NOT_FOUND`;
  `409 LAST_ADMIN`.
- **Efeitos (mesma transação, EQ-09):** o membro sai da clínica e **leva os pacientes dos quais
  é dono**; todos os compartilhamentos dele e com ele dentro da clínica são desfeitos; os
  registros clínicos que ele criou em pacientes de outros continuam lá, com autoria. As
  notificações dele de pacientes que deixou de acessar somem da lista e do contador.

### 4.14 `GET /student/` (alterada)

- **200:** `Student[]` com os próprios **e** os compartilhados com quem lê, cada um com
  `access` e, quando `SHARED`, `ownerName` (EQ-13).
- O `ADMIN` **não** vê paciente de outro membro que não foi compartilhado com ele (G-62).

### 4.15 `GET /student/:id/shares` (nova)

- **Quem:** Com acesso (EQ-19).
- **200:** `StudentShare[]` (sem o dono), por `sharedAt` asc.

  ```json
  [
    {
      "educatorId": "e2",
      "name": "Profissional Teste Dois",
      "role": "PROFESSIONAL",
      "sharedAt": "2026-12-02T12:00:00.000Z"
    }
  ]
  ```

- **Erros:** `403 UNAUTHORIZED`; `404 STUDENT_NOT_FOUND`.

### 4.16 `POST /student/:id/shares` (nova)

- **Quem:** Dono.
- **Corpo:** `{ educatorId: string }` (UUID).
- **200:** `StudentShare[]` atualizada.
- **Erros:** `400` validação (inclusive `educatorId` igual ao dono); `400 NOT_IN_SAME_CLINIC`
  (dono sem clínica ou colega de outra); `403 UNAUTHORIZED` (não é o dono); `404 STUDENT_NOT_FOUND`.
- **Regras:** EQ-10, idempotente. **Efeitos:** o paciente aparece em `GET /student/` do colega
  com `access: "SHARED"`.

### 4.17 `DELETE /student/:id/shares/:educatorId` (nova)

- **Quem:** Dono.
- **200:** `StudentShare[]` atualizada.
- **Erros:** `403 UNAUTHORIZED`; `404 STUDENT_NOT_FOUND`, `404 SHARE_NOT_FOUND`.
- **Efeitos:** o colega passa a receber `403` nas rotas do paciente; as notificações dele sobre
  esse paciente somem. Os registros que ele criou continuam.

### 4.18 Regra de acesso "dono ou compartilhado" nas rotas clínicas

Todas as rotas abaixo trocam "dono do paciente" por **Com acesso** (EQ-11). Cada domínio precisa
de teste próprio (o colega lê e escreve; depois de desfeito, `403`).

| Domínio                 | Rotas                                                                                  | Ação só do dono (continua `403` para o colega)                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Paciente                | `GET /student/:id` (leva 3), `GET /student/overview` (leva 3)                          | `PUT /student/update/:id`, `POST /student/:id/documents`, `POST /student/assign-educator`, `PUT /student/:id/status`, compartilhar |
| Sessões                 | `/task-notebook-session/*` por paciente ou sessão, análises (`/analysis/student/:id*`) | —                                                                                                                                  |
| Evolução                | `/session-evolution/*`                                                                 | —                                                                                                                                  |
| Planos                  | `/plan/*`                                                                              | —                                                                                                                                  |
| Escalas                 | `/scale-application/*`                                                                 | —                                                                                                                                  |
| Anamnese                | `/anamnese/responses/*` por paciente                                                   | —                                                                                                                                  |
| Relatórios              | `/report/*`                                                                            | —                                                                                                                                  |
| Atendimentos            | `POST /appointment/`, `PUT /appointment/:id` (para paciente com acesso)                | —                                                                                                                                  |
| Atividades recomendadas | `GET /task/recommended`                                                                | —                                                                                                                                  |

- **Autoria (EQ-12):** cada registro guarda o `educatorId` de quem criou; sessões, evoluções,
  planos e relatórios ganham `authorName?` quando o autor não é quem lê.
- **Listas por paciente** (sessões, evoluções, planos, relatórios, aplicações) trazem os registros
  de todos os autores com acesso.
- **`GET /appointment/`** continua por educador: a colega vê só os atendimentos que ela marcou.
- **`POST /student/assign-educator`** (EQ-15): com o dono numa clínica, o novo educador precisa
  ser da mesma (`400 NOT_IN_SAME_CLINIC`); a transferência desfaz os compartilhamentos.

### 4.19 Critérios de aceite do backend — leva 2

| ID      | Critério                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------- |
| BK-2-01 | Criar clínica devolve `ClinicView` com `myRole: "ADMIN"`; criar outra dá `409 ALREADY_IN_CLINIC`          |
| BK-2-02 | `GET /clinic/` sem clínica dá `404 NOT_IN_CLINIC`; `GET /educator/me` traz `clinic` depois de criar       |
| BK-2-03 | Um `PROFESSIONAL` que cria convite, renomeia ou muda papel recebe `403 FORBIDDEN_ROLE`                    |
| BK-2-04 | O 21º convite ativo dá `409 TOO_MANY_INVITES`; `shareMessage` segue a EQ-17                               |
| BK-2-05 | Código usado, vencido, revogado ou inexistente devolve o mesmo `404 INVITE_INVALID` na prévia e no aceite |
| BK-2-06 | A 11ª prévia do mesmo IP em 15 min dá `429 TOO_MANY_REQUESTS`                                             |
| BK-2-07 | `register` com `inviteCode` válido cria conta e membro; com código inválido, **não** cria a conta         |
| BK-2-08 | O último `ADMIN` não sai, não é removido nem rebaixado (`409 LAST_ADMIN`)                                 |
| BK-2-09 | Depois de compartilhar, o colega lê o paciente, cria sessão e evolução; depois de desfazer, recebe `403`  |
| BK-2-10 | O colega recebe `403` ao editar o cadastro, compartilhar ou arquivar                                      |
| BK-2-11 | O `ADMIN` não vê, em `GET /student/`, paciente de outro membro não compartilhado com ele                  |
| BK-2-12 | Remover um membro desfaz os compartilhamentos dele, e os pacientes dele continuam com ele                 |
| BK-2-13 | Evolução criada pelo colega aparece para o dono com `authorName`; para o próprio autor, sem `authorName`  |

## 5. Leva 3 — Status do paciente, recorrência e `null`

Regras PA-01 a PA-07 (ESPECIFICACAO §5.3, G-70), RC-01 a RC-08 (§6.3, G-68) e PP-05, PP-09 (§9),
mais PA-08 a PA-10 e RC-09 a RC-11 deste contrato.

### 5.1 Regras novas da leva 3

| ID    | Regra                                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-08 | **Overview = lista:** `GET /student/overview?status=X` traz um item para cada paciente de `GET /student/?status=X` (próprios e compartilhados), na mesma ordem                |
| PA-09 | **`targetId`** presente quando `count === 1` (o id da sessão, plano ou aplicação); ausente quando `count > 1` e sempre ausente em `ANAMNESIS_MISSING`                         |
| PA-10 | **Corpo do 409 do arquivamento:** `{ "message": "HAS_FUTURE_APPOINTMENTS", "count": <número de atendimentos PENDING futuros> }`                                               |
| RC-09 | **Limite de calendário:** a última ocorrência fica no máximo 183 dias depois da primeira; quinzenal aceita no máximo 13 ocorrências (`400` validação, `field: "occurrences"`) |
| RC-10 | **Detalhe completo:** `GET /appointment/series/:id` traz todas as ocorrências criadas, inclusive canceladas e concluídas (o app mostra "3 de 8")                              |
| RC-11 | **"Este e os seguintes" só a partir de `PENDING`** de série sem `endedAt`; senão `409 APPOINTMENT_NOT_EDITABLE`                                                               |

### 5.2 `GET /student/overview` (nova)

- **Quem:** Educador; só pacientes com acesso.
- **Query:** `status?` (`ACTIVE` padrão, `ARCHIVED`, `ALL`).
- **200:** `PatientOverview[]` (PA-08).

  ```json
  [
    {
      "studentId": "s1",
      "primaryStatus": "PLAN_REVIEW",
      "activePlan": {
        "id": "pl1",
        "type": "PE",
        "title": "PE · Leitura",
        "percent": 40
      },
      "nextAppointment": {
        "id": "a1",
        "scheduledAt": "2026-12-03T17:00:00.000Z"
      },
      "pendings": [
        { "kind": "EVOLUTION_PENDING", "count": 1, "targetId": "ses1" },
        { "kind": "PLAN_REVIEW_DUE", "count": 1, "targetId": "pl1" }
      ]
    }
  ]
  ```

- **Erros:** `400` validação.
- **Regras:** PA-06 (ordem do status principal), PA-07 (pendências calculadas na leitura, com as
  regras das notificações, sem esperar o job), PA-09. `activePlan` é o PDI `ACTIVE` ou, sem ele, o
  PE `ACTIVE` mais recente. `nextAppointment` é o próximo `PENDING` futuro de quem lê.
- **Sem nome:** o overview não traz nome nem dado do paciente (vai para o cache do app).

### 5.3 `GET /student/:id` (nova, PP-09)

- **Quem:** Com acesso. Funciona também para arquivado.
- **200:** `Student` completo (com `access`, `ownerName?`, `status`, `archivedAt?`).
- **Erros:** `403 UNAUTHORIZED`; `404 STUDENT_NOT_FOUND`.

### 5.4 `GET /student/` (alterada)

- **Query nova:** `status?` (`ACTIVE` padrão, `ARCHIVED`, `ALL`); valor fora do enum: `400`.
- **200:** `Student[]` com `status` e `archivedAt?`. Sem query, só ativos (PA-03): um cliente
  antigo deixa de ver os arquivados, que é o esperado.

### 5.5 `PUT /student/:id/status` (nova)

- **Quem:** Dono.
- **Corpo:** `{ status: "ACTIVE" | "ARCHIVED"; cancelFutureAppointments?: boolean }`.
- **200:** `Student` atualizado.
- **Erros:** `400` validação; `403 UNAUTHORIZED` (inclusive o colega); `404 STUDENT_NOT_FOUND`;
  `409 HAS_FUTURE_APPOINTMENTS` com `count` (PA-10).
- **Regras:** PA-02 a PA-05. O app **nunca** manda `cancelFutureAppointments: true` na primeira
  tentativa: só depois de mostrar o `count` e o usuário confirmar.
- **Efeitos (mesma transação):** com `cancelFutureAppointments: true`, os atendimentos `PENDING`
  futuros do paciente (de qualquer educador) viram `CANCELLED`, e as séries afetadas ganham
  `endedAt`. Arquivado sai da lista, do overview padrão, da recomendação e das notificações; os
  compartilhamentos continuam (somem junto da lista ativa do colega). Reativar volta a `ACTIVE`
  sem recriar nada (PA-05).

### 5.6 `409 STUDENT_ARCHIVED` nas rotas de criação (alteradas)

Para paciente `ARCHIVED`, devolvem `409 STUDENT_ARCHIVED` (PA-04):
`POST /appointment/`, `POST /appointment/series`, `POST /task-notebook-session/start`,
`POST /plan/`, `POST /scale-application/`. Leituras e edição de registros existentes continuam.

### 5.7 Recorrência

#### `POST /appointment/series` (nova)

- **Quem:** Com acesso ao paciente.
- **Corpo:**

  ```ts
  {
    studentId: string; // UUID
    scheduledAt: string; // ISO UTC da primeira ocorrência
    frequency: "WEEKLY" | "BIWEEKLY";
    occurrences: number; // inteiro 2–26 (RC-09)
    type?: string;
    durationMinutes?: number; // padrão o do atendimento comum
    observation?: string;
  }
  ```

- **201:** `SeriesResult`.

  ```json
  {
    "series": {
      "id": "sr1",
      "studentId": "s1",
      "educatorId": "e1",
      "frequency": "WEEKLY",
      "firstScheduledAt": "2026-12-01T17:00:00.000Z",
      "occurrences": 8,
      "durationMinutes": 50,
      "createdAt": "2026-11-30T12:00:00.000Z"
    },
    "created": [
      {
        "id": "a1",
        "scheduledAt": "2026-12-01T17:00:00.000Z",
        "seriesId": "sr1",
        "status": "PENDING"
      }
    ],
    "skipped": [
      {
        "scheduledAt": "2026-12-15T17:00:00.000Z",
        "reason": "CONFLICT",
        "conflictingAppointmentId": "a9"
      }
    ]
  }
  ```

  (Os itens de `created` são `Appointment` completos; o exemplo mostra só parte dos campos.)

- **Erros:** `400` validação; `403 UNAUTHORIZED`; `404 STUDENT_NOT_FOUND`;
  `409 APPOINTMENT_CONFLICT` (todas em conflito); `409 STUDENT_ARCHIVED`.
- **Regras:** RC-01 a RC-03, RC-07, RC-08, RC-09. As datas somam 7 ou 14 dias de calendário de
  São Paulo, mantendo a hora local.
- **Efeitos:** cada ocorrência é um `Appointment` comum com `seriesId`; lembretes e notificações
  as tratam uma a uma.

#### `GET /appointment/series/:id` (nova)

- **Quem:** Com acesso ao paciente.
- **200:** `AppointmentSeriesDetail` (RC-10).
- **Erros:** `403 UNAUTHORIZED`; `404 SERIES_NOT_FOUND`.

#### `PUT /appointment/series/:id` (nova) — "este e os seguintes"

- **Quem:** Com acesso ao paciente.
- **Corpo:** `{ fromAppointmentId: string }` e **ao menos um** de: `scheduledAt` (ISO; só a **hora**
  de São Paulo é usada, o dia da semana não muda), `durationMinutes`, `type`, `observation`.
- **200:** `SeriesResult` (`created` = ocorrências alteradas; `skipped` = as que conflitariam e
  ficaram como estavam).
- **Erros:** `400` validação (nenhum campo para mudar); `403 UNAUTHORIZED`; `404 SERIES_NOT_FOUND`,
  `404 APPOINTMENT_NOT_FOUND`; `409 APPOINTMENT_NOT_EDITABLE` (RC-11).
- **Regras:** RC-05. Passadas, concluídas e canceladas não mudam. "Só este" continua sendo
  `PUT /appointment/:id` (RC-04).

#### `POST /appointment/series/:id/cancel` (nova) — "cancelar este e os seguintes"

- **Quem:** Com acesso ao paciente.
- **Corpo:** `{ fromAppointmentId: string }`.
- **200:** `SeriesResult` com `series.endedAt` preenchido e `created` = as canceladas agora.
- **Erros:** `400`; `403 UNAUTHORIZED`; `404 SERIES_NOT_FOUND`, `404 APPOINTMENT_NOT_FOUND`.
- **Regras:** RC-06. Repetir é seguro (`created: []`).

### 5.8 Acréscimo em `Appointment`

`GET /appointment/`, `GET /appointment/:id` e as respostas de criação e edição trazem `seriesId?`
nas ocorrências de série. Editar "só este" mantém o `seriesId`.

### 5.9 PP-05: apagar campos com `null`

| Rota                      | Formato   | Campos apagáveis                                        | Como apagar               |
| ------------------------- | --------- | ------------------------------------------------------- | ------------------------- |
| `PUT /student/update/:id` | multipart | `guardianName`, `guardianPhone`, `guardianRelationship` | string vazia `""` (§8 Q8) |
| `PUT /plan/:id`           | JSON      | `nextReviewDate`, `professionalNotes`                   | `null`                    |
| `PUT /task/update`        | JSON      | `imageFile`, `audioFile`                                | `null`                    |

- Os nomes do plano são os do código do app e da API atual (`nextReviewDate`,
  `professionalNotes`), **não** os da especificação (`nextReviewAt`, `notes`).
- Depois de apagar, o campo **some** da resposta (§1.8).
- Apagar a última mídia de uma `multipleChoiceWithMedia` vem junto com `type: "multipleChoice"`
  (AT-17); `null` de mídia sem a troca de tipo, numa tarefa que ficaria sem mídia, dá o erro atual
  da regra de mídia.
- `null` em campo fora da tabela: `400` validação.

### 5.10 Critérios de aceite do backend — leva 3

| ID      | Critério                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------- |
| BK-3-01 | Todos os pacientes existentes vêm com `status: "ACTIVE"` depois da migração                                           |
| BK-3-02 | Arquivar com atendimento futuro e sem a opção dá `409 HAS_FUTURE_APPOINTMENTS` com `count`; com a opção, cancela      |
| BK-3-03 | Arquivado some de `GET /student/` e do overview padrão, aparece com `?status=ARCHIVED`, e `GET /student/:id` funciona |
| BK-3-04 | `POST /appointment/` e `POST /appointment/series` para arquivado dão `409 STUDENT_ARCHIVED`                           |
| BK-3-05 | Uma sessão finalizada sem evolução aparece como `EVOLUTION_PENDING` com `targetId` no overview na hora                |
| BK-3-06 | O status principal segue a ordem da PA-06 (revisão vencida vence PDI ativo)                                           |
| BK-3-07 | Série semanal de 8 com uma ocorrência em conflito cria 7 e lista 1 em `skipped`; todas em conflito dá `409`           |
| BK-3-08 | Todas as ocorrências ficam às 14:00 de São Paulo, quaisquer que sejam as datas                                        |
| BK-3-09 | Quinzenal com 14 ocorrências dá `400` (`field: "occurrences"`)                                                        |
| BK-3-10 | "Este e os seguintes" a partir da 4ª muda só a 4ª em diante, `PENDING`; a partir de uma cancelada, `409`              |
| BK-3-11 | Cancelar a partir da 4ª deixa as 3 primeiras como estavam e encerra a série; o detalhe traz as 8                      |
| BK-3-12 | `guardianName: ""` no multipart apaga o responsável; `nextReviewDate: null` e `imageFile: null` apagam                |

## 6. Leva 4 — Push e central de ajuda

Regras PU-01 a PU-07 (ESPECIFICACAO §7.3, G-67) e AJ-01 a AJ-04 (§8.2, G-69), mais PU-08 a PU-10.

### 6.1 Regras novas da leva 4

| ID    | Regra                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PU-08 | **Upsert pelo token:** o mesmo token registrado por outra conta passa para a nova conta (aparelho trocou de usuário sem logout)                                    |
| PU-09 | **Horário:** o push sai logo depois do job das 06:00 de São Paulo; nunca mais de um por educador no mesmo dia de São Paulo, mesmo que o job rode de novo           |
| PU-10 | **Texto:** título "Labirinto do Saber"; corpo com contagens por tipo ligado, por exemplo "3 atendimentos hoje · 2 evoluções pendentes". Sem nome, sem dado clínico |

### 6.2 `POST /notification/push-token` (nova)

- **Quem:** Educador.
- **Corpo:** `{ token: string; platform: "android" | "ios" }`. `token` no formato
  `ExponentPushToken[...]` ou `ExpoPushToken[...]`.
- **200:** `PushToken`.

  ```json
  {
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "android",
    "createdAt": "2026-12-01T13:00:00.000Z",
    "lastSeenAt": "2026-12-01T13:00:00.000Z"
  }
  ```

- **Erros:** `400` validação; `400 INVALID_PUSH_TOKEN`.
- **Regras:** PU-01, PU-08. Repetir atualiza `lastSeenAt`. O 6º token do educador apaga o mais
  antigo.

### 6.3 `DELETE /notification/push-token` (nova)

- **Quem:** Educador.
- **Corpo** (sim, `DELETE` com corpo JSON): `{ token: string }`.
- **204.** Token inexistente ou de outra conta: `204` sem efeito (idempotente).
- **Erros:** `400` validação.
- **Uso:** logout (PU-05). O app espera até 5 s e ignora erro.

### 6.4 `GET /notification/preferences` (nova)

- **Quem:** Educador.
- **200:** `NotificationPreferences` (padrões se nunca salvou).

  ```json
  {
    "pushEnabled": true,
    "kinds": {
      "APPOINTMENTS_TODAY": true,
      "EVOLUTION_PENDING": true,
      "PLAN_REVIEW_DUE": true,
      "SCALE_DRAFT_STALE": true
    }
  }
  ```

### 6.5 `PUT /notification/preferences` (nova)

- **Quem:** Educador.
- **Corpo** parcial: `{ pushEnabled?: boolean; kinds?: Partial<Record<NotificationKind, boolean>> }`;
  as chaves de `kinds` que não vierem não mudam. Corpo vazio ou `kind` desconhecido: `400`.
- **200:** `NotificationPreferences` completo.
- **Regras:** PU-06. As preferências desligam só o **push**: a lista do sino continua com tudo.

### 6.6 Job de envio (sem rota)

- Roda depois da geração diária das notificações (06:00 de São Paulo).
- Para cada educador com `pushEnabled` e ao menos um token: soma as notificações **novas do dia**
  dos `kinds` ligados; se houver, envia **um** push para cada token pela API de push da Expo.
- Mensagem: `title` e `body` da PU-10; `data` = `PushData` (§2.6); canal Android `"lembretes"`
  (`channelId`), o mesmo que o app cria.
- Recibos: token com `DeviceNotRegistered` é apagado (PU-05).
- Credenciais FCM/APNs ficam no projeto EAS; o backend guarda só o token de acesso da Expo como
  segredo (PU-07). Nada no repositório.

### 6.7 `GET /help/tutorials` (nova)

- **Quem:** Educador.
- **200:** `HelpTutorial[]` por `order` asc.

  ```json
  [
    {
      "id": "t1",
      "order": 1,
      "title": "Conheça o Labirinto do Saber",
      "description": "Um tour pelas abas e pelo fluxo de uma sessão.",
      "durationSeconds": 240,
      "featured": true,
      "videoUrl": "https://<cdn>/ajuda/tour.mp4",
      "thumbnailUrl": "https://<cdn>/ajuda/tour.jpg",
      "steps": ["Abra a aba Início.", "Toque em Iniciar sessão."]
    }
  ]
  ```

- **Erros:** só `401`.
- **Regras:** AJ-01 a AJ-04. Lista vazia é válida (o app mostra "ainda não foram publicados").

### 6.8 Critérios de aceite do backend — leva 4

| ID      | Critério                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------- |
| BK-4-01 | Registrar o mesmo token duas vezes não duplica; registrar por outra conta move o token             |
| BK-4-02 | `DELETE /notification/push-token` com token inexistente dá `204`                                   |
| BK-4-03 | Rodar o job duas vezes no mesmo dia não manda dois pushes                                          |
| BK-4-04 | O texto do push não contém nome de paciente                                                        |
| BK-4-05 | Com `pushEnabled: false`, nada é enviado e a lista do app continua recebendo as notificações       |
| BK-4-06 | Com `kinds.EVOLUTION_PENDING: false`, o push não conta evoluções; a lista continua com elas        |
| BK-4-07 | Um token com `DeviceNotRegistered` no recibo é apagado                                             |
| BK-4-08 | `PUT /notification/preferences` parcial muda só as chaves enviadas                                 |
| BK-4-09 | `GET /help/tutorials` vem por `order`, com no máximo um `featured`; tutorial sem vídeo tem `steps` |

## 7. Leva 5 — Ajustes pequenos

### 7.1 PP-06 / G-71: nome na audiência da escola

- **Rota:** `POST /report/` (geração) e as leituras do relatório (`GET /report/:id`).
- **Regra:** na audiência `SCHOOL`, `patient.displayName` = primeiro nome + inicial do último
  sobrenome com ponto ("Ana Souza Lima" → "Ana L."); nome de uma palavra só fica como está. Nas
  outras audiências, o nome completo, como hoje.
- Relatórios já gerados não mudam (conteúdo congelado).
- **BK-5-01:** relatório `SCHOOL` de "Paciente Teste Silva" traz `displayName: "Paciente S."`.

### 7.2 PP-07 / G-72: uma notificação por pendência

- **Regra:** `EVOLUTION_PENDING`, `PLAN_REVIEW_DUE` e `SCALE_DRAFT_STALE` geram **uma**
  notificação por pendência (`PendingNotificationKey`, §2.8), sem repetir a cada dia enquanto
  ela existir. Resolvida e reaberta (por exemplo, plano revisto que vence de novo), gera outra.
  `APPOINTMENTS_TODAY` continua diária.
- O formato de `AppNotification` e as rotas não mudam. O push (leva 4) conta só as novas do dia.
- **BK-5-02:** a mesma sessão sem evolução por 3 dias gera uma única notificação.
- **BK-5-03:** `APPOINTMENTS_TODAY` continua aparecendo em cada dia com atendimento.

### 7.3 PP-08: `timeToAnswer` antigo

- **Decisão do app (o backend confirma, §8 Q16):** migrar as respostas anteriores a 2026-10-09
  (São Paulo) para milissegundos (×1000), com backup, sem campo novo no contrato.
- **BK-5-04:** o relatório de uma sessão antiga mostra médias em ms, coerentes com as novas.

### 7.4 PP-10: Swagger completo

- Toda rota deste documento em `/api-docs/`, com exemplos e erros ([§9.2](#92-swagger)).
- **BK-5-05:** cada rota das tabelas do §11 aparece no Swagger com os códigos de erro do §2.9.

### 7.5 PP-11: 404 em vez de 500

- `TASK_NOT_FOUND`, `TASK_GROUP_NOT_FOUND` e `TASK_NOTEBOOK_NOT_FOUND` respondem `404` em todas
  as rotas (hoje `500` em update e delete). Pode sair junto da leva 1 (recomendado), já que as
  rotas de atividade mudam nela.
- **BK-5-06:** `DELETE /task/delete/<uuid inexistente>` dá `404 TASK_NOT_FOUND`.

## 8. Perguntas abertas e decisões do contrato

Cada pergunta levantada nos cards, no PEDIDOS-BACKEND §2 e na ESPECIFICACAO §12 tem uma decisão
abaixo. **Status "App"** = decisão do app; o backend confirma ou propõe outra forma na API-06.
**Status "Usuário"** = já resolvida pelo usuário nos gates.

| #   | Origem                 | Pergunta                                                                                                                                      | Decisão do contrato                                                                                                                                   | Status                            |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Q1  | API-06, API-07         | `Task` traz sempre `format`, `source`, `skills`, `tone`?                                                                                      | Sim, sempre (`skills: []` quando vazio). `theme` e `content` podem faltar (§2.1)                                                                      | App                               |
| Q2  | ATV-11, PEDIDOS 5      | Formato de `content`/`skills` no multipart; resposta do create                                                                                | Strings JSON no multipart de `POST /task/create`; resposta `201 Task`. O app aceita `201` vazio como reserva                                          | App                               |
| Q3  | API-06, ATV-11         | `field` do `INVALID_CONTENT`: caminho completo ou primeiro nível                                                                              | Caminho completo (`content.pairs.2.word`); o app aceita os dois                                                                                       | App                               |
| Q4  | API-06, EVO-03         | A listagem de sessões traz `activityResults` (RS-07)?                                                                                         | Sim, na leva 1; o app usa na retomada da sessão                                                                                                       | App                               |
| Q5  | API-06, ATV-04a        | Semântica de `correct`                                                                                                                        | "Completou sem nenhum erro", calculado no app; o servidor grava e só exige `completed` quando `correct` (RS-09)                                       | App                               |
| Q6  | EVO-03, mocks          | O `409 RESULT_ALREADY_EXISTS` traz `resultId`?                                                                                                | Sim, no corpo; o app não depende dele                                                                                                                 | App                               |
| Q7  | FEC-06, API-06         | Nomes dos campos do plano no PP-05                                                                                                            | `nextReviewDate` e `professionalNotes` (os da API atual)                                                                                              | App                               |
| Q8  | FEC-06 §6.1, API-06    | Como o "apagar" chega no multipart do paciente                                                                                                | String vazia `""` apaga `guardianName`, `guardianPhone`, `guardianRelationship`                                                                       | App                               |
| Q9  | FEC-06 (regra 5)       | Remover a mídia troca o tipo da múltipla escolha?                                                                                             | Sim: troca entre as duas múltiplas escolhas é permitida (AT-17); fora disso, `TYPE_CHANGE_NOT_ALLOWED`                                                | App                               |
| Q10 | EQP-01                 | `GET /clinic/` sem equipe                                                                                                                     | `404 NOT_IN_CLINIC` (o app converte em estado vazio)                                                                                                  | App                               |
| Q11 | EQP-02                 | `GET /educator/me` traz `clinic`?                                                                                                             | Sim, obrigatório na leva 2; é a fonte do papel no app                                                                                                 | App                               |
| Q12 | EQP-02                 | O ADMIN pode remover outro ADMIN?                                                                                                             | Sim, salvo o último (EQ-18)                                                                                                                           | App                               |
| Q13 | EQP-03                 | `register` com `inviteCode` sai na leva 2?                                                                                                    | Sim, na mesma leva das rotas de convite                                                                                                               | App                               |
| Q14 | EQP-03                 | Confirmação de e-mail no cadastro                                                                                                             | Não há; `sign-in` funciona logo depois do `register`                                                                                                  | App                               |
| Q15 | EQP-04                 | A colega lê `GET /student/:id/shares`?                                                                                                        | Sim (EQ-19); só o dono cria e desfaz. Se vier `403`, o app mostra só o dono                                                                           | App                               |
| Q16 | PEDIDOS 6, ESPEC PP-08 | Migrar `timeToAnswer` antigo ou marcar a sessão?                                                                                              | Migrar ×1000 com backup, sem campo novo                                                                                                               | App                               |
| Q17 | EQP-04                 | Relatório da colega aparece no histórico do dono?                                                                                             | Sim: as listas por paciente trazem todos os autores, com `authorName` (§4.18)                                                                         | App                               |
| Q18 | EQP-04                 | Notificações e agenda da colega                                                                                                               | EQ-20; `GET /appointment/` continua por educador                                                                                                      | App                               |
| Q19 | PAC-10                 | `targetId` de `SCALE_DRAFT` e `PLAN_REVIEW_DUE`                                                                                               | Presente quando `count === 1` (PA-09)                                                                                                                 | App                               |
| Q20 | PAC-10                 | "Pacientes ativos" inclui os compartilhados?                                                                                                  | Sim: o overview cobre os mesmos pacientes de `GET /student/` (PA-08)                                                                                  | App                               |
| Q21 | PAC-11                 | Corpo do `409 HAS_FUTURE_APPOINTMENTS`                                                                                                        | `{ "message": "HAS_FUTURE_APPOINTMENTS", "count": n }` (PA-10)                                                                                        | App                               |
| Q22 | PAC-11                 | `GET /student/:id` (PP-09) sai na leva 3?                                                                                                     | Sim                                                                                                                                                   | App                               |
| Q23 | AGE-06                 | 26 ocorrências e 6 meses não cabem juntos na quinzenal                                                                                        | Limite de 183 dias; quinzenal até 13 (RC-09)                                                                                                          | App                               |
| Q24 | AGE-06                 | O detalhe da série traz as canceladas?                                                                                                        | Sim, todas as ocorrências criadas (RC-10)                                                                                                             | App                               |
| Q25 | NOT-02                 | Mesmo aparelho, outra conta                                                                                                                   | Upsert pelo token: o token passa para a nova conta (PU-08)                                                                                            | App                               |
| Q26 | NOT-02                 | `DELETE /notification/push-token` com corpo                                                                                                   | Sim, corpo `{ token }`; idempotente                                                                                                                   | App                               |
| Q27 | PEDIDOS 1              | O que o `POST /appointment/notify` envia hoje?                                                                                                | O app não depende da resposta: não muda o texto sobre lembretes nesta entrega. WhatsApp fica fora                                                     | App                               |
| Q28 | PEDIDOS 2              | A regra de acesso está num ponto único?                                                                                                       | Detalhe interno do backend; o contrato exige o comportamento e um teste por domínio (§4.18)                                                           | App                               |
| Q29 | PEDIDOS 3, ESPEC §12.8 | Quem produz atividades prontas e vídeos                                                                                                       | O backend publica o seed mínimo fictício do §9.1; o conteúdo pedagógico real troca os dados sem mudar o contrato. Tutoriais podem sair só com `steps` | App                               |
| Q30 | PEDIDOS 4, BLD-01      | Conta Expo (EAS) e Firebase                                                                                                                   | Do usuário (dono do projeto); o backend recebe só o token de acesso da Expo como segredo                                                              | App                               |
| Q31 | PEDIDOS 5              | `201 Task` no create quebra outro cliente?                                                                                                    | O app é o único cliente conhecido; se quebrar algo, o backend avisa e publica `POST /task/` com `201 Task`                                            | App                               |
| Q32 | ESPEC §12.1–§12.7      | Compartilhamento explícito, saída leva pacientes, convite por código, jogo fora do acerto, ocorrência pulada, arquivar cancela, push agrupado | Como propostos                                                                                                                                        | Usuário (G-62 a G-70, 2026-11-25) |
| Q33 | GATES G-71, G-72       | Nome na escola e repetição das notificações                                                                                                   | "Ana S." na `SCHOOL`; uma notificação por pendência (§7.1, §7.2)                                                                                      | Usuário                           |
| Q34 | ATV-09                 | Recomendação de paciente arquivado                                                                                                            | `200 []` (PA-03)                                                                                                                                      | App                               |
| Q35 | ATV-09, AT-06          | Biblioteca sem seed                                                                                                                           | `200` com lista vazia; o app mostra "Ainda não há atividades prontas."                                                                                | App                               |

## 9. Seeds e Swagger

### 9.1 Seeds

Todos versionados no repositório do backend, idempotentes (rodar de novo não duplica) e **sem
dado real de criança**.

| Seed               | Leva | Conteúdo mínimo                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Habilidades        | 1    | As 6 do app: `PHONOLOGICAL_AWARENESS` (Consciência fonológica), `LETTER_RECOGNITION` (Reconhecimento de letras), `VOCABULARY` (Vocabulário), `TEXT_COMPREHENSION` (Compreensão de texto), `VISUAL_MEMORY` (Memória visual), `FINE_MOTOR` (Coordenação motora fina), cada uma com `learningTopics` em pt-BR minúsculo ("leitura", "sons das letras", "alfabeto", "vocabulário", "compreensão", "atenção", "memória", "escrita", "coordenação motora") |
| Atividades prontas | 1    | `source: LIBRARY`: no mínimo 3 `wordBuilder` (por exemplo BOLA, PÃO, GATO), 3 `colorMatch`, 3 `memoryGame` (2, 3 e 4 cartas) e 5 `printable` (cobrindo `LIST`, `GRID` e `SEQUENCE`, um com imagem), todas com `skills`, `theme` e `tone`; mídias no mesmo armazenamento do `upload-media`                                                                                                                                                            |
| Tutoriais da ajuda | 4    | Ao menos 4 tutoriais com `order` 1–4, um `featured` ("Conheça o Labirinto do Saber"); sem vídeo pronto, cada um com `steps`                                                                                                                                                                                                                                                                                                                          |
| Contas de teste    | 2    | Fictícias, só fora de produção ou com e-mail de domínio reservado (`@example.com`): uma `ADMIN` e uma `PROFESSIONAL` na "Clínica Teste", uma sem clínica; um paciente fictício compartilhado ("Paciente Teste Compartilhado"). Senhas fora do repositório                                                                                                                                                                                            |
| Preferências       | 4    | Nenhum seed: o padrão é calculado na leitura                                                                                                                                                                                                                                                                                                                                                                                                         |

A escala real (G-55) continua fora: é dado do responsável clínico, sem mudança de contrato.

### 9.2 Swagger

O backend publica em `/api-docs/`, a cada leva:

1. Todas as rotas do §11 com método, caminho, autenticação (Pública ou Bearer) e papel exigido.
2. Corpo com tipos, limites e exemplos; para multipart, os campos que são string JSON.
3. Resposta de sucesso com status e exemplo (os do §3 a §6 servem).
4. Todos os erros do §2.9 que a rota pode devolver, com o corpo (inclusive `count` e `resultId`).
5. Os schemas do §2 (`Task`, `TaskContent`, `ClinicView`, `PatientOverview`, `SeriesResult`,
   `NotificationPreferences`, `HelpTutorial` e os demais).
6. Uma nota de "mudou nesta leva" nas rotas alteradas.

## 10. Homologação por leva

Como o app confere cada leva (API-06): Swagger, chamada real com conta de teste fictícia e a tela
correspondente com `EXPO_PUBLIC_USE_MOCKS=false`. A evidência vai para o TRACKING.

### Leva 1

| Rota                                          | Cenário                                                                    | Card                     |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------ |
| `GET /task/catalog`                           | Filtro "Imprimíveis", busca "pao", rolar até o fim da lista                | ATV-09                   |
| `GET /task/skills`                            | Filtro por habilidade e seletor do editor                                  | ATV-09, ATV-11           |
| `GET /task/recommended`                       | Banco aberto a partir de um atendimento de hoje: "Recomendado para {nome}" | ATV-09                   |
| `POST /task/:id/duplicate`                    | "Duplicar para editar" numa atividade pronta; a cópia abre no editor       | ATV-09                   |
| `GET /task/:id`                               | Jogar BOLA, um colorMatch e um memoryGame; abrir um imprimível             | ATV-04a, ATV-04b, ATV-05 |
| `POST /task/create`, `PUT /task/update`       | Criar e editar cada tipo novo; provocar `INVALID_CONTENT`                  | ATV-11                   |
| `POST /task-notebook-session/activity-result` | Jogar durante a sessão; repetir o envio; encerrar e tentar de novo         | EVO-03                   |
| Relatório, sessões, contexto                  | "Atividades da sessão" na Evolução e "Atividades jogadas" no relatório     | EVO-03                   |

### Leva 2

| Rota                                                    | Cenário                                                              | Card   |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| `POST /clinic/`, `GET /clinic/`, `POST /clinic/invites` | Criar equipe, convidar e compartilhar o código                       | EQP-01 |
| `PUT /clinic/`, convites, membros                       | Renomear, revogar convite, mudar papel, remover, sair; último ADMIN  | EQP-02 |
| `GET .../preview/:code`, `register`, `accept`           | "Tenho um convite" sem conta; aceitar logado; código inválido        | EQP-03 |
| `GET /student/`, `/student/:id/shares`                  | Compartilhar paciente; a colega vê e registra evolução; desfazer     | EQP-04 |
| Regra "com acesso"                                      | QA-08: dois educadores, um paciente compartilhado, todos os domínios | QA-08  |

### Leva 3

| Rota                                          | Cenário                                                                    | Card   |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| `GET /student/overview`                       | Cartões com status; filtro "Pendências"; tocar numa pendência              | PAC-10 |
| `PUT /student/:id/status`, `GET /student/:id` | Arquivar com atendimento futuro (confirmar), ver arquivados, reativar      | PAC-11 |
| `POST /appointment/series` e afins            | Série semanal com conflito; "este e os seguintes"; cancelar a partir da 4ª | AGE-06 |
| PP-05                                         | Remover responsável, limpar revisão e notas do plano, remover mídia        | FEC-06 |

### Leva 4

| Rota                                     | Cenário                                                               | Card          |
| ---------------------------------------- | --------------------------------------------------------------------- | ------------- |
| `POST`/`DELETE /notification/push-token` | Development build: permitir push, logout                              | NOT-02        |
| `GET`/`PUT /notification/preferences`    | Desligar um tipo e o push; conferir que o sino continua               | NOT-02        |
| Job de envio                             | Receber um push no aparelho (QA-04); tocar e abrir o destino          | NOT-02, QA-04 |
| `GET /help/tutorials`                    | Central de ajuda com destaque; tocar um vídeo; tutorial só com passos | AJD-01        |

### Leva 5

| Ponto | Cenário                                                        | Onde no app            |
| ----- | -------------------------------------------------------------- | ---------------------- |
| PP-06 | Gerar relatório para a escola e conferir o nome                | Relatórios (Entrega 4) |
| PP-07 | Deixar uma evolução pendente por dois dias: uma só notificação | Sino                   |
| PP-08 | Abrir o relatório de uma sessão antiga                         | Relatório da sessão    |
| PP-11 | Abrir uma atividade excluída                                   | Detalhe da atividade   |

## 11. Rota → telas e cards do app

| Rota                                                                | Leva | Telas                                   | Cards                            |
| ------------------------------------------------------------------- | ---- | --------------------------------------- | -------------------------------- |
| `GET /task/catalog`                                                 | 1    | Banco de atividades                     | ATV-09, API-07                   |
| `GET /task/skills`                                                  | 1    | Banco (filtro), editor de atividade     | ATV-09, ATV-11, API-07           |
| `GET /task/recommended`                                             | 1    | Banco ("Recomendado para")              | ATV-09, API-07                   |
| `GET /task/:id`                                                     | 1    | Detalhe, jogos, imprimível              | ATV-04a, ATV-04b, ATV-05, ATV-09 |
| `GET /task/`                                                        | 1    | Seleção de conteúdo da sessão           | EVO-03                           |
| `POST /task/create`                                                 | 1    | Editor de atividade                     | ATV-11                           |
| `PUT /task/update`                                                  | 1, 3 | Editor de atividade, remover mídia      | ATV-11, FEC-06                   |
| `POST /task/:id/duplicate`                                          | 1    | Detalhe de atividade pronta             | ATV-09                           |
| `DELETE /task/delete/:id`                                           | 1    | Detalhe de atividade                    | ATV-09                           |
| `POST`/`PUT /task-notebook/*`, `/task-group/*`                      | 1    | Cadernos e grupos (sem imprimível)      | ATV-11                           |
| `POST /task-notebook-session/activity-result`                       | 1    | Player da sessão                        | EVO-03                           |
| `GET /task-notebook-session/report/:sessionId`                      | 1    | Relatório da sessão                     | EVO-03                           |
| `GET /task-notebook-session/student/:studentId`                     | 1    | Retomada da sessão                      | EVO-03                           |
| `GET /session-evolution/context/:sessionId`                         | 1    | Registrar evolução                      | EVO-03                           |
| `GET /educator/me`                                                  | 2    | Perfil, Recursos, permissões            | EQP-02                           |
| `POST /clinic/`, `GET /clinic/`                                     | 2    | Equipe e convites                       | EQP-01                           |
| `POST /clinic/invites`                                              | 2    | Equipe ("Compartilhar link de convite") | EQP-01                           |
| `PUT /clinic/`, `GET /clinic/invites`, `DELETE /clinic/invites/:id` | 2    | Gestão da equipe                        | EQP-02                           |
| `PUT`/`DELETE /clinic/members/:educatorId`                          | 2    | Gestão da equipe, sair                  | EQP-02                           |
| `GET /clinic/invites/preview/:code`                                 | 2    | "Tenho um convite"                      | EQP-03                           |
| `POST /clinic/invites/accept`                                       | 2    | Perfil → entrar na equipe               | EQP-03                           |
| `POST /educator/register`                                           | 2    | Cadastro pelo convite                   | EQP-03                           |
| `GET /student/`                                                     | 2, 3 | Lista de pacientes, ficha, Agenda       | EQP-04, PAC-10, PAC-11           |
| `GET`/`POST`/`DELETE /student/:id/shares*`                          | 2    | Ficha ("Quem acompanha")                | EQP-04                           |
| `GET /student/overview`                                             | 3    | Lista de pacientes, ficha (Pendências)  | PAC-10                           |
| `GET /student/:id`                                                  | 3    | Ficha do paciente                       | PAC-11                           |
| `PUT /student/:id/status`                                           | 3    | Ficha (Arquivar / Reativar)             | PAC-11                           |
| `PUT /student/update/:id` (`""` apaga)                              | 3    | Editar paciente                         | FEC-06                           |
| `PUT /plan/:id` (`null` apaga)                                      | 3    | Detalhe do plano                        | FEC-06                           |
| `POST /appointment/series`                                          | 3    | Novo atendimento ("Repetir")            | AGE-06                           |
| `GET /appointment/series/:id`                                       | 3    | Detalhe do atendimento                  | AGE-06                           |
| `PUT /appointment/series/:id`                                       | 3    | Editar "este e os seguintes"            | AGE-06                           |
| `POST /appointment/series/:id/cancel`                               | 3    | Cancelar "este e os seguintes"          | AGE-06                           |
| `GET /appointment/` (com `seriesId`)                                | 3    | Agenda semanal e mensal                 | AGE-05, AGE-06                   |
| `POST /notification/push-token`                                     | 4    | Pedido de permissão, login              | NOT-02                           |
| `DELETE /notification/push-token`                                   | 4    | Logout                                  | NOT-02                           |
| `GET`/`PUT /notification/preferences`                               | 4    | Preferências de notificação             | NOT-02                           |
| `GET /help/tutorials`                                               | 4    | Central de ajuda                        | AJD-01                           |
| `POST /report/` (PP-06)                                             | 5    | Relatórios                              | — (backend)                      |
| Geração das notificações (PP-07)                                    | 5    | Sino                                    | — (backend)                      |

A AGE-05 (visão mensal) não precisa de rota nova: usa `GET /appointment/`. A BLD-01 não usa rota.

## 12. Fora do contrato

Para o backend não antecipar (ESPECIFICACAO §10): integração com **WhatsApp** (decisão do
usuário em 2026-11-24; o app mantém só o botão `wa.me`), IA para gerar os jogos, escalas criadas
pelo educador (G-55), gestão financeira ou de cobrança, relatórios da clínica por equipe, acesso
do `ADMIN` a todos os pacientes (G-62), convite por e-mail ou link mágico (G-63) e PDF do
imprimível no servidor (G-66: o app gera o PDF).

## 13. Histórico

- 2026-11-26: primeira versão. Consolida a ESPECIFICACAO-BACKEND, os 25 cards da Entrega 5, os
  gates G-61 a G-72 (resolvidos) e o código da leva 1 na `main` (#189 a #192). Define o formato
  de erro real `{ message }` como contrato, as regras novas AT-13 a AT-17, RS-09 a RS-11, EQ-16 a
  EQ-20, PA-08 a PA-10, RC-09 a RC-11 e PU-08 a PU-10, e as decisões Q1 a Q35.
