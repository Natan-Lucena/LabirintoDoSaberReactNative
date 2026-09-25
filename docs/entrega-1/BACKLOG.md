# Entrega 1 — Backlog

> Histórias e tarefas da primeira entrega mobile. Leia antes: [AGENTS.md](../../AGENTS.md),
> [PROJECT.md](../PROJECT.md), [ROADMAP](ROADMAP.md), [GATES](GATES.md),
> [DESIGN](DESIGN.md) e [API-TELAS](API-TELAS.md). O estado de cada tarefa **não**
> fica aqui: fica no [TRACKING](TRACKING.md).
>
> Este backlog descreve escopo e requisitos planejados; o estado factual de cada
> item, incluindo as T-101 e T-102 concluídas, fica no [TRACKING](TRACKING.md).
> Caminhos de arquivo, scripts e rotas são **previstos** até a tarefa correspondente
> registrá-los como confirmados.

## 1. Convenções

- **IDs estáveis.** `US-NN` para histórias, `T-NNN` para tarefas (centena = épico),
  `AC-NNN-NN` para critérios de aceite da tarefa, `G-NN` para gates. IDs não são
  reutilizados; tarefa removida fica marcada como cancelada no TRACKING.
- **Tipos de verificação.** `UT` unidade (Vitest), `CT` componente (React Native
  Testing Library sobre Vitest com `vitest-native`), `E2E` (Maestro), `CMD` comando com código de saída, `MAN`
  observação manual em emulador/aparelho registrada com plataforma e alvo, `REV`
  revisão de diff/documento pelo líder.
- **`<pm>`** é `pnpm` (G-02, decidido em 2026-09-24). Mantido como marcador para
  não fixar a sintaxe exata antes de T-101/T-102 confirmarem os comandos reais.
  Scripts citados (`lint`, `typecheck`, `test`, `test:e2e`) são **propostos** e
  só valem depois de T-102/T-107 os criarem e documentarem no README.
- **Arquivos exclusivos** incluem testes e wiring. Testes ficam em `__tests__/`
  ao lado do código testado; fluxos E2E em `.maestro/`. Um arquivo fora da lista
  exige pedido ao líder antes de editar.
- **Edição serial restrita.** Alguns arquivos pertencem a uma tarefa anterior e são
  editados depois por outra, apenas para ligar (wiring) o que ela entrega. Eles
  aparecem marcados como _(serial)_ na lista da tarefa, são recursos compartilhados
  no [TRACKING §3](TRACKING.md#3-recursos-compartilhados) e a ordem é garantida pelas
  dependências. A tarefa posterior altera só o necessário para o wiring e cobre a
  integração com teste.
- **Gate parcial.** "G-NN só para AC-X" significa que o gate não impede o início
  da tarefa, apenas a conclusão daquele critério.
- **Gate aberto não reduz escopo.** Uma tarefa bloqueada continua na entrega. Tirá-la
  exige decisão de redução de escopo do usuário, registrada em GATES e no TRACKING
  ([GATES, regra 5](GATES.md#regras)).
- **Telas mockadas (G-29).** Desde a T-401, critérios que citam chamadas à API são
  verificados contra a camada de mocks (`src/mocks/`, flag `EXPO_PUBLIC_USE_MOCKS`),
  com os mesmos módulos e hooks de dados. Cada tarefa de tela acrescenta os dados
  fictícios dos endpoints que usa, com cenários de erro. A verificação contra o
  backend real é da T-1004.

## 2. Protocolo comum de tarefa

Vale para todas as tarefas; cada tarefa só descreve o que difere.

### 2.1 Ciclo obrigatório (testes antes da implementação)

1. **Pronta**: dependências concluídas e revisadas; gates listados resolvidos no TRACKING.
2. **Testes**: o executor escreve os testes a partir dos critérios de aceite desta
   tarefa, sem implementar o código de produção. Pode criar apenas os stubs de tipo
   necessários para o teste compilar, sem comportamento.
3. **Vermelho revisado**: Haiku (ou o executor) roda os testes; o líder confirma
   que falham pelo comportamento ausente, e não por ambiente, import ou sintaxe.
   Evidência: comando, código de saída e trecho das falhas no TRACKING.
4. **Implementação**: mínimo necessário para os critérios. Proibido enfraquecer,
   apagar ou pular testes; teste errado só muda com justificativa e aprovação do líder.
5. **Verde e checagens**: testes da tarefa, regressões afetadas, `lint` e
   `typecheck` (quando existirem). Registrar comandos e códigos de saída.
6. **Revisão do líder**: diff contra contrato, API e design; pedidos de correção
   voltam ao passo 4.
7. **Concluída**: só com evidências registradas no TRACKING.

Tarefas sem comportamento testável automaticamente (spike, documentação,
configuração nativa, homologação) substituem os passos 2–3 por uma **checagem
objetiva declarada na própria tarefa**; isso não dispensa validação.

### 2.2 Papéis, modelos e esforço

O modelo exato é confirmado **no dispatch** (AGENTS §3); nada aqui promete ID disponível.

| Classe | Uso                                                                                      | Modelo de referência                  | Esforço padrão |
| ------ | ---------------------------------------------------------------------------------------- | ------------------------------------- | -------------- |
| A      | Execução mecânica: rodar comandos, coletar logs, aplicar mudança totalmente especificada | Haiku                                 | Baixo          |
| B      | Testes e implementação com decisões locais e contrato definido                           | Sonnet / Terra (confirmar capacidade) | Médio          |
| C      | Arquitetura, estado com risco de perda de dados, integração ambígua, diagnóstico difícil | Opus / Sol                            | Alto           |

Cada tarefa indica a classe do executor. O líder da frente (classe C) revisa todas.

### 2.3 Limites comuns

- `orca orchestration worker-start ... --timeout-ms 180000` sempre (AGENTS §3).
- Instalações, builds nativos e processos que disputam portas **não** rodam em
  paralelo. Alterar manifesto/lockfile exige o recurso compartilhado R-01 (ver TRACKING).
- Sem commit, push ou PR. Sem novas dependências fora das autorizadas na spec.
  Sem alterar contratos, AGENTS, PROJECT ou este backlog.
- Sem chamadas a backend de produção em testes automatizados: API sempre com mock
  nos testes UT/CT. Chamadas reais só em T-1001/T-1003, conforme G-19.
- Sem dados reais de crianças em fixtures, logs, capturas ou evidências.
- Orçamento financeiro: não configurado; o líder registra tempo gasto no TRACKING.

### 2.4 Parada e escalonamento comuns

Parar e perguntar ao líder quando: um critério conflitar com a API ou o design;
faltar arquivo fora da lista; um teste só passar enfraquecendo asserção; aparecer
necessidade de dependência nova; o vermelho não puder ser atribuído ao comportamento
ausente; ou houver duas falhas seguidas pelo mesmo motivo. O líder escala ao
orquestrador quando a dúvida afetar contrato, gate ou outra frente.

### 2.5 Formato de entrega do executor

Arquivos alterados; resumo; comandos com códigos de saída e resultado; evidência do
vermelho; limitações; desvios do contrato. O líder consolida no TRACKING.

## 3. Histórias

| US    | História                                                                                  | Telas / fonte             | Tarefas                       |
| ----- | ----------------------------------------------------------------------------------------- | ------------------------- | ----------------------------- |
| US-01 | Como time, quero um projeto Expo configurado e verificável para implementar com segurança | PROJECT §3, §4            | T-101–T-108 (T-109 cancelada) |
| US-02 | Como educador, quero interface consistente e acessível em todas as telas                  | DESIGN §4, §5             | T-201–T-205                   |
| US-03 | Como app, preciso de acesso à API, sessão segura e cache criptografado                    | PROJECT §7, §8            | T-301–T-306                   |
| US-04 | Como educador, quero entrar no app com email e senha                                      | Login                     | T-401, T-402                  |
| US-05 | Como educador, quero recuperar minha senha                                                | 01 `senha`                | T-403, T-404                  |
| US-06 | Como educador, quero navegar entre as áreas do app                                        | Shell, root, tabs         | T-501, T-502                  |
| US-07 | Como educador, quero ver minha agenda de hoje e as últimas sessões                        | 02 `home`, 03 `homeVazia` | T-601–T-603                   |
| US-08 | Como educador, quero escolher o aluno da sessão                                           | 04 `sessaoAluno`          | T-701, T-702                  |
| US-09 | Como educador, quero nomear a sessão e escolher o conteúdo                                | 05 `sessaoNome`           | T-703, T-704                  |
| US-10 | Como educador, quero aplicar as atividades por toque sem perder progresso                 | 06 `sessaoPlayer`         | T-801–T-803                   |
| US-11 | Como educador, quero encerrar a sessão e registrar observação                             | 06 encerramento           | T-804                         |
| US-12 | Como educador, quero ver minha agenda por mês e por dia                                   | 07 `agenda`               | T-901–T-903                   |
| US-13 | Como educador, quero criar, editar, remarcar e excluir agendamentos                       | 07 formulário             | T-904, T-905                  |
| US-14 | Como time, quero a entrega validada em aparelho com evidência                             | Homologação               | T-1001–T-1003, T-1004         |

## 4. Tarefas

### EP-01 — Bootstrap (US-01)

#### T-101 — Spike de compatibilidade da stack

- **Propósito:** confirmar versões compatíveis de Expo SDK, Expo Router, React Native,
  NativeWind, react-native-mmkv (criptografia), Reanimated, Gesture Handler,
  FlashList, SecureStore, TanStack Query, o runner de testes com RNTL, e a necessidade de development
  build (PROJECT: não prometer Expo Go).
- **Depende:** G-02.
- **Arquivos:** `docs/bootstrap/COMPATIBILIDADE.md` (novo). Qualquer experimento
  roda fora do repositório ou em pasta temporária descartada.
- **Requisitos:** R1 tabela versão × fonte oficial consultada × data; R2 decisão sobre
  Expo Go/dev build; R3 lista de dependências extras necessárias para G-03 com
  justificativa; R4 checagem se `Intl` do Hermes formata datas pt-BR **com a opção
  `timeZone: 'America/Sao_Paulo'`** (G-13); se não, propor a lib de datas autorizada em
  G-03; R6 configuração do pnpm exigida pelo Expo/Metro (por exemplo `node-linker`); R5 comandos
  reais de criação do projeto.
- **Aceite:**
  - AC-101-01 cada biblioteca da stack tem versão e evidência de compatibilidade. — `REV`
  - AC-101-02 riscos de build nativo (MMKV, Reanimated, New Architecture) estão explícitos. — `REV`
  - AC-101-03 G-03 recebe lista fechada de dependências extras propostas. — `REV`
- **Checagem objetiva:** documento revisado pelo líder; comandos testados com código de saída registrado.
- **Classe/esforço:** C, alto (risco de incompatibilidade nativa).
- **Parada:** conflito de versão sem solução documentada → escalar antes de T-102.

#### T-102 — Criar projeto Expo com TypeScript strict e Expo Router

- **Depende:** T-101. (G-25 revisto: o repositório segue no local atual.)
- **Fonte obrigatória:** [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md) §3, §5 e §7 (versões, achados A-01 a A-10 e comandos validados).
- **Arquivos:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (`allowBuilds`), `tsconfig.json`,
  `app.json` ou `app.config.ts`, `babel.config.js`, `metro.config.js`, `app/_layout.tsx` (mínimo),
  `app/index.tsx` (mínimo), `.gitignore`, `src/` (estrutura vazia do PROJECT §4 com `.gitkeep`).
- **Requisitos:** R1 `strict: true`; R2 alias de import `@/` para `src/`; R3 scripts
  `start`, `android`, `ios`, `typecheck`; R4 estrutura de pastas do PROJECT §4, com as rotas
  em `app/` na raiz (A-09); R5 instala **só as bibliotecas de runtime usadas na Entrega 1**
  (G-24), nas versões da COMPATIBILIDADE §3, e remove do template o que não é usado;
  R6 dependências diretas exigidas pelo pnpm isolado: `react-native-nitro-modules`,
  `react-native-css-interop@0.2.7` e `babel-preset-expo` (A-02 a A-04); R7 `allowBuilds`
  explícito (A-01); R8 `typecheck` funciona sem `expo start` (A-05).
- **Aceite:**
  - AC-102-01 `<pm> run typecheck` termina com código 0. — `CMD`
  - AC-102-02 o bundler inicia sem erro e a rota inicial renderiza em emulador Android (ou web só como fumaça, registrado como tal). — `CMD` + `MAN`
  - AC-102-03 nenhum segredo em `app.config`/variáveis públicas. — `REV`
  - AC-102-04 `npx expo-doctor` e `pnpm peers check` terminam com código 0. — `CMD`
  - AC-102-05 `npx expo export --platform android` termina com código 0 (bundle Hermes). — `CMD`
  - AC-102-06 o job `app` do CI (`.github/workflows/ci.yml`) deixa de ser pulado e fica verde no PR da T-102: os scripts `typecheck` e `test` e o comando de bundle precisam ter os nomes que o workflow chama. — `CMD`
- **Classe/esforço:** B, médio. **Parada:** comando de criação divergente do T-101.

#### T-103 — Qualidade de código

- **Depende:** T-102. **Recurso:** R-01.
- **Arquivos:** configs de ESLint e Prettier, `.husky/`, configuração de lint-staged, scripts `lint`/`format`.
- **Aceite:**
  - AC-103-01 `<pm> run lint` passa na base. — `CMD`
  - AC-103-02 hook de pre-commit roda lint-staged em arquivo alterado (testado com commit em repositório temporário, **não** neste). — `CMD`
- **Classe/esforço:** A/B, baixo.

#### T-104 — Runner de testes unitários e de componente (Vitest)

- **Depende:** T-102. **Recurso:** R-01.
- **Decisão (G-22):** Vitest 5 + `vitest-native` (motor `native`, plataforma Android) + RNTL 14.
  Versões e configuração validadas em [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md) §3, §5 (A-06, A-11 a A-15) e §7.
- **Arquivos:** `package.json`, `pnpm-lock.yaml` e `pnpm-workspace.yaml` (R-01,
  autorizados pelo [contrato da T-104](../contracts/t-104-runner-testes.md));
  `vitest.config.mts`, `vitest.setup.ts`, `src/test-utils/` (render com wrapper
  extensível, mocks de Nitro Modules/MMKV, SecureStore e Expo Router),
  `src/test-utils/__tests__/smoke.test.tsx`. O provider de queries é acrescentado
  depois por T-304 (R-04, serial).
- **Requisitos:** `transform` para pacotes com JSX sem compilar (A-12); mock de Nitro (A-13);
  `await render` (A-14); imports explícitos de `vitest` (A-06).
- **Aceite:**
  - AC-104-01 teste fumaça de componente passa com `<pm> run test` (`vitest run`). — `CMD`
  - AC-104-02 um teste deliberadamente falho é detectado (código ≠ 0) e depois removido. — `CMD`
  - AC-104-03 mocks nativos documentados para as próximas tarefas. — `REV`
- **Classe/esforço:** B, médio.

#### T-105 — Runner E2E Maestro

- **Depende:** T-102, T-108, G-01.
- **Arquivos:** `.maestro/smoke.yaml`, `.maestro/README.md`, script `test:e2e`.
- **Aceite:** AC-105-01 fluxo fumaça abre o app no emulador Android e termina com código 0. — `CMD` + `MAN`
- **Nota (G-01):** Maestro em iOS exige macOS; nesta máquina Windows o E2E roda em
  Android. O iOS é validado manualmente no dev build EAS (T-108, T-1003), salvo se surgir
  macOS ou execução em nuvem aprovada.
- **Classe/esforço:** B, médio. **Parada:** Maestro indisponível no Windows/Android → escalar.

#### T-106 — Configuração de ambiente

- **Depende:** T-102, T-104 (AC-106-01 é `UT`). **Recurso:** R-02.
- **Arquivos:** `app.config.ts` (seção `extra`/ambiente), `src/config/env.ts`, `src/config/__tests__/env.test.ts`, `.env.example`.
- **Requisitos:** base URL por variável Expo pública; perfis dev/homolog/prod; sem URL
  de homologação inventada (valor vazio); falha explícita se a URL faltar. G-19: em
  desenvolvimento o app fala com o **backend local**, pelo IP da máquina na rede
  (`10.0.2.2` no emulador Android; `localhost` não serve no aparelho). Se o backend
  local for HTTP, liberar tráfego sem TLS **só no perfil de desenvolvimento** (Android
  cleartext, exceção de ATS no iOS).
- **Aceite:**
  - AC-106-01 `env.ts` rejeita URL ausente ou inválida. — `UT`
  - AC-106-02 `.env.example` não contém segredo nem IP pessoal. — `REV`
  - AC-106-03 perfis de homologação e produção não aceitam HTTP sem TLS. — `UT` + `REV`
- **Classe/esforço:** B, baixo.

#### T-107 — Documentar comandos reais

- **Depende:** T-103, T-104, T-106. **Recurso:** R-05.
- **Arquivos:** `README.md`.
- **Aceite:** AC-107-01 cada comando documentado foi executado e tem código de saída registrado; comandos pendentes (E2E, builds) marcados como pendentes. — `CMD` + `REV`
- **Handoff:** o orquestrador atualiza a seção de comandos do AGENTS (fora desta tarefa).
- **Classe/esforço:** A, baixo.

#### T-108 — Development build nativo

- **Depende:** T-101, T-102, G-01. **Recurso:** R-02.
- **Arquivos:** `eas.json` (se usado), ajustes de `app.config.ts` exigidos pelo build.
- **Alvos (G-01):** development build Expo (não Expo Go: MMKV criptografado exige
  código nativo). Android: build local ou EAS, instalado no emulador e em aparelho
  físico. iOS: build EAS na nuvem, instalado em iPhone/iPad; exige conta Apple
  Developer e aparelho fornecidos pelo usuário.
- **Aceite:**
  - AC-108-01 dev build Android instalado e aberto no emulador e no aparelho, com versão do SO e modelo registrados. — `CMD` + `MAN`
  - AC-108-02 dev build iOS gerado pelo EAS, instalado e aberto em aparelho iOS, com versão do SO e modelo registrados. — `CMD` + `MAN`
  - AC-108-03 no Hermes do aparelho, a verificação do [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md) (Apêndice A) confirma: `Intl` pt-BR com `timeZone: 'America/Sao_Paulo'` ("quinta-feira, 02 de abril de 2026", "23:30", `2026-04-02`), MMKV AES-256 com `isEncrypted === true` e SecureStore gravando e lendo. Se o `Intl` falhar, a T-306 passa a usar a lib de datas autorizada em G-03. — `MAN`
- **Execução:** só quando o usuário autorizar o build (ele libera a máquina). Achado A-08
  (falha `ExtractAarTransform` no spike) deve ser reinvestigado aqui.
- **Classe/esforço:** B, médio. **Parada:** sem conta Apple Developer ou aparelho iOS → registrar pendência de AC-108-02 e escalar; não simular.

#### T-109 — Observabilidade (Sentry) — **cancelada**

- **Estado:** cancelada em 2026-09-24 por decisão de redução de escopo do usuário (G-20).
  Volta como tarefa de uma entrega futura; o ID não é reutilizado.
- **Depende (histórico):** T-102, T-106, T-502.
- **Escopo original:** `src/observability/sentry.ts` e inicialização no root, com filtro
  de PII de alunos e DSN fora do código-fonte.

### EP-02 — Fundação de interface (US-02)

#### T-201 — Tokens, tema e fontes

- **Fontes:** DESIGN §4. **Depende:** T-102, T-104, G-17, G-03 (fontes). **Recursos:** R-01, R-03.
- **Arquivos:** `src/theme/tokens.ts`, `src/theme/typography.ts`, `src/theme/index.ts`,
  `tailwind.config.js`, `global.css` (se NativeWind exigir), carregamento de fontes em
  `src/theme/fonts.ts`, `src/theme/__tests__/tokens.test.ts`.
- **Requisitos:** R1 cores com os valores exatos da fonte; R2 tipografia e formas conforme G-17
  aprovado; R3 tokens semânticos (sem cor literal nas telas); R4 largura máxima de conteúdo para tablet.
- **Aceite:**
  - AC-201-01 cada cor da fonte existe com valor idêntico, incluindo `color.success` `rgb(80,200,120)`. — `UT`
  - AC-201-02 pares texto/fundo usados pelos componentes têm contraste ≥ 4,5:1 (≥ 3:1 para texto grande e UI). — `UT` (cálculo WCAG)
  - AC-201-03 fontes carregam antes da primeira tela, sem flash de fonte errada. — `MAN`
- **Classe/esforço:** B, médio.

#### T-202 — Primitivos de conteúdo e entrada

- **Depende:** T-201.
- **Arquivos:** `src/components/{Card,Button,TextField,SearchField,Tag,FilterChips,SectionHeader}/` com `index.tsx` e `__tests__/`.
- **Aceite:**
  - AC-202-01 `Button` expõe papel `button`, estados desabilitado e carregando, e não dispara `onPress` nesses estados. — `CT`
  - AC-202-02 `TextField` de senha alterna visibilidade com rótulo acessível que muda ("Mostrar senha"/"Ocultar senha"). — `CT`
  - AC-202-03 `TextField` exibe erro associado ao campo e anunciável. — `CT`
  - AC-202-04 `FilterChips` informa estado selecionado ao leitor de tela; `Card` selecionável também. — `CT`
  - AC-202-05 alvos de toque ≥ 48 (medidos por estilo/`hitSlop`). — `CT`
  - AC-202-06 variações visuais conferem com DESIGN §5 em emulador. — `MAN`
- **Classe/esforço:** B, médio.

#### T-203 — Primitivos de layout, navegação e ícones

- **Depende:** T-201, G-03 (conjunto de ícones).
- **Arquivos:** `src/components/{AppHeader,TabBar,StepIndicator,Avatar,FooterActions,Icon,Screen}/` com `__tests__/`.
- **Aceite:**
  - AC-203-01 `StepIndicator` anuncia "Etapa X de N" e marca a etapa ativa. — `CT`
  - AC-203-02 `Avatar` mostra iniciais quando não há foto e trata falha de carregamento. — `CT`
  - AC-203-03 `AppHeader` tem botões de menu e avatar com rótulos, e título como cabeçalho. — `CT`
  - AC-203-04 `Screen` respeita safe area e largura máxima em tablet. — `MAN`
- **Classe/esforço:** B, médio.

#### T-204 — Sobreposições

- **Depende:** T-201. Sem nova dependência: `Modal` do React Native com Reanimated/Gesture Handler da stack.
- **Arquivos:** `src/components/{BottomSheet,ConfirmDialog}/` com `__tests__/`.
- **Aceite:**
  - AC-204-01 `ConfirmDialog` exige ação explícita; voltar/fechar equivale a cancelar. — `CT`
  - AC-204-02 foco vai para o diálogo ao abrir e volta ao controle de origem ao fechar. — `CT` + `MAN`
  - AC-204-03 botão de voltar do Android fecha a sobreposição. — `MAN`
- **Classe/esforço:** B, médio.

#### T-205 — Estados comuns de tela

- **Depende:** T-202.
- **Arquivos:** `src/components/{LoadingState,EmptyState,ErrorState,PendingBanner}/` com `__tests__/`.
- **Aceite:** AC-205-01 `ErrorState` oferece "Tentar novamente" que chama o callback; AC-205-02 `PendingBanner` é anunciado ao aparecer. — `CT`
- **Classe/esforço:** B, baixo.

### EP-03 — Dados, sessão e cache (US-03)

#### T-301 — Cliente HTTP e normalização de erros

- **Fontes:** PROJECT §7, Parte II (convenções de erro). **Depende:** T-104, T-106.
- **Arquivos:** `src/api/client.ts`, `src/api/errors.ts`, `src/api/__tests__/client.test.ts`, `src/api/__tests__/errors.test.ts`.
- **Requisitos:** R1 instância única Axios; R2 Bearer injetado a partir de um provedor de
  token; R3 `ApiError` com `status`, `code` (= `message`), `errors[]`, `isNetworkError`,
  `isTimeout`; R4 evento central de 401 **exceto** para `POST /educator/sign-in`; R5 timeout explícito.
- **Aceite:**
  - AC-301-01 requisição autenticada leva `Authorization: Bearer <token>`; públicas não exigem token. — `UT`
  - AC-301-02 `{ message, errors }` do Zod vira `ApiError` com erros por campo. — `UT`
  - AC-301-03 `500 TASK_NOT_FOUND` e `400 NOT_FOUND` são distinguíveis por `code`. — `UT`
  - AC-301-04 401 em rota autenticada emite o evento de sessão expirada; 401 `INVALID_CREDENTIALS` do sign-in não emite. — `UT`
  - AC-301-05 timeout e falta de rede não são confundidos com resposta do servidor. — `UT`
- **Classe/esforço:** C, alto (base de toda integração).

#### T-302 — Token seguro e store de autenticação

- **Depende:** T-104.
- **Arquivos:** `src/stores/auth.ts`, `src/features/auth/token-storage.ts`, `__tests__/` correspondentes.
- **Aceite:**
  - AC-302-01 token só é gravado via SecureStore; nenhum outro armazenamento o recebe. — `UT`
  - AC-302-02 `logout` apaga o token e emite evento de limpeza para assinantes. — `UT`
  - AC-302-03 reidratação ao abrir o app restaura estado autenticado sem chamada extra. — `UT`
- **Classe/esforço:** B, médio.

#### T-303 — MMKV criptografado e persistência de cache

- **Depende:** T-101, T-104, T-302, G-04. **Recurso:** R-01 (persister, se necessário).
- **Arquivos:** `src/storage/mmkv.ts`, `src/storage/encryption-key.ts`, `src/api/query-persister.ts`, `__tests__/` correspondentes.
- **Requisitos:** R1 instância com chave de G-04; R2 nenhuma escrita em MMKV sem criptografia;
  R3 limpeza nos eventos de logout e 401 de T-302, conforme a política aprovada em G-04;
  R4 chaves de cache por recurso e id (PROJECT §7); R5 todo dado persistido fica
  associado ao `educatorId` que o gravou.
- **Aceite:**
  - AC-303-01 instância é criada com chave de criptografia vinda do SecureStore. — `UT`
  - AC-303-02 logout e 401 limpam exatamente o que G-04 determinar para cada evento. — `UT`
  - AC-303-03 inspeção do arquivo MMKV em aparelho não mostra nomes de alunos em texto puro. — `MAN`
  - AC-303-04 isolamento entre contas: após login de outro educador, nenhum cache nem
    sessão do anterior é lido ou exibido; os dados do anterior são apagados antes da
    primeira renderização autenticada. — `UT`
- **Classe/esforço:** C, alto (dados sensíveis).

#### T-304 — QueryClient, retry e conectividade

- **Depende:** T-301, T-303, G-03 (conectividade).
- **Arquivos:** `src/api/query-client.ts`, `src/api/QueryProvider.tsx`, `src/hooks/useOnline.ts`,
  `__tests__/`, `src/test-utils/render.tsx` _(serial, R-04: acrescenta QueryClient isolado por teste)_.
- **Aceite:**
  - AC-304-01 sem retry automático para 4xx; retry limitado para rede/5xx em leituras. — `UT`
  - AC-304-02 mutações não repetem sozinhas (evita envio duplicado). — `UT`
  - AC-304-03 sem conexão, leituras mostram cache e escritas ficam bloqueadas com aviso. — `CT`
  - AC-304-04 o render de testes fornece QueryClient novo por teste, sem retry e sem vazamento de cache entre testes. — `CT`
- **Classe/esforço:** C, médio.

#### T-305 — Tipos e módulos de API da entrega

- **Depende:** T-102, T-104, T-301 (os módulos usam o cliente e o `ApiError`). **Recurso:** R-08.
- **Arquivos:** `src/api/types.ts`, `src/api/endpoints/{educator,student,content,session,appointment}.ts`, `src/api/__tests__/endpoints.test.ts`.
- **Requisitos:** tipos exatamente como PROJECT Parte II; caminhos com barra final
  onde a API exige (`/student/`, `/task/`, `/task-notebook/`, `/appointment/`);
  `generate-token` com `educatorEmail`; nenhum campo inventado.
- **Aceite:**
  - AC-305-01 cada função chama método e caminho exatos (tabela de casos). — `UT`
  - AC-305-02 `typecheck` passa e revisão confirma tipos iguais à Parte II. — `CMD` + `REV`
- **Classe/esforço:** B, médio.

#### T-306 — Datas, fuso e calendário

- **Depende:** T-104, G-13, G-03 (se `Intl` insuficiente).
- **Arquivos:** `src/utils/date.ts`, `src/utils/__tests__/date.test.ts`.
- **Aceite:**
  - AC-306-01 formata "quinta-feira, 02 de abril de 2026" e "hh:mm" em pt-BR. — `UT`
  - AC-306-02 agrupa `scheduledAt` por dia no fuso fixo `America/Sao_Paulo` (G-13), independentemente do fuso do aparelho, incluindo horários perto da meia-noite e offsets diferentes. — `UT`
  - AC-306-03 calcula o intervalo local do mês visível e a chave de dia `AAAA-MM-DD` usada nas marcações do calendário. — `UT`
  - AC-306-04 serializa data/hora escolhida (em horário de Brasília) para ISO 8601 com offset. — `UT`
  - AC-306-05 "hoje" é calculado em `America/Sao_Paulo`; teste com aparelho simulado em outro fuso. — `UT`
- **Classe/esforço:** B, médio.

### EP-04 — Acesso (US-04, US-05)

#### T-402 — Guarda de rotas e expiração de sessão

- **Depende:** T-102, T-301, T-302, T-304 (limpeza do QueryClient).
- **Integração:** o guard é montado no root pela tarefa de composição (EP-05), não aqui.
- **Arquivos:** `app/(auth)/_layout.tsx`, `src/features/auth/{useSessionGuard.ts,SessionGuard.tsx}`, `__tests__/`.
- **Aceite:**
  - AC-402-01 sem token → grupo `(auth)`; com token → área autenticada. — `UT`/`CT`
  - AC-402-02 evento de 401 limpa sessão, zera o cache do QueryClient conforme G-04 e leva ao Login com aviso, sem crash. — `CT`
  - AC-402-03 (movido para AC-502-04; ID mantido sem uso para preservar a numeração).
- **Classe/esforço:** C, médio.

#### T-401 — Login

- **Fontes:** briefing (link "Esqueceu a senha?"), API `sign-in`, `me`. **Depende:** T-202, T-205, T-301, T-302, T-304, T-305, T-502; G-18 só para aceite visual.
- **Arquivos:** `app/(auth)/login.tsx`, `src/features/auth/{LoginForm.tsx,useSignIn.ts,schemas.ts}`, `__tests__/`.
- **Camada de mocks (G-29):** esta tarefa cria `src/mocks/` (adaptador do `apiClient`, dados
  fictícios de `sign-in` e `me`, cenários de erro) e a flag `EXPO_PUBLIC_USE_MOCKS` em
  `src/config/env.ts` (edição serial da T-106).
- **Aceite:**
  - AC-401-01 email inválido e senha fora de 6–100 bloqueiam envio com mensagem por campo. — `CT`
  - AC-401-02 sucesso grava token, carrega `me` e navega para a Home. — `CT`
  - AC-401-03 `401 INVALID_CREDENTIALS` mostra erro no formulário e mantém o email digitado. — `CT`
  - AC-401-04 falha de rede mostra erro recuperável; botão não permite duplo envio. — `CT`
  - AC-401-05 "Esqueceu a senha?" navega para 01. — `CT`
- **Classe/esforço:** B, médio.

#### T-403 — Recuperação de senha: etapas Email e Código

- **Fontes:** DESIGN 01. **Depende:** T-202, T-203, T-205, T-304, T-305, T-502. **Recurso:** R-10 (cria `ForgotPasswordFlow.tsx`).
- **Arquivos:** `app/(auth)/forgot-password.tsx`, `src/features/auth/{ForgotPasswordFlow.tsx,useGenerateToken.ts}`, `__tests__/`.
- **Aceite:**
  - AC-403-01 etapa 1 envia `PUT /educator/generate-token` com `{ educatorEmail }`. — `CT`
  - AC-403-02 `404 EDUCATOR_NOT_FOUND` e `500 INTERNAL_ERROR` mostram mensagens distintas, sem sair da etapa. — `CT`
  - AC-403-03 etapa 2 só avança com código ≥ 6 caracteres e **não** chama API nem exibe "verificado". — `CT`
  - AC-403-04 indicador mostra Email → Código → Senha; "Voltar ao login" funciona em todas as etapas. — `CT`
  - AC-403-05 sem header nem tabs. — `MAN`
- **Classe/esforço:** B, médio.

#### T-404 — Recuperação de senha: etapa Senha

- **Depende:** T-403, G-05 (desde G-29, esses gates bloqueiam só a integração real, T-1004). **Recurso:** R-10.
- **Arquivos:** `src/features/auth/{ResetPasswordStep.tsx,useUpdatePassword.ts}`, `__tests__/`,
  `src/features/auth/ForgotPasswordFlow.tsx` _(serial, só para montar a etapa 3)_.
- **Aceite:**
  - AC-404-01 nova senha 6–100 e confirmação igual, com alternância de visibilidade. — `CT`
  - AC-404-02 envia `{ email, newPassword }` e volta ao Login com confirmação. — `CT`
  - AC-404-03 `PASSWORD_SAME_AS_OLD` e `EDUCATOR_NOT_FOUND` exibem mensagens próprias. — `CT`
  - AC-404-04 badge/texto "Código verificado" só aparecem se G-05 aprovar e da forma aprovada. — `CT`
  - AC-404-05 wiring: fluxo Email → Código → Senha → Login integrado no `ForgotPasswordFlow`, testado de ponta a ponta com API mockada. — `CT`
- **Escopo:** faz parte da entrega. Com G-05 aberto a tarefa fica bloqueada; homologar sem ela exige decisão de redução de escopo.
- **Classe/esforço:** B, médio. **Parada:** G-05 resolvido com mecanismo que exija campo não documentado → escalar.

### EP-05 — Estrutura autenticada (US-06)

#### T-501 — Tabs, header e destinos fora do escopo

- **Depende:** T-203, T-205, T-502, G-10. **Recurso:** R-07.
- **Arquivos:** `app/(tabs)/_layout.tsx`, `app/(tabs)/{activities,students,reports}.tsx` (placeholders conforme G-10), `src/features/shell/`, `__tests__/`.
- **Aceite:**
  - AC-501-01 cinco abas na ordem Início, Atividades, Alunos, Agenda, Relatórios, com rótulos acessíveis e aba ativa anunciada. — `CT`
  - AC-501-02 abas Atividades, Alunos e Relatórios, menu e avatar ficam visíveis e abrem uma tela "Em breve" com título e rótulo acessível (G-10). — `CT`
  - AC-501-03 tabs ocultas nas telas 04–06 e no formulário. — `MAN`
- **Classe/esforço:** B, médio.

#### T-502 — Composição do root e dono da integração transversal

- **Propósito:** ligar a fundação em um app executável. É a tarefa dona da integração
  de providers, fontes e guarda de sessão; as tarefas de fundação entregam módulos
  testados isoladamente e não editam o root.
- **Depende:** T-201, T-304, T-402. **Recurso:** R-06.
- **Arquivos:** `app/_layout.tsx`, `src/app-shell/{AppProviders.tsx,BootGate.tsx}`, `src/app-shell/__tests__/`.
- **Requisitos:** R1 composição, de fora para dentro: safe area → Gesture Handler →
  `QueryProvider` (T-304) → `SessionGuard` (T-402) → navegação; R2 splash mantido até
  as fontes (T-201) e a reidratação do token (T-302) terminarem; R3 pontos de extensão
  comentado no próprio arquivo para T-803 (`ResumeSessionPrompt`), que edita o root
  depois, em série, só para montar o próprio componente.
- **Aceite:**
  - AC-502-01 teste de integração renderiza o root com API mockada: sem token chega ao Login; com token chega à rota autenticada inicial. — `CT`
  - AC-502-02 o splash não some antes das fontes e da reidratação; falha ao carregar fonte não trava o app (usa fallback e registra). — `CT`
  - AC-502-03 um 401 disparado por requisição autenticada leva ao Login com cache limpo (integração T-301 + T-304 + T-402). — `CT`
  - AC-502-04 voltar do Android no Login não retorna a rota autenticada. — `MAN`
  - AC-502-05 o app abre no alvo de desenvolvimento com as fontes do DESIGN aplicadas. — `MAN`
- **Classe/esforço:** C, médio (integração transversal).

### EP-06 — Home (US-07)

#### T-601 — Dados da Home

- **Depende:** T-304, T-305, T-306.
- **Fontes:** `GET /appointment/`, `GET /student/`, `GET /educator/get-last-sessions`, `GET /educator/me` e, para "Atividades Recentes" (03), `GET /task-notebook/`.
- **Arquivos:** `src/features/home/{useHomeData.ts,selectors.ts}`, `__tests__/`.
- **Aceite:**
  - AC-601-01 agendamentos de hoje = filtro local de `GET /appointment/` pelo dia (G-13), ordenados por horário, com regra de status aprovada. — `UT`
  - AC-601-02 `404 EDUCATOR_DOES_NOT_HAVE_SESSIONS` vira lista vazia, não erro. — `UT`
  - AC-601-03 aluno do agendamento resolvido por `GET /student/`; aluno ausente mostra fallback sem quebrar. — `UT`
  - AC-601-04 nenhum cálculo de taxa de acerto no cliente. — `REV`
  - AC-601-05 "Atividades Recentes" = os 3 primeiros cadernos de `GET /task-notebook/` na ordem da API, sem ordenar nem filtrar por uso (a API não informa); lista vazia oculta a seção. — `UT`
- **Classe/esforço:** B, médio.

#### T-602 — Componentes da Home e `ContentCard`

- **Depende:** T-202, G-11, G-12, G-15.
- **Arquivos:** `src/features/home/components/{GreetingBanner,ScheduledSessionCard,CompletedSessionCard}.tsx`,
  `src/features/content/ContentCard.tsx` (reusado por T-703), `__tests__/`.
- **Aceite:**
  - AC-602-01 banner mostra "Olá, {nome}! 👋" sem título (G-11), a contagem ("Você tem 1 sessão agendada para hoje" / "N sessões agendadas") ou, sem agendamentos, "Boas-vindas!", e o botão Iniciar Sessão. — `CT`
  - AC-602-02 cards mostram só campos aprovados em G-11/G-12; campo ausente não gera texto vazio nem placeholder falso. — `CT`
  - AC-602-03 texto sobre turquesa usa token aprovado em G-17. — `CT`
  - AC-602-04 `ContentCard` mostra título, descrição e tags (primeira em `color.selection`, demais neutras) com o mapeamento de G-15; selecionável com `accessibilityState.selected` para uso em 05. — `CT`
- **Classe/esforço:** B, médio.

#### T-603 — Tela Home (02/03)

- **Depende:** T-205, T-501, T-601, T-602.
- **Arquivos:** `app/(tabs)/index.tsx`, `src/features/home/HomeScreen.tsx`, `__tests__/`.
- **Aceite:**
  - AC-603-01 com agendamentos hoje: estado 02; sem: estado 03 sem a seção "Sessões de hoje" e com "Atividades Recentes" (3 `ContentCard`; tocar abre "Em breve", G-10). — `CT`
  - AC-603-02 carregando, erro com nova tentativa e offline com cache. — `CT`
  - AC-603-03 Iniciar Sessão → 04; card de hoje → Agenda com `date` do agendamento. — `CT`
  - AC-603-04 "Ver todas →" e card de última sessão abrem a tela "Em breve" (G-10). — `CT`
  - AC-603-05 layout observado em celular e tablet conforme G-01. — `MAN`
- **Classe/esforço:** B, médio.

### EP-07 — Preparação da sessão (US-08, US-09)

#### T-701 — Store do fluxo de sessão

- **Fontes:** PROJECT §6. **Depende:** T-303, T-305.
- **Arquivos:** `src/stores/session-flow.ts`, `src/stores/__tests__/session-flow.test.ts`.
- **Requisitos:** máquina de estados explícita (`idle → studentSelected → configured →
starting → running → finishing → awaitingObservation → closed`, com `startUncertain`
  para `start` de resultado desconhecido e `error`); guarda `educatorId`, aluno, nome,
  conteúdo, `sessionId`, instante do envio do `start`, índice e respostas confirmadas,
  pendentes e em conflito; persiste em MMKV criptografado a cada transição; transições
  inválidas são rejeitadas.
- **Aceite:**
  - AC-701-01 cada transição válida persiste e reidrata o mesmo estado. — `UT`
  - AC-701-02 transição inválida (ex.: responder sem `sessionId`) é rejeitada sem alterar o estado. — `UT`
  - AC-701-03 cancelar antes do `start` limpa o fluxo; depois do `start`, não descarta sem confirmação. — `UT`
  - AC-701-04 fluxo reidratado com `educatorId` diferente do logado é descartado sem ser exibido (G-04). — `UT`
- **Classe/esforço:** C, alto (perda de progresso).

#### T-702 — Tela 04: escolher aluno

- **Depende:** T-202, T-203, T-205, T-304, T-305, T-701, G-14.
- **Arquivos:** `app/session/_layout.tsx`, `app/session/student.tsx`, `src/features/students/{useStudents.ts,StudentRow.tsx}`, `src/features/sessions/StudentStep.tsx`, `__tests__/`.
- **Aceite:**
  - AC-702-01 lista de `GET /student/` com busca local por nome, sem diferenciar acentos e maiúsculas. — `CT`
  - AC-702-02 seleção marca borda, check e `selected` acessível; só um aluno por vez. — `CT`
  - AC-702-03 Próximo Passo desabilitado sem seleção; com seleção grava no store e vai para 05. — `CT`
  - AC-702-04 (removido em 2026-09-24: G-09 revisto, nenhuma tela abre 04 com aluno pré-selecionado; ID não reutilizado).
  - AC-702-05 lista vazia, erro e carregando. — `CT`
  - AC-702-06 nível só aparece se G-14 definir fonte real. — `CT`
- **Classe/esforço:** B, médio.

#### T-703 — Tela 05: nome e conteúdo

- **Depende:** T-602 (`ContentCard`), T-702, G-06 (desde G-29, esses gates bloqueiam só a integração real, T-1004), G-10, G-15. **Recurso:** R-11 (cria `ContentStep.tsx`).
- **Arquivos:** `app/session/content.tsx`, `src/features/sessions/{ContentStep.tsx,useContentCatalog.ts}`, `__tests__/`.
- **Aceite:**
  - AC-703-01 nome obrigatório conforme G-15, máximo 100, com contador ou erro acessível. — `CT`
  - AC-703-02 só os chips aprovados em G-06 aparecem; trocar chip troca a fonte de dados. — `CT`
  - AC-703-03 cards mapeiam campos conforme G-15, sem inventar título. — `CT`
  - AC-703-04 Iniciar Sessão Agora desabilitado sem nome e conteúdo; Voltar mantém o aluno. — `CT`
  - AC-703-05 "Ver Tudo" abre a tela "Em breve" (G-10). — `CT`
  - AC-703-06 a busca filtra pelo campo textual do chip ativo: Cadernos por `description`
    (`descriptionContains` ou filtro local), Grupos por `name`, Atividades por `prompt`
    (`promptContains` ou filtro local); o filtro local ignora acentos e maiúsculas;
    trocar de chip mantém o texto e reaplica a busca; sem resultado mostra estado vazio. — `CT`
  - AC-703-07 voltar para 04 e retornar a 05 preserva nome e conteúdo selecionados;
    trocar de chip não descarta a seleção sem aviso. — `CT`
- **Classe/esforço:** B, médio.

#### T-704 — Início da sessão (`start`)

- **Depende:** T-301, T-701, T-703, G-06 (desde G-29, esses gates bloqueiam só a integração real, T-1004), G-08. **Recurso:** R-11.
- **Arquivos:** `src/features/sessions/{useStartSession.ts,loadSessionTasks.ts,reconcileStart.ts}`, `__tests__/`,
  `src/features/sessions/ContentStep.tsx` _(serial, só para ligar "Iniciar Sessão Agora")_.
- **Aceite:**
  - AC-704-01 envia `{ studentId, name }` e grava `sessionId` antes de navegar para 06. — `UT`
  - AC-704-02 carrega as tarefas pela fonte aprovada em G-06; sem essa fonte a tarefa não é concluída. — `UT` + `REV`
  - AC-704-03 `STUDENT_NOT_FOUND`, `NOTEBOOK_NOT_FOUND`, `SESSION_CREATION_FAILED` e rede exibem erro sem criar estado `running`. — `UT`
  - AC-704-04 duplo toque não cria duas sessões. — `CT`
  - AC-704-05 timeout ou queda de rede depois do envio leva a `startUncertain`, persistido,
    **sem novo `start` automático**. O app consulta `GET /task-notebook-session/student/:studentId`
    e procura sessão sem `finishedAt`, com o mesmo `name` e `startedAt` a partir do instante
    do envio (tolerância de relógio definida em G-08): uma correspondência → adota o `id`;
    nenhuma → nova tentativa só por ação explícita do educador; mais de uma, ou listagem
    indisponível → conflito visível, sem iniciar. — `UT`
  - AC-704-06 a limitação fica registrada no código e na UI de conflito: sem idempotência
    documentada, a identificação da sessão criada é heurística. — `REV`
  - AC-704-07 wiring: "Iniciar Sessão Agora" do `ContentStep` usa o hook; teste de integração 05 → 06 com API mockada. — `CT`
- **Classe/esforço:** C, alto.

### EP-08 — Player e encerramento (US-10, US-11)

#### T-801 — Componentes do player

- **Depende:** T-202, G-03 (áudio); G-21 só para AC-801-04.
- **Arquivos:** `src/features/sessions/player/{ActivityPlayer.tsx,AnswerOption.tsx,ImageZoom.tsx,AudioButton.tsx,Timer.tsx}`, `__tests__/`.
- **Aceite:**
  - AC-801-01 renderiza `multipleChoice` (texto) e `multipleChoiceWithMedia` com imagem, áudio ou ambos. — `CT`
  - AC-801-02 imagem abre zoom e fecha por botão e por voltar; tem descrição acessível. — `CT` + `MAN`
  - AC-801-03 seleção única de alternativa, anunciada; alternativas ≥ 56 de altura e fonte ampliada (DESIGN §4). — `CT`
  - AC-801-04 cronômetros da atividade e total; comportamento em segundo plano, com o app
    fechado e na retomada conforme G-21: pausam em segundo plano e com o app fechado e voltam a contar na retomada. — `UT`
  - AC-801-05 nenhum indicador de certo/errado calculado no cliente. — `REV`
- **Classe/esforço:** B, médio.

#### T-802 — Tela 06: responder atividades

- **Depende:** T-704, T-801, G-06, G-07 (desde G-29, esses gates bloqueiam só a integração real, T-1004); G-21 só para AC-802-05. **Recurso:** R-12 (cria `PlayerScreen.tsx`).
- **Arquivos:** `app/session/player.tsx`, `src/features/sessions/{PlayerScreen.tsx,useAnswer.ts}`, `__tests__/`.
- **Aceite:**
  - AC-802-01 Confirmar Resposta envia `{ sessionId, taskId, selectedAlternativeId, timeToAnswer }` com a unidade de G-07 e avança. — `CT`
  - AC-802-02 cada resposta é persistida no store antes e depois do envio. — `UT`
  - AC-802-03 `SESSION_ALREADY_FINISHED` e `TASK_NOT_IN_NOTEBOOK` levam a estado de erro explicado, sem avançar. — `CT`
  - AC-802-04 ao confirmar a última atividade, emite o evento de fim de atividades que T-804 liga ao encerramento. — `CT`
  - AC-802-05 voltar do Android pede confirmação e não perde a sessão local; o que ocorre depois de confirmar a saída segue G-21. — `MAN`
- **Classe/esforço:** C, alto.

#### T-803 — Pendências, reconciliação e retomada

- **Fontes:** PROJECT §6, §7. **Depende:** T-304, T-502, T-802, G-08, G-21. **Recursos:** R-06, R-12.
- **Arquivos:** `src/features/sessions/{answerQueue.ts,reconcile.ts,ResumeSessionPrompt.tsx}`, `__tests__/`,
  `src/features/sessions/PlayerScreen.tsx` _(serial, só para `PendingBanner` e estado de conflito)_,
  `app/_layout.tsx` _(serial, só para montar `ResumeSessionPrompt` no ponto de extensão de T-502)_.
- **Aceite:**
  - AC-803-01 falha de rede/timeout deixa a resposta pendente com `PendingBanner` visível. — `CT`
  - AC-803-02 antes de reenviar, consulta `GET /task-notebook-session/student/:studentId`; se a resposta já existe igual, marca confirmada sem reenviar. — `UT`
  - AC-803-03 `TASK_ALREADY_ANSWERED` sem correspondência igual na listagem vira conflito visível, não sucesso. — `UT`
  - AC-803-04 reabrir o app com sessão local cuja listagem não mostra `finishedAt` oferece
    retomar; as demais opções (encerrar agora, descartar) seguem G-21. Sessão já finalizada no
    servidor não é retomada: segue para a observação de T-804 ou é limpa. — `UT` + `CT`
  - AC-803-05 matar o app no meio da sessão e reabrir preserva índice e respostas. — `MAN`
  - AC-803-06 wiring: `PendingBanner` visível no player com pendências; o prompt de retomada
    aparece ao abrir o app autenticado (teste de integração pelo root). — `CT`
- **Classe/esforço:** C, alto.

#### T-804 — Encerramento e observação

- **Fontes:** briefing do usuário (última resposta → encerramento com observação → Home); G-16 resolvido.
- **Depende:** T-204, T-205, T-803 (fila de pendências e edição serial do player); G-18 só para aceite visual. **Recurso:** R-12.
- **Arquivos:** `src/features/sessions/{FinishFlow.tsx,ObservationSheet.tsx,useFinishSession.ts,useSaveObservation.ts}`, `__tests__/`,
  `src/features/sessions/PlayerScreen.tsx` _(serial, só para montar o `FinishFlow`)_.
- **Decisão aprovada (não "corrigir"):** a última resposta confirmada leva direto a `finish`
  e à folha de observação com **Pular / Salvar**, e daí à Home. Não existe "Continuar
  sessão" nem diálogo intermediário "Encerrar sessão?".
- **Aceite:**
  - AC-804-01 confirmar a última resposta leva ao `finish` e à folha de observação, sem opção de continuar a sessão. — `CT`
  - AC-804-02 `finish` só é chamado com zero respostas pendentes ou em conflito na fila de T-803; havendo alguma, o encerramento mostra o bloqueio e as ações de reenviar/reconciliar. — `UT` + `CT`
  - AC-804-03 `observation` só depois de `finish` confirmado (resposta 200 ou `finishedAt` presente na listagem). — `UT`
  - AC-804-04 Pular → Home; Salvar exige texto ≥ 1 caractere, envia `observation` e vai para a Home. — `CT`
  - AC-804-05 rascunho da observação sobrevive a falha de rede e ao fechamento do app. — `UT`
  - AC-804-06 mutação ambígua é reconciliada antes de qualquer nova mutação, nunca repetida às cegas:
    timeout/rede ou `SESSION_ALREADY_FINISHED` no `finish` → listagem; com `finishedAt`, segue para a
    observação sem reenviar; sem `finishedAt`, nova tentativa só por ação explícita.
    `SESSION_NOT_FINISHED` na observação → listagem; o app **não** chama `finish` automaticamente e
    volta ao passo de finalizar, respeitando AC-804-02. Timeout na observação → listagem; se a
    `observation` já estiver gravada igual, conclui sem reenviar. — `UT`
  - AC-804-07 fluxo encerrado limpa o store e invalida as consultas da Home. — `UT`
  - AC-804-08 wiring: `FinishFlow` montado no `PlayerScreen`; teste de integração da última resposta até a Home com API mockada. — `CT`
- **Classe/esforço:** C, alto (mutações sem idempotência).

### EP-09 — Agenda (US-12, US-13)

#### T-901 — Dados da agenda

- **Depende:** T-304, T-305, T-306, G-13.
- **Arquivos:** `src/features/appointments/{useAppointments.ts,mutations.ts,selectors.ts}`, `__tests__/`.
- **Aceite:**
  - AC-901-01 seletores por mês (dias com ponto) e por dia (lista ordenada, total, primeira, última). — `UT`
  - AC-901-02 criar/editar/excluir invalidam agenda e Home. — `UT`
  - AC-901-03 `PUT` envia só `scheduledAt`/`observation` (e `null` para limpar observação). — `UT`
  - AC-901-04 `400 NOT_FOUND` em editar/excluir atualiza a lista e informa o usuário. — `UT`
- **Classe/esforço:** B, médio.

#### T-902 — Componentes da agenda

- **Depende:** T-202, T-306, G-12.
- **Arquivos:** `src/features/appointments/components/{MiniCalendar,StatTile,AppointmentCard}.tsx`, `__tests__/`.
- **Aceite:**
  - AC-902-01 calendário 7 colunas, navegação ‹ ›, dia selecionado e pontos, cada dia com rótulo acessível ("2 de abril, 3 agendamentos"). — `CT`
  - AC-902-02 card mostra horário, status em texto (não só cor: `PENDING` "Agendada" com acento turquesa, `COMPLETED` "Realizada" com acento `color.success`, `CANCELLED` "Cancelada" em tag neutra), aluno e ações; campos ausentes conforme G-12; expõe `onEdit`, `onReschedule`, `onDelete` e `onPlan` para o wiring de T-904/T-905. — `CT`
  - AC-902-03 `MiniCalendar` usa `react-native-calendars` (stack do PROJECT §3), estilizado conforme o DESIGN. Grade própria só com incompatibilidade comprovada, escalada e aprovada antes da troca. — `REV`
- **Classe/esforço:** B, médio.

#### T-903 — Tela 07: agenda

- **Depende:** T-205, T-501, T-901, T-902. **Recurso:** R-13 (cria `AgendaScreen.tsx`).
- **Arquivos:** `app/(tabs)/appointments.tsx`, `src/features/appointments/AgendaScreen.tsx`, `__tests__/`.
- **Aceite:**
  - AC-903-01 abre no dia de hoje, ou no `date` recebido. O parâmetro `new=1` e as ações dos cards são ligados em T-904/T-905; até lá, as ações ficam desabilitadas com rótulo acessível. — `CT`
  - AC-903-02 trocar mês/dia atualiza resumo, título por extenso e lista. — `CT`
  - AC-903-03 dia sem agendamentos mostra estado vazio com Novo Agendamento. — `CT`
  - AC-903-04 carregando, erro e offline. — `CT`
- **Classe/esforço:** B, médio.

#### T-904 — Formulário de agendamento

- **Depende:** T-202, T-204, T-901, T-903, G-03 (seletor de data/hora), G-12; G-18 só para aceite visual. **Recurso:** R-13.
- **Arquivos:** `app/appointment-form.tsx`, `src/features/appointments/{AppointmentForm.tsx,schemas.ts}`, `__tests__/`,
  `src/features/appointments/AgendaScreen.tsx` _(serial, só para Novo, Editar, Remarcar e `new=1`)_.
- **Aceite:**
  - AC-904-01 criar: aluno (de `GET /student/`), data e hora obrigatórios, observação opcional → `POST /appointment/`. — `CT`
  - AC-904-02 editar: aluno exibido sem edição; altera data/hora e observação. — `CT`
  - AC-904-03 remarcar: altera só data/hora. — `CT`
  - AC-904-04 data/hora enviadas em ISO com offset (G-13); erros por campo. — `UT` + `CT`
  - AC-904-05 sem duplo envio; offline bloqueia salvar com aviso. — `CT`
  - AC-904-06 timeout/rede em `POST` ou `PUT` não repete a mutação: recarrega a lista e procura o
    agendamento com o mesmo aluno e `scheduledAt` (criação) ou com os valores enviados (edição);
    encontrado → sucesso; não encontrado → nova tentativa só por ação explícita. — `UT`
  - AC-904-07 wiring: Novo Agendamento, Editar, Remarcar e `?new=1` abrem o formulário no modo certo a partir da `AgendaScreen`. — `CT`
- **Classe/esforço:** B, médio.

#### T-905 — Excluir e "Montar Plano da Sessão"

- **Depende:** T-204, T-904 (edição serial da `AgendaScreen`), G-09. **Recurso:** R-13.
- **Arquivos:** `src/features/appointments/{useDeleteAppointment.ts,AppointmentActions.tsx}`, `__tests__/`,
  `src/features/appointments/AgendaScreen.tsx` _(serial, só para Excluir e Montar Plano)_.
- **Aceite:**
  - AC-905-01 Excluir abre `ConfirmDialog`; só confirma chama `DELETE /appointment/:id`. — `CT`
  - AC-905-02 Montar Plano da Sessão abre a tela "Em breve" de T-501 (G-09 revisto: o destino do protótipo é o Plano de Ensino por IA, fora da entrega). — `CT`
  - AC-905-03 timeout/rede no `DELETE` recarrega a lista e informa o resultado real; `400 NOT_FOUND` conta como já excluído. — `UT`
  - AC-905-04 wiring: ações do card ligadas na `AgendaScreen`; teste de integração excluir → lista atualizada. — `CT`
- **Classe/esforço:** B, baixo.

### EP-10 — Integração e homologação (US-14)

#### T-1004 — Integração das telas com a API real

- **Depende:** T-401, T-403, T-404, T-603, T-804, T-904, T-905, G-05, G-06, G-07, G-19.
- **Propósito:** desligar os mocks (G-29), validar cada tela contra o backend do
  ambiente de G-19, corrigir divergências entre fixtures e respostas reais e remover
  marcações de mock provisório.
- **Aceite:**
  - AC-1004-01 com `EXPO_PUBLIC_USE_MOCKS=false`, cada fluxo da Entrega 1 funciona
    contra o backend de G-19 (MAN + evidência). — `MAN`
  - AC-1004-02 fixtures ajustadas para refletir respostas reais observadas. — `REV`
- **Classe/esforço:** C, médio.

#### T-1001 — Fluxos E2E

- **Depende:** T-105, T-401, T-403, T-404, T-603, T-804, T-904, T-905, T-1004, G-19.
- **Escopo:** o fluxo de recuperação inclui a etapa Senha. Retirá-la exige decisão de
  redução de escopo do usuário ([GATES, regra 5](GATES.md#regras)); G-05 aberto não basta.
- **Arquivos:** `.maestro/{login,recuperar-senha,sessao-completa,sessao-retomada,agenda-crud}.yaml`.
- **Aceite:** AC-1001-01 cada fluxo passa no alvo de G-01 contra o ambiente de G-19, com código de saída e gravação/capturas registradas; falha de rede simulada no fluxo de sessão. — `E2E`
- **Classe/esforço:** B, médio (execução por A).

#### T-1002 — Revisão de acessibilidade e layout

- **Depende:** T-401, T-403, T-404, T-603, T-702, T-703, T-804, T-903, T-904, T-905.
- **Arquivos:** `docs/entrega-1/evidencias/acessibilidade.md` (relatório; exceção de propriedade concedida a esta tarefa).
- **Aceite:** AC-1002-01 TalkBack (e VoiceOver se G-01) percorre cada tela na ordem visual com rótulos; AC-1002-02 escala de fonte 1,3 e 2,0 sem perda de função; AC-1002-03 celular e tablet conforme G-01; AC-1002-04 contraste dos pares finais. — `MAN` + `REV`
- **Classe/esforço:** C, médio.

#### T-1003 — Homologação e relatório final

- **Depende:** T-108, T-1001, T-1002, G-01, G-19. **Recurso:** R-05.
- **Arquivos:** `docs/entrega-1/evidencias/homologacao.md`, `README.md` (atualização final de comandos).
- **Aceite:** AC-1003-01 matriz tela × plataforma × aparelho com resultado e evidência; AC-1003-02 pendências (iOS, gates abertos) explícitas; a entrega só é declarada completa com T-404 concluída ou com nova decisão de redução de escopo registrada (T-109 já foi retirada por decisão); AC-1003-03 `lint`, `typecheck`, `test` e `test:e2e` com códigos de saída. — `MAN` + `CMD` + `REV`
- **Classe/esforço:** C, médio.

## 5. Grafo de dependências

Arestas `A → B` significam "B depende de A". Gates não aparecem aqui; ver cada tarefa.

```
T-101 → T-102, T-108, T-303
T-102 → T-103, T-104, T-105, T-106, T-108, T-201, T-305, T-402
T-104 → T-106, T-107, T-201, T-301, T-302, T-303, T-305, T-306
T-103 → T-107          T-106 → T-107, T-301
T-108 → T-105, T-1003  T-105 → T-1001
T-201 → T-202, T-203, T-204, T-502
T-202 → T-205, T-401, T-403, T-602, T-702, T-801, T-902, T-904
T-203 → T-403, T-501, T-702
T-204 → T-804, T-904, T-905
T-205 → T-401, T-403, T-501, T-603, T-702, T-804, T-903
T-301 → T-304, T-305, T-401, T-402, T-704
T-302 → T-303, T-401, T-402
T-303 → T-304, T-701
T-304 → T-401, T-402, T-403, T-502, T-601, T-702, T-803, T-901
T-305 → T-401, T-403, T-601, T-701, T-702, T-901
T-306 → T-601, T-901, T-902
T-402 → T-502
T-502 → T-401, T-403, T-501, T-803
T-401 → T-1001, T-1002
T-403 → T-404, T-1001, T-1002       T-404 → T-1001, T-1002
T-501 → T-603, T-903
T-601 → T-603          T-602 → T-603, T-703
T-603 → T-1001, T-1002
T-701 → T-702, T-704   T-702 → T-703, T-1002
T-703 → T-704, T-1002  T-704 → T-802
T-801 → T-802          T-802 → T-803
T-803 → T-804          T-804 → T-1001, T-1002
T-901 → T-903, T-904   T-902 → T-903
T-903 → T-904, T-1002  T-904 → T-905, T-1001, T-1002
T-905 → T-1001, T-1002
T-401 → T-1004         T-403 → T-1004
T-404 → T-1004         T-603 → T-1004
T-804 → T-1004         T-904 → T-1004
T-905 → T-1004         T-1004 → T-1001
T-1001 → T-1003        T-1002 → T-1003
```

T-109 (cancelada, G-20) está fora do grafo. O grafo é acíclico e tem 15 níveis topológicos (verificado por script na revisão
corretiva; ver [TRACKING §6](TRACKING.md#6-verificação-desta-documentação)).
