# T-301 - Cliente HTTP e erros

## Objetivo

Implementar a instancia unica Axios e a normalizacao de erros para os modulos de
API futuros, sem endpoint de dominio ou chamada ao backend real.

## Criterios

| ID        | Resultado                                                                                    |
| --------- | -------------------------------------------------------------------------------------------- |
| AC-301-01 | Rotas autenticadas recebem `Authorization: Bearer <token>`; rotas publicas nao exigem token. |
| AC-301-02 | Corpo `{ message, errors }` vira `ApiError` com erros por campo.                             |
| AC-301-03 | `500 TASK_NOT_FOUND` e `400 NOT_FOUND` preservam codigos distintos.                          |
| AC-301-04 | 401 autenticado emite evento central; `POST /educator/sign-in` nao emite.                    |
| AC-301-05 | Timeout e ausencia de resposta de rede sao distintos de erro HTTP.                           |

## Interfaces

- `src/api/client.ts`: instancia Axios unica com timeout explicito e URL de
  `getRuntimeApiBaseUrl`; `setTokenProvider` recebe funcao que retorna token ou
  `null`; `subscribeSessionExpired` retorna unsubscribe.
- O interceptor adiciona Bearer apenas quando houver token e nunca transforma
  erro de login em expiracao de sessao.
- `src/api/errors.ts`: `ApiError` com `status?`, `code?`, `errors`,
  `isNetworkError` e `isTimeout`; normalizacao preserva `message` do servidor.
- Testes usam adapter Axios local, sem dependencia adicional ou backend.

## Limites

Executor Terra pode editar somente `src/api/client.ts`, `src/api/errors.ts` e
`src/api/__tests__/{client,errors}.test.ts`. Sem dependencias novas, config de
ambiente, store de auth, backend real, commit/push, CI ou alteracao de contratos/
TRACKING. Validar com testes focados, `pnpm run test`, `pnpm run typecheck`,
`pnpm run lint` e `git diff --check`.

- 2026-09-24: contrato criado apos o merge da T-106 e pedido direto do usuario.
