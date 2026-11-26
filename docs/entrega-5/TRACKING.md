# Entrega 5 — Tracking

> Registro canônico do progresso da Entrega 5. O trabalho está no [BACKLOG](BACKLOG.md), e o
> plano e as decisões no [ROADMAP](ROADMAP.md). Atualize este arquivo a cada transição de
> tarefa (AGENTS §2). O histórico da Entrega 4 fica no
> [TRACKING da Entrega 4](../entrega-4/TRACKING.md).
>
> Plano de execução: [PLANO](PLANO.md); detalhe de cada tarefa em `cards/<ID>.md`.

## 0. Próximo passo global

Estado em 2026-11-26: **o código das 25 tarefas está escrito** (mock-first, G-29). API-07 leva 1,
ATV-04a, ATV-04b e EVO-03 estão na `main`; o resto está **em revisão** em duas pilhas de PRs
(pilha A de atividades e pilha B principal), nenhuma mergeada, porque o backend ainda não
publicou as levas. O PR de integração `chore/e5-integracao` junta as duas pilhas para revisar e
testar tudo de uma vez. Ordem de revisão e de merge em [PILHAS](PILHAS.md); resumo em
[ENTREGA-5](ENTREGA-5.md).

| #   | Ação                                                                                                                      | Responsável            | Condição de conclusão                            |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------ |
| 1   | Revisar as pilhas pelo PR de integração e pelos PRs na ordem do [PILHAS](PILHAS.md)                                       | Usuário / revisor      | Revisão registrada nos PRs                       |
| 2   | Enviar o contrato ao backend ([CONTRATOS-BACKEND](CONTRATOS-BACKEND.md), PEDIDOS-BACKEND §3)                              | Usuário                | Resposta registrada no PEDIDOS-BACKEND §4        |
| 3   | Mergear o que não depende de rota nova: #194, #197, #198                                                                  | Usuário / orquestrador | Na `main` com CI verde                           |
| 4   | A cada leva publicada: API-06 e o merge dos PRs da leva ([PILHAS §5](PILHAS.md#5-como-mergear-quando-o-backend-publicar)) | Orquestrador → workers | Telas integradas ao contrato publicado           |
| 5   | Autorizar o development build (BLD-01), informar a conta Expo e rodar o `eas init`                                        | Usuário                | Build gerado e push testado em aparelho (NOT-02) |
| 6   | Rodada manual (QA-08), Maestro (QA-02), TalkBack (QA-03) e aparelhos (QA-04), com autorização do emulador                 | Usuário + orquestrador | Resultados no PLANO-TESTES §9                    |
| 7   | G-55: escala clínica real com o responsável clínico (dado do backend; o app não muda)                                     | Usuário + equipe       | Escala real publicada pelo backend               |

## 1. Estados

`pronta` (dependências ok), `em andamento`, `bloqueada` (com motivo), `em revisão`,
`concluída` (aceite e verificações), `cancelada`.

## 2. Tarefas

Pilha A: #195 → #196 → #199 → #201 → #202 → #204 → #217. Pilha B: #194 → #197 → #198 → #200 →
#203 → #205 → #206 → #207 → #208 → #209 → #210 → #211 → #212 → #213 → #214 → #215 → #216 → #218.
"MAN" = teste manual; "TB" = TalkBack; "DB" = development build.

| Tarefa                                    | Bloco | Onda         | Estado     | Bloqueio / próximo passo                                                            | PR / evidência    |
| ----------------------------------------- | ----- | ------------ | ---------- | ----------------------------------------------------------------------------------- | ----------------- |
| API-06 Contrato no PROJECT.md             | A     | levas        | bloqueada  | Nenhuma leva publicada; contrato pedido em #194 (CONTRATOS-BACKEND)                 | #194 (em revisão) |
| API-07 Tipos, leitura e mocks             | A     | E5-1/5/7/9   | em revisão | Leva 1 na `main`; levas 2 a 4 em revisão (mock-first); conferir cada leva na API-06 | #189 (main), #197 |
| FEC-06 Pendências das Entregas 3 e 4      | A     | E5-8         | em revisão | Não mergear antes da leva 3 (PP-05: `null` e `""`); MAN contra o backend real       | #201, #202        |
| ATV-09 Banco com formato e recomendação   | B     | E5-2         | em revisão | Não mergear antes da leva 1 (`/task/catalog`, `/task/skills`); MAN                  | #195, #202        |
| ATV-04a Forme a palavra                   | B     | E5-2         | em revisão | Na `main` (mock-first); falta integrar na leva 1 e o MAN                            | #190 (main), #217 |
| ATV-04b Associe as cores e Memória visual | B     | E5-3         | em revisão | Na `main` (mock-first); falta integrar na leva 1 e o MAN                            | #191 (main)       |
| ATV-11 Criar e editar os tipos novos      | B     | E5-3         | em revisão | Leva 1; AC-ATV-11-05 (criar e jogar cada tipo) só contra o backend real             | #199, #202        |
| ATV-05 Imprimíveis                        | B     | E5-4         | em revisão | Leva 1; AC-ATV-05-02 e imagens no PDF só em aparelho                                | #196, #202        |
| EVO-03 Atividade durante a sessão         | B     | E5-4         | em revisão | Na `main` (mock-first); falta integrar na leva 1 e o MAN                            | #192 (main)       |
| EQP-01 Equipe e convites                  | C     | E5-5         | em revisão | Leva 2; MAN (Share do convite)                                                      | #200, #206        |
| EQP-02 Permissões por papel               | C     | E5-6         | em revisão | Leva 2; MAN com as duas contas (ADMIN e PROFESSIONAL)                               | #205, #206        |
| EQP-03 Criar conta e entrar pelo convite  | C     | E5-5         | em revisão | Leva 2; MAN (cadastro novo e convite de uso único)                                  | #203, #206        |
| EQP-04 Paciente compartilhado             | C     | E5-6         | em revisão | Leva 2; AC-EQP-04-04 (autoria) só com o backend real e duas contas                  | #207, #211        |
| PAC-10 Status e pendências                | D     | E5-7         | em revisão | Leva 3 (`/student/overview`); MAN                                                   | #208              |
| PAC-11 Arquivar e reativar                | D     | E5-8         | em revisão | Leva 3; MAN                                                                         | #209, #211        |
| AGE-05 Visão mensal da agenda             | D     | E5-0         | em revisão | Não depende do backend; pode ir para a `main` (com #194 e #197); MAN do calendário  | #198, #206        |
| AGE-06 Atendimentos recorrentes           | D     | E5-7         | em revisão | Leva 3 (séries); MAN                                                                | #210              |
| BLD-01 Development build Android          | E     | E5-0         | em revisão | Conta Expo, `eas init`, `GOOGLE_SERVICES_JSON` e autorização do build (DB)          | #212, #215        |
| NOT-02 Push e preferências                | E     | E5-9         | em revisão | Leva 4; push real só em DB e aparelho; iOS na QA-04                                 | #213, #215        |
| AJD-01 Central de ajuda                   | E     | E5-9         | em revisão | Leva 4 e os vídeos; MAN da reprodução no Expo Go                                    | #214              |
| NAV-05 App sem "Em breve"                 | E     | E5-10        | em revisão | Mergear depois de EQP-01, AJD-01 e PAC-10 funcionarem contra o backend real         | #216              |
| QA-08 Plano de testes manuais             | F     | E5-0 / E5-11 | em revisão | Plano escrito; falta a rodada (mocks e backend real), com autorização do emulador   | #204              |
| QA-02 E2E com Maestro                     | F     | E5-11        | em revisão | Fluxos e `testID` escritos; falta autorizar a instalação do Maestro e rodar         | #204, #217, #218  |
| QA-03 Acessibilidade                      | F     | E5-11        | em revisão | Rótulos nas duas pilhas; falta a conferência com TB no emulador                     | #217, #218        |
| QA-04 Homologação em aparelhos            | F     | E5-12        | em revisão | Roteiro escrito; falta DB, Android físico e Mac/iPhone                              | #204              |

Integração das pilhas: `chore/e5-integracao` (base `feat/e5-qa-03-principal`), com typecheck,
lint, a suíte inteira (1796 testes em 276 arquivos, verde) e `npx expo export --platform android` com código 0. Nada foi observado em
emulador, aparelho ou development build.

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

| Data       | Itens                               | Registro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-24 | Planejamento                        | Roadmap, backlog (25 tarefas), especificação para o backend, pedidos e tracking da Entrega 5; G-61 a G-72 propostos no GATES, aguardando o usuário                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-24 | Refino A e B                        | Cards detalhados de API-06, API-07, FEC-06, ATV-09, ATV-04a, ATV-04b, ATV-11, ATV-05 e EVO-03 em `cards/`, e o [PLANO](PLANO.md) de execução (ondas, paralelismo, estimativas, marcos, política de merge e ajustes do refino); nenhuma implementação                                                                                                                                                                                                                                                                                          |
| 2026-11-25 | Gates e divisão                     | G-61 a G-72 resolvidos pelo usuário (propostas aceitas); PRs #186 e #187 mergeados; divisão do dia entre Victor (API-07 L1, ATV-04a, ATV-04b, EVO-03) e o colega (AGE-05, QA-08, ATV-09, ATV-05); API-07 L1 em andamento                                                                                                                                                                                                                                                                                                                      |
| 2026-11-25 | API-07 L1, ATV-04a, ATV-04b, EVO-03 | Parte do Victor mergeada na `main` com CI verde: #189 (API-07 L1), #190 (ATV-04a), #191 (ATV-04b), #192 (EVO-03, com revisão A do player). Vermelho antes da implementação registrado nos PRs (no #189 faltou o vermelho de `errors-e5-leva-1`). Validação só Vitest/RNTL; nada observado em emulador ou aparelho; Figma não consultado. Limitação da EVO-03: resultado de jogo pendente não bloqueia o encerramento (`FinishSessionScreen` fora do escopo)                                                                                   |
| 2026-11-26 | Pilhas A e B, integração            | Código das 25 tarefas em revisão em duas pilhas de PRs empilhados (A: #195, #196, #199, #201, #202, #204, #217; B: #194, #197, #198, #200, #203, #205 a #216, #218), nenhuma mergeada (levas do backend não publicadas). PR de integração `chore/e5-integracao` com as duas pilhas: conflitos só em `PatientDetailScreen` e `src/mocks/README.md`; a suíte inteira (1796 testes em 276 arquivos, verde). Documentos [ENTREGA-5](ENTREGA-5.md) e [PILHAS](PILHAS.md). Validação só Vitest/RNTL e bundle; nada em emulador, aparelho, DB ou iOS |
