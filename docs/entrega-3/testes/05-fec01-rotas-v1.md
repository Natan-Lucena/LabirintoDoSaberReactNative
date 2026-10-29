# Testes detalhados — FEC-01: rotas da V1 contra o backend real

Roteiro completo da tarefa **FEC-01** ([BACKLOG](../BACKLOG.md#fec-01--rotas-da-v1-ainda-não-exercitadas-contra-o-backend-real)):
exercitar, no emulador Android com o Expo Go e a conta de teste, cada rota da V1 que o
[QA-05](../../entrega-2/QA-05-RELATORIO.md) deixou sem evidência, **pela tela que a usa**, e registrar o resultado. É a
versão detalhada do [PLANO-TESTES](../PLANO-TESTES.md#2-casos-por-área-índice) (casos
FEC-01.1 a FEC-01.9, IDs preservados). Nada foi executado: a copy e o código foram conferidos em 2026-10-29.

**Regras da tarefa** (BACKLOG FEC-01): exige **autorização do usuário no momento** para abrir o emulador (AGENTS §7);
`EXPO_PUBLIC_USE_MOCKS=false`; registrar, por rota, **data, tela, resultado (OK ou divergência) e captura**; cada
divergência vira uma correção **em PR próprio, com teste que a reproduz**; arquivo de saída: a seção "Entrega 3" do
`docs/entrega-2/QA-05-RELATORIO.md`; **nenhuma credencial nem dado pessoal** no relatório (AC-FEC-01-01 `MAN`,
AC-FEC-01-02 `REV`). Fora do escopo: agenda e anamnese (têm os próprios casos) e iOS (QA-04).

## 1. Mapa das rotas da FEC-01

| Caso     | Rota                                                             | Tela que a dispara                                                      | Função de API (`src/api/endpoints/...`)                                               | Mock (`src/mocks/handlers/...`) | Já exercitada antes?             |
| -------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------- |
| FEC-01.1 | `PUT /task-notebook/update`                                      | `NewNotebookScreen` (modo edição, "Editar Caderno")                     | `task-notebook-update.ts` › `updateTaskNotebook`                                      | `notebook-update.ts`            | Não (QA-05 §2)                   |
| FEC-01.2 | `DELETE /task-notebook/delete/:id`                               | `NotebookDetailScreen` ("Excluir Caderno")                              | `task-notebook-delete.ts` › `deleteTaskNotebook`                                      | `notebook-delete.ts`            | Não                              |
| FEC-01.3 | `POST /task-group/create` e `GET /task-group/list-by-educator`   | `NewGroupScreen` ("Criar Grupo") e `ActivitiesScreen` (filtro "Grupos") | `task-group-create.ts` › `createTaskGroup`; `content.ts` › `listTaskGroupsByEducator` | `group-create.ts`, `content.ts` | Não                              |
| FEC-01.4 | `PUT /task-group/update`                                         | `NewGroupScreen` (modo edição, "Editar Grupo")                          | `task-group-update.ts` › `updateTaskGroup`                                            | `group-update.ts`               | Não                              |
| FEC-01.5 | `DELETE /task-group/delete/:id`                                  | `GroupDetailScreen` ("Excluir Grupo")                                   | `task-group-delete.ts` › `deleteTaskGroup`                                            | `group-delete.ts`               | Não                              |
| FEC-01.6 | `PUT /task/update`                                               | `NewTaskScreen` (modo edição, "Editar atividade")                       | `task-update.ts` › `updateTask`                                                       | `task-update.ts`                | Não                              |
| FEC-01.7 | `DELETE /task/delete/:id`                                        | `TaskDetailScreen` ("Excluir Atividade")                                | `task-delete.ts` › `deleteTask`                                                       | `task-delete.ts`                | Não                              |
| FEC-01.8 | `GET /task-notebook-session/analysis/student/:studentId/history` | `StudentReportsScreen` (seção "Histórico de snapshots")                 | `session-analysis.ts` › `listStudentSnapshots`                                        | `session-analysis.ts`           | Não ("não verificado" no REL-05) |
| FEC-01.9 | `GET /educator/get-last-sessions`                                | **nenhuma tela do app a chama hoje** (veja a divergência no caso)       | `educator.ts` › `getLastSessions`                                                     | `educator.ts`                   | Não                              |

Rotas de apoio **já exercitadas** no QA-05 e usadas para montar os dados de teste: `POST /task/create`,
`POST /task-notebook/create`, `GET /task-notebook/`, `GET /task/`, `GET /task/:id`, `POST
/task-notebook-session/analysis/student/:id/snapshot`.

Telas: `src/features/content-create/notebook/NewNotebookScreen.tsx`, `.../group/NewGroupScreen.tsx`,
`.../task/NewTaskScreen.tsx`, `src/features/content-detail/notebook/NotebookDetailScreen.tsx`,
`.../group/GroupDetailScreen.tsx`, `.../task/TaskDetailScreen.tsx`, `src/features/activities/ActivitiesScreen.tsx`,
`src/features/reports/student/StudentReportsScreen.tsx`. Rotas de tela: `app/content/notebook/[id].tsx`,
`app/content/notebook/[id]/edit.tsx`, `app/content/new-group.tsx`, `app/content/group/[id].tsx`,
`app/content/group/[id]/edit.tsx`, `app/content/task/[id].tsx`, `app/content/task/[id]/edit.tsx`,
`app/(tabs)/activities.tsx`, `app/(tabs)/reports.tsx`.

**Design system:** `AppHeader`, `DsButton`, `Field`, `SelectField`, `CheckList`, `SearchField`, `InfoCard`, `Badge`,
`SectionTitle`, `Fab`, `FilterRow`.

## 2. Peculiaridades do contrato que valem para todas as rotas

Fonte: PROJECT.md Parte II ("Convenções de resposta e erros", "Task", "Task Group", "Task Notebook") e a Parte I do
BACKEND-ENTREGUE.

- **"Não encontrado" volta como `500`, não `404`**, nas operações de update/delete: `TASK_NOT_FOUND`,
  `TASK_GROUP_NOT_FOUND`, `TASK_NOTEBOOK_NOT_FOUND` (e `INVALID_TASK_ID`, `INVALID_TASK_GROUP_ID`,
  `INVALID_TASK_NOTEBOOK_ID`, `*_FAILED`). **Não é para "corrigir"**: registre o status observado. Os mocks espelham
  isso com `MockApiError(500, "<CÓDIGO>")` (`notebook-update.ts`, `notebook-delete.ts`, `group-update.ts`,
  `group-delete.ts`, `task-update.ts`, `task-delete.ts`).
- **Qualquer endpoint pode responder `500`** por `try/catch` genérico do backend; a mensagem útil está no `message`
  (ou `error`).
- **Respostas:** updates devolvem `200` **vazio**; deletes devolvem `200` com corpo `null`; `POST /task-group/create`
  devolve o `TaskGroup` (`200`).
- **O cliente HTTP** (`src/api/client.ts`) normaliza o erro: `ApiError.message` = `message` do corpo (o código do
  backend, em inglês e maiúsculas) e `ApiError.code` = o mesmo valor; `401` fora do login **desloga** (interceptor).
  Por isso as telas de edição que exibem `mutation.error.message` podem mostrar o **código cru** (ex.:
  "TASK_GROUP_NOT_FOUND"), enquanto os deletes mostram textos fixos ("Não foi possível excluir o caderno.", "Não foi
  possível excluir a atividade.").
- **Sem reenvio automático** nas mutações (`retry: false`; `withOfflineGuard` recusa offline com "Sem conexão").
- **Partida a frio da Vercel:** a primeira chamada pode demorar (BE-08); `timeout` do cliente é 10 s
  (`API_TIMEOUT_MS`), então um timeout isolado na primeira chamada pode ser partida a frio, não defeito.

## 3. Cenários de mock úteis (sem backend)

Com `EXPO_PUBLIC_USE_MOCKS=true` (login e dados em [`src/mocks/README.md`](../../../src/mocks/README.md)):

- Cadernos: `notebook-1` ("Leitura guiada"…), com grupos `group-1`…; `GET /task-notebook/` inclui o grupo alheio
  `group-shared` em `notebook-1`.
- Id inexistente em `PUT /task-notebook/update`, `DELETE /task-notebook/delete/:id`, `PUT /task-group/update`,
  `DELETE /task-group/delete/:id`, `PUT /task/update`, `DELETE /task/delete/:id` → `500` com o código do §2 (útil para
  ver a mensagem que a tela mostra).
- Histórico de snapshots: vazio até "Salvar snapshot"; depois lista o snapshot salvo (em memória); `limit` junto de
  datas → `400 INVALID_ANALYSIS_FILTER`.
- `GET /educator/get-last-sessions`: `MOCK_LAST_SESSIONS` (2 itens); `setMockHomeScenario("no-sessions")` →
  `404 EDUCATOR_DOES_NOT_HAVE_SESSIONS` (`src/mocks/fixtures.ts`).

## 4. Preparação e ordem sugerida (dados descartáveis)

Todos os dados são **fictícios e criados na rodada** com a conta de teste. Ordem que evita mexer em dados reais:

1. **Atividade descartável** (`POST /task/create`, já validada): Atividades → botão **"Criar"** → **"Atividade"**;
   enunciado "Teste FEC-01", categoria, 2 alternativas, uma correta. Crie **duas** (uma para editar, outra para
   excluir).
2. **Grupo** pelo FEC-01.3 (cria) → FEC-01.4 (edita) → FEC-01.5 (exclui). Para o caderno, crie **outro** grupo com a
   atividade do passo 1.
3. **Caderno descartável** (`POST /task-notebook/create`, já validada): "Criar" → **"Caderno"** com o grupo do passo 2
   (o formulário exige ao menos um grupo com atividades). Crie **dois** (um para editar, outro para excluir).
4. **Paciente com snapshot** para o FEC-01.8: use um paciente com sessão encerrada (fluxo F1/V1) e gere "Salvar snapshot"
   uma vez (rota já validada).
5. Anote **data e hora**, **AVD/versão do Android** e **commit** testado.

## 5. Como registrar o resultado no `QA-05-RELATORIO` (seção "Entrega 3")

> **Não edite o `docs/entrega-2/QA-05-RELATORIO.md` neste PR**: esta seção só descreve o formato. O registro é feito
> na rodada (tarefa FEC-01), num PR próprio de documentação.

O relatório atual tem as seções "1. Resultado por tarefa" (`Tarefa | Resultado | Observação`, com OK, Parcial, n/a),
"2. Rotas exercitadas…", "3. Achados e correções (um PR por correção)" (`Achado | PR`), "4. Gates" e "5. Dados
criados no backend". A seção nova **"Entrega 3"** acrescenta, no mesmo estilo:

**Cabeçalho da seção:** data da rodada, plataforma (Android, AVD e versão), app testado (Expo Go, branch e hash do
commit), backend (`https://labirinto-do-saber.vercel.app`, mocks desligados), executor. **Sem** e-mail, senha, token
nem URLs de arquivos.

**Tabela de rotas da FEC-01** (preencher uma linha por caso; é a tabela que o AC-FEC-01-01 exige):

| ID       | Rota                                                             | Data (AAAA-MM-DD) | Tela (nome visível)                 | Status HTTP observado | Resultado (OK / divergência / N/A) | Captura (nome do arquivo) | Observação / PR de correção |
| -------- | ---------------------------------------------------------------- | ----------------- | ----------------------------------- | --------------------- | ---------------------------------- | ------------------------- | --------------------------- |
| FEC-01.1 | `PUT /task-notebook/update`                                      |                   | Editar Caderno                      |                       |                                    | `E3-FEC-01.1-01.png`      |                             |
| FEC-01.2 | `DELETE /task-notebook/delete/:id`                               |                   | Caderno › Excluir Caderno           |                       |                                    | `E3-FEC-01.2-01.png`      |                             |
| FEC-01.3 | `POST /task-group/create` e `GET /task-group/list-by-educator`   |                   | Criar Grupo; lista (filtro Grupos)  |                       |                                    | `E3-FEC-01.3-01.png`      |                             |
| FEC-01.4 | `PUT /task-group/update`                                         |                   | Editar Grupo                        |                       |                                    | `E3-FEC-01.4-01.png`      |                             |
| FEC-01.5 | `DELETE /task-group/delete/:id`                                  |                   | Grupo › Excluir Grupo               |                       |                                    | `E3-FEC-01.5-01.png`      |                             |
| FEC-01.6 | `PUT /task/update`                                               |                   | Editar atividade                    |                       |                                    | `E3-FEC-01.6-01.png`      |                             |
| FEC-01.7 | `DELETE /task/delete/:id`                                        |                   | Atividade › Excluir Atividade       |                       |                                    | `E3-FEC-01.7-01.png`      |                             |
| FEC-01.8 | `GET /task-notebook-session/analysis/student/:studentId/history` |                   | Relatórios › Histórico de snapshots |                       |                                    | `E3-FEC-01.8-01.png`      |                             |
| FEC-01.9 | `GET /educator/get-last-sessions`                                |                   | (sem tela; ver o caso)              |                       |                                    | —                         |                             |

**Resultado por tarefa** (para a linha da tabela do §1 do relatório): `FEC-01` = **OK** quando as nove linhas têm OK
ou N/A justificado; **Parcial** se houver divergência aberta; liste os PRs de correção na seção de achados.

**Seção "Rotas exercitadas":** acrescentar à lista de rotas do relatório as que passaram (um item por rota, sem
repetir o que o QA-05 já listou) e **remover** da lista "Não exercitadas" as que passaram; o que continuar sem
evidência (ex.: `GET /educator/get-last-sessions`, se N/A) permanece listado com o motivo.

**Achados e correções:** uma linha por divergência (`Achado | PR`), cada correção em **PR próprio com teste que a
reproduz** (BACKLOG FEC-01 item 3). Registrar também as **divergências de contrato** (status diferente do esperado)
mesmo quando o app se comporta bem.

**Dados criados no backend de produção (conta de teste):** listar o que ficou (ex.: "1 caderno e 1 grupo
descartáveis excluídos; 1 atividade de teste remanescente"), **sem ids**.

**Evidência:** as capturas ficam **fora do repositório**; o relatório cita só o nome do arquivo
(`E3-FEC-01.<n>-<NN>.png`). Antes de salvar, confira o enquadramento (notificações, teclado com sugestões).

**Como o executor decide OK ou divergência:** **OK** = a ação concluiu **e** a tela mostra o resultado esperado **e** a
chamada observada teve o status esperado (`200`, `201`). **Divergência** = qualquer status diferente do esperado,
mensagem inesperada, dado que não persiste ou tela quebrada; registre status, `message` e o passo.

## 6. Casos

#### FEC-01.1 — Editar caderno (`PUT /task-notebook/update`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** a rota de edição de caderno funciona contra o backend real e a lista/detalhe refletem o novo nome.
- **Pré-condição:** caderno de teste descartável (§4.3), com ao menos um grupo.
- **Passos:**
  1. Aba **Atividades** → filtro **"Cadernos"** → tocar no caderno de teste (ou busque pelo nome).
  2. No detalhe ("Caderno"), tocar em **"Editar Caderno"**.
  3. Em *_"Nome do Caderno *"*_ mudar o texto (ex.: acrescentar " editado"); opcionalmente mudar a *_"Categoria *"*_ e
     marcar/desmarcar um item de **"Grupos de atividades"**.
  4. Tocar em **"Salvar"** (o botão **"Cancelar"** só volta).
  5. Conferir o detalhe e a lista de Atividades.
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Editar Caderno"** (subtítulo "Banco de atividades") com o formulário preenchido; ao salvar,
    volta ao detalhe, que mostra o **novo nome** (título) e a categoria; a lista de Atividades mostra o nome novo.
    Nome vazio: **"Informe o nome do caderno"** e botão desabilitado.
  - **Rede (backend real):** `PUT /task-notebook/update` com corpo **`{ taskNotebookId, description, category,
taskGroupsIds }`** (o app envia **todos** os campos do formulário, não só o alterado; o `tasks` do caderno **não**
    é enviado); resposta `200` **vazia**. Depois `GET /task-notebook/` refeito (invalidação de `["task-notebook"]`).
    Erros esperados do contrato: `400` validação (descrição de 1 a 500; o app limita a 100); `500
INVALID_TASK_NOTEBOOK_ID` / `TASK_NOTEBOOK_NOT_FOUND` / `INVALID_TASK_NOTEBOOK_DATA`.
  - **Depois:** detalhe e lista (mesma chave `["task-notebook"]`) atualizam sem puxar a tela. **Observe** se o contador
    "Atividades: N tarefas" muda ao trocar os grupos (o `PUT` não envia `tasks`; registre o comportamento do
    backend).
- **Onde está no código:** `app/content/notebook/[id]/edit.tsx`; `src/features/content-create/notebook/
NewNotebookScreen.tsx` › `NewNotebookScreen` (`mutation`, `schema`: `description` 1–100 e `category`; `editing`;
  `reset` a partir de `["task-notebook"]`; `onSuccess` invalida e faz `router.back()`);
  `src/features/content-detail/notebook/NotebookDetailScreen.tsx` › `edit`; `src/api/endpoints/task-notebook-update.ts`
  › `updateTaskNotebook`; `listTaskNotebooks` (`src/api/endpoints/content.ts`); mock `src/mocks/handlers/
notebook-update.ts`; DS `Field`, `SelectField`, `CheckList`, `DsButton`.
- **Testes automatizados que cobrem:** `src/features/content-detail/notebook/__tests__/NotebookDetailScreen.test.tsx` ›
  "abre o formulário preenchido ao tocar em Editar Caderno". **Lacuna:** nenhum teste exercita o `PUT` de edição
  (os testes de `NewNotebookScreen.test.tsx` cobrem só a criação e mockam `updateTaskNotebook`); o handler
  `notebook-update.ts` também não tem teste. Rodar o que existe:
  `pnpm exec vitest run src/features/content-detail/notebook src/features/content-create/notebook --maxWorkers=1`.
- **Se falhar:**
  1. _Tela mostra um texto como "INVALID_TASK_NOTEBOOK_DATA" ou "TASK_NOTEBOOK_NOT_FOUND" (código cru)_ → o `PUT` devolveu
     `500` com esse código; é **contrato** (PROJECT.md: "não encontrado" como `500`), não erro de tela. Confira se o
     corpo enviou `taskNotebookId` válido e `taskGroupsIds` só de grupos acessíveis.
  2. _`400` com "Validation error"_ → campo fora do contrato (descrição vazia ou >500; `taskGroupsIds` com id que não
     é uuid); veja o corpo enviado.
  3. _Salvou (`200`) mas o nome antigo continua_ → invalidação (`["task-notebook"]`) ou o backend não persistiu: compare
     com um novo `GET /task-notebook/`. Se o `GET` mostra o nome novo, o defeito é de cache do app.
  4. _Os grupos mudam mas "N tarefas" não_ → comportamento do backend (o `PUT` não recebe `tasks`); registre, não
     é defeito do app.
  5. _Formulário abre vazio_ → `useQuery` `["task-notebook"]` ainda sem dados (`reset` só ocorre quando o caderno é
     achado na lista).
- **Evidência:** capturas do formulário e do detalhe com o nome novo; `PUT` (método, caminho, status) e a lista dos
  **nomes** dos campos do corpo, sem ids.

#### FEC-01.2 — Excluir caderno (`DELETE /task-notebook/delete/:taskNotebookId`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** excluir um caderno descartável com confirmação e vê-lo sumir.
- **Pré-condição:** caderno de teste descartável (§4.3).
- **Passos:**
  1. Atividades → "Cadernos" → abrir o caderno.
  2. Tocar em **"Excluir Caderno"** → no diálogo **"Excluir Caderno?"** tocar em **"Cancelar"**; repetir → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** "Cancelar" fecha sem chamar a API; "Excluir" volta à lista de Atividades e o caderno **some**; sem erro.
    Em falha: **"Não foi possível excluir o caderno."** (vermelho, no detalhe).
  - **Rede (backend real):** `DELETE /task-notebook/delete/<uuid>` → `200` (corpo `null`). Depois `GET /task-notebook/`
    refeito. Erros do contrato: `500 TASK_NOTEBOOK_ID_REQUIRED` / `INVALID_TASK_NOTEBOOK_ID` / `TASK_NOTEBOOK_NOT_FOUND` /
    `DELETE_TASK_NOTEBOOK_FAILED`.
  - **Depois:** o caderno não aparece em Atividades nem em "Escolha o caderno" da sessão (`["task-notebook"]` e
    `["content-catalog","notebook"]` — este último só atualiza ao reabrir a etapa).
- **Onde está no código:** `NotebookDetailScreen.tsx` › `deletion` (`withOfflineGuard(deleteTaskNotebook)`,
  `onSuccess` invalida `["task-notebook"]` e `router.back()`), `confirmVisible`, `Modal`;
  `src/api/endpoints/task-notebook-delete.ts` › `deleteTaskNotebook`; mock `src/mocks/handlers/notebook-delete.ts`
  (`500 TASK_NOTEBOOK_NOT_FOUND` para id inexistente).
- **Testes automatizados que cobrem:** `NotebookDetailScreen.test.tsx` › "excluir pede confirmação, chama o endpoint e
  volta (D-05)", "cancelar a confirmação não chama o endpoint" e "erro ao excluir mostra mensagem sem reenvio
  automático"; `src/features/content-detail/notebook/__tests__/notebook-delete.integration.test.ts` › "remove o
  caderno da lista após excluir" e "id inexistente devolve 500 com TASK_NOTEBOOK_NOT_FOUND".
- **Se falhar:**
  1. _"Não foi possível excluir o caderno."_ → leia o status e o `message` do `DELETE`: `500` com
     `DELETE_TASK_NOTEBOOK_FAILED` = backend (por exemplo, caderno em uso por sessão); `401` = login expirou.
  2. _Excluído no backend mas a lista ainda mostra_ → invalidação; abra de novo e compare com `GET /task-notebook/`.
  3. _Caderno com sessão ligada (`taskNotebookId`)_ → exclusão pode falhar por vínculo; registre o corpo e **não**
     trate como defeito do app.
- **Evidência:** capturas do diálogo e da lista sem o caderno; `DELETE` com status.

#### FEC-01.3 — Criar grupo e listar grupos (`POST /task-group/create`, `GET /task-group/list-by-educator`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** criar um grupo e vê-lo na lista de grupos do educador.
- **Pré-condição:** ao menos 2 atividades de teste (§4.1).
- **Passos:**
  1. Aba **Atividades** → botão flutuante **"Criar"** → **"Grupo"**.
  2. *_"Nome do Grupo *"*_ (ex.: "Grupo FEC-01"), **"Categoria \*"**; em **"Atividades do grupo"** (busca "Buscar
     atividades") marcar as atividades.
  3. **"Criar Grupo"**.
  4. Na lista de Atividades, filtro **"Grupos"**.
- **Resultado esperado:**
  - **Tela:** formulário "Criar Grupo" (subtítulo "Banco de atividades"); "Criar Grupo" desabilitado até haver nome e
    categoria; ao criar, volta para a tela anterior; o grupo novo aparece no filtro "Grupos" com o nome e a quantidade
    de atividades; "Informe o nome do grupo" quando vazio.
  - **Rede (backend real):** `POST /task-group/create` com corpo **`{ name, category, tasksIds: [uuid, …] }`** →
    `200` com o `TaskGroup` (`id`, `name`, `tasksIds`, `educatorId`, `category`); depois **`GET
/task-group/list-by-educator`** → `200` com a lista (inclui o novo). Erros: `400` validação, `401 UNAUTHORIZED`,
    `404 EDUCATOR_NOT_FOUND` / `TASK_NOT_FOUND`.
  - **Depois:** o grupo aparece em "Grupos de atividades" ao criar/editar um caderno (`["task-group"]`).
- **Onde está no código:** `app/content/new-group.tsx`; `ActivitiesScreen.tsx` (`Fab` "Criar" →
  `CreateContentSheet` com a opção "Grupo" → `goToCreate("/content/new-group")`); `src/features/content-create/group/
NewGroupScreen.tsx` › `NewGroupScreen` (`mutation`, `schema`; `onSuccess` invalida `["task-group"]` e `router.back()`);
  `src/features/activities/useActivitiesData.ts` (`activitiesQueryKeys.groups` = `["task-group"]`, `queryFn:
listTaskGroupsByEducator`); `src/api/endpoints/task-group-create.ts` › `createTaskGroup`; `content.ts` ›
  `listTaskGroupsByEducator`; mocks `group-create.ts`, `content.ts`.
- **Testes automatizados que cobrem:** `src/features/content-create/group/__tests__/NewGroupScreen.test.tsx` ›
  "bloqueia a criação até informar nome e categoria" e "envia nome e categoria e volta após criar o grupo";
  `group-create.integration.test.ts` (cria pelo `apiClient` com mock). Rodar:
  `pnpm exec vitest run src/features/content-create/group --maxWorkers=1`.
- **Se falhar:**
  1. _`404 TASK_NOT_FOUND`_ → algum `tasksIds` não existe para o educador (atividade excluída depois de carregar a
     lista); recarregue as atividades.
  2. _`401`_ → o interceptor desloga; refaça o login.
  3. _Criou (`200`) mas não aparece em "Grupos"_ → `GET /task-group/list-by-educator` não trouxe (veja o `GET`) ou a
     invalidação de `["task-group"]` não rodou.
  4. _Grupo criado sem atividades_ → `tasksIds` é opcional no contrato; o app aceita lista vazia (formulário não
     exige atividade); confira o corpo.
- **Evidência:** captura do formulário e da lista com o grupo; os dois métodos/caminhos e status.

#### FEC-01.4 — Editar grupo (`PUT /task-group/update`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** editar nome/atividades de um grupo próprio.
- **Pré-condição:** grupo de teste (FEC-01.3), **do próprio educador**.
- **Passos:**
  1. Atividades → "Grupos" → abrir o grupo; conferir "Editar Grupo" e "Excluir Grupo".
  2. **"Editar Grupo"** → mudar o *_"Nome do Grupo *"*_ e marcar/desmarcar uma atividade → **"Salvar"**.
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Editar Grupo"** com o formulário preenchido; ao salvar, volta ao detalhe com o nome e a
    contagem novos.
  - **Rede (backend real):** `PUT /task-group/update` com corpo **`{ id, name, category, tasksIds }`** (todos os campos do
    formulário) → `200` **vazio**; depois `GET /task-group/list-by-educator` e `GET /task-group/:id` refeitos
    (invalidação do prefixo `["task-group"]`). Erros: `400` validação; `500 INVALID_TASK_GROUP_ID` /
    `TASK_GROUP_NOT_FOUND` / `INVALID_TASK_GROUP_DATA` / `UPDATE_TASK_GROUP_FAILED`.
  - **Depois:** os cadernos que usam o grupo mostram o grupo com os dados novos após `GET /task-notebook/` (a edição
    invalida só `["task-group"]`, não `["task-notebook"]`: puxe/reabra o caderno para conferir).
- **Onde está no código:** `app/content/group/[id]/edit.tsx`; `NewGroupScreen.tsx` (modo `editing`, `groupsQuery`,
  `reset`); `GroupDetailScreen.tsx` › `edit` (só se `ownGroup`); `useGroupDetailData.ts`
  (`["task-group", groupId]`); `src/api/endpoints/task-group-update.ts` › `updateTaskGroup`; mock `group-update.ts`
  (`500 TASK_GROUP_NOT_FOUND`).
- **Testes automatizados que cobrem:** `GroupDetailScreen.test.tsx` › "abre o formulário preenchido ao tocar em Editar
  Grupo". **Lacuna:** nenhum teste exercita o envio do `PUT` de edição (`NewGroupScreen.test.tsx` mocka
  `updateTaskGroup` e cobre só a criação); `group-update.ts` sem teste.
- **Se falhar:**
  1. _Texto de código cru na tela (ex.: "TASK_GROUP_NOT_FOUND")_ → `500` do backend (contrato); a tela de edição
     mostra `mutation.error.message`.
  2. _O botão "Editar Grupo" não aparece_ → grupo de outro educador (leitura) — FEC-04; ou `ownGroup` falso.
  3. _Detalhe com nome antigo_ → invalidação/`GET /task-group/:id`; compare as duas respostas.
  4. _Caderno com contagem antiga_ → esperado até refazer `GET /task-notebook/` (veja "Depois").
- **Evidência:** capturas antes/depois; `PUT` com status.

#### FEC-01.5 — Excluir grupo (`DELETE /task-group/delete/:taskGroupId`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** excluir um grupo descartável.
- **Pré-condição:** grupo descartável **sem uso em caderno** (para evitar efeito colateral).
- **Passos:** abrir o grupo → **"Excluir Grupo"** → **"Cancelar"**; de novo → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** diálogo **"Excluir {nome do grupo}?"**; "Cancelar" não apaga; "Excluir" volta e o grupo some da lista;
    em falha mostra o `message` do erro.
  - **Rede (backend real):** `DELETE /task-group/delete/<uuid>` → `200` (corpo `null`); depois `GET
/task-group/list-by-educator`. Erros: `500 TASK_GROUP_ID_REQUIRED` / `INVALID_TASK_GROUP_ID` /
    `TASK_GROUP_NOT_FOUND` / `DELETE_TASK_GROUP_FAILED`.
  - **Depois:** o grupo não aparece mais em Atividades nem em "Grupos de atividades" do caderno.
- **Onde está no código:** `GroupDetailScreen.tsx` › `deletion` (`withOfflineGuard(deleteTaskGroup)`, `retry: false`,
  invalida `["task-group"]` e `router.back()`), `confirmVisible`; `src/api/endpoints/task-group-delete.ts` ›
  `deleteTaskGroup`; mock `group-delete.ts`.
- **Testes automatizados que cobrem:** `GroupDetailScreen.test.tsx` › "exclui com confirmação e volta (D-05, AC-03)" e
  "mostra erro de exclusão sem reenvio automático (AC-03)"; `src/features/content-detail/group/__tests__/
group-delete-handler.test.ts` › "remove o grupo existente da lista" e "devolve 500 TASK_GROUP_NOT_FOUND para id
  inexistente".
- **Se falhar:**
  1. _`500 DELETE_TASK_GROUP_FAILED`_ → backend (provável restrição de integridade, grupo referenciado por caderno);
     registre o `message`.
  2. _Some da lista mas o caderno continua listando o grupo_ → o caderno só atualiza depois de `GET /task-notebook/`
     (a exclusão invalida só `["task-group"]`).
- **Evidência:** captura do diálogo e da lista; `DELETE` com status.

#### FEC-01.6 — Editar atividade (`PUT /task/update`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** editar uma atividade de teste enviando só o que mudou.
- **Pré-condição:** atividade de teste (§4.1).
- **Passos:**
  1. Atividades → abrir a atividade → **"Editar Atividade"**.
  2. Mudar o *_"Enunciado *"*_ (e, se quiser, a categoria ou uma alternativa).
  3. Tocar em **"Salvar atividade"**.
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Editar atividade"**, formulário preenchido; ao salvar, volta ao **detalhe** (`router.replace`) com
    o enunciado novo; o banco de atividades mostra o texto novo.
  - **Rede (backend real):** `PUT /task/update` com corpo **só os campos alterados** (ex.: `{ id, prompt }`;
    `alternatives` só se mudaram; com mídia nova: `imageFile`/`audioFile` como **URL** + `type:
"multipleChoiceWithMedia"`, depois de `POST /task/upload-media`) → `200` **vazio**; depois `GET /task/` refeito
    (invalidação de `["task"]`). Erros: `400` validação; `500 INVALID_TASK_ID` / `TASK_NOT_FOUND` / `INVALID_TASK_DATA`.
  - **Depois:** detalhe e lista (`["task"]` e `["task", id]`) atualizados; grupos e cadernos que usam a atividade
    passam a mostrar o texto novo ao recarregar.
- **Onde está no código:** `app/content/task/[id]/edit.tsx`; `src/features/content-create/task/NewTaskScreen.tsx` ›
  `NewTaskScreen` (`mutation`: monta `input` comparando com `initialTask`; `onSuccess` invalida `["task"]`);
  `TaskDetailScreen.tsx` › `goToEdit`; `src/api/endpoints/task-update.ts` › `updateTask`; `task-upload-media.ts`;
  mock `task-update.ts` (`500 TASK_NOT_FOUND`).
- **Testes automatizados que cobrem:** `src/features/content-create/task/__tests__/NewTaskScreen.test.tsx` › "carrega a
  atividade existente e preenche o formulário em modo edição" e "envia somente os campos alterados pelo PUT
  /task/update"; `task-update.integration.test.ts` › "atualiza somente os campos recebidos pelo PUT /task/update",
  "atualiza imagem e áudio recebendo URLs já enviadas por /task/upload-media" e "rejeita com 500 TASK_NOT_FOUND quando
  o id não existe". Rodar: `pnpm exec vitest run src/features/content-create/task --maxWorkers=1`.
- **Se falhar:**
  1. _`500 INVALID_TASK_DATA`_ → alternativas inválidas (menos de 2, nenhuma correta) ou regra de mídia; compare o corpo
     com as regras do PROJECT.md (Task).
  2. _`500 TASK_NOT_FOUND`_ → id inexistente (contrato); a tela mostra o texto do erro.
  3. _Texto não muda no detalhe_ → `["task", id]` com cache; confira `GET /task/:id`.
  4. _`PUT` com todos os campos_ → regressão em `NewTaskScreen` (deve enviar só o diferente).
- **Evidência:** capturas antes/depois; `PUT` com status e os nomes dos campos enviados.

#### FEC-01.7 — Excluir atividade (`DELETE /task/delete/:id`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** excluir uma atividade descartável.
- **Pré-condição:** atividade descartável **fora de grupos/cadernos**.
- **Passos:** abrir a atividade → **"Excluir Atividade"** → **"Cancelar"**; de novo → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** diálogo **"Excluir Atividade?"**; "Cancelar" não apaga; "Excluir" volta e a atividade **some do banco de
    atividades**; erro: **"Não foi possível excluir a atividade."**.
  - **Rede (backend real):** `DELETE /task/delete/<uuid>` → `200` (corpo `null`); depois `GET /task/` refeito.
    Erros: `500 TASK_ID_REQUIRED` / `INVALID_TASK_ID` / `TASK_NOT_FOUND` / `DELETE_TASK_FAILED`.
  - **Depois:** a atividade some de Atividades e de "Atividades do grupo" (que passa a mostrar "Atividade indisponível"
    se o grupo ainda a referenciar).
- **Onde está no código:** `TaskDetailScreen.tsx` › `deleteMutation` (`withOfflineGuard(() => deleteTask(taskId))`,
  invalida `taskQueryKeys.list` e remove `taskQueryKeys.detail(taskId)`), `confirmOpen`; `src/api/endpoints/
task-delete.ts` › `deleteTask`; mock `task-delete.ts` (`500 TASK_NOT_FOUND`).
- **Testes automatizados que cobrem:** `TaskDetailScreen.test.tsx` › "excluir pede confirmação, chama o endpoint e volta
  (D-05/AC-03)" e "mostra erro de exclusão sem reenvio automático (AC-03/G-08)".
- **Se falhar:**
  1. _`500 DELETE_TASK_FAILED`_ → backend (atividade em uso); registre o `message`.
  2. _Detalhe mostra "Não encontrado" logo após excluir_ → o detalhe refez o `GET /task/:id` (`500 TASK_NOT_FOUND`);
     o código remove a consulta do detalhe depois de invalidar a lista para evitar isso.
  3. _Continua na lista_ → invalidação de `["task"]`.
- **Evidência:** capturas do diálogo e da lista; `DELETE` com status.

#### FEC-01.8 — Histórico de snapshots (`GET /task-notebook-session/analysis/student/:studentId/history`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** a lista de snapshots abre sem erro e com o período e os números certos.
- **Pré-condição:** paciente com sessão(ões) encerrada(s) e **ao menos um snapshot salvo** (§4.4); outro paciente
  sem snapshot (para o estado vazio).
- **Passos:**
  1. Aba **Recursos** → **"Relatórios"** (grupo "Avaliação e conteúdo") → tela **"Relatórios"** (subtítulo "Análise
     do paciente").
  2. Em "Paciente" escolher o paciente com snapshot; definir o período (últimas N sessões ou datas) e tocar em
     **"Gerar síntese"**.
  3. Rolar até **"Histórico de snapshots"**.
  4. (Opcional) tocar em **"Salvar snapshot"** e conferir que o histórico ganha um item ("Snapshot salvo").
- **Resultado esperado:**
  - **Tela:** o histórico só aparece **depois** de "Gerar síntese" (a consulta é habilitada pelo pedido); cada item é um
    cartão com o título do **período** ("Últimas N sessões", "Última sessão", "dd/mm/aaaa a dd/mm/aaaa" ou "Todas as
    sessões") e a linha **"N questões · X% de acerto"**; vazio: **"Nenhum snapshot salvo."**; carregando: "Carregando
    histórico"; erro: **"Não foi possível carregar o histórico."**. O contrato **não traz id nem data de criação** do
    snapshot, então a "data certa" a conferir é o **período** (e a ordem devolvida pelo backend).
  - **Rede (backend real):** `GET /task-notebook-session/analysis/student/<uuid>/history` → `200` com
    `StudentAnalysisReport[]` (`studentId`, `startDate?`, `endDate?`, `limit?`, `sessionIds`, `categories`,
    `totalQuestions`, `totalCorrect`, `accuracy` como **fração de 0 a 1**, G-43); vazio: `200 []`. (`POST …/snapshot` só
    no passo opcional.)
  - **Depois:** "Salvar snapshot" invalida `["student-analysis-history", studentId]` e o item novo aparece.
- **Onde está no código:** `app/(tabs)/reports.tsx`; `ResourcesScreen.tsx` (item "Relatórios", `destination:
"/reports"`); `src/features/reports/student/StudentReportsScreen.tsx` › `StudentReportsScreen` (`history` =
  `useQuery` `["student-analysis-history", request?.studentId]`, `snapshot` = `useMutation`);
  `src/features/reports/student/analysisFilter.ts` › `describePeriod`, `describeSnapshotPeriod`;
  `src/features/reports/session/sessionReport.ts` › `accuracyToPercent`; `src/api/endpoints/session-analysis.ts` ›
  `listStudentSnapshots`, `createStudentSnapshot`; mock `session-analysis.ts` (histórico em memória); DS
  `InfoCard`, `SectionTitle`, `SelectField`, `DsButton`, `PrivacyNote`.
- **Testes automatizados que cobrem:** `src/features/reports/student/__tests__/StudentReportsScreen.test.tsx` ›
  "AC-REL-05-02: salvar snapshot envia o mesmo filtro e o histórico é atualizado" e "falha ao salvar o snapshot mostra
  o erro, sem reenviar sozinho"; `src/mocks/__tests__/session-snapshot.integration.test.ts` › "gera e persiste um
  snapshot que aparece no histórico (AC-REL-05-02)", "guarda o intervalo de datas quando é o filtro usado" e "o
  histórico começa vazio para um paciente sem snapshots". Rodar:
  `pnpm exec vitest run src/features/reports/student src/mocks/__tests__/session-snapshot.integration.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. _"Não foi possível carregar o histórico."_ → veja o status: `400` (uuid inválido), `5xx` (backend) ou `401`
     (interceptor desloga). O `GET` da rota `…/history` **não estava no Swagger público** (P6 em PERGUNTAS-BACKEND);
     `404` significa que a rota não existe naquele deploy.
  2. _Item com "NaN% de acerto" ou "0 questões" estranho_ → `accuracy` fora da escala 0 a 1 (G-43) ou campos ausentes;
     compare com a resposta (`accuracyToPercent`).
  3. _Título "Todas as sessões" quando o snapshot tinha período_ → o backend não devolveu `limit`/`startDate`/`endDate`
     no snapshot; registre (contrato).
  4. _Histórico vazio depois de "Salvar snapshot"_ → o `POST` gravou mas o `GET` não lista (backend) ou a invalidação
     não rodou.
- **Evidência:** capturas do histórico (com e sem itens); `GET …/history` com status e o nº de itens (sem copiar o
  corpo).

#### FEC-01.9 — Últimas sessões (`GET /educator/get-last-sessions`)

- **Prioridade / AC:** P1 · AC-FEC-01-01
- **Objetivo:** exercitar a rota que lista as últimas sessões do educador (máx. 2: `{ studentName?, sessionName }`).
- **Pré-condição:** conta de teste com sessões já realizadas.
- **Passos:**
  1. Abrir o **Início** e procurar a seção das últimas sessões realizadas.
  2. Se não houver tela que a use, **registrar a divergência** (abaixo) e, **só se o orquestrador autorizar**, fazer a
     chamada de apoio fora do app (por exemplo, `curl` com o token da conta de teste, sem registrar o token).
- **Resultado esperado:**
  - **Tela:** a ficha/PLANO esperam uma lista com paciente e data; **na versão atual do app não há tela que
    chame a rota** (veja a divergência). Se a seção existir em outra versão: lista com até 2 itens, sem erro.
  - **Rede (backend real):** `GET /educator/get-last-sessions` → `200 [{ studentName?, sessionName }]` (até 2);
    erros do contrato: `403 UNAUTHORIZED`; `404 EDUCATOR_NOT_FOUND` / `EDUCATOR_DOES_NOT_HAVE_SESSIONS` (para conta sem
    sessões — tratado como **vazio** na V1/G-11); `500 INTERNAL_ERROR`.
  - **Depois:** —
- **Onde está no código:** `src/api/endpoints/educator.ts` › `getLastSessions` (existe e é tipada com
  `EducatorLastSession` em `src/api/types.ts`); mock `src/mocks/handlers/educator.ts` (`MOCK_LAST_SESSIONS`,
  `setMockHomeScenario("no-sessions")`). `rg "getLastSessions" src app` só acha a **definição**, o teste de contrato
  (`src/api/__tests__/endpoints.test.ts`) e a fixture: **nenhum componente/hook a usa**; `HomeScreen`/`useHomeData`
  carregam `getMe`, `listAppointments` e `listStudents`.
- **Testes automatizados que cobrem:** `src/api/__tests__/endpoints.test.ts` (entrada `getLastSessions`: método e caminho
  da chamada). Não há teste de tela.
- **Se falhar:** não há sintoma de tela. Se a rota for chamada de fora do app e devolver `404`/`403`, registre o status e o
  `message` (contrato do PROJECT.md).
- **Evidência:** a captura da Início (sem a seção) **ou** o status da chamada de apoio (sem token e sem nomes).
- **Divergência encontrada:** a ficha FEC-01 e a primeira versão do PLANO-TESTES (§2.8) mandavam exercitar a rota "pela tela que a usa", mas
  **nenhuma tela do app a usa** (o desenho da V1 não tem "Últimas sessões" na Início; `docs/entrega-2/BACKLOG.md`
  diz "se o Início mostrar sessões recentes" e a `ENTREGA-V1` a lista como não exercitada). **Decisão pendente do
  orquestrador** para fechar o AC-FEC-01-01: (a) registrar **N/A com o motivo** "rota sem consumidor no app" e
  (b) opcionalmente validar a rota por chamada de apoio autorizada; ou (c) abrir tarefa de código para criar o
  consumidor (fora do escopo da FEC-01, "Nenhum código").

## 7. Casos adicionados (IDs novos)

#### FEC-01.10+ — Conferir o estado final dos dados de teste

- **Prioridade / AC:** P3 · AC-FEC-01-02
- **Objetivo:** deixar a conta de teste limpa e o relatório sem dado pessoal.
- **Pré-condição:** casos FEC-01.1 a FEC-01.9 concluídos.
- **Passos:** listar em Atividades (filtros "Cadernos", "Grupos", "Atividades") o que sobrou de dados de teste;
  excluir o que não é necessário; revisar o texto do relatório e as capturas.
- **Resultado esperado:**
  - **Tela:** só restam dados fictícios conhecidos (a atividade de teste extra, se mantida).
  - **Rede (backend real):** as exclusões repetem as rotas dos casos 1.2, 1.5 e 1.7 com `200`.
  - **Depois:** o relatório cita os dados deixados, **sem ids, e-mails, tokens nem nomes reais** (AC-FEC-01-02 `REV`).
- **Onde está no código:** as mesmas telas dos casos 1.2, 1.5 e 1.7.
- **Testes automatizados que cobrem:** nenhum (verificação de conteúdo).
- **Se falhar:** _dado pessoal numa captura_ → refazer a captura; não commitar a imagem.
- **Evidência:** a lista final de dados no relatório.
