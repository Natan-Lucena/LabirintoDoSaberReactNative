# ATV-04b — Associe as cores e Memória visual

> Refino da ficha [ATV-04b do BACKLOG](../BACKLOG.md#atv-04b--associe-as-cores-e-memória-visual),
> escrito em 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em
> [PLANO](../PLANO.md). Campos propostos na
> [especificação §2.2](../ESPECIFICACAO-BACKEND.md#22-entidades); a API-06 confirma.

| Campo           | Valor                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-3                                                                                                             |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio                                                                   |
| Estimativa      | M · 6 h de worker                                                                                                |
| Dependências    | ATV-04a (contrato `GameResult`, `engine/game/**`); API-07 leva 1 (tipos e mocks `colorMatch`/`memoryGame`); G-64 |
| Backend         | Leva 1 (§2). **Mock-first**; pode ir para a `main` antes da leva (só aparece com tarefas desses tipos)           |
| Dona nesta onda | `src/features/activities/engine/{registry.ts,color-match/**,memory-game/**}`                                     |
| Libera          | EVO-03                                                                                                           |

## 1. Objetivo e valor

História **US2-10**. Os outros dois jogos do banco do design: **Associe as cores** (associação
palavra ↔ cor, vocabulário) e **Memória visual** (atenção e memória de trabalho). Com eles, o
banco tem três jogos além do quiz, cada um com o resultado simples que a evolução usa.

## 2. Referência de design

- Figma Make: só as miniaturas "Associe as cores" e "Memória visual" no `.activity-grid`; **não
  há desenho do tabuleiro** (G-18: usar o design system de `src/components/ds`). A casca é a da
  ATV-04a (`GameHint`, `GameFeedback`, progresso do `ActivityEngine`).
- Mesma lacuna do conector Figma registrada na [ATV-04a](ATV-04a.md#2-referência-de-design).

**Associe as cores** — duas colunas:

- esquerda: as palavras (`pairs[].word`), na ordem do conteúdo, botões 48 de altura;
- direita: as amostras (`pairs[].colorHex`), embaralhadas, quadrados 56 × 56 com borda
  `color.border` e raio `shape.radius.md`;
- par certo: palavra e amostra ganham o ícone de check e ficam desabilitadas; selecionado: borda
  `semanticColor.primaryFill` (como `optionSelected` do player).

**Memória visual** — grade de cartas:

- `2 × cards.length` cartas (cada carta do conteúdo vira um par), embaralhadas;
- colunas: 2 (até 4 cartas), 3 (6 cartas), 4 (8 ou mais); carta quadrada de no mínimo 64;
- virada para baixo: fundo `color.brand[100]` com o ícone `grid` do `FigmaIcon`; virada:
  `label` (Nunito ExtraBold 18) e/ou `imageUrl`;
- par encontrado fica aberto com borda de sucesso.

## 3. Fluxo do usuário

Entradas iguais às da ATV-04a (banco → detalhe → "Jogar"; sessão pela EVO-03).

**Associe as cores**

1. Tocar numa palavra a seleciona (tocar de novo desmarca; tocar noutra troca a seleção).
2. Com uma palavra selecionada, tocar numa amostra confere o par:
   - mesmo `id`: os dois ficam marcados como certos;
   - outro `id`: aviso curto "Não é essa cor." por 1,5 s, erro contado, seleção limpa.
3. Tocar numa amostra sem palavra selecionada não faz nada (nem conta erro).
4. Todos os pares certos: `GameFeedback` de sucesso, `onGameResult`, `onSolved`.

**Memória visual**

1. Tocar numa carta virada para baixo a vira.
2. Ao virar a segunda: se as duas têm o mesmo `id` de conteúdo, ficam abertas; senão, as duas
   voltam a ficar viradas para baixo depois de **900 ms**, com o toque bloqueado nesse intervalo.
3. Tocar numa carta já aberta não faz nada.
4. Todos os pares abertos: sucesso, `onGameResult`, `onSolved`.

## 4. Estados

| Estado            | Comportamento                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Carregando / erro | Do `ActivityPlayScreen` (já existe) ou do player da sessão                                                    |
| Conteúdo inválido | Menos de 2 pares/cartas ou `kind` errado: "Esta atividade está incompleta." e `onSolved()` sem `onGameResult` |
| Imagem da carta   | Falha ao carregar: mostra o `label`; sem `label`, "Figura {n}" (n = posição da carta no conteúdo)             |
| Offline           | Sem rede depois de carregado; imagens podem faltar (acima)                                                    |
| Sucesso           | `GameFeedback` "Muito bem!"                                                                                   |

## 5. Contrato de dados

Nenhum endpoint novo; lê `Task.content` de `GET /task/:id` (query key `["task", id]`).

```ts
interface ColorMatchContent {
  kind: "colorMatch";
  pairs: { id: string; word: string; colorHex: string }[]; // 2–6; "#RRGGBB"
}
interface MemoryGameContent {
  kind: "memoryGame";
  cards: { id: string; label?: string; imageUrl?: string }[]; // 2–8; cada uma vira um par
}
```

Resultado: o `GameResult` da [ATV-04a](ATV-04a.md#5-contrato-de-dados).

## 6. Regras de negócio e casos de borda

1. **Associe**: o par só é aceito quando palavra e amostra têm o mesmo `id`. Duas palavras com a
   mesma cor (dado ruim) contam como pares diferentes.
2. **Associe — contagem**: `attempts` = tentativas de par (palavra + amostra); `errors` = pares
   errados. `correct = errors === 0`.
3. **Memória — contagem**: `attempts` = jogadas (cada par de cartas virado); `errors` = jogadas
   sem par. `correct = errors === 0` (raro com mais de 2 cartas; é a regra de "acerto de
   primeira" do motor).
4. **Embaralhamento** com `random` injetável (`shuffle(items, random)` de `engine/game/`, sem
   alterar esse arquivo); as
   amostras não ficam na mesma ordem das palavras quando há mais de um par (até 5 tentativas).
5. **Cor não é a única pista** (acessibilidade): cada amostra tem rótulo acessível com o nome da
   cor, calculado por `colorName(hex)` (tabela fixa em português: vermelho, laranja, amarelo,
   verde, azul, roxo, rosa, marrom, preto, branco, cinza; a mais próxima por distância RGB). A
   tabela fica em `engine/color-match/colorNames.ts` e a ATV-11 reaproveita a mesma paleta.
6. **Memória — bloqueio**: durante os 900 ms, toques são ignorados; o temporizador é limpo ao
   desmontar.
7. Limites (50 tentativas/erros, 1 h) pelo `clampGameResult` da ATV-04a.

## 7. Plano de implementação

1. Reaproveitar `shuffle`, `clampGameResult`, `createGameTimer`, `GameHint` e `GameFeedback`
   de `engine/game/` (ATV-04a), sem alterá-los.
2. `engine/color-match/`:
   - `colorMatch.ts` (lógica pura): `selectWord`, `tryPair`, `isComplete`, contagem;
   - `colorNames.ts`: `COLOR_PALETTE` (nome + hex) e `colorName(hex)`;
   - `ColorMatchActivity.tsx`.
3. `engine/memory-game/`:
   - `memoryGame.ts` (lógica pura): `buildDeck(cards, random)` (cada carta duplicada, com
     `deckId` próprio e `pairId` = `id` do conteúdo), `flip`, `resolve`, `isComplete`;
   - `MemoryGameActivity.tsx`, com `setTimeout` de 900 ms e limpeza no `useEffect`.
4. `engine/registry.ts`: `colorMatch: ColorMatchActivity`, `memoryGame: MemoryGameActivity`.
5. Componentes com `StaticPressable` (G-44), `GameHint` (instrução) e `GameFeedback` da ATV-04a.
6. Testes da lógica pura (Vitest, sem render) e um `CT` mínimo de cada componente.

Acessibilidade: palavra "Palavra Azul", amostra "Cor azul" (+ `accessibilityState.selected`),
carta "Carta 3, virada para baixo" / "Carta 3: Gato" / "Carta 3: Gato, par encontrado"; alvos
≥ 44.

## 8. Arquivos

- **Permitidos:** `src/features/activities/engine/registry.ts`,
  `src/features/activities/engine/color-match/**` (novo),
  `src/features/activities/engine/memory-game/**` (novo),
  `src/features/activities/engine/__tests__/registry.test.ts`.
- **Proibidos:** `engine/types.ts` e `ActivityEngine.tsx` (contrato fechado na ATV-04a; se
  precisar mudar, escalar), `src/api/**`, `src/mocks/**`, `src/features/sessions/**`, o resto de
  `src/features/activities/**`.

## 9. Critérios de aceite

| ID            | Critério                                                                                   | Verif. |
| ------------- | ------------------------------------------------------------------------------------------ | ------ |
| AC-ATV-04b-01 | O par só é aceito quando a palavra e a cor são do mesmo `id`; par errado conta erro        | `UT`   |
| AC-ATV-04b-02 | A memória termina quando todos os pares estão abertos e conta jogadas e erros              | `UT`   |
| AC-ATV-04b-03 | Os dois jogos são jogáveis do início ao fim no Expo Go (Android)                           | `MAN`  |
| AC-ATV-04b-04 | Cada amostra de cor tem o nome da cor no rótulo acessível; cartas e amostras têm alvo ≥ 44 | `CT`   |

## 10. Como testar manualmente (Victor)

Android, Expo Go, modo mock (depois, backend real com a leva 1).

1. Atividades → "Associe as cores" (mock: 4 pares) → "Jogar".
2. Toque numa amostra sem escolher palavra: nada acontece.
3. Toque "Azul" e depois uma cor errada: "Não é essa cor.". Depois a cor certa: o par fica
   marcado.
4. Complete: "Muito bem!" → "Concluir" → "0 de 1 na primeira tentativa" (houve erro).
5. "Memória visual" (mock: 3 cartas, 6 na grade): vire duas diferentes: voltam depois de um
   instante; toque rápido numa terceira nesse intervalo: nada acontece.
6. Encontre todos os pares: "Muito bem!".

## 11. Riscos e perguntas em aberto

- **Nome da cor no rótulo** entrega a resposta a quem usa TalkBack. É a regra do backlog
  (acessibilidade antes do desafio); a QA-03 confirma com o usuário se a criança com leitor de
  tela deve jogar este jogo.
- **Tamanho da grade** com 8 cartas (16 na tela) em aparelho pequeno: a carta mínima de 64 com
  4 colunas cabe em 360 dp; conferir na QA-04.
- G-64: se o usuário tirar estes jogos da entrega, a tarefa é cancelada sem afetar a ATV-04a.

## 12. Fora do escopo

Editor (ATV-11), resultado na sessão (EVO-03), níveis de dificuldade, tempo-limite, som de
acerto.
