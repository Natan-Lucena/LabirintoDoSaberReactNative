# Entrega 2 (marco V1): o que foi feito

> Resumo consolidado da V1, escrito em 2026-10-09. O registro canônico do progresso continua
> sendo o [TRACKING](TRACKING.md); os resultados do teste no app estão em
> [QA-05-RELATORIO](QA-05-RELATORIO.md). As decisões estão em
> [GATES](../entrega-1/GATES.md) (G-38 a G-46).

## 1. Resumo

- As **30 tarefas** da lista da V1 (Base, Telas principais, Atividades, Sessão, Relatórios e
  Fechamento) estão implementadas.
- Elas estão reunidas na branch **`integracao/v1-entrega-2`**: a `main` (21 tarefas já
  mergeadas) mais os PRs #58 a #74, que ainda **não foram mergeados** na `main` do repositório.
- A branch passa em `pnpm run typecheck`, `pnpm run lint`, `pnpm run test` (**763 testes**) e
  `python scripts/check-docs.py`, todos com código 0.
- O app foi testado **no emulador Android (Expo Go), com o backend real e os mocks desligados**,
  usando uma conta de teste. **iOS, aparelho físico e câmera não foram testados.**
- INT-01 e QA-05 ficam **parciais** (seção 5).

## 2. As 30 tarefas

"Na `main`" quer dizer que o código já estava mergeado; "PR #n" que só existe no PR indicado
e na branch de integração. "Validada" quer dizer testada no emulador contra o backend real.

| Tarefa                          | Origem | Estado                  | Observação                                                                           |
| ------------------------------- | ------ | ----------------------- | ------------------------------------------------------------------------------------ |
| EXPO-01 Expo Go                 | `main` | Validada                | A sessão persiste ao reabrir o app (SQLite criptografado)                            |
| DS-01 a DS-05 Design system     | `main` | Validada                | Correções de layout no Expo Go: PR #66, #73 e #74 (G-44)                             |
| DS-06 Login e estados           | `main` | Validada                | Login só funciona contra o backend real com o PR #65                                 |
| NAV-01 Abas / NAV-02 Cabeçalho  | `main` | Validada                | Barra inferior corrigida no PR #73. Agenda mostra "em breve"                         |
| HOME-01 Início                  | `main` | Validada                | Agendamentos não testados (a conta de teste não tem agenda)                          |
| REC-01 Recursos                 | `main` | Validada                | Itens sem API levam a "em breve"                                                     |
| PAC-01 Lista / PAC-02 Cadastro  | `main` | Validada                | Paciente criado e listado no backend real                                            |
| PAC-03 Ficha                    | `main` | Validada                | Percentuais corrigidos no PR #67                                                     |
| ATV-08 Upload de imagem e áudio | `main` | Validada                | Seletores, upload e exibição. Câmera não testada                                     |
| ATV-06 Criar e editar atividade | `main` | Validada                | Criar com imagem e áudio. Salvar uma edição não foi exercitado                       |
| ATV-07 Atividades com IA        | `main` | Validada                | Gerar, revisar e salvar em lote (cria um grupo)                                      |
| ATV-01 Banco de atividades      | `main` | Validada                | Busca e filtros                                                                      |
| ATV-02 Detalhe da atividade     | PR #60 | Validada, visual antigo | O detalhe ainda usa o visual da Entrega 1 (cabeçalho "Abrir menu")                   |
| ATV-03 Motor do player          | PR #60 | Validada                | Atividade com imagem e áudio, acerto e resultado                                     |
| CNT-01 Cadernos e grupos        | `main` | Parcial                 | Criar caderno validado. Editar e excluir só abertos; excluir foi cancelado           |
| SES-01 Iniciar sessão           | `main` | Validada                | Paciente, nome e caderno                                                             |
| SES-02 Player da sessão         | PR #58 | Validada                | Envia as respostas ao backend                                                        |
| SES-03 Retomada                 | PR #63 | Validada                |                                                                                      |
| SES-04 Encerrar e registro      | PR #61 | Validada                | Atualiza a ficha do paciente (PR #71)                                                |
| REL-04 Relatório da sessão      | PR #59 | Validada                | Tempos (PR #68) e envio do PDF (PR #70) corrigidos. Imprimir abre a pré-visualização |
| REL-05 Relatórios do aluno      | PR #62 | Validada                | Síntese e snapshot salvo. O histórico de snapshots não foi verificado                |
| REL-06 Análise com IA           | PR #64 | Validada                | Leva 30 a 45 s (PR #69). Uma geração falhou no backend e a seguinte funcionou        |
| INT-01 Integração real          | n/a    | Parcial                 | 17 rotas exercitadas pelo app (seção 5 do QA)                                        |
| QA-05 Teste ponta a ponta       | n/a    | Parcial                 | Só Android                                                                           |

## 3. PRs e ordem

Todos foram abertos a partir de um fork (`VictorVeras7`) contra
`Natan-Lucena/LabirintoDoSaberReactNative`. Vários **empilham** sobre outros: o diff deles inclui
os commits dos PRs anteriores.

| PR  | Conteúdo                                       | Depende de                                        |
| --- | ---------------------------------------------- | ------------------------------------------------- |
| #58 | SES-02 player da sessão                        | `main` (está com conflito: precisa de rebase)     |
| #60 | ATV-02 e ATV-03                                | #58                                               |
| #61 | SES-04 encerrar sessão                         | #58                                               |
| #63 | SES-03 retomada                                | #58, #61                                          |
| #59 | REL-04 relatório da sessão                     | `main`                                            |
| #62 | REL-05 relatórios do aluno                     | #59                                               |
| #64 | REL-06 análise com IA                          | #59, #62                                          |
| #65 | Token no `/educator/me` (login)                | `main`                                            |
| #66 | `DsButton` com estilo estático                 | `main`                                            |
| #74 | Rótulo do botão truncado                       | #66                                               |
| #73 | `StaticPressable` (barra, filtros, FAB, lista) | `main`                                            |
| #67 | `accuracy` em fração (G-43)                    | #59, #62 (conflita com #64 em `studentReport.ts`) |
| #68 | Tempos em ms (G-07)                            | #59                                               |
| #69 | Timeout de 90 s da IA                          | #59, #62, #64                                     |
| #70 | Enviar PDF no Expo Go                          | #59, #62, #64                                     |
| #71 | Atualizar a ficha ao encerrar a sessão         | #58, #61                                          |
| #72 | Relatório QA-05 e gates (docs)                 | `main`                                            |

**Caminho recomendado:** mergear a branch `integracao/v1-entrega-2` de uma vez (um PR só), com
"Create a merge commit", e fechar #58 a #74 como substituídos. A alternativa é mergear um a um na
ordem acima, com merge commit (não squash, por causa das pilhas), rodando `gh pr update-branch`
e esperando o CI entre cada um.

## 4. O que foi encontrado e corrigido no teste contra o backend real

| Achado                                                                                                                             | Correção                                    | PR  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --- |
| Login dava "e-mail ou senha incorretos": `GET /educator/me` ia sem token (os mocks não exigem token)                               | `getMe(token)` recebe o token recém-emitido | #65 |
| Botão primário sem fundo, sem largura e com texto branco ilegível (Expo Go)                                                        | `DsButton` com estilo estático              | #66 |
| Rótulo "Entrar ag…" depois de um erro de login                                                                                     | Spinner fora do fluxo e rótulo remontado    | #74 |
| Barra inferior espremida, cartão de paciente sem layout, filtros sem pílula, botão "+" invisível, título colado na barra de status | `StaticPressable` e área segura no topo     | #73 |
| "1% de acerto" para 8 de 10: `accuracy` é fração de 0 a 1 (G-43)                                                                   | `accuracyToPercent` e mock em fração        | #67 |
| "Tempo médio por questão: 113 min": as médias vêm em ms e o total em segundos (G-07)                                               | `formatAnswerDuration`                      | #68 |
| Análise com IA falhava: ~34 s no backend contra 10 s de timeout                                                                    | `AI_TIMEOUT_MS` de 90 s nas rotas de IA     | #69 |
| "Enviar" PDF falhava no Expo Go                                                                                                    | PDF em base64 regravado no cache do app     | #70 |
| A ficha do paciente não mostrava a sessão recém-encerrada                                                                          | Invalidação das consultas ao encerrar       | #71 |

Achados **sem correção** (registrados): o detalhe de um grupo criado por outro educador mostra
"Não encontrado"; a tela de detalhe de atividade mantém o visual da Entrega 1; o backend
oscilou uma vez na geração da análise com IA.

## 5. INT-01 e QA-05: o que ficou de fora

- **Rotas exercitadas pelo app:** login, `/educator/me`, pacientes, cadernos, atividades
  (listar, detalhar, criar, IA, lote), sessão (iniciar, responder, encerrar, listar), relatório da
  sessão e análise do aluno (síntese e IA), snapshot de relatório.
- **Não exercitadas:** `/appointment/*`, `/task-group/*`, atualizar e excluir caderno,
  atividade e grupo, `POST /task/upload-media` sem mídia, recuperação de senha e
  `GET /educator/get-last-sessions`.
- O Swagger público do backend lista só 18 rotas e não inclui várias que o app usa e que existem
  (ver P6 em [PERGUNTAS-BACKEND](../entrega-1/PERGUNTAS-BACKEND.md)).
- Os **mocks continuam ligados por padrão em desenvolvimento** (`EXPO_PUBLIC_USE_MOCKS`
  ausente = `true`); a integração real exige `EXPO_PUBLIC_USE_MOCKS=false` e
  `EXPO_PUBLIC_API_BASE_URL` apontando para o backend.
- **G-06** (vínculo sessão ↔ caderno) segue aberto: o backend não guarda o vínculo e o player
  usa o caderno escolhido no app.
- **iOS, aparelho físico (câmera e áudio nativo)** e a comparação visual pixel a pixel com o
  Figma Make **não foram feitos** (o Figma exige login e o conector não estava disponível).

## 6. Como rodar

```bash
pnpm install --frozen-lockfile
# .env (não versionado):
#   EXPO_PUBLIC_APP_ENV=development
#   EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
#   EXPO_PUBLIC_USE_MOCKS=false
pnpm start --clear
```

- Android: abra o emulador (Android Studio) e aperte `a` no terminal, ou leia o QR com o Expo Go.
- Com `EXPO_PUBLIC_USE_MOCKS=true`, o login fictício é `educadora.mock@labirinto.test` e
  `senha123`. Contra o backend real, use uma conta existente ou crie uma com
  `POST /educator/register`. Foi criada uma conta de teste (`teste.victor.lds@exemplo.com`);
  a senha **não** é registrada aqui.
- Ao trocar de branch, rode `pnpm install --frozen-lockfile` de novo e **reinicie o Metro com
  `--clear`**: ele não percebeu algumas edições de arquivo durante o teste.
- Se o typecheck acusar erro de rota (`Argument of type 'string' is not assignable…`), apague
  `.expo/types`: é um arquivo gerado pelo Metro de outra branch.

## 7. Evidências

- **70 capturas** do emulador, organizadas por tarefa e numeradas, com legenda: pasta local
  `prints-entrega-2` (índice no `LEIAME.md`) e página "Evidências" no Notion (privada, no
  workspace de quem gerou). As imagens não estão versionadas no repositório (pesam vários MB).
- Dados criados no backend de produção pela conta de teste: um paciente, três sessões, quatro
  ou mais atividades, um grupo, um caderno e um snapshot de relatório. Nenhum dado real de
  usuários foi usado.

## 8. Alterações de dependências

- `expo-file-system ~57.0.7` passou a dependência direta (G-45; já constava como bundled no
  Expo Go).
- `expo-print`, `expo-sharing` (REL-04) e `react-native-markdown-display` (REL-06, G-40) entraram
  pelos PRs #59 e #64. Ver [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md).
