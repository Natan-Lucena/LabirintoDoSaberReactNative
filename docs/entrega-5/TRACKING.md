# Entrega 5 — Tracking

> Registro canônico do progresso da Entrega 5. O trabalho está no [BACKLOG](BACKLOG.md), e o
> plano e as decisões no [ROADMAP](ROADMAP.md). Atualize este arquivo a cada transição de
> tarefa (AGENTS §2). O histórico da Entrega 4 fica no
> [TRACKING da Entrega 4](../entrega-4/TRACKING.md).
>
> Plano de execução: [PLANO](PLANO.md); detalhe de cada tarefa em `cards/<ID>.md`.

## 0. Próximo passo global

Estado em 2026-11-25: **G-61 a G-72 resolvidos** pelo usuário (aceitou as propostas); refino
(#186, #187) na `main`. A especificação ainda não foi enviada ao backend. Divisão do dia com o
colega: Victor faz API-07 L1 → ATV-04a → ATV-04b (→ EVO-03); o colega faz AGE-05, QA-08
(esqueleto) e ATV-09 (rascunho) → ATV-05.

| #   | Ação                                                                                                       | Responsável            | Condição de conclusão                     |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------- |
| 1   | ~~Decidir G-61 a G-72~~ — resolvido em 2026-11-25 (GATES)                                                  | Usuário                | Decisões registradas no GATES             |
| 2   | Enviar a especificação ao backend ([PEDIDOS-BACKEND §3](PEDIDOS-BACKEND.md#3-mensagem-pronta-para-enviar)) | Usuário                | Resposta registrada no PEDIDOS-BACKEND §4 |
| 3   | Autorizar o development build (BLD-01) e informar a conta Expo                                             | Usuário                | Autorização registrada no histórico       |
| 4   | Onda E5-0: AGE-05 e o esqueleto da QA-08 (não dependem do backend nem dos gates de domínio)                | Orquestrador → workers | PRs mergeados com CI verde                |
| 5   | A cada leva do backend: API-06, API-07 e as telas da leva                                                  | Orquestrador → workers | Telas integradas ao contrato publicado    |
| 6   | G-55: escala clínica real com o responsável clínico (dado do backend; o app não muda)                      | Usuário + equipe       | Escala real publicada pelo backend        |

## 1. Estados

`pronta` (dependências ok), `em andamento`, `bloqueada` (com motivo), `em revisão`,
`concluída` (aceite e verificações), `cancelada`.

## 2. Tarefas

| Tarefa                                    | Bloco | Onda         | Estado    | Bloqueio / próximo passo                                                                                                          | PR / evidência     |
| ----------------------------------------- | ----- | ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| API-06 Contrato no PROJECT.md             | A     | levas        | bloqueada | Nenhuma leva publicada pelo backend                                                                                               | —                  |
| API-07 Tipos, leitura e mocks             | A     | E5-1/5/7/9   | bloqueada | Leva 1 na `main` (mock-first, Victor); levas 2 a 4 aguardam; leva 1 revisada na API-06                                            | #189 (1424 testes) |
| FEC-06 Pendências das Entregas 3 e 4      | A     | E5-8         | bloqueada | Backend PP-05 (leva 3)                                                                                                            | —                  |
| ATV-09 Banco com formato e recomendação   | B     | E5-2         | pronta    | API-07 L1 na `main`; colega (PR de rascunho até a leva 1)                                                                         | —                  |
| ATV-04a Forme a palavra                   | B     | E5-2         | bloqueada | Código na `main` (mock-first); falta integrar na leva 1 do backend e o teste manual (AC `MAN`)                                    | #190 (1458 testes) |
| ATV-04b Associe as cores e Memória visual | B     | E5-3         | bloqueada | Código na `main` (mock-first); falta integrar na leva 1 do backend e o teste manual (AC `MAN`)                                    | #191 (1504 testes) |
| ATV-11 Criar e editar os tipos novos      | B     | E5-3         | bloqueada | ATV-09; backend leva 1 (ATV-04a/b já na `main`)                                                                                   | —                  |
| ATV-05 Imprimíveis                        | B     | E5-4         | bloqueada | ATV-09 (colega)                                                                                                                   | —                  |
| EVO-03 Atividade durante a sessão         | B     | E5-4         | bloqueada | Código na `main` (mock-first); falta integrar na leva 1 do backend e o teste manual (AC `MAN`); revisão A feita pelo orquestrador | #192 (1561 testes) |
| EQP-01 Equipe e convites                  | C     | E5-5         | bloqueada | G-62, G-63; backend leva 2                                                                                                        | —                  |
| EQP-02 Permissões por papel               | C     | E5-6         | bloqueada | EQP-01                                                                                                                            | —                  |
| EQP-03 Criar conta e entrar pelo convite  | C     | E5-5         | bloqueada | G-63; backend leva 2                                                                                                              | —                  |
| EQP-04 Paciente compartilhado             | C     | E5-6         | bloqueada | G-62; EQP-01                                                                                                                      | —                  |
| PAC-10 Status e pendências                | D     | E5-7         | bloqueada | G-70; backend leva 3                                                                                                              | —                  |
| PAC-11 Arquivar e reativar                | D     | E5-8         | bloqueada | PAC-10                                                                                                                            | —                  |
| AGE-05 Visão mensal da agenda             | D     | E5-0         | pronta    | Colega; não depende do backend (`GET /appointment?from&to`)                                                                       | —                  |
| AGE-06 Atendimentos recorrentes           | D     | E5-7         | bloqueada | G-68; AGE-05; backend leva 3                                                                                                      | —                  |
| BLD-01 Development build Android          | E     | E5-0         | bloqueada | G-67; autorização do usuário para build nativo; conta Expo                                                                        | —                  |
| NOT-02 Push e preferências                | E     | E5-9         | bloqueada | BLD-01; backend leva 4                                                                                                            | —                  |
| AJD-01 Central de ajuda                   | E     | E5-9         | bloqueada | G-69; backend leva 4; conteúdo (vídeos)                                                                                           | —                  |
| NAV-05 App sem "Em breve"                 | E     | E5-10        | bloqueada | EQP-01, AJD-01, PAC-10                                                                                                            | —                  |
| QA-08 Plano de testes manuais             | F     | E5-0 / E5-11 | pronta    | Esqueleto já; rodada depois do código, com autorização do emulador                                                                | —                  |
| QA-02 E2E com Maestro                     | F     | E5-11        | bloqueada | QA-08; autorização para instalar o Maestro                                                                                        | —                  |
| QA-03 Acessibilidade                      | F     | E5-11        | bloqueada | NAV-05; emulador                                                                                                                  | —                  |
| QA-04 Homologação em aparelhos            | F     | E5-12        | bloqueada | BLD-01; aparelho Android físico e Mac/iPhone                                                                                      | —                  |

## 3. Herdado da Entrega 4

| Item                                                                     | Situação                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| QA-02, QA-03, QA-04                                                      | Passam para esta entrega, ampliadas com as telas novas             |
| RP-02 (nome do paciente no relatório da escola)                          | Proposta G-71; pedido ao backend (PP-06)                           |
| Repetição diária das notificações                                        | Proposta G-72; pedido ao backend (PP-07)                           |
| `timeToAnswer` antigo, em segundos                                       | Pedido ao backend (PP-08)                                          |
| Escala clínica real (G-55)                                               | Depende do responsável clínico; entra como dado, sem tarefa no app |
| Limpar responsável, próxima revisão, notas do plano e mídia da atividade | FEC-06, depois do PP-05                                            |
| Defeitos da issue #168 ainda abertos (se houver)                         | Entram na FEC-06                                                   |

## 4. Histórico

| Data       | Itens                               | Registro                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | Planejamento                        | Roadmap, backlog (25 tarefas), especificação para o backend, pedidos e tracking da Entrega 5; G-61 a G-72 propostos no GATES, aguardando o usuário                                                                                                                                                                                                                                                                                                          |
| 2026-11-24 | Refino A e B                        | Cards detalhados de API-06, API-07, FEC-06, ATV-09, ATV-04a, ATV-04b, ATV-11, ATV-05 e EVO-03 em `cards/`, e o [PLANO](PLANO.md) de execução (ondas, paralelismo, estimativas, marcos, política de merge e ajustes do refino); nenhuma implementação                                                                                                                                                                                                        |
| 2026-11-25 | Gates e divisão                     | G-61 a G-72 resolvidos pelo usuário (propostas aceitas); PRs #186 e #187 mergeados; divisão do dia entre Victor (API-07 L1, ATV-04a, ATV-04b, EVO-03) e o colega (AGE-05, QA-08, ATV-09, ATV-05); API-07 L1 em andamento                                                                                                                                                                                                                                    |
| 2026-11-25 | API-07 L1, ATV-04a, ATV-04b, EVO-03 | Parte do Victor mergeada na `main` com CI verde: #189 (API-07 L1), #190 (ATV-04a), #191 (ATV-04b), #192 (EVO-03, com revisão A do player). Vermelho antes da implementação registrado nos PRs (no #189 faltou o vermelho de `errors-e5-leva-1`). Validação só Vitest/RNTL; nada observado em emulador ou aparelho; Figma não consultado. Limitação da EVO-03: resultado de jogo pendente não bloqueia o encerramento (`FinishSessionScreen` fora do escopo) |
