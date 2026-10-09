# Contexto da sessão de orquestração — handoff (atualizado em 2026-10-09)

> Este arquivo resume o que não está óbvio nos outros documentos, para retomar sem refazer o
> discovery, seja no Claude Code, seja no OpenCode. A fonte canônica do progresso é o
> [TRACKING da Entrega 2](entrega-2/TRACKING.md). A metodologia está no [AGENTS.md](../AGENTS.md).

## 1. Onde estamos

| Item                  | Estado                                                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projeto               | App mobile Labirinto do Saber (Expo SDK 57, RN 0.86, TS 6, pnpm 11.8, Node 22). Repositório `Natan-Lucena/LabirintoDoSaberReactNative`, pasta `C:\Users\zerog\OneDrive\Desktop\labirintoDoSaberMobile`                                               |
| Entrega vigente       | **Entrega 2**, novo design do Figma Make (`L7sCNfMhrzOzhtlNpS3cHr`). Marco atual: **V1**, ver [ROADMAP §4.1](entrega-2/ROADMAP.md#41-marco-v1--primeira-versão-funcionando-prioridade) e [BACKLOG §4.0](entrega-2/BACKLOG.md#40-marco-v1-prioridade) |
| Escopo da V1          | Criar atividade (manual com imagem e áudio, e com IA), cadernos e grupos, pacientes, sessão (player + registro) e relatórios (sessão, aluno, análise por IA em Markdown), ponta a ponta com o backend real                                           |
| O que já está na main | 21 tarefas da V1 (EXPO-01, DS-01 a DS-06, NAV, HOME, REC, PAC-01 a PAC-03, ATV-01, ATV-06, ATV-07, ATV-08, CNT-01 e SES-01)                                                                                                                          |
| Em andamento          | Nada em worker. As 8 tarefas restantes (SES-02, SES-03, SES-04, ATV-02, ATV-03, REL-04, REL-05, REL-06) e as correções estão em PRs abertos (#58 a #74) e **integradas na branch `integracao/v1-entrega-2`**, ainda não mergeada                     |
| Próximas              | Mergear a integração (ENTREGA-V1 §3); validar no iOS e no aparelho; fechar INT-01 e QA-05; decidir G-06 com o dono do backend                                                                                                                        |
| Backend               | **Acessível desde 2026-10-09**: `https://labirinto-do-saber.vercel.app` (Express na Vercel; Swagger em `/api-docs/`, incompleto). Testado com mocks desligados. G-07 e G-43 resolvidos pela evidência; G-06 e G-05 abertos                           |
| Qualidade             | 763 testes (Vitest + RNTL), typecheck, lint e bundle Android no CI; `scripts/check-docs.py` para os links                                                                                                                                            |
| Validação manual      | Feita em 2026-10-09 no emulador Android (Expo Go) contra o backend real; relatório em `docs/entrega-2/QA-05-RELATORIO.md`. Pendente: iOS, aparelho físico (câmera) e as rotas listadas no relatório                                                  |

## 2. Regras combinadas com o usuário

1. **Workers pelo Orca CLI**, priorizando o **OpenCode** (`openai/gpt-5.6-terra`). Claude
   Sonnet (`claude-sonnet-5`) e Haiku (`claude-haiku-4-5-20251001`) só como alternativa:
   quando o OpenCode bater o limite de uso, quando o worker morrer, ou quando o usuário pedir.
2. **O orquestrador não implementa nem commita**: planeja, escreve specs e docs, revisa diffs e
   faz o merge quando autorizado. Commits e pushes ficam com um worker (o executor ou um Haiku),
   inclusive os de documentação.
3. **Uma tarefa = um PR** (desde 2026-10-06). Nada de push direto na `main`. O worker cria a
   branch a partir de `origin/main`, commita, dá push e abre o PR com `gh pr create`. O merge é
   do usuário, ou do orquestrador quando o usuário pede ("pode fazer o merge").
   - Antes do merge, atualize a branch (`gh pr update-branch <n>`) e espere o CI verde de novo:
     dois PRs verdes isolados já quebraram a `main` juntos (#41 + #42).
   - Merge com `gh pr merge <n> --squash`.
4. **Integração real pronta** (desde 2026-10-07): a tela usa sempre os módulos tipados de
   `src/api/endpoints`; os mocks seguem exatamente o contrato do `docs/PROJECT.md` Parte II;
   endpoint novo = função tipada + handler de mock fiel + teste de integração pelo `apiClient`
   real. O que o contrato não define fica numa função provisória marcada com o gate (ex.:
   `resolveSessionTasks` para G-06, `toApiTimeToAnswer` para G-07).
5. **Nunca abrir, instalar ou mexer no emulador ou no app sem o usuário mandar** naquele
   momento.
6. **Testes antes da implementação**, com o vermelho registrado (AGENTS §4). Nunca usar
   `--no-verify`.
7. **Proibido editar arquivos com PowerShell** (`Set-Content`/`Out-File`): isso já corrompeu a
   codificação (BOM + codificação dupla). Usar a ferramenta de edição ou Python com
   `encoding="utf-8"`.
8. **Workers não criam subagentes nem forks** e não usam pergunta interativa no terminal (ex.:
   `AskUserQuestion` do Claude Code): ela trava sem ninguém para responder. Dúvidas vão por
   `orca orchestration ask`, e o orquestrador precisa responder em até 10 minutos (o `ask`
   expira).
9. **Não inventar endpoint nem campo**: cada ficha lista os "Endpoints existentes" e o que
   "Ainda não existe na API".
10. Testes nunca dentro de `app/` (o Expo Router trata como rota). Dados sempre fictícios.
11. **Poucos workers ao mesmo tempo** (até 3): a máquina trava com muitos processos Node.
    Feche os terminais de workers que já terminaram (`orca terminal close`).
12. Responder ao usuário em **português**.

## 3. Como disparar workers (Orca)

- **Run atual:** `run_0f0031abd486`. Depois de reiniciar o PC ou trocar de sessão, rode
  `orca orchestration run-use --id run_0f0031abd486`; sem isso, o Orca responde
  `consumer_fenced`.
- **Spec:** a da ficha da tarefa mais as regras comuns. As regras comuns incluem:
  - OpenCode, sem subagentes, sem PowerShell e sem pergunta interativa;
  - só componentes de `src/components/ds`;
  - entrega por PR com as seções do corpo e o trailer de coautoria;
  - a regra de integração real pronta.

  Toda spec diz a worktree, a branch (criada com `git checkout -B <branch> origin/main`), a
  mensagem de commit, o título do PR, os arquivos permitidos e proibidos, e os comandos de
  validação.

- **OpenCode:**

  ```bash
  orca terminal create --worktree "path:C:/Users/zerog/lds-wt/<wt>" --title "<ID> Terra" \
    --command "opencode --model openai/gpt-5.6-terra" --json
  orca orchestration task-create --json --run run_0f0031abd486 --task-title "<ID> ..." \
    --display-name "<ID>" --spec "<spec completa>"
  orca orchestration worker-start --run run_0f0031abd486 --task <task> --terminal <handle> \
    --worktree "path:C:/Users/zerog/lds-wt/<wt>" --timeout-ms 180000 --json
  ```

  Depois de abrir o terminal, confira se ele não mostra "usage limit".

- **Claude (alternativa):** `worker-start ... --agent claude --model claude-sonnet-5 --worktree path:...`
  (ou `claude-haiku-4-5-20251001` para tarefas pequenas, como commit de docs ou correção de
  uma linha).
- **Retomada:** quando um worker morre ou bate o limite, crie uma task nova com o prefixo de
  retomada: o trabalho não commitado fica na worktree, e o novo worker **não pode** rodar
  `checkout -B`, `reset`, `clean`, `stash` ou `restore`. Ele começa por `git status` e
  `git diff`, completa e entrega o PR.
- **Acompanhar:**
  - `orca orchestration check --run run_0f0031abd486 --peek --json` lê as mensagens
    (`worker_done`, `question`, heartbeats);
  - `reply --run <run> --id <msg> --body "..."` responde a uma pergunta;
  - `orca terminal read --terminal <handle>` mostra a tela do worker;
  - `orca terminal list --json` lista os terminais; `terminal_handle_stale` = worker morreu.
- **O sinal confiável de fim é o PR**: `gh pr list --state open`. Os workers Claude disparados
  pelo Orca às vezes não conseguem mandar `worker_done` ("capability revoked").
- **Worktrees de trabalho:** `C:\Users\zerog\lds-wt\{w4,c1,c2,v2,vis}`.
  - `t201` é a worktree onde o app rodou no emulador; não use para trabalho.
  - A GUI do Orca mostra cada worker **dentro da sua worktree**, não na pasta principal.
  - Uma branch usada por uma worktree não pode ser apagada no merge; use `gh pr merge` sem
    `--delete-branch` ou ignore o aviso.

## 4. Armadilhas já encontradas

| Sintoma                                                                          | Causa e solução                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent_prompt_stalled` ao disparar Claude                                        | O Orca digita a spec e não envia. Mande `orca terminal send --terminal <h> --enter` assim que o terminal mostrar `draft: "..."`; se falhar, `worker-release` e `worker-start --retry-of <ctx>` |
| Worker parado sem mensagem                                                       | Abriu uma pergunta interativa no terminal (feche com ESC: `--text $'\x1b'`) ou fez um `ask` que ninguém respondeu (leia com `check --peek` e responda com `reply`)                             |
| OpenCode "The usage limit has been reached"                                      | Limite da conta OpenAI. Feche o terminal e retome com Claude Sonnet (prefixo de retomada)                                                                                                      |
| Worker OpenCode some (`terminal_handle_stale`)                                   | Morreu por falta de memória. Retome com Claude Sonnet; reduza o número de workers                                                                                                              |
| `consumer_fenced` / `waiter_exists`                                              | Sessão desvinculada do run (use `run-use`) ou um waiter antigo ativo (use `--peek` em loop)                                                                                                    |
| `main` quebrada depois de merges verdes                                          | Dois PRs mudaram o mesmo tipo por caminhos diferentes. Atualize a branch antes do merge e confira o CI da `main` depois                                                                        |
| Teste de detalhe da atividade ou de `src/mocks` com timeout só na suíte completa | Instabilidade conhecida (`TaskDetailScreen.test.tsx`, `src/mocks/__tests__/install.test.ts`); passa isolado e ao rodar o job de novo (`gh run rerun <id> --failed`). Registre, não mascare     |
| Teste que importa tela com mídia falha com "Stripping types … expo-modules-core" | Falta mockar `expo-audio`/componentes de mídia no teste, como os outros testes já fazem                                                                                                        |
| Corte da última letra no Android                                                 | Fonte customizada + `fontWeight`; use a família do peso certo (FX4)                                                                                                                            |
| Diff gigante no `pnpm-lock.yaml`                                                 | O pnpm troca aspas duplas por simples; conteúdo igual                                                                                                                                          |
| Codificação corrompida em docs                                                   | Edição por PowerShell; reparar com Python UTF-8                                                                                                                                                |

## 5. Rodar o app (quando o usuário pedir)

1. `pnpm install`;
2. `pnpm start`;
3. abrir no **Expo Go**: QR no celular ou tecla `a` no emulador `Pixel_3a_API_34`.

Conta mock (com `EXPO_PUBLIC_USE_MOCKS=true`): `educadora.mock@labirinto.test` / `senha123`.
A sessão mock fica em memória: fechar o app pede login de novo.

## 6. Documentos-chave

| Documento                                                                                              | Para quê                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [AGENTS.md](../AGENTS.md)                                                                              | Metodologia, papéis e fluxo obrigatório                                                     |
| [ROADMAP da Entrega 2](entrega-2/ROADMAP.md)                                                           | Mapa de telas do Make, marcos, V1, decisões e riscos                                        |
| [BACKLOG da Entrega 2](entrega-2/BACKLOG.md)                                                           | Histórias, tokens e componentes do Make, cobertura da API (§2.3), fichas V1 (§4.0) e demais |
| [TRACKING da Entrega 2](entrega-2/TRACKING.md)                                                         | Estado de cada tarefa, PRs e commits                                                        |
| [GATES](entrega-1/GATES.md)                                                                            | Decisões G-01 a G-43                                                                        |
| [PERGUNTAS-BACKEND](entrega-1/PERGUNTAS-BACKEND.md)                                                    | Perguntas abertas ao backend (G-05, G-06, G-07, G-43)                                       |
| [PROJECT.md](PROJECT.md)                                                                               | Arquitetura e contrato da API (55 endpoints)                                                |
| [src/mocks/README.md](../src/mocks/README.md)                                                          | Cenários de mock acionáveis por endpoint                                                    |
| [COMPATIBILIDADE](bootstrap/COMPATIBILIDADE.md)                                                        | Versões, achados A-01 a A-22 e auditoria do Expo Go (§9)                                    |
| [Reunião 25/09](entrega-1/reuniao25-09.md) e [plano de testes da Entrega 1](entrega-1/PLANO-TESTES.md) | Histórico e roteiro manual                                                                  |

## 5. Lições de 2026-10-09 (teste contra o backend real)

- **Expo Go + NativeWind:** o `style` em função do `Pressable` é descartado. Use
  `StaticPressable` (`src/components/ds`) ou estilo estático (G-44). Não confie só nos testes:
  o ambiente de teste resolve o estilo em função e não reproduz o defeito.
- **Mocks escondem defeitos de autenticação e de unidade.** O login só falhou contra o backend
  real; as unidades de tempo e a escala do `accuracy` também só apareceram lá (G-07, G-43).
- **O arquivo do `expo-print` não é legível no Expo Go:** gere em base64 e regrave no cache do
  app antes de compartilhar (G-45).
- **A IA leva 30 a 45 s:** as rotas de IA usam `AI_TIMEOUT_MS` (G-46).
- **Metro:** não percebeu algumas edições de arquivo. Reinicie com `--clear` ao testar uma
  correção e confirme se o bundle novo foi carregado.
- **`node_modules` por branch:** depois de trocar de branch, rode `pnpm install --frozen-lockfile`
  antes de subir o Metro (faltou `expo-print` ao voltar de uma branch sem ele).
- **`.expo/types`:** gerado pelo Metro. Se o typecheck acusar erro de rota depois de trocar de
  branch, apague a pasta e rode de novo.
- **Windows/Git Bash:** `adb push` converte caminhos que começam com `/`; use
  `MSYS_NO_PATHCONV=1`. `uiautomator dump` serve para tocar em elementos pelo texto.
- **Aviso amarelo do React Native (LogBox)** cobre a barra inferior e o botão "Salvar" durante
  os testes; dispense-o antes de tocar.
- **PRs abertos por fork:** o CI dos PRs de fork precisa de aprovação para rodar; os PRs
  empilhados incluem os commits dos anteriores (ENTREGA-V1 §3).
