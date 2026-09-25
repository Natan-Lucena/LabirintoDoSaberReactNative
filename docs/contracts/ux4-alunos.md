# UX4 — Alunos (listagem, detalhes e cadastro)

Contrato geral do orquestrador (Claude Code `claude-opus-5-5`). Pedido do usuário em
2026-09-25: implementar as telas de aluno do Figma, um agente por tela. Dados mockados
(G-29); referência visual no Figma (G-30).

## 1. Objetivo, escopo e decisões

Referências (arquivo Figma `IuUM9BWR6sCXTOUmXcguQf`):

| Nó        | Tela                                    | Frente |
| --------- | --------------------------------------- | ------ |
| `1:23877` | Alunos — listagem com busca e paginação | UX4-L  |
| `1:23989` | Alunos — detalhes do aluno              | UX4-D  |
| `1:24697` | Alunos — cadastrar aluno                | UX4-C  |

Decisões do orquestrador pelo contrato da API (`Student`, `GET /student/`,
`POST /student/create`) e pelo prazo:

- D-01 **Só campos da API** (G-11/G-14). O Figma mostra nível ("Nível 1 - Inicial"),
  "Progresso Geral" em %, data de nascimento e "Progresso por Categoria". A API não tem
  nenhum desses dados, então eles **não entram**; não se inventam valores nos mocks.
- D-02 **Listagem** (aba Alunos, substitui o placeholder "Em breve" de `app/(tabs)/students.tsx`).
  - Busca "Buscar aluno por nome...", sem distinção de acento e maiúscula.
  - Contagem "Alunos organizados em ordem alfabética (N alunos)" e ordem alfabética.
  - Cards com avatar (`photoUrl` ou a ilustração `assets/images/avatar-crianca.png` sobre um fundo
    colorido alternado), nome, "N anos • Feminino/Masculino" e os `learningTopics` como tags.
  - Paginação de 10 em 10.
  - Link "+ Cadastrar Aluno" abre o cadastro; tocar num card abre os detalhes.
- D-03 **Detalhes** (`app/students/[id].tsx`).
  - O aluno vem da lista (`GET /student/`, query `['student']`), porque não existe
    `GET /student/:id`. Um id inexistente mostra o estado "Aluno não encontrado" com Voltar.
  - Campos exibidos:
    - avatar, nome e "N anos • gênero";
    - "Endereço" (`road`, `housenumber`, CEP `zipcode`);
    - "Contato do Responsável" (`phonenumber`);
    - "Objetivos de Aprendizado" (`learningTopics`).
  - O botão de editar abre "Em breve", porque a edição não está no escopo.
  - "Progresso por Categoria" não entra (D-01).
- D-04 **Cadastro** (`app/students/new.tsx`, `POST /student/create` multipart).
  - Campos e validação da API:
    - Nome Completo (1–100);
    - Idade (1–50);
    - Gênero (Feminino/Masculino → `female`/`male`);
    - Contato do Responsável (7–15, só dígitos no envio);
    - CEP (5–10);
    - Rua (1–100);
    - Número (1–10).
  - "Complemento" **não entra**, porque a API não o tem.
  - É **acrescentado** "Objetivos de Aprendizado *": a API exige `learningTopics`, com mínimo 1.
    O usuário digita um tópico, toca em "Adicionar", e ele vira um chip removível.
  - "Adicionar foto" fica **desabilitado com "Em breve"**, porque não há seletor de imagem
    instalado. O texto "Opcional - pode ser adicionada depois" se mantém.
  - Rodapé com Cancelar e "Cadastrar Aluno". Com sucesso: invalida `['student']`, volta para a
    lista e o aluno aparece nela (e também na tela 04 da sessão).
- D-05 **Mock**: o handler `POST /student/create` lê FormData ou objeto, valida conforme a API
  (400 na validação), cria o `Student` com id fictício, `educatorId` do educador mock,
  `documents: []`, `educators` e `createdAt`, e dá push em `MOCK_STUDENTS`
  (`src/mocks/fixtures.ts`), em memória.
- D-06 Visual do Figma com os desvios de G-30: cores acessíveis do tema (G-17), ícones Ionicons
  (G-28) e nenhuma dependência nova. As rotas de detalhes e cadastro ficam fora das abas e usam
  o AppHeader com título "Alunos", como no Figma.

Não objetivos: editar ou excluir aluno, documentos, vincular educador, foto, progresso e
integração real (T-1004).

## 2. Critérios de aceite

- AC-L-01 A aba Alunos lista os alunos do mock em ordem alfabética, com a contagem, a busca e a
  paginação funcionando, e os estados carregando, vazio e erro com nova tentativa.
- AC-L-02 Tocar num aluno abre `/students/{id}`; "+ Cadastrar Aluno" abre `/students/new`.
- AC-D-01 Os detalhes mostram só os campos do D-03, e um id inexistente mostra o estado de não
  encontrado.
- AC-C-01 O cadastro valida todos os campos obrigatórios com mensagens acessíveis e envia
  `POST /student/create` em multipart, com `learningTopics` como string JSON. O aluno criado
  aparece na lista e na tela 04.
- AC-X-01 Um erro de rede ou de validação mostra a mensagem, sem reenvio automático (G-08), e o
  botão fica desabilitado durante o envio.

## 3. Propriedade de arquivos (disjunta)

| Frente | Agente                   | Worktree    | Arquivos exclusivos                                                                                                                     |
| ------ | ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| UX4-L  | Sonnet `claude-sonnet-5` | `lds-wt/w4` | `app/(tabs)/students.tsx`, `src/features/students-list/**`                                                                              |
| UX4-D  | Sonnet `claude-sonnet-5` | `lds-wt/c1` | `app/students/[id].tsx`, `src/features/student-detail/**`                                                                               |
| UX4-C  | Sonnet `claude-sonnet-5` | `lds-wt/c2` | `app/students/new.tsx`, `src/features/student-create/**`, `src/api/endpoints/student-create.ts`, `src/mocks/handlers/student-create.ts` |

Compartilhado: `src/mocks/install.ts`, onde entra uma linha de import (UX4-C). Nenhuma frente altera
`src/features/students/**` (usado pela tela 04), `src/components/**`, `src/theme/**`, a Home,
a tab bar nem os mocks existentes. Componentes locais ficam dentro da pasta da frente. O avatar
genérico pode ser importado de `assets/images/avatar-crianca.png` (já está na `main`).

## 4. Plano de testes e validação

Testes antes da implementação: componente em `__tests__` na pasta da frente, e handler de mock
pelo `apiClient` real. Validação: `pnpm run test`, `pnpm run typecheck`, `pnpm run lint`,
`prettier --check` nos arquivos tocados, `python scripts/check-docs.py` e `git diff --check`.
A entrega vai direto na `main`, com fetch, rebase e push. A validação visual é do orquestrador,
no emulador Android.

## 5. Histórico

- 2026-09-25: criação pelo orquestrador (3 frentes em paralelo).
