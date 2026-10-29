# Contexto da sessão de orquestração — handoff (atualizado em 2026-10-29)

> Este arquivo resume o que não está óbvio nos outros documentos, para retomar sem refazer o
> discovery, seja no Claude Code, seja no OpenCode. A fonte canônica do progresso é o
> [TRACKING da Entrega 3](entrega-3/TRACKING.md). A metodologia está no [AGENTS.md](../AGENTS.md).

## 1. Onde estamos

| Item                  | Estado                                                                                                                                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projeto               | App mobile Labirinto do Saber (Expo SDK 57, RN 0.86, TS 6, pnpm 11.8, Node 22). Repositório `Natan-Lucena/LabirintoDoSaberReactNative`, pasta `C:\Users\zerog\OneDrive\Desktop\labirintoDoSaberMobile`                                                                                             |
| Entrega vigente       | **Entrega 3**: 23 de 27 tarefas na `main` (todas as de código). Resumo em [ENTREGA-3](entrega-3/ENTREGA-3.md); plano em [ROADMAP](entrega-3/ROADMAP.md). Design: Figma Make `L7sCNfMhrzOzhtlNpS3cHr`                                                                                               |
| Escopo da Entrega 3   | Fechar a V1; Agenda completa (com WhatsApp por `wa.me`); editar paciente e responsável; anamnese e modelos; perfil e sair; sessão ligada ao caderno; Planos com IA (lista, geração, rascunho, detalhe, revisões e sugestões)                                                                       |
| O que já está na main | Toda a V1 da Entrega 2 (PR #75) e **todas as tarefas de código da Entrega 3** (23 de 27, #78 a #111), inclusive o roteiro de testes (QA-06)                                                                                                                                                        |
| Em andamento          | Nada. Aguardando o usuário liberar o emulador                                                                                                                                                                                                                                                      |
| Próximas              | Rodada no emulador, **só quando o usuário mandar**: FEC-01, validação manual pelo [PLANO-TESTES](entrega-3/PLANO-TESTES.md), QA-02 (Maestro, pedir autorização para instalar) e QA-03; depois a QA-04 nos aparelhos                                                                                |
| Backend               | `https://labirinto-do-saber.vercel.app` (Swagger em `/api-docs/`, 70 rotas). Contrato da Entrega 3 em [BACKEND-ENTREGUE](entrega-3/BACKEND-ENTREGUE.md)                                                                                                                                            |
| Qualidade             | 933 testes (Vitest + RNTL), typecheck, lint e bundle Android no CI; `scripts/check-docs.py` para os links. Com pouca memória, use `--maxWorkers=1 --testTimeout=30000`                                                                                                                             |
| Validação manual      | V1: feita em 2026-10-09 no emulador Android ([QA-05-RELATORIO](entrega-2/QA-05-RELATORIO.md)). **Entrega 3: nenhuma tela aberta ainda**; o roteiro é o [PLANO-TESTES](entrega-3/PLANO-TESTES.md) (casos em [testes/](entrega-3/testes/01-agenda.md)) e roda só quando o usuário liberar o emulador |

## 2. Regras combinadas com o usuário

1. **Workers pelo Orca CLI**, priorizando o **Codex** (desde 2026-10-28, enquanto houver cota),
   depois o **OpenCode** (`openai/gpt-5.6-terra`) e, por último, o Claude Sonnet. Codex e
   OpenCode usam a mesma conta OpenAI: quando um bate o limite, o outro também. Haiku para
   trabalho mecânico (commit e PR de docs).
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
   momento. Na Entrega 3, o emulador só roda **depois de todas as tarefas de código** (pedido de
   2026-10-29).
6. **Trabalho faseado** (desde 2026-10-29): ao fim de cada fase (PRs revisados, CI verde,
   merge e PR de docs), avisar o usuário e esperar "pode seguir".
7. **Testes antes da implementação**, com o vermelho registrado (AGENTS §4). Nunca usar
   `--no-verify`.
8. **Proibido editar arquivos com PowerShell** (`Set-Content`/`Out-File`): isso já corrompeu a
   codificação (BOM + codificação dupla). Usar a ferramenta de edição ou Python com
   `encoding="utf-8"`.
9. **Workers não criam subagentes nem forks** e não usam pergunta interativa no terminal (ex.:
   `AskUserQuestion` do Claude Code): ela trava sem ninguém para responder. Dúvidas vão por
   `orca orchestration ask`, e o orquestrador precisa responder em até 10 minutos (o `ask`
   expira).
10. **Não inventar endpoint nem campo**: cada ficha lista os "Endpoints existentes" e o que
    "Ainda não existe na API".
11. Testes nunca dentro de `app/` (o Expo Router trata como rota). Dados sempre fictícios.
12. **No máximo 2 workers ao mesmo tempo** (pedido de 2026-10-28): a máquina trava com muitos
    processos Node e costuma ficar abaixo de 1 GB de memória livre.
    Feche os terminais de workers que já terminaram (`orca terminal close`).
13. Responder ao usuário em **português**.

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

- **Codex (preferido):** lançado pelo Orca precisa de `--no-daemon` e de um Enter depois do
  despacho; prompts longos chegam divididos. Use uma spec curta que aponte para o arquivo com a
  spec completa:

  ```bash
  CX='C:\Users\zerog\AppData\Roaming\fnm\node-versions\v22.22.3\installation\codex.cmd'
  orca terminal create --worktree "path:C:/Users/zerog/lds-wt/<wt>" --title "<ID>" \
    --command "& '$CX' --no-daemon -c check_for_update_on_startup=false -a never -s danger-full-access" --json
  orca orchestration task-create --json --run run_0f0031abd486 --task-title "<ID>" \
    --display-name "<ID>" --spec "Leia COMPLETAMENTE e execute a spec em <arquivo>. Comece lendo os arquivos."
  orca orchestration worker-start --run run_0f0031abd486 --task <task> --terminal <handle> \
    --worktree "path:C:/Users/zerog/lds-wt/<wt>" --timeout-ms 180000 --json
  orca terminal send --terminal <handle> --enter   # só se o texto estiver parado na caixa
  ```

  O despacho do Codex aparece como `failed` no Orca mesmo quando funciona: acompanhe pelo
  terminal, pela branch e pelo PR.

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
- **Worktrees de trabalho:** `C:\Users\zerog\lds-wt\{e1,e2,e3}` (as antigas foram removidas em
  2026-10-28). Cada worker cria a branch com `git checkout -B <branch> origin/main` na worktree.
  - A GUI do Orca mostra cada worker **dentro da sua worktree**, não na pasta principal.
  - Uma branch usada por uma worktree não pode ser apagada no merge; use `gh pr merge` sem
    `--delete-branch` ou ignore o aviso.

## 4. Armadilhas já encontradas

| Sintoma                                                                                                                                              | Causa e solução                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent_prompt_stalled` ao disparar Claude                                                                                                            | O Orca digita a spec e não envia. Mande `orca terminal send --terminal <h> --enter` assim que o terminal mostrar `draft: "..."`; se falhar, `worker-release` e `worker-start --retry-of <ctx>`                                                                                                                         |
| Worker parado sem mensagem                                                                                                                           | Abriu uma pergunta interativa no terminal (feche com ESC: `--text $'\x1b'`) ou fez um `ask` que ninguém respondeu (leia com `check --peek` e responda com `reply`)                                                                                                                                                     |
| OpenCode "The usage limit has been reached"                                                                                                          | Limite da conta OpenAI. Feche o terminal e retome com Claude Sonnet (prefixo de retomada)                                                                                                                                                                                                                              |
| Worker OpenCode some (`terminal_handle_stale`)                                                                                                       | Morreu por falta de memória. Retome com Claude Sonnet; reduza o número de workers                                                                                                                                                                                                                                      |
| `consumer_fenced` / `waiter_exists`                                                                                                                  | Sessão desvinculada do run (use `run-use`) ou um waiter antigo ativo (use `--peek` em loop)                                                                                                                                                                                                                            |
| `main` quebrada depois de merges verdes                                                                                                              | Dois PRs mudaram o mesmo tipo por caminhos diferentes. Atualize a branch antes do merge e confira o CI da `main` depois                                                                                                                                                                                                |
| Teste de detalhe da atividade ou de `src/mocks` com timeout só na suíte completa                                                                     | Instabilidade conhecida (`TaskDetailScreen.test.tsx`, `src/mocks/__tests__/install.test.ts`); passa isolado e ao rodar o job de novo (`gh run rerun <id> --failed`). Registre, não mascare                                                                                                                             |
| Teste que importa tela com mídia falha com "Stripping types … expo-modules-core"                                                                     | Falta mockar `expo-audio`/componentes de mídia no teste, como os outros testes já fazem                                                                                                                                                                                                                                |
| Corte da última letra no Android                                                                                                                     | Fonte customizada + `fontWeight`; use a família do peso certo (FX4)                                                                                                                                                                                                                                                    |
| Diff gigante no `pnpm-lock.yaml`                                                                                                                     | O pnpm troca aspas duplas por simples; conteúdo igual                                                                                                                                                                                                                                                                  |
| Codificação corrompida em docs                                                                                                                       | Edição por PowerShell; reparar com Python UTF-8                                                                                                                                                                                                                                                                        |
| Codex pelo Orca (`--agent codex`) sai na hora e o prompt cai no PowerShell (`>>`)                                                                    | O daemon do Codex não sobe: o socket fica em `…\orca\codex-accounts\…` e passa do `SUN_LEN`. Crie o terminal com `orca terminal create --command "& '<fnm>\v22.22.3\installation\codex.cmd' --no-daemon -c check_for_update_on_startup=false -a never -s danger-full-access"` e despache com `worker-start --terminal` |
| Dispatch Codex `failed` em `dispatch_input`, mas o texto está na caixa do Codex                                                                      | O Orca cola o prompt e não envia. Mande `orca terminal send --terminal <h> --enter` **só se** o terminal mostrar o texto colado; acompanhe o worker pela branch e pelo PR                                                                                                                                              |
| Enter aceitou "atualizar o Codex" (`npm install -g @openai/codex`)                                                                                   | O Codex abre perguntando sobre atualização. Use `-c check_for_update_on_startup=false` e confira a tela antes de mandar Enter                                                                                                                                                                                          |
| Codex e OpenCode param com "usage limit" ao mesmo tempo                                                                                              | Usam a mesma conta OpenAI. Retome com Claude Sonnet (`--agent claude --model sonnet`) e uma spec de retomada que preserva o trabalho da worktree (sem reset, sem recriar a branch)                                                                                                                                     |
| Codex recebe o prompt em duas partes; a segunda fica na caixa ("tab to queue message") e, entregue depois, vira pedido novo ("falta o ID da tarefa") | Prompt longo demais para um envio. Mande uma spec curta que aponte para um arquivo com a spec completa (dentro da worktree, sem commitar), ou confira a tela e mande Enter só com o texto inteiro na caixa                                                                                                             |
| Worktree com centenas de arquivos "modificados" sem mudança de conteúdo                                                                              | Final de linha (CRLF) trocado por alguma ferramenta. `git diff --ignore-cr-at-eol --stat` fica vazio. Mande o worker adicionar só os arquivos da tarefa e conferir `git diff --cached --stat`; não faça reset sem autorização                                                                                          |

## 5. Rodar o app (quando o usuário pedir)

1. `pnpm install --frozen-lockfile`;
2. `.env` com `EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app` (os mocks ficam
   desligados por padrão desde a FEC-02);
3. `pnpm start --clear`;
4. abrir no **Expo Go**: QR no celular ou tecla `a` no emulador `Pixel_3a_API_34`.

Modo mock (opcional): `EXPO_PUBLIC_USE_MOCKS=true`, login `educadora.mock@labirinto.test` /
`senha123`. A sessão mock fica em memória: fechar o app pede login de novo.

## 6. Documentos-chave

| Documento                                                                              | Para quê                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [AGENTS.md](../AGENTS.md)                                                              | Metodologia, papéis e fluxo obrigatório                                                                                  |
| [ENTREGA-3](entrega-3/ENTREGA-3.md)                                                    | O que a Entrega 3 entregou e o que falta                                                                                 |
| [ROADMAP da Entrega 3](entrega-3/ROADMAP.md)                                           | Escopo, telas, decisões e ondas                                                                                          |
| [BACKLOG da Entrega 3](entrega-3/BACKLOG.md)                                           | Fichas com endpoints, arquivos e critérios de aceite                                                                     |
| [TRACKING da Entrega 3](entrega-3/TRACKING.md)                                         | Estado de cada tarefa, PRs e commits                                                                                     |
| [PLANO-TESTES da Entrega 3](entrega-3/PLANO-TESTES.md)                                 | Índice da rodada manual no emulador                                                                                      |
| [Testes detalhados](entrega-3/testes/01-agenda.md)                                     | Casos por área com o código relacionado e o que verificar se falhar; [divergências](entrega-3/testes/00-divergencias.md) |
| [BACKEND-ENTREGUE](entrega-3/BACKEND-ENTREGUE.md)                                      | Contrato das rotas novas de 2026-10-29                                                                                   |
| [GATES](entrega-1/GATES.md)                                                            | Decisões G-01 a G-53                                                                                                     |
| [PROJECT.md](PROJECT.md)                                                               | Arquitetura e contrato da API                                                                                            |
| [src/mocks/README.md](../src/mocks/README.md)                                          | Cenários de mock acionáveis por endpoint                                                                                 |
| [COMPATIBILIDADE](bootstrap/COMPATIBILIDADE.md)                                        | Versões e auditoria do Expo Go                                                                                           |
| [ENTREGA-V1](entrega-2/ENTREGA-V1.md) e [TRACKING da Entrega 2](entrega-2/TRACKING.md) | Histórico da V1                                                                                                          |

## 7. Lições de 2026-10-09 (teste contra o backend real)

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
