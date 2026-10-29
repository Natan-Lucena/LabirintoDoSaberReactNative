# Entrega 3 — O que o backend entregou

> Registro do overview que o time do backend enviou em 2026-10-29 (backend PR #28), seguido da
> conferência feita pelo orquestrador do app contra o Swagger publicado
> (`https://labirinto-do-saber.vercel.app/api-docs`, OpenAPI 3.0.0, 70 rotas). O contrato que o
> app segue está em [PROJECT.md](../PROJECT.md#parte-ii--referência-global-da-api); quando o
> overview e o Swagger divergem, a divergência está no §9 e vira pergunta ao backend. O que o
> app pediu está em [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md).

## Parte A — Overview do backend (texto recebido, sem alterações de conteúdo)

### 1. O que foi entregue

| Bloco                                            | Pedido do app | Situação                          |
| ------------------------------------------------ | ------------- | --------------------------------- |
| Planos: CRUD, metas, revisões, encerramento      | P1            | Entregue                          |
| Rascunho de plano com IA                         | P1            | Entregue                          |
| Sugestões da IA                                  | P2            | Entregue, sob demanda (ver §7)    |
| Atendimento: status, tipo, duração, conflito     | P3            | Entregue                          |
| Sessão ligada ao caderno e ao atendimento (G-06) | P3            | Entregue                          |
| Responsável do paciente                          | P3            | Entregue                          |
| Profissão do educador                            | P3            | Entregue                          |
| `GET /task-group/:id`                            | P3            | Entregue                          |
| Editar resposta de anamnese                      | P3            | Entregue                          |
| Swagger completo                                 | P3            | Entregue: 70 rotas em `/api-docs` |
| Troca de senha autenticada (G-05, G-49)          | P3            | Não entregue nesta etapa          |

### 2. Convenções das rotas novas

- **Autenticação:** todas as rotas novas exigem Bearer JWT. O educador vem sempre do token,
  nunca do corpo.
- **Formato de erro:**
  - regra de negócio: `{ message: "CODIGO" }`;
  - validação Zod: `{ message, errors: [{ message, field }] }`;
  - falha de IA: `500 { message, error }`.
- **Acesso:** só o educador **dono do paciente** (`Student.educatorId`) acessa os planos dele.
  - Recurso de outro educador: `403 { message: "UNAUTHORIZED" }`.
  - Recurso inexistente: `404`, nunca 500. Um id que não é UUID válido também vira 404 nas rotas
    de plano.
- **Datas sem hora** (vigência, revisão, `sessionDate`): `AAAA-MM-DD`, validadas no calendário.
  `2026-02-30` dá 400. "Hoje" é calculado no fuso `America/Sao_Paulo`.
- **Datas com hora:** ISO 8601 em UTC.
- **IDs:** UUID v4. Um UUID fora do padrão RFC dá 400 de validação.
- **Campos opcionais** nos planos vêm **ausentes** do JSON quando não estão definidos, não como
  `null`.

### 3. Planos (PDI e PE)

#### Entidade

```ts
type PlanType = "PDI" | "PE";
type PlanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "DISCONTINUED";
type PlanSource = "AI" | "MANUAL";

interface Plan {
  id: string;
  educatorId: string;
  studentId: string;
  type: PlanType;
  status: PlanStatus; // nasce ACTIVE
  source: PlanSource;
  title: string; // 1–120
  generalObjective: string; // 1–2000
  professionalNotes?: string; // até 2000
  focus?: string; // até 1000
  consideredDifficulties: string[]; // até 20 itens de 1–100
  startDate: string; // AAAA-MM-DD
  endDate: string; // AAAA-MM-DD
  nextReviewDate?: string; // AAAA-MM-DD
  parentPlanId?: string; // só PE
  sessionDate?: string; // só PE, obrigatório nele
  appointmentId?: string; // só PE, opcional
  goals: Goal[]; // ordenadas por order
  progress: PlanProgress; // calculado pelo servidor
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface Goal {
  id: string;
  order: number; // 0..n-1
  description: string; // 1–500
  successCriterion?: string; // até 500
  status: GoalStatus; // nasce NOT_STARTED
  achievedAt?: string;
  updatedAt: string;
}

interface PlanProgress {
  totalGoals: number; // sem DISCONTINUED
  achievedGoals: number;
  inProgressGoals: number;
  percent: number; // round(100 × achieved / total); 0 se total = 0
}
```

`PlanSummary`, devolvido na listagem, traz `id`, `studentId`, `studentName`, `type`, `status`,
`title`, `startDate`, `endDate`, `nextReviewDate?`, `progress` e `updatedAt`. Não traz `goals`.

#### Regras

- **Um PDI ativo por paciente.** O segundo devolve
  `409 { message: "ACTIVE_PDI_ALREADY_EXISTS", activePlanId }`. Para trocar, encerre o atual e
  crie o novo.
- **PE:**
  - `sessionDate` é obrigatório no PE e proibido no PDI.
  - O servidor preenche `startDate = endDate = sessionDate`.
  - `parentPlanId`, se vier, precisa ser um PDI do mesmo paciente.
  - `appointmentId`, se vier, precisa ser um atendimento do mesmo educador e paciente.
- **Vigência do PDI:** `endDate > startDate`, e `nextReviewDate` fica entre as duas, inclusive.
- **Metas:**
  - de 1 a 10 por plano;
  - `order` é atribuído pela posição na lista;
  - lista vazia devolve `400 PLAN_WITHOUT_GOALS`.
- **Editar metas** usa a lista completa:
  - meta com `id` é atualizada (mantém status e `achievedAt`);
  - meta sem `id` é criada;
  - meta ausente é removida, mas meta `ACHIEVED` não pode ser removida;
  - o mesmo `id` duas vezes na lista é recusado.
- **Estado da meta:** virar `ACHIEVED` grava `achievedAt`; sair de `ACHIEVED` limpa o campo.
- **Encerramento:** só plano `ACTIVE` aceita edição, mudança de meta, revisão e sugestão.
  - Encerrar (`COMPLETED` ou `CANCELLED`) grava `closedAt` e é definitivo.
  - Não existe exclusão física.
  - As sugestões pendentes do plano são descartadas.
- **Listagem:** `ACTIVE` primeiro, depois `updatedAt` decrescente. Sem paginação.

#### Rotas

| Rota                          | Corpo / query                                                                                                                                                                                                                                                           | Sucesso                                   | Erros                                                                                                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /plan/`                 | `studentId`, `type`, `title`, `generalObjective`, `professionalNotes?`, `focus?`, `consideredDifficulties?`, `startDate`/`endDate` (PDI), `nextReviewDate?`, `parentPlanId?`, `sessionDate?`, `appointmentId?`, `source`, `goals: { description, successCriterion? }[]` | `201 Plan`                                | 400 validação, `PLAN_WITHOUT_GOALS`, `TOO_MANY_GOALS`, `SESSION_DATE_REQUIRED`, `INVALID_FIELDS_FOR_PDI`, `INVALID_DATES`, `INVALID_PARENT_PLAN`, `INVALID_APPOINTMENT` · 403 · 404 `STUDENT_NOT_FOUND` · 409 `ACTIVE_PDI_ALREADY_EXISTS` |
| `GET /plan/`                  | `studentId?`, `status?`, `type?`                                                                                                                                                                                                                                        | `200 PlanSummary[]`                       | 400 · 403 (aluno de outro educador)                                                                                                                                                                                                       |
| `GET /plan/:id`               |                                                                                                                                                                                                                                                                         | `200 Plan`                                | 403 · 404 `PLAN_NOT_FOUND`                                                                                                                                                                                                                |
| `PUT /plan/:id`               | todos opcionais: `title`, `generalObjective`, `professionalNotes`, `endDate`, `nextReviewDate`, `goals: { id?, description, successCriterion? }[]`                                                                                                                      | `200 Plan`                                | 400 (`INVALID_DATES`, `GOAL_NOT_FOUND`, `DUPLICATE_GOAL_ID`…) · 403 · 404 · 409 `PLAN_NOT_EDITABLE`, `GOAL_ACHIEVED_CANNOT_BE_REMOVED`                                                                                                    |
| `PUT /plan/:id/goals/:goalId` | `status`                                                                                                                                                                                                                                                                | `200 Plan`                                | 400 · 403 · 404 `PLAN_NOT_FOUND`, `GOAL_NOT_FOUND` · 409 `PLAN_NOT_EDITABLE`                                                                                                                                                              |
| `PUT /plan/:id/status`        | `status: "COMPLETED" \| "CANCELLED"`                                                                                                                                                                                                                                    | `200 Plan`                                | 400 · 403 · 404 · 409 `PLAN_NOT_EDITABLE`                                                                                                                                                                                                 |
| `POST /plan/:id/reviews`      | `note` (1–2000), `nextReviewDate?`                                                                                                                                                                                                                                      | `201 PlanReview`                          | 400 `INVALID_DATES` · 403 · 404 · 409 `PLAN_NOT_EDITABLE`                                                                                                                                                                                 |
| `GET /plan/:id/reviews`       |                                                                                                                                                                                                                                                                         | `200 PlanReview[]`, mais recente primeiro | 403 · 404                                                                                                                                                                                                                                 |

`PlanReview`: `id`, `planId`, `reviewedAt`, `note`, `nextReviewDate?` e
`goalStatuses: { goalId, status }[]`, que é o retrato das metas no momento da revisão.

Limitação atual: o `PUT /plan/:id` não apaga `nextReviewDate` nem `professionalNotes`. Mandar
vazio ou omitir mantém o valor atual.

### 4. Rascunho de plano com IA: `POST /plan/generate`

Gera um rascunho e **não salva nada**. Para salvar, o app chama `POST /plan/` com
`source: "AI"`.

**Entrada:**

| Campo                        | Regra                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `studentId`                  | Obrigatório; paciente do educador                      |
| `type`                       | `PDI` ou `PE`                                          |
| `focus`                      | 1–1000                                                 |
| `consideredDifficulties`     | 1–20 itens de 1–100                                    |
| `durationMonths`             | `3` ou `6`; obrigatório no PDI, ignorado no PE         |
| `sessionDate`                | `AAAA-MM-DD`; obrigatório no PE                        |
| `parentPlanId`               | Opcional no PE; as metas do PDI entram no contexto     |
| `includeAnamnesisTemplateId` | Opcional; inclui as respostas de anamnese desse modelo |

**Saída** (`200`):

```ts
interface PlanDraft {
  type: PlanType;
  title: string; // até 120
  generalObjective: string; // até 2000
  goals: { description: string; successCriterion?: string }[]; // 3 a 6
  suggestedStartDate: string; // PDI: hoje (SP); PE: sessionDate
  suggestedEndDate: string; // PDI: início + durationMonths; PE: sessionDate
  suggestedNextReviewDate?: string; // PDI: início + 1 mês; PE: ausente
  rationale?: string; // até 1000
}
```

**Regras:**

- As datas são calculadas pelo servidor, nunca pela IA.
- Sem sessões registradas, o `rationale` diz que o plano foi gerado sem histórico.
- O texto vem em português, sem diagnóstico e sem promessa de resultado.
- O Gemini **não recebe** nome, endereço, telefone, documentos nem URLs de arquivos do paciente.
  Recebe idade, gênero, dificuldades, métricas e observações das sessões recentes e, se pedido,
  a anamnese.

**Erros:**

- `400`: validação ou `INVALID_PARENT_PLAN`.
- `403`.
- `404`: `STUDENT_NOT_FOUND`, `PLAN_NOT_FOUND` (plano pai) ou `TEMPLATE_NOT_FOUND`.
- `500 { message: "AI_GENERATION_FAILED" }`: provedor indisponível.
- `500 { message: "AI_INVALID_OUTPUT" }`: resposta fora do contrato.

**Tempo:** a rota faz no máximo 2 tentativas ao Gemini. O tempo típico ainda não foi medido em
produção. Mantenham o timeout de 90 s.

### 5. Sugestões da IA

São geradas **sob demanda**, quando o profissional pede ("Pedir sugestões"), e não
automaticamente ao encerrar a sessão (ver §7).

```ts
type SuggestionKind =
  "UPDATE_GOAL_STATUS" | "ADD_GOAL" | "REWRITE_GOAL" | "SCHEDULE_REVIEW";
type SuggestionStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

interface PlanSuggestion {
  id: string;
  planId: string;
  studentId: string;
  studentName: string;
  goalId?: string; // UPDATE_GOAL_STATUS e REWRITE_GOAL
  kind: SuggestionKind;
  text: string; // até 500
  proposedChange: { status?; description?; successCriterion?; nextReviewDate? };
  status: SuggestionStatus;
  createdAt: string;
  resolvedAt?: string;
}
```

| Rota                                   | Sucesso                                                                                                    | Erros                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /plan/:id/suggestions/generate`  | `201 PlanSuggestion[]` com as novas; `200 []` se o plano já tem 3 pendentes ou a IA não trouxe nada válido | 403 · 404 · 409 `PLAN_NOT_EDITABLE` · 500 `AI_*`                                                  |
| `GET /plan/suggestions?status=PENDING` | `200 PlanSuggestion[]`, mais recentes primeiro; `status` é opcional                                        | 400                                                                                               |
| `POST /plan/suggestions/:id/accept`    | `200 Plan` atualizado                                                                                      | 403 · 404 `SUGGESTION_NOT_FOUND` · 409 `SUGGESTION_NOT_APPLICABLE`, `SUGGESTION_ALREADY_RESOLVED` |
| `POST /plan/suggestions/:id/dismiss`   | `200 PlanSuggestion`                                                                                       | 403 · 404 · 409 `SUGGESTION_ALREADY_RESOLVED`                                                     |

**Regras:**

- No máximo **3 pendentes por plano**.
- Aceitar aplica a mudança com as mesmas regras da edição.
- Se a mudança não puder ser aplicada (meta removida, plano encerrado, limite de metas), a rota
  devolve `409 SUGGESTION_NOT_APPLICABLE` e a sugestão vira `DISMISSED`.
- Sugestões que não mudariam nada são descartadas na geração.

### 6. Pedidos menores

#### Atendimento

- **`PUT /appointment/:id`** aceita `status`, `type` (1–50) e `durationMinutes` (15–240, padrão
  50).
- **`POST /appointment`** aceita `type` e `durationMinutes`.
- **Transições de status:** `PENDING → COMPLETED | CANCELLED` e `CANCELLED → PENDING`.
  `COMPLETED` é final. Transição inválida devolve `409 INVALID_STATUS_TRANSITION`.
- **Atendimento `CANCELLED` ou `COMPLETED`:** não recebe lembrete. Não aceita mudança de horário,
  tipo ou duração (`409 APPOINTMENT_NOT_EDITABLE`); `observation` pode mudar.
- **Reativar e remarcar** podem ir na mesma requisição: `{ status: "PENDING", scheduledAt }`.
- **Conflito:** um horário que se sobrepõe a outro `PENDING` do mesmo educador devolve
  `409 { message: "APPOINTMENT_CONFLICT", conflictingAppointmentId }`. Atendimentos encostados
  (o fim de um igual ao início do outro) não conflitam.
- As respostas sempre trazem `durationMinutes`. Registros antigos vêm com 50.

#### Sessão ligada ao caderno (G-06)

- `POST /task-notebook-session/start` aceita `taskNotebookId?` e `appointmentId?`.
  - Caderno de outro educador ou inexistente: `404 NOTEBOOK_NOT_FOUND`.
  - Atendimento de outro educador ou paciente: `404 APPOINTMENT_NOT_FOUND`.
- A sessão e as listagens por aluno devolvem `taskNotebookId` e `appointmentId`.
- Em sessão com caderno, o `answer` recusa tarefa que não está no caderno nem nos grupos dele:
  `400 TASK_NOT_IN_NOTEBOOK`.
- **Sessão sem caderno continua funcionando** e aceita qualquer tarefa.
- O `finish` de uma sessão iniciada com `appointmentId` marca o atendimento como `COMPLETED`, se
  ele estiver `PENDING`.

#### Responsável do paciente

- `POST /student/create` e `PUT /student/update/:id` (multipart) aceitam `guardianName` (1–100),
  `guardianPhone` (7–15, **só dígitos**) e `guardianRelationship` (1–50), todos opcionais.
- Um campo vazio (`""`) é tratado como não enviado.
- Os três campos voltam nas respostas de aluno (`null` quando vazios).

#### Profissão do educador

`PUT /educator/update-educator` aceita `newProfession` (3–100). `GET /educator/me` devolve
`profession`.

#### Grupo por id

`GET /task-group/:id` devolve o grupo quando ele é do educador **ou** está em um caderno do
educador. Fora disso, `403 UNAUTHORIZED`. Grupo inexistente: `404 TASK_GROUP_NOT_FOUND`.

#### Editar resposta de anamnese

`PUT /anamnese/responses/:responseId` recebe o mesmo `answers` da criação, com as mesmas
validações. Só o educador dono pode editar (`403` para os demais). Grava `updatedAt` e mantém
`answeredAt`.

### 7. Diferenças em relação à especificação do app

| Pedido do app                                                  | O que foi feito                                       | Por quê                                                                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Sugestões geradas automaticamente ao encerrar a sessão (SG-02) | Sob demanda, em `POST /plan/:id/suggestions/generate` | Na Vercel, processamento em segundo plano depois da resposta não é confiável. O app já tinha listado essa alternativa |
| `start` recebe `content: { kind, id }` (SE-01)                 | Recebe `taskNotebookId`                               | A especificação aceitava as duas formas; o caderno cobre o player                                                     |
| `activePdi` em `GET /student/` (§2.5)                          | Não implementado                                      | Usar `GET /plan/?studentId=…&type=PDI&status=ACTIVE`                                                                  |
| `429 AI_RATE_LIMITED`                                          | Não implementado                                      | Não há limite de requisições hoje                                                                                     |
| Paginação                                                      | Não implementada                                      | Volume baixo por educador                                                                                             |

**Respostas às perguntas abertas do app:**

- **O PE precisa do atendimento?** Não. `appointmentId` é opcional.
- **Plano pode ser excluído?** Não. Só encerrado (`COMPLETED` ou `CANCELLED`).
- **Sessão sem caderno continua válida (SE-04)?** Sim.
- **Tempo da geração com IA?** Ainda não medido em produção; mantenham os 90 s.
- **Decisões de produto do §5 da especificação:** todas aceitas como propostas.
  - um PDI ativo por paciente;
  - sem exclusão de plano;
  - progresso pelas metas atingidas;
  - de 3 a 6 metas na geração e no máximo 10 por plano;
  - `appointmentId` opcional no PE.

### 8. O que o app precisa ajustar

- **Respostas de `POST` e `PUT /appointment`** agora vêm no mesmo formato do `GET`:
  - `id`, `educatorId`, `studentId`, `scheduledAt`, `observation`, `status`, `notifiedAt`,
    `type`, `durationMinutes` e `createdAt`;
  - antes vinham com campos prefixados, como `_scheduledAt` e `_status`. Se o app lê algum
    desses, precisa trocar.
- **`PUT /appointment/:id` passou a validar o corpo:** `scheduledAt` precisa ser ISO 8601 em UTC
  (`2026-11-03T13:00:00.000Z`). Horário com offset (`-03:00`) dá 400.
- **`guardianPhone` só aceita dígitos:** o app precisa tirar a máscara antes de enviar.
- **Troca de senha no perfil (G-49):** continua bloqueada. A troca de senha autenticada fica para
  a próxima entrega.

## Parte B — Conferência do app com o Swagger (2026-10-29)

Feita pelo orquestrador lendo o OpenAPI embutido em `/api-docs/swagger-ui-init.js` (70 rotas,
as mesmas do overview). Nenhuma rota foi chamada; só a documentação foi lida.

### 9. Divergências e pontos de atenção

| #   | Ponto                                                                                                                                                                                         | Impacto no app                                                                                                                     | Encaminhamento                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| D1  | **Segurança:** em `GET /student` e nas respostas de aluno, `educators` é uma lista de objetos `StudentEducator` com `id`, `name`, `email`, `createdAt`, `profession` e **`password`**         | O app não usa esse campo, mas a senha (ou o hash) de outros educadores trafega para qualquer cliente que lista alunos              | **Pedido urgente ao backend** (PEDIDOS-BACKEND §5, item 18). O app não guarda nem registra o campo (API-03) |
| D2  | `TaskAnswer.timeToAnswer` está descrito como **"Segundos"** no Swagger, mas a evidência da G-07 (2026-10-09) mostrou as médias do relatório em **ms**, e o app envia ms (`toApiTimeToAnswer`) | Se o backend passar a tratar o valor como segundos, os relatórios ficam 1000× maiores                                              | Pergunta ao backend (item 19); o app mantém ms até a resposta                                               |
| D3  | `PUT /educator/update-educator` responde com `EducatorEntity`, de campos prefixados com `_` (`_name`, `_contact`, `_profession`, `_photoUrl`) e **`_password`**                               | O app não deve ler a resposta: depois de salvar, recarrega `GET /educator/me`. A resposta também expõe a senha do próprio educador | Pedido ao backend (item 18); REC-02 recarrega o `/me`                                                       |
| D4  | `GET /anamnese/responses/:responseId` de outro educador devolve **401** `Unauthorized` (não 403); o `PUT` da mesma rota devolve 403 `UNAUTHORIZED`                                            | Um 401 nessa rota não pode deslogar o usuário                                                                                      | PAC-06 trata o 401 dessa rota como "sem acesso"; pergunta ao backend (item 20)                              |
| D5  | `GET`, `PUT` e `DELETE /appointment/:id`: id que não é UUID vira **500**; atendimento inexistente é **400 `NOT_FOUND`**; o `DELETE` responde o texto `OK`, sem JSON                           | O app só usa ids vindos da API; trata 400 `NOT_FOUND` como "não encontrado"                                                        | Registrado no contrato (PROJECT.md)                                                                         |
| D6  | O Swagger lista as rotas **sem barra final** (`/plan`, `/appointment`, `/student`), o overview e o contrato antigo usam `/plan/`, `/appointment/`, `/student/`                                | O Express aceita as duas formas por padrão                                                                                         | O app mantém a forma que já usa; as novas rotas usam a do Swagger                                           |
| D7  | `PlanSummary` traz **todos os campos do plano, menos `goals`**, mais `studentName` (o overview cita só alguns)                                                                                | Nenhum: o app usa um subconjunto                                                                                                   | Contrato registra o esquema do Swagger                                                                      |
| D8  | No Swagger, `Student` exige só `id`, `name`, `age`, `gender`, `educatorId`, `learningTopics` e `documents`; endereço, telefone e `createdAt` podem faltar em registros antigos                | O app não deve quebrar com esses campos ausentes                                                                                   | API-03 torna esses campos opcionais na leitura                                                              |
| D9  | `guardianName` e `guardianRelationship` têm só tamanho máximo no Swagger (o overview diz 1–100 e 1–50); vazio é tratado como ausente                                                          | Nenhum: o app manda vazio como "não informado"                                                                                     | —                                                                                                           |

### 10. Como isso entrou na documentação

- Este arquivo é a referência do contrato novo para os dispatches da Entrega 3 (as specs dos
  workers citam as seções). O registro rota a rota em
  [PROJECT.md](../PROJECT.md#parte-ii--referência-global-da-api) e o contrato de implementação
  dos planos (`docs/contracts/planos.md`) ficam para depois, a pedido do usuário (2026-10-29).
- Fichas e tarefas novas: nota no topo do [BACKLOG](BACKLOG.md); estado no [TRACKING](TRACKING.md).
