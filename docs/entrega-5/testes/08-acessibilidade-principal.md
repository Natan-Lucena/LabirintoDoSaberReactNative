# 08 — Acessibilidade da pilha principal (QA-03, parte estática)

Auditoria **estática** (leitura do código) das telas da Entrega 5 da pilha principal, com as
correções pequenas feitas no PR "acessibilidade e testIDs da pilha principal (QA-03, QA-02)".
Não substitui o teste com TalkBack real (card [QA-03](../cards/QA-03.md)); a coluna
"Pendente" lista o que só um aparelho confirma. Os jogos ficam na pilha de atividades.

Legenda: OK = já estava certo; CORRIGIDO = ajustado neste PR; PENDENTE = exige TalkBack/aparelho.

## Tabela tela × item × situação

| Tela                                | Item                                                                                        | Situação                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Agenda (semana)                     | Chips de dia: `role=button`, rótulo "Hoje, 5 de maio", `selected`                           | OK                                                                        |
| Agenda (semana)                     | Setas "Semana anterior/Próxima semana" com rótulo e alvo ≥ 44                               | OK                                                                        |
| Agenda (semana)                     | Cartão de atendimento lê hora, nome, detalhes, "repete", Concluído/Cancelado                | OK (estado não depende só de cor)                                         |
| Agenda                              | Segmento Semana/Mês (`radio` + `selected`)                                                  | OK; CORRIGIDO: o grupo agora é `radiogroup`                               |
| Agenda (mês)                        | Dia: "N de mês, K agendamentos", `selected`, alvo 44                                        | OK; CORRIGIDO: o dia atual agora diz ", hoje"                             |
| Agenda (mês)                        | Título do mês                                                                               | CORRIGIDO: `header` e região viva (anuncia ao trocar de mês)              |
| Agenda (mês)                        | Setas "Mês anterior/Próximo mês" (o texto "‹ ›" não é lido, vale o rótulo)                  | OK                                                                        |
| Agenda (mês)                        | Ponto de "tem atendimento"                                                                  | OK (oculto ao leitor; a contagem está no rótulo, não só a cor)            |
| Formulário de atendimento           | "Repetir": segmentos com `selected`; "Quantas vezes" com dica de limite e erro              | OK; CORRIGIDO: `radiogroup`                                               |
| Formulário de atendimento           | Prévia da série em texto (não só visual)                                                    | OK                                                                        |
| Série: aviso de pulados             | Vários "Ver atendimento" idênticos                                                          | CORRIGIDO: "Ver atendimento de <data>"                                    |
| Série: escopo (só este / seguintes) | Título do diálogo                                                                           | CORRIGIDO: `header`                                                       |
| Equipe                              | Código do convite soletrado ("A B 3 K…")                                                    | OK                                                                        |
| Equipe                              | Papel do convidado (segmento), "Gerenciar <nome>", "Revogar o convite <cód>"                | OK                                                                        |
| Equipe                              | Diálogos de confirmação e menu do membro                                                    | CORRIGIDO: título com `header`                                            |
| Equipe                              | Estado "Ativo" e papéis em texto (não só cor)                                               | OK                                                                        |
| Convite/cadastro/entrar na equipe   | Campos com rótulo, erro com `alert` (componente `Field`)                                    | OK                                                                        |
| Quem acompanha / compartilhar       | Vários "Remover acesso" idênticos                                                           | CORRIGIDO: "Remover acesso de <nome>"                                     |
| Quem acompanha / compartilhar       | Linhas do seletor "Compartilhar com <nome>", alvo ≥ 44                                      | OK; título do diálogo CORRIGIDO (`header`)                                |
| Pendências (ficha)                  | Linha `button` com dica "Toque para abrir"; título `header`                                 | OK                                                                        |
| Lista de pacientes                  | Cartão lia só "Abrir ficha de <nome>" (perdia status, "Compartilhado", próximo atendimento) | CORRIGIDO: o resto vai em `accessibilityHint`; rótulo igual ao do Maestro |
| Lista de pacientes                  | Filtros (chips): `button` + `selected`, alvo 49                                             | OK                                                                        |
| Ficha: arquivar/reativar            | "Arquivar paciente", "Reativar paciente" com texto; faixa de arquivado (`summary`)          | OK; diálogo de arquivar CORRIGIDO (título `header`)                       |
| Preferências de notificação         | `Switch` com rótulo = título da linha e estado `checked`                                    | OK                                                                        |
| Preferências de notificação         | Alvo do `Switch` era 44×26                                                                  | CORRIGIDO: `hitSlop` leva a 44 de altura                                  |
| Preferências de notificação         | Permissão do aparelho em texto ("Permitidas/Bloqueadas")                                    | OK                                                                        |
| Central de ajuda / vídeo            | Linhas "Tutorial N: título, X minutos", destaque, vídeo "Vídeo: título"                     | OK                                                                        |
| Recursos                            | Atalho "Perfil" e linhas com rótulo/dica                                                    | OK                                                                        |

## testIDs para o Maestro (QA-02)

`DsButton` e `Field` repassam `testID` (idêntico ao PR #217; `StaticPressable` já repassa via `...props`).
`SegmentedControl` aceita `testID` por opção. IDs: `agenda-view-week`, `agenda-view-month`,
`calendar-day-AAAA-MM-DD`, `team-create`, `team-name`, `team-create-submit`, `patient-archive`,
`patient-archive-confirm`. Os YAML atuais usam texto, então os IDs ficam como alternativa estável.

## Pendente: exige TalkBack real (Victor, com autorização do emulador/aparelho)

1. Ordem de leitura de cada tela e foco ao abrir/fechar `Modal` (diálogos de equipe, arquivar, compartilhar, escopo da série).
2. Anúncio do título do mês ao trocar de mês e dos 42 dias do calendário (verbosidade do `react-native-calendars`).
3. Anúncio do `radiogroup` e do `selected` nos segmentos, e do `Switch` ("ligado/desligado").
4. Leitura do `accessibilityHint` do cartão de paciente (alguns TalkBack leem a dica só após pausa).
5. Fonte "Maior" + exibição grande: texto cortado em chips, segmentos, cartão do convite e diálogos.
6. Contraste real dos textos secundários (`ink[600]` sobre superfície) e do selo "Compartilhado".
7. Player de vídeo da Central de ajuda com TalkBack (controles nativos do `expo-video`).
8. VoiceOver (iOS): sem aparelho, fica na QA-04.

## Verificações

`pnpm run typecheck`, `pnpm run lint`, testes tocados e `python scripts/check-docs.py`: ver o PR.
