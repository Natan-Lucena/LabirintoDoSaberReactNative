# Contrato T-304 — QueryClient, retry e conectividade

## 1. Objetivo e escopo

Fornecer um `QueryClient` único do TanStack Query com política de retry por tipo de
requisição (leitura vs. mutação) e por classe de erro (`ApiError`), ligar o estado de
rede do aparelho ao `onlineManager` do TanStack Query via NetInfo, expor um hook
`useOnline` para a UI, e persistir o cache de queries no MMKV criptografado do
educador ativo (`src/storage/mmkv.ts`, T-303), com limpeza pelo `clearQueryCache`
existente.

**Não objetivos:** montar o `QueryProvider` no root (`app/_layout.tsx` é da T-502);
implementar telas ou hooks de dados de domínio (T-601 em diante); política de retry
para WebSocket ou SSE (não usados nesta entrega).

## 2. Decisões aprovadas

- G-26: `@tanstack/react-query-persist-client` e `@tanstack/query-sync-storage-persister`
  autorizados, versão 5.103.2 (mesma linha do `@tanstack/react-query`).
- G-04: a limpeza de cache por logout/401 já é responsabilidade de `src/storage/mmkv.ts`
  (`clearAllForEducator`, `clearQueryCache`) e do listener `connectStorageToAuth`. Este
  contrato consome esse contrato existente; não duplica a política de limpeza.

## 3. Comportamento observável e critérios de aceite

- **AC-304-01** Sem retry automático para erros 4xx (`ApiError.status` entre 400 e 499
  inclusive); retry limitado (máx. 2 tentativas adicionais, backoff exponencial) para
  erros de rede (`ApiError.isNetworkError`), timeout (`ApiError.isTimeout`) e 5xx, mas
  **apenas em leituras** (queries).
- **AC-304-02** Mutações nunca fazem retry automático (`retry: false` para
  `defaultOptions.mutations`), independentemente do tipo de erro.
- **AC-304-03** Sem conexão (`onlineManager.isOnline() === false`): queries já
  cacheadas continuam exibindo os dados do cache (não entram em `pending` nem
  disparam refetch); mutações não são enviadas — ficam com `mutate` bloqueado e a UI
  recebe um aviso via `useOnline` (`isOnline: false`).
- **AC-304-04** O `render` de teste (`src/test-utils/render.tsx`) cria um `QueryClient`
  novo por chamada, com `retry: false` em queries e mutações e `gcTime`/`cacheTime`
  padrão, sem reaproveitar cache entre testes (R-04, serial).

## 4. Interfaces

### `src/api/query-client.ts`

```ts
export function createQueryClient(): QueryClient;
```

- `defaultOptions.queries.retry`: função `(failureCount, error) => boolean` — `false`
  se `error instanceof ApiError && error.status !== undefined && error.status >= 400 && error.status < 500`;
  senão `failureCount < 2` (rede/timeout/5xx).
- `defaultOptions.queries.retryDelay`: backoff exponencial padrão do TanStack Query.
- `defaultOptions.mutations.retry`: `false`.
- `defaultOptions.queries.networkMode`: `"online"`. **Ajuste durante a implementação
  (2026-09-24):** `"offlineFirst"` dispara a primeira tentativa mesmo offline (semântica
  do TanStack Query, confirmada em teste), o que buscaria a rede antes de mostrar o
  cache — incompatível com AC-304-03. `"online"` pausa a busca sem chamar `queryFn`
  enquanto offline e mantém os dados já em cache (`initialData`/cache persistido)
  visíveis, sem erro nem "pending" indevido.
- `defaultOptions.mutations.networkMode`: `"always"`. **Correção aprovada pelo
  orquestrador (2026-09-24):** o app não é offline-first para escrita (PROJECT §7,
  G-08): mutação nunca fica pausada aguardando reconexão para reenviar sozinha, pois
  isso violaria AC-304-02 e a política de reconciliação manual das tarefas de sessão/
  agenda. Toda `mutationFn` deve ser envolvida por `withOfflineGuard` (abaixo), que
  verifica `onlineManager.isOnline()` **antes** de chamar a função real e rejeita com
  `OfflineError` sem chamá-la quando offline; a UI trata esse erro como aviso
  explícito. Reconectar não dispara reenvio automático — só nova ação do usuário.

### `withOfflineGuard` e `OfflineError` (em `src/api/query-client.ts`)

```ts
export class OfflineError extends Error {}

export function withOfflineGuard<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): (variables: TVariables) => Promise<TData>;
```

Convenção obrigatória para os hooks de mutação das tarefas seguintes (T-704, T-802,
T-804, T-901, T-904, T-905): a `mutationFn` passada a `useMutation` deve ser o
retorno de `withOfflineGuard(mutationFnReal)`.

### `src/api/query-persister.ts`

```ts
export async function createQueryPersister(
  educatorId: string,
): Promise<Persister>;
export async function persistQueryClient(
  client: QueryClient,
  educatorId: string,
): Promise<() => void>;
```

`createQueryPersister` é assíncrona porque `getStorage` (T-303) depende da chave de
criptografia no SecureStore.

- Usa `createSyncStoragePersister` com um adaptador síncrono sobre o `MMKV` do
  educador ativo (`getStorage(educatorId)` de `src/storage/mmkv.ts`), chave
  `query:cache:<educatorId>` (prefixo `query:` já reconhecido por `clearQueryCache`).
- `persistQueryClient` chama `persistQueryClientRestore`/`persistQueryClient` da lib
  (`@tanstack/react-query-persist-client`) e devolve a função de `unsubscribe`.
- **Correção aprovada pelo orquestrador (2026-09-24):** `dehydrateOptions.shouldDehydrateMutation`
  sempre retorna `false` — mutações nunca são persistidas nem retomadas ao restaurar
  o cache (coerente com a proibição de reenvio automático acima).
- Chaves de cache por recurso e id seguem PROJECT §7 (ex.: `["student", studentId]`);
  este contrato não define chaves de domínio, apenas o armazenamento do cache serializado.

### `src/hooks/useOnline.ts`

```ts
export function useOnline(): boolean;
export function connectOnlineManagerToNetInfo(): () => void;
```

- `connectOnlineManagerToNetInfo` assina `NetInfo.addEventListener` e chama
  `onlineManager.setOnline(state.isConnected === true && state.isInternetReachable !== false)`.
  Retorna a função de unsubscribe.
- `useOnline` assina `onlineManager.subscribe` e retorna o valor atual via
  `useSyncExternalStore` (ou `onlineManager.isOnline()` + estado local).

### `src/api/QueryProvider.tsx`

```tsx
export function QueryProvider({
  educatorId,
  children,
}: {
  educatorId: string | null;
  children: ReactNode;
}): JSX.Element;
```

- Cria o `QueryClient` uma vez (`useState(() => createQueryClient())`), liga o
  `onlineManager` ao NetInfo, e quando `educatorId` não é nulo, persiste o cache via
  `persistQueryClient`. Não é montado no root nesta tarefa (T-502 o faz).

### `src/test-utils/render.tsx` (serial, R-04)

- Passa a aceitar `queryClient` opcional; por padrão cria um novo via
  `createQueryClient()` a cada chamada de `render` e envolve com
  `QueryClientProvider`, mantendo o `DefaultWrapper` atual para quem não precisa
  de queries. Nenhum teste existente que não usa queries deve quebrar.

## 5. Plano de testes

| Arquivo                                          | Cobre                                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/__tests__/query-client.test.ts`         | AC-304-01, AC-304-02: retry por status/tipo de erro em leitura e ausência de retry em mutação.                                                       |
| `src/api/__tests__/query-persister.test.ts`      | Persistência grava sob chave prefixada `query:` no MMKV do educador ativo; restaura ao recriar cliente; `clearQueryCache` remove o cache persistido. |
| `src/hooks/__tests__/useOnline.test.tsx`         | `useOnline` reflete mudanças do NetInfo; `connectOnlineManagerToNetInfo` atualiza `onlineManager`.                                                   |
| `src/test-utils/__tests__/render-query.test.tsx` | AC-304-03 (cache offline em leitura, mutação bloqueada com aviso) e AC-304-04 (QueryClient novo por teste, sem vazamento de cache entre execuções).  |

## 6. Tarefas, arquivos e modelos

| Item                   | Arquivo                                                                                                                                | Modelo                        | Esforço |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------- |
| Contrato               | `docs/contracts/t-304-query-client.md`                                                                                                 | Sonnet (C, conforme dispatch) | Médio   |
| Testes + implementação | `src/api/query-client.ts`, `src/api/query-persister.ts`, `src/api/QueryProvider.tsx`, `src/hooks/useOnline.ts`, testes correspondentes | Sonnet                        | Médio   |
| Wiring serial          | `src/test-utils/render.tsx`                                                                                                            | Sonnet                        | Médio   |

## 7. Comandos de validação

- `npx vitest run src/api/__tests__/query-client.test.ts src/api/__tests__/query-persister.test.ts src/hooks/__tests__/useOnline.test.tsx src/test-utils/__tests__/render-query.test.tsx`
- `pnpm run test` (regressão completa)
- `pnpm run typecheck`
- `pnpm run lint` (arquivos tocados)
- `npx prettier --check <arquivos tocados>`

## 8. Pendências e histórico

- 2026-09-24: contrato criado na T-304; persister autorizado por G-26; versões
  registradas em COMPATIBILIDADE §3/§4.
