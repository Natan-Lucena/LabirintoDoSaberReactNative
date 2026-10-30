# Entrega 3 — Correções pedidas ao backend

> Origem: rodada manual da Entrega 3 no emulador Android (2026-10-29, QA-06, PR #117), feita
> contra o backend real (`https://labirinto-do-saber.vercel.app`) com os mocks desligados. Os
> defeitos do app encontrados na mesma rodada já foram corrigidos (PRs #118 a #128 e #130 a
> #133). Este documento reúne só o que precisa mudar **no backend**, em ordem de prioridade.
> Os IDs D4, D5 e D6 são os da tabela de resultados do [PLANO-TESTES](PLANO-TESTES.md#62-tabela-de-resultados-rodada-de-2026-10-29).
> Nenhum valor real (token, senha, e-mail, dado de paciente) aparece aqui.

## Resumo

| #   | Prioridade  | Rota                                                                       | Problema                                                               | O app muda depois? |
| --- | ----------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------ |
| B1  | **Urgente** | `PUT /educator/update-educator`; `GET /student` e respostas de aluno       | A resposta traz a senha (ou o hash) do educador                        | Não                |
| B2  | Alta        | `PUT /student/update/:id`                                                  | `learningTopics` é ignorado: a dificuldade nova não é salva            | Não                |
| B3  | Alta        | `PUT /task-notebook/update`, `DELETE /task-notebook/delete/:id` (e grupos) | Confirmar que só o dono do caderno (ou do grupo) pode editar e excluir | Não                |
| B4  | Média       | `GET /anamnese/responses/:responseId`                                      | Sem acesso devolve 401; deveria ser 403, como o `PUT` da mesma rota    | Opcional           |

## B1 — Senha do educador nas respostas (D5) — urgente

**O que acontece**

- `PUT /educator/update-educator` responde com a entidade interna, de campos prefixados com `_`
  (`_name`, `_contact`, `_profession`, `_photoUrl`) **e `_password`**. Confirmado de novo na rodada
  de 2026-10-29 (caso BE-06).
- Na conferência com o Swagger (2026-10-29), as respostas de aluno (`GET /student/`,
  `POST /student/create`, `PUT /student/update/:id`) traziam `educators[]` com `id`, `name`,
  `email`, `createdAt`, `profession` e **`password`** de cada educador ligado ao aluno. Conferir
  se ainda acontece.

**Como reproduzir**

1. Autenticar como um educador de teste.
2. `PUT /educator/update-educator` com qualquer campo válido (por exemplo, `profession`).
3. Olhar o corpo da resposta: aparece `_password`.
4. `GET /student/`: olhar `educators[]` de qualquer aluno.

**O que deve acontecer**

- Nenhuma resposta da API devolve senha ou hash de senha, de nenhum educador.
- `PUT /educator/update-educator` devolve o mesmo formato de `GET /educator/me` (campos sem `_`),
  ou `204` sem corpo.
- Em `educators[]` das respostas de aluno, no máximo `id`, `name` e `profession` (o app não usa
  esse campo; removê-lo também resolve).

**Critérios de aceite**

- B1-01: nenhuma resposta das rotas acima contém as chaves `password` ou `_password` (em qualquer
  nível).
- B1-02: `PUT /educator/update-educator` responde `200` com o formato de `GET /educator/me`, ou
  `204`.
- B1-03: as respostas de aluno não trazem `email` nem senha de outros educadores.

**Impacto no app:** nenhum. O app já descarta a resposta do `update-educator` e recarrega
`GET /educator/me` (`src/api/endpoints/educator-update.ts`), e remove `educators` das respostas de
aluno antes de usar (`src/api/endpoints/student.ts`, `student-create.ts`, `student-update.ts`). O
risco é de segurança: qualquer cliente que chama essas rotas recebe a credencial.

## B2 — `learningTopics` ignorado na edição do paciente (D4)

**O que acontece**

Na tela "Editar paciente", o educador adiciona uma dificuldade e salva. O app envia
`PUT /student/update/:id` (multipart) com **só os campos alterados**; para as dificuldades, manda o
campo `learningTopics` com a **lista completa** serializada como string JSON (o mesmo formato do
`POST /student/create`, que funciona). O backend responde `200`, mas a lista salva não muda: ao
reabrir a ficha, a dificuldade nova não está lá (caso PAC-07.7).

**Como reproduzir**

1. Autenticar como um educador de teste e escolher um aluno de teste com, por exemplo,
   `learningTopics = ["Leitura"]`.
2. `PUT /student/update/:id`, `multipart/form-data`, com um único campo:
   `learningTopics` = `["Leitura","Escrita"]` (texto JSON).
3. `GET /student/` (ou a resposta do próprio `PUT`): `learningTopics` continua `["Leitura"]`.

**O que deve acontecer**

- Quando `learningTopics` vem no corpo, ele **substitui** a lista do aluno (não é um merge).
- Aceitar o mesmo formato do `create`: string JSON de uma lista de strings. Se o campo vier
  inválido (não é JSON, não é lista, item que não é string), responder `400` com código
  específico, como as outras validações.
- Quando `learningTopics` não vem, a lista atual fica como está (o app só envia campos alterados).
- Lista vazia (`[]`) é permitida? Definir e documentar no Swagger. O app hoje exige pelo menos
  uma dificuldade no formulário.

**Critérios de aceite**

- B2-01: `PUT` com `learningTopics=["Leitura","Escrita"]` → `200`, e o `GET` seguinte devolve as
  duas.
- B2-02: `PUT` sem `learningTopics` (só `name`, por exemplo) não altera a lista.
- B2-03: `learningTopics` inválido → `400` com código de validação, sem alterar o aluno.
- B2-04: o Swagger de `PUT /student/update/:id` descreve o campo e o formato.

**Impacto no app:** nenhum; o formato enviado já é o do `create`
(`src/api/endpoints/student-update.ts`, `JSON.stringify(input.learningTopics)`).

## B3 — Editar e excluir caderno ou grupo de outro educador (D6)

**O que acontece**

`GET /task-notebook/` devolve também os cadernos de outros educadores. **Decisão do produto
(2026-10-30): a biblioteca é compartilhada**, então a listagem continua devolvendo todos; só o
dono pode editar ou excluir. O app já esconde "Editar" e "Excluir" em caderno e grupo de outro
educador (PR #122 e FEC-03), mas a regra precisa valer no servidor: hoje não sabemos se uma
chamada direta à API consegue alterar ou apagar o caderno de outra pessoa.

**Como conferir**

1. Educador A cria um caderno de teste (e um grupo dentro dele).
2. Autenticado como educador B:
   - `PUT /task-notebook/update` com o `id` do caderno de A;
   - `DELETE /task-notebook/delete/:id` com o `id` do caderno de A;
   - `PUT /task-group/update` e `DELETE /task-group/delete/:id` com o grupo de A.
3. O caderno e o grupo de A não podem mudar.

**O que deve acontecer**

- Quem não é o dono recebe **`403`** com um código específico (por exemplo,
  `NOT_NOTEBOOK_OWNER` e `NOT_GROUP_OWNER`), e nada é alterado.
- Caderno ou grupo inexistente: `404` (ou o `400 NOT_FOUND` já usado na API, desde que seja
  consistente e documentado).
- Documentar no Swagger que a listagem é compartilhada e que editar e excluir são só do dono.

**Critérios de aceite**

- B3-01: educador B recebe `403` nas quatro chamadas acima; o caderno e o grupo de A continuam
  iguais.
- B3-02: educador A continua editando e excluindo os próprios cadernos e grupos.
- B3-03: os códigos de erro estão no Swagger.

**Impacto no app:** nenhum. Se o servidor responder `403`, o app mostra o erro genérico da tela
(o caso só ocorre por corrida ou chamada direta, porque os botões já ficam escondidos).

## B4 — Status de "sem acesso" na anamnese (opcional)

`GET /anamnese/responses/:responseId` de outro educador devolve **401** `Unauthorized`; o `PUT` da
mesma rota devolve **403** `UNAUTHORIZED`. O 401 é o status de "sessão expirada", e o app sai da
conta em qualquer 401; por isso o app hoje **não chama** essa rota (PAC-06). Devolver `403` deixa
a API consistente e permite usar a rota no futuro.

- B4-01: `GET /anamnese/responses/:responseId` de outro educador → `403` com o mesmo código do
  `PUT`.

**Impacto no app:** nenhum agora; com o `403`, o app pode passar a usar a rota numa tarefa futura.

## Como validar depois da correção

1. Avisar o time do app com a lista dos itens corrigidos e o commit/deploy do backend.
2. O app refaz, no emulador e contra o backend real, os casos PAC-07.7 (B2) e BE-06 (B1) de
   [testes/](testes/02-pacientes.md), e confere B3 por chamada direta com dois educadores de teste.
3. O resultado entra no [TRACKING](TRACKING.md) com a data e o commit testado.

## Resposta do backend (2026-10-30)

O backend corrigiu os quatro itens no PR #29 do repositório dele (merge `82ef08e`), já em produção.
O orquestrador conferiu o Swagger publicado (`/api-docs/`) no mesmo dia.

| #   | Situação  | O que mudou                                                                                                                                                                                                                                                                                  | Conferido no Swagger                                                                        |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| B1  | Corrigido | `PUT /educator/update-educator` e `PUT /educator/update-profile-picture` respondem no formato de `GET /educator/me`; `educators[]` das respostas de aluno traz só `{ id, name, profession }` (`profession` pode ser `null`); o `educator` da resposta de `POST /task-notebook/create` também | Sim: `StudentEducator` com `id`, `name` e `profession`; nenhum schema de resposta com senha |
| B2  | Corrigido | `learningTopics` substitui a lista; omitido, a lista fica; aceita texto JSON ou lista separada por vírgula; lista vazia ou item inválido → `400` com `errors[].field = "learningTopics"`, sem alterar o aluno                                                                                | Sim: `minItems: 1`, descrição do formato                                                    |
| B3  | Corrigido | Caderno: `403 NOT_NOTEBOOK_OWNER`, `404 TASK_NOTEBOOK_NOT_FOUND`. Grupo: `403 NOT_GROUP_OWNER`, `404 TASK_GROUP_NOT_FOUND`. A listagem continua compartilhada; `educatorId` no corpo de `PUT /task-group/update` é ignorado                                                                  | Sim: 403 e 404 nas quatro rotas                                                             |
| B4  | Corrigido | `GET /anamnese/responses/:responseId` e `GET`, `PUT` e `DELETE /anamnese/templates/:templateId` de outro educador respondem `403 UNAUTHORIZED`; o 401 fica só para sessão ausente ou expirada                                                                                                | Sim: 403 no `GET` da resposta                                                               |

**Mudanças de status:**

- Caderno ou grupo inexistente no update ou no delete: era 500, agora é 404.
- Id ou dado inválido no update de caderno e grupo: era 500, agora é 400.
- Os corpos de 403 e 404 trazem só `{ message }`.

O app trata todos esses casos com a mensagem de erro genérica da tela, sem mudança.

**Pendente:**

- Refazer no emulador PAC-07.7 (B2) e BE-06 (B1), contra o backend real.
- Conferir B3 por chamada direta com dois educadores de teste.
- Opcional (B4): numa tarefa futura, o app pode voltar a chamar `GET /anamnese/responses/:responseId`, hoje evitado pela PAC-06.
