# T-201 - Tokens, tema e fontes

## Objetivo

Expor os tokens de cor, tipografia, forma (largura máxima de conteúdo em
tablet) e o carregamento de fontes usados por toda a interface (EP-02 em
diante), sem cor literal fora de `src/theme` e sem duplicar valores no
`tailwind.config.js`. A ligação das fontes no root (`app/_layout.tsx`) é da
T-502; esta tarefa só entrega `src/theme/fonts.ts`.

Fluxo aplicado: fase 1 (contrato + testes + stubs sem comportamento) revisada
e aprovada pelo orquestrador em 2026-09-24 (vermelho por comportamento
ausente, não por ambiente) e fase 2 (implementação mínima) concluída na
sequência, incluindo o ajuste de `tailwind.config.js` pedido na aprovação
(ver "Interfaces" e "Histórico").

## Critérios

| ID        | Resultado                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-201-01 | Cada cor da fonte (DESIGN §4) existe com valor idêntico, incluindo `color.success` `rgb(80,200,120)`. — `UT`                                                                   |
| AC-201-02 | Pares texto/fundo usados pelos componentes têm contraste ≥ 4,5:1 (≥ 3:1 para texto grande e UI); pares documentados como falhos não são usados pelos tokens semânticos. — `UT` |
| AC-201-03 | Fontes carregam antes da primeira tela, sem flash de fonte errada. — `MAN` (pendente de build autorizado; parcialmente coberto por `UT` nos identificadores).                  |

## Interfaces

### `src/theme/tokens.ts`

- `color: Record<ColorToken, string>` — os 12 valores exatos da fonte
  (DESIGN §4, coluna "Fonte"), como string `"rgb(r,g,b)"` ou `"#fff"`
  (idêntico ao formato da fonte, sem conversão).
- `semanticColor` — pares aprovados (G-17) para os componentes lerem, cada
  chave documentada com o token/fundo de origem. Não inclui nenhum par
  documentado como falho em DESIGN §4 (branco sobre `primary`,
  `textTertiary` como texto, `border`/`success` como texto).
- `maxContentWidthTablet: number` — largura máxima de conteúdo em tablet
  (R4). DESIGN §6 deixa o valor "a definir em T-201"; **720dp**, aprovado
  pelo orquestrador em 2026-09-24 como provisório, sujeito ao aceite visual
  do usuário (G-18).
- Os valores brutos de `color` e `maxContentWidthTablet` vêm de
  `src/theme/palette.js` (ver abaixo); `tokens.ts` só tipa e monta os
  semânticos.

### `src/theme/typography.ts`

- `typography: Record<TypographyRole, TypographyStyle>` com os papéis de
  DESIGN §4 (header, tabLabel, screenTitle, sectionTitle, cardTitle, body,
  button, tag, time, timerPlayer, childPrompt, answerOption) e os tamanhos
  da coluna "Proposta mobile". Mínimos: `tag.fontSize >= 12`,
  `body.fontSize >= 14`. `fontFamily` de cada papel referencia
  `fontFamilies` de `fonts.ts` (sem string solta).

### `src/theme/contrast.ts`

- `getContrastRatio(foreground, background): number` — luminância relativa
  WCAG 2.x sobre `"rgb(r,g,b)"`/hex. Implementação própria, testada pelos
  pares de `AC-201-02`.

### `src/theme/fonts.ts`

- `fontFamilies` — identificadores exportados por
  `@expo-google-fonts/{nunito,roboto,roboto-mono}` usados no design (Nunito
  400/600/700, Roboto 400/600, Roboto Mono 400/700).
- `useAppFonts(): { fontsLoaded: boolean; fontError: Error | null }` — hook
  que chamará `useFonts` (expo-font) com `fontFamilies`. Não testável sem
  nativo (AC-201-03 é `MAN`); **não é chamado em nenhum lugar do app nesta
  tarefa** — a T-502 decide onde montá-lo e como segurar o splash.

### `src/theme/palette.js`

Fonte única, em CommonJS puro (com JSDoc, `allowJs` do `expo/tsconfig.base`),
dos valores brutos de `color` e `maxContentWidthTablet`. Existe porque o
`require("./tokens.ts")` direto do `tailwind.config.js` (testado na fase 1)
foi reprovado na revisão: dependeria do _strip_ de tipos do Node, disponível
sem flag só a partir do Node 22.18 (`engines` do projeto aceita `>=22.13`) e
não garantido no ambiente do build EAS. `tokens.ts` importa `palette.js` e o
reexporta tipado; `tailwind.config.js` importa `palette.js` diretamente.
Nenhum valor de cor é duplicado entre os dois consumidores.

### `src/theme/index.ts`

Reexporta os módulos acima. Ponto único de import para as demais tarefas do
EP-02 (T-202 a T-205).

### `tailwind.config.js`

Lê `color` e `maxContentWidthTablet` de `src/theme/palette.js` via `require`
(CommonJS puro, sem strip de tipos nem dependência nova).

## Limites

Executor pode editar apenas: `docs/contracts/t-201-tokens-tema-fontes.md`;
`src/theme/**`; `tailwind.config.js`; `global.css`. Proibido: editar
`app/_layout.tsx` ou qualquer arquivo fora dessa lista; `docs/entrega-1/TRACKING.md`
(o orquestrador registra); outros contratos; AGENTS/BACKLOG/GATES; instalar
dependências; commit/push.

Validação: `pnpm exec vitest run src/theme/__tests__/tokens.test.ts
src/theme/__tests__/fonts.test.ts` (16/16); `pnpm run typecheck` (exit 0);
`pnpm run test` (regressão completa, 76/76); `pnpm run lint` (exit 0);
`pnpm exec prettier --check` nos arquivos tocados (exit 0 após `--write`);
`python scripts/check-docs.py` (0 problemas); `git diff --check` (sem
conflitos de espaço em branco); `npx expo export --platform android
--output-dir dist-android` (bundle Hermes gerado com sucesso, tailwind lendo
`palette.js`; diretório apagado depois).

## Pendências

- `maxContentWidthTablet = 720` é provisório: sujeito ao aceite visual do
  usuário (G-18) quando as telas que o consomem forem implementadas.
- `color.success` como texto: DESIGN §4 documenta que só serve como
  decorativo (borda de acento); não incluído em `semanticColor` como texto.
  O texto do status "Realizada" (T-902) usa `color.text`/`textSecondary`
  sobre tag, não `color.success` diretamente — leitura confirmada pelo
  orquestrador em 2026-09-24; a confirmar novamente com quem implementar
  T-902.
- AC-201-03 completo (fontes sem flash, em aparelho) permanece pendente de
  build autorizado (T-108/T-502); esta tarefa cobre por `UT` só os
  identificadores e a ligação com a tipografia.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-201, após leitura de AGENTS §4/§6, BACKLOG
  (T-201), DESIGN §4/§6, COMPATIBILIDADE (A-03, A-15), `tailwind.config.js`,
  `global.css`, `app/_layout.tsx`, `src/test-utils/README.md` e contrato
  T-302 (formato). Vermelho (14 falhas/2 sucessos) revisado e aprovado pelo
  orquestrador (claude-opus-5-5) via `ask`, com três decisões: (1)
  `maxContentWidthTablet = 720`, provisório/G-18; (2) leitura de
  `color.success` como decorativo confirmada; (3) `tailwind.config.js` não
  pode depender de strip de tipos do Node — ajuste para `palette.js`
  (CommonJS puro) como fonte única, consumida por `tokens.ts` e pelo
  `tailwind.config.js`.
- 2026-09-24: fase 2 (implementação mínima) concluída pelo mesmo executor:
  `palette.js` criado com os valores exatos de DESIGN §4; `tokens.ts`
  reexporta tipado; `contrast.ts` implementa a luminância relativa WCAG;
  `typography.ts` e `fonts.ts` preenchidos com os identificadores e tamanhos
  reais; `tailwind.config.js` ajustado para ler `palette.js`. Todas as
  validações da seção "Limites" passaram sem alterar nenhum teste.
