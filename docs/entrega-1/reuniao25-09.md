# Reunião 25/09/2026 — Estado do Labirinto do Saber Mobile

Resumo do que foi construído até agora na Entrega 1. Estado da `main` em 25/09/2026.
O registro canônico do progresso continua sendo o [TRACKING](TRACKING.md).

## 1. Visão geral

- App mobile em **React Native + Expo**, para educadores que acompanham alunos em sessões de
  atividades pedagógicas.
- Todas as telas funcionam com **dados mockados** (decisão G-29). A integração com o backend
  real está planejada como a tarefa T-1004, que depende das respostas do backend sobre os gates
  G-05, G-06 e G-07.
- O app **roda no emulador Android** com development build próprio. Não roda no Expo Go, porque
  usa o MMKV criptografado, que exige código nativo.
- Números da `main`:
  - 79 commits e 36 PRs mergeados;
  - 87 arquivos de teste, com **434 testes passando**;
  - 29 contratos técnicos.

## 2. Stack e configurações já feitas

| Área          | Escolha                                                    | Observação                                                                               |
| ------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Base          | Expo SDK 57, React Native 0.86.3, React 19.2.3             | Versões validadas num spike (T-101) — [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md) |
| Linguagem     | TypeScript 6 em modo `strict`                              | Typecheck no CI                                                                          |
| Gerenciador   | pnpm 11.8.0, lockfile congelado no CI                      | Node 22                                                                                  |
| Navegação     | Expo Router, com rotas em `app/` e rotas tipadas           | Guarda de sessão entre `(auth)` e as áreas logadas                                       |
| Dados remotos | TanStack Query 5, com cache persistido (persister)         | Funciona offline com o último dado salvo                                                 |
| Estado local  | Zustand                                                    | Sessão do educador e fluxo da sessão                                                     |
| HTTP          | Axios com cliente único (`apiClient`)                      | Adaptador de mocks no mesmo cliente                                                      |
| Formulários   | React Hook Form + Zod 4                                    | Validação alinhada às regras da API                                                      |
| Estilo        | NativeWind 4 + Tailwind 3 e tokens de tema próprios        | Paleta e tipografia (Nunito) centralizadas                                               |
| Armazenamento | SecureStore (token) + MMKV criptografado AES-256 (cache)   | Chave gerada com `expo-crypto`                                                           |
| Ícones        | `@expo/vector-icons` (Ionicons)                            | Sem SVG, para não exigir rebuild nativo                                                  |
| Testes        | Vitest 5 + vitest-native + React Native Testing Library 14 | Escolhido no lugar do Jest (G-22)                                                        |
| Qualidade     | ESLint, Prettier, lint-staged (pre-commit)                 | Hooks nunca são pulados                                                                  |

**Ambiente Android (build nativo validado no emulador, T-108):**

- identificador do app: `com.labirintodosaber.app`;
- emulador `Pixel_3a_API_34`, com o JDK do Android Studio.

Achado A-21: o build falhava no Windows por causa de caminhos longos. A correção teve duas partes,
documentadas no COMPATIBILIDADE:

- ativar `LongPathsEnabled` no Windows;
- usar o CMake 4.1.2 do SDK, porque o ninja 1.10 do CMake padrão não suporta caminhos longos.

## 3. Qualidade: testes, CI e processo

**Testes.** 434 testes em 87 arquivos, cobrindo:

- componentes de tela;
- regras de negócio: fuso fixo `America/Sao_Paulo`, contagem de sessões, validações;
- camada HTTP e erros da API;
- guarda de sessão;
- handlers de mock, testados pelo `apiClient` real. Esse teste pegou um bug que só aparecia no
  app nativo.

Cada funcionalidade nasce com testes escritos **antes** da implementação. O worker mostra o
teste falhando pelo motivo esperado antes de implementar. Ainda não medimos cobertura percentual;
a garantia hoje vem desse processo.

**CI (GitHub Actions)**, em todo PR e push:

1. **Documentação:** espaços em branco em toda a árvore e verificação de links e âncoras de
   todos os Markdown.
2. **App:** instalação com lockfile congelado, typecheck, lint, testes (Vitest) e bundle Android
   (`expo export`) para garantir que o app empacota.

**Contratos.** Cada tarefa tem um contrato em [`docs/contracts/`](../contracts/), com:

- escopo e decisões;
- critérios de aceite numerados (AC-xx);
- interfaces;
- dono de cada arquivo;
- plano de testes;
- histórico.

São 29 contratos hoje, incluindo os gerais de conteúdo (UX3) e de alunos (UX4).

**Planejamento e rastreio.** Toda a Entrega 1 está planejada em documentos próprios:

- [ROADMAP](ROADMAP.md) e [BACKLOG](BACKLOG.md), com as tarefas e seus critérios de aceite;
- [GATES](GATES.md), com 31 decisões registradas;
- [DESIGN](DESIGN.md) e a [Matriz API × telas](API-TELAS.md);
- [Perguntas ao backend](PERGUNTAS-BACKEND.md);
- [TRACKING](TRACKING.md), com o estado de cada tarefa.

**Orquestração com agentes.**

- Um orquestrador (Claude Opus) planeja, escreve os contratos, revisa e valida no emulador.
- Workers executam em paralelo, cada um numa worktree Git própria e com arquivos exclusivos:
  - Claude Sonnet implementa;
  - Claude Haiku faz verificações e tarefas mecânicas;
  - OpenCode (GPT Terra) também implementou parte das telas.
- A coordenação é feita pelo **Orca**.

## 4. Funcionalidades já suportadas (com mocks)

Todas foram conferidas pelo orquestrador no emulador Android, com screenshots.

| Área                                | O que já funciona                                                                                                                                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**                           | Visual do Figma: logo, card, campos com ícone, mostrar/ocultar senha, "Esqueci minha senha", validação e mensagens de erro. Conta mock: `educadora.mock@labirinto.test` / `senha123` (há também contas que simulam senha inválida e falta de rede)                                            |
| **Sessão e guarda**                 | Token no SecureStore, redirecionamento automático entre login e app, aviso de sessão expirada, logout limpa os dados                                                                                                                                                                          |
| **Tela Inicial**                    | Visual do Figma: saudação com o nome da educadora, contagem das sessões do dia (canceladas não contam), botão "Iniciar Sessão", sessões de hoje com status, carrossel "Últimas Sessões", "Atividades Recentes"; estados de carregando, erro com nova tentativa e sem conexão com dados salvos |
| **Tab bar**                         | 4 abas do Figma: Tela Inicial, Atividades, Alunos, Relatórios (Relatórios ainda "Em breve")                                                                                                                                                                                                   |
| **Fluxo de sessão — etapas 1 e 2**  | Tela 04: escolher o aluno (busca, seleção). Tela 05: nome da sessão e escolha de caderno, grupo ou atividade, com busca e filtros; o estado fica preservado ao voltar                                                                                                                         |
| **Atividades (gestão de conteúdo)** | Lista com busca, filtros (Ver Tudo, Cadernos, Grupos, Atividades) e paginação; **Criar Caderno**, **Criar Grupo** e **Criar Atividade** (enunciado, categoria, alternativas com a correta marcada); o item criado aparece na lista                                                            |
| **Alunos**                          | Lista em ordem alfabética com busca e paginação; **detalhes do aluno** (endereço, contato, objetivos); **cadastro de aluno** com validação da API                                                                                                                                             |
| **Agenda**                          | Dados e mutações prontos (criar, editar, remarcar e excluir agendamento, com cache e invalidação) e componentes prontos. A tela foi **adiada** por decisão do usuário (G-31)                                                                                                                  |
| **Offline**                         | Cache persistido e criptografado; as mutações não reenviam sozinhas (G-08)                                                                                                                                                                                                                    |

**Em andamento agora:** telas de detalhe de Atividade, Grupo e Caderno, com navegação encadeada e
exclusão com confirmação.

## 5. Decisões importantes tomadas

- **G-29:** telas com dados mockados. A camada de mocks (`src/mocks/`) é ligada pela flag
  `EXPO_PUBLIC_USE_MOCKS` e **bloqueada em produção**.
- **G-30:** o Figma é a referência visual do Login, da Tela Inicial, das telas de conteúdo e das
  de alunos. Houve desvios:
  - cores sem contraste suficiente usam a variante acessível do tema;
  - campos que a API não tem não entram, como nível ou progresso do aluno e descrição de grupo.
- **G-31:** a tab bar tem 4 abas, e a Agenda fica para depois, por prazo.
- **Mídia:** foto do aluno e imagem ou áudio da atividade aparecem como "Em breve", porque exigiriam um
  seletor de arquivos, que é uma dependência nativa e pede rebuild.
- **G-13:** fuso fixo `America/Sao_Paulo`.
- **G-08:** sem reenvio automático de ações que falharam.

## 6. Bugs encontrados e corrigidos ao rodar no aparelho

Os testes unitários não pegavam estes problemas; eles só apareceram no emulador:

1. **Login mock sempre recusado:** o Axios serializava o corpo da requisição antes da camada de
   mocks. Foi corrigido, e um teste pelo `apiClient` real passou a cobrir o caso.
2. **Navegação bloqueada depois do login:** a guarda de sessão devolvia toda rota para a Home. A
   guarda agora só redireciona quando o usuário cruza a fronteira do login.
3. **Última letra cortada no Android** ("Entra", "Iníci"): o problema era a fonte customizada
   combinada com `fontWeight`.
4. **Build nativo falhando no Windows** por causa de caminhos longos (A-21).

## 7. Próximos passos

1. Terminar os detalhes de Atividade, Grupo e Caderno, que estão em andamento.
2. Terminar o **fluxo de sessão**:
   - iniciar a sessão (T-704);
   - player da tela 06 (T-801 e T-802);
   - finalização e observação (T-803 e T-804).
3. Fazer os ajustes visuais pequenos que ficaram pendentes: o avatar e o plural de alguns textos.
4. Enviar ao backend as perguntas pendentes (G-05, G-06, G-07) e fazer a integração real
   (T-1004).
5. Rodar em aparelho físico e iOS via EAS (pendências da T-108), e fazer os testes E2E
   (T-105/T-1001) e a revisão de acessibilidade (T-1002).
