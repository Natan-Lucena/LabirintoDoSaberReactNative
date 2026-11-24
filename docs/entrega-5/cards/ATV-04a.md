# ATV-04a — Forme a palavra

> Refino da ficha [ATV-04a do BACKLOG](../BACKLOG.md#atv-04a--forme-a-palavra), escrito em
> 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em [PLANO](../PLANO.md).
> As rotas e os campos citados são os **propostos** na
> [especificação §2](../ESPECIFICACAO-BACKEND.md#2-banco-de-atividades--p1); a API-06 confirma.

| Campo           | Valor                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-2                                                                                                                  |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio (regra de jogo simples, mas muda o contrato do motor)                  |
| Estimativa      | M · 6 h de worker                                                                                                     |
| Dependências    | API-07 leva 1 (tipo `WordBuilderContent` e mock com atividades `wordBuilder`); G-61 e G-64                            |
| Backend         | Leva 1 (§2). **Mock-first**; pode ir para a `main` antes da leva (só aparece quando existir uma tarefa `wordBuilder`) |
| Dona nesta onda | `src/features/activities/engine/{types.ts,ActivityEngine.tsx,registry.ts,game/**,word-builder/**}`                    |
| Libera          | ATV-04b (casca do jogo), EVO-03 (resultado do jogo)                                                                   |

## 1. Objetivo e valor

História **US2-10**: o profissional usa jogos curtos no atendimento. "Forme a palavra" é o jogo
de destaque do design: a criança vê a figura (e ouve a dica), monta a palavra tocando nas
letras e recebe retorno imediato. Para o profissional, o jogo trabalha consciência fonológica e
escrita e gera um resultado simples (tentativas e erros) que a EVO-03 leva para a evolução.

Esta tarefa também **define o contrato dos jogos no motor** (`GameResult`), que a ATV-04b e a
EVO-03 reaproveitam.

## 2. Referência de design

- Figma Make `ActivitiesScreen` com `activity=true`: `.game-shell`, `.game-progress` "Atividade N
  de M", `.game-illustration`, título e instrução, `.word-slots` (espaços da palavra; variante
  `--success` quando certa), `.letter-pool` (banco de letras), `.success-message` "Muito bem!" e
  "Tentar novamente" ([ficha ATV-04 da Entrega 2](../../entrega-2/BACKLOG.md#atv-04--tipos-de-atividade)).
- O que já existe no app: a casca (`ActivityEngine`: progresso "Atividade N de M" com
  `ProgressBar`, "Próxima"/"Concluir", tela final com `SuccessPanel`) e o `AudioPlayer`
  (`src/components/media/AudioPlayer.tsx`). O que muda: o corpo do jogo.
- **Lacuna:** neste refino, o conector Figma respondeu para o arquivo Make, mas só com links de
  recurso (`src/App.tsx` do Make), que a sessão não conseguiu abrir. O worker abre o código com
  `get_design_context` (`fileKey=L7sCNfMhrzOzhtlNpS3cHr`, `nodeId=0:1`) e lê o `App.tsx` antes de
  montar a tela; se não conseguir, segue este card e os tokens de `src/theme`.

Layout (de cima para baixo, dentro do `ScrollView` do motor):

1. imagem de dica (`content.hintImageUrl`), 180 de altura, `resizeMode="contain"`, borda
   `shape.radius.lg`; sem imagem, nada;
2. `AudioPlayer` com `content.hintAudioUrl`, se houver;
3. instrução (`task.prompt`) centralizada, estilo do `prompt` do `QuizActivity`;
4. linha de espaços (`.word-slots`): um quadrado por letra da palavra, 48 × 56, borda
   `color.brand[200]`; preenchido mostra a letra; com a palavra certa, todos ficam com o fundo
   e a borda de sucesso (`semanticColor` de sucesso usado pelo `SuccessPanel`);
5. banco de letras (`.letter-pool`): botões 48 × 48 em linhas que quebram (`flexWrap`), letra
   em Nunito ExtraBold 22; a letra usada some do banco (fica um espaço vazio do mesmo tamanho,
   para o banco não "pular");
6. mensagem: certo → `SuccessPanel` "Muito bem!"; errado → texto "Ainda não. Tente de novo." e
   o botão "Tentar novamente".

## 3. Fluxo do usuário

Entradas (nenhuma rota nova):

- **Banco → detalhe → "Jogar"**: `TaskDetailScreen` → `/activities/[id]` →
  `ActivityPlayScreen` → `ActivityEngine` com uma tarefa. Sem registro (G-35), com o aviso
  "Esta atividade não registra resultado." que já existe.
- **Sessão**: o player da sessão renderiza o jogo pelo registro (EVO-03, não nesta tarefa).

Passos:

1. O motor chama `renderActivity("wordBuilder", props)`; o componente monta o banco com as
   letras da palavra e os `distractors`, embaralhados.
2. A criança toca numa letra do banco: a letra vai para o **primeiro espaço vazio**.
3. Tocar num espaço preenchido devolve ao banco **essa letra e todas as seguintes**, na posição
   original de cada uma no banco.
4. Quando o último espaço é preenchido, o jogo confere:
   - certa: espaços em `--success`, "Muito bem!", `onGameResult` e depois `onSolved` (o motor
     mostra "Próxima"/"Concluir");
   - errada: "Ainda não. Tente de novo." e "Tentar novamente", que esvazia todos os espaços e
     devolve as letras ao banco (sem reembaralhar). Os espaços ficam bloqueados até o toque em
     "Tentar novamente".
5. Fim: o motor segue como hoje.

## 4. Estados

| Estado             | Comportamento                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carregando         | Do `ActivityPlayScreen` ("Carregando atividade"), já existe                                                                                                                     |
| Erro ao carregar   | Do `ActivityPlayScreen` ("Não foi possível carregar a atividade." / "Não encontrado"), já existe                                                                                |
| Conteúdo inválido  | `content` ausente, `kind` diferente de `wordBuilder` ou palavra vazia: texto "Esta atividade está incompleta." e `onSolved()` liberado para o motor seguir (sem `onGameResult`) |
| Imagem não carrega | `Image` com `onError` esconde a imagem; o jogo continua                                                                                                                         |
| Áudio falha        | Tratamento do `AudioPlayer` existente                                                                                                                                           |
| Offline            | O jogo não usa rede depois de carregado; imagem e áudio podem faltar (acima)                                                                                                    |
| Certo / errado     | §3, passo 4                                                                                                                                                                     |

## 5. Contrato de dados

Nenhum endpoint novo. Lê `Task.content` de `GET /task/:id` (já usado por `getTaskById` em
`src/api/endpoints/content.ts`, query key `["task", id]`).

Tipo (criado pela API-07 em `src/api/types.ts`; esta tarefa só usa):

```ts
interface WordBuilderContent {
  kind: "wordBuilder";
  word: string; // 2–12 letras, maiúsculas, acento permitido
  distractors?: string[]; // 0–6 letras
  hintImageUrl?: string;
  hintAudioUrl?: string;
}
```

**Contrato novo do motor** (esta tarefa cria em `src/features/activities/engine/types.ts`):

```ts
/** Resultado de um jogo (tipos que não são de múltipla escolha). */
export interface GameResult {
  completed: boolean; // chegou ao fim do jogo
  correct: boolean; // completou sem nenhum erro (regra do app, §6.6)
  attempts: number; // 1–50
  errors: number; // 0–50
  durationMs: number; // 0–3 600 000
}

export interface ActivityComponentProps {
  task: Task;
  onAttempt: (attempt: ActivityAttempt) => void; // só o quiz chama
  onSolved: () => void;
  /** Jogos chamam uma única vez, antes de `onSolved`. */
  onGameResult?: (result: GameResult) => void;
}
```

`ActivityEngine` ganha a prop opcional `onGameResult?: (task: Task, result: GameResult) => void`,
registrada uma vez por tarefa com o mesmo `recorded` que já protege o `onResult`. A contagem
"Você acertou N de M na primeira tentativa" passa a somar `result.correct` dos jogos.

## 6. Regras de negócio e casos de borda

1. **Letras como grafemas**: `Array.from(word.normalize("NFC"))`. "PÃO" tem 3 letras; "Ã" é uma
   letra. O app não remove acento nem troca maiúscula: compara exatamente.
2. **Aceite**: a palavra formada (`slots.join("")`) é igual a `word.normalize("NFC")`. Letras
   repetidas ("BANANA") são intercambiáveis: qualquer "A" serve em qualquer posição de "A".
3. **Banco**: letras da palavra + `distractors` (normalizados e em maiúsculas), cada uma com um
   id de ficha próprio (`tile-0`…); embaralhado pelo `shuffle(tiles, random)` de `engine/game/`,
   com `random` injetável (padrão `Math.random`). Se o embaralhamento produzir exatamente a ordem da palavra
   (e houver mais de uma letra distinta), embaralha de novo, até 5 vezes.
4. **Desfazer**: tocar no espaço `i` preenchido devolve as fichas de `i` até o fim. Tocar num
   espaço vazio não faz nada.
5. **Contagem**: `attempts` = número de palavras completas conferidas; `errors` = conferências
   erradas. Ao acertar: `completed: true`, `correct: errors === 0`. Valores acima de 50 são
   limitados a 50 (`clampGameResult`); `durationMs` vai da montagem do componente ao acerto,
   limitado a 3 600 000.
6. **`correct`** é definido pelo app (a especificação §3.2 diz "regra do jogo no app"): completou
   sem errar. O jogo não tem "pular": sair sem completar não gera resultado.
7. **Uma chamada**: `onGameResult` é chamado uma vez por montagem; o motor ignora repetidas.
8. Palavra com 1 letra ou mais de 12 (dado fora do contrato): joga normalmente; não valida.

## 7. Plano de implementação

1. `engine/types.ts`: acrescentar `GameResult` e `onGameResult?` (§5). Não mudar
   `ActivityAttempt`.
2. `engine/game/` (novo, reaproveitado pela ATV-04b):
   - `gameResult.ts`: `clampGameResult(input)` e `createGameTimer(now = Date.now)`
     (`start()`/`elapsed()`);
   - `shuffle.ts`: `shuffle(items, random = Math.random)` genérico (Fisher–Yates), usado pelo
     `buildTiles` e pela ATV-04b;
   - `GameHint.tsx`: imagem + `AudioPlayer` + instrução (itens 1–3 do §2);
   - `GameFeedback.tsx`: sucesso ("Muito bem!" com `SuccessPanel`) ou erro (texto + `DsButton`
     "Tentar novamente", `variant="secondary"`).
3. `engine/word-builder/`:
   - `wordBuilder.ts` (lógica pura): `toLetters`, `buildTiles(content, random)`,
     `placeTile(state, tileId)`, `undoFrom(state, slotIndex)`, `check(state)`;
   - `WordBuilderActivity.tsx`: o componente (`ActivityComponentProps`), com
     `StaticPressable` (`src/components/ds/StaticPressable.tsx`) para letras e espaços (G-44: no
     Expo Go o `style` em função do `Pressable` é descartado).
4. `engine/registry.ts`: `wordBuilder: WordBuilderActivity`; atualizar o comentário do registro.
5. `engine/ActivityEngine.tsx`: prop `onGameResult`, repassar `onGameResult` ao componente,
   registrar uma vez e somar `correct`.
6. Testes em `engine/word-builder/__tests__/` e `engine/__tests__/registry.test.ts` (acrescentar
   o tipo). Mock do `AudioPlayer`/`expo-audio` como nos testes existentes (armadilha do
   CONTEXTO-SESSAO §4).

Acessibilidade: letra do banco `accessibilityRole="button"`, rótulo "Letra A"; espaço
`accessibilityLabel` "Espaço 2 de 4, vazio" ou "Espaço 2 de 4, letra O" e `accessibilityHint`
"Toque para devolver esta letra e as seguintes"; alvos ≥ 44 (`hitSlopToMinTarget` de
`src/components/ds/touchTarget.ts` se o visual for menor); o resultado é anunciado com
`accessibilityRole="alert"`.

## 8. Arquivos

- **Permitidos:** `src/features/activities/engine/types.ts`,
  `src/features/activities/engine/ActivityEngine.tsx`,
  `src/features/activities/engine/registry.ts`, `src/features/activities/engine/game/**` (novo),
  `src/features/activities/engine/word-builder/**` (novo), `src/features/activities/engine/__tests__/**`.
- **Proibidos:** `src/api/**` e `src/mocks/**` (API-07), `src/features/sessions/**` (EVO-03),
  `src/features/activities/ActivitiesScreen.tsx` e o resto de `src/features/activities/**` (ATV-09),
  `QuizActivity.tsx` (sem mudança), `package.json`.

## 9. Critérios de aceite

| ID            | Critério                                                                                                    | Verif. |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| AC-ATV-04a-01 | A palavra só é aceita com as letras na ordem certa; acentos contam ("PAO" ≠ "PÃO"); letras repetidas trocam | `UT`   |
| AC-ATV-04a-02 | Tocar num espaço preenchido devolve ao banco a letra dele e as seguintes                                    | `CT`   |
| AC-ATV-04a-03 | Letras e espaços têm alvo ≥ 44 e rótulo acessível ("Letra A", "Espaço 2 de 4, vazio")                       | `CT`   |
| AC-ATV-04a-04 | Acertar depois de um erro chama `onGameResult` uma vez com `attempts: 2`, `errors: 1`, `correct: false`     | `UT`   |
| AC-ATV-04a-05 | `ActivityEngine` registra o resultado do jogo uma vez e o tipo desconhecido continua "indisponível"         | `REV`  |

## 10. Como testar manualmente (Victor)

Android, Expo Go, modo mock (`EXPO_PUBLIC_USE_MOCKS=true`, login do modo mock do
[CONTEXTO-SESSAO §5](../../CONTEXTO-SESSAO.md#5-rodar-o-app-quando-o-usuário-pedir)); depois da
leva 1, com o backend real.

1. Atividades → abra uma atividade "Forme a palavra" (no mock, "BOLA") → "Jogar".
2. Toque nas letras fora de ordem até completar: aparece "Ainda não. Tente de novo." → "Tentar
   novamente" limpa os espaços.
3. Toque em "B", "O", "L": toque no segundo espaço ("O"): "O" e "L" voltam ao banco.
4. Complete "BOLA": os espaços ficam verdes e aparece "Muito bem!" → "Concluir" → "Você acertou
   0 de 1 na primeira tentativa".
5. Repita sem errar: "1 de 1". Com uma palavra acentuada do mock ("PÃO"), confira que "A" não
   serve no lugar de "Ã".
6. TalkBack (opcional): as letras são lidas como "Letra B"; os espaços dizem "vazio".

## 11. Riscos e perguntas em aberto

- **G-64** (proposta): se o usuário reduzir os jogos, esta tarefa continua (é o jogo principal).
- **Forma real do `content`** (API-06): se o backend mudar nomes (`word`, `distractors`), o
  worker segue o contrato registrado; a lógica pura isola o impacto em `toLetters`/`buildTiles`.
- **`correct`**: a regra "sem erros" é do app; se o backend pedir outra semântica na API-06,
  muda só `gameResult.ts`.

## 12. Fora do escopo

Editor da atividade (ATV-11), envio do resultado na sessão (EVO-03), IA para gerar palavras,
validação de conteúdo (é do servidor), animações de arrastar (só toque).
