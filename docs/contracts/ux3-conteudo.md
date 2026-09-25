# UX3 — Gestão de conteúdo (aba Atividades, criar caderno, grupo e atividade)

Contrato geral do orquestrador (Claude Code `claude-opus-5-5`). Pedido do usuário em
2026-09-25: implementar as telas do Figma de gestão de conteúdo, um agente por tela.
Dados mockados (G-29); referência visual no Figma (G-30).

## 1. Objetivo, escopo e decisões

Referências (arquivo Figma `IuUM9BWR6sCXTOUmXcguQf`):

| Nó                                                                                     | Tela                                                 | Frente |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------ |
| `1:25739` (Ver Tudo), `1:25165` (Cadernos), `1:25266` (Grupos), `1:25365` (Atividades) | Aba Atividades: lista com busca, filtros e paginação | UX3-L  |
| `1:25469`                                                                              | Criar Caderno                                        | UX3-N  |
| `1:25629`                                                                              | Criar Grupo                                          | UX3-G  |
| `1:25739`                                                                              | Criar Atividade                                      | UX3-A  |

Decisões do orquestrador, pelo contrato da API (PROJECT, Parte II) e pelo prazo:

- D-01 **Categoria é uma só** e vem do enum `TaskCategory`: `reading` (Leitura),
  `writing` (Escrita), `vocabulary` (Vocabulário), `comprehension` (Compreensão).
  Os chips são de seleção única. "Matemática" e "+ Criar Categoria" do Figma **não entram**:
  a API não tem categoria livre.
- D-02 **Criar Caderno** (`POST /task-notebook/create`): a API não tem `name`. O campo
  "Nome do Caderno" vai em `description`, que é o título do caderno (G-15). O campo
  "Descrição" do Figma **não entra**. `tasks` (mínimo 1) é a união dos `tasksIds` dos
  grupos selecionados. Sem nenhum grupo com tarefa, o botão fica desabilitado e aparece
  um aviso. "+ Criar Grupo" abre a tela Criar Grupo.
- D-03 **Criar Grupo** (`POST /task-group/create`): `name`, `category` e
  `tasksIds` opcional. O campo "Descrição" **não entra**, porque a API não o tem. O botão diz
  "Criar Grupo" (no Figma aparece "Criar Caderno" por engano).
- D-04 **Criar Atividade** (`POST /task/create`, multipart): o campo "Nome da Atividade" **não
  entra**, porque a API não o tem; o "Enunciado" é o `prompt`. A categoria é obrigatória na API, então
  um seletor de categoria (D-01) é **acrescentado**. As 4 alternativas têm um botão
  "Marcar" para escolher a correta (exatamente 1). Os campos preenchidos precisam ser pelo menos 2 e as
  alternativas vazias são descartadas. Tipo `multipleChoice`. **Imagem e áudio ficam "Em
  breve"**: o projeto não tem seletor de arquivo instalado, e adicionar um exige dependência
  nativa e rebuild. As linhas aparecem desabilitadas, com a indicação "Em breve".
- D-05 **Aba Atividades**: substitui o placeholder "Em breve" de
  `app/(tabs)/activities.tsx`. Os filtros Ver Tudo, Cadernos, Grupos e Atividades vêm dos dados reais:
  - caderno: `description` e categoria;
  - grupo: `name` e categoria;
  - atividade: `prompt` e categoria.

  Não se inventam descrições (G-11/G-14). A busca é pelo campo exibido, sem diferenciar acento
  nem maiúscula. A paginação é no cliente, 10 itens por página. "+ Criar novo conteúdo"
  abre uma escolha entre Caderno, Grupo e Atividade. Tocar num item abre "Em breve", porque o detalhe
  não está no escopo.

- D-07 **Estado dos mocks**: os handlers de criação acrescentam o item criado aos arrays
  exportados que os GET já devolvem (`MOCK_TASK_NOTEBOOKS` em `src/mocks/fixtures.ts`,
  `MOCK_TASK_GROUPS` e `MOCK_TASKS` em `src/mocks/handlers/content.ts`), em memória, com ids
  fictícios. Depois de criar, a mutação invalida as queries de conteúdo, volta para a aba
  Atividades e o item aparece na lista.
- D-08 Rotas de criação fora das abas: `app/content/new-notebook.tsx`,
  `app/content/new-group.tsx` e `app/content/new-task.tsx`, sem `_layout` próprio. Cada uma usa
  AppHeader com título e o botão Voltar. "Cancelar" volta sem salvar.
- D-09 O visual segue o Figma, com os mesmos desvios de G-30: cores sem contraste usam as
  variantes do tema (G-17) e os ícones são Ionicons (G-28).

Não objetivos: editar ou excluir conteúdo, tela de detalhe, geração por IA, upload de mídia,
categorias livres e integração real (T-1004).

## 2. Critérios de aceite

- AC-L-01 a aba Atividades lista cadernos, grupos e atividades dos mocks. Cada filtro mostra
  só o seu tipo, e "Ver Tudo" mostra todos.
- AC-L-02 a busca filtra pelo campo exibido, sem diferenciar acento nem maiúscula. Um filtro sem resultado mostra
  o estado vazio.
- AC-L-03 a paginação de 10 em 10 funciona, e "+ Criar novo conteúdo" leva às 3 telas de criação.
- AC-N-01 Criar Caderno: nome obrigatório, de 1 a 100 caracteres; categoria obrigatória; ao menos 1 grupo
  com tarefa. Ao enviar, chama `POST /task-notebook/create` com `description`, `category`,
  `tasks` e `taskGroupsIds`, e o caderno aparece na lista.
- AC-G-01 Criar Grupo: nome obrigatório; categoria obrigatória. Ao enviar, chama `POST /task-group/create`
  com `name` e `category`, e o grupo aparece na lista e na seleção de Criar Caderno.
- AC-A-01 Criar Atividade: enunciado obrigatório; categoria obrigatória; pelo menos 2 alternativas
  preenchidas e exatamente 1 marcada. Ao enviar, chama `POST /task/create` em multipart, com
  `alternatives` como string JSON, e a atividade aparece na lista. Imagem e áudio desabilitados
  com "Em breve".
- AC-X-01 erro de rede ou validação mostra a mensagem de erro, sem reenvio automático (G-08).
  Durante o envio, o botão fica desabilitado.

## 3. Propriedade de arquivos (disjunta)

| Frente | Agente                          | Worktree    | Arquivos exclusivos                                                                                                                                             |
| ------ | ------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX3-L  | Sonnet `claude-sonnet-5`        | `lds-wt/w4` | `app/(tabs)/activities.tsx`, `src/features/activities/**`                                                                                                       |
| UX3-N  | OpenCode `openai/gpt-5.6-terra` | `lds-wt/v2` | `app/content/new-notebook.tsx`, `src/features/content-create/notebook/**`, `src/api/endpoints/task-notebook-create.ts`, `src/mocks/handlers/notebook-create.ts` |
| UX3-G  | OpenCode `openai/gpt-5.6-terra` | `lds-wt/c1` | `app/content/new-group.tsx`, `src/features/content-create/group/**`, `src/api/endpoints/task-group-create.ts`, `src/mocks/handlers/group-create.ts`             |
| UX3-A  | Sonnet `claude-sonnet-5`        | `lds-wt/c2` | `app/content/new-task.tsx`, `src/features/content-create/task/**`, `src/api/endpoints/task-create.ts`, `src/mocks/handlers/task-create.ts`                      |

Arquivo compartilhado: `src/mocks/install.ts`, onde cada frente de criação acrescenta **uma linha de
import**. Em conflito no rebase, as linhas das duas frentes são mantidas. Nenhuma frente altera
`src/mocks/handlers/content.ts`, `src/mocks/fixtures.ts` (só importa e dá push nos arrays),
`src/components/**`, `src/theme/**`, a tab bar nem a Home: FX4 e UX2 cuidam desses. Componentes
locais de cada frente ficam dentro da própria pasta.

## 4. Plano de testes e validação

Cada frente escreve testes antes da implementação: componente em `__tests__` na própria pasta,
e handler de mock com o `apiClient` real, como na FX2. Validação: `pnpm run test`, `pnpm run typecheck`,
`pnpm run lint`, `prettier --check` nos arquivos tocados, `python scripts/check-docs.py` e
`git diff --check`. A entrega vai direto na `main` (fetch, rebase e push). A validação visual é
feita pelo orquestrador no emulador Android.

## 5. Histórico

- 2026-09-25: criação pelo orquestrador (4 frentes em paralelo).
