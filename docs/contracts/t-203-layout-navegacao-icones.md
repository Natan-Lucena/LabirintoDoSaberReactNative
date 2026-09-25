# T-203 - Primitivos de layout, navegação e ícones

## Objetivo

Entregar os primitivos de layout/navegação reutilizáveis pelas telas logadas
(02-07): `AppHeader`, `TabBar`, `StepIndicator`, `Avatar`, `FooterActions`,
`Icon`, `Screen`. Consumir exclusivamente `src/theme` para cor, tipografia e
forma; nenhuma cor/medida literal fora de `src/theme`. `FooterActions` reusa
`Button` (T-202) em vez de recriar botões.

## Escopo e não objetivos

- Escopo: os sete componentes acima, como primitivos visuais/estruturais.
- Não objetivo: navegação real (rotas, Expo Router, `expo-router` wiring) —
  isso é da T-501 (G-10). Aqui, `TabBar`/`AppHeader` só expõem callbacks
  (`onPress`) que o consumidor liga à navegação depois.
- Não objetivo: telas "Em breve" (G-10) — apenas os componentes que as abas
  abrirão futuramente.
- Não objetivo: trocar o toggle de senha da T-202 pelo ícone de olho — fica
  registrado como ajuste futuro (o `TextField` não muda nesta tarefa).

## Decisões desta fase

- **G-28 (instrução do orquestrador):** conjunto de ícones = `@expo/vector-icons`
  15.1.1 (Ionicons), instalado nesta tarefa. `pnpm peers check` e
  `expo-doctor` sem problemas (docs/bootstrap/COMPATIBILIDADE.md §3/§4).
- **Mapeamento de ícones** (referência visual, template.html linhas 2346-2367
  e 1021-1031): o protótipo usa um conjunto SVG próprio (vuesax/linear,
  24px, `stroke`); mapeado para o Ionicons `*-outline` mais próximo pela
  forma:

  | Uso                     | Nome no protótipo                 | Ionicons escolhido    |
  | ----------------------- | --------------------------------- | --------------------- |
  | Menu do header          | `IconsMenu24px`                   | `menu-outline`        |
  | Avatar/perfil do header | `IconsAccountCircleFilled24px`    | `person-circle`       |
  | Tab Início              | `home` (casa)                     | `home-outline`        |
  | Tab Atividades          | `activities` (caderno com marcas) | `book-outline`        |
  | Tab Alunos              | `students` (duas pessoas)         | `people-outline`      |
  | Tab Agenda              | `agenda` (calendário com pontos)  | `calendar-outline`    |
  | Tab Relatórios          | `reports` (círculo com tendência) | `stats-chart-outline` |

  Sem acesso ao Figma citado em DESIGN §5 (fora do repositório, não lido);
  mapeamento por semelhança visual e semântica, **provisório**, sujeito ao
  aceite visual do usuário no app (G-18). A troca do conjunto, se necessária,
  se faz só dentro de `Icon` (nomes próprios do design system, não os do
  Ionicons) — nenhum consumidor muda.

  Observação de diferenciação: no protótipo (template.html 2349/2351), as
  abas Atividades e Agenda usam desenhos de calendário/caderno parecidos
  entre si (ambos com o corpo de calendário `M8 2v3M16 2v3M3.5 9.09h17...`).
  Mantido `book-outline` (caderno) para Atividades e `calendar-outline`
  (calendário) para Agenda propositalmente, para diferenciar as duas abas
  na interface — não é engano de leitura do protótipo.

- `Icon` é o único ponto de acesso ao `@expo/vector-icons` no projeto: os
  demais componentes recebem um `name` do conjunto próprio da T-203 (não o
  nome interno do Ionicons), para permitir trocar o conjunto sem tocar nos
  consumidores.

## Critérios

| ID        | Resultado                                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-203-01 | `StepIndicator` anuncia "Etapa X de N" e marca a etapa ativa (`accessibilityState.selected`). — `CT`                                                                                                                                                                         |
| AC-203-02 | `Avatar` mostra iniciais quando não há foto e volta para iniciais quando a imagem falha ao carregar. — `CT`                                                                                                                                                                  |
| AC-203-03 | `AppHeader` tem botão de menu e botão de avatar com rótulos acessíveis, e o título como cabeçalho (`accessibilityRole="header"`). — `CT`                                                                                                                                     |
| —         | `TabBar` anuncia a aba ativa (`accessibilityState.selected`) e expõe rótulo por aba. — `CT`                                                                                                                                                                                  |
| —         | `FooterActions` renderiza **Voltar** (secundário) e uma ação primária, proporção de largura 1 : 1,4, reusando `Button`. — `CT`                                                                                                                                               |
| AC-203-04 | `Screen` respeita a safe area (via `react-native-safe-area-context`, já na stack) e aplica `maxContentWidthTablet` em telas largas. — `CT` parcial (o valor do token é testável fora de emulador); comprovação visual em tablet real é `MAN` (pendente de build autorizado). |

## Interfaces

### `src/components/Icon/index.tsx`

- Reexporta um conjunto fechado de nomes próprios do design system, não os
  nomes do Ionicons: `IconName = "menu" | "account" | "home" | "activities" |
"students" | "agenda" | "reports"`.
- Props: `name: IconName`, `size?: number` (padrão 24), `color?: string`
  (padrão `color.text`), `accessibilityLabel?: string`.
- Decorativo por padrão (`accessibilityElementsHidden`/`importantForAccessibility="no-hide-descendants"`
  quando `accessibilityLabel` não é passado) — quem usa o ícone como único
  alvo tocável (ex.: botão de menu) fornece o rótulo no `Pressable` pai, não
  no `Icon`.
- Internamente usa `Ionicons` de `@expo/vector-icons`, com a tabela de
  mapeamento acima (não exposta ao consumidor). `testID={"icon-" + name}`
  para os testes localizarem o ícone certo.

### `src/components/AppHeader/index.tsx`

- Props: `title: string`, `onMenuPress: () => void`, `onAvatarPress: () => void`,
  `avatarUri?: string`, `avatarInitials?: string`.
- Altura 64 (DESIGN §4), fundo `color.background`.
- Botão de menu: `Pressable` com `accessibilityRole="button"`,
  `accessibilityLabel="Abrir menu"`, ícone `Icon name="menu"`.
- Título: `Text` com `accessibilityRole="header"`, tipografia `typography.header`,
  cor `color.text`, centralizado, `flex: 1`.
- Botão de avatar: `Pressable` com `accessibilityRole="button"`,
  `accessibilityLabel="Abrir perfil"`, renderiza `Avatar` (foto/iniciais) ou,
  sem `avatarUri`/`avatarInitials`, `Icon name="account"`.

### `src/components/TabBar/index.tsx`

- Props: `tabs: TabBarItem[]`, `activeKey: string`.
  `TabBarItem = { key: string; label: string; icon: IconName; onPress: () => void }`.
- Cada aba: `Pressable` com `accessibilityRole="tab"`,
  `accessibilityLabel=label`, `accessibilityState={{ selected: key === activeKey }}`.
- Aba ativa: `Icon`/`Text` em `semanticColor.textAccentOnSurface` com fundo
  pill `color.selection` (DESIGN §4); inativa em `color.textTertiary`.
- Altura 64, fundo `color.surface`, borda superior `shape.hairlineWidth` em
  `color.border` (DESIGN §4/§5).

### `src/components/StepIndicator/index.tsx`

- Props: `totalSteps: number`, `currentStep: number` (1-based),
  `labels?: string[]`.
- Contêiner: `accessibilityRole="progressbar"`? — decisão: usar
  `View` com `accessibilityLabel={"Etapa " + currentStep + " de " + totalSteps}`
  no contêiner (anúncio único, AC-203-01), sem depender de `accessibilityRole`
  específico (RN não tem papel nativo de "stepper").
- Cada passo: círculo numerado (`Text`) + rótulo opcional; passo `< currentStep`
  ou `=== currentStep` em `color.primary`/`color.selection` conforme
  protótipo (passo atual preenchido, concluídos em `selection`, futuros em
  `tagNeutral`); passo ativo com `accessibilityState={{ selected: true }}`
  no nó do passo, os demais com `selected: false`. Cada nó de passo tem
  `testID={"step-indicator-step-" + n}` (1-based) para os testes localizarem
  o passo sem depender de papel de acessibilidade (RN não tem um papel
  nativo de "stepper").

### `src/components/Avatar/index.tsx`

- Props: `uri?: string`, `name: string` (fonte das iniciais), `size?: number`
  (padrão `shape.avatarSize`), `accessibilityLabel?: string`.
- Sem `uri`: renderiza iniciais (até 2 letras, do `name`) em círculo
  `color.selection`/`semanticColor.textOnSelection` (DESIGN §5, cor de
  seleção como fundo neutro de placeholder).
- Com `uri`: `Image` (`testID="avatar-image"`) com `onError` que troca para
  o estado de iniciais (estado interno `hasError`), sem novas tentativas
  automáticas (AC-203-02).
- `accessibilityRole="image"` quando há foto; sem rótulo próprio quando
  usado dentro de um `Pressable` rotulado (AppHeader) — recebe
  `accessibilityElementsHidden` nesse caso via prop `decorative?: boolean`.

### `src/components/FooterActions/index.tsx`

- Props: `onBack: () => void`, `onPrimary: () => void`, `primaryLabel: string`,
  `backLabel?: string` (padrão `"Voltar"`), `primaryDisabled?: boolean`,
  `primaryLoading?: boolean`.
- Layout `flexDirection: "row"`, `gap`; **Voltar** com `flex: 1` e
  `Button variant="secondary"`; ação primária com `flex: 1.4` e
  `Button variant="primary"` (proporção do protótipo, template.html
  1103-1106). Reusa `Button` (T-202) — nenhum estilo de botão duplicado.

### `src/components/Screen/index.tsx`

- Props: `children`, `scroll?: boolean` (padrão `false`), `style?`.
- Usa `SafeAreaView` de `react-native-safe-area-context` (já na stack,
  COMPATIBILIDADE §3) como contêiner externo, fundo `color.background`.
- Contêiner interno (`testID="screen-content"`) com
  `maxWidth: maxContentWidthTablet`, `alignSelf: "center"`, `width: "100%"`
  — limita a largura em tablet sem afetar celular (largura de tela <
  `maxContentWidthTablet`, DESIGN §6/G-18).
- Quando `scroll`, envolve `children` num `ScrollView`; caso contrário, `View`.

## Estados e acessibilidade

- Todo controle tocável (menu, avatar, aba, Voltar/primária) tem
  `accessibilityRole` e `accessibilityLabel` explícitos (DESIGN §6).
- Seleção (aba ativa, etapa ativa) nunca só por cor: `accessibilityState.selected`
  sempre acompanha a diferença visual (DESIGN §4/§6).
- Alvos ≥ `shape.minTouchTarget` (48) nos botões de menu/avatar/abas/rodapé.
- `Avatar` com iniciais não força o leitor de tela a anunciar "imagem" —
  só quando há foto real.

## Plano de testes

| Critério      | Teste                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-203-01     | `StepIndicator`: contêiner com `accessibilityLabel` "Etapa 2 de 3"; passo 2 com `accessibilityState.selected === true`, passo 1 e 3 com `false`.                                  |
| AC-203-02     | `Avatar`: sem `uri`, renderiza iniciais do `name`; com `uri`, dispara `onError` da `Image` e o texto de iniciais aparece depois.                                                  |
| AC-203-03     | `AppHeader`: `getByLabelText("Abrir menu")` e `getByLabelText("Abrir perfil")` existem com `accessibilityRole="button"`; título com `accessibilityRole="header"`.                 |
| TabBar        | 5 abas renderizadas com os rótulos do design; aba ativa com `accessibilityState.selected === true`, demais `false`.                                                               |
| FooterActions | `getByRole("button", { name: "Voltar" })` e a ação primária dispensam `onPress` corretos; `onPress` de "Voltar" não afeta a ação primária.                                        |
| AC-203-04     | `Screen`: o estilo aplicado ao contêiner interno tem `maxWidth === maxContentWidthTablet` (import direto do token, sem literal). Comprovação de safe area/tablet real fica `MAN`. |

Mock de `@expo/vector-icons` nos testes, se o motor de teste não resolver a
fonte do Ionicons sem erro (`vi.mock("@expo/vector-icons", () => ({ Ionicons:
(props) => React.createElement("Text", props, props.name) }))`, adicionado
por teste conforme necessidade, não no `vitest.setup.ts` global, para não
afetar outras frentes).

## Tarefas, arquivos e comandos

- Arquivos: `src/components/{AppHeader,TabBar,StepIndicator,Avatar,FooterActions,Icon,Screen}/`
  (`index.tsx` + `__tests__/*.test.tsx`), `docs/bootstrap/COMPATIBILIDADE.md`
  (§3/§4, instalação do `@expo/vector-icons`), `package.json`/`pnpm-lock.yaml`
  (dependência nova).
- Modelo/esforço: Sonnet, classe B, médio (conforme BACKLOG).
- Comandos de validação: `pnpm vitest run <arquivos>` (fase 1: vermelho
  esperado por comportamento ausente; fase 2: verde), `pnpm run typecheck`
  (0 nas duas fases), `pnpm run lint`, `pnpm exec prettier --check <tocados>`,
  `python scripts/check-docs.py`, `git diff --check`,
  `npx expo export --platform android --output-dir dist-android` (apagar a
  pasta depois).

## Pendências e decisões deliberadas

- AC-203-04 (safe area/largura máxima em tablet real) permanece `MAN`,
  pendente de build/emulador autorizado (AGENTS §7).
- Mapeamento de ícones (tabela acima) é uma escolha por semelhança visual,
  não confirmada contra o Figma original (fora do repositório); sujeita a
  revisão do orquestrador/usuário.
- Troca do toggle de senha da T-202 pelo ícone de olho: registrada como
  ajuste futuro, fora do escopo desta tarefa.

## Histórico

- 2026-09-24: contrato criado (fase 1, Sonnet/T-203), após instalação de
  `@expo/vector-icons` autorizada pelo orquestrador.
