# T-402 - Guarda de rotas e expiração de sessão

## Objetivo

Expor a decisão de destino de navegação a partir do estado do `useAuthStore`
(T-302) e a ligação entre o evento de 401 do `apiClient` (T-301) e a limpeza da
sessão/cache em memória (T-304), sem montar nada no root do app (T-502) e sem
criar telas de produto (Login é da T-401).

## Escopo

- `useSessionGuard`/`SessionGuard`: decide o destino de navegação a partir de
  `useAuthStore().status`, sem chamar rede.
- `connectSessionExpiry(queryClient)`: assina `subscribeSessionExpired` do
  `apiClient` (T-301), chama `expireSession()` do `useAuthStore` (T-302), limpa
  o cache em memória do `QueryClient` recebido por parâmetro (conforme G-04:
  401 preserva o fluxo de sessão do MMKV, que é limpo pela T-303 via
  `subscribeAuthCleared`; aqui só o `QueryClient` em memória é afetado) e
  registra um aviso para a tela de Login. Retorna `unsubscribe`.
- `app/(auth)/_layout.tsx` mínimo: apenas um `Stack` do grupo, sem telas.

## Não objetivos

- Montagem no root (`app/_layout.tsx`), `AppProviders`/`BootGate`: T-502.
- Tela de Login ou qualquer tela de produto: T-401 (e seguintes).
- Alterar `src/api/client.ts`, `src/stores/auth.ts` ou `src/storage/**`.
- `AC-402-03`/`AC-502-04` ("voltar do Android não retorna à rota autenticada"):
  movido para T-502 (ID mantido sem uso, conforme BACKLOG).

## Decisão sobre rotas (typedRoutes)

`app.json` tem `experiments.typedRoutes: true`. Não existem ainda `app/(auth)/login.tsx`
(T-401) nem uma rota autenticada real (T-502/T-601+); o único arquivo de rota
hoje é `app/index.tsx`. Um `Href` literal para uma rota inexistente não compila.

**Decisão (FX3, aprovada pelo orquestrador, ver histórico):** os destinos ficam
num módulo único, `src/features/auth/routes.ts` (`AUTH_DESTINATION`/
`APP_DESTINATION`). O guard usa `useSegments()` para identificar a fronteira do
grupo `(auth)`: autenticado só substitui para `APP_DESTINATION` se
`segments[0] === "(auth)"`; deslogado só substitui para `AUTH_DESTINATION` se
não estiver nesse grupo. Assim, rotas autenticadas como tabs, sessão e shell
permanecem acessíveis, login/recuperação continuam acessíveis ao deslogado e
não há replace repetido dentro do grupo correto.

## Critérios

| ID        | Resultado                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-402-01 | `useSessionGuardTarget()` retorna `"idle"` (sem redirecionar), `"auth"` (status `unauthenticated`) ou `"app"` (`authenticated`), refletindo `useAuthStore().status`. Em `"idle"` nenhuma navegação ocorre. — `UT`/`CT`                                                                                                                                                        |
| AC-402-02 | `connectSessionExpiry(queryClient)` reage a `subscribeSessionExpired`: chama `expireSession()`, executa `queryClient.clear()`, registra aviso (`wasSessionExpired() === true`) e não lança exceção. Sign-in com 401 `INVALID_CREDENTIALS` não aciona nada aqui, pois o `apiClient` (T-301) já não emite o evento para essa rota. `unsubscribe()` cancela a assinatura. — `CT` |

## Interfaces

### `src/features/auth/useSessionGuard.ts`

- `type SessionGuardTarget = "idle" | "auth" | "app"`.
- `useSessionGuardTarget(): SessionGuardTarget` — deriva de `useAuthStore((s) => s.status)`.
- `useSessionGuard(): void` — hook de efeito: quando `target !== "idle"`, usa
  `useSegments()`. Para `"app"`, chama `router.replace(APP_DESTINATION)` somente
  se o grupo atual for `(auth)`; para `"auth"`, chama
  `router.replace(AUTH_DESTINATION)` somente fora desse grupo. Não altera estado,
  não faz chamada de rede.

### `src/features/auth/routes.ts`

- `AUTH_DESTINATION` / `APP_DESTINATION`: constantes de rota (hoje ambas `"/"`,
  placeholder). Único lugar a trocar quando T-401/T-502 criarem as rotas reais.

### `src/features/auth/SessionGuard.tsx`

- Componente `SessionGuard({ children })`: chama `useSessionGuard()` e
  renderiza `children` (o próprio consumidor decide o que mostrar em `"idle"`,
  ex.: `BootGate` da T-502 mantém o splash).

### `src/features/auth/session-expiry.ts`

- `connectSessionExpiry(queryClient: QueryClient): () => void` — assina
  `subscribeSessionExpired` de `src/api/client.ts`; no evento, marca o aviso
  interno, chama `queryClient.clear()` **antes** de `expireSession()` (ordem
  aprovada: se `expireSession()` rejeitar — ex.: falha do SecureStore — o cache
  em memória já saiu, o aviso permanece ligado e o erro é engolido com
  `.catch()`, sem lançar para a UI). Retorna a função de `unsubscribe`.
- `wasSessionExpired(): boolean` / `acknowledgeSessionExpired(): void` —
  mecanismo de aviso para a tela de Login (T-401): módulo interno em memória,
  não persistido (não sobrevive a reabrir o app — aceito para a Entrega 1), não
  passa pelo `auth.ts` nem pelo MMKV. `acknowledgeSessionExpired()` limpa a
  flag depois que a tela de Login a consumir. Alternativa considerada e
  descartada nesta fase: parâmetro de rota (`?sessionExpired=1`), pois exigiria
  que o guard soubesse o caminho real do Login, ainda não definido.

### `app/(auth)/_layout.tsx`

- `export default function AuthLayout() { return <Stack screenOptions={{ headerShown: false }} />; }`
  Sem rotas registradas (T-401 adiciona `login.tsx` depois, em série).

## Plano de testes

`src/features/auth/__tests__/useSessionGuard.test.tsx` (AC-402-01): `idle` nunca
navega; autenticado em tabs, sessão ou shell não navega, mas cruza de `(auth)`
para `APP_DESTINATION`; deslogado cruza de tabs/sessão para login, mas permanece
em login ou recuperação dentro de `(auth)`; sem `navigationKey` não navega.

`src/features/auth/__tests__/session-expiry.test.ts` (AC-402-02): evento de
sessão expirada limpa o `queryClient` antes de chamar `expireSession` e ativa o
aviso; `expireSession` rejeitando não lança e mantém o aviso ligado; sign-in
com 401 não aciona nada (a T-301 já não emite `sessionExpired` para
`/educator/sign-in`, verificado por não assinar o evento nesse caso);
`unsubscribe` cancela a assinatura.

## Tabela de tarefas

| Arquivo                                                                 | Dono            | Depende de          |
| ----------------------------------------------------------------------- | --------------- | ------------------- |
| `src/features/auth/routes.ts`                                           | Executor Sonnet | —                   |
| `src/features/auth/useSessionGuard.ts`                                  | Executor Sonnet | T-302, routes.ts    |
| `src/features/auth/SessionGuard.tsx`                                    | Executor Sonnet | useSessionGuard.ts  |
| `src/features/auth/session-expiry.ts`                                   | Executor Sonnet | T-301, T-302, T-304 |
| `app/(auth)/_layout.tsx`                                                | Executor Sonnet | —                   |
| `src/features/auth/__tests__/{useSessionGuard,session-expiry}.test.tsx` | Executor Sonnet | —                   |

Modelo/esforço: Sonnet, médio (classe C).

## Limites

Fase 1 (contrato + testes + vermelho): stubs sem comportamento real (lançam
`Error("not implemented")` onde fizer sentido) até aprovação do orquestrador.

Executor pode editar apenas: `docs/contracts/t-402-guarda-sessao.md`;
`app/(auth)/_layout.tsx`; `src/features/auth/**` (sem alterar a API pública de
`token-storage.ts`); `docs/entrega-1/TRACKING.md`. Proibido: alterar
`app/_layout.tsx`, `src/api/client.ts`, `src/stores/auth.ts`, `src/storage/**`,
outros contratos, AGENTS/BACKLOG/GATES, instalar dependências, commit/push,
merge, montar o guard no root.

Validação: `pnpm exec vitest run src/features/auth/__tests__/useSessionGuard.test.tsx src/features/auth/__tests__/session-expiry.test.ts`;
`pnpm run typecheck`; na fase 2 também `pnpm run test`, `pnpm run lint`,
`pnpm exec prettier --check`, `python scripts/check-docs.py`,
`git diff --check` e `npx expo export --platform android --output-dir dist-android`
(descartado depois).

## Pendências

- Montagem do `SessionGuard`/`connectSessionExpiry`/`connectStorageToAuth` no
  root: T-502.
- Rota real de destino (login/home) e substituição do placeholder `"/"` em
  `src/features/auth/routes.ts`: T-401 (login) e T-502/T-601+ (área autenticada).
- `AC-502-04` (voltar do Android): T-502, `MAN`.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-402, após leitura de AGENTS §4/§6, BACKLOG (T-402,
  T-502), GATES G-04, contratos T-301/T-302/T-303/T-304 e
  `src/test-utils/README.md`.
- 2026-09-24: vermelho aprovado pelo orquestrador `claude-opus-5-5` com 3
  ajustes: (1) placeholder `"/"` aceito, mas com destinos centralizados em
  `src/features/auth/routes.ts` e comparação por `usePathname()` (não
  `useSegments`) para evitar loop quando o caminho atual já é o destino; (2)
  em `connectSessionExpiry`, `queryClient.clear()` roda antes de
  `expireSession()`, e uma rejeição de `expireSession()` é engolida (sem
  lançar para a UI); (3) o aviso em memória (`wasSessionExpired`) fica como
  proposto, registrado como não sobrevivendo a reabrir o app. Fase 2
  implementada com esses ajustes; testes reescritos antes da implementação
  para cobrir os novos casos (sem alterar os critérios aprovados).
- 2026-09-25: FX3 corrigiu a comparação por pathname, que redirecionava toda
  rota autenticada diferente de `/` para Home. A guarda passou a verificar a
  fronteira de `useSegments()` conforme a decisão acima; vermelho com 4/13
  falhas, aprovado pelo orquestrador antes da implementação.
