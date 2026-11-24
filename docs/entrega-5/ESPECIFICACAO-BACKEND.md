# Entrega 5 — Especificação para o backend

> O que o app precisa que o backend construa na Entrega 5: entidades, regras de negócio, rotas,
> erros e critérios de aceite. Escrito em 2026-11-24 pelo planejamento do app, a partir do
> [BACKLOG da Entrega 2](../entrega-2/BACKLOG.md) (mapa completo do produto), do que ficou fora da
> Entrega 4 ([ENTREGA-4 §7](../entrega-4/ENTREGA-4.md#7-o-que-fica-fora-e-próximos-passos)) e do
> contrato atual ([PROJECT.md](../PROJECT.md) e [BACKEND-ENTREGUE da Entrega 4](../entrega-4/BACKEND-ENTREGUE.md)).
>
> **Status:** proposta do app. Os nomes de rotas e campos são **sugestões** que seguem as
> convenções da API (§1); o backend pode mudá-los. Nada disto existe hoje. O contrato final é
> registrado no [PROJECT.md](../PROJECT.md) pela tarefa API-06 ([BACKLOG](BACKLOG.md)), e o app
> só implementa o que estiver lá. O resumo e a mensagem para enviar estão em
> [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md). As decisões de produto que dependem do usuário estão no
> [ROADMAP §5](ROADMAP.md#5-decisões-propostas) (G-61 a G-72, todas **propostas**).

## 0. Resumo

A Entrega 5 cobre o que o design propõe e ainda não tem API: o **banco de atividades completo**
(jogos e imprimíveis), a **equipe** da clínica, o **status dos pacientes**, a **agenda
recorrente**, o **push** e a **central de ajuda**.

| Prio.  | Item                                                                                      | Tamanho | Bloqueia no app                                                | Seção |
| ------ | ----------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- | ----- |
| **P1** | **Banco de atividades:** tipos jogáveis, imprimível, habilidade, biblioteca, recomendação | G       | ATV-09, ATV-04a, ATV-04b, ATV-11, ATV-05                       | §2    |
| **P1** | **Resultado de atividade** jogada na sessão                                               | P       | EVO-03                                                         | §3    |
| **P1** | **Equipe:** clínica, papéis, convites e paciente compartilhado                            | G       | EQP-01 a EQP-04                                                | §4    |
| P2     | **Pacientes:** status, pendências e arquivamento                                          | M       | PAC-10, PAC-11                                                 | §5    |
| P2     | **Agenda:** atendimentos recorrentes                                                      | M       | AGE-06                                                         | §6    |
| P2     | **Push** das notificações e preferências                                                  | M       | NOT-02                                                         | §7    |
| P3     | **Central de ajuda:** tutoriais em vídeo                                                  | P       | AJD-01                                                         | §8    |
| P3     | Pequenos pedidos e pontos em aberto da Entrega 4                                          | P       | FEC-06 (limpar campos); o resto melhora telas que já funcionam | §9    |

- **P1:** sem isso, os blocos de atividades e de equipe não começam.
- **P2:** cada item destrava uma ou duas telas; sem ele, a tela continua como hoje.
- **P3:** pode vir por último.

Tamanho é uma estimativa relativa do app (P, M ou G), só para planejar as levas (§11).

## 1. Convenções (as mesmas da API atual)

- Express na Vercel, sem prefixo `/api` nem versão; JSON, exceto uploads (`multipart/form-data`).
- **Bearer JWT** em todas as rotas novas, salvo as marcadas como públicas. O educador vem
  sempre **do token**, nunca do corpo.
- **Acesso:** hoje só o educador **dono do paciente** (`Student.educatorId`) lê ou altera os
  dados clínicos. A Entrega 5 acrescenta o **educador com quem o paciente foi compartilhado**
  (§4.6). Recurso fora do alcance: `403 { message: "UNAUTHORIZED" }`. Inexistente: `404` com
  código próprio, **nunca 500**. Um id que não é UUID válido também vira `404`.
- **Erros:** regra de negócio `{ message: "CODIGO" }` (MAIÚSCULAS); validação Zod
  `{ message, errors: [{ message, field }] }`.
- **Datas:** com hora em ISO 8601 UTC; sem hora em `AAAA-MM-DD`, com "hoje" no fuso
  `America/Sao_Paulo`.
- **Campos opcionais** vêm **ausentes** do JSON quando não definidos (como nos planos). Nas
  rotas novas, `null` no corpo significa "apagar o valor" (§9, PP-05).
- **Paginação nova:** por cursor, como nas notificações: `{ items, nextCursor? }`.
- **Dados de crianças:** nada de conteúdo clínico em logs; nada de nome de paciente em texto que
  apareça fora do app (push, §7.3).
- **IA:** nenhuma rota nova de IA nesta entrega.
- **Swagger:** toda rota nova aparece em `/api-docs/` com corpo, resposta e erros.

## 2. Banco de atividades — P1

### 2.1 Para que serve

O design (`ActivitiesScreen`) mostra um **banco pedagógico**: busca "por habilidade ou tema",
filtros "Todas / Interativas / Imprimíveis", o destaque "Recomendado para {paciente}" com
"Iniciar atividade", "Atividades prontas" e miniaturas coloridas. Os jogos do design são
**Forme a palavra** (`.word-slots`, `.letter-pool`), **Associe as cores**, **Leia e responda**
(o quiz que já existe) e **Memória visual**; o imprimível é "Complete a sequência".

Hoje a API só tem `TaskType = "multipleChoice" | "multipleChoiceWithMedia"`, sem formato,
habilidade, biblioteca pronta nem recomendação. O app já tem um **registro de tipos** no motor
de atividades (`type → componente`): um tipo novo entra sem mudar o motor.

### 2.2 Entidades

```ts
type TaskType =
  | "multipleChoice" // existente: "Leia e responda"
  | "multipleChoiceWithMedia" // existente
  | "wordBuilder" // novo: "Forme a palavra"
  | "colorMatch" // novo: "Associe as cores"
  | "memoryGame" // novo: "Memória visual"
  | "printable"; // novo: atividade imprimível

type TaskFormat = "INTERACTIVE" | "PRINTABLE"; // derivado do tipo (AT-03)
type TaskSource = "EDUCATOR" | "LIBRARY"; // LIBRARY = atividade pronta da plataforma (AT-06)
type TaskTone = "mint" | "peach" | "lavender" | "yellow"; // cor da miniatura

interface Task {
  // campos atuais: id, category, type, prompt, alternatives, createdAt, imageFile?, audioFile?
  format: TaskFormat;
  source: TaskSource;
  skills: string[]; // 0–5 códigos do catálogo (§2.4, GET /task/skills)
  theme?: string; // até 60 ("Animais", "Sílabas com R")
  tone: TaskTone; // escolhido pelo servidor se não vier
  content?: TaskContent; // obrigatório nos tipos novos; ausente nos de múltipla escolha
}

type TaskContent =
  WordBuilderContent | ColorMatchContent | MemoryGameContent | PrintableContent;

interface WordBuilderContent {
  kind: "wordBuilder";
  word: string; // 2–12 letras, maiúsculas, com acento permitido ("BOLA", "PÃO")
  distractors?: string[]; // 0–6 letras extras no banco de letras
  hintImageUrl?: string; // de POST /task/upload-media
  hintAudioUrl?: string; // de POST /task/upload-media
}

interface ColorMatchContent {
  kind: "colorMatch";
  pairs: { id: string; word: string; colorHex: string }[]; // 2–6 pares; word 1–20; "#RRGGBB"
}

interface MemoryGameContent {
  kind: "memoryGame";
  cards: { id: string; label?: string; imageUrl?: string }[]; // 2–8 cartas; cada uma vira um par
}

interface PrintableContent {
  kind: "printable";
  title: string; // 1–80 ("Complete a sequência")
  instructions: string; // 1–500
  layout: "LIST" | "GRID" | "SEQUENCE";
  items: {
    id: string;
    text?: string; // até 200
    imageUrl?: string;
    answerLines?: number; // 0–5 linhas para a criança escrever
  }[]; // 1–20 itens, cada um com text ou imageUrl
}

interface TaskSkill {
  code: string; // "PHONOLOGICAL_AWARENESS"
  label: string; // "Consciência fonológica"
  learningTopics: string[]; // dificuldades do paciente ligadas a esta habilidade (AT-08)
}

interface TaskSummary {
  id: string;
  type: TaskType;
  format: TaskFormat;
  source: TaskSource;
  category: TaskCategory;
  title: string; // prompt (múltipla escolha) ou content.title / palavra / "Associe as cores"
  skills: { code: string; label: string }[];
  theme?: string;
  tone: TaskTone;
  thumbnailUrl?: string; // imagem do conteúdo, se houver
}

interface RecommendedTask extends TaskSummary {
  reason: string; // até 120: "Consciência fonológica · dificuldade mapeada"
}
```

`prompt` continua obrigatório em todos os tipos: nos tipos novos é a **instrução** mostrada à
criança ("Forme a palavra da figura").

### 2.3 Regras de negócio

| ID    | Regra                                                                                                                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AT-01 | **Tipos.** `TaskType` ganha `wordBuilder`, `colorMatch`, `memoryGame` e `printable`. Os tipos atuais não mudam                                                                                                                   |
| AT-02 | **Conteúdo.** Nos tipos novos, `content` é obrigatório, com `content.kind` igual ao `type`, e segue os limites do §2.2. Inválido: `400 INVALID_CONTENT` com `errors[].field` (por exemplo `content.word`)                        |
| AT-03 | **Formato derivado.** `printable` é `PRINTABLE`; todos os outros são `INTERACTIVE`. O cliente não envia `format`                                                                                                                 |
| AT-04 | **Alternativas.** Só os tipos de múltipla escolha têm `alternatives`. Nos tipos novos, enviar alternativas é `400 ALTERNATIVES_NOT_ALLOWED`                                                                                      |
| AT-05 | **Mídia.** URLs de `content` vêm de `POST /task/upload-media` (do mesmo serviço de armazenamento). URL externa: `400 INVALID_MEDIA_URL`. `wordBuilder` aceita imagem e áudio de dica; `memoryGame` e `printable`, imagens        |
| AT-06 | **Biblioteca.** O backend publica por seed versionado as **atividades prontas** (`source: LIBRARY`): no mínimo 3 de cada tipo jogável novo e 5 imprimíveis, sem dado de criança. Todo educador lê; ninguém edita ou exclui       |
| AT-07 | **Somente leitura.** `PUT /task/update` ou `DELETE /task/delete/:id` numa atividade da biblioteca: `403 LIBRARY_TASK_READ_ONLY`. `POST /task/:id/duplicate` cria uma cópia `EDUCATOR`, editável, do educador do token            |
| AT-08 | **Recomendação por regra, sem IA.** Para o paciente: as habilidades ligadas às `learningTopics` dele (pelo catálogo) e à categoria de menor acerto nas últimas 5 sessões; até 6 atividades, sem repetir as das 3 últimas sessões |
| AT-09 | **Busca.** `search` ignora acento e maiúscula e procura em `prompt`, `theme`, título do conteúdo e rótulo da habilidade                                                                                                          |
| AT-10 | **Cadernos e grupos** aceitam atividades da biblioteca e dos tipos novos. Imprimível **não** entra em caderno, grupo nem sessão: `400 PRINTABLE_NOT_PLAYABLE`                                                                    |
| AT-11 | **Compatibilidade.** `GET /task/` continua devolvendo `Task[]` só do educador, agora com os campos novos. Versões antigas do app mostram o tipo novo como "indisponível" (o motor já faz isso)                                   |
| AT-12 | **Habilidades.** Catálogo fixo por seed (`GET /task/skills`); `skills` com código fora do catálogo: `400 INVALID_SKILL`                                                                                                          |

### 2.4 Rotas sugeridas

Todas com Bearer.

| Método e rota              | Uso no app                                               | Corpo / query                                                                                                                                                                       | Resposta                                    | Erros                                                                                   |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /task/catalog`        | Banco: busca, filtros, "Atividades prontas", "Ver todas" | Query: `search?`, `format?` (`INTERACTIVE`/`PRINTABLE`), `type?`, `skill?`, `category?`, `source?` (`EDUCATOR`/`LIBRARY`; ausente = os dois), `limit?` (1–50, padrão 20), `cursor?` | `200 { items: TaskSummary[], nextCursor? }` | `400`, `INVALID_CURSOR`                                                                 |
| `GET /task/skills`         | Filtro por habilidade e editor                           | —                                                                                                                                                                                   | `200 TaskSkill[]`                           | só `401`                                                                                |
| `GET /task/recommended`    | "Recomendado para {paciente}" (ATV-09)                   | Query: `studentId`                                                                                                                                                                  | `200 RecommendedTask[]` (0–6)               | `400`; `403`; `404 STUDENT_NOT_FOUND`                                                   |
| `GET /task/:id`            | Detalhe, jogo e imprimível                               | —                                                                                                                                                                                   | `200 Task` (com `content`)                  | `404 TASK_NOT_FOUND` (hoje vem 500, PP-11)                                              |
| `POST /task/create`        | Criar atividade de tipo novo (ATV-11)                    | multipart atual + `content` (string JSON), `skills?` (string JSON), `theme?`, `tone?`                                                                                               | `201 Task` (hoje `201` vazio)               | `400 INVALID_CONTENT`, `ALTERNATIVES_NOT_ALLOWED`, `INVALID_MEDIA_URL`, `INVALID_SKILL` |
| `PUT /task/update`         | Editar (ATV-11)                                          | atual + `content?`, `skills?`, `theme?`, `tone?`; `type` não muda (`400 TYPE_CHANGE_NOT_ALLOWED`)                                                                                   | `200 Task`                                  | os de `create`; `403 LIBRARY_TASK_READ_ONLY`; `404`                                     |
| `POST /task/:id/duplicate` | "Duplicar para editar" numa atividade pronta             | —                                                                                                                                                                                   | `201 Task` (`source: EDUCATOR`)             | `403`; `404 TASK_NOT_FOUND`                                                             |
| `DELETE /task/delete/:id`  | Excluir (existente)                                      | —                                                                                                                                                                                   | como hoje                                   | `403 LIBRARY_TASK_READ_ONLY`; `404` (hoje 500, PP-11)                                   |

`POST /task/create` devolver `201 Task` (em vez de vazio) permite abrir o detalhe logo depois de
criar. Se mudar a resposta for um problema para outros clientes, uma rota `POST /task/` nova serve.

### 2.5 Critérios de aceite

| ID       | Critério                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| BE-AT-01 | Criar `wordBuilder` sem `content.word` devolve `400 INVALID_CONTENT` com `field: "content.word"`                    |
| BE-AT-02 | `GET /task/catalog?format=PRINTABLE` só devolve `printable`; `source=LIBRARY` só devolve a biblioteca               |
| BE-AT-03 | Editar uma atividade da biblioteca devolve `403 LIBRARY_TASK_READ_ONLY`; duplicar devolve uma cópia editável        |
| BE-AT-04 | `GET /task/recommended` de um paciente de outro educador devolve 403; sem sessões, recomenda pelas `learningTopics` |
| BE-AT-05 | Um imprimível num caderno devolve `400 PRINTABLE_NOT_PLAYABLE`                                                      |
| BE-AT-06 | `GET /task/` de um cliente antigo continua funcionando, com os campos novos a mais                                  |

## 3. Resultado de atividade na sessão — P1

### 3.1 Para que serve

Hoje a sessão só registra resposta de múltipla escolha (`POST /task-notebook-session/answer`,
com `selectedAlternativeId`). Os jogos novos não têm alternativa: o resultado é "concluiu, com
quantas tentativas e erros". A ficha EVO-03 pede que a atividade jogada durante a sessão
apareça na **evolução** (G-35: registrar se a API tiver o endpoint).

### 3.2 Entidade

```ts
interface ActivityResult {
  id: string;
  sessionId: string;
  taskId: string;
  taskType: TaskType; // um dos jogáveis novos
  completed: boolean; // a criança terminou a atividade
  correct: boolean; // terminou sem pedir para pular (regra do jogo no app)
  attempts: number; // 1–50 (jogadas ou tentativas)
  errors: number; // 0–50 (letras erradas, pares errados)
  durationMs: number; // 0–3 600 000
  recordedAt: string;
}
```

### 3.3 Regras

| ID    | Regra                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RS-01 | Só em sessão **ativa** (sem `finishedAt`): senão `409 SESSION_ALREADY_FINISHED`. Sessão inexistente: `404 SESSION_NOT_FOUND`                                              |
| RS-02 | Sessão com caderno: a atividade precisa estar nele ou nos grupos dele (`400 TASK_NOT_IN_NOTEBOOK`, como no `answer`)                                                      |
| RS-03 | Só tipos jogáveis novos. Múltipla escolha continua no `answer`: `400 USE_ANSWER_ROUTE`. Imprimível: `400 PRINTABLE_NOT_PLAYABLE`                                          |
| RS-04 | **Um resultado por atividade e sessão.** Segundo envio: `409 RESULT_ALREADY_EXISTS` com `resultId`. O app não reenvia sozinho (G-08) e reconcilia pela sessão             |
| RS-05 | **Acerto separado.** Os resultados **não entram** no `accuracy` das análises atuais (G-43); o relatório da sessão ganha `activitySummary { total, completed, correct }`   |
| RS-06 | **Evolução.** `GET /session-evolution/context/:sessionId` ganha `activityResults` (título, tipo, `completed`, `correct`, `attempts`, `errors`); a evolução salva não muda |
| RS-07 | A sessão (`GET /task-notebook-session/student/:studentId` e o detalhe) passa a trazer `activityResults`                                                                   |
| RS-08 | **Propriedade.** Só quem pode ler o paciente (dono ou compartilhado, §4.6)                                                                                                |

### 3.4 Rotas sugeridas

| Método e rota                                 | Uso no app                          | Corpo                                                                             | Resposta             | Erros                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /task-notebook-session/activity-result` | Fim de cada jogo na sessão (EVO-03) | `sessionId`, `taskId`, `completed`, `correct`, `attempts`, `errors`, `durationMs` | `201 ActivityResult` | `400` validação, `TASK_NOT_IN_NOTEBOOK`, `USE_ANSWER_ROUTE`, `PRINTABLE_NOT_PLAYABLE`; `403`; `404`; `409 SESSION_ALREADY_FINISHED`, `RESULT_ALREADY_EXISTS` |

Mudanças em rotas existentes: `GET /task-notebook-session/report/:sessionId` (+ `activitySummary`
e `activityResults`), `GET /task-notebook-session/student/:studentId` (+ `activityResults`) e
`GET /session-evolution/context/:sessionId` (+ `activityResults`).

### 3.5 Critérios de aceite

| ID       | Critério                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------- |
| BE-RS-01 | Enviar o mesmo resultado duas vezes devolve `409 RESULT_ALREADY_EXISTS` com o `resultId`       |
| BE-RS-02 | Depois do `finish`, o envio devolve `409 SESSION_ALREADY_FINISHED`                             |
| BE-RS-03 | O contexto da evolução da sessão traz os resultados; o `accuracy` da análise do aluno não muda |

## 4. Equipe e convites — P1

### 4.1 Para que serve

O design (`TeamScreen`) mostra "Equipe e convites" com eyebrow "Gestão da clínica": o cartão
"Convide um profissional" com "Compartilhar link de convite", "Profissionais ativos" com a
contagem e a lista (avatar, nome, papel, `badge` "Ativo"). O banner do perfil mostra
"Psicopedagoga · Administradora". A história US2-12 é "Como administradora, quero convidar
profissionais e ver a equipe, para trabalhar em clínica".

Hoje cada educador trabalha sozinho. Existem `Student.educators: string[]` e
`POST /student/assign-educator` (transfere o paciente pelo e-mail), mas não há clínica, papel
nem convite. O app **não tem tela de cadastro** (o `POST /educator/register` existe e não é
usado).

### 4.2 Modelo proposto (G-62)

- Uma **clínica** reúne educadores. Cada educador está em **no máximo uma** clínica; sem
  clínica, o app funciona como hoje.
- Dois **papéis**: `ADMIN` (gestão da equipe) e `PROFESSIONAL`.
- O **paciente continua com um dono**. A clínica **não** dá acesso automático aos pacientes:
  o dono **compartilha** o paciente com um colega da mesma clínica (§4.6). O `ADMIN` também
  não vê pacientes que não foram compartilhados com ele.

### 4.3 Entidades

```ts
type TeamRole = "ADMIN" | "PROFESSIONAL";

interface Clinic {
  id: string;
  name: string; // 2–80
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
  code: string; // 8 caracteres A–Z e 2–9, sem 0/O/1/I
  role: TeamRole;
  createdBy: string; // educatorId
  expiresAt: string; // 7 dias
  shareMessage: string; // texto pronto para o Share do app (EQ-05)
  createdAt: string;
}

interface ClinicView {
  clinic: Clinic;
  myRole: TeamRole;
  members: ClinicMember[]; // ordem: ADMIN primeiro, depois por nome
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
```

`GET /educator/me` ganha `clinic?: { id, name, role }`.

### 4.4 Regras de negócio

| ID    | Regra                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| EQ-01 | **Uma clínica por educador.** Criar ou aceitar convite já estando numa clínica: `409 ALREADY_IN_CLINIC`                                                                                                                                                                  |
| EQ-02 | **Criar clínica.** Quem cria vira `ADMIN`                                                                                                                                                                                                                                |
| EQ-03 | **Gestão só do ADMIN:** renomear, criar e revogar convites, mudar papel e remover membro. Os demais: `403 FORBIDDEN_ROLE`                                                                                                                                                |
| EQ-04 | **Convite.** Código de 8 caracteres, **uso único**, válido por **7 dias**, com o papel definido na criação. No máximo 20 convites ativos por clínica (`409 TOO_MANY_INVITES`)                                                                                            |
| EQ-05 | **Mensagem pronta.** `shareMessage`: "Use o código {CÓDIGO} para entrar na equipe {clínica} no app Labirinto do Saber. Vale até {dd/mm}." Sem link mágico: o app roda no Expo Go e não abre link próprio (G-63)                                                          |
| EQ-06 | **Aceitar.** Logado: `POST /clinic/invites/accept`. Sem conta: `POST /educator/register` com `inviteCode` cria a conta e entra na clínica na mesma transação. Código vencido, usado, revogado ou inexistente: `404 INVITE_INVALID` (um só código, para não revelar qual) |
| EQ-07 | **Prévia pública** do convite (`clinicName`, `role`, `expiresAt`), para a tela de cadastro. Limite de 10 consultas por IP a cada 15 min (`429 TOO_MANY_REQUESTS`)                                                                                                        |
| EQ-08 | **Último ADMIN.** Não pode sair, ser removido nem virar `PROFESSIONAL`: `409 LAST_ADMIN`                                                                                                                                                                                 |
| EQ-09 | **Saída e remoção.** O membro que sai (ou é removido) **leva os pacientes dos quais é dono**; os compartilhamentos com ele e dele dentro da clínica são desfeitos na mesma transação                                                                                     |
| EQ-10 | **Compartilhar paciente.** Só o **dono** compartilha e desfaz, e só com membro da mesma clínica (`400 NOT_IN_SAME_CLINIC`). Repetir o mesmo compartilhamento é idempotente                                                                                               |
| EQ-11 | **Acesso do compartilhado.** Lê e escreve os dados clínicos do paciente (sessões, evolução, planos, escalas, anamnese, relatórios, atendimentos) como o dono. **Não** compartilha, transfere, arquiva nem edita o cadastro                                               |
| EQ-12 | **Autoria.** Cada registro guarda o `educatorId` de quem o criou; sessões, evoluções, planos e relatórios ganham `authorName` quando o autor não é quem está lendo                                                                                                       |
| EQ-13 | **Listas.** `GET /student/` passa a trazer os pacientes compartilhados, com `access: "OWNER" \| "SHARED"` e `ownerName`                                                                                                                                                  |
| EQ-14 | **Notificações.** Cada notificação vai para quem tem a pendência: o atendimento para o educador do atendimento; a evolução pendente para quem conduziu a sessão; a revisão de plano para o dono                                                                          |
| EQ-15 | `POST /student/assign-educator` (transferência) continua como está, mas exige que o novo educador seja da mesma clínica quando o dono estiver numa                                                                                                                       |

### 4.5 Rotas sugeridas: clínica e convites

| Método e rota                         | Uso no app                               | Corpo / query         | Resposta               | Erros                                                          |
| ------------------------------------- | ---------------------------------------- | --------------------- | ---------------------- | -------------------------------------------------------------- |
| `POST /clinic/`                       | "Criar equipe" (EQP-01)                  | `name`                | `201 ClinicView`       | `400`; `409 ALREADY_IN_CLINIC`                                 |
| `GET /clinic/`                        | Tela da equipe (EQP-01)                  | —                     | `200 ClinicView`       | `404 NOT_IN_CLINIC`                                            |
| `PUT /clinic/`                        | Renomear (EQP-02)                        | `name`                | `200 ClinicView`       | `400`; `403 FORBIDDEN_ROLE`; `404 NOT_IN_CLINIC`               |
| `POST /clinic/invites`                | "Compartilhar link de convite" (EQP-01)  | `role`                | `201 ClinicInvite`     | `400`; `403 FORBIDDEN_ROLE`; `409 TOO_MANY_INVITES`            |
| `GET /clinic/invites`                 | Convites ativos (EQP-02)                 | —                     | `200 ClinicInvite[]`   | `403 FORBIDDEN_ROLE`                                           |
| `DELETE /clinic/invites/:id`          | Revogar (EQP-02)                         | —                     | `204`                  | `403 FORBIDDEN_ROLE`; `404 INVITE_NOT_FOUND`                   |
| `GET /clinic/invites/preview/:code`   | **Público.** Prévia no cadastro (EQP-03) | —                     | `200 InvitePreview`    | `404 INVITE_INVALID`; `429 TOO_MANY_REQUESTS`                  |
| `POST /clinic/invites/accept`         | Entrar na equipe logado (EQP-03)         | `code`                | `200 ClinicView`       | `404 INVITE_INVALID`; `409 ALREADY_IN_CLINIC`                  |
| `PUT /clinic/members/:educatorId`     | Mudar papel (EQP-02)                     | `role`                | `200 ClinicView`       | `403 FORBIDDEN_ROLE`; `404 MEMBER_NOT_FOUND`; `409 LAST_ADMIN` |
| `DELETE /clinic/members/:educatorId`  | Remover membro, ou sair (o próprio id)   | —                     | `204`                  | `403 FORBIDDEN_ROLE`; `404 MEMBER_NOT_FOUND`; `409 LAST_ADMIN` |
| `POST /educator/register` (existente) | **Público.** Criar conta pelo convite    | atual + `inviteCode?` | atual (`{ id, name }`) | atuais; `404 INVITE_INVALID`                                   |

### 4.6 Rotas sugeridas: paciente compartilhado

| Método e rota                            | Uso no app                         | Corpo        | Resposta             | Erros                                                 |
| ---------------------------------------- | ---------------------------------- | ------------ | -------------------- | ----------------------------------------------------- |
| `GET /student/:id/shares`                | "Quem acompanha" na ficha (EQP-04) | —            | `200 StudentShare[]` | `403`; `404 STUDENT_NOT_FOUND`                        |
| `POST /student/:id/shares`               | Compartilhar (EQP-04)              | `educatorId` | `200 StudentShare[]` | `400 NOT_IN_SAME_CLINIC`; `403` (não é o dono); `404` |
| `DELETE /student/:id/shares/:educatorId` | Desfazer (EQP-04)                  | —            | `200 StudentShare[]` | `403`; `404 STUDENT_NOT_FOUND`, `SHARE_NOT_FOUND`     |

A regra de acesso "dono do paciente" de **todas** as rotas clínicas (sessões, evolução, planos,
escalas, anamnese, relatórios, atendimentos, notificações) passa a ser "dono **ou**
compartilhado" (EQ-11). É a parte mais trabalhosa desta seção e deve ter teste por domínio.

### 4.7 Critérios de aceite

| ID       | Critério                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------- |
| BE-EQ-01 | Um `PROFESSIONAL` que tenta criar convite recebe `403 FORBIDDEN_ROLE`                                 |
| BE-EQ-02 | Um código usado, vencido ou revogado devolve o mesmo `404 INVITE_INVALID`                             |
| BE-EQ-03 | `register` com `inviteCode` válido cria a conta e o membro; com código inválido, **não** cria a conta |
| BE-EQ-04 | O último `ADMIN` não sai nem é rebaixado (`409 LAST_ADMIN`)                                           |
| BE-EQ-05 | Depois de compartilhar, o colega lê e cria evolução do paciente; depois de desfazer, recebe 403       |
| BE-EQ-06 | O `ADMIN` não vê, em `GET /student/`, paciente de outro membro que não foi compartilhado com ele      |
| BE-EQ-07 | Remover um membro desfaz os compartilhamentos dele, e os pacientes dele continuam com ele             |

## 5. Pacientes: status, pendências e arquivamento — P2

### 5.1 Para que serve

O design (`PatientsScreen`) mostra "N pacientes ativos", o filtro **"Pendências"** e, em cada
cartão, "idade · status" ("PDI ativo", "Avaliação pendente", "PE em revisão"). Hoje não há
status nem conceito de paciente ativo; o app mostra o filtro como "Pendências · Em breve".

### 5.2 Entidades

```ts
type StudentStatus = "ACTIVE" | "ARCHIVED";

type PatientPrimaryStatus =
  | "PDI_ACTIVE" // "PDI ativo"
  | "ASSESSMENT_PENDING" // "Avaliação pendente" (rascunho de escala ou sem anamnese)
  | "PLAN_REVIEW" // "PE em revisão" / "PDI em revisão" (revisão vencida)
  | "NO_PLAN"; // "Sem plano"

type PatientPendingKind =
  | "EVOLUTION_PENDING" // sessão finalizada sem evolução
  | "PLAN_REVIEW_DUE" // nextReviewAt vencido
  | "SCALE_DRAFT" // rascunho de escala
  | "ANAMNESIS_MISSING"; // nenhuma resposta de anamnese

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
  pendings: { kind: PatientPendingKind; count: number; targetId?: string }[]; // vazio = sem pendência
}
```

`Student` ganha `status: StudentStatus` e `archivedAt?`.

### 5.3 Regras

| ID    | Regra                                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-01 | Todo paciente existente nasce `ACTIVE` (migração)                                                                                                                                               |
| PA-02 | **Arquivar** é só do dono. Com atendimento futuro `PENDING`: `409 HAS_FUTURE_APPOINTMENTS` com `count`, a não ser que venha `cancelFutureAppointments: true`, que os cancela na mesma transação |
| PA-03 | **Arquivado** sai de `GET /student/` (salvo `?status=ARCHIVED` ou `ALL`), da recomendação e das notificações. Os dados continuam legíveis e entram em relatórios                                |
| PA-04 | **Arquivado não recebe** atendimento, sessão, plano nem aplicação de escala novos: `409 STUDENT_ARCHIVED`                                                                                       |
| PA-05 | **Reativar** volta a `ACTIVE`, sem recriar o que foi cancelado                                                                                                                                  |
| PA-06 | **Status principal**, nesta ordem: revisão vencida → `PLAN_REVIEW`; rascunho de escala ou sem anamnese → `ASSESSMENT_PENDING`; PDI ativo → `PDI_ACTIVE`; senão `NO_PLAN`                        |
| PA-07 | **Pendências** usam as mesmas regras das notificações (Entrega 4), sem esperar o cron: a lista reflete o estado no momento da leitura                                                           |

### 5.4 Rotas sugeridas

| Método e rota               | Uso no app                                  | Corpo / query                                       | Resposta                | Erros                                                            |
| --------------------------- | ------------------------------------------- | --------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `GET /student/overview`     | Cartões e filtro "Pendências" (PAC-10)      | Query: `status?` (padrão `ACTIVE`)                  | `200 PatientOverview[]` | `400`                                                            |
| `GET /student/:id`          | Ficha sem baixar todos os pacientes (PP-09) | —                                                   | `200 Student`           | `403`; `404 STUDENT_NOT_FOUND`                                   |
| `GET /student/` (existente) | Lista                                       | Query nova: `status?` (`ACTIVE`, `ARCHIVED`, `ALL`) | `200 Student[]`         | `400`                                                            |
| `PUT /student/:id/status`   | Arquivar e reativar (PAC-11)                | `status`, `cancelFutureAppointments?`               | `200 Student`           | `400`; `403`; `404`; `409 HAS_FUTURE_APPOINTMENTS` (com `count`) |

### 5.5 Critérios de aceite

| ID       | Critério                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| BE-PA-01 | Arquivar com atendimento futuro sem a opção devolve `409 HAS_FUTURE_APPOINTMENTS` com a contagem                  |
| BE-PA-02 | Paciente arquivado não aparece em `GET /student/`, e `POST /appointment/` para ele devolve `409 STUDENT_ARCHIVED` |
| BE-PA-03 | Uma sessão finalizada sem evolução aparece como `EVOLUTION_PENDING` no overview na hora                           |

## 6. Agenda: atendimentos recorrentes — P2

### 6.1 Para que serve

Atendimento de psicopedagogia costuma ser semanal. Hoje cada atendimento é criado à mão. A
recorrência ficou fora das Entregas 3 e 4.

### 6.2 Entidades

```ts
type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY";

interface AppointmentSeries {
  id: string;
  studentId: string;
  educatorId: string;
  frequency: RecurrenceFrequency;
  firstScheduledAt: string; // ISO; dia da semana e horário de São Paulo vêm daqui
  occurrences: number; // 2–26
  type?: string;
  durationMinutes: number;
  observation?: string;
  endedAt?: string; // série encerrada (RC-06)
  createdAt: string;
}

interface SeriesResult {
  series: AppointmentSeries;
  created: Appointment[];
  skipped: {
    scheduledAt: string;
    reason: "CONFLICT";
    conflictingAppointmentId: string;
  }[];
}
```

`Appointment` ganha `seriesId?`.

### 6.3 Regras

| ID    | Regra                                                                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RC-01 | **Ocorrências materializadas.** A série cria os atendimentos de uma vez (2 a 26, no máximo 6 meses); cada um é um `Appointment` comum, com `seriesId`                                                        |
| RC-02 | **Horário local.** As ocorrências mantêm o dia da semana e o horário de São Paulo da primeira                                                                                                                |
| RC-03 | **Conflito por ocorrência.** A ocorrência que conflita com outro `PENDING` (regra da Entrega 3) é **pulada** e listada em `skipped`; as demais são criadas. Se todas conflitarem: `409 APPOINTMENT_CONFLICT` |
| RC-04 | **Editar uma ocorrência** com `PUT /appointment/:id` muda só ela (como hoje)                                                                                                                                 |
| RC-05 | **"Este e os seguintes".** Muda horário, duração, tipo ou observação da ocorrência indicada e das seguintes `PENDING`; as passadas, concluídas e canceladas não mudam. Conflitos vêm em `skipped`            |
| RC-06 | **Cancelar a série a partir de uma ocorrência** cancela (`CANCELLED`) ela e as seguintes `PENDING` e encerra a série (`endedAt`)                                                                             |
| RC-07 | Lembretes e notificações tratam cada ocorrência como um atendimento comum                                                                                                                                    |
| RC-08 | Paciente arquivado não recebe série (`409 STUDENT_ARCHIVED`)                                                                                                                                                 |

### 6.4 Rotas sugeridas

| Método e rota                         | Uso no app                     | Corpo                                                                                                              | Resposta                                                  | Erros                                                                                 |
| ------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `POST /appointment/series`            | "Repetir" no novo atendimento  | `studentId`, `scheduledAt`, `frequency`, `occurrences`, `type?`, `durationMinutes?`, `observation?`                | `201 SeriesResult`                                        | `400`; `403`; `404 STUDENT_NOT_FOUND`; `409 APPOINTMENT_CONFLICT`, `STUDENT_ARCHIVED` |
| `GET /appointment/series/:id`         | Detalhe ("Semanal · 8 de 12")  | —                                                                                                                  | `200 AppointmentSeries` com `appointments: Appointment[]` | `403`; `404 SERIES_NOT_FOUND`                                                         |
| `PUT /appointment/series/:id`         | "Este e os seguintes"          | `fromAppointmentId`, e ao menos um: `scheduledAt` (só o horário é usado), `durationMinutes`, `type`, `observation` | `200 SeriesResult`                                        | `400`; `403`; `404`; `409 APPOINTMENT_NOT_EDITABLE`                                   |
| `POST /appointment/series/:id/cancel` | "Cancelar este e os seguintes" | `fromAppointmentId`                                                                                                | `200 SeriesResult`                                        | `400`; `403`; `404`                                                                   |

### 6.5 Critérios de aceite

| ID       | Critério                                                                            |
| -------- | ----------------------------------------------------------------------------------- |
| BE-RC-01 | Uma série semanal de 8 com uma ocorrência em conflito cria 7 e lista 1 em `skipped` |
| BE-RC-02 | Cancelar a partir da 4ª deixa as 3 primeiras como estavam e encerra a série         |
| BE-RC-03 | Todas as ocorrências ficam às 14:00 de São Paulo, quaisquer que sejam as datas      |

## 7. Push das notificações — P2

### 7.1 Para que serve

Desde a Entrega 4 o backend gera as notificações por um job diário (06:00), e o app mostra o
sino e a lista (G-59). O push ficou fora porque o **Expo Go não recebe push remoto no Android**
desde o SDK 53. Com o **development build** (G-67), o app recebe push pelo serviço de push da
Expo.

### 7.2 Entidades

```ts
interface PushToken {
  token: string; // "ExponentPushToken[...]"
  platform: "android" | "ios";
  createdAt: string;
  lastSeenAt: string;
}

interface NotificationPreferences {
  pushEnabled: boolean; // padrão true
  kinds: Record<NotificationKind, boolean>; // padrão: todos true
}
```

### 7.3 Regras

| ID    | Regra                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PU-01 | **Registro.** O app registra o token depois do login e da permissão; o mesmo token não duplica (upsert). Até 5 tokens por educador; o mais antigo sai                                |
| PU-02 | **Envio.** Depois de gerar as notificações do dia, o job envia um push por educador pela API de push da Expo, se `pushEnabled` e o `kind` estiver ligado                             |
| PU-03 | **Sem dado do paciente no push.** O texto que aparece na tela bloqueada é genérico: "Você tem 3 atendimentos hoje", "2 evoluções pendentes". Nome e detalhe ficam só na lista do app |
| PU-04 | **Agrupado.** No máximo **um push por educador por dia**, com a contagem por tipo; `data` leva `{ notificationIds, target? }` (o `target` só quando houver uma notificação)          |
| PU-05 | **Limpeza.** Token com `DeviceNotRegistered` no recibo da Expo é apagado. Logout apaga o token do aparelho                                                                           |
| PU-06 | **Preferências** por educador; desligar um `kind` também o tira do push (a lista do app continua com tudo)                                                                           |
| PU-07 | **Credenciais.** As credenciais de push (FCM no Android, APNs no iOS) ficam no projeto Expo (EAS); o backend só usa o token de acesso da Expo, guardado como segredo                 |

### 7.4 Rotas sugeridas

| Método e rota                     | Uso no app                             | Corpo                             | Resposta                      | Erros                    |
| --------------------------------- | -------------------------------------- | --------------------------------- | ----------------------------- | ------------------------ |
| `POST /notification/push-token`   | Registrar depois da permissão (NOT-02) | `token`, `platform`               | `200 PushToken`               | `400 INVALID_PUSH_TOKEN` |
| `DELETE /notification/push-token` | Logout (NOT-02)                        | `token`                           | `204`                         | `400`                    |
| `GET /notification/preferences`   | Tela de preferências (NOT-02)          | —                                 | `200 NotificationPreferences` | —                        |
| `PUT /notification/preferences`   | Salvar preferências (NOT-02)           | parcial: `pushEnabled?`, `kinds?` | `200 NotificationPreferences` | `400`                    |

### 7.5 Critérios de aceite

| ID       | Critério                                                                                      |
| -------- | --------------------------------------------------------------------------------------------- |
| BE-PU-01 | Rodar o job duas vezes no mesmo dia não manda dois pushes                                     |
| BE-PU-02 | O texto do push não contém nome de paciente                                                   |
| BE-PU-03 | Com `pushEnabled: false`, nada é enviado, e a lista do app continua recebendo as notificações |
| BE-PU-04 | Um token inválido no recibo é apagado                                                         |

## 8. Central de ajuda — P3

### 8.1 Para que serve

O design (`TeamScreen`, `onboarding`) mostra "Central de ajuda" com eyebrow "Aprenda no seu
ritmo", o destaque "COMECE POR AQUI · 4 MIN" ("Conheça o Labirinto do Saber") e "Tutoriais
essenciais" (4 itens numerados com duração). O app toca o vídeo com `expo-video`, que roda no
Expo Go (G-37).

### 8.2 Entidade e regras

```ts
interface HelpTutorial {
  id: string;
  order: number;
  title: string; // até 80
  description: string; // até 200
  durationSeconds: number;
  featured: boolean; // "Comece por aqui"; no máximo um
  videoUrl?: string; // https, MP4 (H.264) ou HLS; ausente = tutorial só em texto
  thumbnailUrl?: string;
  steps?: string[]; // até 10 passos em texto (acessibilidade e reserva sem vídeo)
}
```

| ID    | Regra                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------- |
| AJ-01 | Conteúdo por seed versionado; o backend publica quando a equipe de produto entregar os vídeos   |
| AJ-02 | `videoUrl` é um arquivo direto (não página do YouTube), servido por HTTPS com suporte a `Range` |
| AJ-03 | Tutorial sem vídeo continua na lista, com os `steps`                                            |
| AJ-04 | Nenhum vídeo mostra dado real de paciente                                                       |

### 8.3 Rota sugerida

| Método e rota         | Uso no app                | Resposta                           | Erros    |
| --------------------- | ------------------------- | ---------------------------------- | -------- |
| `GET /help/tutorials` | Central de ajuda (AJD-01) | `200 HelpTutorial[]` (por `order`) | só `401` |

Critério: **BE-AJ-01** a lista vem na ordem, com no máximo um `featured`.

## 9. Pequenos pedidos e pontos em aberto — P3

| ID    | Pedido                                                                                                                                                                                     | Por quê                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| PP-05 | **Apagar campos com `null`:** responsável do paciente (`guardianName`, `guardianPhone`, `guardianRelationship`), `nextReviewAt` e `notes` do plano, `imageFile` e `audioFile` da atividade | Limitação da Entrega 3: hoje um campo vazio é "não enviado" e não dá para limpar |
| PP-06 | **RP-02:** na audiência `SCHOOL`, `patient.displayName` = primeiro nome + inicial do sobrenome ("Ana S.") (G-71)                                                                           | Ponto em aberto da Entrega 4 (BACKEND-ENTREGUE §6)                               |
| PP-07 | **Repetição das notificações:** uma notificação por pendência, sem repetir a cada dia enquanto ela existir; `APPOINTMENTS_TODAY` continua diária (G-72)                                    | Ponto em aberto da Entrega 4                                                     |
| PP-08 | **`timeToAnswer` antigo:** migrar as respostas anteriores a 2026-10-09 para milissegundos (×1000), com backup, ou marcar a sessão como `timeUnit: "SECONDS"`                               | Relatórios antigos mostram média em segundos                                     |
| PP-09 | `GET /student/:id` (§5.4)                                                                                                                                                                  | A ficha hoje baixa todos os pacientes                                            |
| PP-10 | Swagger com todas as rotas novas                                                                                                                                                           | Integração e conferência                                                         |
| PP-11 | `TASK_NOT_FOUND`, `TASK_GROUP_NOT_FOUND` e `TASK_NOTEBOOK_NOT_FOUND` como `404`, não `500`                                                                                                 | Convenção "404, nunca 500" (§1); o app trata hoje como exceção                   |

## 10. Fora desta entrega

Para o backend não antecipar: **envio automático de WhatsApp** (exige a API oficial do WhatsApp
Business, modelos aprovados e custo por mensagem; G-53 continua com o `wa.me`), **IA para gerar
os tipos jogáveis** (a IA continua só na múltipla escolha), **escalas criadas pelo educador**
(G-55), **gestão financeira ou de cobrança**, **relatórios da clínica** (por equipe) e **acesso
do ADMIN a todos os pacientes** (G-62).

## 11. Ordem de entrega sugerida (levas)

O app trabalha em paralelo com mocks fiéis a esta especificação (G-29), mas **só integra o que
estiver publicado**. A ordem que mais destrava o app:

| Leva | Conteúdo                                        | Destrava no app                                   |
| ---- | ----------------------------------------------- | ------------------------------------------------- |
| 1    | §2 Banco de atividades e §3 Resultado na sessão | ATV-09, ATV-04a, ATV-04b, ATV-11, ATV-05, EVO-03  |
| 2    | §4 Equipe e convites                            | EQP-01 a EQP-04                                   |
| 3    | §5 Pacientes, §6 Recorrência, PP-05 e PP-09     | PAC-10, PAC-11, AGE-06, FEC-06                    |
| 4    | §7 Push e §8 Ajuda                              | NOT-02, AJD-01                                    |
| 5    | PP-06, PP-07, PP-08, PP-10 e PP-11              | Nada bloqueado; melhora relatórios e notificações |

A cada leva, o backend avisa quais rotas saíram e o que mudou em relação a esta proposta, como
no [BACKEND-ENTREGUE da Entrega 4](../entrega-4/BACKEND-ENTREGUE.md).

## 12. Decisões de produto para confirmar com o backend

O app propõe uma regra em cada ponto; confirme ou mude antes de implementar:

1. **Paciente com dono e compartilhamento explícito** (G-62, EQ-10, EQ-11). Alternativa: o
   `ADMIN` vê todos os pacientes da clínica.
2. **Quem sai da clínica leva os próprios pacientes** (EQ-09). Alternativa: os pacientes ficam
   com a clínica e passam ao `ADMIN`.
3. **Convite por código, sem link mágico** (G-63, EQ-05). Alternativa: convite por e-mail
   enviado pelo backend.
4. **Resultado de jogo fora do `accuracy`** (RS-05). Alternativa: contar como acerto nas
   análises.
5. **Ocorrência em conflito é pulada** (RC-03). Alternativa: a série inteira falha.
6. **Arquivar com atendimentos futuros** exige confirmação e cancela na mesma transação (PA-02).
7. **Um push por dia, agrupado e sem nome de paciente** (PU-03, PU-04).
8. **Atividades prontas da plataforma** mantidas por seed (AT-06): quem produz o conteúdo
   inicial (pedagogia) precisa ser definido.

## 13. Como o app integra

1. O backend publica uma leva (§11) e responde as decisões do §12.
2. O orquestrador do app registra o contrato real no `PROJECT.md` (API-06) e ajusta as fichas;
   o worker da API-07 atualiza tipos, endpoints e mocks.
3. Cada tela é testada com mocks fiéis e depois contra o backend real, com evidência por rota no
   [TRACKING](TRACKING.md).
4. Diferenças entre esta proposta e o contrato real não são "corrigidas" no app: o app segue o
   contrato.

## 14. Histórico

- 2026-11-24: primeira versão, junto com o planejamento da Entrega 5.
