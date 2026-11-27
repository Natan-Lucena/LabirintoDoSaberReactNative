# Acessibilidade (QA-03, Entrega 5): auditoria estática da pilha de atividades

Card: [QA-03](../cards/QA-03.md). Roteiro base: [Entrega 3](../../entrega-3/testes/07-acessibilidade-qa03.md).

> **Estado (2026-11-26): auditoria estática feita sobre o código; TalkBack real pendente.** Nada
> foi observado em aparelho ou emulador. Os itens marcados "TalkBack" precisam de outro dev com
> Android e leitor de tela ligado. AC-QA-03-01 segue **aberto**.

Legenda: OK = já atendia; CORRIGIDO = ajustado neste PR; TALKBACK = só se confirma ouvindo;
FORA = tela de outra pilha (não auditada aqui).

## 1. Tabela tela x item

| Tela / componente                                             | Item                                                                                         | Situação                                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Login (`LoginForm`)                                           | `testID` `login-email`, `login-password`, `login-submit`                                     | CORRIGIDO (QA-02)                                                                          |
| `ActivitiesScreen`                                            | "Tentar novamente" com papel e alvo 44                                                       | OK                                                                                         |
| `ActivitiesScreen`                                            | Chip "Para: {nome}" com 36 de altura                                                         | CORRIGIDO (`hitSlop` leva a 44)                                                            |
| `ActivitiesScreen`                                            | FAB "Criar" com rótulo                                                                       | OK                                                                                         |
| `CreateContentSheet`                                          | Fundo era um botão único "Fechar" envolvendo as opções (o TalkBack não alcançaria as opções) | CORRIGIDO (fundo fora da árvore de acessibilidade; botão "Fechar" explícito)               |
| `CatalogListScreen`, `CatalogSection`                         | Estados vazio/erro com `alert`; título como cabeçalho                                        | OK                                                                                         |
| `CatalogTaskCard`, `ActivityCard`                             | Rótulo = título; habilidade e formato ficavam sem leitura                                    | CORRIGIDO (`accessibilityHint` com "habilidade · formato"); `testID` `activity-card-<id>`  |
| `CatalogTaskCard`                                             | Formato (Interativa/Imprimível) só por ícone                                                 | OK (o texto da metadata traz o formato; o ícone é decorativo)                              |
| `Pagination`                                                  | Itens de 32 sem `hitSlop`                                                                    | CORRIGIDO (`hitSlop` 6, alvo 44)                                                           |
| `Pagination`                                                  | Anterior/Próxima sem estado desativado; papel `tablist` indevido                             | CORRIGIDO (`accessibilityState.disabled`; `tablist` removido)                              |
| `Pagination`                                                  | Página atual: `selected` + fundo                                                             | OK (estado anunciado; o fundo não é a única pista)                                         |
| `CatalogFilters` (`SearchField`, `FilterRow`, `SelectField`)  | Rótulos e estados do DS                                                                      | OK (componentes do DS já auditados na QA-03 da Entrega 3)                                  |
| `RecommendedCard`                                             | Botão "Iniciar atividade" (`DsButton`, 44)                                                   | OK                                                                                         |
| `TaskDetailScreen`                                            | Alternativa correta: ícone + selo "Correta" (texto)                                          | OK (a cor não é a única pista)                                                             |
| `TaskDetailScreen`                                            | Imagem com `accessibilityLabel`; player de áudio                                             | OK; leitura do player: TALKBACK                                                            |
| `PrintableScreen` / `PrintablePreview`                        | Imagens dos itens sem rótulo                                                                 | CORRIGIDO ("Imagem do item N")                                                             |
| `PrintableScreen`                                             | Estados com `alert`                                                                          | OK                                                                                         |
| Editor: `ActivityTypeChooser`                                 | Quatro botões `DsButton` com descrição abaixo                                                | OK                                                                                         |
| Editor: `ColorMatchFields`                                    | Amostras 44, rótulo "Cor {nome} do par N", `selected`, borda 4 px na escolhida               | OK (a cor tem nome; seleção por borda + estado)                                            |
| Editor: `PrintableFields`, `ActivityTypeForm`                 | `SegmentedControl` com `radio`, `selected` e rótulo do grupo                                 | OK                                                                                         |
| Editor: `MemoryGameFields`, `WordBuilderFields`, `MediaSlots` | Imagem atual com rótulo; campos com rótulo                                                   | OK; seletor de imagem do sistema: TALKBACK                                                 |
| Jogo "Forme a palavra"                                        | "Letra A"; "Espaço 2 de 4, letra A / vazio"; desativado ao travar; alvo 48                   | OK; `testID` `word-tile-<n>`, `word-slot-<n>` (QA-02); completar só com TalkBack: TALKBACK |
| Jogo "Associe as cores"                                       | "Palavra X", "Cor {nome}", "par certo"; `selected`; par certo tem ícone de check             | OK; ver pendência 2                                                                        |
| Jogo "Memória visual"                                         | "Carta N, virada para baixo" / "Carta N: figura"; fallback de texto; alvo mínimo             | OK; terminar só com TalkBack: TALKBACK                                                     |
| Jogos: feedback ("Muito bem!", "Ainda não")                   | `alert` e texto; botão "Tentar novamente"                                                    | OK; anúncio automático: TALKBACK                                                           |
| `PlanDetailScreen`                                            | Progresso com rótulo "Progresso do plano: N%"; erros com `alert`                             | OK (partes da FEC-06 sem controle novo)                                                    |
| `PatientFormScreen`                                           | Todos os campos com rótulo; gênero em `SegmentedControl`                                     | OK                                                                                         |
| `NewTaskScreen`                                               | `Checkbox` (`checked`/`disabled`) e botões "Remover/Adicionar alternativa"                   | OK                                                                                         |
| `Checkbox` (DS)                                               | Altura mínima 43 (1 dp abaixo de 44)                                                         | Pendente, não bloqueante: ajuste no DS em PR próprio (afeta outras telas)                  |
| Preferências de notificação, Equipe, Agenda mês, Ajuda        | Fora desta pilha                                                                             | FORA (auditar na pilha correspondente)                                                     |

## 2. Pendências e observações

1. **TalkBack real** em todos os itens marcados, principalmente os três jogos e o
   `CreateContentSheet` (confirmar que as opções são alcançáveis e que "Fechar" vem por último).
2. "Associe as cores": a palavra escolhida muda a cor da borda. O estado `selected` é anunciado,
   mas, para quem enxerga e não distingue cores, vale um sinal extra (espessura ou ícone).
   Avaliar com o Victor; não bloqueante.
3. Contraste: só tokens existentes (`ink`, `brand`, `success`, `warning`). Não foi medido o
   contraste de `warning` sobre branco nos avisos dos jogos; conferir com fonte grande.
4. Fonte grande (escala do sistema) e capturas: só em aparelho; evidências ficam fora do repositório.
5. VoiceOver (iOS): fora do escopo (sem iPhone).

## 3. Como testar (TalkBack)

Android com TalkBack e fonte "Maior"; `EXPO_PUBLIC_USE_MOCKS=true pnpm start`; Expo Go.

1. Recursos, Banco de atividades: percorrer os cartões (cada um lê o título e, depois, "habilidade
   · formato"); usar a paginação (anterior desativada na primeira página).
2. Botão "Criar": a folha anuncia as opções e o "Fechar"; fechar por ele.
3. Abrir "BOLA" > Jogar: completar com os gestos do TalkBack; conferir "Letra B", "Espaço 1 de 4,
   vazio" e o "Muito bem!".
4. Repetir em "Associe as cores" e "Memória visual".
5. Registrar problemas: tela, elemento, o que o leitor disse, o esperado.

## 4. Mudanças de código deste PR

`DsButton` e `Field` repassam `testID` (`StaticPressable` já repassava por `...props`); `testID`s
do fluxo Maestro 01; correções da tabela acima. Teste: `src/components/ds/__tests__/testid.test.tsx`.
