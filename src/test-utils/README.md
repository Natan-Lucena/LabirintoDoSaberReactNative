# Utilitários de teste

`render.tsx` expõe `await render(...)` com o mesmo contrato da React Native Testing
Library 14; as interações assíncronas também usam `await`, por exemplo
`await fireEvent.press(...)`. Cada teste pode fornecer `wrapper` para acrescentar
providers quando eles existirem; a T-104 não instala nem cria `QueryClient`.

## Mocks nativos

- `react-native-nitro-modules`: o setup fornece apenas `NitroModules.createHybridObject`.
  O `react-native-mmkv` usa sua instância em memória no ambiente de teste; isso não
  valida criptografia, armazenamento nativo ou comportamento em Hermes.
- `expo-secure-store`: `secureStoreMock` armazena valores em memória e preserva a API
  assíncrona usada pelo aplicativo. Depois de `await cleanup()`, `afterEach` limpa valores,
  chamadas e overrides/`once`, então reinstala as implementações padrão; use
  `vi.spyOn(secureStoreMock, "getItemAsync").mockRejectedValue(...)` para simular erro.
- `expo-router`: `routerMock` contém spies de navegação, e `setLocalSearchParams(...)`
  controla os parâmetros retornados pelos hooks. O reset após cada teste limpa as chamadas
  e os parâmetros, mas não simula a integração real de navegação.

As fixtures devem permanecer fictícias e os testes não devem fazer chamadas ao backend.
