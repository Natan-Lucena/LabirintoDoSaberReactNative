# QA-05 / INT-01: relatório do teste ponta a ponta contra o backend real

> Execução de 2026-10-09 pelo orquestrador (Claude Code), no emulador Android (AVD
> `Medium_Phone`) com **Expo Go**, `EXPO_PUBLIC_USE_MOCKS=false` e
> `EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app`, usando uma conta de teste
> criada para a execução. O código testado foi a branch local de integração (`main` +
> PRs #58 a #64 + correções #65 a #74). **iOS não foi testado.**

## 1. Resultado por tarefa

| Tarefa                  | Resultado | Observação                                                                                     |
| ----------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| EXPO-01                 | OK        | Reabrir o Expo Go mantém a sessão (volta direto ao Início)                                     |
| Login, NAV-01/02, DS-06 | OK        | Login só passou depois da correção #65; botão sem fundo corrigido em #66                       |
| HOME-01, REC-01         | OK        | Início com o nome real; Recursos com nome e e-mail reais                                       |
| PAC-01, PAC-02, PAC-03  | OK        | Cadastro, lista, busca e ficha; percentuais corrigidos em #67                                  |
| ATV-01, ATV-06          | OK        | Criar atividade manual e achar na busca                                                        |
| ATV-02, ATV-03          | OK        | Detalhe e motor ("Muito bem!", "acertou 1 de 1")                                               |
| ATV-07                  | OK        | Gerar com IA e salvar em lote (gera um grupo no backend)                                       |
| CNT-01                  | Parcial   | Criar caderno OK; editar e excluir caderno e grupo **não testados**                            |
| SES-01 a SES-04         | OK        | Iniciar, retomar, 10 respostas, encerrar com observação; lista em #71                          |
| REL-04                  | OK        | Tempos corrigidos em #68; "Enviar" corrigido em #70; "Imprimir" abre a pré-visualização do PDF |
| REL-05                  | Parcial   | Síntese e snapshot salvo OK; o histórico de snapshots **não foi verificado**                   |
| REL-06                  | OK        | Análise em Markdown, depois do timeout de 90 s (#69)                                           |
| ATV-08 (imagem e áudio) | OK        | Galeria e arquivo de áudio: upload e exibição validados. Câmera não testada                    |
| Agenda                  | n/a       | "Ainda não disponível nesta entrega" (previsto)                                                |

## 2. Rotas exercitadas pelo app contra o backend real

`POST /educator/sign-in`, `GET /educator/me`, `GET /student/`, `POST /student/create`,
`GET /task-notebook/`, `POST /task-notebook/create`, `GET /task/`, `GET /task/:id`,
`POST /task/create`, `POST /ai-task/generate`, `POST /task/batch`,
`POST /task-notebook-session/start`, `/answer` e `/finish`,
`GET /task-notebook-session/student/:id`, `GET /task-notebook-session/report/:id`,
`GET /task-notebook-session/analysis/student/:id` e `.../:id/ai`.

Pelo `curl` (fora do app): `POST /educator/register`.

**Não exercitadas:** `/appointment/*` (a Início carrega, sem agendamentos), `/task-group/*`,
`PUT /task-notebook/update`, `DELETE /task-notebook/delete/:id`, `PUT /task/update`,
`DELETE /task/delete/:id`, o histórico de snapshots da análise,
`GET /educator/get-last-sessions`, `/educator/update-password` e `/educator/generate-token`.
O Swagger público (`/api-docs/`) lista só 18 rotas e **não inclui** várias das rotas acima.
`GET /educator/me`, `/ai-task/generate` e `/task/batch` existem mesmo fora do Swagger.

## 3. Achados e correções (um PR por correção)

| Achado                                                                           | PR  |
| -------------------------------------------------------------------------------- | --- |
| Login: `GET /educator/me` ia sem token e dava 401 ("e-mail ou senha incorretos") | #65 |
| `DsButton` perdia fundo e largura no NativeWind (Expo Go)                        | #66 |
| `accuracy` é fração de 0 a 1, o app tratava como percentual (G-43)               | #67 |
| Médias do relatório da sessão vêm em milissegundos, o total em segundos (G-07)   | #68 |
| Análise com IA leva ~34 s e o cliente cancelava aos 10 s                         | #69 |
| "Enviar" PDF: o arquivo do `expo-print` não é legível no Expo Go                 | #70 |
| Ficha do paciente não atualizava as sessões ao encerrar uma                      | #71 |

## 4. Gates

| Gate | Situação                                                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-07 | **Resolvido pela evidência**: `totalTimeSession` em segundos; `averageTimePerQuestion`, `averageCorrectTime`, `averageIncorrectTime` e `timeToAnswer` em ms |
| G-43 | **Resolvido pela evidência**: `accuracy` das análises é fração de 0 a 1 (`0.8` para 8 de 10); `percentageBy*` do relatório da sessão é 0 a 100              |
| G-06 | **Aberto**: o backend não guarda o vínculo sessão ↔ caderno; o player usa o caderno escolhido no app (`resolveSessionTasks`), que funcionou                 |

## 5. Dados criados no backend de produção (conta de teste)

Um paciente, duas sessões, três ou mais atividades, um grupo e um caderno (`Caderno QA`).
Nenhum dado real de usuário foi usado. As credenciais da conta de teste não são registradas aqui.

## 6. O que falta para fechar INT-01 e QA-05

1. Mergear os PRs #58 a #64 e as correções #65 a #71 (ordem no corpo de cada PR).
2. Exercitar as rotas não exercitadas da seção 2, a câmera (ATV-08), CNT-01 (editar e excluir) e o histórico de snapshots.
3. Validar a Agenda e os agendamentos quando a tela existir.
4. Repetir no iOS.
5. Decidir o G-06 com o dono do backend.
