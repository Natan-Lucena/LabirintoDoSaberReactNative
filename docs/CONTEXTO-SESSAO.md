# Contexto da sessão de orquestração (Claude Code) — 2026-09-25

> Resumo do que o orquestrador (Claude Code `claude-opus-5-5`) tinha em contexto ao
> fim desta sessão. Fonte canônica do estado continua sendo
> `docs/entrega-1/TRACKING.md`; este arquivo ajuda a retomar sem refazer discovery.
> Escrito sem discovery adicional: itens marcados "não confirmado" precisam de checagem.

## 1. Projeto

- App mobile **Labirinto do Saber** (React Native + Expo), repositório
  `Natan-Lucena/LabirintoDoSaberReactNative`, pasta local
  `C:\Users\zerog\OneDrive\Desktop\labirintoDoSaberMobile` (fica no OneDrive por
  decisão do usuário, G-25 revisto).
- Stack validada (T-101, `docs/bootstrap/COMPATIBILIDADE.md`): Expo SDK 57, RN 0.86.3,
  React 19.2.3, TypeScript 6, pnpm 11.8.0, Node 22, Expo Router (rotas em `app/`),
  TanStack Query 5.103.2 (+ persist-client/sync-storage-persister, G-26), Zustand,
  Axios, RHF + Zod 4, NativeWind 4.2.7 + Tailwind 3.4.19, expo-secure-store,
  react-native-mmkv 4.3.2 + nitro-modules, expo-crypto (G-27), @expo/vector-icons
  15.1.1 (G-28, Ionicons provisórios), react-native-calendars, Vitest 5 +
  vitest-native + RNTL 14 (G-22, no lugar do Jest).
- Documentos: `AGENTS.md` (metodologia), `docs/PROJECT.md` (arquitetura + API),
  `docs/entrega-1/{ROADMAP,BACKLOG,TRACKING,GATES,DESIGN,API-TELAS,PERGUNTAS-BACKEND}.md`,
  `docs/contracts/t-*.md` (um contrato por tarefa), `docs/design/telas/` (trechos do
  protótipo do Claude Design, telas 01–07), `docs/bootstrap/COMPATIBILIDADE.md`.
- CI: `.github/workflows/ci.yml` (docs: whitespace + links via `scripts/check-docs.py`;
  app: install frozen, typecheck, `pnpm run --if-present test`, bundle Android).
  **O CI ainda não roda lint** — a correção FX1 acrescenta.

## 2. Decisões do usuário relevantes (GATES)

- G-01 dev build Android + iOS via EAS; celular retrato; tablet checagem.
- G-02 pnpm. G-03 deps extras. G-04 limpeza: logout apaga; 401 preserva sessão do
  mesmo educador; troca de conta apaga tudo. G-08 sem reenvio automático; reconciliar.
- G-09 "Montar Plano da Sessão" -> tela "Em breve". G-10 destinos fora do escopo
  visíveis com "Em breve"; 5 abas do design. G-11/G-12/G-14/G-15 só campos da API.
- G-13 fuso fixo America/Sao_Paulo; CANCELLED fora da contagem, visível na lista.
- G-16 fim da sessão: última resposta -> finish -> observação (Pular/Salvar) -> Home.
- G-17 tipografia/contraste adaptados (DESIGN §4). G-18 telas sem referência montadas
  com primitivos; aceite visual do usuário. G-19 backend local, dados fictícios.
- G-20 Sentry adiado (T-109 cancelada). G-21 política temporal/abandono aprovada.
- G-22 Vitest; G-23 TS 6; G-24 instalar só o usado; G-25 repo segue no OneDrive.
- G-26 persister TanStack; G-27 expo-crypto; G-28 @expo/vector-icons.
- **G-29 (2026-09-25): telas com dados mockados** — camada `src/mocks/` (adaptador
  do apiClient), flag `EXPO_PUBLIC_USE_MOCKS` (true em dev, false em homolog/prod,
  **recusada em produção**). Gates de backend G-05/G-06/G-07 só bloqueiam a
  integração real, nova tarefa **T-1004**. Conta mock: `educadora.mock@labirinto.test`
  / `senha123`; `invalido.mock@...` = 401; `semrede.mock@...` = sem rede.
- Abertos: **G-05, G-06, G-07** (backend; perguntas em `PERGUNTAS-BACKEND.md`,
  ainda não enviadas).

## 3. Regras de trabalho combinadas com o usuário

- Orquestrador (Opus) só planeja, revisa e aprova; **não roda scripts** (Haiku
  faz tarefas mecânicas). Execução por Sonnet (`claude-sonnet-5`) e, desde
  2026-09-25, **OpenCode com modelos menores que o Sol**
  (`openai/gpt-5.6-terra`; `openai/gpt-5.4-mini` listado) — **pelo menos uma das
  tarefas em paralelo deve usar OpenCode**.
- Orquestração via **Orca** (`run_0f0031abd486` é o run atual; o coordenador fica
  vinculado a um run por vez — use sempre o mesmo run; `run-use --id` para trocar).
  Claude: `worker-start --agent claude --model <id>`. OpenCode:
  `orca terminal create --worktree path:<wt> --command "opencode --model openai/gpt-5.6-terra"`
  - `worker-start --terminal <handle>`. Disparar workers **um de cada vez** (evita
    `agent_prompt_stalled`; se ocorrer: `worker-release` + `worker-start --retry-of`).
- Um waiter por vez (`check --run run_0f0031abd486 --wait ...`); para espiar use `--peek`.
- **Um PR por tarefa**, aceite = **merge do usuário**; orquestrador **não acompanha
  CI** (usuário verifica) e manda o link do PR.
- Cards (TRACKING) sempre atualizados; **PRs de código saem de worktrees e não
  editam o TRACKING**; o tracking é atualizado em **PRs de docs** na pasta principal.
- Fluxo AGENTS §4: contrato -> testes -> **parar no vermelho e pedir aprovação**
  (`orca orchestration ask`) -> implementação -> validação -> PR. T-401 e T-501
  pularam o vermelho (desvio registrado); specs novas exigem a parada.
- Instalações serializadas: worker pede via `ask` antes de `pnpm install`.
- **Proibido editar arquivos com PowerShell** (Set-Content/Out-File): já corrompeu
  a codificação (BOM + codificação dupla). Usar Edit/Write ou Python UTF-8.
- Nada de testes dentro de `app/` (Expo Router trata como rota).
- Build nativo/emulador **só com autorização do usuário no momento** (T-108 pendente).

## 4. Worktrees

| Worktree                     | Uso recente                       | Estado                                                |
| ---------------------------- | --------------------------------- | ----------------------------------------------------- |
| pasta principal (OneDrive)   | PRs de docs                       | branch `docs/state-after-t401-t902` (PR #27 mergeado) |
| `C:\Users\zerog\lds-wt\v2`   | T-601 (Terra) e agora FX1 (Terra) | branch `fix/t-501-hooks-and-ci-lint` (FX1)            |
| `C:\Users\zerog\lds-wt\vis`  | T-702 (Sonnet)                    | branch `feat/t-702-student-step` (PR #29)             |
| `C:\Users\zerog\lds-wt\t201` | T-306, T-602                      | livre                                                 |
| `C:\Users\zerog\lds-wt\w4`   | T-902                             | livre                                                 |

Terminal OpenCode Terra: `term_20fc5738-6fb7-42e1-8bb4-a5b4b2756b2c` (worktree v2).

## 5. Estado das tarefas (Entrega 1)

**Concluídas (merge do usuário):** T-101, T-102, T-103, T-104, T-106, T-201, T-202,
T-203, T-205, T-301, T-302, T-303, T-304, T-305, T-306, T-401, T-402, T-501, T-502,
T-602, T-701, T-902. Cancelada: T-109.

**PRs abertos aguardando merge:**

- **#28** T-601 dados da Home + mocks (OpenCode Terra) — 290/290 testes.
- **#29** T-702 tela 04 escolher aluno (Sonnet) — 292/292 testes; depende dos mocks do #28 para dados no app.
- **FX1** (OpenCode Terra, task `task_80479997d551`, dispatch `ctx_39750c109264`):
  corrige `react-hooks/rules-of-hooks` em `app/(tabs)/_layout.tsx` (useTabItems em
  callback — bug de runtime da T-501), `react-hooks/globals` em
  `src/features/shell/__tests__/useTabItems.test.tsx` e **adiciona lint ao CI**.
  O waiter terminou com uma mensagem **ainda não lida** (provável worker_done com o
  link do PR) — conferir com `check --run run_0f0031abd486`, dar ack e `worker-release`.

**Prontas depois desses merges:**

- T-603 Home completa (T-601 + T-602 + T-501).
- T-703 tela 05 (T-702 + ContentCard da T-602; conteúdo mockado).
- T-901 dados da Agenda (mocks) -> T-903 tela da Agenda -> T-904 formulário -> T-905.
- T-403 recuperação etapas 1–2 -> T-404 etapa senha (mockada).
- T-801 componentes do player; T-204 sobreposições; T-107 README.
- Depois: T-704, T-802, T-803, T-804 (sessão); T-1004 (integração real);
  T-1002 acessibilidade; T-105/T-1001 E2E; T-108 build nativo (autorização);
  T-1003 homologação.

**Pendências de docs:** próximo PR de docs deve registrar T-601, T-702 e FX1
(T-501 reaberta e corrigida) após merge; manter §0 do TRACKING.

## 6. Estado do app

- Com a main atual: abre no **Login** (mock), entra nas **5 abas**; Atividades,
  Alunos, Relatórios, menu e avatar abrem "Em breve"; Início e Agenda são
  placeholders. Com #28/#29: tela 04 funcional no fluxo `app/session/`.
- Rodar: `pnpm install --frozen-lockfile`, `cp .env.example .env.local`,
  `npx expo run:android` (dev build; **não validado ainda** — T-108; achado A-08
  de falha Gradle `ExtractAarTransform`), depois `pnpm start`. Não roda no Expo Go.
- Verificações: `pnpm run typecheck`, `pnpm run lint`, `pnpm test`,
  `npx expo-doctor`, `npx expo export --platform android`,
  `python scripts/check-docs.py`.

## 7. Achados técnicos importantes

- pnpm 11: `allowBuilds` explícito; `minimumReleaseAgeExclude` reescrito pelo pnpm.
- `expo-env.d.ts` é do Expo (ignorado); typecheck usa `app-env.d.ts`.
- NativeWind + pnpm: `react-native-css-interop` e `babel-preset-expo` diretos.
- MMKV v4 exige nitro-modules; em testes, mock de Nitro.
- `react-native-calendars` precisa de `transform` no vitest-native.
- `pnpm/action-setup` usa só o `packageManager` como fonte da versão.
- Git Bash converte `origin/main:path` — usar `MSYS_NO_PATHCONV=1`.
- Mensagens do Orca: leitor em scratchpad `orca_msgs.py`; heartbeats não entram no filtro do waiter.
