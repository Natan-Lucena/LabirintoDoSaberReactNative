# Contexto da sessão de orquestração — handoff (2026-10-04)

> O orquestrador sai do Claude Code (`claude-opus-5-5`) e passa para o **OpenCode**. Este arquivo
> resume o que não está óbvio nos outros documentos, para retomar sem refazer o discovery. A
> fonte canônica do progresso é o [TRACKING da Entrega 2](entrega-2/TRACKING.md). A metodologia
> está no [AGENTS.md](../AGENTS.md).

## 1. Onde estamos

| Item                 | Estado                                                                                                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projeto              | App mobile Labirinto do Saber (Expo SDK 57, RN 0.86, TS 6, pnpm 11.8, Node 22). Repositório `Natan-Lucena/LabirintoDoSaberReactNative`, pasta `C:\Users\zerog\OneDrive\Desktop\labirintoDoSaberMobile`                                               |
| Entrega vigente      | **Entrega 2**, novo design do Figma Make (`L7sCNfMhrzOzhtlNpS3cHr`). Marco atual: **V1**, ver [ROADMAP §4.1](entrega-2/ROADMAP.md#41-marco-v1--primeira-versão-funcionando-prioridade) e [BACKLOG §4.0](entrega-2/BACKLOG.md#40-marco-v1-prioridade) |
| Escopo da V1         | Criar atividade (manual com imagem e áudio, e com IA), cadernos e grupos, pacientes, sessão (player + registro) e relatórios (sessão, aluno, análise por IA em Markdown), ponta a ponta com o backend real                                           |
| Última entrega       | **EXPO-01** na `main` (`f7e507b`): o app voltou ao **Expo Go**. Falta só o AC-EXPO-01-01 (abrir no Expo Go), que **o usuário valida**                                                                                                                |
| Próxima onda         | **V1-1**: DS-01 a DS-05 (design system do Make) e ATV-08 (upload de mídia)                                                                                                                                                                           |
| Bloqueios do backend | **G-06** (como a sessão sabe qual caderno está sendo respondido) e **G-07** (unidade do `timeToAnswer`); travam SES-01, SES-02 e os tempos do REL-04. Perguntas em [PERGUNTAS-BACKEND](entrega-1/PERGUNTAS-BACKEND.md)                               |
| Qualidade            | 475 testes (Vitest + RNTL), typecheck, lint e bundle Android no CI; `scripts/check-docs.py` para os links                                                                                                                                            |

## 2. Regras combinadas com o usuário (valem para o novo orquestrador)

1. **Workers pelo Orca CLI**, priorizando o **OpenCode** (`openai/gpt-5.6-terra`). Claude
   Sonnet (`claude-sonnet-5`) e Haiku (`claude-haiku-4-5-20251001`) só como alternativa: quando
   o OpenCode bater o limite de uso ou o usuário pedir.
2. **O orquestrador não implementa nem roda scripts pesados**: planeja, escreve contratos e
   docs, revisa diffs e aprova. Commits e pushes também ficam com um worker (Haiku ou o próprio
   executor), não com o orquestrador.
3. **Nunca abrir, instalar ou mexer no emulador ou no app sem o usuário mandar** naquele
   momento.
4. **Trabalho direto na `main`** (sem PR) por pedido do usuário. Cada worker faz
   `fetch + rebase + push origin HEAD:main`. PR só quando o usuário pedir.
5. **Testes antes da implementação**, com o vermelho registrado (AGENTS §4). Nunca usar
   `--no-verify`.
6. **Proibido editar arquivos com PowerShell** (`Set-Content`/`Out-File`): isso já corrompeu a
   codificação (BOM + codificação dupla). Usar a ferramenta de edição ou Python com
   `encoding="utf-8"`.
7. **Workers não criam subagentes nem forks** e não usam pergunta interativa no terminal (ex.:
   `AskUserQuestion` do Claude Code): ela trava sem ninguém para responder. Dúvidas vão por
   `orca orchestration ask`.
8. **Não inventar endpoint nem campo**: cada ficha lista os "Endpoints existentes" e o que
   "Ainda não existe na API".
9. Testes nunca dentro de `app/` (o Expo Router trata como rota). Dados sempre fictícios.
10. Responder ao usuário em **português**.

## 3. Como disparar workers (Orca)

- **Run atual:** `run_0f0031abd486`. Depois de reiniciar o PC ou trocar de sessão, rode
  `orca orchestration run-use --id run_0f0031abd486`; sem isso, o Orca responde
  `consumer_fenced`.
- **OpenCode:**

  ```bash
  orca terminal create --worktree "path:C:/Users/zerog/lds-wt/<wt>" --title "<ID> Terra" \
    --command "opencode --model openai/gpt-5.6-terra" --json
  orca orchestration task-create --json --run run_0f0031abd486 --task-title "<ID> ..." \
    --display-name "<ID>" --spec "<spec completa>"
  orca orchestration worker-start --run run_0f0031abd486 --task <task> --terminal <handle> \
    --worktree "path:C:/Users/zerog/lds-wt/<wt>" --timeout-ms 180000 --json
  ```

- **Claude (alternativa):** `worker-start ... --agent claude --model claude-sonnet-5 --worktree path:...`.
- **Acompanhar:**
  - `orca orchestration check --run run_0f0031abd486 --peek --json` lê as mensagens
    (`worker_done`, `question`, heartbeats);
  - `--ack <deliveryId>` confirma o recebimento;
  - `reply --id <msg>` responde a uma pergunta;
  - `worker-release --dispatch <ctx>` encerra o worker.
- **Ver o terminal do worker:** `orca terminal read --terminal <handle>`. Para mandar texto ou
  teclas: `orca terminal send --terminal <handle> --text "..." --enter` (ESC fecha um widget
  preso: `--text $'\x1b'`).
- **Worktrees livres** (sem alterações pendentes): `C:\Users\zerog\lds-wt\{w4,c1,c2,v2,vis}`.
  Antes de disparar, faça `git checkout -B <branch> origin/main` na spec.
  - `t201` é a worktree onde o app rodou no emulador; não use para trabalho.
  - A GUI do Orca mostra cada worker **dentro da sua worktree**, não na pasta principal.
- **Spec autocontida** (AGENTS §6). Modelos de spec estão nas fichas do backlog; inclua sempre:
  - a proibição de PowerShell e de subagentes;
  - a entrega direto na `main`;
  - a mensagem de commit;
  - os arquivos permitidos;
  - os comandos de validação.

## 4. Armadilhas já encontradas

| Sintoma                                               | Causa e solução                                                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent_prompt_stalled` ao disparar Claude             | O Orca digita a spec e não envia. Mande `orca terminal send --terminal <h> --enter` assim que o terminal mostrar `draft: "..."`; se falhar, `worker-release` e `worker-start --retry-of <ctx>` |
| Worker parado sem mensagem                            | Abriu uma pergunta interativa no terminal. Leia com `terminal read`, feche com ESC e mande seguir                                                                                              |
| `consumer_fenced` / `waiter_exists`                   | Sessão desvinculada do run (use `run-use`) ou um waiter antigo ativo (use `--peek` em loop)                                                                                                    |
| Teste de `src/mocks` com timeout só na suíte completa | Instabilidade antiga, passa isolado; registrar, não "corrigir" mascarando                                                                                                                      |
| Corte da última letra no Android                      | Fonte customizada + `fontWeight`; use a família do peso certo (FX4)                                                                                                                            |
| Build nativo no Windows (só se voltar ao dev build)   | `LongPathsEnabled=1` + CMake 4.1.2 via `cmake.dir` (A-21 no COMPATIBILIDADE)                                                                                                                   |
| Diff gigante no `pnpm-lock.yaml`                      | O pnpm troca aspas duplas por simples; conteúdo igual                                                                                                                                          |
| Codificação corrompida em docs                        | Edição por PowerShell; reparar com Python UTF-8                                                                                                                                                |

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
| [TRACKING da Entrega 2](entrega-2/TRACKING.md)                                                         | Estado de cada tarefa                                                                       |
| [GATES](entrega-1/GATES.md)                                                                            | Decisões G-01 a G-41                                                                        |
| [PROJECT.md](PROJECT.md)                                                                               | Arquitetura e contrato da API (55 endpoints)                                                |
| [COMPATIBILIDADE](bootstrap/COMPATIBILIDADE.md)                                                        | Versões, achados A-01 a A-22 e auditoria do Expo Go (§9)                                    |
| [Reunião 25/09](entrega-1/reuniao25-09.md) e [plano de testes da Entrega 1](entrega-1/PLANO-TESTES.md) | Histórico e roteiro manual                                                                  |
