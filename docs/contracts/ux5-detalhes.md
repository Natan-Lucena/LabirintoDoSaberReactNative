# UX5 — Detalhes de atividade, grupo e caderno

Contrato geral do orquestrador (Claude Code `claude-opus-5-5`). Pedido do usuário em
2026-09-25: telas de detalhe navegáveis, um agente por tela. Dados mockados (G-29), com
referência visual no Figma (G-30).

## 1. Referências e decisões

Arquivo Figma `IuUM9BWR6sCXTOUmXcguQf`: atividade no nó `1:26235`, grupo no nó `1:26056` e
caderno no nó `1:25886`. Só o frame da atividade pôde ser lido, porque o conector do Figma
atingiu o limite de chamadas do plano Starter. Por isso, grupo e caderno seguem o mesmo padrão
visual da atividade, e o aceite visual fica com o usuário (G-18).

Padrão visual (do frame da atividade):

- AppHeader com o título do tipo ("Atividade", "Grupo", "Caderno");
- título do item em Bold ~16;
- card destacado de fundo #E6F8F6, borda color.primary clara e raio ~12, com rótulo pequeno em
  color.primary e ícone de lápis à direita;
- seções com rótulo em Bold e cards brancos com borda #E0E0E0, raio ~12 e ícone em círculo
  color.primary à esquerda;
- rodapé com "Excluir X" (branco, borda e texto de erro/rosa acessível, ícone de lixeira) e
  "Editar X" (primário, ícone de lápis).

Decisões:

- D-01 **Só campos da API** (G-11/G-14). Não se inventam nomes nem descrições.
- D-02 **Atividade** (`app/content/task/[id].tsx`, dados de `GET /task/:id` via `getTaskById`,
  query `['task', id]`):
  - título: "Atividade de {Categoria}";
  - card "Enunciado": `prompt`;
  - seção "Alternativas": as alternativas, com a correta marcada por ícone de check e o texto
    "Correta";
  - seção "Material de Apoio": "Áudio da Atividade" e "Imagem da Atividade", cada um mostrando o
    nome do arquivo (último segmento da URL) quando `audioFile`/`imageFile` existem. Sem nenhum
    dos dois, aparece "Sem material de apoio".
- D-03 **Grupo** (`app/content/group/[id].tsx`): o grupo vem da lista `['task-group']`, porque
  não há GET por id; as tarefas vêm de `['task']`.
  - título: `name`;
  - card com a categoria;
  - seção "Atividades do Grupo": as atividades de `tasksIds` (prompt e nº de alternativas). Tocar
    numa delas abre o detalhe da atividade. Sem atividades, aparece o estado vazio.
- D-04 **Caderno** (`app/content/notebook/[id].tsx`): vem da lista `['task-notebook']`
  (TaskNotebookWithGroups).
  - título: `description`;
  - card com a categoria e "N tarefas";
  - seção "Grupos do Caderno": os `taskGroups` (nome e nº de atividades). Tocar num grupo abre o
    detalhe do grupo. Sem grupos, aparece o estado vazio.
- D-05 **Excluir** funciona, com confirmação. O modal é local ("Excluir X?" com Cancelar e
  Excluir), porque `Alert` nativo não é testável no Vitest. Os endpoints são:
  - `DELETE /task/delete/:id`;
  - `DELETE /task-group/delete/:taskGroupId`;
  - `DELETE /task-notebook/delete/:taskNotebookId`.

  A exclusão usa `withOfflineGuard`, sem retry. Com sucesso, invalida a query do tipo e volta.
  Com erro, mostra a mensagem. O mock remove o item do array em memória: `MOCK_TASKS` e
  `MOCK_TASK_GROUPS` em `src/mocks/handlers/content.ts`, e `MOCK_TASK_NOTEBOOKS` em
  `src/mocks/fixtures.ts`. Id inexistente devolve 500 com `*_NOT_FOUND`.

- D-06 **Editar** abre "Em breve" (`/shell/coming-soon` com title "Editar X").
- D-07 **Navegação**: na aba Atividades (`src/features/activities/**`), tocar num item passa a
  abrir o detalhe do seu tipo, e não mais "Em breve". Só a frente UX5-N altera esse arquivo.
- D-08 Id inexistente ou excluído mostra "Não encontrado" com botão Voltar. Os estados de
  carregando e de erro têm botão para tentar de novo.

## 2. Critérios de aceite

- AC-01 Cada tela mostra só os campos do D-02 ao D-04, com os estados do D-08.
- AC-02 A navegação é encadeada: aba Atividades → caderno → grupo → atividade, com Voltar em
  todos os níveis.
- AC-03 Excluir pede confirmação e chama o endpoint. O item some da lista e o app volta à tela
  anterior. Um erro aparece sem reenvio automático (G-08).
- AC-04 Editar abre "Em breve".

## 3. Propriedade de arquivos

| Frente            | Arquivos exclusivos                                                                                                                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX5-A (atividade) | `app/content/task/[id].tsx`, `src/features/content-detail/task/**`, `src/api/endpoints/task-delete.ts`, `src/mocks/handlers/task-delete.ts`                                                                                                                                      |
| UX5-G (grupo)     | `app/content/group/[id].tsx`, `src/features/content-detail/group/**`, `src/api/endpoints/task-group-delete.ts`, `src/mocks/handlers/group-delete.ts`                                                                                                                             |
| UX5-N (caderno)   | `app/content/notebook/[id].tsx`, `src/features/content-detail/notebook/**`, `src/api/endpoints/task-notebook-delete.ts`, `src/mocks/handlers/notebook-delete.ts`, `src/features/activities/**` (só a navegação do D-07), `docs/contracts/ux5-detalhes.md` (cópia deste contrato) |

Compartilhado: uma linha de import por frente em `src/mocks/install.ts`. Nenhuma frente altera
`src/components/**`, `src/theme/**`, os mocks existentes (além de remover itens dos arrays via
handler próprio) nem as telas de criação. Componentes locais ficam na pasta da frente. Um card
de seção reutilizável pode ser duplicado localmente, sem pasta compartilhada nesta onda.

## 4. Validação

Os testes vêm antes: componente com dados mockados e handler DELETE pelo `apiClient` real. Os
comandos são:

- `pnpm run test`;
- `pnpm run typecheck`;
- `pnpm run lint`;
- `prettier --check` nos arquivos tocados;
- `python scripts/check-docs.py`;
- `git diff --check`.

A entrega vai direto na `main`, com fetch, rebase e push. A validação visual é feita pelo
orquestrador, no emulador.

## 5. Histórico

- 2026-09-25: criação pelo orquestrador (3 frentes Sonnet em paralelo).
