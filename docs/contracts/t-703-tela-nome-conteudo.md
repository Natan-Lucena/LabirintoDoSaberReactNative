# T-703 — Tela 05: nome e conteúdo

## 1. Objetivo, escopo, não objetivos e decisões aprovadas

Objetivo: implementar a tela 05 (`app/session/content.tsx`), que recebe nome da
sessão e seleção de conteúdo (caderno, grupo ou atividade), contra a camada de
mocks (G-29), e grava a configuração no `useSessionFlowStore` (T-701, ação
`configure`).

Escopo: `app/session/content.tsx`, `app/session/player.tsx` (placeholder "Em
breve"), `src/features/sessions/{ContentStep.tsx,useContentCatalog.ts}` e seus
testes em `src/features/sessions/__tests__/`, mais os handlers de mock
`GET /task-group/list-by-educator` e `GET /task/` em
`src/mocks/handlers/content.ts` (dados fictícios locais ao arquivo, sem editar
`src/mocks/fixtures.ts`, que não está na propriedade desta tarefa).

Não objetivos: chamar `POST /task-notebook-session/start` (T-704); implementar
o player real (T-802); editar `TextField`/`SearchField`/`FilterChips`
(T-202, fora do escopo desta tarefa — ver §8 pendências).

Decisões aprovadas nesta tarefa (não "corrigir" sem nova aprovação):

- G-06 ainda aberto no backend: os três chips (Cadernos/Grupos/Atividades)
  aparecem simultaneamente por decisão de G-29 ("pontos não documentados
  simulados e marcados como mock provisório"). Comentário no código sinaliza a
  simulação.
- G-10: "Ver Tudo" navega para `/shell/coming-soon` com `title` apropriado,
  reaproveitando o padrão já usado em T-501/T-702.
- G-15: caderno → título/busca = `description`; grupo → `name`; atividade →
  `prompt`. Tags do caderno e do grupo = rótulo pt-BR de `category` + "N
  tarefas" (`tasksIds.length` no grupo; `tasks.length` no caderno). Tags da
  atividade = só o rótulo pt-BR de `category` (a API não documenta contagem
  para `Task`; ver pendência §8).
- Truncamento do título por linhas já é feito pelo `ContentCard`
  (`numberOfLines={2}`) — não há lógica adicional de corte de string.
- Busca: sempre local (filtra o array já carregado da fonte ativa),
  normalizando acento/maiúsculas como `normalizeForSearch` de `StudentStep`
  (comportamento idêntico exigido por AC-703-06). Não usar
  `descriptionContains`/`promptContains` da API — evita comportamento
  divergente entre mock e filtro local.
- "Voltar" **não** chama `cancel()` do store (diferente de `StudentStep`):
  mantém aluno, nome e conteúdo já configurados (AC-703-04/07), só navega
  `router.back()`.

## 2. Comportamento observável e critérios de aceite

- AC-703-01 — campo obrigatório de nome, 1–100 caracteres após trim (G-15).
  Placeholder "Ex: Sessão de Alfabetização - 08/04/2026". Erro acessível
  (`accessibilityRole="alert"`) quando o campo foi tocado e está vazio ou
  excede 100.
- AC-703-02 — só os chips Cadernos/Grupos/Atividades aparecem; trocar de chip
  troca a fonte de dados (cada chip tem sua própria consulta/estado de
  carregamento).
- AC-703-03 — cards mapeiam campos conforme G-15 (ver §1), sem inventar título.
- AC-703-04 — "Iniciar Sessão Agora" desabilitado sem nome válido e sem
  conteúdo selecionado; "Voltar" preserva o aluno (e nome/conteúdo já
  digitados, ver AC-703-07).
- AC-703-05 — "Ver Tudo" abre a tela "Em breve" (G-10).
- AC-703-06 — busca filtra pelo campo textual do chip ativo (description /
  name / prompt), local, ignora acento/maiúsculas; trocar de chip mantém o
  texto digitado e reaplica a busca à nova fonte; sem resultado mostra estado
  vazio.
- AC-703-07 — sair da tela (voltar) e retornar preserva nome e conteúdo
  selecionados (estado vem do `useSessionFlowStore`, que já persiste via
  MMKV — T-701); trocar de chip não descarta a seleção de conteúdo já feita
  sem aviso (seleção anterior permanece guardada em estado local até nova
  seleção confirmada).

Estados de tela: carregando (`LoadingState`) e erro com nova tentativa
(`ErrorState`) por chip ativo; vazio por chip (`EmptyState`, mensagem diferente
para "sem itens" vs. "sem resultado de busca").

## 3. Interfaces, tipos, validações, erros e persistência

```ts
// src/features/sessions/useContentCatalog.ts
export interface ContentCatalogItem {
  kind: SessionFlowContentKind; // "notebook" | "group" | "task"
  id: string;
  name: string; // description | name | prompt — usado no título do card,
  // na busca e gravado em SessionFlowContent.name
  tags: string[];
}

export interface UseContentCatalogResult {
  items: ContentCatalogItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useContentCatalog(
  chip: SessionFlowContentKind,
): UseContentCatalogResult;
```

`useContentCatalog` usa `useQuery` com `queryKey: ["content-catalog", chip]` e
`queryFn` mapeado por chip (`listTaskNotebooks`, `listTaskGroupsByEducator`,
`listTasks`, todos de `@/api/endpoints/content`, já existentes por T-305).
Mapeamento de item por chip:

- `notebook`: `{ kind: "notebook", id: notebook.id, name: notebook.description, tags: [categoryLabel(notebook.category), \`${notebook.tasks.length} tarefas\`] }`
- `group`: `{ kind: "group", id: group.id, name: group.name, tags: [categoryLabel(group.category), \`${group.tasksIds.length} tarefas\`] }`
- `task`: `{ kind: "task", id: task.id, name: task.prompt, tags: [categoryLabel(task.category)] }`

`categoryLabel` mapeia `TaskCategory` → pt-BR: `reading` "Leitura",
`writing` "Escrita", `vocabulary` "Vocabulário", `comprehension`
"Compreensão".

`ContentStep.tsx` usa `useSessionFlowStore()` (`configure`, `student`,
`sessionName`, `content`) e `useContentCatalog`. Estado local:
`nameInput` inicializado de `sessionName ?? ""`; `activeChip` inicializado
`"notebook"`; `selected: ContentCatalogItem | null` inicializado a partir de
`content` da store (se houver, reidratado num item mínimo `{kind,id,name:content.name,tags:[]}`
até a lista carregar e substituir pelo item completo); `query: string`;
`touched: boolean` (nome tocado, para exibir erro só após interação ou
tentativa de avançar).

Validação do nome: `trim().length >= 1 && trim().length <= 100`.

"Iniciar Sessão Agora": habilitado só com nome válido e `selected` não nulo;
ao pressionar, chama `configure({ name: nameInput.trim(), content: { kind:
selected.kind, id: selected.id, name: selected.name } })` e
`router.push("/session/player")`.

Handlers de mock (novos, em `content.ts`, dados fictícios locais ao arquivo):

```ts
registerMockHandler(
  { method: "get", path: "/task-group/list-by-educator" },
  () => {
    return { status: 200, data: MOCK_TASK_GROUPS };
  },
);
registerMockHandler({ method: "get", path: "/task/" }, () => {
  return { status: 200, data: MOCK_TASKS };
});
```

`MOCK_TASK_GROUPS: TaskGroup[]` e `MOCK_TASKS: Task[]` definidos no próprio
arquivo `content.ts` (3–4 itens fictícios cada, tipados por `@/api/types`,
`educatorId`/`category` plausíveis).

## 4. Estados de interface e acessibilidade

- Título do card "Dê um nome à sessão" com `accessibilityRole="header"`.
- Campo de nome: usa `TextField` (T-202) se aceitar `placeholder` — **ver
  pendência §8**; do contrário, `TextInput` local com paridade visual/a11y
  (label, erro com `accessibilityRole="alert"`, altura mínima igual à do
  design system).
- Chips: `FilterChips` com `selected=[activeChip]`, `onToggle` que só troca
  (ignora tentativa de desmarcar o único chip ativo).
- "Ver Tudo": `Pressable`/link com `accessibilityRole="link"`, texto "Ver
  Tudo".
- `StepIndicator totalSteps={2} currentStep={2}` (Passo 1 = aluno, Passo 2 =
  nome e conteúdo), envolto como em `StudentStep` (`accessibilityLabel="Passo 2"`,
  filhos ocultos de acessibilidade).

## 5. Plano de testes

Arquivo: `src/features/sessions/__tests__/ContentStep.test.tsx` (padrão de
`StudentStep.test.tsx`: mocka `expo-router`, `@/stores/session-flow` e os
endpoints de `@/api/endpoints/content`).

| Caso                                                                                                                   | AC        | Verificação                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| nome vazio/>100 mostra erro acessível e desabilita avançar                                                             | AC-703-01 | `getByRole("alert")`, botão `disabled: true`                                                                           |
| só 3 chips aparecem, trocar chip troca a fonte consultada                                                              | AC-703-02 | mocka `listTaskNotebooks`/`listTaskGroupsByEducator`/`listTasks`, cada um chamado só após ativar o chip correspondente |
| card mostra `description`/`name`/`prompt` e tags corretas por chip                                                     | AC-703-03 | asserts de texto por chip                                                                                              |
| "Iniciar Sessão Agora" desabilitado sem nome+conteúdo; habilita com ambos; chama `configure` e navega                  | AC-703-04 | fireEvent + expects em `configure`/`push`                                                                              |
| "Voltar" não chama `cancel`, só `router.back()`                                                                        | AC-703-04 | expect `cancel` não chamado                                                                                            |
| "Ver Tudo" navega para `/shell/coming-soon`                                                                            | AC-703-05 | expect `push` com pathname/params                                                                                      |
| busca filtra por campo do chip ativo, ignora acento/maiúscula, mantém texto ao trocar chip, vazio mostra `EmptyState`  | AC-703-06 | como `StudentStep`                                                                                                     |
| reidratar de `content`/`sessionName` já no store preserva seleção; trocar chip não apaga seleção prévia sem novo toque | AC-703-07 | store mock com `content`/`sessionName` preenchidos                                                                     |
| loading/erro com retry por chip; vazio por chip                                                                        | estados   | como `StudentStep`                                                                                                     |

Handlers novos: `src/mocks/handlers/__tests__/content.test.ts` (ou extensão do
teste de mocks existente) cobre `GET /task-group/list-by-educator` e
`GET /task/` retornando 200 com os dados fictícios tipados.

## 6. Tabela de tarefas, arquivos, dependências, modelos e esforço

| Arquivo                                              | Dono            | Depende de                                         |
| ---------------------------------------------------- | --------------- | -------------------------------------------------- |
| `docs/contracts/t-703-tela-nome-conteudo.md`         | executor Sonnet | —                                                  |
| `src/features/sessions/useContentCatalog.ts` + teste | executor Sonnet | T-305 (`@/api/endpoints/content`)                  |
| `src/features/sessions/ContentStep.tsx` + teste      | executor Sonnet | T-701 (store), T-602 (`ContentCard`), T-202, T-203 |
| `app/session/content.tsx`                            | executor Sonnet | `ContentStep`                                      |
| `app/session/player.tsx`                             | executor Sonnet | `ComingSoonScreen` (placeholder)                   |
| `src/mocks/handlers/content.ts` (+ testes)           | executor Sonnet | tipos T-305                                        |

Modelo: Sonnet (claude-sonnet-5), esforço médio, escopo fechado conforme spec
do dispatch.

## 7. Comandos de validação e evidências

`pnpm exec vitest run src/features/sessions src/mocks`, `pnpm run typecheck`,
`pnpm run test`, `pnpm run lint`, `npx prettier --check <arquivos tocados>`,
`python scripts/check-docs.py`, `git diff --check`,
`npx expo export --platform android --output-dir dist-android` (saída
descartada depois).

## 8. Pendências, decisões deliberadas e histórico

- **Pendência bloqueante da Fase 1:** `TextField` (T-202,
  `src/components/TextField/index.tsx`) não aceita `placeholder`, exigido por
  AC-703-01/DESIGN §2 (05). Fora do escopo de arquivos desta tarefa. Proposta:
  pedir exceção pontual de 1 prop opcional em `TextField` (edição mínima,
  compatível, sem quebrar T-202), ou usar `TextInput` local equivalente ao
  padrão do design system só dentro de `ContentStep.tsx`. Decisão pendente do
  orquestrador (ver pergunta na Fase 1).
- G-06 simulado (mock provisório): os três chips aparecem simultaneamente;
  a integração real (T-1004) pode restringir conforme resposta do backend.
- Tags de "Atividades" (task) não têm contagem documentada em G-15; usa só o
  rótulo de categoria — sujeito a revisão se o backend/negócio pedir outra
  coisa.
- Histórico: criado por executor Sonnet (claude-sonnet-5) em 2026-09-25,
  Fase 1 do fluxo T-703 (Orca run `run_0f0031abd486`).
