# T-202 - Primitivos de conteúdo e entrada

## Objetivo

Entregar os primitivos de conteúdo e entrada reutilizáveis por todas as telas
(EP-02 em diante): `Card`, `Button`, `TextField`, `SearchField`, `Tag`,
`FilterChips`, `SectionHeader`. Consumir exclusivamente os tokens de
`src/theme` para cor, tipografia e forma; nenhuma cor/medida literal fora de
`src/theme`.

Fluxo aplicado: fase 1 (contrato + testes + stubs sem comportamento) revisada
e aprovada pelo orquestrador (vermelho por comportamento ausente) e fase 2
(implementação mínima) concluída na sequência.

## Correção de lacuna da T-201 (tokens de forma)

`src/theme` (T-201) só expunha `color`, `semanticColor`, `typography`,
`maxContentWidthTablet`, `getContrastRatio`, `fontFamilies`/`useAppFonts` —
sem tokens de raio, espaçamento ou alvo mínimo de toque, necessários para
AC-202-05. Decisão do orquestrador (2026-09-24, via `ask` da fase 1): criar
`src/theme/shape.ts` (não constantes locais por componente), reexportado em
`src/theme/index.ts`, com os valores da coluna "Proposta" de DESIGN §4
(G-17): `cardRadius` 16, `buttonRadius` 16, `inputRadius` 12,
`minTouchTarget` 48, `tagPaddingVertical`/`tagPaddingHorizontal` 4/10,
`accentBorderWidth` 3, `avatarSize` 40, `hairlineWidth`
(`StyleSheet.hairlineWidth`, fora de `palette.js` por depender de RN). Os
valores numéricos vêm de `src/theme/palette.js` (fonte única já usada por
`tokens.ts` e `tailwind.config.js`), sem duplicação; testado em
`src/theme/__tests__/shape.test.ts`. Edição em `src/theme` autorizada
excepcionalmente para esta correção (fora da lista de "Limites" original,
liberada pelo orquestrador).

## Critérios

| ID        | Resultado                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| AC-202-01 | `Button` expõe papel `button`, estados desabilitado e carregando, e não dispara `onPress` nesses estados. — `CT`  |
| AC-202-02 | `TextField` de senha alterna visibilidade com rótulo acessível que muda ("Mostrar senha"/"Ocultar senha"). — `CT` |
| AC-202-03 | `TextField` exibe erro associado ao campo e anunciável. — `CT`                                                    |
| AC-202-04 | `FilterChips` informa estado selecionado ao leitor de tela; `Card` selecionável também. — `CT`                    |
| AC-202-05 | Alvos de toque ≥ 48 (medidos por estilo/`hitSlop`). — `CT`                                                        |
| AC-202-06 | Variações visuais conferem com DESIGN §5 em emulador. — `MAN` (pendente de build autorizado).                     |

## Interfaces

### `src/components/Card/index.tsx`

- Props: `children`, `variant?: "default" | "accent" | "selected" | "gradient"`,
  `selected?: boolean`, `onPress?`, `accessibilityLabel?`.
- Quando `onPress` é fornecido, `accessibilityRole="button"`.
- `selected` reflete em `accessibilityState={{ selected: true }}` (AC-202-04)
  além do indicador visual (borda + `color.selection`, nunca só cor).
- Cores de `variant` vêm de `color`/`semanticColor`; `accent` usa borda
  esquerda (token de forma local, ver "Pendências de tokens").

### `src/components/Button/index.tsx`

- Props: `label`, `onPress`, `variant?: "primary" | "secondary" | "onPrimaryWhite" | "pill"`,
  `disabled?`, `loading?`, `accessibilityLabel?`.
- `accessibilityRole="button"`; `accessibilityState={{ disabled: disabled || loading, busy: loading }}`.
- `onPress` não dispara quando `disabled` ou `loading` (AC-202-01):
  handler interno intercepta e retorna sem chamar a prop.
- `loading` mostra `ActivityIndicator` no lugar do rótulo (ou junto,
  conforme variante) sem remover o rótulo acessível.
- Altura mínima 48 via `style` (não só `className`, AC-202-05/A-15).
- Texto sobre `primary` usa `semanticColor.textOnPrimary` (nunca branco,
  DESIGN §4/G-17).

### `src/components/TextField/index.tsx`

- Props: `label`, `value`, `onChangeText`, `error?: string`, `hint?: string`,
  `secureTextEntry?: boolean`, `accessibilityLabel?`.
- Quando `secureTextEntry`, renderiza um controle de alternância de
  visibilidade: estado interno `visible`; `accessibilityLabel` do controle
  é `"Mostrar senha"` quando oculto e `"Ocultar senha"` quando visível
  (AC-202-02); `accessibilityRole="button"`. Sem `@expo/vector-icons` no
  projeto (confirmado no discovery): o controle é texto acessível
  ("Mostrar"/"Ocultar"), aceito pelo orquestrador para a Entrega 1; a troca
  pelo ícone de olho do design fica para quando a T-203 entregar o `Icon`.
- `error` (quando presente) renderiza um texto com `accessibilityRole="alert"`
  e `accessibilityLiveRegion="polite"` (anúncio em Android e iOS), e o texto
  do erro é repassado como `accessibilityHint` do input. Decisão do
  orquestrador: `accessibilityLabelledBy` foi descartado por ser suportado
  só no Android.
- Altura mínima do input 48.

### `src/components/SearchField/index.tsx`

- Composição sobre `TextField` (ou input dedicado) com botão de limpar
  quando `value` não vazio; botão de limpar com `accessibilityLabel="Limpar busca"`
  e alvo ≥ 48 (`hitSlop`).

### `src/components/Tag/index.tsx`

- Props: `label`, `variant?: "primary" | "neutral" | "pink"`.
- Decorativo (sem alvo de toque, DESIGN §4); cores por `variant` a partir de
  `color`/`semanticColor` (`pink` só permitido conforme
  `semanticColor.pinkAccentLargeTextOnly`, respeitando o tamanho mínimo de
  texto grande do DESIGN §4 quando usado como texto).

### `src/components/FilterChips/index.tsx`

- Props: `options: { key: string; label: string }[]`, `selected: string[]`,
  `onToggle: (key: string) => void`.
- Cada chip é `accessibilityRole="button"` com
  `accessibilityState={{ selected: boolean }}` (AC-202-04) e alvo ≥ 48 via
  `hitSlop` (padding visual pode ser menor, DESIGN §4).

### `src/components/SectionHeader/index.tsx`

- Props: `title`, `subtitle?`, `actionLabel?`, `onActionPress?`.
- `title` com papel de cabeçalho (`accessibilityRole="header"`).
- Ação opcional é alvo ≥ 48 quando presente.

## Plano de testes (fase 1, vermelho esperado)

Um arquivo por componente em `src/components/<Nome>/__tests__/`, usando
`await render(...)` (A-14) e sem depender de `className` (A-15):

- `Button`: papel `button`; `onPress` não chamado quando `disabled`/`loading`;
  `accessibilityState.disabled`/`busy`.
- `TextField`: alternância de rótulo "Mostrar senha"/"Ocultar senha" ao
  pressionar o controle de senha; erro presente e associado/anunciável.
- `Card`: `accessibilityState.selected` quando `selected`; papel `button`
  quando `onPress`.
- `FilterChips`: `accessibilityState.selected` por chip conforme `selected[]`;
  `onToggle` chamado com a chave certa.
- `SearchField`, `Tag`, `SectionHeader`: stubs mínimos (render sem crash) na
  fase 1; asserts de comportamento specific entram conforme a revisão.
- AC-202-05 (alvo ≥ 48): assert sobre `style`/`hitSlop` resolvido do
  componente (ex.: `minHeight >= 48` ou soma de `hitSlop` + dimensão
  declarada), não captura de layout real (RNTL não mede layout).

## Tabela de tarefas

| Arquivo                                                                               | Dono                   | Modelo | Esforço |
| ------------------------------------------------------------------------------------- | ---------------------- | ------ | ------- |
| `src/components/{Card,Button,TextField,SearchField,Tag,FilterChips,SectionHeader}/**` | Executor único (T-202) | Sonnet | Médio   |

## Comandos de validação

`pnpm exec vitest run src/components/**/__tests__/*.test.tsx` (fase 1:
vermelho por comportamento ausente); `pnpm run typecheck` (exit 0);
`pnpm run test` (regressão completa); `pnpm run lint`;
`pnpm exec prettier --check` nos arquivos tocados;
`python scripts/check-docs.py`; `git diff --check`;
`npx expo export --platform android --output-dir dist-android` (apagar
depois).

## Limites

Executor pode editar apenas:
`docs/contracts/t-202-primitivos-conteudo.md`,
`src/components/{Card,Button,TextField,SearchField,Tag,FilterChips,SectionHeader}/**`
e, exclusivamente para a correção de lacuna aprovada, `src/theme/shape.ts`,
`src/theme/index.ts`, `src/theme/palette.js`,
`src/theme/__tests__/shape.test.ts`. Proibido: `docs/entrega-1/TRACKING.md`;
outros contratos; AGENTS/BACKLOG/GATES; instalar dependências (ícone de senha
usa o que já existe no projeto; não há `@expo/vector-icons` instalado);
commit/push.

## Pendências

- AC-202-06 é `MAN`, pendente de build autorizado.
- Controle de visibilidade de senha em texto (sem ícone): aceito pelo
  orquestrador para a Entrega 1; revisitar quando a T-203 entregar `Icon`.
- `maxContentWidthTablet`/largura de tablet nos componentes de card/lista não
  é tratada aqui (fora do escopo do T-202; sem uso de largura literal).

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 da T-202,
  após leitura de AGENTS §4/§6, BACKLOG (T-202), DESIGN §4-§6, contrato
  T-201, `src/theme/index.ts`/`tokens.ts`/`typography.ts`, COMPATIBILIDADE
  A-14/A-15 e `src/test-utils/README.md`. Nenhum `@expo/vector-icons` (ou
  equivalente) encontrado no projeto.
- 2026-09-24: vermelho (16 falhas/3 sucessos) revisado e aprovado pelo
  orquestrador (claude-opus-5-5) via `ask`, com três decisões: (1) criar
  `src/theme/shape.ts` para os tokens de forma (lacuna da T-201), não
  constantes locais; (2) controle de visibilidade de senha em texto aceito
  para a Entrega 1; (3) erro do `TextField` anunciado por
  `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` +
  `accessibilityHint`, não `accessibilityLabelledBy` (só Android) — único
  teste ajustado por essa correção de abordagem aprovada.
- 2026-09-24: fase 2 (implementação mínima) concluída pelo mesmo executor:
  `src/theme/shape.ts`/`palette.js`/`index.ts` com os tokens de forma; os
  sete componentes implementados consumindo só `src/theme`; testes
  originais mantidos (exceto o ajuste aprovado em AC-202-03). 38/38 testes
  de `src/components` e `src/theme` passando; 98/98 na regressão completa.
