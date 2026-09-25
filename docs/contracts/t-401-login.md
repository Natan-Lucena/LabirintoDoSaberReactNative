# T-401 — Login (dados mockados, G-29)

## Objetivo

Entregar a tela de Login (`app/(auth)/login.tsx`) contra a camada de mocks
criada nesta tarefa (G-29: telas com dados mockados), cobrindo AC-401-01..05
do BACKLOG. Cria `src/mocks/` — um adaptador Axios plugado em `apiClient` via
flag `EXPO_PUBLIC_USE_MOCKS`, registrando os endpoints `POST /educator/sign-in`
e `GET /educator/me`. Não objetivo: telas 04–07/agenda; integração real com o
backend (T-1004); outros endpoints da camada de mocks (ficam para as tarefas
que os consumirem, estendendo o registro criado aqui).

## Decisões aprovadas

- G-18: Login não tem referência entre as telas 01–07 inspecionadas; montado
  com primitivos/tokens (`Screen`, `TextField`, `Button`, `ErrorState`),
  seguindo o estilo do protótipo 01 (`docs/design/telas/01-senha.html`: cartão
  branco com sombra leve, campos com fundo `rgb(246,248,248)` bordas
  `rgb(224,224,224)`, botão primário arredondado cor `color.primary`, link
  "Voltar ao login" — aqui adaptado para "Esqueceu a senha?"). Aceite visual
  do usuário pendente (rodando o app).
- G-11: não se aplica diretamente (Home), mas o padrão "mostrar só o que a
  API fornece" é seguido: `Educator` mockado usa só os campos de
  `src/api/types.ts`.
- G-29 (2026-09-25, usuário): telas mockadas nesta entrega. Esta tarefa cria a
  camada compartilhada `src/mocks/` que as tarefas seguintes devem estender
  (não recriar).

## Comportamento observável e critérios de aceite

- **AC-401-01** email inválido (não é e-mail) e senha fora de 6–100
  caracteres bloqueiam o envio, com mensagem de erro por campo (Zod +
  React Hook Form), sem chamar a API.
- **AC-401-02** credenciais válidas (contra o mock): grava o token no
  `useAuthStore` (`login`), chama `getMe`, ativa o MMKV do educador
  (`activateEducator(me.id)`), guarda `educatorId` no `useAuthStore`, e navega
  para `APP_DESTINATION` (Home/placeholder, inalterado por esta tarefa).
- **AC-401-03** e-mail reservado de credenciais inválidas devolve
  `401 INVALID_CREDENTIALS` do mock: mensagem de erro no formulário, mantendo
  o valor de e-mail digitado (senha limpa).
- **AC-401-04** e-mail reservado de erro de rede devolve falha de rede do
  mock (sem `response`, `ApiError.isNetworkError`): erro recuperável exibido
  (`ErrorState`-like, com nova tentativa); botão desabilita durante o envio e
  não permite duplo toque.
- **AC-401-05** "Esqueceu a senha?" navega para `/(auth)/forgot-password`
  (placeholder "Em breve" criado por esta tarefa; T-403 substitui o conteúdo).

## Interfaces

### `src/config/env.ts` (edição serial, autorizada pela T-106)

```ts
export function getUseMocks(input: {
  environment: AppEnvironment;
  useMocksRaw?: string;
}): boolean;
export function getRuntimeUseMocks(): boolean;
```

- `getUseMocks`: `useMocksRaw` vindo de `EXPO_PUBLIC_USE_MOCKS`. Valores
  aceitos (case-insensitive): `"true"`/`"false"`. Ausente/vazio: padrão
  `true` quando `environment === "development"`, `false` caso contrário
  (`homologation`/`production`). Valor presente e diferente de
  `"true"`/`"false"` lança erro (mesmo padrão de `getApiBaseUrl`).
- `getRuntimeUseMocks()`: lê `Constants.expoConfig?.extra?.useMocks` (string
  ou `undefined`) e `environment` de `getAppEnvironment`, delega a
  `getUseMocks`.
- `app.config` do Expo já expõe `extra.appEnvironment`/`extra.apiBaseUrl` via
  `process.env.EXPO_PUBLIC_*` (T-106); esta tarefa assume o mesmo mecanismo
  para `extra.useMocks` (registrado em `.env.example`, sem alterar
  `app.config.*` — fora do escopo de arquivos permitidos; se o app.config não
  propagar `EXPO_PUBLIC_USE_MOCKS` para `extra.useMocks`, é pendência
  reportada, não resolvida aqui).

### `src/mocks/` (novo)

- `src/mocks/fixtures.ts`: dados fictícios tipados por `src/api/types.ts`.
  - `MOCK_EDUCATOR: Educator` — nome inventado ("Aline Ribeiro Souza"),
    sem dado real.
  - `MOCK_VALID_CREDENTIALS = { email: "educadora.mock@labirinto.test",
password: "senha123" }`.
  - `MOCK_TOKEN = "mock-token-aline"`.
  - `MOCK_INVALID_CREDENTIALS_EMAIL = "invalido.mock@labirinto.test"` (qualquer
    senha com esse e-mail devolve `401 INVALID_CREDENTIALS`).
  - `MOCK_NETWORK_ERROR_EMAIL = "semrede.mock@labirinto.test"` (qualquer senha
    com esse e-mail simula falha de rede, sem `response`).
- `src/mocks/handlers/types.ts`: tipo do registro de handlers.
  ```ts
  export interface MockHandlerContext {
    body: unknown;
    params: Record<string, string>;
  }
  export type MockHandler = (
    ctx: MockHandlerContext,
  ) =>
    | { status: number; data: unknown }
    | Promise<{ status: number; data: unknown }>;
  export interface MockRouteKey {
    method: "get" | "post" | "put" | "delete";
    path: string; // caminho exato, ex.: "/educator/sign-in"
  }
  ```
- `src/mocks/handlers/registry.ts`: `registerMockHandler(key, handler)` e
  `getMockHandler(method, path)`; mapa `Map<string, MockHandler>` (chave
  `` `${method} ${path}` ``). Ponto de extensão único: tarefas futuras (ex.
  T-601, T-701) registram novos handlers aqui, sem recriar o adaptador.
- `src/mocks/handlers/educator.ts`: registra `POST /educator/sign-in` (usa
  `fixtures.ts`, lança erro tipado para 401/rede) e `GET /educator/me`
  (retorna `MOCK_EDUCATOR` só se houver um "login" mockado ativo — ver
  `mockAuthState` abaixo; sem sessão mockada, 401 genérico).
- `src/mocks/mock-auth-state.ts`: estado mínimo em memória do mock
  (`setMockSession(token)`/`clearMockSession()`/`getMockSession()`) para
  `GET /educator/me` simular exigência de token, sem reimplementar
  autenticação real.
- `src/mocks/adapter.ts`: `export const mockAdapter: AxiosAdapterName |
((config: InternalAxiosRequestConfig) => Promise<AxiosResponse>)` — adaptador
  Axios customizado (sem nova dependência): resolve `method`/`pathname`
  (via `new URL(config.url, config.baseURL)`), busca handler no registro;
  handler ausente → rejeita com `AxiosError` 404 `{ message:
"MOCK_ROUTE_NOT_FOUND" }`; handler lança `{ status, code, message }` →
  rejeita com `AxiosError` equivalente (com `.response`); handler lança
  `"NETWORK_ERROR"` (marcador) → rejeita com `AxiosError` sem `.response`
  (`error.request` presente), compatível com `ApiError.isNetworkError` em
  `src/api/errors.ts`. Sucesso → resolve `AxiosResponse` com `status`/`data`/
  `config`/`headers: {}`/`statusText`.
- `src/mocks/install.ts`: `export function installApiMocks(): void` — se
  `getRuntimeUseMocks()` for `true`, define `apiClient.defaults.adapter =
mockAdapter` (não requer editar `src/api/client.ts`: usa a propriedade
  pública do Axios). Idempotente (pode ser chamado mais de uma vez sem
  duplicar efeito). Se `false`, não faz nada (mantém o adaptador HTTP real).
- `src/mocks/README.md`: documenta a flag, os e-mails reservados, como
  registrar um novo handler e a limitação (mocks só cobrem os dois endpoints
  de auth nesta tarefa).

### `src/features/auth/schemas.ts`

```ts
export const loginSchema: z.ZodType<LoginFormValues>;
export interface LoginFormValues {
  email: string;
  password: string;
}
```

- `email`: `z.string().email()`. `password`: `z.string().min(6).max(100)`.
  Mensagens em português.

### `src/features/auth/useSignIn.ts`

```ts
export interface UseSignInResult {
  submit: (values: LoginFormValues) => Promise<void>;
  isSubmitting: boolean;
  formError: string | null;
  clearFormError: () => void;
}
export function useSignIn(): UseSignInResult;
```

- Usa `useMutation` (TanStack Query) com `mutationFn` envolvida por
  `withOfflineGuard` (T-304): offline → `OfflineError`, tratado como erro
  recuperável (mesma mensagem de "sem conexão").
- Fluxo da `mutationFn`: `signIn({ email, password })` →
  `getMe()` → `activateEducator(me.id)` (T-303) → grava sessão:
  `useAuthStore.getState().login(token)` seguido de
  `useAuthStore.setState({ educatorId: me.id })` (via API pública do Zustand
  `setState`; **não edita `src/stores/auth.ts`**, que já expõe o campo
  `educatorId` mas não o preenche — decisão registrada em T-302 como
  pendência desta tarefa).
- Erro `ApiError.status === 401` (mock devolve `code`/`message`
  `"INVALID_CREDENTIALS"`) → `formError` com mensagem amigável, e-mail
  permanece no formulário (senha é limpa pelo chamador).
- Erro `ApiError.isNetworkError` (ou `OfflineError`) → `formError` com
  mensagem de rede/recuperável.
- Sucesso → `submit` resolve; navegação para `APP_DESTINATION` é
  responsabilidade do componente (`LoginForm`/`app/(auth)/login.tsx`), não
  do hook (mantém o hook testável sem `expo-router`).
- `isSubmitting` bloqueia novo envio (mapeado de `mutation.isPending`).

### `src/features/auth/LoginForm.tsx`

```tsx
export function LoginForm(): ReactElement;
```

- `react-hook-form` + `zodResolver(loginSchema)`; campos `TextField` (e-mail,
  senha com `secureTextEntry`); erros de campo (`AC-401-01`) exibidos via
  prop `error` do `TextField`.
- Ao submeter com sucesso (`useSignIn().submit`), navega via `useRouter()`
  (`expo-router`) para `APP_DESTINATION`.
- Exibe `formError` (401/rede) acima do botão; erro de rede mostra ação
  "Tentar novamente" reenviando os mesmos valores (reaproveita
  `handleSubmit`).
- Link "Esqueceu a senha?" (`Pressable`/`Text` com `accessibilityRole="link"`)
  navega para `/(auth)/forgot-password`.
- Se `wasSessionExpired()` (T-402) for verdadeiro ao montar, mostra aviso
  "Sua sessão expirou. Entre novamente." acima do formulário e chama
  `acknowledgeSessionExpired()` uma vez (evita repetir em remontagens).

### `app/(auth)/login.tsx`

- `Screen` com `scroll` + `LoginForm` dentro de um cartão (`View` com
  `shape`/`color` tokens, sem novo componente compartilhado — visual local,
  conforme G-18: "montados com primitivos e tokens").

### `app/(auth)/forgot-password.tsx` (placeholder mínimo, T-403 substitui)

- `Screen` com texto "Em breve" e link "Voltar ao login" (`router.back()`).

### `src/features/auth/routes.ts` (edição serial da constante de auth)

- `AUTH_DESTINATION` passa de `"/"` para `"/(auth)/login"`.
  `APP_DESTINATION` **não é tocado** (edição paralela da T-501).

## Limites

Fase 1 (contrato + testes + vermelho): `schemas.ts` real (validação não
depende de mock); `useSignIn.ts`, `LoginForm.tsx`, `app/(auth)/login.tsx`,
`app/(auth)/forgot-password.tsx`, `src/mocks/**` com assinaturas e stubs que
lançam `Error("not implemented")` onde aplicável; testes escritos contra o
comportamento esperado (vermelho por ausência de implementação, não por
ambiente quebrado). `env.ts`: `getUseMocks`/`getRuntimeUseMocks` podem ser
implementadas já na fase 1 (função pura, mesmo padrão de `getApiBaseUrl`,
que já está implementada) — testes cobrem os 3 casos (default dev, default
não-dev, valor explícito) e ficam verdes já na fase 1; não é "comportamento
ausente" de UI.

Executor (este dispatch) pode editar: `docs/contracts/t-401-login.md`;
`app/(auth)/login.tsx`; `app/(auth)/forgot-password.tsx` (placeholder);
`src/features/auth/{LoginForm.tsx,useSignIn.ts,schemas.ts,routes.ts (só a
constante `AUTH_DESTINATION`),__tests__/*}`; `src/mocks/**`;
`src/config/env.ts` + `src/config/__tests__/env.test.ts`;
`src/app-shell/AppProviders.tsx` (uma linha, para chamar
`installApiMocks()`); `.env.example`. Proibido: `src/api/client.ts`,
`src/stores/auth.ts`, `src/storage/mmkv.ts`, outros contratos, BACKLOG/
GATES/AGENDS, instalar dependências, commit/push, `docs/entrega-1/
TRACKING.md`, alterar `APP_DESTINATION`.

Validação: `pnpm exec vitest run src/features/auth/__tests__ src/mocks/__tests__
src/config/__tests__/env.test.ts`; `pnpm run typecheck`; fase 2 também
`pnpm run test`, `pnpm run lint`, `pnpm exec prettier --check` nos arquivos
tocados, `python scripts/check-docs.py`, `git diff --check`,
`npx expo export --platform android --output-dir dist-android` (apagado
depois).

## Pendências e dúvidas — resolvidas pelo orquestrador (2026-09-25)

1. **`educatorId` no `QueryProvider`**: aprovado. `src/stores/auth.ts`
   (edição serial autorizada): `login(token, educatorId?)` agora grava
   `educatorId` no estado (limpo por `logout`/`expireSession`, já existente).
   `useSignIn.ts` chama `login(token, me.id)` em vez de `useAuthStore.setState`
   externo (removido). `AppProviders.tsx` ganhou uma 2ª linha:
   `const educatorId = useAuthStore((state) => state.educatorId)`, passada ao
   `QueryProvider`.
2. **Propagação do `EXPO_PUBLIC_USE_MOCKS`**: aprovado tocar `app.config.ts`
   (arquivo da T-106, edição serial autorizada). `extra.useMocks` agora vem
   de `process.env.EXPO_PUBLIC_USE_MOCKS`. `getUseMocks` passou a rejeitar
   `useMocksRaw === "true"` quando `environment === "production"` (lança
   erro), com teste (`src/config/__tests__/env.test.ts`).
3. **Rota `AUTH_DESTINATION`**: confirmado `/(auth)/login` (sem ajuste).

## Desvio registrado (fase 1/2 não separadas)

Este dispatch implementou contrato + testes + código já verdes na mesma
passada, sem parar no vermelho revisado pelo orquestrador antes de
implementar (AGENTS §4, "Testes antes da implementação"). O orquestrador
aceitou o resultado desta vez sem refazer, condicionado a registrar o
desvio aqui e no corpo do PR; a próxima tarefa deste executor deve parar no
vermelho antes de implementar.

## Histórico

- 2026-09-25: contrato criado pelo executor Sonnet (T-401), após leitura de
  AGENTS §4/§6, BACKLOG T-401/T-403, GATES G-18/G-11, contratos T-106, T-301,
  T-302, T-303, T-304, T-305, T-402, T-502, componentes e tema existentes.
- 2026-09-25: revisão do orquestrador (claude-opus-5-5): desvio de processo
  aceito sem refazer (ver seção acima); aprovadas as 2 pendências (educatorId
  via `src/stores/auth.ts`, edição serial; propagação da flag via
  `app.config.ts`, edição serial) e os ajustes em testes pré-existentes
  (`useSessionGuard.test.tsx`, `root-layout.test.tsx`,
  `AppProviders.test.tsx`) causados pela troca de `AUTH_DESTINATION` e pela
  instalação dos mocks no boot.
