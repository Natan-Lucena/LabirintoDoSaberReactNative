# T-302 - Token seguro e store de autenticação

## Objetivo

Expor o armazenamento seguro do token de sessão e o estado de autenticação do
app (Zustand), sem implementar comportamento nesta fase (fase vermelha:
contrato + testes + stubs sem comportamento). A ligação com `apiClient`
(`setTokenProvider`/`subscribeSessionExpired`) e a guarda de rotas são da
T-402/T-502; aqui só se expõe o que essas tarefas vão consumir.

## Critérios

| ID        | Resultado                                                                                |
| --------- | ---------------------------------------------------------------------------------------- |
| AC-302-01 | Token só é gravado via `expo-secure-store`; nenhum outro armazenamento o recebe. — `UT`  |
| AC-302-02 | `logout` apaga o token e emite evento de limpeza para assinantes. — `UT`                 |
| AC-302-03 | Reidratação ao abrir o app restaura estado autenticado sem chamada de rede extra. — `UT` |

## Interfaces

### `src/features/auth/token-storage.ts`

- Único ponto de leitura/gravação/remoção do token de sessão; usa **somente**
  `expo-secure-store` (`getItemAsync`/`setItemAsync`/`deleteItemAsync`).
- Chave fixa documentada: `"labirinto.auth.token"`.
- Funções expostas:
  - `getToken(): Promise<string | null>` — lê o token; retorna `null` se ausente.
  - `saveToken(token: string): Promise<void>` — grava o token.
  - `clearToken(): Promise<void>` — remove o token.
- Falha do SecureStore (rejeição da Promise) propaga o erro; não é engolida
  nem convertida em token vazio.

### `src/stores/auth.ts`

- Store Zustand com o estado mínimo necessário para T-401/T-402/T-502
  consumirem:
  - `status: "idle" | "authenticated" | "unauthenticated"` — `"idle"` antes da
    reidratação terminar (usado pelo `BootGate` da T-502 para segurar o splash).
  - `token: string | null`.
  - `educatorId: string | null` — **não preenchido nesta tarefa**: a API não
    devolve `educatorId` no `sign-in` (só `{ token }`, conforme T-305); exigiria
    chamada extra a `GET /educator/me`, fora do escopo de "sem chamada de rede
    extra" do AC-302-03. Campo mantido como `null` até T-401 (que já chama
    `getMe`) decidir como/quando populá-lo. Não inventado aqui.
- Ações:
  - `login(token: string): Promise<void>` — grava o token via `token-storage`,
    atualiza `status`/`token` para autenticado.
  - `logout(): Promise<void>` — apaga o token via `token-storage`, zera
    `token`/`educatorId`, define `status = "unauthenticated"` e **notifica os
    assinantes** de limpeza com `{ reason: "logout" }` (ver abaixo). Política
    G-04: logout apaga token e cache (de outros módulos, como T-303/MMKV) —
    aqui só o evento é emitido; quem limpa MMKV é a T-303, que assina o evento.
  - `expireSession(): Promise<void>` — mesmo efeito de `logout()` sobre o
    token/estado (apaga via `token-storage`, zera `token`/`educatorId`,
    `status = "unauthenticated"`), mas notifica os assinantes com
    `{ reason: "sessionExpired" }`. Distingue, para G-04, a expiração de
    sessão (401 — preserva cache do mesmo educador, conforme T-303/T-402) do
    logout explícito (apaga tudo). Será chamada pela T-402 ao reagir ao
    evento de 401 de `subscribeSessionExpired` (`src/api/client.ts`); esta
    tarefa **não** liga a `client.ts`, só expõe a ação.
  - `hydrate(): Promise<void>` — lê o token existente via `token-storage`
    (sem request HTTP) e define `status` como `"authenticated"` (token
    presente) ou `"unauthenticated"` (ausente). Chamada uma vez na abertura do
    app (T-502/`BootGate`).
- Evento de limpeza para outros módulos assinarem:
  - `type AuthClearedReason = "logout" | "sessionExpired"`.
  - `subscribeAuthCleared(listener: (event: { reason: AuthClearedReason }) =>
void): () => void` — registra um ouvinte chamado sempre que `logout()`
    ou `expireSession()` rodam, com o motivo correspondente; retorna função
    de cancelamento (mesmo padrão de `subscribeSessionExpired` em
    `src/api/client.ts`, mas **desacoplado**: este módulo não importa
    `client.ts`, nem altera-o). A T-402 (guarda de rotas) e a T-303 (limpeza
    de MMKV, que decide o que apagar por `reason`, conforme G-04) assinam
    este evento.
- **Fora de escopo desta tarefa** (registrado para não ser "corrigido"):
  chamar `setTokenProvider`/`subscribeSessionExpired` de `src/api/client.ts`;
  redirecionar rotas; limpar MMKV; decidir o que cada `reason` apaga no MMKV
  (G-04) — essas ligações são da T-402/T-303/T-502, que assinam
  `subscribeAuthCleared` e/ou compõem o `tokenProvider` a partir deste store.

## Limites

Fase 1 (contrato + testes + vermelho): `token-storage.ts` e `auth.ts` contêm
apenas assinaturas de tipo e stubs que lançam `Error("not implemented")` —
nenhum comportamento real, nenhuma chamada a `expo-secure-store` ainda.

Executor pode editar apenas: `docs/contracts/t-302-token-auth-store.md`;
`src/features/auth/token-storage.ts`;
`src/features/auth/__tests__/token-storage.test.ts`; `src/stores/auth.ts`;
`src/stores/__tests__/auth.test.ts`; `docs/entrega-1/TRACKING.md`. Proibido:
alterar `src/api/client.ts`, `src/api/errors.ts`, outros contratos,
AGENTS/BACKLOG/GATES, instalar dependências, commit/push, chamar backend
real, dados reais de crianças.

Validação: `pnpm exec vitest run
src/features/auth/__tests__/token-storage.test.ts
src/stores/__tests__/auth.test.ts`; `pnpm run typecheck`; na fase 2 também
`pnpm run test`, `pnpm run lint`, `pnpm exec prettier --check` e
`python scripts/check-docs.py`.

## Pendências

- `educatorId` não populado nesta tarefa (ver acima); decisão de como/quando
  preenchê-lo fica com T-401.
- Ligação com `apiClient` (`setTokenProvider`/`subscribeSessionExpired`) e
  guarda de rotas: T-402/T-502.
- Limpeza de MMKV no evento de `logout`/401 (G-04): T-303, via
  `subscribeAuthCleared`.
- Fase 2 (implementação real) depende de aprovação do vermelho pelo
  orquestrador antes de prosseguir.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-302, após leitura de AGENTS §4/§6, BACKLOG
  (T-302), GATES G-04, contrato T-301, `src/api/client.ts`,
  `src/test-utils/mocks.ts`/`README.md` e contrato T-305 (formato).
