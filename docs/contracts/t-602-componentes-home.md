# T-602 - Componentes da Home e `ContentCard`

## Objetivo

Entregar os componentes de apresentação da Home (`GreetingBanner`,
`ScheduledSessionCard`, `CompletedSessionCard`) e `ContentCard` (reusado pela
T-703), todos recebendo dados por props tipadas — sem busca de dados (T-601) e
contra a camada de mocks (G-29). Consumir exclusivamente `src/theme` (tokens de
cor/tipografia/forma de T-201/T-202); nenhuma cor/medida literal fora dele.

Fluxo aplicado: fase 1 (contrato + testes + stubs sem comportamento), revisão
pelo orquestrador (vermelho por comportamento ausente) e fase 2 (implementação
mínima), na sequência.

## Escopo e não objetivos

- Escopo: os quatro componentes de apresentação listados acima e seus testes.
- Não objetivos: busca de dados (`useTodayAppointments`, `useLastSessions`,
  `useTaskNotebooks` — T-601); composição da tela `HomeScreen` (T-603); cálculo
  de taxa de acerto ou qualquer dado não fornecido pela API (G-11); navegação
  real (a tela consumidora decide o `onPress`).
- Decisões aprovadas herdadas: G-11 (saudação sem título, contagem
  singular/plural, estado vazio "Boas-vindas!", últimas sessões só com aluno e
  nome da sessão), G-12 (campos de agendamento restritos à API, sem "até"),
  G-15 (`ContentCard`: título = descrição truncada, tags = categoria + nº de
  tarefas), G-17 (texto sobre turquesa usa `semanticColor.textOnPrimary`),
  G-29 (dados mockados; este componente não sabe disso, apenas recebe props).

## Critérios

| ID        | Resultado                                                                                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-602-01 | `GreetingBanner` mostra "Olá, {nome}! 👋" sem título (G-11), a contagem ("Você tem 1 sessão agendada para hoje" / "Você tem N sessões agendadas para hoje") ou, sem agendamentos, "Boas-vindas!", e o botão Iniciar Sessão. — `CT` |
| AC-602-02 | `ScheduledSessionCard`/`CompletedSessionCard` mostram só campos aprovados em G-11/G-12; campo ausente (ex.: `studentName`) não gera texto vazio nem placeholder falso. — `CT`                                                      |
| AC-602-03 | Texto sobre turquesa (`GreetingBanner`, acento `primary` dos cards) usa `semanticColor.textOnPrimary` (G-17). — `CT`                                                                                                               |
| AC-602-04 | `ContentCard` mostra título (descrição truncada) e tags (primeira em `color.selection`, demais neutras) com o mapeamento de G-15; selecionável com `accessibilityState.selected` para uso em 05. — `CT`                            |

## Interfaces

### `src/features/home/components/GreetingBanner.tsx`

- Props: `educatorName: string`, `appointmentsTodayCount: number`,
  `onStartSession: () => void`.
- Saudação: `` `Olá, ${educatorName}! 👋` `` — sem título (G-11), em um único
  `Text`. O emoji é decorativo: o `Text` da saudação recebe
  `accessibilityLabel` sem o emoji (`` `Olá, ${educatorName}!` ``), para que o
  leitor de tela não o anuncie (correção de abordagem: nested `Text` some da
  árvore de acessibilidade do RNTL/RN e não permite testar o emoji
  isoladamente; `accessibilityLabel` cobre o requisito sem essa limitação).
- Subtítulo: `appointmentsTodayCount === 0` → `"Boas-vindas!"`;
  `appointmentsTodayCount === 1` → `"Você tem 1 sessão agendada para hoje"`;
  caso contrário → `` `Você tem ${appointmentsTodayCount} sessões agendadas para hoje` ``.
- Fundo `color.primary`; todo texto usa `semanticColor.textOnPrimary`
  (AC-602-03).
- Botão **Iniciar Sessão**: `Button` (`variant="onPrimaryWhite"`),
  `onPress={onStartSession}`.

### `src/features/home/components/ScheduledSessionCard.tsx`

- Props: `studentName: string`, `scheduledAt: Date`, `statusLabel: string`,
  `accent?: "primary" | "pink"` (padrão `"primary"`), `onPress?: () => void`.
- Composição: `Card` variant `"accent"` (T-202) é fixo em `color.primary` e
  não aceita cor configurável — confirmado lendo `src/components/Card/index.tsx`
  (`styles.accent` usa `color.primary` fixo). Decisão do orquestrador
  (2026-09-25, via `ask`): manter `Card` variant `"default"` com `onPress`
  envolvido por uma `View` com borda esquerda de acento
  (`shape.accentBorderWidth`, `color.primary` ou `color.pink` conforme
  `accent`), sem editar `src/components` (cor/medida vêm de `shape`/`color`).
- Conteúdo: nome do aluno (`typography.cardTitle`), horário
  (`formatTime(scheduledAt)`, `typography.time`, sem "até" — G-12), `Tag`
  com `statusLabel` (`variant="primary"`).
- Sem `observation` nem duração/atividade/categoria (fora da API, G-12): não
  faz parte das props deste card (reservado ao `AppointmentCard` da T-902).

### `src/features/home/components/CompletedSessionCard.tsx`

- Props: `studentName?: string`, `sessionName: string`, `onPress?: () => void`.
- Composição: `Card` (`variant="gradient"`, `onPress`).
- Conteúdo: `sessionName` sempre; `studentName` só quando definido — ausência
  não renderiza rótulo vazio nem placeholder (AC-602-02, campo de
  `EducatorLastSession.studentName?`).

### `src/features/content/ContentCard.tsx`

- Props: `description: string`, `tags: string[]`, `selected?: boolean`,
  `onPress?: () => void`, `accessibilityLabel?: string`.
- Título: `description` (G-15) truncada visualmente via `numberOfLines={2}` e
  `ellipsizeMode="tail"` no `Text` (decisão do orquestrador, 2026-09-25: não
  cortar por caracteres); a descrição completa permanece no
  `accessibilityLabel` do título para o leitor de tela.
- Tags: renderizadas na ordem recebida; a primeira com `Tag variant="primary"`
  (`color.selection`), as demais `variant="neutral"` (G-15: primeira =
  categoria, demais = contagem de tarefas — a montagem do array é
  responsabilidade de quem consome o componente, ex.: T-703).
- `Card` (`selected`, `onPress`) repassa `accessibilityState.selected` (via
  T-202) para uso como item selecionável em 05 (AC-602-04).

## Plano de testes (fase 1, vermelho esperado)

Um arquivo por componente em `__tests__/`, usando `await render(...)`:

- `GreetingBanner.test.tsx`: saudação com nome exato; singular
  (`count === 1`); plural (`count > 1`, ex. 3); estado vazio
  (`count === 0` → "Boas-vindas!"); botão aciona `onStartSession`; saudação
  com `accessibilityLabel` sem o emoji.
- `ScheduledSessionCard.test.tsx`: aluno, horário formatado
  (`formatTime`) e `statusLabel` presentes; nenhum texto de "até"; `onPress`
  disparado ao tocar.
- `CompletedSessionCard.test.tsx`: com `studentName` mostra os dois campos;
  sem `studentName` mostra só `sessionName` (sem placeholder/texto vazio).
- `ContentCard.test.tsx`: título com `numberOfLines={2}`/`ellipsizeMode="tail"`
  e texto completo (sem corte por caracteres); primeira tag e demais tags
  renderizadas; `accessibilityState.selected` quando `selected`.

## Tabela de tarefas

| Arquivo                                                                                                                                             | Dono                   | Modelo | Esforço |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ | ------- |
| `src/features/home/components/{GreetingBanner,ScheduledSessionCard,CompletedSessionCard}.tsx`, `src/features/content/ContentCard.tsx`, `__tests__/` | Executor único (T-602) | Sonnet | Médio   |

## Comandos de validação

`pnpm exec vitest run src/features/home/components/__tests__/*.test.tsx src/features/content/__tests__/*.test.tsx`
(fase 1: vermelho por comportamento ausente); `pnpm run typecheck` (exit 0);
`pnpm run test` (regressão completa); `pnpm run lint`;
`pnpm exec prettier --check` nos arquivos tocados; `python scripts/check-docs.py`;
`git diff --check`.

## Limites

Executor pode editar apenas: `docs/contracts/t-602-componentes-home.md`,
`src/features/home/components/**`, `src/features/content/**`. Proibido:
`docs/entrega-1/TRACKING.md`; outros contratos; AGENTS/BACKLOG/GATES; editar
`src/components/**` ou `src/theme/**`; instalar dependências; busca de dados
(T-601); commit/push antes da aprovação da fase 1.

## Pendências

- Aceite visual (G-18): pendente de observação do usuário em emulador/dispositivo.
- Composição em tela (T-603) decide como montar `tags` do `ContentCard` a
  partir de `TaskNotebookWithGroups` (categoria + contagem de tarefas).

## Histórico

- 2026-09-25: contrato criado pelo executor Sonnet para a fase 1 da T-602,
  após leitura de AGENTS §4/§6, BACKLOG (T-602/T-603), GATES G-11/G-12/G-15/
  G-17/G-29, DESIGN §2 e §5, contratos T-202/T-201/T-305/T-306,
  `src/theme`, `src/api/types.ts` e `src/utils/date.ts`.
- 2026-09-25: vermelho (4 arquivos, 14 falhas) revisado e aprovado pelo
  orquestrador (claude-opus-5-5) via `ask`, com duas decisões: (1)
  `ScheduledSessionCard` usa `View` wrapper para o acento turquesa/rosa (não
  `Card variant="accent"`, que é fixo em `color.primary` — confirmado no
  código do T-202); (2) `ContentCard` não trunca por caracteres, usa
  `numberOfLines={2}`/`ellipsizeMode="tail"` com a descrição completa no
  `accessibilityLabel` — teste ajustado conforme autorizado. Durante a fase 2,
  descoberta técnica adicional: `Text` aninhado dentro de outro `Text` (para
  isolar o emoji do `GreetingBanner`) não é encontrado por
  `getByText`/árvore de acessibilidade do RNTL, tornando o teste original
  inviável; corrigido para usar `accessibilityLabel` sem o emoji no `Text` da
  saudação (mesmo padrão já usado no `ContentCard`), com o teste ajustado de
  acordo — mesma classe de correção já autorizada pelo orquestrador.
