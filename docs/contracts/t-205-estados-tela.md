# T-205 - Estados comuns de tela

## Objetivo

Entregar os componentes de estado reutilizados por todas as telas (DESIGN §6):
`LoadingState`, `EmptyState`, `ErrorState`, `PendingBanner`. Consumir
exclusivamente os tokens de `src/theme` e os primitivos de `src/components`
(`Button`, `Card`) já entregues pela T-202; nenhuma cor/medida literal fora de
`src/theme`.

Fluxo aplicado: fase 1 (contrato + testes + stubs sem comportamento), revisada
e aprovada pelo orquestrador (vermelho por comportamento ausente), e fase 2
(implementação mínima) na sequência.

## Critérios

| ID        | Resultado                                                                          |
| --------- | ---------------------------------------------------------------------------------- |
| AC-205-01 | `ErrorState` oferece "Tentar novamente" que chama o callback ao ser tocado. — `CT` |
| AC-205-02 | `PendingBanner` é anunciado ao aparecer. — `CT`                                    |

Requisitos adicionais do DESIGN §6, cobertos como parte do escopo desta tarefa
mesmo sem AC numerado próprio: rótulo acessível de carregamento
(`LoadingState`) e ação opcional anunciável (`EmptyState`); nada comunicado só
por cor.

## Interfaces

### `src/components/LoadingState/index.tsx`

- Props: `label?: string` (padrão: `"Carregando"`).
- Renderiza `ActivityIndicator` (cor de `color.primary`) e um `Text` com o
  rótulo.
- O contêiner tem `accessibilityRole="progressbar"` e
  `accessibilityLabel={label}`, para que o leitor de tela anuncie o
  carregamento (não depende só de cor/spinner visual).

### `src/components/EmptyState/index.tsx`

- Props: `title: string`, `message?: string`, `actionLabel?: string`,
  `onActionPress?: () => void`.
- `title` com `accessibilityRole="header"` (consistente com `SectionHeader`
  da T-202).
- Quando `actionLabel` e `onActionPress` são fornecidos, renderiza um `Button`
  (`variant="secondary"`) da T-202 com esse rótulo; ação é opcional
  (`actionLabel`/`onActionPress` ausentes → sem botão).

### `src/components/ErrorState/index.tsx`

- Props: `message: string`, `onRetry: () => void`, `retryLabel?: string`
  (padrão: `"Tentar novamente"`).
- `message` anunciado via `accessibilityRole="alert"` +
  `accessibilityLiveRegion="polite"` (mesmo padrão de erro da T-202,
  `TextField`).
- Botão de retry é o `Button` da T-202 (`variant="secondary"`), com
  `label={retryLabel}`; ao tocar, chama `onRetry` (AC-205-01). Reusa o
  bloqueio de disparo duplo já implementado pelo `Button` (`disabled`/
  `loading` não fazem parte desta tarefa; não objetivo).

### `src/components/PendingBanner/index.tsx`

- Props: `message: string`.
- Não acopla a `useOnline` (T-304): recebe o texto pronto (ex. "Sem conexão —
  mostrando dados salvos" ou "Envio pendente"), decidido pela tela que o usa.
- Anunciado ao aparecer (AC-205-02): contêiner com `accessibilityRole="alert"`
  (**sem** `accessibilityLiveRegion`: decisão do orquestrador na aprovação da
  fase 1 — `liveRegion` + `announceForAccessibility` duplicaria o anúncio no
  Android), e chama `AccessibilityInfo.announceForAccessibility(message)` em
  um `useEffect` uma única vez ao montar e novamente quando `message` muda
  (mudança de string == "aparecer"/reaparecer). Cor não é o único indicador: o
  texto descreve a pendência.
- Visual usa `Card` (`variant="accent"`) da T-202 para o destaque de borda,
  sem cor literal.

## Plano de testes (fase 1, vermelho esperado)

Um arquivo por componente em `src/components/<Nome>/__tests__/`, usando
`await render(...)` (A-14):

- `LoadingState`: renderiza com `accessibilityRole="progressbar"` e rótulo
  acessível igual ao `label` (padrão e customizado).
- `EmptyState`: renderiza `title`/`message`; sem `actionLabel`/`onActionPress`
  não há botão; com ambos, `fireEvent.press` no botão chama
  `onActionPress`.
- `ErrorState`: renderiza `message` com `accessibilityRole="alert"` e
  `accessibilityLiveRegion="polite"`; `await fireEvent.press` no botão "Tentar
  novamente" (ou `retryLabel` customizado) chama `onRetry` (AC-205-01).
- `PendingBanner`: contêiner com `accessibilityRole="alert"` (sem
  `accessibilityLiveRegion`); `AccessibilityInfo.announceForAccessibility` é
  chamado uma única vez com `message` ao montar e novamente quando `message`
  muda (mock via `vi.spyOn`) (AC-205-02).

## Tabela de tarefas

| Arquivo                                                                | Dono                   | Modelo | Esforço     |
| ---------------------------------------------------------------------- | ---------------------- | ------ | ----------- |
| `src/components/{LoadingState,EmptyState,ErrorState,PendingBanner}/**` | Executor único (T-205) | Sonnet | Baixo/Médio |

## Comandos de validação

`pnpm exec vitest run src/components/{LoadingState,EmptyState,ErrorState,PendingBanner}/__tests__/*.test.tsx`
(fase 1: vermelho por comportamento ausente); `pnpm run typecheck` (exit 0);
`pnpm run test` (regressão completa); `pnpm run lint`;
`pnpm exec prettier --check` nos arquivos tocados; `python scripts/check-docs.py`;
`git diff --check`.

## Limites

Executor pode editar apenas: `docs/contracts/t-205-estados-tela.md` e
`src/components/{LoadingState,EmptyState,ErrorState,PendingBanner}/**`.
Proibido: `docs/entrega-1/TRACKING.md`; outros contratos; AGENTS/BACKLOG/GATES;
instalar dependências; commit com `--no-verify`.

## Pendências

- Nenhuma cor literal introduzida; qualquer novo token de forma/cor necessário
  deve ser escalado, não inventado localmente (nenhum foi necessário nesta
  tarefa: os componentes reusam `Button`/`Card`/`shape`/`color`).

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 da T-205,
  após leitura de AGENTS §4/§6, BACKLOG (T-205), DESIGN §6, contrato T-202,
  `src/components/{Button,Card}`, contrato T-304 (`OfflineError`/`useOnline`,
  para decidir que `PendingBanner` não se acopla ao hook) e
  `src/test-utils/README.md`.
- 2026-09-24: vermelho (9 falhas/1 sucesso) revisado e aprovado pelo
  orquestrador (claude-opus-5-5) via `ask`, com um ajuste: `PendingBanner` usa
  só `AccessibilityInfo.announceForAccessibility` (sem
  `accessibilityLiveRegion`, que duplicaria o anúncio no Android); `ErrorState`
  mantém `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` sem
  `announce`. Demais decisões da fase 1 aprovadas sem ajuste.
