# Entrega 4 — Tracking

> Registro canônico do progresso da Entrega 4. O trabalho está no [BACKLOG](BACKLOG.md), e o
> plano e as decisões no [ROADMAP](ROADMAP.md). Atualize este arquivo a cada transição de
> tarefa (AGENTS §2). O histórico da Entrega 3 fica no
> [TRACKING da Entrega 3](../entrega-3/TRACKING.md).

## 0. Próximo passo global

Estado em 2026-11-12 (noite): **blocos A, B e C prontos com mocks; relatórios e notificações em andamento.** A especificação é o contrato provisório (G-29). Cada leva publicada pelo backend é conferida na API-04 e integrada. O roteiro de testes do colega está na issue #168, e o usuário autorizou merge com CI verde e pediu testes só essenciais.

| #   | Ação                                                                                                     | Responsável            | Condição de conclusão                     |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------- |
| 1   | ~~Decidir G-54 a G-60 e a E-10~~ (feito em 2026-11-12, pelo protótipo e pelos requisitos)                | Usuário                | Feito                                     |
| 2   | G-55: escolher as escalas do catálogo, com responsável clínico, fonte e licença                          | Usuário + equipe       | Lista de escalas enviada ao backend       |
| 3   | ~~Enviar a especificação ao backend~~ (enviada em 2026-11-12); avisar a mudança da EV-12 (G-57: só o PE) | Usuário                | Resposta registrada em PEDIDOS-BACKEND §4 |
| 4   | ~~Onda E4-0 e telas dos blocos A, B e C com mocks~~ (feito)                                              | Orquestrador → workers | PRs mergeados com CI verde                |
| 5   | A cada leva do backend: API-04, depois API-05, depois as telas                                           | Orquestrador → workers | Rotas registradas no PROJECT.md           |

## 1. Estados

`pronta` (dependências ok), `em andamento`, `bloqueada` (com motivo), `em revisão`,
`concluída` (aceite e verificações), `cancelada`.

## 2. Tarefas

| Tarefa                                    | Bloco | Onda         | Estado           | Bloqueio / próximo passo                                               | PR / evidência                  |
| ----------------------------------------- | ----- | ------------ | ---------------- | ---------------------------------------------------------------------- | ------------------------------- |
| API-04 Contrato no PROJECT.md             | A     | E4-0 e levas | em andamento     | Mocks pela especificação; conferir a cada leva publicada               | #153 (planos); a cada leva      |
| API-05 Tipos, leitura e mocks             | A     | E4-1 e levas | em andamento     | Mocks pela especificação; conferir a cada leva publicada               | #155, #160; leva 3 em andamento |
| FEC-05 Pendências da Entrega 3            | A     | E4-0         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #154                            |
| AUT-01 Recuperação de senha com código    | A     | E4-2         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #157                            |
| REC-03 Trocar senha no perfil             | A     | E4-2         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #159                            |
| EVO-01 Evolução da sessão                 | B     | E4-2         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #158                            |
| EVO-02 Prontuário e hub de evolução       | B     | E4-3         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #161                            |
| EVO-04 Sugestão para a próxima sessão     | B     | E4-7         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #165                            |
| EVO-05 Entradas para registrar a evolução | B     | E4-3         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #164                            |
| AVA-01 Hub de avaliações                  | C     | E4-4         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #162                            |
| AVA-02 Aplicar escala                     | C     | E4-5         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #163                            |
| AVA-03 Escore, insight e conclusão        | C     | E4-5         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #166                            |
| AVA-04 Resultado da aplicação             | C     | E4-6         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #167                            |
| AVA-05 Rascunhos                          | C     | E4-6         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #166                            |
| PAC-05 Ficha: Avaliações                  | C     | E4-6         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #169                            |
| PAC-09 Síntese da anamnese                | C     | E4-7         | concluída (mock) | Integrar quando o backend publicar a leva; teste do colega na #168     | #169                            |
| REL-01 Configurar relatório               | D     | E4-8         | bloqueada        | G-58; backend §6 (leva 4); API-05                                      | —                               |
| REL-02 Prévia, PDF e envio                | D     | E4-8         | bloqueada        | REL-01                                                                 | —                               |
| REL-03 Histórico de relatórios            | D     | E4-9         | bloqueada        | REL-02                                                                 | —                               |
| NOT-01 Notificações no app                | E     | E4-9         | bloqueada        | G-59; backend §7 (leva 5); API-05                                      | —                               |
| NAV-04 Recursos e atalhos                 | E     | E4-10        | bloqueada        | EVO-02, AVA-01, REL-03                                                 | —                               |
| QA-07 Plano de testes manuais             | F     | E4-0 / E4-11 | em andamento     | Esqueleto pronto; rodada depois do código, com autorização do emulador | #156 (esqueleto)                |
| QA-02 E2E com Maestro                     | F     | E4-11        | bloqueada        | QA-07; autorização para instalar o Maestro                             | —                               |
| QA-03 Acessibilidade                      | F     | E4-11        | bloqueada        | NAV-04; emulador                                                       | —                               |
| QA-04 Homologação em aparelhos            | F     | E4-12        | bloqueada        | Aparelho Android físico e Mac/iPhone                                   | —                               |

## 3. Herdado da Entrega 3

| Item                                       | Situação                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| S-01, S-03, S-06, S-07                     | Com o outro dev (issue #129); revisar e mergear os PRs quando chegarem                      |
| E-09, E-11, destaque da Início e da Agenda | Entram na FEC-05                                                                            |
| E-10 (contagem da Agenda)                  | Decidida em 2026-11-12: mantém a contagem atual                                             |
| S-02 (sugestão da IA igual à meta)         | Pedido ao backend (PP-02)                                                                   |
| QA-02, QA-03, QA-04                        | Passam para esta entrega, ampliados com as telas novas                                      |
| FEC-01                                     | Coberta na prática pelas rodadas no emulador da Entrega 3; o registro formal entra na QA-07 |
| PLN-00 (contrato de planos no PROJECT.md)  | Entra na API-04                                                                             |

## 4. Histórico

| Data       | Itens        | Registro                                                                                                                                    |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | Planejamento | Roadmap, backlog (25 tarefas), especificação para o backend, pedidos e tracking da Entrega 4; G-54 a G-60 propostos no GATES                |
| 2026-11-12 | Decisões     | Especificação enviada ao backend; G-54 a G-60 e E-10 decididos pelo protótipo e pelos requisitos (G-57: só o PE; EV-12 ajustada)            |
| 2026-11-12 | Blocos A–C   | FEC-05, AUT-01, REC-03, EVO-01/02/04/05, AVA-01 a 05, PAC-05/09 mergeados com mocks (#154–#169); issue #168 criada para o roteiro de testes |
