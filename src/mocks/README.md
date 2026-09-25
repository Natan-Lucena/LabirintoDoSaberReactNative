# Camada de mocks (G-29)

Telas desta entrega usam dados mockados no lugar do backend real. Este
módulo instala um adaptador Axios customizado em `apiClient`
(`src/api/client.ts`, sem editá-lo) que responde aos endpoints registrados
com dados fictícios tipados por `src/api/types.ts`.

## Ligar/desligar

Controlado por `EXPO_PUBLIC_USE_MOCKS` (lido em `src/config/env.ts`,
`getRuntimeUseMocks`):

- Ausente: `true` em `development`, `false` em `homologation`/`production`.
- `"true"`/`"false"` (case-insensitive): força o valor.

`src/mocks/install.ts#installApiMocks()` é chamado uma vez no boot do app
(`src/app-shell/AppProviders.tsx`). Se a flag for `false`, não faz nada —
`apiClient` mantém o adaptador HTTP real do Axios.

## Endpoints mockados

Autenticação (T-401):

- `POST /educator/sign-in`
- `GET /educator/me`

Dados da Home (T-601):

- `GET /appointment/`
- `GET /student/`
- `GET /educator/get-last-sessions`
- `GET /task-notebook/`

Agendamentos (T-901):

- `POST /appointment/`
- `PUT /appointment/:id`
- `DELETE /appointment/:id`

Os handlers de agendamento mantem estado somente em memoria durante a sessao do
app, usam ids ficticios e devolvem `400 NOT_FOUND` para PUT/DELETE de id ausente.

## Cenários (e-mails reservados, `src/mocks/fixtures.ts`)

| E-mail                          | Senha      | Resultado                                  |
| ------------------------------- | ---------- | ------------------------------------------ |
| `educadora.mock@labirinto.test` | `senha123` | Sucesso: token fictício + `Educator` mock. |
| `invalido.mock@labirinto.test`  | qualquer   | `401 INVALID_CREDENTIALS`.                 |
| `semrede.mock@labirinto.test`   | qualquer   | Falha de rede (sem `response`).            |
| Qualquer outro e-mail           | qualquer   | `401 INVALID_CREDENTIALS` (mesmo padrão).  |

Todos os dados são fictícios (nome, e-mail, token); nenhum dado real de
usuários ou crianças é usado.

## Como estender (para tarefas futuras)

1. Adicionar fixtures fictícias em `src/mocks/fixtures.ts` (ou um arquivo de
   fixtures próprio do domínio, se preferir).
2. Registrar um handler com `registerMockHandler({ method, path }, handler)`
   de `src/mocks/handlers/registry.ts`, em um arquivo próprio dentro de
   `src/mocks/handlers/` (ex.: `student.ts`, `content.ts`), seguindo o
   padrão de `src/mocks/handlers/educator.ts`.
3. Importar esse arquivo por efeito colateral em `src/mocks/install.ts`
   (`import "@/mocks/handlers/<novo>";`) para garantir o registro no boot.
4. Erros: lance `MockApiError(status, code, message?)` para respostas de
   erro com `status`/`response`, ou `MockNetworkError()` para simular falha
   de rede. Ambos em `src/mocks/handlers/types.ts`.

Não recriar o adaptador nem duplicar a instalação — um único
`installApiMocks()` cobre todos os handlers registrados.

## Cenários da Home

As fixtures da Home usam somente nomes e dados fictícios. Os agendamentos são
gerados para o dia atual em `America/Sao_Paulo`, incluindo `PENDING`,
`COMPLETED` e `CANCELLED`; o último não entra na contagem da Home. Durante o
desenvolvimento, chame `setMockHomeScenario("no-sessions")` de
`src/mocks/fixtures` para o cenário `no-sessions`, que devolve `404
EDUCATOR_DOES_NOT_HAVE_SESSIONS` para últimas sessões e `no-appointments`
devolve uma agenda vazia, permitindo observar o estado 03.

## Limitação atual

Os endpoints de autenticação e Home acima estão cobertos. Telas seguintes que
dependam de outros endpoints devem estender o registro (item acima), não criar
um segundo adaptador.
