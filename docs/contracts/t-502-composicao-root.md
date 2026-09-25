# Contrato T-502 — Composição do root e dono da integração transversal

## 1. Objetivo e escopo

Ligar a fundação (T-201, T-301, T-302, T-303, T-304, T-402) em um app
executável: compor `app/_layout.tsx` de fora para dentro (safe area → Gesture
Handler → `QueryProvider` → wiring de sessão → `SessionGuard` → navegação),
segurar o splash até fontes e reidratação do token terminarem, e ligar uma
única vez (com cleanup no unmount) o `tokenProvider` do `apiClient`, o
`connectStorageToAuth` e o `connectSessionExpiry`. Esta tarefa é a única dona
de `app/_layout.tsx`; as tarefas de fundação entregam módulos testados
isoladamente e não editam o root (T-402, decisão registrada).

**Não objetivos:** criar telas de produto (Login é T-401, Home é T-601+); rota
autenticada real (placeholder `"/"` de `src/features/auth/routes.ts` seguirá
até T-401/T-601); `educatorId` real para `QueryProvider` (permanece `null`
até a T-401 autenticar um educador — ver Pendências); montar
`ResumeSessionPrompt` (T-803, apenas o ponto de extensão comentado entra
aqui); AC-502-04/05 (`MAN`, pendentes de build autorizado).

## 2. Decisões aprovadas

- `connectSessionExpiry(queryClient)` (T-402) precisa da instância do
  `QueryClient` criada dentro de `QueryProvider` (T-304), que não a expõe.
  Decisão: o wiring roda em um componente filho de `QueryProvider`, usando
  `useQueryClient()` (`@tanstack/react-query`) para obter a mesma instância.
- `setTokenProvider` recebe uma função lazy (`() => useAuthStore.getState().token`),
  não o valor do token no momento do boot, para refletir login/expiração sem
  re-registrar o provider.
- `BootGate` chama `SplashScreen.preventAutoHideAsync()` uma vez, no módulo
  (fora do componente), como recomendado pela API do `expo-splash-screen`, e
  `hideAsync()` via efeito quando as fontes e a reidratação terminam.
- Falha ao carregar fonte (`fontError`) não trava o boot: conta como
  "resolvido" (fallback do sistema) e é registrada com `console.warn`.
- **Ajuste aprovado pelo orquestrador (revisão do vermelho, 2026-09-24):** o
  navegador (`Stack`) fica **sempre** montado; `BootGate` controla apenas o
  splash nativo (`preventAutoHideAsync`/`hideAsync`), nunca deixa de
  renderizar `children`. `useSessionGuard` (T-402) só navega quando
  `useRootNavigationState()?.key` está definido — edição serial autorizada
  em `src/features/auth/useSessionGuard.ts` para esse ponto específico, com
  teste — evitando "Attempted to navigate before mounting the Root Layout"
  no primeiro boot com sessão já salva.

## 3. Comportamento observável e critérios de aceite

| ID        | Resultado                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-502-01 | Root renderizado com API mockada: `status === "unauthenticated"` leva ao destino `AUTH_DESTINATION`; `status === "authenticated"` leva a `APP_DESTINATION` (ambos hoje `"/"`, ver T-402). — `CT`                 |
| AC-502-02 | O `BootGate` não libera os `children` (splash mantido) antes de `fontsLoaded \|\| fontError` **e** `authStatus !== "idle"`; uma falha de fonte (`fontError`) não impede o boot de terminar. — `CT`               |
| AC-502-03 | Um evento de sessão expirada (`subscribeSessionExpired`) dispara `connectSessionExpiry`: `queryClient.clear()` roda e o guard passa a apontar para `AUTH_DESTINATION` (integração T-301 + T-304 + T-402). — `CT` |
| AC-502-04 | Voltar do Android no Login não retorna à rota autenticada. — `MAN`, pendente de build autorizado.                                                                                                                |
| AC-502-05 | O app abre no alvo de desenvolvimento com as fontes do DESIGN aplicadas. — `MAN`, pendente de build autorizado.                                                                                                  |

As ligações de boot (`setTokenProvider`, `connectStorageToAuth`,
`connectSessionExpiry`, `hydrate`) ocorrem uma única vez por montagem do root
e são desfeitas (`unsubscribe`) no unmount — verificado nos testes de
`AppProviders`.

## 4. Interfaces

### `src/app-shell/AppProviders.tsx`

```tsx
export function AppProviders({ children }: PropsWithChildren): ReactElement;
```

- Monta `QueryProvider` (T-304) com `educatorId={null}` (documentado: T-401
  preenche o `educatorId` real após o login; até lá o cache de queries não é
  persistido em MMKV, apenas mantido em memória).
- Componente interno (`AppShellWiring`), filho de `QueryProvider`, usa
  `useQueryClient()` e, em um único `useEffect` (deps `[queryClient]`):
  - `setTokenProvider(() => useAuthStore.getState().token)`;
  - `connectStorageToAuth()` (T-303) → `unsubscribeStorage`;
  - `connectSessionExpiry(queryClient)` (T-402) → `unsubscribeSessionExpiry`;
  - `void useAuthStore.getState().hydrate()` (T-302);
  - cleanup: chama `unsubscribeStorage()` e `unsubscribeSessionExpiry()`.
- Ponto de extensão comentado para T-803 (`ResumeSessionPrompt`), dentro da
  árvore do `QueryProvider`, para que o componente tenha acesso a queries.

### `src/app-shell/BootGate.tsx`

```tsx
export function useBootReady(): boolean;
export function BootGate({ children }: PropsWithChildren): ReactElement | null;
```

- `useBootReady()`: combina `useAppFonts()` (T-201) e
  `useAuthStore((s) => s.status)` (T-302). Pronto quando
  `(fontsLoaded || fontError) && status !== "idle"`. Um `fontError` é
  registrado (`console.warn`) e tratado como não bloqueante.
- `BootGate`: **sempre** renderiza `children` (o navegador/`Stack` nunca é
  desmontado); quando `useBootReady()` fica `true`, chama
  `SplashScreen.hideAsync()` em efeito. O splash nativo continua cobrindo a
  tela até `hideAsync()` rodar, mesmo com o `Stack` já montado por baixo —
  ajuste aprovado pelo orquestrador para permitir que
  `useRootNavigationState()` (usado por `useSessionGuard`, T-402) resolva
  antes do guard tentar navegar.
- `SplashScreen.preventAutoHideAsync()` é chamado uma vez no módulo.

### `app/_layout.tsx`

Composição de fora para dentro:

```tsx
<SafeAreaProvider>
  <GestureHandlerRootView style={{ flex: 1 }}>
    <AppProviders>
      <SessionGuard>
        <BootGate>
          <Stack screenOptions={{ headerShown: false }} />
        </BootGate>
      </SessionGuard>
    </AppProviders>
  </GestureHandlerRootView>
</SafeAreaProvider>
```

`SessionGuard` (T-402) fica fora do `BootGate` porque sua navegação
(`router.replace`) não depende de fontes/splash; `BootGate` só decide o que é
visível enquanto o boot não termina.

## 5. Plano de testes

`src/app-shell/__tests__/AppProviders.test.tsx` (AC-502-01, AC-502-03,
ligações únicas/cleanup): mocka `@/api/client` (`setTokenProvider`),
`@/storage/mmkv` (`connectStorageToAuth`) e `@/features/auth/session-expiry`
(`connectSessionExpiry`, dublê — o comportamento interno de limpar o cache
num evento de sessão expirada já é validado pelos testes da T-402; aqui
valida-se a integração de composição). Casos:

- Monta uma vez: `setTokenProvider`, `connectStorageToAuth` e
  `connectSessionExpiry` chamados exatamente uma vez; `connectSessionExpiry`
  recebe a instância real do `QueryClient` criado por `QueryProvider`
  (`toBeInstanceOf(QueryClient)`); `hydrate` chamado uma vez.
- Unmount chama as funções de `unsubscribe` retornadas por
  `connectStorageToAuth` e `connectSessionExpiry`.

`src/app-shell/__tests__/BootGate.test.tsx` (AC-502-02): mocka
`expo-splash-screen` e `@/theme/fonts` (`useAppFonts`); usa `@/stores/auth`
real (`status`). **Ajuste aprovado pelo orquestrador:** o `Stack`
(`children`) fica sempre montado — `BootGate` só controla
`SplashScreen.hideAsync()`, nunca deixa de renderizar o navegador (evita
"Attempted to navigate before mounting the Root Layout"). Casos:

- `status === "idle"` e fontes não carregadas: `children` (`Stack`)
  renderizam mesmo assim; `SplashScreen.hideAsync` não é chamado.
- Fontes carregadas e `status !== "idle"`: `children` renderizam;
  `hideAsync` chamado uma vez.
- `fontError` presente (fontes não carregadas) e `status !== "idle"`:
  `children` renderizam, `hideAsync` chamado (fallback, não bloqueia).

`src/app-shell/__tests__/root-layout.test.tsx` (AC-502-01, integração):
renderiza `app/_layout.tsx` com `@/stores/auth` mockado para
`status: "unauthenticated"` e depois `"authenticated"`, `expo-router`
mockado (`useRouter`, `usePathname`, `useRootNavigationState`, `Stack`
substituído por um marcador de texto) e fontes já carregadas. Casos:

- Guard chama `router.replace` com `AUTH_DESTINATION`/`APP_DESTINATION`
  conforme o status; nenhuma navegação em `status === "idle"`.
- `Stack` (marcador) renderiza mesmo com fontes ainda carregando
  (`fontsLoaded: false`), confirmando que `BootGate` não desmonta o
  navegador.
- **Ajuste aprovado pelo orquestrador:** com `useRootNavigationState()?.key`
  indefinido, o guard não navega; ao ficar definido (re-render), navega uma
  única vez. Isso exigiu uma edição serial autorizada em
  `src/features/auth/useSessionGuard.ts` (T-402): o efeito de navegação
  agora também depende de `navigationKey` e não roda enquanto ele for
  `undefined` (evita "Attempted to navigate before mounting the Root
  Layout" no primeiro boot com sessão salva). Teste correspondente
  adicionado em `src/features/auth/__tests__/useSessionGuard.test.tsx`.

## 6. Tabela de tarefas

| Arquivo                          | Dono            | Depende de                        |
| -------------------------------- | --------------- | --------------------------------- |
| `src/app-shell/AppProviders.tsx` | Executor Sonnet | T-301, T-302, T-303, T-304, T-402 |
| `src/app-shell/BootGate.tsx`     | Executor Sonnet | T-201, T-302                      |
| `app/_layout.tsx`                | Executor Sonnet | AppProviders, BootGate, T-402     |
| `src/app-shell/__tests__/*`      | Executor Sonnet | —                                 |

Modelo/esforço: Sonnet, médio (classe C, integração transversal).

## 7. Comandos de validação

- `pnpm exec vitest run src/app-shell/__tests__`
- `pnpm run typecheck`
- Fase 2 também: `pnpm run test`, `pnpm run lint`,
  `pnpm exec prettier --check <arquivos tocados>`,
  `python scripts/check-docs.py`, `git diff --check`,
  `npx expo export --platform android --output-dir dist-android` (descartado
  depois).

## 8. Pendências e histórico

- `educatorId` de `QueryProvider` permanece `null` até a T-401 autenticar um
  educador real e expor seu id (cache de queries não persiste em MMKV até
  lá).
- AC-502-04 (voltar do Android) e AC-502-05 (fontes no aparelho): `MAN`,
  pendentes de build nativo autorizado.
- Ponto de extensão para `ResumeSessionPrompt` (T-803): comentário em
  `AppProviders.tsx`, dentro da árvore do `QueryProvider`.
- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-502, após leitura de AGENTS §4/§6, BACKLOG (T-502),
  contratos T-201/T-301/T-302/T-303/T-304/T-402, `app/_layout.tsx` e
  `app/(auth)/_layout.tsx` atuais, e `src/test-utils/README.md`.
