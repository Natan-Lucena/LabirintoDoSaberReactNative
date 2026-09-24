# Labirinto do Saber — Documentação do Projeto

> Documento único com duas partes: arquitetura do aplicativo mobile e referência
> global da API consumida por ele. Conteúdo fornecido pelo usuário, sem
> verificação independente contra o backend.

## Índice

- [Parte I — Arquitetura do Aplicativo Mobile](#parte-i--arquitetura-do-aplicativo-mobile)
  - [1. Contexto e propósito](#1-contexto-e-propósito)
  - [2. Visão de produto](#2-visão-de-produto)
  - [3. Stack técnica](#3-stack-técnica)
  - [4. Organização do código](#4-organização-do-código)
  - [5. Módulos](#5-módulos)
  - [6. Fluxo de sessão](#6-fluxo-de-sessão)
  - [7. Dados, cache e conectividade](#7-dados-cache-e-conectividade)
  - [8. Segurança](#8-segurança)
  - [Pendências de integração (arquitetura)](#pendências-de-integração-arquitetura)
- [Parte II — Referência Global da API](#parte-ii--referência-global-da-api)
  - [Visão geral](#visão-geral)
  - [Autenticação](#autenticação)
  - [Convenções de resposta e erros](#convenções-de-resposta-e-erros)
  - [Uploads](#uploads)
  - [Tipos compartilhados](#tipos-compartilhados)
  - [Endpoints](#endpoints)
    - [Educator — 8 rotas](#educator--8-rotas)
    - [Student — 5 rotas](#student--5-rotas)
    - [Task — 7 rotas](#task--7-rotas)
    - [AI Task — 1 rota](#ai-task--1-rota)
    - [Task Group — 4 rotas](#task-group--4-rotas)
    - [Task Notebook — 4 rotas](#task-notebook--4-rotas)
    - [Task Notebook Session — 10 rotas](#task-notebook-session--10-rotas)
    - [Anamnese Template — 5 rotas](#anamnese-template--5-rotas)
    - [Anamnese Response — 4 rotas](#anamnese-response--4-rotas)
    - [Appointment — 7 rotas](#appointment--7-rotas)
- [Apêndice — Tabela consolidada dos 55 endpoints](#apêndice--tabela-consolidada-dos-55-endpoints)
- [Limitações desta documentação](#limitações-desta-documentação)

---

# Parte I — Arquitetura do Aplicativo Mobile

**Labirinto do Saber — Documento de Arquitetura do Aplicativo Mobile (React Native + TypeScript)**

## 1. Contexto e propósito

O backend é uma API REST em Node.js, Express, Prisma e MongoDB, publicada na
Vercel. Já existe uma SPA React para desktop que consome esse backend. O
aplicativo mobile descrito aqui consumirá o **mesmo backend**, sem alterá-lo.

A implementação interna do backend **não é escopo deste repositório** e não deve
ser desenvolvida ou documentada aqui. Premissa fixada pelo usuário: **os
contratos do backend não devem ser alterados para atender o mobile**. Qualquer
necessidade nova de API é uma dependência explícita, a ser negociada com o time
responsável pelo backend — não uma decisão que o mobile pode tomar sozinho.

Os recursos expostos pelo backend, na forma de prefixos de rota, são:

- `/educator`
- `/student`
- `/task`
- `/task-group`
- `/task-notebook`
- `/task-notebook-session`
- `/anamnese`
- `/appointment`
- `/ai-task`

**Status local no momento deste documento:** a arquitetura está definida e
aprovada pelo usuário; a aplicação mobile **ainda não foi iniciada** — não há
código, dependências instaladas nem build configurado neste repositório.

## 2. Visão de produto

A aplicação web já existente atende ao momento de **preparação**: criação de
atividades, cadernetas, anamneses e relatórios impressos, tipicamente longe da
criança.

O aplicativo mobile (celular e tablet) atende ao **momento presencial**, com o
profissional ao lado da criança durante o atendimento. A proposta de produto é:

- Aplicar a sessão de atividades por toque, com o tablet virado de frente para a
  criança, sem depender de mouse ou teclado.
- Permitir consultar a agenda do dia, o histórico do aluno e a última análise
  disponível **antes** do atendimento começar.
- Permitir registrar observações da sessão **logo depois** que ela terminar,
  ainda com o contexto fresco.
- Receber lembretes diretamente no aparelho, complementando (não substituindo)
  o e-mail que o backend já envia.

## 3. Stack técnica

Todas as tecnologias abaixo são **decisões já tomadas pelo usuário para a
arquitetura**, mas **nenhuma delas está instalada ainda** neste repositório.
Decisão de stack e instalação de dependências são coisas distintas: este
documento registra a primeira, não afirma a segunda.

| Camada | Tecnologia | Motivo |
|---|---|---|
| Linguagem | TypeScript 6.x em modo `strict` (versão fixada pelo Expo SDK 57; decisão de 2026-09-24, ver `docs/bootstrap/COMPATIBILIDADE.md`) | Alinhamento com o backend e prevenção de erros em telas ricas em dados |
| Plataforma | React Native com Expo (managed workflow) | Build, atualização e acesso a APIs nativas sem manter código nativo Android/iOS à mão (toolchain pode ser necessário) |
| Navegação | Expo Router sobre React Navigation | Roteamento por arquivos, deep links e parâmetros tipados |
| Estado de servidor | TanStack Query | Cache, revalidação, retry e estados de loading/erro padronizados |
| Estado local/fluxo | Zustand | Sessão corrente e preferências, com pegada leve |
| HTTP | Axios, instância única com interceptors | Base URL, injeção de token e tratamento de 401 centralizados |
| Formulários | React Hook Form + Zod | Validação compatível com a gramática de validação do backend |
| Estilo | NativeWind com tokens de design | Consistência visual, suporte a tema claro/escuro, produtividade |
| Armazenamento seguro | expo-secure-store | JWT guardado em Keychain (iOS) / Keystore (Android), nunca em armazenamento comum |
| Cache em disco | react-native-mmkv | Cache de consultas e preferências; dados sensíveis devem ser criptografados |
| Animações/gestos | Reanimated + Gesture Handler | Execução na UI thread para transições e listas fluidas |
| Listas | FlashList | Listas longas de alunos, atividades e sessões |
| Mídia/arquivos | expo-image, expo-image-picker, expo-document-picker, expo-file-system | Fotos, mídia de atividades, documentos e anexos de anamnese |
| PDF | expo-print + expo-sharing | Substitui o `@react-pdf/renderer` da web; manter o layout do relatório é objetivo de paridade |
| Notificações | expo-notifications | Lembrete local primeiro; push via backend é fase posterior |
| Calendário | react-native-calendars | Equivalente móvel do `MiniCalendar` da web |
| Observabilidade | Sentry para React Native | Captura de exceções e sessões travadas em aparelhos reais |
| Testes | Vitest (com `vitest-native`) + React Native Testing Library + Maestro (decisão do usuário em 2026-09-24, substitui o Jest) | Unidade, componentes e ponta a ponta |
| Qualidade | ESLint, Prettier, Husky, lint-staged | Padrão de código garantido antes de cada commit |
| Distribuição | EAS Build, EAS Submit, EAS Update | Build em nuvem, publicação nas lojas e atualizações OTA |

## 4. Organização do código

A organização é **orientada a funcionalidades** (feature-based), evitando repetir
o padrão da web de colocar lógica de acesso a dados dentro das próprias páginas.

Estrutura de diretórios planejada:

```
app/                          # rotas (Expo Router)
app/(auth)/                   # login, cadastro, recuperação de senha
app/(tabs)/                   # agenda, alunos, conteúdo, perfil
app/session/                  # pilha de navegação própria da sessão de atividades
src/api/                      # instância Axios, interceptors, tipos de resposta
src/features/
  students/                   # telas, componentes e hooks de alunos
  sessions/                   # telas, componentes e hooks de sessões
  appointments/                # telas, componentes e hooks de agenda
  anamnese/                    # telas, componentes e hooks de anamnese
  reports/                     # telas, componentes e hooks de relatórios
src/components/               # componentes visuais compartilhados
src/hooks/                    # hooks transversais (useAuth, useUpload, ...)
src/stores/                   # stores Zustand
src/theme/                    # cor, tipografia, espaçamento
src/utils/                    # formatação, datas, funções puras
```

Cada feature em `src/features/*` expõe:

1. Um arquivo de queries/hooks do TanStack Query.
2. Tipos derivados diretamente do contrato da API (ver Parte II).
3. As telas consumidoras desses hooks.

**Regra de organização:** nenhuma tela chama o Axios diretamente — todo acesso a
dados remotos passa pela camada de hooks de `src/features/*` ou `src/api/`.

## 5. Módulos

Telas e rotas de API que cada módulo consome:

- **Autenticação** — login, cadastro, esqueci a senha, redefinição de senha.
  Consome `/educator/sign-in`, `/educator/register`, `/educator/generate-token`,
  `/educator/update-password`.
- **Perfil** — dados do educador e foto de perfil.
  Consome `/educator/me`, `/educator/update-educator`,
  `/educator/update-profile-picture`.
- **Agenda** — calendário mensal, visão diária, novo atendimento.
  Consome `/appointment` (coleção completa de rotas).
- **Alunos** — lista, ficha, documentos e histórico.
  Consome `/student`, `/student/:id/documents`.
- **Conteúdo** — catálogo de atividades, grupos e cadernetas, **somente leitura**
  no mobile. Consome `/task`, `/task-group`, `/task-notebook`.
- **Sessão** — fluxo aluno → conteúdo → execução → conclusão → observação.
  Consome `/task-notebook-session` nas operações `start`, `answer`, `finish`,
  `observation`.
- **Relatórios** — relatório por aluno, por sessão, análise por IA e exportação
  em PDF. Consome `/task-notebook-session/report/:sessionId`,
  `/task-notebook-session/analysis/student/:studentId` e sua variante `/ai`.
- **Anamnese** — modelos de anamnese e respostas por aluno/formulário.
  Consome `/anamnese`, `/anamnese/templates`.

## 6. Fluxo de sessão

**Problema observado na web:** o fluxo de sessão atravessa sete telas usando
`location.state`, e um refresh de página perde todo o progresso.

**Solução no mobile:** uma **máquina de estados explícita**, mantida em uma store
dedicada (Zustand), que guarda:

- O aluno selecionado.
- O conteúdo (caderneta/atividades) selecionado.
- O ID da sessão já iniciada no backend.
- O índice da atividade corrente.
- As respostas já enviadas ao servidor.

Esse estado é **persistido no MMKV a cada transição**, para sobreviver ao
fechamento do app ou a um desligamento do aparelho. Ao reabrir o app, se houver
uma sessão iniciada e não finalizada, o app deve **oferecer retomada** dela.

Cada resposta é enviada ao servidor **no momento em que é dada**, não em lote ao
final da sessão.

**Apresentação para a criança:** fonte ampliada e áreas de toque generosas,
adequadas ao uso em tablet por uma criança.

**Conciliação explícita com a API (importante):** a chamada de `finish` deve
ocorrer **antes** da chamada de `observation`. Pode existir um rascunho de
observação mantido localmente antes disso, mas o **servidor só aceita a
observação de uma sessão que já foi finalizada** (ver `SESSION_NOT_FINISHED` na
Parte II).

## 7. Dados, cache e conectividade

- Dados remotos trafegam via TanStack Query, com **chaves de cache padronizadas
  por recurso e id**.
- O cache em MMKV mantém agenda, lista de alunos e ficha recente **visíveis**
  mesmo com conexão instável.
- **Escrita exige conexão.** Isto não é um app offline-first.
- Se uma resposta de sessão for enviada durante uma interrupção de conectividade,
  ela fica **pendente localmente, com aviso visível na UI**, para reenvio quando
  a conexão retornar.
- **Isto não é uma fila offline completa.** Uso plenamente offline é um objetivo
  de fase posterior, condicionado a evidência de demanda real.
- **Reconciliação no reenvio (regra crítica):** o reenvio deve reconciliar o
  estado real do servidor antes de reenviar uma resposta:
  - Um timeout de rede **não prova** que a chamada de `answer` não foi
    processada no servidor.
  - Um erro `TASK_ALREADY_ANSWERED` recebido em um reenvio **não deve ser
    tratado cegamente como sucesso equivalente** ao envio original — é um sinal
    de que a resposta já existe no servidor, mas o app precisa decidir
    conscientemente como tratar esse caso.
  - **Não há garantia documentada de idempotência** nesse endpoint. Esta é uma
    lacuna de integração, não uma suposição de implementação.
- Os dados do educador logado (`/educator/me`) são cacheados para evitar repetir
  a chamada em toda troca de tela.
- Um único interceptor Axios injeta o token em toda requisição autenticada e
  trata respostas 401 de forma centralizada.

## 8. Segurança

- O JWT é armazenado em `expo-secure-store`, **nunca** em AsyncStorage.
- O token expira em **7 dias** e **não há refresh token** (consistente com a
  Parte II).
- Um interceptor detecta expiração/401, limpa o armazenamento seguro e retorna o
  usuário ao login de forma controlada (sem crash, sem estado inconsistente).
- **Biometria é opcional** ao abrir o app, dado que o app lida com dados
  sensíveis de crianças.
- **Requisito, não propriedade automática:** nenhum dado clínico deve ser
  gravado em texto puro fora do cache MMKV criptografado. Isto precisa ser
  garantido ativamente pela implementação — o MMKV não criptografa por padrão
  apenas por ser usado. A chave de criptografia e o ciclo de limpeza do cache
  **ainda precisam ser definidos** no contrato de implementação (fase de
  bootstrap), e não estão decididos por este documento.
- A base URL da API é configurada por variável de ambiente Expo, com valores
  distintos para desenvolvimento, homologação e produção.
- **Não incluir segredos em variáveis públicas do Expo** (variáveis com prefixo
  público ficam embutidas no bundle do cliente).
- **Não inventar uma URL de homologação**: nenhuma foi informada pelo usuário até
  o momento deste documento.

## Pendências de integração (arquitetura)

Estas pendências são lacunas de integração identificadas ao conciliar a
arquitetura com a referência fornecida. Elas **não alteram** a referência de
API da Parte II — são registradas separadamente para não serem confundidas com
comportamento documentado do backend.

- `POST /task-notebook-session/start` recebe apenas `studentId` e `name`, sem
  referência a caderneta/conteúdo no corpo da requisição. A forma como a sessão
  se associa ao conteúdo que será respondido **precisa ser confirmada** com o
  time do backend antes da implementação.
- O campo `timeToAnswer` em `answer` exige apenas `>= 0`, mas **a unidade de
  medida (segundos? milissegundos?) não foi informada**. Precisa ser confirmada
  antes da implementação, para não gerar métricas erradas em relatórios.
- O fluxo `generate-token` envia um token por e-mail, mas o endpoint
  `update-password` só recebe `email` e `newPassword` no corpo — **não há campo
  de token nele**. O fluxo de autorização entre os dois passos **não está
  descrito**. Este documento não inventa um campo ou mecanismo de token para
  preencher essa lacuna.
- O reenvio/retomada de sessão depende de reconciliar o estado por meio da
  **listagem de sessões do aluno** (`GET /task-notebook-session/student/:studentId`),
  pois **não há um endpoint de GET de sessão individual documentado**.
- Compatibilidade de versões entre Expo, MMKV, NativeWind e demais bibliotecas,
  bem como a necessidade de um development build (em vez de Expo Go), **serão
  validadas apenas no bootstrap** da aplicação. Este documento não promete
  suporte a Expo Go.

---

# Parte II — Referência Global da API

**Labirinto do Saber — Referência Global da API**

> **Procedência:** este texto consolida os documentos de origem
> `api-reference.md`, `api-student-documents.md`, `api-ai-tasks.md` e
> `api-student-ai-analysis.md`, que o projeto de origem informa terem sido
> verificados por ele contra `src/application/modules/**/routes`. **Essa
> verificação foi feita pelo projeto de origem, não por esta tarefa.** O backend
> não está neste repositório e **não foi consultado** durante a criação deste
> documento. Nenhum arquivo deste repositório é declarado como substituto dos
> documentos de origem — este documento é uma transcrição e consolidação deles.

## Visão geral

- Framework: **Express v5**, hospedado em funções serverless da **Vercel**.
- URL de desenvolvimento: `http://localhost:3000`
- URL de produção: `https://labirinto-do-saber.vercel.app`
- **Não há prefixo `/api`** nem versionamento de rota (ex.: não existe `/v1`).
- Porta: `process.env.PORT`, com fallback para `3000`.
- Formato de corpo: `application/json`, exceto os endpoints de upload, que usam
  `multipart/form-data`.
- CORS: aberto para qualquer origem.
- `GET /api-docs`: interface Swagger UI. O `swagger.json` manual **pode estar
  desatualizado** em relação ao comportamento real — não tratar como fonte
  única de verdade.
- `GET /`: healthcheck. Resposta: `{"message":"Hello from Express from Vercel"}`.
- **Nota de rede para mobile:** o `localhost` de um dispositivo físico ou
  emulador **não é o mesmo** `localhost` do computador que roda o backend. O
  endereço acessível em desenvolvimento é uma questão de configuração do
  ambiente de desenvolvimento, e não muda nenhum caminho da API descrito aqui.

## Autenticação

- Esquema: **JWT assinado com HS256**, validade de **7 dias**.
- Payload do token: `{ id: '<educatorId>' }`.
- `POST /educator/sign-in` retorna `{ token: '<jwt>' }`.
- Toda requisição autenticada envia o header:
  `Authorization: Bearer <token>`.

**Mensagens exatas do middleware de autenticação em respostas 401** (preservar a
grafia literal, pois o cliente pode precisar comparar strings):

| Situação | Mensagem |
|---|---|
| Token ausente ou malformado | `Missing or invalid token` |
| Token inválido ou expirado | `Invalid or expired token` |
| Educador do token não existe mais | `Educator not found` |

**Exceções ao esquema Bearer:**

- `POST /appointment/notify` não usa Bearer. Usa o header `x-job-api-key` com um
  segredo interno. Em caso de chave ausente ou inválida, responde **401 com
  corpo vazio**.
- `POST /appointment/watchdog` é **público**, sem qualquer autenticação.

**Cobertura de autenticação por módulo:**

- Todos os endpoints de `student`, `task`, `ai-task`, `task-group`,
  `task-notebook`, `task-notebook-session`, `anamnese` (incluindo templates) são
  protegidos por Bearer.
- Em `appointment`, todos os demais endpoints (fora `notify` e `watchdog`) usam
  Bearer.
- Em `educator`, a exigência de autenticação **varia por rota** — está
  especificada individualmente em cada endpoint abaixo.

## Convenções de resposta e erros

**Códigos de sucesso:**

- `200`: dados em JSON, ou corpo vazio, conforme o endpoint.
- `201`: dados em JSON, ou corpo vazio, conforme o endpoint.
- `204`: sem corpo.

**Códigos de erro genéricos:**

- `400`: erro de validação ou de regra de negócio. Formato `{ message }` ou
  `{ message, errors: [...] }`.
- `401`: não autenticado. Formato `{ message }`.
- `403`: autenticado, mas sem permissão sobre o recurso. Formato `{ message }`.
- `404`: recurso inexistente. Formato `{ message }`.
- `409` / `422` / `429`: conflito, entidade não processável, ou excesso de
  requisições, respectivamente — todos no formato `{ message }`.
- `500`: `{ message: 'An unexpected error occurred', error: '<detalhe>' }`, ou,
  nos endpoints de IA, `{ message: '<CODE>', error: '<detalhe>' }`.

**Exemplo de erro de validação Zod:**

```json
{
  "message": "Validation error",
  "errors": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```

**Observações importantes que não devem ser "corrigidas" nesta documentação:**

- **Qualquer endpoint pode retornar 500** por causa de blocos try/catch
  genéricos no backend, mesmo quando não listado explicitamente abaixo.
- Alguns erros que são conceitualmente "não encontrado" são retornados como
  **500, não 404**, no backend real: `TASK_NOT_FOUND`, `TASK_GROUP_NOT_FOUND` e
  `TASK_NOTEBOOK_NOT_FOUND` (nas operações de update/delete). Esta documentação
  preserva esse comportamento como está, sem reclassificar os códigos.

## Uploads

Todos os uploads usam `multipart/form-data`. Campos escalares são enviados como
strings; arrays (como `alternatives` ou `learningTopics`) são enviados como uma
**string contendo JSON**; números (como `age`) são enviados como string e
convertidos no servidor.

| Endpoint | Campo de arquivo | Limite |
|---|---|---|
| `PUT /educator/update-profile-picture` | `photo` | 5 MB |
| `POST /student/create` | `photo` | 5 MB |
| `PUT /student/update/:id` | `photo` | 5 MB |
| `POST /student/:id/documents` | `document` | 10 MB |
| `POST /task/create` | `imageFile` e `audioFile` | 10 MB cada |
| `POST /task/upload-media` | `file` | 10 MB |
| `POST /anamnese/responses/upload-file` | `file` | 10 MB |

**Erro de tamanho excedido (todos os uploads), status `400`, grafia literal preservada:**

```json
{ "message": "THIS FILE IS TO LARGE" }
```

## Tipos compartilhados

Representados em notação TypeScript.

### Enums e uniões

```ts
type Gender = 'male' | 'female';

type TaskCategory = 'reading' | 'writing' | 'vocabulary' | 'comprehension';

type TaskType = 'multipleChoice' | 'multipleChoiceWithMedia';

type AnamneseQuestionType =
  | 'Descriptive'
  | 'MultipleChoice'
  | 'Checkbox'
  | 'FileUpload';

// Padrão: 'PENDING'
type AppointmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
```

### Educator

```ts
interface Educator {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  contact?: string;
}
```

### StudentDocument

```ts
interface StudentDocument {
  id: string;          // uuid gerado pelo servidor
  name: string;         // nome original do arquivo
  url: string;           // link público no storage
  uploadedAt: string;    // data/hora ISO
}
```

### Student

```ts
interface Student {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  zipcode: string;
  road: string;
  housenumber: string;
  phonenumber: string;
  learningTopics: string[];
  createdAt: string;
  educatorId: string;
  photoUrl: string | null;
  documents: StudentDocument[]; // [] quando o aluno não tem documentos
  educators: string[];
}
```

### Task, Alternative, TaskInput

```ts
interface Alternative {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Task {
  id: string;
  category: TaskCategory;
  type: TaskType;
  prompt: string;
  alternatives: { id: string; text: string; isCorrect: boolean }[];
  createdAt: string;
  imageFile?: string;
  audioFile?: string;
}

// Usado em POST /ai-task/generate (retorno) e POST /task/batch (entrada)
interface TaskInput {
  category: TaskCategory;
  type: TaskType;
  prompt: string;               // mínimo 1 caractere
  alternatives: Alternative[];  // mínimo 2, exatamente 1 correta
  imageFile?: string;           // URL — apenas para tipos com mídia
  audioFile?: string;           // URL — apenas para tipos com mídia
}
```

### TaskGroup

```ts
interface TaskGroup {
  id: string;
  name: string;
  tasksIds: string[];
  educatorId: string;
  category: TaskCategory;
}
```

### TaskNotebook

```ts
interface TaskNotebook {
  id: string;
  educator: string;
  tasks: string[];
  category: TaskCategory;
  description: string;
  createdAt: string;
  taskGroupsIds: string[];
}
```

### TaskNotebookSession

```ts
interface TaskNotebookSession {
  id: string;
  studentId: string;
  educatorId: string;
  name: string;
  startedAt: string;
  finishedAt?: string; // ausente = sessão ativa; preenchido = sessão finalizada
  answers: {
    taskId: string;
    selectedAlternativeId: string;
    isCorrect: boolean;
    timeToAnswer: number; // unidade não documentada — ver pendências da Parte I
    answeredAt: string;
  }[];
  observation?: string;
}
```

### AnamneseTemplate

```ts
interface AnamneseTemplate {
  id: string;
  educatorId: string;
  title: string;
  description?: string;
  questions: {
    id: string;
    text: string;
    type: AnamneseQuestionType;
    required: boolean;
    order: number;
    options: { id: string; text: string }[];
  }[];
  createdAt: string;
}
```

### AnamneseResponse

```ts
interface AnamneseResponse {
  id: string;
  templateId: string;
  educatorId: string;
  studentId: string;
  answers: {
    questionId: string;
    questionType: AnamneseQuestionType;
    textValue?: string;
    selectedOptionId?: string;
    selectedOptionIds?: string[];
    fileUrl?: string;
  }[];
  answeredAt: string;
}
```

### Appointment

```ts
interface Appointment {
  id: string;
  educatorId: string;
  studentId: string;
  scheduledAt: string; // ISO datetime
  observation?: string;
  status: AppointmentStatus;
  notifiedAt?: string;
  createdAt: string;
}
```

## Endpoints

Cada endpoint abaixo descreve método, caminho, exigência de autenticação, corpo
(body)/query/parâmetros de path quando informados, resposta com status, e
erros conhecidos. **Todo endpoint pode adicionalmente retornar 500 genérico**,
conforme a seção de convenções acima, mesmo quando não repetido em cada item.
Nenhuma validação ou resposta foi inventada além do que consta no material de
origem; onde algo não foi informado, o item permanece em aberto.

### Educator — 8 rotas

#### `POST /educator/sign-in`
- **Autenticação:** público.
- **Body:** `email: string` (e-mail válido), `password: string` (6–100 caracteres).
- **Resposta:** `200 { token: string }`.
- **Erros:** `400` validação; `401 INVALID_CREDENTIALS`; `500`.

#### `POST /educator/register`
- **Autenticação:** público.
- **Body:** `name: string` (3–100), `email: string` (e-mail válido), `password: string` (6–100).
- **Resposta:** `200 { id: '<uuid>', name: '<nome>' }`.
- **Erros:** `400` validação ou `EDUCATOR_ALREADY_EXISTS`; `500`.

#### `POST /educator/update-password`
- **Autenticação:** público.
- **Body:** `email: string` (e-mail válido), `newPassword: string` (6–100).
- **Resposta:** `200` vazio.
- **Erros:** `400` validação / `EDUCATOR_NOT_FOUND` / `PASSWORD_SAME_AS_OLD`; `500`.
- **Ver pendência de arquitetura:** não há campo de token neste endpoint (Parte I).

#### `PUT /educator/generate-token`
- **Autenticação:** público.
- **Body:** `educatorEmail: string` (e-mail válido).
- **Resposta:** `200` vazio; token é enviado por e-mail.
- **Erros:** `400` validação; `404 EDUCATOR_NOT_FOUND`; `500 INTERNAL_ERROR`.

#### `GET /educator/me`
- **Autenticação:** Bearer.
- **Resposta:** `200 Educator`.
- **Erros:** `401 NOT_AUTHENTICATED`; `404 EDUCATOR_NOT_FOUND`; `500`.

#### `GET /educator/get-last-sessions`
- **Autenticação:** Bearer.
- **Descrição:** retorna as últimas 2 sessões do educador autenticado.
- **Resposta:** `200 { studentName?: string, sessionName: string }[]`.
- **Erros:** `403 UNAUTHORIZED`; `404 EDUCATOR_NOT_FOUND` / `EDUCATOR_DOES_NOT_HAVE_SESSIONS`; `500 INTERNAL_ERROR`.

#### `PUT /educator/update-profile-picture`
- **Autenticação:** Bearer.
- **Body:** multipart, `photo` obrigatório, até 5 MB.
- **Resposta:** `200 Educator` completo.
- **Erros:** `400 UNAUTHORIZED` / `PROFILE_PICTURE_REQUIRED`; `404 EDUCATOR_DOES_NOT_EXISTS`; `500`.

#### `PUT /educator/update-educator`
- **Autenticação:** Bearer (e-mail do educador é resolvido a partir do token).
- **Body:** `newName?: string` (3–100), `newContact?: string` (3–100).
- **Resposta:** `200 Educator` completo.
- **Erros:** `400` validação; `401`; `404 EDUCATOR_NOT_FOUND`; `500`.

### Student — 5 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /student/create`
- **Body (multipart):** `name: string` (1–100), `age: number` (1–50),
  `gender: Gender`, `zipcode: string` (5–10), `road: string` (1–100),
  `housenumber: string` (1–10), `phonenumber: string` (7–15),
  `learningTopics: string[]` (mínimo 1, enviado como string JSON),
  `photo?: arquivo` (até 5 MB).
- **Comportamento:** o aluno criado é vinculado ao educador autenticado.
- **Resposta:** `201 Student` (com `documents: []`).
- **Erros:** `400` validação / `EDUCATOR_NOT_FOUND`; `401`; `500`.

#### `PUT /student/update/:id`
- **Path:** `id` (uuid).
- **Body (multipart):** todos os campos de `create`, porém opcionais;
  `learningTopics`, se enviado, exige mínimo 1; `photo` opcional.
- **Resposta:** `200 Student`.
- **Erros:** `400` validação / `STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`; `401`;
  `404 STUDENT_NOT_FOUND` / `EDUCATOR_NOT_FOUND`; `500`.

#### `POST /student/:id/documents`
- **Path:** `id` (uuid).
- **Body (multipart):** `document` obrigatório, até 10 MB.
- **Comportamento:** o aluno deve pertencer ao educador autenticado. **Acrescenta
  um documento** à lista existente — não a substitui. Para enviar vários
  arquivos, é preciso **uma chamada por arquivo**.
- **Resposta:** `200 Student` atualizado, com o novo item em `documents`.
- **Erros:** `400 FILE_REQUIRED` / `THIS FILE IS TO LARGE` /
  `STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`; `401` token ausente/inválido/expirado
  (ex.: `Missing or invalid token`); `404 STUDENT_NOT_FOUND` / `EDUCATOR_NOT_FOUND`.
- **Nota:** não existe um GET de documentos dedicado — `documents` já vem
  embutido nas respostas de `create`, `update` e `GET /student/`.

#### `POST /student/assign-educator`
- **Body:** `studentId: string` (uuid), `newEducatorEmail: string` (e-mail).
- **Resposta:** `200 Student`.
- **Erros:** `400` validação / `STUDENT_NOT_FOUND` /
  `STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR` / `NEW_EDUCATOR_NOT_FOUND`; `401`; `500`.

#### `GET /student/`
- **Descrição:** lista os alunos do educador autenticado.
- **Resposta:** `200 Student[]`.
- **Erros:** `401 UNHAUTHORIZED` (grafia preservada do material de origem); `500`.
- **Nota:** o caminho é `/student/`, com barra final — **não é** um parâmetro `:id`.

### Task — 7 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /task/create`
- **Body (multipart):** `category: TaskCategory`, `type: TaskType`,
  `prompt: string` (mínimo 1), `alternatives: { text: string, isCorrect: boolean }[]`
  (mínimo 2, enviado como string JSON), `imageFile?: arquivo` (10 MB),
  `audioFile?: arquivo` (10 MB).
- **Regras:** uma tarefa de texto não pode ter mídia; uma tarefa do tipo com
  mídia exige imagem ou áudio; pelo menos uma alternativa deve ser correta.
- **Resposta:** `201` vazio.
- **Erros:** `400 INVALID_ALTERNATIVES_FORMAT` / validação / `INVALID_TASK_DATA`;
  `500 TEXT_TASK_CANNOT_HAVE_MEDIA` / `MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO` /
  `AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT`.

#### `POST /task/batch`
- **Descrição:** salva várias tarefas de uma vez e cria um `TaskGroup`; as
  tarefas podem ser manuais ou geradas por IA, e mídias são referenciadas por
  URL (já enviadas antes via `upload-media`). **Valida todas as tarefas antes de
  qualquer escrita** (a validação prévia não é, por si só, garantia de
  atomicidade transacional).
- **Body:** `name: string` (mínimo 1), `category: TaskCategory`,
  `tasks: TaskInput[]` (mínimo 1).
- **Resposta:** `201 { taskGroup: TaskGroup, taskIds: string[] }` — os IDs
  retornados são os mesmos que aparecem em `taskGroup.tasksIds`.
- **Erros:**
  - `400 { message: 'Bad Request', errors: [...] }` de validação de schema;
  - `400 INVALID_TASK_DATA` para regras de negócio (número de alternativas,
    exatamente uma correta, regras de mídia);
  - `400 EMPTY_TASK_LIST`;
  - `404 EDUCATOR_NOT_FOUND`.

#### `POST /task/upload-media`
- **Body (multipart):** um único arquivo de imagem ou áudio em `file`, obrigatório, até 10 MB.
- **Descrição:** gera uma URL pública a ser usada em `imageFile`/`audioFile` de
  uma tarefa `multipleChoiceWithMedia` enviada depois via `task/batch` como
  `imageFile`/`audioFile` (URL). A IA **não gera mídia** — quando a tarefa é
  criada via `task/create`, o arquivo é enviado diretamente nesse endpoint,
  sem passar por `upload-media`.
- **Resposta:** `200 { url: 'https://<bucket>.s3.amazonaws.com/<chave>' }`.
- **Erros:** `400 FILE_REQUIRED` / `THIS FILE IS TO LARGE`.

#### `GET /task/`
- **Query:** `id?: string` (uuid), `category?: TaskCategory`, `type?: TaskType`,
  `promptContains?: string` (mínimo 1).
- **Resposta:** `200 Task[]`.
- **Erros:** `400` validação; `500 LIST_TASKS_FAILED`.
- **Nota:** o caminho é `/task/`, com barra final.

#### `GET /task/:id`
- **Path:** `id` (uuid).
- **Resposta:** `200 Task`.
- **Erros:** `400` validação; `500 TASK_ID_REQUIRED` / `INVALID_TASK_ID` /
  `TASK_NOT_FOUND` / `GET_TASK_FAILED`.

#### `PUT /task/update`
- **Body:** `id: string` (uuid, obrigatório), `category?: TaskCategory`,
  `type?: TaskType`, `prompt?: string` (mínimo 1),
  `alternatives?: { text: string, isCorrect: boolean }[]`, `imageFile?: string`,
  `audioFile?: string`.
- **Resposta:** `200` vazio.
- **Erros:** `400` validação; `500 INVALID_TASK_ID` / `TASK_NOT_FOUND` /
  `INVALID_TASK_DATA`.

#### `DELETE /task/delete/:id`
- **Path:** `id` (uuid).
- **Resposta:** `200 null`.
- **Erros:** `400` validação; `500 TASK_ID_REQUIRED` / `INVALID_TASK_ID` /
  `TASK_NOT_FOUND` / `DELETE_TASK_FAILED`.

### AI Task — 1 rota

#### `POST /ai-task/generate`
- **Autenticação:** Bearer.
- **Descrição:** usa Gemini para gerar tarefas de texto (`multipleChoice`);
  **não persiste** nada — o conteúdo deve ser revisado/editado e então enviado
  via `task/batch`.
- **Body:** `targetAudience: string` (mínimo 1; ex.: idade/perfil/dificuldades),
  `instructions: string` (mínimo 1), `quantity: number` (inteiro, 1–15),
  `category: TaskCategory`.
- **Resposta:** `200 { tasks: TaskInput[] }` — sempre `multipleChoice`, sem
  `imageFile`/`audioFile`.
- **Erros:**
  - `400 INVALID_QUANTITY` (fora de 1–15);
  - `400 { message: 'Bad Request', errors: [...] }` de validação;
  - `500 { message: 'AI_GENERATION_FAILED', error: '...' }` (falha no provedor);
  - `500 { message: 'AI_INVALID_OUTPUT', error: '...' }` (saída não parseável ou sem tarefas válidas).

### Task Group — 4 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /task-group/create`
- **Body:** `name: string` (mínimo 1), `tasksIds?: string[]` (uuids),
  `category: TaskCategory`.
- **Comportamento:** o grupo criado é vinculado ao educador autenticado (resolvido do token).
- **Resposta:** `200 TaskGroup`.
- **Erros:** `400` validação; `401 UNAUTHORIZED`; `404 EDUCATOR_NOT_FOUND` /
  `TASK_NOT_FOUND`; `500`.

#### `GET /task-group/list-by-educator`
- **Resposta:** `200 TaskGroup[]` do educador autenticado.
- **Erros:** `401 UNAUTHORIZED`.

#### `PUT /task-group/update`
- **Body:** `id: string` (uuid, obrigatório), `name?: string` (mínimo 1),
  `tasksIds?: string[]` (uuids), `educatorId?: string` (uuid),
  `category?: TaskCategory`.
- **Resposta:** `200` vazio.
- **Erros:** `400` validação; `500 INVALID_TASK_GROUP_ID` /
  `TASK_GROUP_NOT_FOUND` / `INVALID_TASK_GROUP_DATA` / `UPDATE_TASK_GROUP_FAILED`.

#### `DELETE /task-group/delete/:taskGroupId`
- **Path:** `taskGroupId` (uuid).
- **Resposta:** `200 null`.
- **Erros:** `400` validação; `500 TASK_GROUP_ID_REQUIRED` /
  `INVALID_TASK_GROUP_ID` / `TASK_GROUP_NOT_FOUND` / `DELETE_TASK_GROUP_FAILED`.

### Task Notebook — 4 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /task-notebook/create`
- **Body:** `tasks: string[]` (uuids, mínimo 1), `category: TaskCategory`,
  `description: string` (mínimo 1), `taskGroupsIds?: string[]` (uuids).
- **Comportamento:** a caderneta criada é vinculada ao educador autenticado (resolvido do token).
- **Resposta:** `200 TaskNotebook`.
- **Erros:** `400` validação; `404 EDUCATOR_DOES_NOT_EXISTS` /
  `TASKS_DOES_NOT_EXISTS`; `500 TASK_NOTEBOOK_CREATION_FAILED`.

#### `GET /task-notebook/`
- **Query:** `id?: string` (uuid), `educatorId?: string` (uuid),
  `category?: TaskCategory`, `descriptionContains?: string`.
- **Resposta:** `200 { notebook: TaskNotebook, taskGroups: TaskGroup[] }[]`.
- **Erros:** `400` validação; `500 LIST_TASKS_NOTEBOOKS_FAILED`.

#### `PUT /task-notebook/update`
- **Body:** `taskNotebookId: string` (uuid, obrigatório),
  `category?: TaskCategory`, `description?: string` (1–500),
  `taskGroupsIds?: string[]` (uuids).
- **Resposta:** `200` vazio.
- **Erros:** `400` validação; `500 INVALID_TASK_NOTEBOOK_ID` /
  `TASK_NOTEBOOK_NOT_FOUND` / `INVALID_TASK_NOTEBOOK_DATA`.

#### `DELETE /task-notebook/delete/:taskNotebookId`
- **Path:** `taskNotebookId` (uuid).
- **Resposta:** `200 null`.
- **Erros:** `400` validação; `500 TASK_NOTEBOOK_ID_REQUIRED` /
  `INVALID_TASK_NOTEBOOK_ID` / `TASK_NOTEBOOK_NOT_FOUND` /
  `DELETE_TASK_NOTEBOOK_FAILED`.

### Task Notebook Session — 10 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /task-notebook-session/start`
- **Body:** `studentId: string` (uuid), `name: string` (máximo 100).
- **Comportamento:** o educador da sessão é resolvido a partir do token (não é enviado no body).
- **Resposta:** `200 TaskNotebookSession`.
- **Erros:** `400` validação; `401`; `404 STUDENT_NOT_FOUND` /
  `NOTEBOOK_NOT_FOUND`; `500 SESSION_CREATION_FAILED` / `INTERNAL_SERVER_ERROR`.
- **Ver pendência de arquitetura:** o corpo não referencia a caderneta/conteúdo
  a ser respondido (Parte I).

#### `POST /task-notebook-session/answer`
- **Body:** `sessionId: string` (uuid), `taskId: string` (uuid),
  `selectedAlternativeId: string` (uuid), `timeToAnswer: number` (`>= 0`).
- **Resposta:** `200 TaskNotebookSession` atualizada.
- **Erros:** `400` validação / `SESSION_ALREADY_FINISHED` /
  `TASK_NOT_IN_NOTEBOOK` / `TASK_ALREADY_ANSWERED`; `404 SESSION_NOT_FOUND` /
  `TASK_NOT_FOUND` / `NOTEBOOK_NOT_FOUND`; `500 ANSWER_CREATION_FAILED`.
- **Ver pendência de arquitetura:** unidade de `timeToAnswer` não documentada;
  ausência de garantia de idempotência em reenvio (Parte I).

#### `POST /task-notebook-session/finish`
- **Body:** `sessionId: string` (uuid).
- **Comportamento:** preenche `finishedAt`.
- **Resposta:** `200 TaskNotebookSession` finalizada.
- **Erros:** `400` validação / `SESSION_ALREADY_FINISHED`;
  `404 SESSION_NOT_FOUND`; `500 SESSION_FINISH_FAILED`.

#### `POST /task-notebook-session/observation`
- **Pré-condição:** a sessão precisa **já estar finalizada**.
- **Body:** `sessionId: string` (uuid), `observation: string` (mínimo 1).
- **Resposta:** `200 TaskNotebookSession`.
- **Erros:** `400` validação / `SESSION_NOT_FINISHED`; `404 SESSION_NOT_FOUND`; `500`.

#### `GET /task-notebook-session/student/:studentId`
- **Path:** `studentId` (uuid).
- **Resposta:** `200 TaskNotebookSession[]` (vazio se não houver sessões).
- **Erros:** `400` validação.

#### `GET /task-notebook-session/report/:sessionId`
- **Path:** `sessionId` (uuid).
- **Resposta:**
```ts
{
  sessionName: string;
  totalTimeSession: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  averageCorrectTime: number | null;
  averageIncorrectTime: number | null;
  percentageByCategory: { [category: string]: number | null };
  percentageByType: { [type: string]: number | null };
  observation: string | null;
}
```
- **Erros:** `400` validação; `404 SESSION_NOT_FOUND`; `500`.

#### `GET /task-notebook-session/analysis/student/:studentId`
- **Path:** `studentId` (uuid).
- **Query:** `startDate?: string` (ISO), `endDate?: string` (ISO),
  `limit?: number` (inteiro positivo). `limit` **não é combinável** com
  `startDate`/`endDate`.
- **Resposta:**
```ts
{
  categories: {
    [c in TaskCategory]: {
      category: TaskCategory;
      total: number;
      correct: number;
      accuracy: number;
    };
  };
  total: { total: number; correct: number; accuracy: number };
  sessions: TaskNotebookSession[];
}
```
- **Erros:** `400` validação (inclusive `limit` combinado com datas);
  `404 STUDENT_NOT_FOUND`; `500`.

#### `POST /task-notebook-session/analysis/student/:studentId/snapshot`
- **Path:** `studentId` (uuid).
- **Query:** igual ao endpoint de análise acima, com a mesma exclusão entre
  `limit` e as datas.
- **Comportamento:** **gera e persiste** um snapshot de análise (diferente do
  endpoint de análise simples, que não persiste).
- **Resposta:** `200 StudentAnalysisReport`:
```ts
interface StudentAnalysisReport {
  studentId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  sessionIds: string[];
  categories: {
    category: TaskCategory;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
}
```
- **Erros:** `400` validação; `404 STUDENT_NOT_FOUND`; `500`.

#### `GET /task-notebook-session/analysis/student/:studentId/history`
- **Path:** `studentId` (uuid).
- **Resposta:** `200 StudentAnalysisReport[]` (vazio se não houver nenhum).
- **Erros:** `400` validação.

#### `GET /task-notebook-session/analysis/student/:studentId/ai`
- **Path:** `studentId` (uuid).
- **Descrição:** usa Gemini para gerar uma análise psicopedagógica textual
  extensa. **Não persiste** nada; complementa as análises numéricas dos demais
  endpoints deste módulo.
- **Query:** `limit?: number` (inteiro `> 0`, N sessões mais recentes),
  `startDate?: string` (ISO 8601 com offset), `endDate?: string` (ISO 8601 com
  offset), `templateId?: string` (uuid — inclui dados de anamnese na análise).
  `limit` não pode ser combinado com as datas. Sem nenhum filtro, considera
  todas as sessões do aluno.
- **Dados enviados à IA pelo servidor** (não pelo cliente): perfil do aluno
  (nome, idade, gênero, temas/objetivos de aprendizagem), métricas (acerto
  geral e por categoria), sessões (período, desempenho, tempo médio, observação
  e, por resposta, enunciado/categoria/acerto/tempo), e perguntas/respostas de
  anamnese em texto, caso `templateId` seja informado.
- **Resposta:** `200 { analysis: string }`, em Markdown, com as seções: Visão
  Geral; Maiores Acertos e Pontos Fortes; Principais Fraquezas e Dificuldades;
  Observações de Padrões; Pontos de Melhoria; Guia de Intervenção;
  Considerações Finais.
- **Erros:**
  - `400 { message: 'Bad Request', errors: [...] }` (id inválido, datas,
    combinação `limit` + datas);
  - `401 { message: 'Missing or invalid token' }`;
  - `404 STUDENT_NOT_FOUND`;
  - `500 { message: 'AI_ANALYSIS_FAILED', error: '...' }` — inclui casos de
    indisponibilidade do provedor (ex.: HTTP 503 do provedor de IA).

### Anamnese Template — 5 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /anamnese/templates/`
- **Body:** `title: string` (1–200), `description?: string` (máximo 1000),
  `questions: { text: string (mínimo 1), type: AnamneseQuestionType, required: boolean, options?: { text: string (mínimo 1) }[] }[]`.
- **Regra:** perguntas do tipo `MultipleChoice` e `Checkbox` exigem **pelo menos
  2 opções**.
- **Comportamento:** o template criado é vinculado ao educador autenticado (resolvido do token).
- **Resposta:** `201 AnamneseTemplate`.
- **Erros:** `400` validação; `401`.

#### `GET /anamnese/templates/`
- **Descrição:** lista os templates do educador autenticado.
- **Resposta:** `200 AnamneseTemplate[]`.
- **Erros:** `401`.

#### `GET /anamnese/templates/:templateId`
- **Path:** `templateId` (uuid).
- **Restrição:** acessível somente pelo próprio educador dono do template.
- **Resposta:** `200 AnamneseTemplate`.
- **Erros:** `400`; `401`; `403 UNAUTHORIZED` (não é o dono);
  `404 TEMPLATE_NOT_FOUND`; `500 INTERNAL_SERVER_ERROR`.

#### `PUT /anamnese/templates/:templateId`
- **Path:** `templateId` (uuid).
- **Body:** `title?: string` (1–200), `description?: string` (máximo 1000),
  `questions?: { text: string, type: AnamneseQuestionType, required: boolean, options?: { text: string }[] }[]`.
- **Resposta:** `200 AnamneseTemplate`.
- **Erros:** `400` validação / `TEMPLATE_HAS_RESPONSES` / `INVALID_TEMPLATE_DATA`;
  `401`; `403`; `404 TEMPLATE_NOT_FOUND`; `500`.

#### `DELETE /anamnese/templates/:templateId`
- **Path:** `templateId` (uuid).
- **Restrição:** não é permitido excluir um template que já tenha respostas.
- **Resposta:** `200 null`.
- **Erros:** `400 TEMPLATE_HAS_RESPONSES`; `401`; `403`;
  `404 TEMPLATE_NOT_FOUND`; `500`.

### Anamnese Response — 4 rotas

Todas as rotas deste módulo exigem **Bearer**.

#### `POST /anamnese/responses/upload-file`
- **Body (multipart):** `file` obrigatório, até 10 MB. Usado para perguntas do
  tipo `FileUpload`.
- **Resposta:** `200 { url: '<url-do-arquivo>' }`.
- **Erros:** `400 FILE_REQUIRED`; `401`; `500`.

#### `POST /anamnese/templates/:templateId/responses`
- **Path:** `templateId` (uuid).
- **Body:** `studentId: string` (uuid),
  `answers: { questionId: string (uuid), textValue?: string (mínimo 1), selectedOptionId?: string (uuid), selectedOptionIds?: string[] (uuids), fileUrl?: string (URL válida) }[]`.
- **Regra:** o campo preenchido em cada resposta deve ser coerente com o tipo
  da pergunta correspondente.
- **Resposta:** `200 AnamneseResponse`.
- **Erros:** `400` validação / `MISSING_REQUIRED_ANSWER` / `MISSING_TEXT_VALUE` /
  `MISSING_SELECTED_OPTION` / `MISSING_SELECTED_OPTIONS` / `MISSING_FILE_URL` /
  `INVALID_QUESTION_ID` / `INVALID_OPTION_ID`; `401`;
  `404 TEMPLATE_NOT_FOUND` / `STUDENT_NOT_FOUND`; `500`.

#### `GET /anamnese/responses/student/:studentId`
- **Path:** `studentId` (uuid).
- **Resposta:** `200 AnamneseResponse[]`.
- **Erros:** `401`.

#### `GET /anamnese/responses/:responseId`
- **Path:** `responseId` (uuid).
- **Restrição:** acessível somente pelo próprio educador.
- **Resposta:** `200 AnamneseResponse`.
- **Erros:** `401`; `403 UNAUTHORIZED`; `404 RESPONSE_NOT_FOUND`; `500`.

### Appointment — 7 rotas

#### `POST /appointment/notify`
- **Autenticação:** header `x-job-api-key` (chave de job interna), **não Bearer**.
  Uso interno/agendado (ex.: QStash).
- **Descrição:** envia notificações pendentes.
- **Resposta:** `200 { message: 'Notifications sent' }`.
- **Erros:** `401` corpo vazio, quando a chave está ausente ou inválida.
- **Nota:** este endpoint **não é chamado pelo cliente mobile**.

#### `POST /appointment/watchdog`
- **Autenticação:** público, sem autenticação.
- **Descrição:** rotina de reprocessamento/verificação.
- **Resposta:** `200 { message: 'Watchdog executed' }`.
- **Nota:** o fato de ser público é preservado tal como informado; este
  documento **não propõe** nenhuma integração mobile para ele.

#### `POST /appointment/`
- **Autenticação:** Bearer (educador autenticado).
- **Body:** `studentId: string` (uuid), `scheduledAt: string` (ISO datetime),
  `observation?: string`.
- **Resposta:** `201 Appointment`.
- **Erros:** `400` validação; `401`.

#### `GET /appointment/`
- **Autenticação:** Bearer.
- **Descrição:** lista os agendamentos do educador autenticado.
- **Resposta:** `200 Appointment[]`.
- **Erros:** `401`.

#### `GET /appointment/:id`
- **Autenticação:** Bearer.
- **Path:** `id` (uuid).
- **Resposta:** `200 Appointment`.
- **Erros:** `400 NOT_FOUND`; `401`.

#### `PUT /appointment/:id`
- **Autenticação:** Bearer.
- **Path:** `id` (uuid).
- **Body:** `scheduledAt?: string` (ISO datetime),
  `observation?: string | null` (`null` limpa a observação existente).
- **Resposta:** `200 Appointment`.
- **Erros:** `400 NOT_FOUND`; `401`.

#### `DELETE /appointment/:id`
- **Autenticação:** Bearer.
- **Path:** `id` (uuid).
- **Resposta:** `200` vazio/`null`.
- **Erros:** `400 NOT_FOUND`; `401`.

---

## Apêndice — Tabela consolidada dos 55 endpoints

O healthcheck (`GET /`) e o Swagger (`GET /api-docs`) são recursos de visão
geral da API e **não contam** entre os 55 endpoints de domínio listados abaixo.

| # | Método | Caminho | Auth | Descrição |
|---|---|---|---|---|
| 1 | POST | `/educator/sign-in` | Público | Login e emissão de JWT |
| 2 | POST | `/educator/register` | Público | Cadastro de educador |
| 3 | POST | `/educator/update-password` | Público | Redefinição de senha |
| 4 | PUT | `/educator/generate-token` | Público | Envio de token de autenticação por e-mail |
| 5 | GET | `/educator/me` | Bearer | Dados do educador autenticado |
| 6 | GET | `/educator/get-last-sessions` | Bearer | Últimas 2 sessões do educador |
| 7 | PUT | `/educator/update-profile-picture` | Bearer | Atualiza foto de perfil |
| 8 | PUT | `/educator/update-educator` | Bearer | Atualiza nome/contato do educador |
| 9 | POST | `/student/create` | Bearer | Cria aluno |
| 10 | PUT | `/student/update/:id` | Bearer | Atualiza aluno |
| 11 | POST | `/student/:id/documents` | Bearer | Adiciona documento ao aluno |
| 12 | POST | `/student/assign-educator` | Bearer | Reatribui aluno a outro educador |
| 13 | GET | `/student/` | Bearer | Lista alunos do educador |
| 14 | POST | `/task/create` | Bearer | Cria uma tarefa individual |
| 15 | POST | `/task/batch` | Bearer | Cria várias tarefas e um TaskGroup |
| 16 | POST | `/task/upload-media` | Bearer | Upload de mídia para tarefa |
| 17 | GET | `/task/` | Bearer | Lista/filtra tarefas |
| 18 | GET | `/task/:id` | Bearer | Detalha uma tarefa |
| 19 | PUT | `/task/update` | Bearer | Atualiza uma tarefa |
| 20 | DELETE | `/task/delete/:id` | Bearer | Remove uma tarefa |
| 21 | POST | `/ai-task/generate` | Bearer | Gera tarefas via IA (não persiste) |
| 22 | POST | `/task-group/create` | Bearer | Cria grupo de tarefas |
| 23 | GET | `/task-group/list-by-educator` | Bearer | Lista grupos do educador |
| 24 | PUT | `/task-group/update` | Bearer | Atualiza grupo de tarefas |
| 25 | DELETE | `/task-group/delete/:taskGroupId` | Bearer | Remove grupo de tarefas |
| 26 | POST | `/task-notebook/create` | Bearer | Cria caderneta de tarefas |
| 27 | GET | `/task-notebook/` | Bearer | Lista/filtra cadernetas |
| 28 | PUT | `/task-notebook/update` | Bearer | Atualiza caderneta |
| 29 | DELETE | `/task-notebook/delete/:taskNotebookId` | Bearer | Remove caderneta |
| 30 | POST | `/task-notebook-session/start` | Bearer | Inicia sessão de atividades |
| 31 | POST | `/task-notebook-session/answer` | Bearer | Registra resposta da sessão |
| 32 | POST | `/task-notebook-session/finish` | Bearer | Finaliza a sessão |
| 33 | POST | `/task-notebook-session/observation` | Bearer | Registra observação (sessão finalizada) |
| 34 | GET | `/task-notebook-session/student/:studentId` | Bearer | Lista sessões do aluno |
| 35 | GET | `/task-notebook-session/report/:sessionId` | Bearer | Relatório de uma sessão |
| 36 | GET | `/task-notebook-session/analysis/student/:studentId` | Bearer | Análise numérica do aluno |
| 37 | POST | `/task-notebook-session/analysis/student/:studentId/snapshot` | Bearer | Gera e persiste snapshot de análise |
| 38 | GET | `/task-notebook-session/analysis/student/:studentId/history` | Bearer | Histórico de snapshots de análise |
| 39 | GET | `/task-notebook-session/analysis/student/:studentId/ai` | Bearer | Análise psicopedagógica via IA |
| 40 | POST | `/anamnese/templates/` | Bearer | Cria modelo de anamnese |
| 41 | GET | `/anamnese/templates/` | Bearer | Lista modelos de anamnese |
| 42 | GET | `/anamnese/templates/:templateId` | Bearer | Detalha um modelo de anamnese |
| 43 | PUT | `/anamnese/templates/:templateId` | Bearer | Atualiza um modelo de anamnese |
| 44 | DELETE | `/anamnese/templates/:templateId` | Bearer | Remove um modelo de anamnese |
| 45 | POST | `/anamnese/responses/upload-file` | Bearer | Upload de arquivo para resposta |
| 46 | POST | `/anamnese/templates/:templateId/responses` | Bearer | Envia resposta de anamnese |
| 47 | GET | `/anamnese/responses/student/:studentId` | Bearer | Lista respostas de anamnese do aluno |
| 48 | GET | `/anamnese/responses/:responseId` | Bearer | Detalha uma resposta de anamnese |
| 49 | POST | `/appointment/notify` | `x-job-api-key` | Envia notificações pendentes (job interno) |
| 50 | POST | `/appointment/watchdog` | Público | Rotina de reprocessamento/verificação |
| 51 | POST | `/appointment/` | Bearer | Cria agendamento |
| 52 | GET | `/appointment/` | Bearer | Lista agendamentos do educador |
| 53 | GET | `/appointment/:id` | Bearer | Detalha um agendamento |
| 54 | PUT | `/appointment/:id` | Bearer | Atualiza um agendamento |
| 55 | DELETE | `/appointment/:id` | Bearer | Remove um agendamento |

**Total: 55 endpoints.**

## Limitações desta documentação

- O backend não está neste repositório e **não foi consultado** nesta tarefa;
  a referência de API é uma transcrição do material fornecido pelo usuário, não
  uma verificação independente contra código-fonte real.
- Nenhuma instalação, execução de aplicativo ou chamada de rede foi realizada
  para produzir este documento.
- As pendências de integração listadas na Parte I (associação de conteúdo em
  `start`, unidade de `timeToAnswer`, autorização de `update-password`, ausência
  de GET de sessão individual, e validação de versões de bibliotecas no
  bootstrap) permanecem **em aberto** e não foram resolvidas por suposição.
