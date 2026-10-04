# Utilitários de teste

`render.tsx` expõe `await render(...)` com o mesmo contrato da React Native Testing
Library 14; as interações assíncronas também usam `await`, por exemplo
`await fireEvent.press(...)`. Cada teste pode fornecer `wrapper` para acrescentar
providers quando eles existirem; a T-104 não instala nem cria `QueryClient`.

## Mocks nativos

- `expo-sqlite/kv-store`: `sqliteKvStoreMock` expõe uma classe `SQLiteStorage` em
  memória (API síncrona `getItemSync`/`setItemSync`/`removeItemSync`/`getAllKeysSync`/
  `clearSync`), isolada por `databaseName` (um banco por educador em produção). Isso
  não valida SQLite nativo nem comportamento em Hermes; a criptografia AES-256-GCM de
  `src/storage/mmkv.ts` roda de verdade sobre esse armazenamento fictício.
- `expo-crypto`: `expoCryptoMock` fornece `getRandomBytes`/`getRandomBytesAsync` com
  bytes aleatórios de verdade (via `globalThis.crypto.getRandomValues` do Node), só
  para evitar carregar o módulo nativo real (`expo-modules-core`) no Vitest. Testes
  que precisam de bytes determinísticos (ex.: `encryption-key.test.ts`) sobrescrevem
  esse mock localmente com `vi.mock("expo-crypto", ...)`.
- `expo-secure-store`: `secureStoreMock` armazena valores em memória e preserva a API
  assíncrona usada pelo aplicativo. Depois de `await cleanup()`, `afterEach` limpa valores,
  chamadas e overrides/`once`, então reinstala as implementações padrão; use
  `vi.spyOn(secureStoreMock, "getItemAsync").mockRejectedValue(...)` para simular erro.
- `expo-router`: `routerMock` contém spies de navegação, e `setLocalSearchParams(...)`
  controla os parâmetros retornados pelos hooks. O reset após cada teste limpa as chamadas
  e os parâmetros, mas não simula a integração real de navegação.

As fixtures devem permanecer fictícias e os testes não devem fazer chamadas ao backend.
