# Testes manuais — Planos com IA (PLN-01 a PLN-05)

Detalhamento da área de **Planos** do [PLANO-TESTES](../PLANO-TESTES.md) §2.6 (casos `PLN-01.x` a
`PLN-05.x`), com o que observar na tela e na rede e onde olhar no código quando algo falhar. Os
IDs e os casos do plano original foram preservados; os casos novos seguem o mesmo padrão de ID.

> **Estado:** roteiro escrito sem abrir o emulador, o Metro nem o app. Nenhum caso foi executado.
> Texto de tela, rotas, funções e testes citados aqui foram conferidos no código na data da
> escrita (2026-10-29). Onde o código difere da ficha, o caso traz **Divergência encontrada**.

## Escopo e tarefas cobertas

| Tarefa | O que cobre                                     | Ficha                                                           |
| ------ | ----------------------------------------------- | --------------------------------------------------------------- |
| PLN-01 | Lista de planos (Recursos → "Planos com IA")    | [PLN-01](../BACKLOG.md#pln-01--lista-de-planos)                 |
| PLN-02 | Gerar rascunho com IA                           | [PLN-02](../BACKLOG.md#pln-02--gerar-plano-com-ia)              |
| PLN-03 | Rascunho editável e salvar                      | [PLN-03](../BACKLOG.md#pln-03--rascunho-editável-e-salvar)      |
| PLN-04 | Detalhe, metas, edição, revisões e encerramento | [PLN-04](../BACKLOG.md#pln-04--detalhe-do-plano)                |
| PLN-05 | Sugestões da IA (sob demanda)                   | [PLN-05](../BACKLOG.md#pln-05--sugestões-da-ia-sob-demanda)     |
| PAC-04 | Aba "Planos" e "PDI vigente" na ficha (entrada) | [PAC-04](../BACKLOG.md#pac-04--aba-planos-na-ficha-do-paciente) |

Contrato do backend: [BACKEND-ENTREGUE](../BACKEND-ENTREGUE.md) §3 (planos), §4 (`POST /plan/generate`)
e §5 (sugestões); divergências §9. Decisões: G-46 (timeout de IA de 90 s) e G-47 a G-51 em
[GATES](../../entrega-1/GATES.md).

## Mapa da área

| Rota (`app/`)               | Tela (`src/features/plans/`)                                                            | Hook / consulta (`queryKey`)                                                                                                                          | Endpoint (`src/api/endpoints/plans.ts`)                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `app/plans/index.tsx`       | `hub/PlansHubScreen.tsx` › `PlansHubScreen`                                             | `hub/usePlans.ts` › `usePlans` — `planQueryKeys.list()` = `["plan","list"]`                                                                           | `listPlans`                                                                                                                       |
| `app/plans/new.tsx`         | `generate/GeneratePlanScreen.tsx` › `GeneratePlanScreen`                                | `useStudents`; consulta `["plans","active-pdi",studentId]`; `["anamnese-responses",studentId]`; `["anamnese-templates"]`; mutação `generatePlanDraft` | `generatePlanDraft`, `listPlans` (PDI pai), `listAnamneseResponsesByStudent`, `listAnamneseTemplates`                             |
| (dentro de `new.tsx`)       | `generate/DraftPreview.tsx` › `DraftPreview` + `draft/PlanForm.tsx` › `PlanForm`        | mutação `createPlan`; invalida `planQueryKeys.all` = `["plan"]`                                                                                       | `createPlan`, `PlanApiError`                                                                                                      |
| `app/plans/[id].tsx`        | `detail/PlanDetailScreen.tsx` › `PlanDetailScreen`                                      | `["plan","detail",id]` e `["plan","reviews",id]`                                                                                                      | `getPlan`, `updatePlan`, `updateGoalStatus`, `createPlanReview`, `listPlanReviews`, `updatePlanStatus`, `generatePlanSuggestions` |
| `app/plans/suggestions.tsx` | `suggestions/PlanSuggestionsScreen.tsx` › `PlanSuggestionsScreen`, `SuggestionCard.tsx` | `suggestions/usePlanSuggestions.ts` › `usePendingSuggestions`, `useSuggestionActions` — `pendingSuggestionsKey` = `["plan","suggestions","PENDING"]`  | `listPlanSuggestions`, `acceptPlanSuggestion`, `dismissPlanSuggestion`                                                            |
| `app/patients/[id].tsx`     | `src/features/patients/detail/plans/PatientPlans.tsx` › `PatientPlans`, `ActivePdi`     | `usePatientPlans`: `["plan","student",studentId]`; `useActivePdi`: `["plan","student",studentId,"PDI","ACTIVE"]`                                      | `listPlans` com filtros                                                                                                           |
| `app/(tabs)/index.tsx`      | `src/features/home/HomeScreen.tsx` (cartão de sugestões, atalho "Criar plano")          | `usePendingSuggestions`                                                                                                                               | `listPlanSuggestions("PENDING")`                                                                                                  |

Rotas e destinos: `src/features/plans/routes.ts` (`PLANS_ROUTE`, `NEW_PLAN_ROUTE` = `/plans/new`,
`PLAN_SUGGESTIONS_ROUTE` = `/plans/suggestions`, `planDetailRoute`, `afterSavePlanRoute`).

Mocks: `src/mocks/handlers/plans.ts` (`mockPlans`, `MOCK_FOREIGN_STUDENT_ID`,
`MOCK_FOREIGN_PLAN_ID`). Tipos em `src/api/types.ts` (`Plan`, `PlanDraft`,
`PlanSummary`, `PlanSuggestion`, `GoalStatus`).

**Componentes do design system envolvidos** (`src/components/ds/`): `AppHeader`, `AIHero`,
`AIContext`, `InfoCard`, `FilterRow`, `ProgressBar`, `SectionTitle`, `Badge`, `DsButton`, `Field`,
`SelectField`, `SegmentedControl`, `CheckList`, `DateField`, `Toast`/`useToast`, `InsightCard`
(Início). Fora do DS: `src/components/PendingBanner` (aviso offline).

**Cenários de mock úteis** (rodar com `EXPO_PUBLIC_USE_MOCKS=true`, login `educadora.mock@labirinto.test`;
ver [src/mocks/README.md](../../../src/mocks/README.md), seções "Planos com IA" a "Sugestões"):

| Para reproduzir                 | Como, no mock                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Falha da IA na geração          | Escrever `[AI_GENERATION_FAILED]` ou `[AI_INVALID_OUTPUT]` no campo "Foco do planejamento" → `500 AI_*`         |
| Falha da IA nas sugestões       | Plano cujo título contém `[AI_GENERATION_FAILED]` → `500 AI_GENERATION_FAILED` em `.../suggestions/generate`    |
| `409 ACTIVE_PDI_ALREADY_EXISTS` | Gerar e salvar um PDI para `student-1` (já tem `mock-plan-1` ativo); o corpo traz `activePlanId: "mock-plan-1"` |
| `403` e `404`                   | `mock-student-foreign` no filtro/geração; `mock-plan-foreign` no detalhe; id inexistente → `404 PLAN_NOT_FOUND` |
| Sugestão pendente pronta        | `mock-suggestion-1` já pendente em `mock-plan-1`                                                                |
| Plano encerrado                 | `mock-plan-3` (`student-3`, PDI `COMPLETED`); escritas respondem `409 PLAN_NOT_EDITABLE`                        |

**Backend real:** os cenários de erro da IA (`AI_*`) e de timeout só aparecem se o backend falhar
de fato; não force. Anote o que ocorrer.

## Tempos da IA

Esta tabela substitui a do PLANO-TESTES (§4.1 da primeira versão) e complementa o caso BE-07 (ver [06-fluxos-e-backend.md](06-fluxos-e-backend.md)).
O limite do app é `AI_TIMEOUT_MS` = 90 000 ms (`src/api/endpoints/ai-timeout.ts`), usado em
`generatePlanDraft` e `generatePlanSuggestions`; o timeout padrão das demais rotas é 10 s
(`API_TIMEOUT_MS` em `src/api/client.ts`). O backend faz até 2 tentativas ao provedor de IA, então
o pior caso é maior que o típico. O tempo típico das rotas de IA da V1 é de 30 a 45 s
([CONTEXTO-SESSAO](../../CONTEXTO-SESSAO.md) §7); o de planos **ainda não foi medido** — esta
rodada o mede.

**Como medir (sem alterar o código):**

1. Cronômetro do celular ou do relógio da máquina. Inicie no **toque** em "Gerar planejamento com
   IA" (ou "Pedir sugestões da IA") e pare quando o rascunho (ou o aviso) aparecer.
2. Opcional, mais preciso: ferramenta de rede do Metro/Expo ou `adb logcat` filtrando pelo host do
   backend; use a diferença entre o início e o fim da requisição `POST /plan/generate`.
3. Registre **uma linha por tentativa**: chamada, tipo/duração, segundos, resultado (OK, erro `AI_*`,
   timeout). Faça pelo menos uma tentativa por linha da tabela abaixo; se a primeira
   passar de 45 s, repita uma vez para separar partida a frio de lentidão da IA.

| Chamada                               | Tipo / parâmetros                  | Onde dispara                               | Limite do app | Esperado (backend)            | Tentativa | Tempo (s) | Resultado |
| ------------------------------------- | ---------------------------------- | ------------------------------------------ | ------------- | ----------------------------- | --------- | --------- | --------- |
| `POST /plan/generate` (PDI 3)         | `type: PDI`, `durationMonths: 3`   | "Gerar planejamento com IA" (`/plans/new`) | 90 s          | `200 PlanDraft` (3 a 6 metas) | 1         |           |           |
| `POST /plan/generate` (PDI 6)         | `type: PDI`, `durationMonths: 6`   | idem, "Duração de referência" = "6 meses"  | 90 s          | `200 PlanDraft`               | 1         |           |           |
| `POST /plan/generate` (PE)            | `type: PE`, `sessionDate`, PDI pai | idem, "PE da sessão"                       | 90 s          | `200 PlanDraft` sem revisão   | 1         |           |           |
| `POST /plan/:id/suggestions/generate` | plano ativo                        | "Pedir sugestões da IA" (detalhe do plano) | 90 s          | `201` com novas ou `200 []`   | 1         |           |           |

Leitura do resultado: abaixo de 45 s é o esperado; entre 45 e 90 s funciona, mas anote (pode pedir
barra de progresso/aviso); acima de 90 s o app mostra "A geração demorou mais que o esperado. Tente
de novo." (geração) e **não reenvia sozinho** (AC-PLN-02-04). Se vier timeout com o backend
respondendo no Swagger, o limite do app precisa subir em `ai-timeout.ts` (nova decisão, G-46).

---

## 1. Lista de planos (PLN-01)

Arquivos de teste da tela: `src/features/plans/hub/__tests__/PlansHubScreen.test.tsx`; leitura
real: `src/api/endpoints/__tests__/plans.test.ts`.

#### PLN-01.1 — Estado vazio da lista

- **Prioridade / AC:** P1 · PLN-01 (MAN), AC-PLN-01-01 e AC-PLN-01-03
- **Objetivo:** a tela abre sem plano algum e mostra o título certo, o destaque e o vazio, sem quebrar.
- **Pré-condição:** conta de teste **sem** plano (se a conta já tiver planos de rodadas anteriores, use
  `EXPO_PUBLIC_USE_MOCKS=true` com a conta mock só para ver o vazio — o mock já traz planos; neste caso,
  registre N/A).
- **Passos:**
  1. Tocar na aba **Recursos**.
  2. Em "Planejamento personalizado", tocar em **"Planos com IA"** ("Crie planos personalizados com inteligência artificial").
- **Resultado esperado:**
  - **Tela:** cabeçalho "Planos com IA" com o subtítulo "PDI e planejamento educacional" e botão de voltar;
    destaque `AIHero` "Planejamento conectado à evolução real" com o texto "Crie PDIs e planos de sessão a partir
    do histórico do paciente, com metas que acompanham a evolução." e o botão "Criar novo plano"; abaixo, o texto
    **"Nenhum plano ainda"**. Sem o filtro (`FilterRow`) enquanto a lista está vazia. Rota `/plans`.
  - **Rede (backend real):** `GET /plan/` (sem query), status `200`, corpo `[]`.
  - **Depois:** nada muda; ao criar o primeiro plano (PLN-03.2), a lista passa a mostrá-lo.
- **Onde está no código:** `app/plans/index.tsx` → `src/features/plans/hub/PlansHubScreen.tsx` ›
  `PlansHubScreen` (ramo `isEmpty`); `usePlans` (`planQueryKeys.list()`); `listPlans` em
  `src/api/endpoints/plans.ts`; Recursos: `src/features/resources/ResourcesScreen.tsx` (`destination: "/plans"`).
  DS: `AppHeader`, `AIHero`.
- **Testes automatizados que cobrem:** `PlansHubScreen.test.tsx` — `it("mostra cabeçalho, hero, seções e itens (AC-PLN-01-01)")`
  e `it("mostra o vazio com o atalho de criação (AC-PLN-01-03)")`. Rodar:
  `pnpm exec vitest run src/features/plans/hub/__tests__/PlansHubScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. Tela em branco/carregando para sempre → a consulta não resolveu: ver a rede; `GET /plan/` pendente indica partida a
     frio (BE-08); `401` volta ao Login (interceptor em `src/api/client.ts`).
  2. "Não foi possível carregar os planos." + "Verifique sua conexão e tente novamente." → erro de rede ou `5xx`; reproduza
     com o modo avião (esperado) e confira o status no backend; o botão "Tentar de novo" chama `plansQuery.refetch()`.
  3. Abre a tela errada ("Em breve") → rota provisória antiga; o destino correto é `/plans` (`ResourcesScreen.tsx`).
  4. Mock × backend: com mocks ligados a lista **nunca** é vazia (`mockPlans`); o vazio só vem do backend real.
- **Evidência:** captura da tela com o vazio; método, caminho e status de `GET /plan/`.

#### PLN-01.2 — Lista com seções, progresso e filtro

- **Prioridade / AC:** P1 · PLN-01 (MAN), AC-PLN-01-01
- **Objetivo:** a lista agrupa "Em andamento" e "Encerrados", mostra o progresso vindo do servidor e filtra por tipo.
- **Pré-condição:** pelo menos um PDI ativo e um PE (criados nos casos PLN-03/PLN-02.4); idealmente um plano encerrado
  (PLN-04.6).
- **Passos:**
  1. Abrir Recursos → "Planos com IA".
  2. Conferir as seções e a ordem.
  3. Tocar em **"PDI"**, depois **"PE"**, depois **"Todos"** no filtro.
- **Resultado esperado:**
  - **Tela:** seção **"Em andamento"** (planos `ACTIVE`) e **"Encerrados"** (`COMPLETED`/`CANCELLED`). Cada item é um `InfoCard`
    com o **nome do paciente** no título e, na descrição, `Tipo · Título` (`PDI · …`; encerrado acrescenta `· Concluído`
    ou `· Cancelado`); abaixo, `ProgressBar` com `N%` e, quando houver, "Próxima revisão: dd/mm" (sem ano, sem
    conversão de fuso). Rótulo acessível do item: "{paciente}, {descrição}, {N}% concluído". Filtro mostra só o tipo
    escolhido; com o filtro sem resultado: **"Nenhum plano deste tipo ainda"**. Tocar num item abre `/plans/{id}`.
  - **Rede (backend real):** `GET /plan/`, `200 PlanSummary[]` (sem `goals`; com `studentName`, `progress`, `updatedAt`).
    O filtro é **só no app** (uma única chamada).
  - **Depois:** criar/editar/encerrar um plano invalida `["plan"]` e a lista refaz (ver PLN-03.2, PLN-04.6).
- **Onde está no código:** `PlansHubScreen.tsx` › `PlanItem`, `filterOptions`; `hub/selectors.ts` › `selectPlanSections`
  (mantém a ordem do servidor: `ACTIVE` primeiro e `updatedAt` decrescente), `formatReviewDate`, `planTypeLabel`;
  `usePlans`; DS: `InfoCard`, `ProgressBar`, `FilterRow`, `SectionTitle`.
- **Testes automatizados que cobrem:** `PlansHubScreen.test.tsx` — `it("mostra a próxima revisão como dd/mm sem converter fuso")`,
  `it("filtra por tipo")`; `plans.test.ts` — `it("devolve ACTIVE primeiro e depois updatedAt decrescente")`. Rodar:
  `pnpm exec vitest run src/features/plans/hub/__tests__/PlansHubScreen.test.tsx src/api/endpoints/__tests__/plans.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Ordem errada (encerrado acima do ativo) → o app **não reordena**; a ordem é do servidor (`selectPlanSections` só
     particiona). Conferir a resposta de `GET /plan/` (ativos primeiro, depois `updatedAt` decrescente) — se vier fora de
     ordem, é do backend.
  2. Percentual diferente do detalhe → o app não calcula: usa `plan.progress.percent` do servidor; compare com o detalhe
     (PLN-04.1). Metas `DISCONTINUED` ficam fora do total (BACKEND-ENTREGUE §3).
  3. Data de revisão um dia antes → conversão de fuso indevida; a data é de calendário (`formatReviewDate`).
  4. Nome do paciente ausente → `studentName` não veio (D7, `PlanSummary`).
- **Evidência:** captura da lista (seções e filtro); percentuais anotados para comparar com o detalhe.

#### PLN-01.3 — Entradas para a geração (lista e Início)

- **Prioridade / AC:** P1 · PLN-01 (MAN), AC-PLN-01-02
- **Objetivo:** os dois atalhos abrem a geração **sem paciente escolhido**.
- **Pré-condição:** logado.
- **Passos:**
  1. Em "Planos com IA", tocar em **"Criar novo plano"** (no destaque).
  2. Voltar. Na aba **Início**, em "Acesso rápido", tocar em **"Criar plano"**.
- **Resultado esperado:**
  - **Tela:** as duas abrem "Novo planejamento" (subtítulo "Planos com IA") com **"Escolha o paciente para começar."**
    e o campo "Paciente". Rota `/plans/new` sem `studentId`.
  - **Rede (backend real):** `GET /student/` (lista de pacientes para o seletor); nenhuma chamada de plano ainda.
  - **Depois:** —
- **Onde está no código:** `PlansHubScreen.tsx` (`router.push(NEW_PLAN_ROUTE)`); `HomeScreen.tsx` (`QuickAccess`
  "Criar plano" → `NEW_PLAN_ROUTE`); `src/features/plans/routes.ts`.
- **Testes automatizados que cobrem:** `PlansHubScreen.test.tsx` — `it("abre o detalhe provisório e a tela de novo plano (AC-PLN-01-02)")`;
  `src/features/home/__tests__/HomeScreen.test.tsx` — teste que pressiona "Criar plano" e espera `routerPush` com `/plans/new`.
  Rodar: `pnpm exec vitest run src/features/plans/hub/__tests__/PlansHubScreen.test.tsx src/features/home/__tests__/HomeScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. Cai em "Em breve" → rota antiga; conferir `routes.ts` e o `onPress` do atalho.
  2. Paciente já vem escolhido → veio de `/patients/[id]` com `?studentId=` (PAC-04.2); da lista e da Início não deve vir.
  3. Seletor vazio → `useStudents` sem dados (erro de `GET /student/`); conferir a rede.
- **Evidência:** captura de cada destino.

#### PLN-01.4 — Offline e erro da lista

- **Prioridade / AC:** P3 · AC-PLN-01-03
- **Objetivo:** com dados já carregados o app avisa que está offline; sem cache, mostra erro recuperável.
- **Pré-condição:** lista aberta ao menos uma vez (cache persistido).
- **Passos:**
  1. Ligar o modo avião; reabrir "Planos com IA".
  2. (Opcional) Limpar o app/cache e abrir offline.
  3. Desligar o modo avião e tocar em "Tentar de novo" (se aparecer).
- **Resultado esperado:**
  - **Tela:** com cache: faixa **"Sem conexão - mostrando dados salvos"** (`PendingBanner`) e a lista salva. Sem cache:
    "Não foi possível carregar os planos." / "Verifique sua conexão e tente novamente." / **"Tentar de novo"**.
  - **Rede:** com a rede de volta, `GET /plan/` refaz e a faixa some.
  - **Depois:** —
- **Onde está no código:** `PlansHubScreen.tsx` (`useOnline`, `PendingBanner`); `src/hooks/useOnline.ts`;
  `src/api/query-client.ts` (`networkMode: "online"` nas leituras); cache persistido em `src/api/query-persister.ts`.
- **Testes automatizados que cobrem:** `PlansHubScreen.test.tsx` — `it("avisa quando está offline e mantém a lista salva")`,
  `it("mostra erro com Tentar de novo (AC-PLN-01-03)")`.
- **Se falhar:**
  1. Faixa não aparece → `useOnline` não detectou a queda (NetInfo no Expo Go); confirmar com outra tela com o mesmo aviso (AGE-01.4).
  2. Lista some sem cache → o cache persistido (`expo-sqlite/kv-store`) não foi gravado; ver `query-persister.ts`.
  3. Não volta ao tocar → `refetch` falhou de novo; ver a rede.
- **Evidência:** capturas do aviso e do erro.

#### PLN-01.5 — Filtro sem resultado (novo)

- **Prioridade / AC:** P3 · AC-PLN-01-03
- **Objetivo:** a mensagem de vazio por tipo.
- **Pré-condição:** só planos de **um** tipo (por exemplo, só PDI).
- **Passos:** abrir a lista e tocar no filtro do outro tipo ("PE").
- **Resultado esperado:** **"Nenhum plano deste tipo ainda"** no lugar das seções; o filtro continua visível; "Todos" volta a listar.
  Sem chamada de rede nova.
- **Onde está no código:** `PlansHubScreen.tsx` (ramo `active.length === 0 && closed.length === 0`); `selectPlanSections`.
- **Testes automatizados que cobrem:** `PlansHubScreen.test.tsx` — `it("filtra por tipo")`.
- **Se falhar:** se o filtro some ou a lista vira vazia ("Nenhum plano ainda"), `plans.length === 0` foi avaliado errado: conferir `isEmpty` em `PlansHubScreen`.
- **Evidência:** captura.

## 2. Geração (PLN-02)

Testes da tela: `src/features/plans/generate/__tests__/GeneratePlanScreen.test.tsx`; contrato:
`src/api/endpoints/__tests__/plans-generate.test.ts`. A geração **não salva nada**; só `createPlan` (PLN-03)
persiste.

#### PLN-02.1 — Escolher o paciente e ver o formulário de geração

- **Prioridade / AC:** P1 · PLN-02 (MAN), AC-PLN-02-01 e AC-PLN-02-02
- **Objetivo:** ao escolher o paciente, os campos de geração aparecem com as dificuldades já marcadas.
- **Pré-condição:** Paciente A com dificuldades cadastradas (`learningTopics`).
- **Passos:**
  1. Abrir `/plans/new` pela lista de planos (PLN-01.3).
  2. Tocar no campo **"Paciente"** e escolher "Paciente Teste Um".
- **Resultado esperado:**
  - **Tela:** o subtítulo do cabeçalho passa a ser o nome do paciente. Aparecem: seletor **"Tipo de plano"**
    (`SegmentedControl`: "PDI" / "PE da sessão"), campo **"Foco do planejamento"** (placeholder "O que você deseja trabalhar?",
    até 1000 caracteres), o aviso `AIContext` ("Contexto conectado: dificuldades do paciente, PDI ativo e anamnese
    selecionada ajudam a gerar as metas. O rascunho não é salvo automaticamente."), a seção **"Dificuldades consideradas"**
    com **todas marcadas** (no máximo 20), **"Duração de referência"** ("3 meses" / "6 meses"; 3 por padrão) e o botão
    **"Gerar planejamento com IA"**, **desabilitado** enquanto o foco estiver vazio.
  - **Rede (backend real):** `GET /student/`; ao escolher o paciente, também `GET /plan/?studentId=…&type=PDI&status=ACTIVE`,
    `GET /anamnese/responses/student/:studentId` e `GET /anamnese/templates/` (para o campo "Incluir anamnese").
  - **Depois:** —
- **Onde está no código:** `GeneratePlanScreen.tsx` › `GeneratePlanScreen` (`canGenerate`, `difficulties`,
  `parentQuery`, `responsesQuery`, `templatesQuery`); DS: `SelectField`, `SegmentedControl`, `Field`, `AIContext`,
  `CheckList`, `SectionTitle`, `DsButton`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("pede paciente quando a rota não traz studentId")`;
  `it("marca dificuldades e bloqueia geração se todas forem desmarcadas")`. Rodar:
  `pnpm exec vitest run src/features/plans/generate/__tests__/GeneratePlanScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. "Paciente não encontrado." ou "Não foi possível carregar os pacientes." → `useStudents` falhou ou o id da rota
     (`?studentId=`) não está na lista; conferir `GET /student/`.
  2. Dificuldades vazias → o paciente não tem `learningTopics` (a geração exige ao menos 1 — ver PLN-02.3); cadastre uma no "Editar paciente".
  3. Botão sempre desabilitado → foco vazio, ou tipo PE com a consulta do PDI pai pendente/erro (PLN-02.4).
  4. Mais de 20 dificuldades → só as 20 primeiras entram (`slice(0, 20)`), regra do contrato (até 20).
- **Evidência:** captura do formulário completo.

#### PLN-02.2 — Gerar um PDI de 3 meses (e cronometrar)

- **Prioridade / AC:** P1 · PLN-02 (MAN), AC-PLN-02-03/04
- **Objetivo:** o rascunho vem do backend real dentro do limite de 90 s, sem salvar nada; mede o tempo da IA.
- **Pré-condição:** PLN-02.1; foco preenchido ("O que você deseja trabalhar?"), tipo "PDI", "3 meses". Paciente A **sem** PDI ativo.
- **Passos:**
  1. Iniciar o cronômetro e tocar em **"Gerar planejamento com IA"**.
  2. Observar o estado de espera.
  3. Parar o cronômetro quando o rascunho aparecer.
- **Resultado esperado:**
  - **Tela:** o botão fica em carregamento e aparece **"Gerando o planejamento…"** (anunciado como região "polite");
    o botão não reenvia. Ao fim, abre o rascunho logo abaixo do botão, com os selos **"Rascunho não salvo"** e **"Editável"**,
    título, objetivo, "Início sugerido: AAAA-MM-DD", "Fim sugerido: …", "Próxima revisão sugerida: …" e "Por que essas metas"
    (se houver `rationale`), 3 a 6 metas. **Nenhum plano novo** aparece na lista de planos.
  - **Rede (backend real):** `POST /plan/generate` com `studentId`, `type: "PDI"`, `focus`, `consideredDifficulties`,
    `durationMonths: 3` (sem `sessionDate`); `timeout` 90 000 ms; `200 PlanDraft`. As datas vêm do servidor
    (início = hoje em São Paulo, fim = início + 3 meses, revisão = início + 1 mês).
  - **Depois:** nada é persistido (`GET /plan/` continua igual).
- **Onde está no código:** `GeneratePlanScreen.tsx` › `submit` (monta `GeneratePlanDraftInput`), `generation` (`useMutation`
  com `retry: false`); `src/api/endpoints/plans.ts` › `generatePlanDraft` (`timeout: AI_TIMEOUT_MS`);
  `src/api/endpoints/ai-timeout.ts`; mock: `src/mocks/handlers/plans.ts` (`POST /plan/generate`).
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("envia PDI de 3 meses e mostra rascunho sem salvar")`;
  `plans-generate.test.ts` — `it("devolve rascunho PDI sem persistir um plano")`; `src/api/__tests__/ai-timeout.test.ts` (padrão do timeout de IA).
- **Se falhar:**
  1. Espera passa de 90 s e aparece "A geração demorou mais que o esperado. Tente de novo." → timeout do app (`isTimeout`);
     conferir se o backend respondeu depois (rede); ver o limite em `ai-timeout.ts` (G-46). Registre o tempo na tabela de tempos.
  2. "Não foi possível gerar agora. Tente de novo em instantes." → `500 AI_GENERATION_FAILED` ou `AI_INVALID_OUTPUT` (PLN-02.5).
  3. "Não foi possível gerar o planejamento. Verifique os dados e tente de novo." → `400`/`404`/`403` ou erro de rede; ler
     o status na rede (`STUDENT_NOT_FOUND`, `Bad Request` por foco vazio ou dificuldade > 100 caracteres).
  4. Rascunho pede salvar mas já aparece no histórico de planos → não deve ocorrer; `generatePlanDraft` não persiste.
  5. Mock × backend: no mock, o rascunho é instantâneo; só o backend real mede a IA.
- **Evidência:** tempo em segundos, captura do rascunho, status e caminho de `POST /plan/generate`.

#### PLN-02.3 — Desmarcar todas as dificuldades

- **Prioridade / AC:** P2 · AC-PLN-02-02
- **Objetivo:** a geração exige ao menos uma dificuldade.
- **Pré-condição:** PLN-02.1.
- **Passos:** desmarcar todas as dificuldades em "Dificuldades consideradas".
- **Resultado esperado:** aparece **"Selecione pelo menos uma dificuldade."** e o botão "Gerar planejamento com IA" fica **desabilitado**;
  marcar uma volta a habilitá-lo. Mexer em qualquer campo descarta um rascunho já exibido (`setDraft(null)`).
- **Onde está no código:** `GeneratePlanScreen.tsx` (`difficultySelection`, `canGenerate`); DS `CheckList`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("marca dificuldades e bloqueia geração se todas forem desmarcadas")`.
- **Se falhar:** botão habilitado com 0 marcadas → `difficulties.length >= 1` em `canGenerate`; troca de paciente
  deve reiniciar a seleção (`difficultySelection.studentId !== studentId` volta à lista do paciente).
- **Evidência:** captura com o aviso.

#### PLN-02.4 — Gerar um PE ligado ao PDI ativo (e incluir anamnese)

- **Prioridade / AC:** P2 · PLN-02 (MAN), AC-PLN-02-03
- **Objetivo:** o PE usa a data da sessão e o PDI ativo como pai; a anamnese escolhida entra na geração.
- **Pré-condição:** Paciente A com **PDI ativo** (após PLN-03.2); opcional: uma anamnese respondida (PAC-06.1).
- **Passos:**
  1. Em `/plans/new` (ou pela ficha → "Planos" → "Criar novo plano"), escolher o Paciente A.
  2. Tocar em **"PE da sessão"**; conferir "Data da sessão" (hoje por padrão) e o texto "Baseado no PDI: {título}".
  3. Se aparecer **"Incluir anamnese"**, escolher um modelo respondido; testar também "Não incluir".
  4. Preencher o foco e tocar em "Gerar planejamento com IA".
- **Resultado esperado:**
  - **Tela:** o bloco "Duração de referência" some e aparece o `DateField` "Data da sessão". "Baseado no PDI: …" com o
    título do PDI ativo. O campo "Incluir anamnese" só existe se o paciente tiver respostas de algum modelo. Rascunho de PE sem "Próxima revisão sugerida".
  - **Rede (backend real):** `POST /plan/generate` com `type: "PE"`, `sessionDate: "AAAA-MM-DD"`, `parentPlanId` = id do PDI ativo
    (sem `durationMonths`) e, se escolhido, `includeAnamnesisTemplateId`; `200 PlanDraft` com `suggestedStartDate = suggestedEndDate = sessionDate`.
  - **Depois:** —
- **Onde está no código:** `GeneratePlanScreen.tsx` (`type`, `parent`, `templateOptions`, `submit`; consulta `["plans","active-pdi",studentId]`
  — **raiz `plans`, diferente de `planQueryKeys.all`**); DS `DateField`, `SelectField`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("envia PE com data e PDI ativo")`;
  `plans-generate.test.ts` — `it("usa a data da sessão para o PE e omite revisão")` e `it("expõe erros de paciente, PDI pai, modelo e IA")`.
- **Se falhar:**
  1. Botão desabilitado no PE → a consulta do PDI ativo ainda carrega ou falhou ("Não foi possível consultar o PDI ativo."): `canGenerate`
     exige `!parentQuery.isPending && !parentQuery.isError` quando `type === "PE"`. Conferir `GET /plan/?studentId=…&type=PDI&status=ACTIVE`.
  2. `404 TEMPLATE_NOT_FOUND` / `400 INVALID_PARENT_PLAN` → mensagem genérica "Não foi possível gerar o planejamento…"; a causa está no status da resposta.
  3. PE sem pai (paciente sem PDI ativo) → o app **não envia** `parentPlanId` (permitido: é opcional); confirmar se o servidor aceitou.
  4. "Incluir anamnese" ausente → o paciente não tem resposta de nenhum modelo (`answeredTemplateIds`); crie uma pela PAC-06.
- **Evidência:** captura do PE e do bloco "Baseado no PDI"; corpo (só campos) da chamada.
- **Divergência encontrada:** a ficha fala em "PDI ativo como pai" sempre; o código só envia `parentPlanId` quando há PDI ativo.

#### PLN-02.5 — Falha, timeout e rede desligada na geração

- **Prioridade / AC:** P2 · AC-PLN-02-04
- **Objetivo:** erros da geração têm mensagem certa, botão "Tentar de novo" e **nenhum reenvio automático**.
- **Pré-condição:** formulário de geração pronto.
- **Passos:**
  1. Ligar o modo avião e tocar em "Gerar planejamento com IA".
  2. Desligar o modo avião e tocar em **"Tentar de novo"**.
  3. (Só mock) com `EXPO_PUBLIC_USE_MOCKS=true`, escrever `[AI_GENERATION_FAILED]` no foco e gerar.
- **Resultado esperado:**
  - **Tela:** o aviso (papel "alert") em vermelho e o botão **"Tentar de novo"** (secundário). Mensagens exatas do código:
    - timeout (`isTimeout`): **"A geração demorou mais que o esperado. Tente de novo."**;
    - `AI_GENERATION_FAILED` ou `AI_INVALID_OUTPUT` (`500`): **"Não foi possível gerar agora. Tente de novo em instantes."**;
    - qualquer outro erro, **inclusive rede desligada**: **"Não foi possível gerar o planejamento. Verifique os dados e tente de novo."**.
      "Tentar de novo" reenvia `lastInput` **somente por toque**.
  - **Rede (backend real):** `POST /plan/generate` falha (sem resposta, ou `500` com `message: "AI_*"`).
  - **Depois:** nenhum plano criado.
- **Onde está no código:** `GeneratePlanScreen.tsx` (`errorMessage`, `error`, botão "Tentar de novo" com `generation.mutate(lastInput)`);
  `src/api/errors.ts` › `normalizeApiError` (`isTimeout`, `isNetworkError`, `code` = `message` do corpo).
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("mostra falha de IA e só tenta de novo por toque")`,
  `it("mostra carregamento e erro de timeout sem reenvio automático")`.
- **Se falhar:**
  1. Rede desligada mostra "Não foi possível gerar agora…" → ver a **Divergência** abaixo: não deve; só `AI_*` mostra essa frase.
  2. O app repete a chamada sozinho → `retry` deveria ser `false` (`useMutation` da geração e `queryClient` das mutações).
  3. Timeout em 10 s em vez de 90 s → o `timeout` não foi passado em `generatePlanDraft`; ver `ai-timeout.test.ts`.
  4. Mock × backend: o marcador `[AI_…]` só funciona no mock; no backend real a falha só ocorre se o provedor falhar.
- **Evidência:** captura da mensagem e o status (ou "sem resposta") da chamada.
- **Divergência encontrada:** o PLANO-TESTES (PLN-02.5) espera "Não foi possível gerar agora. Tente de novo em instantes." com a rede
  desligada. No código, essa frase é só dos erros `AI_*`; **rede desligada** mostra "Não foi possível gerar o planejamento. Verifique os dados e tente de novo.".
  Registre o texto observado; não é falha do app.

#### PLN-02.6 — PE sem PDI ativo e erro ao consultar o PDI (novo)

- **Prioridade / AC:** P3 · AC-PLN-02-03
- **Objetivo:** o PE funciona sem PDI pai e o erro da consulta do PDI bloqueia a geração com aviso.
- **Pré-condição:** Paciente sem PDI ativo (Paciente B, por exemplo).
- **Passos:** escolher o paciente → "PE da sessão"; observar; gerar.
- **Resultado esperado:** não aparece "Baseado no PDI: …"; a geração é permitida (corpo **sem** `parentPlanId`). Se a consulta do PDI falhar
  (modo avião logo após escolher o paciente): "Não foi possível consultar o PDI ativo." e o botão fica desabilitado até a consulta resolver.
- **Onde está no código:** `GeneratePlanScreen.tsx` (`parentQuery`, `canGenerate`).
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("envia PE com data e PDI ativo")` (caso com pai; o caso sem pai não tem teste próprio).
- **Se falhar:** botão fica desabilitado mesmo sem erro → `parentQuery.isPending` preso (requisição pendente); conferir a rede; `retry: false` nessa consulta, então não repete sozinha.
- **Evidência:** captura.

## 3. Rascunho editável e salvar (PLN-03)

Testes: `GeneratePlanScreen.test.tsx` (edição, salvar, 409, `Share`, `beforeRemove`) e
`src/api/endpoints/__tests__/plans-create.test.ts`. O rascunho é um `PlanForm` (`react-hook-form` + `zod`) dentro de `DraftPreview`.

#### PLN-03.1 — Editar o rascunho (título, objetivo, metas)

- **Prioridade / AC:** P1 · PLN-03 (MAN), AC-PLN-03-01
- **Objetivo:** tudo é editável antes de salvar; 1 a 10 metas; "Por que essas metas" é só leitura.
- **Pré-condição:** rascunho de PDI aberto (PLN-02.2).
- **Passos:**
  1. Mudar o **"Título"** e o **"Objetivo geral"**.
  2. Em "Metas prioritárias", editar a **"Descrição da meta 1"** e o **"Critério de sucesso da meta 1"**.
  3. Tocar em **"Adicionar meta"**; depois **"Remover meta N"** em outra.
  4. Tocar em **"Subir meta 2"** e **"Descer meta 1"**.
  5. Remover todas até sobrar uma; tentar remover a última. Apagar a descrição de uma meta e tentar salvar.
- **Resultado esperado:**
  - **Tela:** selos "Rascunho não salvo" e "Editável"; seção "Metas prioritárias" com "Meta 1", "Meta 2"…; "Subir meta 1" e
    "Descer meta N" ficam **desabilitados** nas pontas; "Remover meta N" fica desabilitado com **1** meta; "Adicionar meta" some
    (desabilitado) com **10**. "Por que essas metas" (texto do servidor) aparece só para leitura. Erros de campo: **"Informe o título"**,
    **"Informe o objetivo"**, **"Informe a meta"**; sem metas: **"Inclua pelo menos uma meta"**. Campos têm limites de 120 (título),
    2000 (objetivo e "Ajustes do profissional"), 500 (meta e critério).
  - **Rede:** nenhuma chamada até "Salvar PDI".
  - **Depois:** —
- **Onde está no código:** `src/features/plans/draft/PlanForm.tsx` › `PlanForm`, `planFormSchema`, `toPlanFormGoals`;
  `generate/DraftPreview.tsx` › `DraftPreview` (`initial`); DS: `Field`, `DsButton`, `SectionTitle`, `Badge`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("edita, adiciona e reordena metas antes de salvar com as datas sugeridas")`.
- **Se falhar:**
  1. Meta nova sem campo → `append` em `PlanForm` (valor inicial `{ description: "", successCriterion: "" }`).
  2. Ordem trocada não persiste no envio → `toPlanFormGoals(values.goals)` preserva a ordem do array; conferir o corpo de `POST /plan/` (a ordem das metas é a posição).
  3. Texto cortado/sem rolagem em fonte grande → ver QA-03 ([07-acessibilidade-qa03.md](07-acessibilidade-qa03.md)).
- **Evidência:** captura do formulário editado.

#### PLN-03.2 — Salvar o PDI

- **Prioridade / AC:** P1 · PLN-03 (MAN), AC-PLN-03-02
- **Objetivo:** salvar persiste o plano com `source: "AI"` e as datas do rascunho e abre o detalhe.
- **Pré-condição:** PLN-03.1; Paciente A **sem** PDI ativo.
- **Passos:** tocar em **"Salvar PDI"**.
- **Resultado esperado:**
  - **Tela:** toast **"Plano salvo"**; cerca de 0,7 s depois, a tela é **substituída** pelo detalhe do plano (`/plans/{id}`), sem o
    prompt "Descartar o rascunho?". O botão mostra carregamento durante o envio.
  - **Rede (backend real):** `POST /plan/` com `studentId`, `type: "PDI"`, `source: "AI"`, `title`, `generalObjective`, `focus`,
    `consideredDifficulties`, **`startDate`/`endDate`/`nextReviewDate` copiados do rascunho** (`suggested…`), `goals[]` (`description`,
    `successCriterion` só se preenchido) e `professionalNotes` só se preenchido; `201 Plan` com `status: "ACTIVE"` e `id`.
  - **Depois:** invalida `["plan"]` → a lista de planos, a aba "Planos" e o "PDI vigente" da ficha e o cartão de sugestões refazem.
- **Onde está no código:** `DraftPreview.tsx` › `save` (`createPlan`), `onSuccess` (`invalidateQueries(planQueryKeys.all)`, `onSaved`, toast,
  `router.replace(afterSavePlanRoute(savedId))` após 700 ms); `src/features/plans/routes.ts`; `src/api/endpoints/plans.ts` › `createPlan`;
  mock `POST /plan/` em `plans.ts`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("invalida a consulta real da lista depois de salvar")`;
  `plans-create.test.ts` — `it("persiste PDI com metas ordenadas e progresso calculado")`.
- **Se falhar:**
  1. "Revise os campos e as datas do plano." → `400` de validação (`PLAN_WITHOUT_GOALS`, `TOO_MANY_GOALS`, `INVALID_DATES`, `INVALID_FIELDS_FOR_PDI`,
     `Bad Request`…): ler o `message` na rede; datas fora de ordem indicam que o servidor recusou as `suggested…`.
  2. "Não foi possível salvar o plano. Tente novamente." → erro de rede ou `5xx`; `409` tem tratamento próprio (PLN-03.3).
  3. Salvou mas a lista não mostra → a invalidação não alcançou a consulta (chave errada); a lista usa `["plan","list"]` e a raiz invalidada é `["plan"]`
     (revisão da PLN-03 corrigiu `["plans"]` → `planQueryKeys.all`).
  4. Abriu a lista em vez do detalhe → `afterSavePlanRoute` voltou a apontar para a lista (provisório da PLN-03 já substituído na PLN-04).
- **Evidência:** capturas do toast e do detalhe; `POST /plan/` e status `201`.

#### PLN-03.3 — PDI ativo já existe (`409`)

- **Prioridade / AC:** P1 · Backend (§4.5), AC-PLN-03-03
- **Objetivo:** ver o caso BE-05 em [06-fluxos-e-backend.md](06-fluxos-e-backend.md); aqui o roteiro da tela.
- **Pré-condição:** Paciente A **com** PDI ativo.
- **Passos:** gerar outro PDI para o Paciente A → editar → **"Salvar PDI"** → tocar em **"Ver PDI ativo"** → voltar.
- **Resultado esperado:**
  - **Tela:** **"Este paciente já tem um PDI ativo."** (alerta) e o botão **"Ver PDI ativo"**, que abre o detalhe do plano **ativo**; ao voltar, o
    **rascunho continua** com as edições. Sem toast de sucesso.
  - **Rede (backend real):** `POST /plan/` → `409` com `message: "ACTIVE_PDI_ALREADY_EXISTS"` e `activePlanId`.
  - **Depois:** nada é criado.
- **Onde está no código:** `src/api/endpoints/plans.ts` › `createPlan`, `throwOnConflict`, `PlanApiError` (campo `activePlanId`);
  `DraftPreview.tsx` (`conflict`, botão "Ver PDI ativo" → `planDetailRoute`); mock: `student-1` com `mock-plan-1`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("mostra o PDI ativo no 409 e conserva os campos do rascunho")`;
  `plans-create.test.ts` — `it("preserva activePlanId no conflito 409")`.
- **Se falhar:**
  1. Mensagem genérica "Não foi possível salvar o plano…" → o `409` não virou `PlanApiError` (o `validateStatus` não deixou o `409` passar); conferir `createPlan`.
  2. Sem botão "Ver PDI ativo" → o corpo do `409` veio sem `activePlanId` (backend); ver a rede.
  3. Rascunho perdido ao voltar → a tela foi desmontada; o `key` do `DraftPreview` é `draft.title + draft.suggestedStartDate` — só troca se o rascunho mudar.
- **Evidência:** capturas do aviso e do botão; status `409` e o código.

#### PLN-03.4 — Compartilhar o rascunho

- **Prioridade / AC:** P2 · PLN-03 (MAN), AC-PLN-03-04
- **Objetivo:** a folha de compartilhamento do sistema abre com uma síntese em texto.
- **Pré-condição:** rascunho aberto.
- **Passos:** tocar em **"Compartilhar"**.
- **Resultado esperado:** abre a folha de compartilhamento do Android com o texto: título, objetivo geral, linha "Metas:" e as metas numeradas
  ("1. …"). Nada é enviado ao backend. Fechar a folha mantém o rascunho.
- **Onde está no código:** `DraftPreview.tsx` (`onShare` → `Share.share({ message })` de `react-native`); `PlanForm.tsx` (botão "Compartilhar").
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("compartilha uma síntese com metas numeradas")`.
- **Se falhar:** folha não abre → limitação do emulador sem apps de compartilhamento (instale um app de notas/e-mail ou teste no aparelho,
  [09-aparelhos-qa04.md](09-aparelhos-qa04.md)); texto vazio → `getValues()` sem metas.
- **Evidência:** captura da folha de compartilhamento.

#### PLN-03.5 — Sair com rascunho aberto

- **Prioridade / AC:** P1 · PLN-03 (MAN), AC-PLN-03-05
- **Objetivo:** não perder o rascunho sem confirmar.
- **Pré-condição:** rascunho exibido (gerado e **não salvo**).
- **Passos:**
  1. Tocar no botão de voltar do cabeçalho.
  2. Em "Descartar o rascunho?", tocar em **"Continuar editando"**.
  3. Repetir com o botão **Voltar do Android** e escolher **"Descartar"**.
- **Resultado esperado:**
  - **Tela:** `Alert` **"Descartar o rascunho?"** / "As alterações não salvas serão perdidas." com **"Continuar editando"** (mantém) e
    **"Descartar"** (destrutivo: sai). Depois de salvar (PLN-03.2) o prompt **não** aparece.
  - **Rede:** nenhuma.
  - **Depois:** descartar não deixa plano algum.
- **Onde está no código:** `GeneratePlanScreen.tsx` (`navigation.addListener("beforeRemove", …)`, refs `saved` e `discarded`); `DraftPreview` › `onSaved`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("pede confirmação para sair com rascunho não salvo")`.
- **Se falhar:**
  1. Sai sem perguntar → o listener foi removido ou `saved.current` ficou `true` (salvou antes?); o `Alert` depende de `draft` não nulo.
  2. Pergunta mesmo depois de salvar → `onSaved` não foi chamado antes de `router.replace`.
  3. No Android, o Voltar do sistema não aciona o prompt → conferir se o evento `beforeRemove` é disparado pelo Expo Router (cuidado do Expo Go).
- **Evidência:** captura do `Alert`.
- **Divergência encontrada:** a ficha e o PLANO-TESTES dizem "rascunho **alterado** e não salvo", mas o prompt aparece sempre que há rascunho gerado,
  mesmo sem nenhuma edição (a condição é `draft` não nulo). Registre como observado; sem rascunho (formulário só preenchido) **não** pergunta.

#### PLN-03.6 — Limites e erros de validação ao salvar (novo)

- **Prioridade / AC:** P2 · AC-PLN-03-01
- **Objetivo:** erros de campo bloqueiam o envio e o limite de metas é respeitado.
- **Pré-condição:** rascunho aberto.
- **Passos:** apagar o título e tocar em "Salvar PDI"; apagar a descrição de uma meta e salvar; adicionar metas até 10.
- **Resultado esperado:** "Informe o título" / "Informe a meta" sob os campos, **sem** chamada de rede; "Adicionar meta" desabilita no limite de 10.
- **Onde está no código:** `PlanForm.tsx` › `planFormSchema` (`zodResolver`), `fields.length >= 10`.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("edita, adiciona e reordena metas antes de salvar com as datas sugeridas")` (cobre o caminho feliz); `plans-create.test.ts` — `it("usa a data da sessão no PE e valida limites")` (limites no mock).
- **Se falhar:** envio com campo vazio → o resolver não rodou (`handleSubmit(onSubmit)`); mensagem sem aparecer → `error` não passado ao `Field`.
- **Evidência:** captura dos erros.

## 4. Detalhe do plano (PLN-04)

Testes: `src/features/plans/detail/__tests__/PlanDetailScreen.test.tsx` e
`src/api/endpoints/__tests__/plans-detail.test.ts`. A tela tem quatro modos (`view`, `edit`, `review`, `close`) controlados por estado local.

#### PLN-04.1 — Ver o detalhe do plano ativo

- **Prioridade / AC:** P1 · PLN-04 (MAN), AC-PLN-04-01
- **Objetivo:** o detalhe mostra o contrato (paciente, tipo, vigência, revisão, objetivo, metas e progresso do servidor).
- **Pré-condição:** plano ativo (PLN-03.2).
- **Passos:** abrir o plano (pela lista, pela ficha ou ao salvar).
- **Resultado esperado:**
  - **Tela:** o cabeçalho traz o **título do plano**; cartão com o nome do paciente, selos do tipo ("PDI"/"PE") e "Ativo",
    **"Vigência: dd/mm/aaaa a dd/mm/aaaa"**, "Próxima revisão: dd/mm/aaaa" (se houver), "Objetivo geral" e "Notas do profissional" (se houver).
    Botões "Editar plano", "Registrar revisão", "Encerrar plano". Cartão "Sugestões da IA" com "Pedir sugestões da IA". Cartão **"Metas"** com
    "N de M metas atingidas", barra de progresso e, por meta, descrição, "Critério de sucesso: …", selo do status (Não iniciada, Em andamento, Atingida,
    Descontinuada) e o seletor "Alterar status da meta N". Cartão **"Revisões"**.
  - **Rede (backend real):** `GET /plan/:id` (`200 Plan` com `goals[]` e `progress`) e `GET /plan/:id/reviews`; mais `GET /plan/suggestions?status=PENDING`
    para o cartão de sugestões e `GET /student/` para o nome do paciente.
  - **Depois:** —
- **Onde está no código:** `app/plans/[id].tsx` → `PlanDetailScreen.tsx` › `PlanDetailScreen` (`detailKey` = `["plan","detail",id]`,
  `reviewsKey`); `getPlan`, `listPlanReviews`; DS: `AppHeader`, `Badge`, `ProgressBar`, `SectionTitle`, `SelectField`.
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("mostra metas, progresso, vigência e revisão")`; `plans.test.ts` — `it("lê o plano com as metas e o progresso coerente")`.
  Rodar: `pnpm exec vitest run src/features/plans/detail/__tests__/PlanDetailScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. Progresso inconsistente → o app só exibe `plan.progress`; confira `totalGoals`, `achievedGoals`, `percent` na resposta (regra: `round(100 × atingidas / total)`, sem `DISCONTINUED`).
  2. "Paciente" no lugar do nome → `useStudents` ainda não carregou ou o paciente não está na lista.
  3. Datas erradas → `displayDate` apenas reordena `AAAA-MM-DD`; a data errada veio do servidor.
- **Evidência:** capturas do topo, das metas e das revisões.

#### PLN-04.2 — Mudar o status de uma meta

- **Prioridade / AC:** P1 · PLN-04 (MAN), AC-PLN-04-02
- **Objetivo:** o progresso vem do servidor depois de cada mudança.
- **Pré-condição:** PLN-04.1 com pelo menos 2 metas.
- **Passos:** em "Alterar status da meta 1", escolher **"Atingida"**; depois "Em andamento", "Não iniciada" e "Descontinuada" em outras metas.
- **Resultado esperado:**
  - **Tela:** o selo da meta muda; "N de M metas atingidas" e a barra acompanham (descontinuada **sai do total**); o seletor fica desabilitado durante a chamada.
  - **Rede (backend real):** `PUT /plan/:id/goals/:goalId` com `{ status }`; `200 Plan` com `goals[].status`, `achievedAt` (preenchido ao virar `ACHIEVED`, limpo ao sair) e `progress`.
  - **Depois:** a lista de planos e a aba "Planos" da ficha mostram o novo percentual (invalidação com `refetchType: "none"` marca as consultas como velhas; elas refazem ao abrir).
- **Onde está no código:** `PlanDetailScreen.tsx` › `goalMutation`, `acceptPlan` (`setQueryData(detailKey, plan)` e `invalidateQueries(planQueryKeys.all, { refetchType: "none" })`);
  `updateGoalStatus` em `plans.ts`; mock `PUT /plan/:id/goals/:goalId` e `computeMockProgress`.
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("atualiza progresso com a resposta da mudança da meta")`;
  `plans-detail.test.ts` — `it("atualiza status da meta, achievedAt e progresso vindo do servidor")`.
- **Se falhar:**
  1. Selo muda mas o percentual não → a resposta de `PUT …/goals/:goalId` veio sem `progress` atualizado; ver a rede.
  2. "Não foi possível salvar. Tente novamente." → erro de rede/`5xx`; `409 PLAN_NOT_EDITABLE` mostra "Este plano já foi encerrado."; `GOAL_NOT_FOUND` mostra "Uma meta não foi encontrada. Atualize o plano.".
  3. A lista ainda mostra o percentual antigo → ao voltar, a consulta precisa refazer (`refetchType: "none"` só marca como velha); puxe/reabra; se ficar velha para sempre, olhar a invalidação.
- **Evidência:** antes e depois do progresso; status e caminho da chamada.

#### PLN-04.3 — Editar o plano (lista completa de metas)

- **Prioridade / AC:** P1 · PLN-04 (MAN), AC-PLN-04-03
- **Objetivo:** a edição envia a lista completa de metas, preservando os `id` das que não mudaram.
- **Pré-condição:** PLN-04.1 (PDI ativo).
- **Passos:**
  1. Tocar em **"Editar plano"**.
  2. Mudar o título; em "Fim da vigência (AAAA-MM-DD)" e "Próxima revisão (AAAA-MM-DD)" conferir os valores; adicionar uma meta; remover outra (não atingida).
  3. Tocar em **"Salvar alterações"**; reabrir o plano.
- **Resultado esperado:**
  - **Tela:** o formulário abre com os dados do plano (título, objetivo, metas com critério, "Ajustes do profissional"). Salvar volta ao modo de leitura com os dados novos; **"Cancelar edição"** descarta.
    Validações locais: "A data final deve ser posterior ao início." (PDI), "A próxima revisão deve ficar dentro da vigência do plano.", "Informe a próxima revisão já definida." (não dá para apagá-la), "Informe as notas já registradas." (idem).
  - **Rede (backend real):** `PUT /plan/:id` com `title`, `generalObjective`, `professionalNotes` (se houver), `endDate` (só PDI), `nextReviewDate` (se houver) e **`goals[]` completo** (`id` nas existentes; sem `id` nas novas); `200 Plan`.
  - **Depois:** lista, ficha e detalhe refletem o título novo.
- **Onde está no código:** `PlanDetailScreen.tsx` › `submitEdit`, `editMutation`, `initial`; `PlanForm.tsx` (`protectedGoalIds`); `updatePlan` em `plans.ts`.
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("envia a lista completa de metas com IDs ao editar")`;
  `plans-detail.test.ts` — `it("edita a lista completa, preserva IDs e rejeita remoção de meta atingida")` e `it("valida IDs duplicados, ausentes, datas e limites de metas")`.
- **Se falhar:**
  1. Metas somem ou duplicam → o corpo enviou lista sem `id`; conferir `toPlanFormGoals` (mantém `id` só se existir) e `DUPLICATE_GOAL_ID` ("Há uma meta duplicada. Reabra a edição e tente novamente.").
  2. "A próxima revisão deve ficar dentro da vigência do plano." → `INVALID_DATES`; vigência = `startDate`…`endDate`.
  3. Notas/revisão "não apagam" → **limitação do backend**: o `PUT /plan/:id` não apaga `nextReviewDate` nem `professionalNotes`; o app exige que continuem preenchidos (mensagens acima). Não é falha.
  4. Nenhuma mudança visível → o `setQueryData(detailKey, plan)` não ocorreu; ver `acceptPlan`.
- **Evidência:** corpo (só chaves) de `PUT /plan/:id`; captura antes e depois.
- **Divergência encontrada:** a edição pede datas como texto "AAAA-MM-DD" (campos `Field`), não um seletor de data; anote se atrapalhar o uso.

#### PLN-04.4 — Remover meta atingida

- **Prioridade / AC:** P2 · PLN-04 (MAN)
- **Objetivo:** meta atingida não pode ser removida.
- **Pré-condição:** meta atingida (PLN-04.2).
- **Passos:** "Editar plano" → olhar o botão "Remover meta N" da meta atingida.
- **Resultado esperado:** o botão **"Remover meta N" fica desabilitado** para metas `ACHIEVED` (o app impede a remoção). Se o servidor chegar a responder `409 GOAL_ACHIEVED_CANNOT_BE_REMOVED`
  (por exemplo, a meta foi atingida em outro aparelho), a tela mostra **"Uma meta atingida não pode ser removida."** e o plano não muda.
- **Onde está no código:** `PlanForm.tsx` (`protectedGoalIds` → `disabled` do botão "Remover meta"); `PlanDetailScreen.tsx` (`conflictMessages.GOAL_ACHIEVED_CANNOT_BE_REMOVED`, `errorMessage`).
- **Testes automatizados que cobrem:** `plans-detail.test.ts` — `it("edita a lista completa, preserva IDs e rejeita remoção de meta atingida")` (servidor/mock). Sem teste de tela para o botão desabilitado.
- **Se falhar:** botão habilitado numa meta atingida → `protectedGoalIds` não recebeu os ids; mensagem do `409` não aparece → `code` perdido (`throwOnConflict` em `updatePlan`).
- **Evidência:** captura do botão desabilitado.
- **Divergência encontrada:** a ficha prevê só a mensagem do servidor; o app **previne** antes (botão desabilitado). A mensagem só aparece em corrida entre aparelhos.

#### PLN-04.5 — Registrar revisão

- **Prioridade / AC:** P1 · PLN-04 (MAN), AC-PLN-04-04
- **Objetivo:** a revisão entra no histórico com o retrato das metas.
- **Pré-condição:** PLN-04.1.
- **Passos:**
  1. Tocar em **"Registrar revisão"**.
  2. Preencher **"Nota da revisão"** e, opcionalmente, **"Próxima revisão (AAAA-MM-DD)"** dentro da vigência.
  3. Tocar em **"Salvar revisão"**. Repetir com a nota vazia, com mais de 2000 caracteres e com data fora da vigência. Testar "Cancelar revisão".
- **Resultado esperado:**
  - **Tela:** a revisão aparece em "Revisões" no topo (data `dd/mm/aaaa`, nota, "Próxima revisão: …" e, por meta, `descrição: status`); sem revisões: **"Nenhuma revisão registrada."**.
    Erros: **"A nota deve ter entre 1 e 2000 caracteres."**; "A próxima revisão deve ficar dentro da vigência do plano.". Se informou nova data, o cartão do topo mostra a nova "Próxima revisão".
  - **Rede (backend real):** `POST /plan/:id/reviews` com `{ note, nextReviewDate? }`; `201 PlanReview` (`goalStatuses` com o retrato).
  - **Depois:** a consulta de revisões recebe a nova no início; o plano fica marcado como "velho" para a lista.
- **Onde está no código:** `PlanDetailScreen.tsx` › `submitReview`, `reviewMutation`; `createPlanReview`, `listPlanReviews` em `plans.ts`.
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("registra revisão e mostra o retrato na lista")`; `plans-detail.test.ts` — `it("registra revisão com retrato e lista mais recente primeiro")`.
- **Se falhar:**
  1. "Não foi possível carregar as revisões." + "Tentar de novo" → `GET /plan/:id/reviews` falhou; a revisão pode ter sido salva; conferir a rede.
  2. Ordem errada → o app não ordena; vem do servidor (mais recente primeiro).
  3. "Meta removida" em vez do nome → a meta do retrato não existe mais no plano atual (esperado se foi removida depois).
- **Evidência:** captura da revisão; `POST /plan/:id/reviews` e `201`.

#### PLN-04.6 — Encerrar o plano

- **Prioridade / AC:** P1 · PLN-04 (MAN), AC-PLN-04-05
- **Objetivo:** o encerramento é definitivo e deixa o plano somente leitura.
- **Pré-condição:** plano ativo de teste (não o do fluxo F4 se ainda em uso).
- **Passos:**
  1. Tocar em **"Encerrar plano"** → ver "Escolha o motivo de encerramento. Não é possível reabrir o plano.".
  2. Tocar em **"Concluído"** (ou "Cancelado") → no `Alert` "Encerrar plano?", tocar em **"Voltar"** (nada muda) e de novo em **"Confirmar"**.
  3. Conferir o detalhe, a lista e a ficha.
- **Resultado esperado:**
  - **Tela:** `Alert` "Encerrar plano?" / "Não é possível reabrir o plano." com "Voltar" e "Confirmar" (destrutivo). Depois, o selo vira **"Concluído"** ou **"Cancelado"** e os botões "Editar plano",
    "Registrar revisão", "Encerrar plano", "Pedir sugestões da IA" e os seletores de status das metas **desaparecem**. Na lista o plano vai para **"Encerrados"**; na ficha o bloco "PDI vigente" volta a "Nenhum PDI ativo" (se era o PDI).
  - **Rede (backend real):** `PUT /plan/:id/status` com `{ status: "COMPLETED" | "CANCELLED" }`; `200 Plan` com `status` e `closedAt`. As sugestões pendentes do plano são descartadas pelo servidor.
  - **Depois:** invalida `["plan"]`; cartão de sugestões da Início perde as sugestões do plano.
- **Onde está no código:** `PlanDetailScreen.tsx` › `confirmClose`, `closeMutation`, `mode === "close"`; `updatePlanStatus` em `plans.ts`; mock `PUT /plan/:id/status`.
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("confirma encerramento e deixa a tela somente leitura")`, `it("não oferece o botão em plano encerrado")`; `plans-detail.test.ts` — `it("encerra definitivamente e bloqueia todas as escritas")`.
- **Se falhar:**
  1. Continua com botões → o app só os esconde com `plan.status !== "ACTIVE"`; a resposta do `PUT /plan/:id/status` não veio com o novo status (ver a rede).
  2. `409 PLAN_NOT_EDITABLE` → "Este plano já foi encerrado." (já estava encerrado; reabra o plano).
  3. A ficha ainda mostra o PDI → consulta `["plan","student",id,"PDI","ACTIVE"]` com dado antigo; reabrir a ficha refaz.
- **Evidência:** capturas do `Alert`, do detalhe encerrado e da lista.
- **Divergência encontrada:** a ficha cita "Este plano já foi encerrado." na tela encerrada. No código, essa frase é só a mensagem do `409 PLAN_NOT_EDITABLE`; o plano encerrado apenas **oculta** as ações (não há texto fixo de "somente leitura").

#### PLN-04.7 — Plano inexistente ou de outra conta

- **Prioridade / AC:** P2 · PLN-04 (MAN)
- **Objetivo:** erros de acesso têm texto próprio.
- **Pré-condição:** só se houver como (id inválido, ou plano de outra conta fornecido pelo time).
- **Passos:** abrir `/plans/{id}` com o id inválido (link `exp://…/--/plans/{id}`).
- **Resultado esperado:** `404` → **"Plano não encontrado"** com **"Voltar"**; `403` → **"Sem acesso a este plano"** com "Voltar"; outro erro → "Não foi possível carregar o plano." com "Tentar de novo".
  Rede: `GET /plan/:id` com `404 PLAN_NOT_FOUND` ou `403 UNAUTHORIZED`.
- **Onde está no código:** `PlanDetailScreen.tsx` (ramo `!plan`, `error?.status`); mocks `MOCK_FOREIGN_PLAN_ID` e id inexistente.
- **Testes automatizados que cobrem:** `plans.test.ts` — `it("devolve 404 PLAN_NOT_FOUND e 403 UNAUTHORIZED no detalhe")` (sem teste de tela dedicado).
- **Se falhar:** carregando para sempre → `retry` de leituras (2 tentativas em `5xx`/rede; `4xx` não repete); `401` desloga (BE-02).
- **Evidência:** captura.

#### PLN-04.8 — Detalhe e edição de um PE (novo)

- **Prioridade / AC:** P2 · PLN-04 (MAN)
- **Objetivo:** o PE tem vigência de um dia e não edita "Fim da vigência".
- **Pré-condição:** PE salvo (PLN-02.4 + salvar).
- **Passos:** abrir o PE → "Editar plano".
- **Resultado esperado:** selo "PE"; "Vigência: {data} a {data}" iguais; na edição **não** há "Fim da vigência (AAAA-MM-DD)"; salvar **não** envia `endDate`.
  O botão do rascunho foi **"Salvar PE"**.
- **Onde está no código:** `PlanDetailScreen.tsx` (`plan.type === "PDI"` em `submitEdit` e no formulário); `DraftPreview.tsx` (`Salvar ${draft.type}`); `createPlan` com `sessionDate`/`parentPlanId` (PE).
- **Testes automatizados que cobrem:** `plans-create.test.ts` — `it("usa a data da sessão no PE e valida limites")`.
- **Se falhar:** `400 INVALID_FIELDS_FOR_PDI`/`SESSION_DATE_REQUIRED` ao salvar PE → o corpo do `POST /plan/` trouxe campos do tipo errado; conferir o ramo `draft.type === "PDI"` de `DraftPreview`.
- **Evidência:** captura do PE.

## 5. Sugestões da IA (PLN-05)

Testes: `src/api/endpoints/__tests__/plans-suggestions.test.ts`,
`src/features/plans/suggestions/__tests__/PlanSuggestionsScreen.test.tsx` e o bloco
"PlanDetailScreen — sugestões da IA (PLN-05)" em `PlanDetailScreen.test.tsx`. As sugestões são
**sob demanda** (BACKEND-ENTREGUE §7): não surgem ao encerrar a sessão.

#### PLN-05.1 — Pedir sugestões da IA

- **Prioridade / AC:** P1 · PLN-05 (MAN), AC-PLN-05-01
- **Objetivo:** o pedido devolve sugestões novas ou avisa que não há nada novo; mede o tempo.
- **Pré-condição:** plano ativo (PLN-04.1), de preferência com sessões do paciente.
- **Passos:**
  1. No detalhe, em "Sugestões da IA", tocar em **"Pedir sugestões da IA"** (cronometrar).
  2. Observar o botão; repetir quando já houver 3 pendentes.
- **Resultado esperado:**
  - **Tela:** o botão vira **"Gerando sugestões…"** (desabilitado, com carregamento). Com novas: toast **"1 sugestão nova"** ou **"N sugestões novas"** e o botão **"Ver sugestões"**
    (abre `/plans/suggestions`); as pendentes **do plano** aparecem como cartões no próprio detalhe. Sem novas: **"Sem sugestões novas para este plano"**.
  - **Rede (backend real):** `POST /plan/:id/suggestions/generate` (sem corpo, `timeout` 90 s): `201` com as novas ou `200 []` (já há 3 pendentes ou nada válido). `GET /plan/suggestions?status=PENDING` refaz depois.
  - **Depois:** invalida `["plan"]` → cartão da Início e tela de sugestões refazem.
- **Onde está no código:** `PlanDetailScreen.tsx` › `generateMutation`, `generateNotice`, `hasNewSuggestions`; `generatePlanSuggestions` em `plans.ts`;
  `suggestions/usePlanSuggestions.ts` › `usePendingSuggestions`; mock `POST /plan/:id/suggestions/generate`.
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("AC-PLN-05-01 mostra a mensagem quando não há sugestões novas")`, `it("AC-PLN-05-01 anuncia as novas e leva à tela de sugestões")`,
  `it("mostra o texto de espera durante a geração")`; `plans-suggestions.test.ts` — `it("gera até completar 3 pendentes e devolve [] quando já há 3")`, `it("usa o timeout da IA na geração")`.
- **Se falhar:**
  1. "Não foi possível gerar agora. Tente de novo em instantes." → `500 AI_*` (ou qualquer erro, exceto `PLAN_NOT_EDITABLE`); **não reenvia sozinho**; tentar de novo só por toque.
  2. "Este plano já foi encerrado." → `409 PLAN_NOT_EDITABLE`.
  3. Passa de 90 s → timeout do app, mesmo texto genérico de falha (não há mensagem de timeout própria aqui); anote o tempo.
  4. Sempre `200 []` → o servidor já tem 3 pendentes ou a IA não trouxe nada válido; abra `/plans/suggestions` para ver.
- **Evidência:** tempo em segundos; resultado (novas ou nenhuma); status e caminho.

#### PLN-05.2 — Aceitar e descartar sugestões

- **Prioridade / AC:** P1 · PLN-05 (MAN), AC-PLN-05-02
- **Objetivo:** aceitar aplica a mudança no plano; descartar tira da lista.
- **Pré-condição:** pelo menos 2 sugestões pendentes.
- **Passos:**
  1. Abrir `/plans/suggestions` pelo cartão da Início (ou "Ver sugestões").
  2. Em uma sugestão tocar em **"Aceitar"**; em outra, **"Descartar"**.
  3. Abrir o detalhe do plano afetado.
- **Resultado esperado:**
  - **Tela:** "Sugestões da IA" lista as pendentes de **todos os planos** (cada cartão: paciente, título do plano, texto, **mudança proposta** em linguagem simples:
    "Mudar meta para {status}", "Nova meta: …", "Reescrever meta: …", "Agendar revisão para dd/mm/aaaa"). Aceitar: aviso **"Sugestão aceita"** e o cartão some; descartar: **"Sugestão descartada"**.
    Os botões ficam desabilitados enquanto uma ação está em curso. No detalhe do plano, a mudança aceita **já aparece** (meta, status ou revisão). Vazio: **"Nenhuma sugestão para revisar"**.
  - **Rede (backend real):** `POST /plan/suggestions/:id/accept` → `200 Plan` atualizado; `POST /plan/suggestions/:id/dismiss` → `200 PlanSuggestion` com `status: "DISMISSED"`.
  - **Depois:** o plano retornado é gravado em `["plan","detail",planId]`; `["plan"]` é invalidado; a contagem da Início diminui (PLN-05.4).
- **Onde está no código:** `PlanSuggestionsScreen.tsx` › `PlanSuggestionsScreen`; `SuggestionCard.tsx` › `SuggestionCard`; `usePlanSuggestions.ts` › `useSuggestionActions`, `describeSuggestionChange`, `pendingSuggestionsKey`;
  `acceptPlanSuggestion`, `dismissPlanSuggestion`; DS `DsButton`, `AppHeader`.
- **Testes automatizados que cobrem:** `PlanSuggestionsScreen.test.tsx` — `it("mostra paciente, plano, texto e a mudança em linguagem simples")`, `it("AC-PLN-05-02 aceitar chama a rota e tira a sugestão da lista")`, `it("AC-PLN-05-02 descartar chama a rota e tira a sugestão da lista")`; `plans-suggestions.test.ts` — `it("aceitar aplica a mudança no plano e resolve a sugestão")`, `it("aplica ADD_GOAL, SCHEDULE_REVIEW e REWRITE_GOAL")`.
  Rodar: `pnpm exec vitest run src/features/plans/suggestions/__tests__/PlanSuggestionsScreen.test.tsx src/api/endpoints/__tests__/plans-suggestions.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. "Não foi possível concluir. Tente novamente." → erro de rede/`5xx`/`404 SUGGESTION_NOT_FOUND`; a sugestão **não** sai da lista.
  2. Aceitou mas o plano não mudou → conferir a resposta (`200 Plan`) e `setQueryData([...planQueryKeys.all,"detail",plan.id], plan)`; reabra o detalhe.
  3. Tela de sugestões não mostra o título do plano → `usePlans()` sem dado (o título vem da lista de planos).
- **Evidência:** capturas antes/depois; status das duas chamadas.

#### PLN-05.3 — Sugestão que não se aplica mais / já resolvida

- **Prioridade / AC:** P2 · PLN-05 (MAN), AC-PLN-05-03
- **Objetivo:** o `409` do contrato tem mensagem e tira a sugestão da lista.
- **Pré-condição:** só se ocorrer (por exemplo, a meta foi removida depois da sugestão; ou a sugestão foi resolvida em outro aparelho). Sem como provocar: N/A.
- **Passos:** aceitar a sugestão obsoleta.
- **Resultado esperado:**
  - **Tela:** `409 SUGGESTION_NOT_APPLICABLE` → **"Esta sugestão não se aplica mais"** (a sugestão vira `DISMISSED` e sai da lista); `409 SUGGESTION_ALREADY_RESOLVED` → **"Esta sugestão já foi resolvida"** e sai da lista.
  - **Rede (backend real):** `POST /plan/suggestions/:id/accept` → `409` com `message` = o código.
  - **Depois:** lista refeita.
- **Onde está no código:** `usePlanSuggestions.ts` (`NOT_APPLICABLE_MESSAGE`, `ALREADY_RESOLVED_MESSAGE`, `run`); `acceptPlanSuggestion` (`apiClient` rejeita o `409` e `normalizeApiError` lê o `code`).
- **Testes automatizados que cobrem:** `PlanSuggestionsScreen.test.tsx` — `it("AC-PLN-05-03 SUGGESTION_NOT_APPLICABLE avisa e remove a sugestão")`, `it("SUGGESTION_ALREADY_RESOLVED atualiza a lista")`; `plans-suggestions.test.ts` — `it("SUGGESTION_NOT_APPLICABLE descarta a sugestão (meta removida)")`, `it("descartar resolve a sugestão e uma segunda tentativa responde 409")`.
- **Se falhar:** mensagem genérica "Não foi possível concluir…" → o `code` do erro não chegou (o app lê `error.code`, vindo do `message` do corpo do `409`); sugestão continua na lista → `removeFromList` não foi chamada.
- **Evidência:** captura da mensagem; status `409` e código.

#### PLN-05.4 — Cartão de sugestões na Início

- **Prioridade / AC:** P1 · PLN-05 (MAN), AC-PLN-05-04
- **Objetivo:** a contagem da Início acompanha as sugestões pendentes e some com zero.
- **Pré-condição:** PLN-05.2 (sugestões pendentes).
- **Passos:** abrir a aba **Início**; tocar no cartão; resolver as sugestões e voltar à Início.
- **Resultado esperado:**
  - **Tela:** cartão **"1 sugestão da IA para revisar"** ou **"N sugestões da IA para revisar"** com o texto "Veja o que a IA propõe para os planos dos seus pacientes."; tocar abre `/plans/suggestions`;
    com zero pendentes o cartão **não aparece**.
  - **Rede:** `GET /plan/suggestions?status=PENDING` (chave `["plan","suggestions","PENDING"]`, compartilhada com a tela de sugestões e o detalhe do plano).
  - **Depois:** a contagem muda ao resolver (a lista é atualizada na hora com `removeFromList` e refeita por invalidação).
- **Onde está no código:** `src/features/home/HomeScreen.tsx` (`usePendingSuggestions().data?.length`, `InsightCard`, `PLAN_SUGGESTIONS_ROUTE`); DS `InsightCard`.
- **Testes automatizados que cobrem:** `src/features/home/__tests__/HomeScreen.test.tsx` — testes do cartão (procure por `plans/suggestions`, linha ~251).
  Rodar: `pnpm exec vitest run src/features/home/__tests__/HomeScreen.test.tsx --maxWorkers=1`.
- **Se falhar:** contagem não muda → `["plan","suggestions","PENDING"]` ficou velha; cheque `useSuggestionActions` (`removeFromList` e `invalidateQueries`); cartão não some com zero → `pendingSuggestions > 0`.
- **Evidência:** capturas da Início antes e depois.

#### PLN-05.5 — Falha da IA nas sugestões (novo)

- **Prioridade / AC:** P3 · AC-PLN-05-01
- **Objetivo:** erro `AI_*` das sugestões não trava a tela nem reenvia sozinho.
- **Pré-condição:** só com o mock (título do plano com `[AI_GENERATION_FAILED]`) ou se o backend falhar de verdade.
- **Passos:** "Pedir sugestões da IA".
- **Resultado esperado:** **"Não foi possível gerar agora. Tente de novo em instantes."** (alerta); o botão volta a "Pedir sugestões da IA"; nenhum reenvio.
- **Onde está no código:** `PlanDetailScreen.tsx` (`generateMutation.onError`, `GENERATE_FAILURE_MESSAGE`).
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("erro AI_* mostra a mensagem e não reenvia sozinho")`; `plans-suggestions.test.ts` — `it("propaga a falha 500 AI_* da geração")`.
- **Se falhar:** botão fica travado em "Gerando sugestões…" → a mutação não terminou (timeout de 90 s ainda correndo).
- **Evidência:** captura.

## Checklist rápido de resultado (planos)

| Caso     | Resultado | Observações |
| -------- | --------- | ----------- |
| PLN-01.1 |           |             |
| PLN-01.2 |           |             |
| PLN-01.3 |           |             |
| PLN-01.4 |           |             |
| PLN-01.5 |           |             |
| PLN-02.1 |           |             |
| PLN-02.2 |           |             |
| PLN-02.3 |           |             |
| PLN-02.4 |           |             |
| PLN-02.5 |           |             |
| PLN-02.6 |           |             |
| PLN-03.1 |           |             |
| PLN-03.2 |           |             |
| PLN-03.3 |           |             |
| PLN-03.4 |           |             |
| PLN-03.5 |           |             |
| PLN-03.6 |           |             |
| PLN-04.1 |           |             |
| PLN-04.2 |           |             |
| PLN-04.3 |           |             |
| PLN-04.4 |           |             |
| PLN-04.5 |           |             |
| PLN-04.6 |           |             |
| PLN-04.7 |           |             |
| PLN-04.8 |           |             |
| PLN-05.1 |           |             |
| PLN-05.2 |           |             |
| PLN-05.3 |           |             |
| PLN-05.4 |           |             |
| PLN-05.5 |           |             |
