# Entrega 3 — Especificação para o backend

> O que o app precisa que o backend disponibilize na Entrega 3, com regras de negócio,
> validações, erros e critérios de aceite. Escrito em 2026-10-28 pelo orquestrador do app.
>
> **Status:** proposta do app. Os nomes de rotas e campos são **sugestões** que seguem as
> convenções atuais da API (§1); o backend pode mudá-los. O contrato final é registrado em
> [PROJECT.md](../PROJECT.md) pela tarefa PLN-00
> ([BACKLOG](BACKLOG.md#pln-00--contrato-do-domínio-de-planos)), e o app só implementa o que
> estiver lá. O resumo curto e a mensagem para enviar estão em
> [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md).

## 0. Resumo

| Prioridade | Item                                                    | Bloqueia no app                                                            | Seção |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------- | ----- |
| **P1**     | Domínio **Planos (PDI e PE)**: entidade, CRUD, revisão  | Lista, detalhe, salvar plano e aba Planos (PLN-01, PLN-03, PLN-04, PAC-04) | §2    |
| **P1**     | **Gerar rascunho de plano com IA** (sem persistir)      | Gerar plano (PLN-02)                                                       | §2.6  |
| P2         | **Sugestões da IA** para os planos                      | Sugestões e cartão da Início (PLN-05)                                      | §3    |
| P3         | Status, tipo e duração do atendimento                   | Nada (a Agenda omite esses campos)                                         | §4.1  |
| P3         | Vínculo da sessão com o conteúdo e o atendimento (G-06) | Nada (o app usa o caderno escolhido no aparelho)                           | §4.2  |
| P3         | Responsável do paciente                                 | Nada (o contato usa o telefone do paciente)                                | §4.3  |
| P3         | Papel/profissão do educador                             | Nada (o perfil omite o papel)                                              | §4.4  |
| P3         | Troca de senha autenticada (G-05)                       | Troca de senha no perfil (fora da Entrega 3, G-49)                         | §4.5  |
| P3         | Detalhe de grupo por id                                 | Nada (o app mostra "Grupo indisponível")                                   | §4.6  |
| P3         | Editar resposta de anamnese                             | Nada (correção exige nova resposta)                                        | §4.7  |
| P3         | Swagger completo                                        | Nada (ajuda a integração)                                                  | §4.8  |

P1 bloqueia o bloco de planos. P2 bloqueia só as sugestões. P3 melhora telas que já
funcionam sem ele.

## 1. Convenções (as mesmas da API atual)

- Express na Vercel, sem prefixo `/api` nem versão; JSON, exceto uploads (`multipart/form-data`).
- **Bearer JWT** em todas as rotas novas; o educador é sempre resolvido **do token**, nunca do
  corpo.
- Erros no formato `{ message }` ou `{ message, errors: [...] }` (validação Zod), com `message`
  em MAIÚSCULAS para regras de negócio (`PLAN_NOT_FOUND`). Rotas de IA: `500 { message:
'<CODE>', error }`.
- **Pedido para as rotas novas:** "não encontrado" como **404** (hoje algumas rotas antigas
  devolvem 500 para isso, e o app trata caso a caso).
- Datas e horas em ISO 8601 UTC (`2026-11-03T13:00:00.000Z`). Datas sem hora (vigência,
  revisão) em `AAAA-MM-DD`, interpretadas no fuso `America/Sao_Paulo`.
- Identificadores `uuid`.
- O app já usa **90 s de timeout** nas rotas de IA (G-46); a geração deve responder antes disso.
- **Dados de crianças:** nada de conteúdo de plano, anamnese ou observação em logs; enviar ao
  provedor de IA o mínimo necessário (§2.6, regra IA-05).

## 2. Domínio Planos (PDI e PE) — P1

### 2.1 Conceitos

- **PDI (Plano de Desenvolvimento Individual):** plano de médio prazo do paciente (3 a 6
  meses), com objetivo geral e metas mensuráveis. É o "PDI vigente" da ficha.
- **PE (Plano de Ensino da sessão):** plano curto para **uma sessão** (data), geralmente
  derivado do PDI vigente.
- **Meta:** objetivo específico e mensurável dentro do plano, com estado próprio.
- **Revisão:** registro datado de que o profissional reavaliou o plano, com nota e a próxima
  data de revisão.
- **Rascunho:** resultado da geração por IA, **não persistido**. Só vira plano quando o
  profissional salva.

### 2.2 Entidades

```ts
type PlanType = "PDI" | "PE";
type PlanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "DISCONTINUED";
type PlanSource = "AI" | "MANUAL";

interface Plan {
  id: string;
  educatorId: string; // do token
  studentId: string;
  type: PlanType;
  status: PlanStatus; // criado como ACTIVE
  source: PlanSource; // AI quando salvo a partir de um rascunho gerado
  title: string; // 1–120
  generalObjective: string; // 1–2000 ("Objetivo geral")
  professionalNotes?: string; // até 2000 ("Ajustes do profissional")
  focus?: string; // até 1000, o foco usado na geração
  consideredDifficulties: string[]; // 0–20 itens de 1–100; vêm de Student.learningTopics
  startDate: string; // AAAA-MM-DD
  endDate: string; // AAAA-MM-DD
  nextReviewDate?: string; // AAAA-MM-DD
  parentPlanId?: string; // só PE: o PDI de origem
  sessionDate?: string; // só PE: AAAA-MM-DD, obrigatório
  appointmentId?: string; // só PE, opcional: atendimento de origem
  goals: Goal[]; // ordenadas por `order`
  progress: PlanProgress; // calculado pelo servidor
  createdAt: string;
  updatedAt: string;
  closedAt?: string; // quando saiu de ACTIVE
}

interface Goal {
  id: string;
  order: number; // 0..n-1, sem buracos
  description: string; // 1–500
  successCriterion?: string; // até 500: como medir ("8 de 10 palavras lidas sem ajuda")
  status: GoalStatus; // criada como NOT_STARTED
  achievedAt?: string; // preenchido ao virar ACHIEVED
  updatedAt: string;
}

interface PlanProgress {
  totalGoals: number; // metas que contam (sem DISCONTINUED)
  achievedGoals: number;
  inProgressGoals: number;
  percent: number; // inteiro 0–100 (regra PL-09)
}

interface PlanReview {
  id: string;
  planId: string;
  reviewedAt: string; // ISO, do servidor
  note: string; // 1–2000
  nextReviewDate?: string; // AAAA-MM-DD
  goalStatuses: { goalId: string; status: GoalStatus }[]; // retrato das metas na revisão
}
```

O resumo para listas pode omitir `goals` e trazer só `progress` (§2.4, `GET /plan/`).

### 2.3 Regras de negócio

| ID    | Regra                                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PL-01 | **Propriedade.** O educador só cria, lê ou altera planos de pacientes atribuídos a ele (mesma regra de `STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR` do módulo `student`). Plano de outro educador: `403 UNAUTHORIZED`                                           |
| PL-02 | **Um PDI ativo por paciente.** Criar um PDI `ACTIVE` quando já existe outro: `409 ACTIVE_PDI_ALREADY_EXISTS`, com o `id` do existente no corpo (`{ message, activePlanId }`). Para trocar, o profissional encerra o anterior (PL-07) e cria o novo            |
| PL-03 | **PE pode ter vários por paciente** (um por sessão). `sessionDate` é obrigatório no PE e proibido no PDI. Se `parentPlanId` vier, deve ser um PDI do mesmo paciente: senão `400 INVALID_PARENT_PLAN`                                                          |
| PL-04 | **Vigência.** `endDate` > `startDate`; `nextReviewDate`, se vier, entre as duas (inclusive). No PE, `startDate` = `endDate` = `sessionDate` (o servidor pode preencher)                                                                                       |
| PL-05 | **Metas.** De 1 a 10 por plano; `order` único e contínuo. Salvar plano sem meta: `400 PLAN_WITHOUT_GOALS`                                                                                                                                                     |
| PL-06 | **Edição.** Só plano `ACTIVE` aceita edição de texto, metas e revisão. `COMPLETED` e `CANCELLED` são somente leitura: `409 PLAN_NOT_EDITABLE`                                                                                                                 |
| PL-07 | **Encerrar.** `ACTIVE` → `COMPLETED` (concluído) ou `CANCELLED` (interrompido), com `closedAt`. Não há volta para `ACTIVE`. **Não há exclusão física**: o histórico clínico é preservado                                                                      |
| PL-08 | **Estado da meta.** Qualquer transição entre os quatro estados é permitida enquanto o plano está `ACTIVE`. Virar `ACHIEVED` grava `achievedAt`; sair de `ACHIEVED` limpa `achievedAt`                                                                         |
| PL-09 | **Progresso.** `percent = round(100 × achievedGoals / totalGoals)`, em que `totalGoals` exclui `DISCONTINUED`. Com `totalGoals = 0`, `percent = 0`. **O app não calcula progresso** (AC-PAC-03-02 da Entrega 2)                                               |
| PL-10 | **Revisão.** Só em plano `ACTIVE`. Grava o retrato do estado das metas, atualiza `nextReviewDate` do plano quando informado e o `updatedAt`                                                                                                                   |
| PL-11 | **Editar metas.** A edição envia a lista completa: metas com `id` são atualizadas, sem `id` são criadas e as ausentes são removidas. Meta `ACHIEVED` não pode ser removida (`409 GOAL_ACHIEVED_CANNOT_BE_REMOVED`); para tirá-la da conta, use `DISCONTINUED` |
| PL-12 | **Rascunho não persiste.** A geração (§2.6) não grava nada. Salvar é sempre um `POST /plan/` explícito, com `source: 'AI'` quando vier de um rascunho                                                                                                         |
| PL-13 | **Paciente removido ou desatribuído.** Os planos continuam no banco, mas deixam de aparecer para o educador que perdeu o vínculo (PL-01)                                                                                                                      |

### 2.4 Rotas sugeridas

Todas com **Bearer**.

| Método e rota                 | Uso no app                             | Corpo / query                                                                                                                                                                                                                                                      | Resposta                                                               | Erros                                                                                                                                          |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /plan/generate`         | Gerar rascunho (PLN-02)                | §2.6                                                                                                                                                                                                                                                               | `200 PlanDraft`                                                        | §2.6                                                                                                                                           |
| `POST /plan/`                 | Salvar (PLN-03)                        | `studentId`, `type`, `title`, `generalObjective`, `professionalNotes?`, `focus?`, `consideredDifficulties?`, `startDate`, `endDate`, `nextReviewDate?`, `parentPlanId?`, `sessionDate?`, `appointmentId?`, `source`, `goals: { description, successCriterion? }[]` | `201 Plan`                                                             | `400` validação, `PLAN_WITHOUT_GOALS`, `INVALID_PARENT_PLAN`, `INVALID_DATES`; `403`; `404 STUDENT_NOT_FOUND`; `409 ACTIVE_PDI_ALREADY_EXISTS` |
| `GET /plan/`                  | Lista (PLN-01) e aba da ficha (PAC-04) | Query opcional: `studentId`, `status`, `type`                                                                                                                                                                                                                      | `200 PlanSummary[]` (sem `goals`, com `progress` e o nome do paciente) | `400`                                                                                                                                          |
| `GET /plan/:id`               | Detalhe (PLN-04)                       | —                                                                                                                                                                                                                                                                  | `200 Plan` com `goals`                                                 | `403`; `404 PLAN_NOT_FOUND`                                                                                                                    |
| `PUT /plan/:id`               | Editar (PLN-04)                        | Todos opcionais: `title`, `generalObjective`, `professionalNotes`, `endDate`, `nextReviewDate`, `goals` (lista completa, PL-11)                                                                                                                                    | `200 Plan`                                                             | `400`; `403`; `404`; `409 PLAN_NOT_EDITABLE`, `GOAL_ACHIEVED_CANNOT_BE_REMOVED`                                                                |
| `PUT /plan/:id/goals/:goalId` | Mudar estado de uma meta (PLN-04)      | `status: GoalStatus`                                                                                                                                                                                                                                               | `200 Plan` (com `progress` recalculado)                                | `400`; `403`; `404 PLAN_NOT_FOUND`, `GOAL_NOT_FOUND`; `409 PLAN_NOT_EDITABLE`                                                                  |
| `POST /plan/:id/reviews`      | Registrar revisão (PLN-04)             | `note`, `nextReviewDate?`                                                                                                                                                                                                                                          | `201 PlanReview`                                                       | `400`; `403`; `404`; `409 PLAN_NOT_EDITABLE`                                                                                                   |
| `GET /plan/:id/reviews`       | Histórico de revisões (PLN-04)         | —                                                                                                                                                                                                                                                                  | `200 PlanReview[]` (mais recente primeiro)                             | `403`; `404`                                                                                                                                   |
| `PUT /plan/:id/status`        | Encerrar (PLN-04)                      | `status: 'COMPLETED' \| 'CANCELLED'`                                                                                                                                                                                                                               | `200 Plan`                                                             | `400`; `403`; `404`; `409 PLAN_NOT_EDITABLE`                                                                                                   |

```ts
interface PlanSummary {
  id: string;
  studentId: string;
  studentName: string; // evita o app buscar a lista de pacientes para cada item
  type: PlanType;
  status: PlanStatus;
  title: string;
  startDate: string;
  endDate: string;
  nextReviewDate?: string;
  progress: PlanProgress;
  updatedAt: string;
}
```

Ordenação de `GET /plan/`: `ACTIVE` primeiro, depois por `updatedAt` decrescente. Sem
paginação nesta entrega (volume baixo por educador); se houver, que seja opcional.

### 2.5 Integração com o resto da API (opcional, desejável)

- `GET /student/` (ou uma rota nova) com o **PDI vigente** resumido por paciente
  (`activePdi: { id, title, endDate, progress }`), para a ficha mostrar "PDI vigente" sem
  outra chamada. Sem isso, o app usa `GET /plan/?studentId=…&type=PDI&status=ACTIVE`.

### 2.6 Gerar rascunho com IA — `POST /plan/generate`

**Entrada:**

| Campo                        | Tipo          | Regra                                                                              |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `studentId`                  | uuid          | Obrigatório; PL-01                                                                 |
| `type`                       | `PDI` \| `PE` | Obrigatório                                                                        |
| `focus`                      | string        | 1–1000. Ex.: "Leitura de sílabas complexas e compreensão de frases curtas"         |
| `consideredDifficulties`     | string[]      | 1–20 itens de 1–100 (o app pré-marca `Student.learningTopics`)                     |
| `durationMonths`             | `3` \| `6`    | Obrigatório no PDI; ignorado no PE                                                 |
| `parentPlanId`               | uuid          | Opcional no PE: usa as metas do PDI como base                                      |
| `sessionDate`                | `AAAA-MM-DD`  | Obrigatório no PE                                                                  |
| `includeAnamnesisTemplateId` | uuid          | Opcional: inclui a anamnese desse modelo no contexto, como já faz a análise por IA |

**Contexto que o servidor monta** (o app não envia): idade e gênero do paciente, dificuldades
consideradas, métricas da análise (`GET …/analysis/student/:studentId`: acerto geral e por
categoria) das sessões recentes, observações das últimas sessões e, se pedido, a anamnese. No
PE, também as metas do PDI de origem.

**Saída** (`200`):

```ts
interface PlanDraft {
  type: PlanType;
  title: string; // até 120
  generalObjective: string; // até 2000
  goals: { description: string; successCriterion?: string }[]; // 3 a 6 metas
  suggestedStartDate: string; // AAAA-MM-DD (hoje, no fuso de SP)
  suggestedEndDate: string; // start + durationMonths (PDI) ou sessionDate (PE)
  suggestedNextReviewDate?: string;
  rationale?: string; // até 1000: por que essas metas (mostrado ao profissional)
}
```

**Regras da IA:**

| ID    | Regra                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IA-01 | **Não persiste nada** (PL-12)                                                                                                                                   |
| IA-02 | Texto em **português do Brasil**, linguagem profissional e acessível                                                                                            |
| IA-03 | De **3 a 6 metas**, cada uma específica, observável e mensurável, com `successCriterion` quando possível                                                        |
| IA-04 | **Sem diagnóstico** (não afirmar transtornos) e sem promessa de resultado; o texto é sugestão para o profissional revisar                                       |
| IA-05 | **Minimização de dados:** não enviar ao provedor de IA o nome, o endereço, o telefone nem documentos do paciente; idade, gênero, dificuldades e métricas bastam |
| IA-06 | Resposta em menos de **60 s** no caso típico (o app corta em 90 s)                                                                                              |
| IA-07 | Saída inválida do modelo (JSON quebrado, sem metas, mais de 6 metas) não chega ao app: o servidor tenta corrigir ou devolve `AI_INVALID_OUTPUT`                 |
| IA-08 | Sem sessões registradas, gera com base no foco, nas dificuldades e na anamnese (se houver), e diz isso em `rationale`                                           |

**Erros:** `400` validação; `403`; `404 STUDENT_NOT_FOUND`, `PLAN_NOT_FOUND` (parent);
`429 AI_RATE_LIMITED` (se houver limite); `500 { message: 'AI_GENERATION_FAILED', error }`
(provedor indisponível) e `500 { message: 'AI_INVALID_OUTPUT', error }`.

### 2.7 Critérios de aceite do backend (como o app vai validar)

| ID       | Critério                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------- |
| BE-PL-01 | Criar um PDI e um PE para o mesmo paciente; listar por `studentId` devolve os dois com `progress`     |
| BE-PL-02 | Segundo PDI `ACTIVE` para o mesmo paciente devolve `409 ACTIVE_PDI_ALREADY_EXISTS` com `activePlanId` |
| BE-PL-03 | Mudar uma meta para `ACHIEVED` recalcula `progress.percent` conforme PL-09                            |
| BE-PL-04 | Plano `COMPLETED` recusa edição, meta e revisão com `409 PLAN_NOT_EDITABLE`                           |
| BE-PL-05 | Plano de outro educador devolve `403` em leitura e escrita                                            |
| BE-PL-06 | `POST /plan/generate` não cria registro (a lista não muda) e devolve de 3 a 6 metas em português      |
| BE-PL-07 | Plano inexistente devolve `404 PLAN_NOT_FOUND` (não 500)                                              |
| BE-PL-08 | As rotas aparecem no Swagger (`/api-docs/`) com corpo, resposta e erros                               |

## 3. Sugestões da IA — P2 (segunda leva)

**Para que serve:** a IA propõe ajustes nos planos ativos a partir das sessões recentes, e o
profissional aceita ou descarta. A Início mostra "N sugestões da IA para revisar".

```ts
type SuggestionKind =
  "UPDATE_GOAL_STATUS" | "ADD_GOAL" | "REWRITE_GOAL" | "SCHEDULE_REVIEW";
type SuggestionStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

interface PlanSuggestion {
  id: string;
  planId: string;
  studentId: string;
  studentName: string;
  goalId?: string; // para UPDATE_GOAL_STATUS e REWRITE_GOAL
  kind: SuggestionKind;
  text: string; // explicação para o profissional, até 500
  proposedChange: {
    // o que será aplicado ao aceitar
    status?: GoalStatus; // UPDATE_GOAL_STATUS
    description?: string; // ADD_GOAL, REWRITE_GOAL
    successCriterion?: string;
    nextReviewDate?: string; // SCHEDULE_REVIEW
  };
  status: SuggestionStatus;
  createdAt: string;
  resolvedAt?: string;
}
```

| ID    | Regra                                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SG-01 | Sugestões só para planos `ACTIVE` do educador (PL-01). Quando o plano sai de `ACTIVE`, as pendentes viram `DISMISSED`                                                                                                                            |
| SG-02 | **Quando gerar:** ao encerrar uma sessão (`POST /task-notebook-session/finish`) de paciente com PDI ativo, de forma assíncrona (não atrasa o `finish`). No máximo 3 pendentes por plano                                                          |
| SG-03 | **Aceitar** aplica `proposedChange` ao plano numa única transação (mesmas regras de PL-06, PL-08 e PL-11) e marca `ACCEPTED`. Se a meta não existe mais ou o plano não está ativo: `409 SUGGESTION_NOT_APPLICABLE` e a sugestão vira `DISMISSED` |
| SG-04 | **Descartar** marca `DISMISSED`; não volta                                                                                                                                                                                                       |
| SG-05 | Aceitar ou descartar uma sugestão já resolvida: `409 SUGGESTION_ALREADY_RESOLVED`                                                                                                                                                                |

| Método e rota                          | Uso              | Resposta               | Erros                                                                                             |
| -------------------------------------- | ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /plan/suggestions?status=PENDING` | Lista e contagem | `200 PlanSuggestion[]` | `400`                                                                                             |
| `POST /plan/suggestions/:id/accept`    | Aceitar          | `200 Plan` atualizado  | `403`; `404 SUGGESTION_NOT_FOUND`; `409 SUGGESTION_NOT_APPLICABLE`, `SUGGESTION_ALREADY_RESOLVED` |
| `POST /plan/suggestions/:id/dismiss`   | Descartar        | `200 PlanSuggestion`   | `403`; `404`; `409 SUGGESTION_ALREADY_RESOLVED`                                                   |

## 4. Pequenos pedidos — P3

Nenhuma tela da Entrega 3 depende deles; cada um melhora uma tela que já funciona sem ele.

### 4.1 Atendimento: status, tipo, duração e conflito

Hoje `PUT /appointment/:id` aceita só `scheduledAt` e `observation`, e o app só consegue
**excluir** (o que apaga o histórico).

| ID    | Pedido / regra                                                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AT-01 | `PUT /appointment/:id` aceita `status`. Transições: `PENDING` → `COMPLETED` ou `CANCELLED`; `CANCELLED` → `PENDING` (reativar). `COMPLETED` é final. Transição inválida: `409 INVALID_STATUS_TRANSITION` |
| AT-02 | Atendimento `CANCELLED` ou `COMPLETED` **não** é notificado pelo job (`/appointment/notify`) e não pode ser remarcado (`409 APPOINTMENT_NOT_EDITABLE`)                                                   |
| AT-03 | Campos novos opcionais em `POST` e `PUT`: `type` (texto de 1 a 50, ex. "Psicopedagogia", "Avaliação") e `durationMinutes` (inteiro de 15 a 240; padrão 50)                                               |
| AT-04 | **Conflito:** com `durationMinutes`, criar ou remarcar sobre outro atendimento `PENDING` do mesmo educador no mesmo intervalo devolve `409 APPOINTMENT_CONFLICT` com o `id` do conflitante               |
| AT-05 | (Desejável) `POST /task-notebook-session/start` aceita `appointmentId` opcional; ao encerrar a sessão, o atendimento vira `COMPLETED` automaticamente                                                    |

### 4.2 Sessão ligada ao conteúdo (G-06)

Hoje `POST /task-notebook-session/start` recebe só `studentId` e `name`, mas o `answer` valida
`TASK_NOT_IN_NOTEBOOK` e o `start` documenta `404 NOTEBOOK_NOT_FOUND`. O app não sabe como a
sessão se liga ao caderno e guarda a escolha só no aparelho.

| ID    | Pedido / regra                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| SE-01 | `start` aceita o conteúdo da sessão: `content: { kind: 'notebook' \| 'group' \| 'task', id }` (ou só `taskNotebookId`, se o backend preferir) |
| SE-02 | A sessão devolvida e as listagens (`GET …/student/:studentId`) trazem esse conteúdo, para retomar a sessão em outro aparelho                  |
| SE-03 | `answer` valida a tarefa contra o conteúdo da sessão (`TASK_NOT_IN_NOTEBOOK`)                                                                 |
| SE-04 | Responder: hoje o `start` funciona sem caderno — isso continua valendo (compatibilidade) ou passa a ser obrigatório?                          |

### 4.3 Responsável do paciente

| ID    | Pedido / regra                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| PA-01 | `Student` ganha `guardianName` (1–100), `guardianPhone` (7–15, só dígitos) e `guardianRelationship` (opcional, 1–50, ex. "Mãe") |
| PA-02 | Opcionais em `POST /student/create` e `PUT /student/update/:id` (multipart, como os demais)                                     |
| PA-03 | O contato do app usa `guardianPhone` quando existir; senão, `phonenumber`                                                       |

### 4.4 Papel do educador

| ID    | Pedido / regra                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| ED-01 | `Educator` ganha `profession` (3–100, texto livre, ex. "Psicopedagoga"); `PUT /educator/update-educator` aceita `newProfession` |

### 4.5 Troca de senha autenticada (G-05, G-49)

Hoje `POST /educator/update-password` é **público** e troca a senha só com `email` e
`newPassword`: qualquer pessoa que saiba o e-mail troca a senha. É um problema de segurança,
não só do app.

| ID    | Pedido / regra                                                                                                                                                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SN-01 | **Recuperação:** `update-password` passa a exigir o código enviado por `PUT /educator/generate-token` (`email`, `token`, `newPassword`). Código de uso único, com validade curta (ex. 15 min) e limite de tentativas. Erros: `400 INVALID_TOKEN`, `EXPIRED_TOKEN`, `PASSWORD_SAME_AS_OLD` |
| SN-02 | **Troca logada:** rota com Bearer que exige `currentPassword` e `newPassword` (6–100). Erros: `400 INVALID_CURRENT_PASSWORD`, `PASSWORD_SAME_AS_OLD`                                                                                                                                      |
| SN-03 | Depois da troca, tokens antigos continuam válidos até expirar? Responder (o app desloga o usuário se for o caso)                                                                                                                                                                          |

### 4.6 Detalhe de grupo por id

| ID    | Pedido / regra                                                                                                                                             |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GR-01 | `GET /task-group/:id` devolve o grupo se ele for do educador **ou** estiver num caderno do educador. Senão, `403`; inexistente, `404 TASK_GROUP_NOT_FOUND` |

### 4.7 Editar resposta de anamnese

| ID    | Pedido / regra                                                                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AN-01 | `PUT /anamnese/responses/:responseId` com o mesmo corpo de `answers` e as mesmas validações da criação; só o educador dono. Guarda `updatedAt` e mantém `answeredAt` |

### 4.8 Swagger

| ID    | Pedido / regra                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| SW-01 | O Swagger público lista 18 rotas; o app usa mais de 40. Incluir todas, com corpo, resposta e erros, inclusive as novas desta especificação |

## 5. Decisões de produto para confirmar

O app propôs uma regra em cada ponto abaixo; confirme ou mude antes de implementar:

1. **Um PDI ativo por paciente** (PL-02). Alternativa: vários PDI ativos por área (leitura,
   escrita).
2. **Sem exclusão de plano**, só encerrar (PL-07). Alternativa: excluir enquanto não tiver
   revisão.
3. **Progresso por metas atingidas** (PL-09). Alternativa: percentual informado pelo
   profissional por meta.
4. **3 a 6 metas na geração** e no máximo 10 por plano (IA-03, PL-05).
5. **Sugestões geradas ao encerrar a sessão** (SG-02). Alternativa: só sob demanda, com um
   botão "Pedir sugestões".
6. **PE ligado ao atendimento** é opcional (`appointmentId`). Se o PE for sempre de um
   atendimento, ele passa a ser obrigatório.

## 6. Como o app integra

1. O backend publica as rotas (homologação ou produção) e responde as decisões do §5.
2. O orquestrador do app registra o contrato real em `docs/PROJECT.md` e em
   `docs/contracts/planos.md` (PLN-00), ajusta as fichas e só então dispara PLN-01 a PLN-04.
3. Cada tela é testada com mocks fiéis ao contrato e depois contra o backend real, com
   evidência por rota no TRACKING.
4. Diferenças entre esta proposta e o contrato real não são "corrigidas" no app: o app segue
   o contrato.

## 7. Histórico

- 2026-10-28: primeira versão, a pedido do usuário, depois da escolha do domínio de planos
  (G-48) e da aprovação de G-47, G-49, G-50 e G-51.
