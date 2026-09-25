# T-501 — Tabs, header e destinos fora do escopo

## Objetivo

Ligar a navegação real por abas (Expo Router) usando os primitivos `TabBar`/
`AppHeader` da T-203, com as 5 abas do design (G-10) e as telas "Em breve"
para os destinos fora do escopo desta entrega (Atividades, Alunos, Relatórios,
menu e avatar do header).

## Escopo e não objetivos

- Escopo: `app/(tabs)/_layout.tsx` (grupo de abas), telas "Em breve" para
  Atividades/Alunos/Relatórios, destino "Em breve" reutilizável para
  menu/avatar, placeholders mínimos de Início e Agenda, e a decisão de
  ocultar as tabs fora do grupo `(tabs)`.
- Não objetivo: conteúdo real de Início (T-603) e Agenda (T-903) — aqui só
  placeholders que essas tarefas substituem.
- Não objetivo: telas 04–06 e o formulário (`app/session/**`, ainda
  inexistentes nesta árvore) — apenas a decisão estrutural de ficarem fora de
  `(tabs)`, portanto sem `TabBar`.
- Não objetivo: dados (mock ou API) — G-29, tarefa não consome dados.

## Decisões desta fase

- **Estrutura de rotas:** `app/(tabs)/_layout.tsx` usa `Tabs` do
  `expo-router` com `tabBar` customizado (função que renderiza `TabBar` da
  T-203) e `screenOptions.header` customizado (função que renderiza
  `AppHeader` da T-203) — evita o header/tab bar nativos, mantendo os
  primitivos visuais aprovados na T-203.
- **`app/index.tsx` (placeholder da T-102) removido**: conflita com a rota
  `"/"` que passa a ser servida por `app/(tabs)/index.tsx` (índice do grupo
  de abas). Nenhuma outra rota usava `app/index.tsx`.
- **Tabs ocultas fora do grupo `(tabs)`:** decisão estrutural, não código
  novo aqui — telas de sessão (04–06, design) e o formulário de agendamento
  ficam fora de `app/(tabs)/**` (ex.: `app/session/*`, ainda não criadas por
  nenhuma tarefa concluída) e portanto não recebem `TabBar`/`AppHeader` deste
  layout. **AC-501-03 permanece `MAN`**: não há telas 04–06 nem formulário
  implementados para observar em build real; a parte testável (rotas fora do
  grupo `(tabs)` não herdam a tab bar do Expo Router) é coberta indiretamente
  pela própria estrutura de pastas, sem teste de renderização possível ainda.
- **Telas "Em breve" das abas fora do escopo** (Atividades, Alunos,
  Relatórios): a própria tela da aba é o "Em breve" (G-10) — usa
  `ComingSoonScreen` (novo, `src/features/shell/`) diretamente, sem navegação
  extra.
- **Destino "Em breve" do menu/avatar do header:** rota compartilhada
  `app/shell/coming-soon.tsx`, fora do grupo `(tabs)` (não deve ganhar tab
  bar), que le o parâmetro `?title=` (`useLocalSearchParams`) e renderiza
  `ComingSoonScreen` com esse título. O `onMenuPress`/`onAvatarPress`
  passados ao `AppHeader` chamam
  `router.push({ pathname: "/shell/coming-soon", params: { title: "Menu" | "Perfil" } })`.
- **`ComingSoonScreen`** (`src/features/shell/ComingSoonScreen.tsx`): usa
  `Screen` (T-203) + `EmptyState` (T-205) com `title` recebido por prop
  (rótulo acessível via `accessibilityRole="header"` do próprio `EmptyState`,
  AC-203/AC-205); mensagem fixa "Esta área ainda não está disponível nesta
  entrega.".
- **Mapeamento de abas → ícone** (tabela da T-203, reaproveitada sem
  alteração): Início `home`, Atividades `activities`, Alunos `students`,
  Agenda `agenda`, Relatórios `reports`.
- **`src/features/shell/useTabItems.ts`**: hook puro que monta os
  `TabBarItem[]` (rótulos/ícones fixos + `onPress` via `router.push` de cada
  rota do grupo) e resolve `activeKey` a partir do segmento atual
  (`useSegments()`), testável sem montar `Tabs` reais do Expo Router.

## Decisão — `APP_DESTINATION` (T-402)

Aprovado pelo orquestrador (`claude-opus-5-5`, 2026-09-25): `APP_DESTINATION`
permanece `"/"` em `src/features/auth/routes.ts`, **sem nenhuma edição nesse
arquivo** (nem de comentário) — `"/"` já resolve para `app/(tabs)/index.tsx`
(índice do grupo de abas criado nesta tarefa), e a T-401 edita a linha
vizinha (`AUTH_DESTINATION`) em paralelo; evitar qualquer edição reduz
conflito de merge.

## Critérios

| ID        | Resultado                                                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-501-01 | 5 abas na ordem Início, Atividades, Alunos, Agenda, Relatórios; rótulos acessíveis; aba ativa anunciada (`accessibilityState.selected`). — `CT`                |
| AC-501-02 | Abas Atividades/Alunos/Relatórios e os destinos de menu/avatar do header abrem "Em breve" com título (`accessibilityRole="header"`) e rótulo acessível. — `CT` |
| AC-501-03 | Tabs ocultas nas telas 04–06 e no formulário. — `MAN` (telas ainda não existem; decisão estrutural registrada acima).                                          |

## Interfaces

### `src/features/shell/useTabItems.ts`

- `TAB_DEFINITIONS: { key: string; label: string; icon: IconName; segment: string }[]`
  — ordem fixa: `home` ("Início", ícone `home`, segmento `index`),
  `activities` ("Atividades", `activities`, `activities`), `students`
  ("Alunos", `students`, `students`), `agenda` ("Agenda", `agenda`,
  `appointments`), `reports` ("Relatórios", `reports`, `reports`).
- `useTabItems(): { items: TabBarItem[]; activeKey: string }` — usa
  `useRouter()`/`useSegments()` do `expo-router`; `onPress` de cada item
  chama `router.push` para a rota da aba; `activeKey` é a `key` cujo
  `segment` bate com o último segmento da rota atual (fallback `"home"`
  quando o segmento é vazio, ex.: rota índice `"/"`).

### `src/features/shell/ComingSoonScreen.tsx`

- Props: `title: string`.
- `Screen` (T-203) com `EmptyState` (T-205): `title={title}`,
  `message="Esta área ainda não está disponível nesta entrega."`, sem ação
  (`actionLabel`/`onActionPress` omitidos).

### `app/(tabs)/_layout.tsx`

- `Tabs` do `expo-router`, `screenOptions={{ header: (props) => <AppHeader ... /> , headerShown: true }}`,
  prop `tabBar={() => { const { items, activeKey } = useTabItems(); return <TabBar tabs={items} activeKey={activeKey} />; }}`.
- `AppHeader.title` por tela: derivado do `options.title` de cada
  `Tabs.Screen` (rótulo da aba, igual ao `TabBarItem.label`).
- `onMenuPress`/`onAvatarPress`: `router.push("/shell/coming-soon?title=Menu")`
  e `...title=Perfil` respectivamente (rótulos fixos desta fase — sem dado
  real de usuário, G-29).

### `app/(tabs)/index.tsx`, `app/(tabs)/appointments.tsx`

- Placeholders mínimos (`Screen` + `Text` "Início" / "Agenda"), substituídos
  por T-603 e T-903.

### `app/(tabs)/{activities,students,reports}.tsx`

- Renderizam `<ComingSoonScreen title="Atividades" />` (idem Alunos,
  Relatórios).

### `app/shell/coming-soon.tsx`

- Lê `title` de `useLocalSearchParams<{ title?: string }>()` (padrão "Em
  breve" se ausente) e renderiza `<ComingSoonScreen title={title} />`.

## Plano de testes

| Critério  | Teste                                                                                                                                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-501-01 | `useTabItems.test.ts`: 5 itens na ordem definida, rótulos corretos; `activeKey` resolve por segmento (mock `useSegments`).                                                                                                                                                              |
| AC-501-01 | `TabBar` (T-203, reuso): já cobre `accessibilityState.selected` por aba — sem duplicar teste aqui.                                                                                                                                                                                      |
| AC-501-02 | `ComingSoonScreen.test.tsx`: título com `accessibilityRole="header"`, mensagem presente.                                                                                                                                                                                                |
| AC-501-02 | `coming-soon-route.test.tsx` (em `src/features/shell/__tests__/`, importando `app/shell/coming-soon.tsx` — nenhum teste dentro de `app/`, pois o Expo Router trata todo arquivo ali como rota): lê `title` de `useLocalSearchParams` (mock `expo-router`) e passa a `ComingSoonScreen`. |
| AC-501-03 | Sem teste automatizado possível (telas 04–06/formulário inexistentes); registrado como `MAN`.                                                                                                                                                                                           |

## Tarefas, arquivos e comandos

| Arquivo                                                  | Dono            |
| -------------------------------------------------------- | --------------- |
| `src/features/shell/useTabItems.ts` + `__tests__/`       | Executor Sonnet |
| `src/features/shell/ComingSoonScreen.tsx` + `__tests__/` | Executor Sonnet |
| `app/(tabs)/_layout.tsx`                                 | Executor Sonnet |
| `app/(tabs)/index.tsx`, `app/(tabs)/appointments.tsx`    | Executor Sonnet |
| `app/(tabs)/{activities,students,reports}.tsx`           | Executor Sonnet |
| `app/shell/coming-soon.tsx`                              | Executor Sonnet |
| `app/index.tsx`                                          | removido        |

Modelo/esforço: Sonnet, classe B, médio.

Comandos: `pnpm exec vitest run src/features/shell`, `pnpm run typecheck`
(0); fase 2 também `pnpm run test`, `pnpm run lint`,
`pnpm exec prettier --check <tocados>`, `python scripts/check-docs.py`,
`git diff --check`,
`npx expo export --platform android --output-dir dist-android` (descartada
depois).

## Pendências e decisões deliberadas

- AC-501-03 `MAN`: telas 04–06 e formulário não existem ainda nesta árvore;
  decisão estrutural (fora de `(tabs)`) registrada, sem observação possível
  em build real.
- Ícones das abas (G-28, T-203): provisórios, sujeitos a aceite visual do
  usuário (G-18).
- `APP_DESTINATION`: decisão pendente de aprovação do orquestrador (ver seção
  acima) — mantido `"/"` nesta fase.

## Histórico

- 2026-09-25: contrato criado pelo executor Sonnet (fase 1), após leitura de
  AGENTS §4/§6, BACKLOG T-501, GATES G-10/G-28, DESIGN §2/§3/§5, contratos
  T-203/T-205/T-402/T-502, `app/_layout.tsx`, `app/index.tsx` e
  `app/(auth)/_layout.tsx` atuais.
- 2026-09-25: **desvio registrado** — a fase 1 entregou implementação
  completa junto dos testes (sem vermelho intermediário), por a
  implementação ser pequena o bastante para não haver estado intermediário
  útil. Revisado e aceito pelo orquestrador (`claude-opus-5-5`) desta vez,
  sem refazer; violação do fluxo padrão de AGENTS §4 (testes antes da
  implementação, vermelho revisado) registrada para não repetir sem
  necessidade equivalente. Correção obrigatória aplicada na mesma revisão:
  nenhum teste dentro de `app/` (Expo Router trata todo arquivo ali como
  rota); `app/shell/__tests__/coming-soon.test.tsx` movido para
  `src/features/shell/__tests__/coming-soon-route.test.tsx`, importando
  `app/shell/coming-soon.tsx`. `APP_DESTINATION`/`src/features/auth/routes.ts`
  mantidos sem qualquer edição (decisão acima).
- 2026-09-25 (UX2, Figma "Home sem agenda"): **4 abas** em vez das 5 do G-10 —
  decisão do usuário de adiar Agenda. `agenda` removido de `TAB_DEFINITIONS`;
  rota `app/(tabs)/appointments.tsx` preservada no disco mas escondida da tab
  bar via `<Tabs.Screen name="appointments" options={{ href: null }} />` em
  `app/(tabs)/_layout.tsx`. Título de cabeçalho da Home passou a ser "Tela
  Inicial" (campo `headerTitle` em `TabDefinition`, distinto do rótulo de aba
  "Início"). `TabBar` ganhou cantos superiores arredondados (16) e sombra
  (Figma), substituindo a borda superior; ícones de "Alunos"/"Relatórios"
  mantidos como `people-outline`/`stats-chart-outline` (não
  `person-outline`/`clipboard-outline` do Figma) porque `src/components/Icon`
  está fora do escopo de arquivos permitidos desta tarefa.
