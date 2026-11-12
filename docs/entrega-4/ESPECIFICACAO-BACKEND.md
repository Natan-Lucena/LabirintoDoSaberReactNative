# Entrega 4 — Especificação para o backend

> O que o app precisa que o backend construa na Entrega 4: entidades, regras de negócio, rotas,
> erros, regras da IA e critérios de aceite. Escrito em 2026-11-12 pelo orquestrador do app, a
> partir do design do Figma Make (`L7sCNfMhrzOzhtlNpS3cHr`), do
> [BACKLOG da Entrega 2](../entrega-2/BACKLOG.md) (mapa completo do produto) e do contrato atual
> ([PROJECT.md](../PROJECT.md) e [BACKEND-ENTREGUE](../entrega-3/BACKEND-ENTREGUE.md)).
>
> **Status:** proposta do app. Os nomes de rotas e campos são **sugestões** que seguem as
> convenções da API (§1); o backend pode mudá-los. O contrato final é registrado no
> [PROJECT.md](../PROJECT.md) pela tarefa API-04 ([BACKLOG](BACKLOG.md)), e o app só implementa
> o que estiver lá. O resumo e a mensagem para enviar estão em
> [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md). As decisões de produto que dependem do usuário estão
> no [ROADMAP §5](ROADMAP.md#5-decisões) (G-54 a G-60).

## 0. Resumo

A Entrega 4 é a que mais depende do backend: **quatro domínios novos** e a correção da senha.
Nada disso existe hoje na API.

| Prio.  | Item                                                           | Tamanho | Bloqueia no app                                          | Seção |
| ------ | -------------------------------------------------------------- | ------- | -------------------------------------------------------- | ----- |
| **P0** | **Senha:** recuperação com código e troca autenticada          | P       | Esqueci a senha (AUT-01), trocar senha (REC-03)          | §2    |
| **P1** | Domínio **Evolução da sessão** (registro clínico pós-sessão)   | M       | Evolução, prontuário e entradas (EVO-01, EVO-02, EVO-05) | §3    |
| **P1** | Domínio **Avaliações e escalas** (catálogo, aplicação, escore) | G       | Avaliações (AVA-01 a AVA-05), aba da ficha (PAC-05)      | §4    |
| P2     | IA: sugestão para a próxima sessão                             | P       | Bloco "Sugestão para a próxima sessão" (EVO-04)          | §3.6  |
| P2     | IA: insight da escala                                          | P       | "Insight preliminar" (AVA-03)                            | §4.6  |
| P2     | IA: síntese da anamnese                                        | P       | "Ver síntese" (PAC-09)                                   | §5    |
| P2     | Domínio **Relatórios** (configurar, gerar, histórico)          | M       | Relatórios (REL-01 a REL-03)                             | §6    |
| P3     | Domínio **Notificações** no app (sem push)                     | M       | Sino e lista (NOT-01)                                    | §7    |
| P3     | Pequenos pedidos e pendências da Entrega 3                     | P       | Nada (melhoram telas que já funcionam)                   | §8    |

- **P0:** falha de segurança aberta. `POST /educator/update-password` é público e troca a senha
  de qualquer conta só com o e-mail. Deve ser a primeira entrega.
- **P1:** sem isso, os blocos de Evolução e de Avaliações não começam.
- **P2:** depende do P1 ou só acrescenta IA. Sem ele, a tela omite o bloco.
- **P3:** pode vir por último.

Tamanho é uma estimativa relativa do app (P, M ou G), só para planejar as levas (§10).

## 1. Convenções (as mesmas da API atual)

- Express na Vercel, sem prefixo `/api` nem versão; JSON, exceto uploads (`multipart/form-data`).
- **Bearer JWT** em todas as rotas novas, exceto as de senha esquecida (§2.1). O educador vem
  sempre **do token**, nunca do corpo.
- **Acesso:** só o educador **dono do paciente** (`Student.educatorId`) lê ou altera os dados
  clínicos dele (evolução, aplicação de escala, relatório). Recurso de outro educador:
  `403 { message: "UNAUTHORIZED" }`. Inexistente: `404` com código próprio, **nunca 500**. Um id
  que não é UUID válido também vira `404`, como nas rotas de plano.
- **Erros:** regra de negócio `{ message: "CODIGO" }` (MAIÚSCULAS); validação Zod
  `{ message, errors: [{ message, field }] }`; falha de IA `500 { message, error }`.
- **Datas:** com hora em ISO 8601 UTC; sem hora em `AAAA-MM-DD`, com "hoje" no fuso
  `America/Sao_Paulo`.
- **Campos opcionais** vêm **ausentes** do JSON quando não definidos (como nos planos).
- **IA:** o app corta em **90 s** (G-46); o caso típico deve responder em menos de 60 s. Todas
  as regras de IA da Entrega 3 continuam valendo para as rotas novas:

  | ID    | Regra                                                                                                                                              |
  | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
  | IA-02 | Texto em português do Brasil, linguagem profissional e acessível                                                                                   |
  | IA-04 | **Sem diagnóstico** (não afirmar transtornos) e sem promessa de resultado; o texto é sugestão para o profissional revisar                          |
  | IA-05 | **Minimização:** não enviar ao provedor de IA nome, endereço, telefone, documentos nem dados do responsável; idade, gênero e dados clínicos bastam |
  | IA-06 | Menos de 60 s no caso típico                                                                                                                       |
  | IA-07 | Saída inválida do modelo não chega ao app: o servidor corrige ou devolve `500 AI_INVALID_OUTPUT`                                                   |

- **Dados de crianças:** nada de conteúdo clínico (evolução, respostas de escala, relatório,
  anamnese) em logs.
- **Swagger:** toda rota nova aparece em `/api-docs/` com corpo, resposta e erros.

## 2. Senha — P0

### 2.1 Recuperação com código ("Esqueci a senha")

Hoje: `PUT /educator/generate-token` envia um código por e-mail, mas
`POST /educator/update-password` **não pede o código** e troca a senha só com `email` e
`newPassword`. O app tem a tela "Esqueci a senha" (Entrega 1) presa a esse fluxo (G-05).

| ID    | Regra                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SN-01 | `PUT /educator/generate-token { email }` gera um código de **6 dígitos**, de uso único, válido por **15 min**, e o envia por e-mail. Um código novo invalida o anterior                                               |
| SN-02 | A resposta é sempre `200 { message: "TOKEN_SENT" }`, **exista ou não** o e-mail (não revelar quais contas existem). Limite de 3 envios por e-mail a cada 15 min (`429 TOO_MANY_REQUESTS`)                             |
| SN-03 | `POST /educator/verify-token { email, token }` confere o código sem consumi-lo: `200 { valid: true }`. Serve ao passo "Código verificado" do design                                                                   |
| SN-04 | `POST /educator/update-password { email, token, newPassword }` exige o código. Erros: `400 INVALID_TOKEN`, `EXPIRED_TOKEN`, `PASSWORD_SAME_AS_OLD`; 5 tentativas erradas invalidam o código (`429 TOO_MANY_ATTEMPTS`) |
| SN-05 | **A rota antiga sem `token` deixa de funcionar** (`400` de validação). É a correção da falha de segurança                                                                                                             |
| SN-06 | `newPassword`: 6 a 100 caracteres (a mesma regra do cadastro)                                                                                                                                                         |

### 2.2 Troca de senha logado (perfil)

| ID    | Regra                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SN-07 | `PUT /educator/change-password { currentPassword, newPassword }`, com **Bearer**. Erros: `400 INVALID_CURRENT_PASSWORD`, `PASSWORD_SAME_AS_OLD`        |
| SN-08 | Depois de qualquer troca (SN-04 ou SN-07), os **tokens emitidos antes deixam de valer** (`401`). A troca logada devolve um token novo: `200 { token }` |

### 2.3 Critérios de aceite

| ID       | Critério                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------ |
| BE-SN-01 | `update-password` sem `token` devolve 400; com token errado, `INVALID_TOKEN`; vencido, `EXPIRED_TOKEN` |
| BE-SN-02 | `generate-token` com e-mail inexistente devolve o mesmo 200 que com e-mail existente                   |
| BE-SN-03 | Depois da troca, o token antigo recebe 401 em `GET /educator/me`                                       |
| BE-SN-04 | `change-password` com a senha atual errada devolve `INVALID_CURRENT_PASSWORD`                          |

## 3. Evolução da sessão — P1

### 3.1 Para que serve

Depois de cada sessão, o profissional registra a **evolução**: como o paciente foi em cada
critério do plano, um registro descritivo e uma sugestão para a próxima sessão. É o
**prontuário** do paciente. O design (`EvolutionScreen`) mostra:

- cabeçalho "Evolução da sessão" com "{paciente} · {data}";
- resumo "PE · {tema}" com "{duração} · N critérios mensuráveis";
- "Critérios da sessão", cada um com título e detalhe ("8 de 10 tentativas");
- "Registro descritivo" (texto livre);
- "Sugestão para a próxima sessão" (IA);
- "Salvar e atualizar prontuário" e o painel "Evolução registrada".

Hoje só existe `POST /task-notebook-session/observation`, um texto solto na sessão. Os
**critérios** vêm das metas do **PE da sessão**, que já existe desde a Entrega 3 (G-57). Sem PE, não há
critérios sugeridos.

### 3.2 Entidades

```ts
type CriterionResult = "ACHIEVED" | "PARTIAL" | "NOT_ACHIEVED" | "NOT_OBSERVED";

interface SessionEvolution {
  id: string;
  sessionId: string; // única: uma evolução por sessão (EV-02)
  studentId: string;
  educatorId: string; // do token
  appointmentId?: string; // herdado da sessão
  planId?: string; // PE de onde vieram os critérios
  planType?: "PE";
  planTitle?: string; // "PE · {tema}"
  sessionDate: string; // AAAA-MM-DD, do startedAt da sessão
  durationMinutes?: number; // finishedAt − startedAt, arredondado
  criteria: EvolutionCriterion[]; // 0 a 20, na ordem enviada
  descriptiveRecord: string; // 1–5000 ("Registro descritivo")
  nextSessionSuggestion?: string; // até 2000, texto final aceito ou editado pelo profissional
  goalUpdates: { goalId: string; status: GoalStatus }[]; // aplicados ao plano ao salvar (EV-07)
  createdAt: string;
  updatedAt: string;
}

interface EvolutionCriterion {
  id: string;
  goalId?: string; // meta do plano; ausente = critério livre
  description: string; // 1–500
  successCriterion?: string; // até 500, copiado da meta
  attempts?: number; // 0–100
  successes?: number; // 0..attempts ("8 de 10 tentativas")
  result: CriterionResult;
  note?: string; // até 500
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
  excerpt: string; // primeiros 200 caracteres do registro
  createdAt: string;
}
```

`GoalStatus` é o da Entrega 3 (`NOT_STARTED | IN_PROGRESS | ACHIEVED | DISCONTINUED`).

### 3.3 Regras de negócio

| ID    | Regra                                                                                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EV-01 | **Propriedade.** Só o dono do paciente cria, lê ou edita (§1)                                                                                                                                                                |
| EV-02 | **Uma evolução por sessão.** Segunda criação: `409 { message: "EVOLUTION_ALREADY_EXISTS", evolutionId }`                                                                                                                     |
| EV-03 | **Só sessão finalizada.** Sessão sem `finishedAt`: `409 SESSION_NOT_FINISHED`. Sessão inexistente: `404 SESSION_NOT_FOUND`                                                                                                   |
| EV-04 | **Critérios.** De 0 a 20; `successes ≤ attempts`; os dois são opcionais, mas `successes` exige `attempts` (`400 INVALID_ATTEMPTS`)                                                                                           |
| EV-05 | **Plano.** `planId`, se vier, é um PE `ACTIVE` do mesmo paciente (G-57). Senão: `400 INVALID_PLAN`                                                                                                                           |
| EV-06 | **Metas.** Cada `goalId` pertence ao `planId` (`400 GOAL_NOT_IN_PLAN`); `goalId` sem `planId` é `400`                                                                                                                        |
| EV-07 | **"Atualizar prontuário".** `goalUpdates` muda o estado das metas do plano **na mesma transação** da evolução, com as regras PL-06 e PL-08 da Entrega 3 (plano `ACTIVE`; `achievedAt`). Se falhar, nada é gravado            |
| EV-08 | **Compatibilidade.** O `descriptiveRecord` também é gravado em `TaskNotebookSession.observation`, para os relatórios e telas antigas continuarem mostrando a observação                                                      |
| EV-09 | **Edição sem exclusão.** O dono edita a evolução (critérios, registro, sugestão) a qualquer momento; `updatedAt` muda. **Não há exclusão** (registro clínico, como os planos). `goalUpdates` na edição aplica só a diferença |
| EV-10 | **Atendimento.** A evolução herda o `appointmentId` da sessão. O atendimento já vira `COMPLETED` no `finish` (Entrega 3); a evolução não muda o atendimento                                                                  |
| EV-11 | **Sessões e evolução.** `GET /task-notebook-session/student/:studentId` e o detalhe da sessão passam a trazer `evolutionId` quando houver                                                                                    |

### 3.4 Rotas sugeridas

Todas com Bearer.

| Método e rota                               | Uso no app                                     | Corpo / query                                                                                                  | Resposta                                               | Erros                                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /session-evolution/context/:sessionId` | Abrir a Evolução já preenchida (EVO-01)        | —                                                                                                              | `200 EvolutionContext` (§3.5)                          | `403`; `404 SESSION_NOT_FOUND`; `409 SESSION_NOT_FINISHED`                                                                                                         |
| `POST /session-evolution/`                  | Salvar (EVO-01)                                | `sessionId`, `planId?`, `criteria[]` (sem `id`), `descriptiveRecord`, `nextSessionSuggestion?`, `goalUpdates?` | `201 SessionEvolution`                                 | `400` validação, `INVALID_PLAN`, `GOAL_NOT_IN_PLAN`, `INVALID_ATTEMPTS`; `403`; `404`; `409 EVOLUTION_ALREADY_EXISTS`, `SESSION_NOT_FINISHED`, `PLAN_NOT_EDITABLE` |
| `GET /session-evolution/`                   | Prontuário (EVO-02) e "Evolução recente"       | Query: `studentId?`, `from?`, `to?` (`AAAA-MM-DD`), `limit?` (1–100, padrão 50)                                | `200 SessionEvolutionSummary[]`, mais recente primeiro | `400`                                                                                                                                                              |
| `GET /session-evolution/:id`                | Detalhe de um registro (EVO-02)                | —                                                                                                              | `200 SessionEvolution`                                 | `403`; `404 EVOLUTION_NOT_FOUND`                                                                                                                                   |
| `PUT /session-evolution/:id`                | Editar (EVO-02)                                | Todos opcionais: `criteria` (lista completa), `descriptiveRecord`, `nextSessionSuggestion`, `goalUpdates`      | `200 SessionEvolution`                                 | `400`; `403`; `404`; `409 PLAN_NOT_EDITABLE`                                                                                                                       |
| `GET /session-evolution/pending`            | "Sessões sem evolução" no hub (EVO-02, EVO-05) | Query: `days?` (1–90, padrão 30)                                                                               | `200 PendingEvolution[]`                               | `400`                                                                                                                                                              |

```ts
interface PendingEvolution {
  sessionId: string;
  studentId: string;
  studentName: string;
  sessionName: string;
  finishedAt: string;
  appointmentId?: string;
}
```

### 3.5 Contexto para preencher a tela — `GET /session-evolution/context/:sessionId`

O servidor escolhe o plano e devolve os critérios sugeridos, para o app não juntar quatro
chamadas:

```ts
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
    answeredCount: number; // respostas no player
    correctCount: number;
  };
  plan?: { id: string; type: "PE"; title: string }; // EV-12
  suggestedCriteria: {
    goalId: string;
    description: string;
    successCriterion?: string;
    goalStatus: GoalStatus;
  }[];
  existingEvolutionId?: string; // se já houver evolução (EV-02)
}
```

| ID    | Regra                                                                                                                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EV-12 | **Escolha do plano (G-57):** 1) PE `ACTIVE` com `appointmentId` igual ao da sessão; 2) PE `ACTIVE` com `sessionDate` igual à data da sessão; 3) nenhum (`plan` ausente). **O PDI não entra** (G-57, decidido em 2026-11-12). Metas `DISCONTINUED` e `ACHIEVED` não entram nos critérios sugeridos |

### 3.6 Sugestão para a próxima sessão (IA) — P2

`POST /session-evolution/next-session-suggestion` — **não persiste**; o profissional edita e o
texto final vai em `nextSessionSuggestion` ao salvar.

| Campo               | Tipo                   | Regra                                            |
| ------------------- | ---------------------- | ------------------------------------------------ |
| `sessionId`         | uuid                   | Obrigatório; sessão finalizada do educador       |
| `criteria`          | `EvolutionCriterion[]` | Opcional: o que o profissional já marcou na tela |
| `descriptiveRecord` | string                 | Opcional, até 5000                               |

**Contexto montado pelo servidor:** idade e gênero do paciente, metas do plano escolhido
(EV-12), critérios e registro recebidos, acerto da sessão e das três últimas evoluções.

**Saída:** `200 { suggestion: string (até 1000), rationale?: string (até 500) }`.

Regras IA-02 a IA-07 (§1). Erros: `400`; `403`; `404 SESSION_NOT_FOUND`;
`500 AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT`.

### 3.7 Critérios de aceite

| ID       | Critério                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| BE-EV-01 | Salvar a evolução de uma sessão finalizada; a segunda tentativa devolve `409 EVOLUTION_ALREADY_EXISTS`                                           |
| BE-EV-02 | Sessão aberta devolve `409 SESSION_NOT_FINISHED`                                                                                                 |
| BE-EV-03 | `goalUpdates` com uma meta `ACHIEVED` recalcula o `progress` do plano; plano encerrado faz a evolução inteira falhar com `409 PLAN_NOT_EDITABLE` |
| BE-EV-04 | O `context` de uma sessão com PE do atendimento traz as metas do PE; sem PE, as do PDI ativo; sem plano, `plan` ausente                          |
| BE-EV-05 | A observação da sessão (`report/:sessionId`) mostra o registro descritivo salvo (EV-08)                                                          |
| BE-EV-06 | Evolução de paciente de outro educador devolve 403 em leitura e escrita                                                                          |
| BE-EV-07 | `pending` lista as sessões finalizadas sem evolução dos últimos 30 dias e some com a sessão depois de salvar                                     |
| BE-EV-08 | A sugestão da IA não cria registro e responde em português, sem diagnóstico                                                                      |

## 4. Avaliações e escalas — P1

### 4.1 Para que serve

O profissional aplica **escalas padronizadas** (questionários com opções fixas e pontuação) e
recebe o **escore**, a **faixa** e um **insight preliminar** da IA. O design
(`AssessmentsScreen`) mostra:

- hub com "Nova aplicação", "Modelos disponíveis" (nº de itens e tempo) e "Aplicações
  recentes" com a faixa em destaque;
- aplicação com progresso "N de M", instrução e uma pergunta por vez, com as opções da escala
  (no exemplo: Nunca, Às vezes, Frequentemente, Muito);
- "Pontuação parcial" (N/M e faixa), o aviso "O resultado não substitui avaliação clínica
  completa", "Insight preliminar", "Salvar rascunho" e "Concluir escala";
- na ficha do paciente, a aba "Avaliações" (o exemplo do design é uma "Escala de rastreio
  TDAH").

**Diferença para a anamnese:** a anamnese (que já existe) é um questionário livre, por educador,
sem pontuação. A escala é um **instrumento fixo do catálogo**, com regras de pontuação.

### 4.2 Catálogo de escalas (G-55)

- O catálogo é **mantido pelo backend**: escalas carregadas por seed versionado, **somente
  leitura** para o app. O educador não cria escalas nesta entrega.
- **Quais escalas entram é decisão do produto (G-55)**, com responsável clínico da equipe:
  - o conteúdo (itens, opções, faixas de corte) precisa vir de **fonte publicada e citada**;
  - a **licença** de uso precisa ser verificada antes de cadastrar;
  - decidido (G-55): começar pela **"Escala de rastreio TDAH"** do design (opções Nunca, Às
    vezes, Frequentemente, Muito); o instrumento exato vem do responsável clínico.
- O formato abaixo é genérico, para novas escalas entrarem só com dados, sem código.

### 4.3 Entidades

```ts
type ScaleRespondent = "PROFESSIONAL" | "GUARDIAN" | "TEACHER";
type BandSeverity = "LOW" | "MODERATE" | "HIGH";
type ApplicationStatus = "DRAFT" | "COMPLETED";

interface ScaleTemplate {
  id: string;
  code: string; // estável, ex. "RASTREIO-TDAH"
  version: number; // muda quando itens, opções ou faixas mudam
  name: string;
  description: string;
  instructions: string; // ".instruction" da tela
  respondent: ScaleRespondent; // quem responde (o profissional aplica)
  ageRange?: { min: number; max: number }; // em anos
  estimatedMinutes: number;
  options: { value: number; label: string }[]; // 2 a 7, ex. 0 Nunca … 3 Muito
  items: { id: string; order: number; text: string; subscaleCode?: string }[];
  subscales: { code: string; name: string }[]; // pode ser vazio
  scoring: {
    method: "SUM" | "MEAN";
    bands: {
      subscaleCode?: string; // ausente = escore total
      min: number;
      max: number;
      label: string; // ex. "Indicativo moderado"
      severity: BandSeverity;
    }[];
  };
  disclaimer: string; // "O resultado não substitui avaliação clínica completa"
  reference: string; // citação da fonte
  active: boolean;
}

interface ScaleScore {
  partial: boolean; // true enquanto há itens sem resposta
  answered: number;
  total: number; // itens da escala
  value: number; // soma ou média (scoring.method)
  max: number;
  band?: { label: string; severity: BandSeverity }; // AV-06
  subscales: {
    code: string;
    name: string;
    value: number;
    max: number;
    band?: { label: string; severity: BandSeverity };
  }[];
}

interface ScaleApplication {
  id: string;
  templateId: string;
  templateCode: string;
  templateVersion: number; // a versão usada fica gravada (AV-02)
  templateName: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  appointmentId?: string;
  status: ApplicationStatus;
  answers: { itemId: string; value: number }[];
  score: ScaleScore; // sempre calculado pelo servidor
  insight?: { text: string; generatedAt: string; preliminary: boolean };
  disclaimer: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

O resumo para listas pode omitir `answers` (`ScaleApplicationSummary`).

### 4.4 Regras de negócio

| ID    | Regra                                                                                                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AV-01 | **Propriedade.** Aplicações seguem o dono do paciente (§1). O catálogo é visível a todos os educadores                                                                                                     |
| AV-02 | **Versão.** A aplicação grava `templateVersion` e é sempre lida e pontuada com aquela versão, mesmo depois de a escala mudar. Escala `active: false` não aceita aplicação nova (`409 SCALE_INACTIVE`)      |
| AV-03 | **Um rascunho por paciente e escala.** Iniciar quando já existe `DRAFT`: `409 { message: "DRAFT_ALREADY_EXISTS", applicationId }` (o app retoma o existente)                                               |
| AV-04 | **Respostas.** Gravação parcial e idempotente (upsert por `itemId`). `itemId` fora da escala: `400 ITEM_NOT_IN_SCALE`; valor fora das opções: `400 INVALID_ANSWER_VALUE`                                   |
| AV-05 | **Escore no servidor.** Recalculado a cada gravação. **O app não calcula nem interpreta** escore ou faixa (AC-AVA-03-01)                                                                                   |
| AV-06 | **Faixa parcial (G-60).** Com `partial: true`, `band` vem calculada sobre os itens respondidos e o app a mostra como "parcial"; a faixa definitiva é a da conclusão. _Alternativa: sem faixa até concluir_ |
| AV-07 | **Concluir.** Exige todos os itens (`400 { message: "SCALE_INCOMPLETE", missingItemIds }`). Depois disso a aplicação é **somente leitura** (`409 APPLICATION_NOT_EDITABLE`)                                |
| AV-08 | **Exclusão.** Só `DRAFT` pode ser excluído. `COMPLETED` nunca (registro clínico)                                                                                                                           |
| AV-09 | **Aviso clínico.** `disclaimer` volta em toda resposta de aplicação                                                                                                                                        |
| AV-10 | **Faixas** de uma escala cobrem todo o intervalo possível, sem buraco nem sobreposição (validar no seed)                                                                                                   |

### 4.5 Rotas sugeridas

Todas com Bearer.

| Método e rota                          | Uso no app                                                   | Corpo / query                               | Resposta                                                    | Erros                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /scale-template/`                 | "Modelos disponíveis" (AVA-01)                               | —                                           | `200 ScaleTemplateSummary[]` (sem `items`, com `itemCount`) | —                                                                                                      |
| `GET /scale-template/:id`              | Aplicar (AVA-02)                                             | —                                           | `200 ScaleTemplate`                                         | `404 SCALE_NOT_FOUND`                                                                                  |
| `POST /scale-application/`             | Iniciar (AVA-02)                                             | `studentId`, `templateId`, `appointmentId?` | `201 ScaleApplication`                                      | `400`; `403`; `404 STUDENT_NOT_FOUND`, `SCALE_NOT_FOUND`; `409 DRAFT_ALREADY_EXISTS`, `SCALE_INACTIVE` |
| `GET /scale-application/`              | Recentes (AVA-01), aba da ficha (PAC-05), rascunhos (AVA-05) | Query: `studentId?`, `status?`, `limit?`    | `200 ScaleApplicationSummary[]`, mais recente primeiro      | `400`                                                                                                  |
| `GET /scale-application/:id`           | Resultado (AVA-04) e retomar (AVA-05)                        | —                                           | `200 ScaleApplication`                                      | `403`; `404 APPLICATION_NOT_FOUND`                                                                     |
| `PUT /scale-application/:id/answers`   | Responder e salvar rascunho (AVA-02, AVA-05)                 | `answers: { itemId, value }[]` (1 ou mais)  | `200 ScaleApplication` com `score` recalculado              | `400 ITEM_NOT_IN_SCALE`, `INVALID_ANSWER_VALUE`; `403`; `404`; `409 APPLICATION_NOT_EDITABLE`          |
| `POST /scale-application/:id/complete` | "Concluir escala" (AVA-03)                                   | —                                           | `200 ScaleApplication` (`COMPLETED`)                        | `400 SCALE_INCOMPLETE`; `403`; `404`; `409 APPLICATION_NOT_EDITABLE`                                   |
| `POST /scale-application/:id/insight`  | "Insight preliminar" (AVA-03) — P2                           | —                                           | `200 ScaleApplication` com `insight`                        | `403`; `404`; `500 AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT`                                          |
| `DELETE /scale-application/:id`        | Descartar rascunho (AVA-05)                                  | —                                           | `204`                                                       | `403`; `404`; `409 APPLICATION_NOT_EDITABLE`                                                           |

### 4.6 Insight da escala (IA) — P2

| ID    | Regra                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| IN-01 | Gerado **sob demanda** (botão), não ao concluir, pelo mesmo motivo do G-52 (sem processamento em segundo plano na Vercel)                              |
| IN-02 | Em `DRAFT`, gera com `preliminary: true`; em `COMPLETED`, `preliminary: false`. Gerar de novo substitui o anterior                                     |
| IN-03 | Entrada: escala (nome, faixas), escore e subescalas, idade e gênero. **Não** envia as respostas item a item ao provedor quando o escore bastar (IA-05) |
| IN-04 | Até 800 caracteres; descreve o que o escore indica **sem diagnosticar** (IA-04) e sugere o que observar ou aprofundar                                  |

### 4.7 Critérios de aceite

| ID       | Critério                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| BE-AV-01 | O catálogo lista ao menos uma escala com itens, opções, faixas, aviso e referência                                 |
| BE-AV-02 | Iniciar, responder metade e ler: `score.partial = true` e `answered` correto                                       |
| BE-AV-03 | Segundo início para o mesmo paciente e escala devolve `409 DRAFT_ALREADY_EXISTS` com o id                          |
| BE-AV-04 | Concluir com item faltando devolve `SCALE_INCOMPLETE` com os ids; completo, a aplicação fica somente leitura       |
| BE-AV-05 | Escore e faixa conferem com a tabela da fonte para três conjuntos de respostas (mínimo, máximo e um intermediário) |
| BE-AV-06 | Mudar a versão da escala não altera o escore de aplicações antigas                                                 |
| BE-AV-07 | Aplicação de paciente de outro educador devolve 403                                                                |
| BE-AV-08 | O insight não afirma diagnóstico e vem em português                                                                |

## 5. Síntese da anamnese (IA) — P2

O design tem, na aba Avaliações da ficha, o cartão "Anamnese" com **"Ver síntese"**. Hoje só
existe a análise geral por IA (`…/analysis/student/:studentId/ai`), que mistura tudo.

| ID    | Regra                                                                                                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AS-01 | `POST /anamnese/responses/:responseId/summary` gera a síntese da resposta e **persiste** em `AnamneseResponse.summary = { text, generatedAt }`. Bearer; só o dono (403 para os demais) |
| AS-02 | `GET /anamnese/responses/:responseId` e a lista por aluno passam a trazer `summary` (ausente se nunca gerada) e `summaryOutdated: boolean` (resposta editada depois da síntese)        |
| AS-03 | Até 1500 caracteres, em tópicos curtos (histórico, queixa, desenvolvimento, escola, pontos de atenção). Regras IA-02 a IA-07; respostas do tipo arquivo não vão ao provedor            |
| AS-04 | Erros: `403`; `404 RESPONSE_NOT_FOUND`; `500 AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT`                                                                                                |

## 6. Relatórios — P2

### 6.1 Para que serve

O profissional gera um **documento** sobre o paciente para a família, a escola ou outro
profissional, imprime e envia. O design (`ReportsScreen`) mostra:

- o aviso "Relatórios seguros por padrão";
- os campos Paciente, Tipo de relatório e Período;
- "Incluir no documento" (lista de seções marcáveis; o design tem 5);
- "Gerar síntese";
- a prévia "Relatório pronto · PDF · N páginas", "Imprimir" e "Enviar".

Hoje o app gera o PDF do **relatório de uma sessão** e da **análise do aluno** no próprio
aparelho (`expo-print`, G-34 e G-45). A Entrega 4 generaliza isso.

**Decisão proposta (G-58):** o **backend monta o conteúdo** (dados, seções e a síntese da IA) e
guarda o **histórico**; o **app gera o PDF** a partir desse conteúdo, como já faz. Gerar PDF na
Vercel exigiria um navegador headless, pesado para o plano atual.

### 6.2 Entidades

```ts
type ReportType = "PROGRESS" | "ASSESSMENT" | "PDI_PROGRESS";
// PROGRESS: Evolução do atendimento; ASSESSMENT: Anamnese e avaliações; PDI_PROGRESS: Evolução do PDI
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
    defaultSections: ReportSection[];
  }[];
  sections: { section: ReportSection; label: string; sensitive: boolean }[];
  audiences: { audience: ReportAudience; label: string }[];
  periods: { key: string; label: string; days: number }[]; // ex. 30, 90, 180 dias
  maxPeriodDays: number; // 365
}

interface Report {
  id: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  type: ReportType;
  audience: ReportAudience;
  period: { from: string; to: string }; // AAAA-MM-DD
  sections: ReportSection[];
  content: ReportContent; // retrato no momento da geração (RP-03)
  createdAt: string;
  shares: { channel: "SHARE" | "PRINT"; at: string }[];
}

interface ReportContent {
  title: string;
  generatedAt: string;
  professional: { name: string; profession?: string };
  patient?: { displayName: string; ageYears: number; schoolGrade?: string }; // PATIENT_DATA
  sessionMetrics?: {
    sessions: number;
    answered: number;
    accuracy: number; // fração 0–1, como em G-43
    byCategory: { category: string; accuracy: number }[];
  };
  evolutions?: {
    sessionDate: string;
    planTitle?: string;
    achieved: number;
    total: number;
    record: string;
  }[];
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
  synthesis?: string; // texto da IA, parágrafos simples
}
```

### 6.3 Regras de negócio

| ID    | Regra                                                                                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RP-01 | **Seguro por padrão.** As seções `sensitive: true` (anamnese e avaliações) **não vêm marcadas** nos padrões das audiências `FAMILY` e `SCHOOL`. Nunca entram no conteúdo: documentos, endereço, telefones, dados do responsável e CPF           |
| RP-02 | **Nome do paciente.** `displayName` é o nome completo em todas as audiências. _Decisão a confirmar: usar só o primeiro nome na audiência `SCHOOL`_                                                                                              |
| RP-03 | **Retrato.** O `content` é gravado na geração e não muda se os dados mudarem depois. Reabrir mostra o mesmo documento                                                                                                                           |
| RP-04 | **Validação.** `from ≤ to`, período de até `maxPeriodDays`; seções dentro de `allowedSections` do tipo (`400 SECTION_NOT_ALLOWED`); ao menos uma seção                                                                                          |
| RP-05 | **Período vazio.** Sem sessão, evolução, plano nem aplicação no período, e sem anamnese: `400 REPORT_EMPTY_PERIOD`                                                                                                                              |
| RP-06 | **Síntese da IA** (`AI_SYNTHESIS`): gerada na criação, até 2500 caracteres, adequada à audiência (linguagem simples para `FAMILY`), regras IA-02 a IA-07. Se a IA falhar, o relatório **é criado sem a síntese** e traz `synthesisFailed: true` |
| RP-07 | **Exclusão.** O dono pode excluir um relatório (é um documento derivado; os dados clínicos continuam nas origens)                                                                                                                               |
| RP-08 | **Envios.** O app registra cada impressão ou envio (`POST /report/:id/share`); o histórico mostra a data do último. O envio em si é pelo compartilhamento do aparelho; o backend não manda e-mail nesta entrega                                 |

### 6.4 Rotas sugeridas

Todas com Bearer.

| Método e rota            | Uso no app                       | Corpo / query                                                         | Resposta                                                     | Erros                                                                                         |
| ------------------------ | -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `GET /report/options`    | Montar o formulário (REL-01)     | —                                                                     | `200 ReportOptions`                                          | —                                                                                             |
| `POST /report/`          | "Gerar síntese" (REL-01, REL-02) | `studentId`, `type`, `audience`, `period: { from, to }`, `sections[]` | `201 Report`                                                 | `400` validação, `SECTION_NOT_ALLOWED`, `REPORT_EMPTY_PERIOD`; `403`; `404 STUDENT_NOT_FOUND` |
| `GET /report/`           | Histórico (REL-03)               | Query: `studentId?`, `limit?`                                         | `200 ReportSummary[]` (sem `content`), mais recente primeiro | `400`                                                                                         |
| `GET /report/:id`        | Reabrir (REL-03)                 | —                                                                     | `200 Report`                                                 | `403`; `404 REPORT_NOT_FOUND`                                                                 |
| `POST /report/:id/share` | Registrar impressão ou envio     | `channel: "SHARE" \| "PRINT"`                                         | `200 Report`                                                 | `403`; `404`                                                                                  |
| `DELETE /report/:id`     | Excluir (REL-03)                 | —                                                                     | `204`                                                        | `403`; `404`                                                                                  |

### 6.5 Critérios de aceite

| ID       | Critério                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------- |
| BE-RP-01 | `options` traz os três tipos, as seções com `sensitive` e os períodos                                   |
| BE-RP-02 | Gerar com seção fora do tipo devolve `SECTION_NOT_ALLOWED`; período vazio devolve `REPORT_EMPTY_PERIOD` |
| BE-RP-03 | O conteúdo não tem telefone, endereço, documento nem dado do responsável, em nenhuma audiência          |
| BE-RP-04 | Editar uma evolução depois de gerar não muda o relatório já gerado (RP-03)                              |
| BE-RP-05 | Falha da IA cria o relatório sem síntese e com `synthesisFailed: true`                                  |
| BE-RP-06 | Relatório de outro educador devolve 403                                                                 |

## 7. Notificações no app — P3

### 7.1 Para que serve

O sino do cabeçalho (`AppHeader`) mostra o número de não lidas e abre a lista. **Sem push nesta
entrega (G-59):** o push remoto não funciona no Expo Go no Android desde o SDK 53, e o app roda
no Expo Go (G-41). As notificações aparecem só dentro do app.

### 7.2 Entidade

```ts
type NotificationKind =
  | "APPOINTMENTS_TODAY" // resumo do dia: "3 atendimentos hoje"
  | "EVOLUTION_PENDING" // sessão finalizada há mais de 24 h sem evolução
  | "PLAN_REVIEW_DUE" // revisão do plano vence em até 2 dias ou venceu
  | "SCALE_DRAFT_STALE"; // rascunho de escala parado há 7 dias

interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string; // até 80
  body: string; // até 200; pode ter o primeiro nome do paciente
  target?: {
    type: "AGENDA_DAY" | "SESSION" | "PLAN" | "SCALE_APPLICATION";
    id: string;
  }; // destino ao tocar
  createdAt: string;
  readAt?: string;
}
```

### 7.3 Regras

| ID    | Regra                                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NT-01 | **Geração por cron diário** (Vercel Cron, 06:00 de São Paulo), já que não há processamento em segundo plano confiável. O cron cria as notificações do dia para cada educador |
| NT-02 | **Idempotente:** no máximo uma notificação por `kind` + `target` por dia; `APPOINTMENTS_TODAY` uma por dia e só com atendimento `PENDING`                                    |
| NT-03 | Notificação de paciente que deixou de ser do educador some da lista (mesma regra de acesso)                                                                                  |
| NT-04 | Retenção de **90 dias**; a lista é paginada por cursor                                                                                                                       |
| NT-05 | O destino que não existe mais (plano encerrado, rascunho excluído) não é erro: o app mostra "não está mais disponível"                                                       |

### 7.4 Rotas sugeridas

Todas com Bearer.

| Método e rota                    | Uso no app                | Corpo / query                                    | Resposta                                        | Erros                               |
| -------------------------------- | ------------------------- | ------------------------------------------------ | ----------------------------------------------- | ----------------------------------- |
| `GET /notification/`             | Lista (NOT-01)            | Query: `unreadOnly?`, `limit?` (1–50), `cursor?` | `200 { items: AppNotification[], nextCursor? }` | `400`                               |
| `GET /notification/unread-count` | Contador do sino (NOT-01) | —                                                | `200 { count: number }`                         | —                                   |
| `POST /notification/:id/read`    | Tocar numa notificação    | —                                                | `200 AppNotification`                           | `403`; `404 NOTIFICATION_NOT_FOUND` |
| `POST /notification/read-all`    | "Marcar todas como lidas" | —                                                | `200 { updated: number }`                       | —                                   |

### 7.5 Critérios de aceite

| ID       | Critério                                                                                    |
| -------- | ------------------------------------------------------------------------------------------- |
| BE-NT-01 | Rodar o cron duas vezes no mesmo dia não duplica notificações                               |
| BE-NT-02 | Uma sessão finalizada há 25 h sem evolução gera `EVOLUTION_PENDING`; com evolução, não gera |
| BE-NT-03 | `read` diminui o `unread-count`; `read-all` zera                                            |

## 8. Pequenos pedidos e pendências — P3

| ID    | Pedido                                                                                                           | Por quê                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| PP-01 | Confirmar a unidade de `timeToAnswer` (o Swagger diz segundos; o app envia milissegundos desde 2026-10-09, G-07) | Pendente desde a Entrega 3 (pedido 19); relatórios 1000× errados se divergir |
| PP-02 | Sugestão `REWRITE_GOAL` com texto **igual** ao da meta atual não deve ser criada                                 | Visto no teste da Entrega 3 (S-02): a sugestão repetia o texto               |
| PP-03 | `GET /appointment/` com `from` e `to` (`AAAA-MM-DD`) para a agenda pedir só o intervalo visível                  | Hoje o app baixa todos os atendimentos                                       |
| PP-04 | Swagger com todas as rotas novas desta especificação                                                             | Integração e conferência (SW-01 da Entrega 3)                                |

## 9. Fora desta entrega

Para o backend não antecipar: **Equipe e convites** (EQP), **Central de ajuda** (AJD), **tipos
de atividade jogáveis** (ATV-04) e **imprimíveis** (ATV-05), **resultado de atividade não
múltipla escolha** (EVO-03), **envio automático de WhatsApp**, **push**, **recorrência de
atendimentos** e **escalas criadas pelo educador**.

## 10. Ordem de entrega sugerida (levas)

O app trabalha em paralelo com mocks fiéis a esta especificação (G-29), mas **só integra o que
estiver publicado**. A ordem que mais destrava o app:

| Leva | Conteúdo                                         | Destrava no app                        |
| ---- | ------------------------------------------------ | -------------------------------------- |
| 1    | §2 Senha (P0) e §3 Evolução sem IA (§3.1 a §3.5) | AUT-01, REC-03, EVO-01, EVO-02, EVO-05 |
| 2    | §4 Avaliações sem IA (§4.1 a §4.5)               | AVA-01 a AVA-05, PAC-05                |
| 3    | IA: §3.6, §4.6 e §5                              | EVO-04, insight da AVA-03, PAC-09      |
| 4    | §6 Relatórios                                    | REL-01 a REL-03                        |
| 5    | §7 Notificações e §8                             | NOT-01                                 |

A cada leva, o backend avisa quais rotas foram publicadas e o que mudou em relação a esta
proposta (como no [BACKEND-ENTREGUE](../entrega-3/BACKEND-ENTREGUE.md) da Entrega 3).

## 11. Decisões de produto para confirmar com o backend

O app propõe uma regra em cada ponto; confirme ou mude antes de implementar:

1. **Evolução só depois de finalizar a sessão** (EV-03). Alternativa: salvar a evolução
   finaliza a sessão.
2. **Evolução editável sem prazo e sem exclusão** (EV-09). Alternativa: travar a edição depois
   de N dias, para valor de prontuário.
3. **Critérios só a partir do PE** (EV-12, G-57; decidido: o PDI não é reserva).
4. **Faixa parcial durante a aplicação** (AV-06, G-60). Alternativa: só na conclusão.
5. **Um rascunho por paciente e escala** (AV-03).
6. **PDF gerado no app, conteúdo no backend** (G-58).
7. **Relatório pode ser excluído** (RP-07), ao contrário de planos e evoluções.
8. **Notificações por cron diário** (NT-01), sem tempo real.

## 12. Como o app integra

1. O backend publica uma leva (§10) e responde as decisões do §11.
2. O orquestrador do app registra o contrato real no `PROJECT.md` (API-04) e ajusta as fichas;
   o worker da API-05 atualiza tipos, endpoints e mocks.
3. Cada tela é testada com mocks fiéis e depois contra o backend real, com evidência por rota no
   [TRACKING](TRACKING.md).
4. Diferenças entre esta proposta e o contrato real não são "corrigidas" no app: o app segue o
   contrato.

## 13. Histórico

- 2026-11-12: primeira versão, junto com o planejamento da Entrega 4.
