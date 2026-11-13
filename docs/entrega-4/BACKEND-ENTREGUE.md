# Entrega 4: o que o backend entregou

> Para o time do app (React Native). Escrito em 2026-11-12 a partir do código da `main`
> (commit `e468abe`), que já está em produção em `https://labirinto-do-saber.vercel.app`.
> Swagger: `https://labirinto-do-saber.vercel.app/api-docs/`.
> Os IDs (SN, EV, AV, IN, AS, RP, NT, PP) são os da especificação que o app mandou.
> Texto recebido do backend em 2026-11-12 e registrado aqui pela API-04. As decisões do app sobre
> as diferenças estão na [seção final](#7-decisões-do-app-sobre-as-diferenças).

## ⚠️ Quebra o app hoje

Ajuste antes de qualquer outra coisa:

1. **`PUT /educator/generate-token`**: o corpo agora é `{ "email" }` (antes `educatorEmail`). A
   resposta é sempre `200 { "message": "TOKEN_SENT" }`, exista ou não a conta. O antigo
   `404 EDUCATOR_NOT_FOUND` não existe mais.
2. **`POST /educator/update-password`**: exige `token` (o código de 6 dígitos do e-mail). Sem ele, a
   resposta é 400 de validação. O antigo `EDUCATOR_NOT_FOUND` virou `400 INVALID_TOKEN`.
3. **Tokens antigos caem depois de uma troca de senha.** Depois de `update-password` ou
   `change-password`, todo JWT emitido antes recebe `401 { "message": "Invalid or expired token" }`,
   inclusive em outros aparelhos. Depois de `change-password`, use o token novo que vem na resposta.
   Depois de `update-password`, mande o usuário para o login.

O resto da entrega só acrescenta rotas e campos. Não mudou o formato de `GET /appointment`, das
sessões nem do perfil do educador.

---

## 1. Resumo por leva

Todas as levas estão em produção.

| PR  | Leva                            | O que entrou                                                                                                                                                                      | IDs                                |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| #30 | Senha + evolução                | Código de recuperação seguro, `verify-token`, troca de senha logada, invalidação de JWT. Evolução da sessão: contexto, CRUD sem exclusão, pendentes e `evolutionId` nas sessões   | SN-01 a SN-08, EV-01 a EV-12       |
| #31 | Escalas                         | Catálogo (`/scale-template`) e aplicações (`/scale-application`) com escore e faixa no servidor, rascunho, conclusão e exclusão. Só a escala fictícia `DEMO-RASTREIO` no catálogo | AV-01 a AV-10                      |
| #32 | IA clínica                      | Sugestão para a próxima sessão, insight da escala e síntese da anamnese (com `summaryOutdated`)                                                                                   | §3.6, IN-01 a IN-04, AS-01 a AS-04 |
| #33 | Relatórios                      | `options`, geração com conteúdo congelado e síntese da IA, histórico, registro de envio e exclusão                                                                                | RP-01 a RP-08                      |
| #34 | Notificações + pequenos pedidos | Notificações no app geradas por um job diário. `timeToAnswer` em ms, `REWRITE_GOAL` repetida descartada, `GET /appointment?from&to`, Swagger completo                             | NT-01 a NT-05, PP-01 a PP-04       |

---

## 2. Convenções comuns

- **Auth.** Todas as rotas novas exigem `Authorization: Bearer <jwt>`, menos `generate-token`,
  `verify-token` e `update-password`. O educador sempre vem do token, nunca do corpo. Respostas 401:
  - `{ "message": "Missing or invalid token" }`: sem header ou fora do formato `Bearer`;
  - `{ "message": "Invalid or expired token" }`: JWT inválido, vencido ou anterior à última troca de
    senha;
  - `{ "message": "Educator not found" }`: o educador do token não existe mais.
- **Formato de erro.**
  - Regra de negócio: `{ "message": "CODIGO" }`.
  - Validação (Zod): `400 { "message": "Bad Request", "errors": [{ "message": string, "field": string }] }`.
    `field` é o primeiro nível do caminho: para `criteria[2].description`, vem `"criteria"`.
  - Erro de IA: `500 { "message": "AI_GENERATION_FAILED" | "AI_INVALID_OUTPUT", "error": "Error not specified." }`.
  - Exceção não tratada: `500 { "message": "An unexpected error occurred", "error": "..." }`.
- **Propriedade.** O dono de um paciente é `Student.educatorId`. Evolução, aplicação de escala e
  relatório de paciente de outro educador respondem `403 { "message": "UNAUTHORIZED" }`. Vale o dono
  **atual**: se o paciente mudar de educador, o histórico vai junto. A exceção é a síntese da anamnese
  (ver §3.5).
- **Inexistente.** 404 com código próprio (`EVOLUTION_NOT_FOUND`, `APPLICATION_NOT_FOUND` etc.). Um id
  de **path** que não é UUID também dá 404 com o mesmo código. Um UUID inválido em **corpo ou query**
  dá 400 de validação.
- **Datas.**
  - Sem hora: string `AAAA-MM-DD`, com o dia calculado em `America/Sao_Paulo`. Exemplos:
    `sessionDate`, `period.from/to`, `from/to` da agenda.
  - Com hora: ISO 8601 em UTC (`2026-11-12T13:00:00.000Z`).
- **Opcionais.** Campos sem valor **não aparecem** no JSON (nada de `null`). As exceções são campos
  antigos que já vinham `null`, como `observation` no relatório da sessão.
- **IA.** Cada chamada ao Gemini tem 2 tentativas de até 40 s cada, com um intervalo curto entre elas.
  A segunda só acontece em erro transitório (timeout, 429, 5xx). O pior caso cabe no corte de 90 s do
  app. Nenhum nome, endereço, telefone, documento ou dado de responsável vai ao provedor; vão só
  idade e gênero do paciente. Saída inválida vira `500 AI_INVALID_OUTPUT`. Os textos são cortados no
  limite, sem partir palavra.

---

## 3. Contratos

### 3.1 Senha

#### `PUT /educator/generate-token` (público)

Envia por e-mail um código de 6 dígitos.

```ts
// corpo
{
  email: string;
} // e-mail válido
// 200
{
  message: "TOKEN_SENT";
}
```

| Status | message                  | Quando                                             |
| ------ | ------------------------ | -------------------------------------------------- |
| 400    | `Bad Request` + `errors` | e-mail ausente ou inválido                         |
| 429    | `TOO_MANY_REQUESTS`      | 4º pedido para a mesma conta numa janela de 15 min |

#### `POST /educator/verify-token` (público)

Confere o código **sem consumir**, para o app avançar de tela.

```ts
// corpo
{
  email: string;
  token: string;
} // token: exatamente 6 dígitos
// 200
{
  valid: true;
}
```

| Status | message                  | Quando                                                     |
| ------ | ------------------------ | ---------------------------------------------------------- |
| 400    | `Bad Request` + `errors` | e-mail inválido ou token fora do formato `^\d{6}$`         |
| 400    | `INVALID_TOKEN`          | código errado, já usado, nunca pedido, ou e-mail sem conta |
| 400    | `EXPIRED_TOKEN`          | passou de 15 min                                           |
| 429    | `TOO_MANY_ATTEMPTS`      | 5 erros com este código (inclusive o 5º). Peça outro       |

#### `POST /educator/update-password` (público)

```ts
// corpo
{
  email: string;
  token: string;
  newPassword: string;
} // token 6 dígitos; newPassword 6–100
// 200: sem corpo JSON (o Express responde o texto "OK")
```

| Status | message                  | Quando                                                                         |
| ------ | ------------------------ | ------------------------------------------------------------------------------ |
| 400    | `Bad Request` + `errors` | campo ausente ou inválido, inclusive sem `token`                               |
| 400    | `INVALID_TOKEN`          | código errado, já usado, nunca pedido, ou e-mail sem conta                     |
| 400    | `EXPIRED_TOKEN`          | código vencido                                                                 |
| 400    | `PASSWORD_SAME_AS_OLD`   | nova senha igual à atual. O código **não** é gasto; dá para tentar outra senha |
| 429    | `TOO_MANY_ATTEMPTS`      | 5 erros com este código                                                        |

#### `PUT /educator/change-password` (Bearer)

```ts
// corpo
{
  currentPassword: string;
  newPassword: string;
} // currentPassword ≥ 1; newPassword 6–100
// 200
{
  token: string;
} // JWT novo: substitua o atual
```

| Status | message                    | Quando                      |
| ------ | -------------------------- | --------------------------- |
| 400    | `Bad Request` + `errors`   | validação                   |
| 400    | `INVALID_CURRENT_PASSWORD` | senha atual errada          |
| 400    | `PASSWORD_SAME_AS_OLD`     | nova igual à atual          |
| 401    | ver §2                     | sem token ou token inválido |

---

### 3.2 Evolução da sessão (`/session-evolution`, Bearer)

#### Tipos

```ts
type CriterionResult = "ACHIEVED" | "PARTIAL" | "NOT_ACHIEVED" | "NOT_OBSERVED";
type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "DISCONTINUED";

interface EvolutionCriterion {
  id: string; // gerado pelo servidor; muda quando a lista é reenviada no PUT
  goalId?: string; // ausente = critério livre
  description: string;
  successCriterion?: string;
  attempts?: number;
  successes?: number;
  result: CriterionResult;
  note?: string;
}

interface SessionEvolution {
  id: string;
  sessionId: string;
  studentId: string;
  educatorId: string;
  appointmentId?: string; // herdado da sessão
  planId?: string;
  planType?: "PDI" | "PE";
  planTitle?: string; // retrato do título no momento da criação
  sessionDate: string; // AAAA-MM-DD do startedAt da sessão
  durationMinutes?: number; // finishedAt − startedAt, arredondado
  criteria: EvolutionCriterion[];
  descriptiveRecord: string;
  nextSessionSuggestion?: string;
  goalUpdates: { goalId: string; status: GoalStatus }[];
  createdAt: string;
  updatedAt: string;
}

interface SessionEvolutionSummary {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  sessionDate: string;
  planTitle?: string;
  criteriaCount: number;
  achievedCount: number; // critérios ACHIEVED
  excerpt: string; // 200 primeiros caracteres do registro
  createdAt: string;
}

interface EvolutionContext {
  session: {
    id: string;
    studentId: string;
    studentName: string;
    name: string;
    startedAt: string;
    finishedAt: string;
    durationMinutes: number;
    appointmentId?: string;
    answeredCount: number;
    correctCount: number;
  };
  plan?: { id: string; type: "PDI" | "PE"; title: string }; // ausente: nenhum plano ativo
  suggestedCriteria: {
    goalId: string;
    description: string;
    successCriterion?: string;
    goalStatus: GoalStatus; // só NOT_STARTED e IN_PROGRESS, na ordem das metas
  }[];
  existingEvolutionId?: string;
}

interface PendingEvolution {
  sessionId: string;
  studentId: string;
  studentName: string;
  sessionName: string;
  finishedAt: string;
  appointmentId?: string;
}
```

Corpo de critério (`EvolutionCriterionInput`, usado no POST, no PUT e na sugestão de IA):

| Campo              | Tipo              | Regra                                                                  |
| ------------------ | ----------------- | ---------------------------------------------------------------------- |
| `goalId`           | UUID              | opcional; precisa ser meta do plano da evolução                        |
| `description`      | string            | obrigatório, 1–500                                                     |
| `successCriterion` | string            | até 500                                                                |
| `attempts`         | inteiro           | 0–100                                                                  |
| `successes`        | inteiro           | 0–100, ≤ `attempts`, e exige `attempts` (senão `400 INVALID_ATTEMPTS`) |
| `result`           | `CriterionResult` | obrigatório                                                            |
| `note`             | string            | até 500                                                                |

#### `GET /session-evolution/context/:sessionId`

Monta a tela: dados da sessão, plano escolhido (EV-12) e critérios sugeridos. Responde
`200 EvolutionContext`.

| Status | message                                                       |
| ------ | ------------------------------------------------------------- |
| 403    | `UNAUTHORIZED`                                                |
| 404    | `SESSION_NOT_FOUND` (também id não-UUID), `STUDENT_NOT_FOUND` |
| 409    | `SESSION_NOT_FINISHED`                                        |

#### `POST /session-evolution/`

```ts
// corpo
{
  sessionId: string;                 // UUID, obrigatório
  planId?: string;                   // UUID; envie o context.plan.id. Sem planId, a evolução fica sem plano
  criteria: EvolutionCriterionInput[]; // obrigatório, 0 a 20 (pode ser [])
  descriptiveRecord: string;         // 1–5000 (com trim)
  nextSessionSuggestion?: string;    // até 2000
  goalUpdates?: { goalId: string; status: GoalStatus }[]; // até 10, sem goalId repetido
}
// 201 SessionEvolution
```

| Status | message                                                | Quando                                                                                                                |
| ------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 400    | `Bad Request` + `errors`                               | validação                                                                                                             |
| 400    | `INVALID_PLAN`                                         | `planId` inexistente, de outro paciente ou educador, ou plano encerrado sem `goalUpdates`; `goalUpdates` sem `planId` |
| 400    | `GOAL_NOT_IN_PLAN`                                     | `goalId` (critério ou update) fora do plano. Inclui `goalId` em critério sem `planId`                                 |
| 400    | `INVALID_ATTEMPTS`                                     | `successes > attempts` ou `successes` sem `attempts`                                                                  |
| 403    | `UNAUTHORIZED`                                         | paciente de outro educador                                                                                            |
| 404    | `SESSION_NOT_FOUND`, `STUDENT_NOT_FOUND`               |                                                                                                                       |
| 409    | `{ message: "EVOLUTION_ALREADY_EXISTS", evolutionId }` | a sessão já tem evolução                                                                                              |
| 409    | `SESSION_NOT_FINISHED`                                 | sessão aberta                                                                                                         |
| 409    | `PLAN_NOT_EDITABLE`                                    | plano encerrado **com** `goalUpdates`                                                                                 |

#### `GET /session-evolution/`

| Query        | Tipo                                                           | Padrão                         |
| ------------ | -------------------------------------------------------------- | ------------------------------ |
| `studentId`  | UUID                                                           | todos os pacientes do educador |
| `from`, `to` | `AAAA-MM-DD`, filtro em `sessionDate`, inclusivos; `from ≤ to` | —                              |
| `limit`      | 1–100                                                          | 50                             |

`200 SessionEvolutionSummary[]`, por `sessionDate` desc. Erros: 400 validação; 403 `UNAUTHORIZED` e
404 `STUDENT_NOT_FOUND` (com `studentId`).

#### `GET /session-evolution/pending`

Query `days` (1–90, padrão 30). Responde `200 PendingEvolution[]`: sessões finalizadas nos últimos
`days` × 24 h, sem evolução, de pacientes que ainda são do educador. Ordem por `finishedAt` desc.
Erro: 400 validação.

#### `GET /session-evolution/:id`

`200 SessionEvolution`. Erros: 403 `UNAUTHORIZED`; 404 `EVOLUTION_NOT_FOUND` (também id não-UUID),
`STUDENT_NOT_FOUND`.

#### `PUT /session-evolution/:id`

Todos os campos são opcionais; campo ausente fica como está.

```ts
{
  criteria?: EvolutionCriterionInput[];  // lista COMPLETA (substitui; ids novos)
  descriptiveRecord?: string;            // 1–5000; também atualiza a observação da sessão
  nextSessionSuggestion?: string;        // até 2000; "" limpa
  goalUpdates?: { goalId: string; status: GoalStatus }[]; // substitui a lista gravada
}
// 200 SessionEvolution
```

| Status | message                                    | Quando                                                            |
| ------ | ------------------------------------------ | ----------------------------------------------------------------- |
| 400    | `Bad Request` + `errors`                   | validação                                                         |
| 400    | `INVALID_PLAN`                             | `goalUpdates` em evolução sem plano, ou plano de outro educador   |
| 400    | `GOAL_NOT_IN_PLAN`, `INVALID_ATTEMPTS`     | como no POST                                                      |
| 403    | `UNAUTHORIZED`                             |                                                                   |
| 404    | `EVOLUTION_NOT_FOUND`, `STUDENT_NOT_FOUND` |                                                                   |
| 409    | `PLAN_NOT_EDITABLE`                        | o plano gravado foi encerrado e `goalUpdates` mudaria alguma meta |

#### `POST /session-evolution/next-session-suggestion` (IA, não grava nada)

```ts
// corpo
{
  sessionId: string;                    // UUID; sessão finalizada
  criteria?: EvolutionCriterionInput[]; // o que já está na tela
  descriptiveRecord?: string;           // até 5000
}
// 200
{ suggestion: string; rationale?: string } // suggestion até 1000, rationale até 500
```

O servidor também usa as metas do plano escolhido (EV-12), o acerto da sessão e as 3 últimas
evoluções do paciente.

| Status | message                                     |
| ------ | ------------------------------------------- |
| 400    | `Bad Request` + `errors`                    |
| 403    | `UNAUTHORIZED`                              |
| 404    | `SESSION_NOT_FOUND`, `STUDENT_NOT_FOUND`    |
| 409    | `SESSION_NOT_FINISHED`                      |
| 500    | `AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT` |

---

### 3.3 Escalas: catálogo (`/scale-template`, Bearer)

```ts
type ScaleRespondent = "PROFESSIONAL" | "GUARDIAN" | "TEACHER";
type BandSeverity = "LOW" | "MODERATE" | "HIGH";

interface ScaleTemplate {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string;
  instructions: string;
  respondent: ScaleRespondent;
  ageRange?: { min: number; max: number };
  estimatedMinutes: number;
  options: { value: number; label: string }[]; // 2 a 7
  items: { id: string; order: number; text: string; subscaleCode?: string }[];
  subscales: { code: string; name: string }[];
  scoring: {
    method: "SUM" | "MEAN";
    bands: {
      subscaleCode?: string;
      min: number;
      max: number;
      label: string;
      severity: BandSeverity;
    }[];
    // sem subscaleCode = faixa do escore total
  };
  disclaimer: string;
  reference: string;
  active: boolean;
}

interface ScaleTemplateSummary {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string;
  respondent: ScaleRespondent;
  ageRange?: { min: number; max: number };
  estimatedMinutes: number;
  itemCount: number;
}
```

- `GET /scale-template/`: `200 ScaleTemplateSummary[]`. Traz a maior versão de cada escala, só se
  ativa, em ordem de nome. Sem erros além do 401.
- `GET /scale-template/:id`: `200 ScaleTemplate`. Também devolve versões antigas ou inativas, que
  aplicações gravadas usam. Erro: `404 SCALE_NOT_FOUND` (também id não-UUID).

> **Catálogo de hoje: só a escala FICTÍCIA `DEMO-RASTREIO`.** O nome é "Demonstração — Escala de
> rastreio". Tem 8 itens, 2 subescalas (`ATENCAO`, `INQUIETACAO`), opções 0 a 3 (Nunca, Às vezes,
> Frequentemente, Muito), método SUM e faixas 0–8 / 9–16 / 17–24 (4 itens por subescala: 0–4 / 5–8 /
> 9–12). **Não tem validade clínica** e serve só para integrar o fluxo. A escala real entra quando o
> responsável clínico enviar conteúdo, referência e licença. Novas escalas entram só como dados, sem
> mudança de contrato. O app não deve fixar `code` nem `id` no código.

### 3.4 Escalas: aplicações (`/scale-application`, Bearer)

```ts
type ApplicationStatus = "DRAFT" | "COMPLETED";

interface ScoreBand {
  label: string;
  severity: BandSeverity;
}

interface ScaleScore {
  partial: boolean; // answered < total
  answered: number;
  total: number;
  value: number; // SUM: soma dos respondidos; MEAN: média com 2 casas (sem resposta = menor opção)
  max: number;
  band?: ScoreBand; // ausente enquanto não há resposta; com partial, calculada sobre o valor parcial
  subscales: {
    code: string;
    name: string;
    answered: number;
    total: number;
    value: number;
    max: number;
    band?: ScoreBand;
  }[];
}

interface ScaleApplicationSummary {
  id: string;
  templateId: string; // a versão gravada
  templateCode: string;
  templateVersion: number;
  templateName: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  appointmentId?: string;
  status: ApplicationStatus;
  score: ScaleScore; // sempre recalculado pelo servidor com a versão gravada
  insight?: { text: string; generatedAt: string; preliminary: boolean };
  disclaimer: string; // em toda resposta (AV-09)
  startedAt: string;
  updatedAt: string; // muda ao gravar respostas e ao concluir; não muda com o insight
  completedAt?: string;
}

interface ScaleApplication extends ScaleApplicationSummary {
  answers: { itemId: string; value: number }[]; // na ordem dos itens
}
```

#### `POST /scale-application/`

```ts
{ studentId: string; templateId: string; appointmentId?: string } // UUIDs
// 201 ScaleApplication (DRAFT, answers [])
```

| Status | message                                              | Quando                                                                     |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| 400    | `Bad Request` + `errors`                             | validação                                                                  |
| 400    | `INVALID_APPOINTMENT`                                | atendimento inexistente, de outro educador ou de outro paciente            |
| 403    | `UNAUTHORIZED`                                       |                                                                            |
| 404    | `STUDENT_NOT_FOUND`, `SCALE_NOT_FOUND`               |                                                                            |
| 409    | `{ message: "DRAFT_ALREADY_EXISTS", applicationId }` | já há rascunho deste paciente nesta escala (mesmo `code`, qualquer versão) |
| 409    | `SCALE_INACTIVE`                                     | escala inativa, ou `templateId` não é a maior versão publicada             |

#### `GET /scale-application/`

Query: `studentId?` (UUID), `status?` (`DRAFT` \| `COMPLETED`), `limit?` (1–100, padrão 50).
Responde `200 ScaleApplicationSummary[]` (sem `answers`), por `updatedAt` desc. Erros: 400; 403
`UNAUTHORIZED` e 404 `STUDENT_NOT_FOUND` (com `studentId`).

#### `GET /scale-application/:id`

`200 ScaleApplication`. Erros: 403 `UNAUTHORIZED`; 404 `APPLICATION_NOT_FOUND` (também id não-UUID),
`STUDENT_NOT_FOUND`, `SCALE_NOT_FOUND`.

#### `PUT /scale-application/:id/answers`

Grava parcialmente, por upsert de `itemId`. Mandar a mesma resposta duas vezes não muda nada.

```ts
{
  answers: {
    itemId: string;
    value: number;
  }
  [];
} // 1 a 200; itemId 1–100 caracteres
// 200 ScaleApplication
```

| Status | message                                                         | Quando                                             |
| ------ | --------------------------------------------------------------- | -------------------------------------------------- |
| 400    | `Bad Request` + `errors`                                        | validação                                          |
| 400    | `ITEM_NOT_IN_SCALE`                                             | item fora da versão gravada (nada é gravado)       |
| 400    | `INVALID_ANSWER_VALUE`                                          | `value` fora de `options[].value` (nada é gravado) |
| 403    | `UNAUTHORIZED`                                                  |                                                    |
| 404    | `APPLICATION_NOT_FOUND`, `STUDENT_NOT_FOUND`, `SCALE_NOT_FOUND` |                                                    |
| 409    | `APPLICATION_NOT_EDITABLE`                                      | aplicação concluída                                |

#### `POST /scale-application/:id/complete`

Sem corpo. Responde `200 ScaleApplication` (`COMPLETED`, com `completedAt`).

| Status | message                                                         |
| ------ | --------------------------------------------------------------- |
| 400    | `{ message: "SCALE_INCOMPLETE", missingItemIds: string[] }`     |
| 403    | `UNAUTHORIZED`                                                  |
| 404    | `APPLICATION_NOT_FOUND`, `STUDENT_NOT_FOUND`, `SCALE_NOT_FOUND` |
| 409    | `APPLICATION_NOT_EDITABLE`                                      |

#### `POST /scale-application/:id/insight` (IA)

Sem corpo. Responde `200 ScaleApplication` com `insight` (texto até 800). Funciona em DRAFT
(`preliminary: true`) e em COMPLETED (`false`). Gerar de novo substitui o anterior.

| Status | message                                                         |
| ------ | --------------------------------------------------------------- |
| 400    | `NO_ANSWERS_YET` (nenhuma resposta gravada)                     |
| 403    | `UNAUTHORIZED`                                                  |
| 404    | `APPLICATION_NOT_FOUND`, `STUDENT_NOT_FOUND`, `SCALE_NOT_FOUND` |
| 500    | `AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT`                     |

#### `DELETE /scale-application/:id`

`204`, sem corpo. Erros: 403 `UNAUTHORIZED`; 404 `APPLICATION_NOT_FOUND`, `STUDENT_NOT_FOUND`;
409 `APPLICATION_NOT_EDITABLE` (só rascunho pode ser excluído).

---

### 3.5 Anamnese: síntese e `summaryOutdated`

Os campos novos em `GET /anamnese/responses/:responseId` e
`GET /anamnese/responses/student/:studentId` são `summary` e `summaryOutdated`. O resto do formato
não mudou.

```ts
interface AnamneseResponse {
  id: string;
  templateId: string;
  educatorId: string;
  studentId: string;
  answers: {
    questionId: string;
    questionType: string;
    textValue?: string;
    selectedOptionId?: string;
    selectedOptionIds?: string[];
    fileUrl?: string;
  }[];
  answeredAt: string;
  updatedAt?: string;
  summary?: { text: string; generatedAt: string }; // NOVO
  summaryOutdated: boolean; // NOVO: true quando a resposta foi editada depois da síntese
}
```

`GET /anamnese/responses/:responseId` com id não-UUID agora dá `404 RESPONSE_NOT_FOUND` (antes era
500).

#### `POST /anamnese/responses/:responseId/summary` (IA, Bearer)

Sem corpo. Gera e grava a síntese: até 1500 caracteres, em tópicos curtos. Respostas do tipo arquivo
não vão ao provedor. Responde `200 AnamneseResponse` com `summary` e `summaryOutdated: false`.
Gerar de novo substitui a anterior.

| Status | message                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| 400    | `NO_ANSWERS_TO_SUMMARIZE` (vazia ou só com respostas do tipo arquivo)                |
| 403    | `UNAUTHORIZED`                                                                       |
| 404    | `RESPONSE_NOT_FOUND` (também id não-UUID), `TEMPLATE_NOT_FOUND`, `STUDENT_NOT_FOUND` |
| 500    | `AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT`                                          |

> **Dono aqui é quem respondeu a anamnese** (`AnamneseResponse.educatorId`), como nas outras rotas de
> anamnese, e não `Student.educatorId`.
>
> `PUT /anamnese/responses/:id` e `POST /anamnese/templates/:templateId/responses` devolvem
> `summary`, mas **não** `summaryOutdated`. Depois de editar, releia com `GET` para saber se a síntese
> ficou desatualizada.

---

### 3.6 Relatórios (`/report`, Bearer)

```ts
type ReportType = "PROGRESS" | "ASSESSMENT" | "PDI_PROGRESS";
type ReportSection =
  | "PATIENT_DATA"
  | "SESSION_METRICS"
  | "EVOLUTIONS"
  | "PLAN_PROGRESS"
  | "ASSESSMENTS"
  | "ANAMNESIS_SUMMARY"
  | "AI_SYNTHESIS";
type ReportAudience = "FAMILY" | "SCHOOL" | "PROFESSIONAL";

interface ReportOptions {
  types: {
    type: ReportType;
    label: string;
    description: string;
    allowedSections: ReportSection[];
    defaultSections: ReportSection[]; // = allowedSections (ver RP-01 em §5)
  }[];
  sections: { section: ReportSection; label: string; sensitive: boolean }[];
  audiences: { audience: ReportAudience; label: string }[];
  periods: {
    key: "30d" | "90d" | "180d";
    label: string;
    days: 30 | 90 | 180;
  }[];
  maxPeriodDays: 365;
}

interface ReportContent {
  title: string; // rótulo do tipo
  generatedAt: string;
  professional: { name: string; profession?: string };
  patient?: { displayName: string; ageYears: number; schoolGrade?: string }; // nome completo; schoolGrade não é preenchido hoje
  sessionMetrics?: {
    sessions: number;
    answered: number;
    accuracy: number; // FRAÇÃO 0–1
    byCategory: {
      category: "reading" | "writing" | "vocabulary" | "comprehension";
      accuracy: number;
    }[];
  };
  evolutions?: {
    sessionDate: string;
    planTitle?: string;
    achieved: number;
    total: number;
    record: string;
  }[]; // cronológica
  planProgress?: {
    title: string;
    type: "PDI" | "PE";
    percent: number;
    goals: { description: string; status: string }[];
  }[];
  assessments?: {
    templateName: string;
    completedAt: string;
    value: number;
    max: number;
    band?: string;
  }[];
  anamnesisSummary?: string;
  synthesis?: string; // até 2500
}

interface ReportShare {
  channel: "SHARE" | "PRINT";
  at: string;
}

interface Report {
  id: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  type: ReportType;
  audience: ReportAudience;
  period: { from: string; to: string };
  sections: ReportSection[]; // sem repetição, na ordem do tipo
  content: ReportContent; // congelado na geração
  synthesisFailed: boolean;
  createdAt: string;
  shares: ReportShare[];
}

interface ReportSummary {
  // sem content
  id: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  type: ReportType;
  audience: ReportAudience;
  period: { from: string; to: string };
  sections: ReportSection[];
  synthesisFailed: boolean;
  createdAt: string;
  lastShare?: ReportShare;
}
```

Seções por tipo, na ordem do documento:

| Tipo           | Seções permitidas                                                      |
| -------------- | ---------------------------------------------------------------------- |
| `PROGRESS`     | PATIENT_DATA, SESSION_METRICS, EVOLUTIONS, PLAN_PROGRESS, AI_SYNTHESIS |
| `ASSESSMENT`   | PATIENT_DATA, ASSESSMENTS, ANAMNESIS_SUMMARY, AI_SYNTHESIS             |
| `PDI_PROGRESS` | PATIENT_DATA, PLAN_PROGRESS, EVOLUTIONS, AI_SYNTHESIS                  |

`sensitive: true`: ASSESSMENTS e ANAMNESIS_SUMMARY.

#### `GET /report/options`

`200 ReportOptions`. Estático.

#### `POST /report/`

```ts
{
  studentId: string;                       // UUID
  type: ReportType;
  audience: ReportAudience;
  period: { from: string; to: string };    // AAAA-MM-DD, from ≤ to, até 365 dias
  sections: ReportSection[];               // 1 a 20, todas em allowedSections do tipo
}
// 201 Report  (synthesisFailed: true se a IA falhou; o relatório é criado mesmo assim)
```

| Status | message                  | Quando                                       |
| ------ | ------------------------ | -------------------------------------------- |
| 400    | `Bad Request` + `errors` | validação (inclui `sections` vazio)          |
| 400    | `INVALID_PERIOD`         | `from > to` ou mais de 365 dias              |
| 400    | `SECTION_NOT_ALLOWED`    | seção fora do tipo                           |
| 400    | `REPORT_EMPTY_PERIOD`    | nenhuma das seções pedidas tem dado (ver §5) |
| 403    | `UNAUTHORIZED`           |                                              |
| 404    | `STUDENT_NOT_FOUND`      |                                              |

Com `AI_SYNTHESIS`, a criação espera a IA. Conte com o tempo da §2.

#### `GET /report/`

Query: `studentId?` (UUID), `limit?` (1–100, padrão 50). Responde `200 ReportSummary[]`, por
`createdAt` desc. Erros: 400; 403 `UNAUTHORIZED` e 404 `STUDENT_NOT_FOUND` (com `studentId`).

#### `GET /report/:id`

`200 Report`. Erros: 403 `UNAUTHORIZED`; 404 `REPORT_NOT_FOUND` (também id não-UUID),
`STUDENT_NOT_FOUND`.

#### `POST /report/:id/share`

Corpo `{ channel: "SHARE" | "PRINT" }`. Responde `200 Report` com o envio em `shares`. Só registra;
o backend não manda e-mail. Erros: 400 validação; 403; 404 `REPORT_NOT_FOUND`, `STUDENT_NOT_FOUND`.

#### `DELETE /report/:id`

`204`. Erros: 403; 404 `REPORT_NOT_FOUND`, `STUDENT_NOT_FOUND`.

---

### 3.7 Notificações (`/notification`, Bearer)

```ts
type NotificationKind =
  | "APPOINTMENTS_TODAY"
  | "EVOLUTION_PENDING"
  | "PLAN_REVIEW_DUE"
  | "SCALE_DRAFT_STALE";

interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string; // até 80
  body: string; // até 200; só o PRIMEIRO nome do paciente
  target?: {
    type: "AGENDA_DAY" | "SESSION" | "PLAN" | "SCALE_APPLICATION";
    id: string; // AGENDA_DAY: a data AAAA-MM-DD (não é UUID); os outros: UUID do recurso
  };
  createdAt: string;
  readAt?: string;
}
```

| kind                 | Gatilho (no job das 06:00 de São Paulo)                    | target                             | Texto                                                  |
| -------------------- | ---------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `APPOINTMENTS_TODAY` | há atendimento `PENDING` hoje (uma por educador)           | `AGENDA_DAY`, data de hoje         | "N atendimento(s) hoje"                                |
| `EVOLUTION_PENDING`  | sessão finalizada entre 30 dias e 24 h atrás, sem evolução | `SESSION`, sessionId               | "Evolução pendente"                                    |
| `PLAN_REVIEW_DUE`    | plano ACTIVE com `nextReviewDate` vencido ou em até 2 dias | `PLAN`, planId                     | "Revisão de plano", "vence"/"venceu em DD/MM"          |
| `SCALE_DRAFT_STALE`  | rascunho sem alteração há 7 dias ou mais                   | `SCALE_APPLICATION`, applicationId | "Escala em rascunho", com nome da escala e dias parado |

Rotas:

- **`GET /notification/`**
  - Query: `unreadOnly?` (`"true"` \| `"false"`, padrão false), `limit?` (1–50, **padrão 20**),
    `cursor?`.
  - Resposta: `200 { items: AppNotification[]; nextCursor?: string }`, por `createdAt` desc.
  - Para a próxima página, mande `cursor = nextCursor`. Sem `nextCursor`, acabou.
  - Erros: 400 validação, `400 INVALID_CURSOR`.
- **`GET /notification/unread-count`**: `200 { count: number }`. Conta só o que a lista mostra.
- **`POST /notification/:id/read`**: `200 AppNotification`. Idempotente: marcar de novo mantém o
  primeiro `readAt`. Erros: 403 `UNAUTHORIZED` (notificação de outro educador); 404
  `NOTIFICATION_NOT_FOUND` (também id não-UUID).
- **`POST /notification/read-all`**: `200 { updated: number }`, com quantas mudaram.

---

### 3.8 Atendimento: `GET /appointment?from&to` (PP-03)

| Query  | Tipo                                                          |
| ------ | ------------------------------------------------------------- |
| `from` | `AAAA-MM-DD`, opcional; início do dia em São Paulo, inclusivo |
| `to`   | `AAAA-MM-DD`, opcional; fim do dia em São Paulo, inclusivo    |

Sem os dois, devolve tudo, como antes. Dá para mandar só um. A resposta é o mesmo array de
`Appointment`, por `scheduledAt` asc. A novidade é o desempate por id, que deixa a ordem estável.
Erros: 400 validação (data inválida), `400 INVALID_PERIOD` (`from > to`).

### 3.9 Sessão: `timeToAnswer` em ms e `evolutionId`

- **`POST /task-notebook-session/answer`**: `timeToAnswer` passa a ser oficialmente em
  **milissegundos**, que é o que o app já envia. Mesma validação de antes (número ≥ 0).
- **`GET /task-notebook-session/report/:sessionId`**:
  - `averageTimePerQuestion`, `averageCorrectTime` e `averageIncorrectTime` saem em ms (média crua de
    `timeToAnswer`);
  - `totalTimeSession` continua em segundos;
  - campo novo `evolutionId?: string`.
- **`GET /task-notebook-session/student/:studentId`**: cada sessão ganha `evolutionId?: string`. O
  resto não muda.

---

## 4. Regras de negócio que o app precisa conhecer

**Senha**

- Código de 6 dígitos, válido por 15 min, de uso único. Pedir outro invalida o anterior.
- Limite de envio: até 3 a cada 15 min por conta; o 4º dá `429 TOO_MANY_REQUESTS`.
- Tentativas: 5 erros no mesmo código dão `429 TOO_MANY_ATTEMPTS` e o código morre. Um acerto
  **não gasta** tentativa.
- `verify-token` não consome o código. Fluxo esperado: verificar e depois trocar com o mesmo código.
- `update-password` consome o código só quando a troca acontece.
- Depois de qualquer troca, JWTs anteriores dão 401. `change-password` devolve um token novo.

**Evolução**

- Uma evolução por sessão, e só de sessão finalizada. Não há exclusão. A edição não tem prazo.
- O plano é escolhido no **contexto**, nesta ordem:
  1. PE ACTIVE do atendimento da sessão;
  2. PE ACTIVE com `sessionDate` igual à data da sessão;
  3. PDI ACTIVE;
  4. nenhum.
- Metas ACHIEVED e DISCONTINUED não entram nos `suggestedCriteria`.
- O POST **não** escolhe o plano sozinho: mande `planId` (normalmente `context.plan.id`).
- `goalUpdates` muda o status das metas do plano (ACHIEVED recalcula o progresso). Na edição, só as
  metas cujo status atual difere são alteradas, então reenviar a mesma lista é seguro.
- A gravação não usa transação: tudo é validado antes, o plano é gravado primeiro e depois a evolução.
  Se der erro de rede no meio, repetir o mesmo POST é seguro.
- `descriptiveRecord` também vai para a observação da sessão, que aparece em `report/:sessionId`.
- O `appointmentId` vem da sessão. A evolução não altera o atendimento.

**Escalas**

- Um rascunho por paciente e escala (`code`). O segundo início devolve 409 com o `applicationId`
  para retomar.
- O escore e a faixa são **sempre do servidor**, recalculados a cada leitura com a versão gravada na
  aplicação. Não calcule no app.
- Faixa parcial: com `partial: true`, `band` usa o valor dos itens respondidos. Sem nenhuma
  resposta, não há `band`.
- A aplicação grava `templateVersion`. Uma versão nova da escala não muda aplicações antigas.
- Concluída, a aplicação fica somente leitura: respostas, conclusão e exclusão dão 409. O insight
  continua permitido.
- O insight é sob demanda (botão), com `preliminary: true` em rascunho. Gerar de novo substitui.

**Relatórios**

- O conteúdo fica **congelado** na geração. Editar uma evolução depois não muda o relatório.
- Seções sensíveis (ASSESSMENTS, ANAMNESIS_SUMMARY) vêm marcadas com `sensitive`. Nunca entram
  endereço, telefones, documentos, foto, responsável ou CPF.
- Período vazio: `REPORT_EMPTY_PERIOD` só quando **nenhuma das seções pedidas** tem dado. PATIENT_DATA
  e AI_SYNTHESIS não contam. Em cada seção:
  - SESSION_METRICS: sessões finalizadas no período;
  - EVOLUTIONS: `sessionDate` no período;
  - PLAN_PROGRESS: planos ACTIVE ou COMPLETED com vigência que cruza o período;
  - ASSESSMENTS: aplicações concluídas no período;
  - ANAMNESIS_SUMMARY: a síntese mais recente do paciente, **independente do período**.
- `AI_SYNTHESIS` é gerada na criação. Se a IA falhar, o relatório é criado sem `synthesis` e com
  `synthesisFailed: true`. Não existe rota para gerar a síntese de novo: crie outro relatório.
- O PDF é do app. `share` só registra `PRINT` ou `SHARE`.

**Notificações**

- Geradas 1x por dia às 06:00 de São Paulo. Não há push nem geração na hora.
- Cada pendência gera no máximo **uma por dia**, mas **se repete todo dia** enquanto existir. Por
  exemplo, a mesma sessão sem evolução gera uma notificação nova a cada manhã.
- Notificações com mais de 90 dias são apagadas.
- Só o primeiro nome do paciente aparece no texto.
- Notificação de paciente que deixou de ser do educador some da lista e do contador.
- O destino pode não existir mais (sessão, plano ou aplicação excluídos). Trate como "não
  encontrado" ao abrir, sem erro.
- **Paginação por cursor:** uma página pode vir com menos itens que `limit`, ou até **vazia, com
  `nextCursor`**, porque as notificações escondidas saem depois do corte. Continue até não vir
  `nextCursor`.
- `read-all` marca **todas** as não lidas do educador, inclusive as escondidas. Por isso, `updated`
  pode ser maior que o `count` mostrado.

**Pequenos pedidos**

- `timeToAnswer` é em ms (PP-01).
- Sugestão de plano `REWRITE_GOAL` com o mesmo texto da meta atual (ignorando maiúsculas e espaços
  nas pontas) é descartada na geração (PP-02).

---

## 5. Diferenças em relação à especificação do app

| ID          | Pedido                                          | Entregue                                                                                        | Por quê                                                      |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| SN-02       | Sempre 200; limite de 3 envios por e-mail       | Limite contado por conta cadastrada; e-mail sem conta sempre 200                                | Nada é gravado para e-mail inexistente                       |
| SN-03/SN-04 | `TOO_MANY_ATTEMPTS` só no update-password       | Também no `verify-token`, que conta tentativa                                                   | Os dois usam a mesma contagem; um acerto não gasta tentativa |
| SN-04       | —                                               | `update-password` responde 200 sem JSON (texto "OK")                                            | Mantido o comportamento anterior                             |
| EV-05       | Plano encerrado → `INVALID_PLAN`                | Sem `goalUpdates`: 400 `INVALID_PLAN`; com `goalUpdates`: 409 `PLAN_NOT_EDITABLE`               | Segue o BE-EV-03                                             |
| EV-06       | `goalId` sem `planId` é 400                     | 400 `GOAL_NOT_IN_PLAN` (critério) ou `INVALID_PLAN` (`goalUpdates`)                             | Código mais específico                                       |
| EV-07       | Mesma transação                                 | Validação completa antes, gravação em sequência, sem transação                                  | Simplicidade; repetir é seguro                               |
| EV-09       | —                                               | `criteria` reenviado no PUT ganha ids novos                                                     | A lista é substituída inteira                                |
| §3.4 PUT    | Erros 400/403/404/409                           | Também 400 `INVALID_PLAN`                                                                       | `goalUpdates` em evolução sem plano                          |
| §3.6        | Erros sem 409                                   | `409 SESSION_NOT_FINISHED` na sugestão de IA                                                    | Mesma regra da evolução                                      |
| AV-02       | `active: false` → `SCALE_INACTIVE`              | Também quando o `templateId` não é a maior versão                                               | Aplicação nova só na versão vigente                          |
| AV-03       | Por paciente e escala                           | Por paciente e `code` (qualquer versão)                                                         | Evita rascunhos paralelos em versões diferentes              |
| §4.5 POST   | —                                               | `400 INVALID_APPOINTMENT`                                                                       | `appointmentId` precisa ser do educador e do paciente        |
| §4.5 GET    | `ScaleApplicationSummary` pode omitir `answers` | Sem `answers`, com `score`, `insight` e `disclaimer`                                            | O app mostra a faixa na lista sem outra chamada              |
| §4.3        | `subscales[]` sem contagem                      | Cada subescala traz também `answered` e `total`                                                 | Mostrar parcial por subescala                                |
| IN          | —                                               | `400 NO_ANSWERS_YET`                                                                            | Sem resposta não há escore para interpretar                  |
| AS-01       | Só o dono do paciente                           | Dono = quem respondeu a anamnese                                                                | Mesmo critério das rotas de anamnese existentes              |
| AS-02       | `summaryOutdated` na leitura                    | Só no GET (detalhe e lista); PUT e POST de resposta não trazem                                  | Releia com GET depois de editar                              |
| AS          | —                                               | `400 NO_ANSWERS_TO_SUMMARIZE`, `404 TEMPLATE_NOT_FOUND`                                         | Anamnese vazia ou só com arquivos; template apagado          |
| RP-01       | Sensíveis fora dos padrões de FAMILY e SCHOOL   | `defaultSections` = todas as permitidas do tipo; o app tira as `sensitive` para FAMILY e SCHOOL | Os padrões são por tipo, e a audiência é escolhida no app    |
| RP-04       | Erros de seção                                  | Também `400 INVALID_PERIOD` (`from > to` ou > 365 dias)                                         | Código próprio para o período                                |
| RP-05       | Período sem nenhum dado                         | Vazio considerando **só as seções pedidas**; anamnese conta independente do período             | Não gerar documento sem conteúdo nas seções escolhidas       |
| §6.2        | `ReportSummary`                                 | Traz `synthesisFailed` e `lastShare` (em vez de `shares`)                                       | Histórico mostra o último envio                              |
| §6.2        | `schoolGrade?`                                  | Nunca preenchido                                                                                | Não há série escolar estruturada no cadastro                 |
| §6.2        | `accuracy`                                      | Fração 0–1 (também em `byCategory`)                                                             | Mesmo cálculo da análise do aluno                            |
| NT-02       | Uma por kind + target por dia                   | Igual, e por isso **repete diariamente** enquanto a pendência existir                           | Ver §6                                                       |
| §7          | `limit` 1–50                                    | Padrão 20                                                                                       | —                                                            |
| §7          | —                                               | `400 INVALID_CURSOR`                                                                            | Cursor adulterado ou de outro formato                        |
| §7          | —                                               | `target.id` de `AGENDA_DAY` é a data `AAAA-MM-DD`                                               | O destino é um dia, não um registro                          |
| PP-03       | `from` e `to`                                   | Os dois opcionais e independentes; `400 INVALID_PERIOD` com `from > to`                         | —                                                            |

Erros novos que a especificação não previa, todos listados acima: `NO_ANSWERS_YET`,
`NO_ANSWERS_TO_SUMMARIZE`, `INVALID_PERIOD` (relatório e agenda), `INVALID_CURSOR`,
`INVALID_APPOINTMENT`, `TEMPLATE_NOT_FOUND`. Além deles, `404 STUDENT_NOT_FOUND` aparece em quase
todas as rotas por paciente, e `404 SCALE_NOT_FOUND` nas rotas de aplicação (versão gravada ausente).

---

## 6. Pontos em aberto

1. **Escala real (G-55).** Só `DEMO-RASTREIO`, fictícia, até o responsável clínico enviar conteúdo,
   referência e licença. A escala real entra como dados, sem mudança de contrato.
2. **RP-02.** `patient.displayName` é o nome completo em todas as audiências. Falta decidir se a
   audiência SCHOOL deve levar só o primeiro nome.
3. **Repetição diária das notificações.** A mesma pendência gera uma notificação nova por dia. Se o
   produto preferir avisar só uma vez por pendência, é uma mudança pequena no backend. Avisem.
4. **`timeToAnswer` antigo.** Respostas anteriores a 2026-10-09 (São Paulo) foram gravadas em
   segundos e não foram migradas.
   - As análises e prompts de IA ignoram o tempo dessas respostas.
   - `report/:sessionId` de sessões antigas ainda mostra a média crua, em segundos.

---

## 7. Decisões do app sobre as diferenças

Registradas pelo orquestrador do app em 2026-11-12.

- **EV-12 com PDI como reserva.** O backend manteve o PDI como 3ª opção do contexto. O usuário
  aceitou (G-57 revisto): o app aceita `plan.type` `"PDI" | "PE"` e mostra o plano que vier
  ("PDI · …" ou "PE · …").
- **Mocks e tipos do app** passam a seguir este documento (não mais a especificação) nas tarefas de
  integração.
