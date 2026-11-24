# ATV-11 — Criar e editar atividades dos tipos novos

> Refino da ficha [ATV-11 do BACKLOG](../BACKLOG.md#atv-11--criar-e-editar-atividades-dos-tipos-novos),
> escrito em 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em
> [PLANO](../PLANO.md). Limites e erros propostos na
> [especificação §2](../ESPECIFICACAO-BACKEND.md#2-banco-de-atividades--p1); a API-06 confirma.

| Campo           | Valor                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-3                                                                                                                                                                                                          |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio-alto (quatro formulários com listas dinâmicas e upload)                                                                                                        |
| Estimativa      | G · 10 h de worker                                                                                                                                                                                            |
| Dependências    | API-07 leva 1 (tipos `TaskContent`, `listTaskSkills`, mocks de criar/editar); ATV-04b (paleta); G-64. Desenvolve em paralelo à ATV-09 (arquivos disjuntos); só o passo 8 do §7 espera a ATV-09 na `main`      |
| Backend         | Leva 1 (§2). **Mock-first; só vai para a `main` depois da leva 1** (envia tipos que o backend atual recusa)                                                                                                   |
| Dona nesta onda | `app/content/new-task.tsx`, `app/content/new-activity.tsx` (novo), `app/content/task/[id]/edit.tsx`, `src/features/content-create/activity-types/**` (novo), `src/api/endpoints/{task-create,task-update}.ts` |
| Libera          | Conteúdo para os jogos e imprimíveis sem depender da biblioteca                                                                                                                                               |

## 1. Objetivo e valor

História **US2-10**. Sem editor, o profissional só usa as atividades prontas (seed do backend).
Com ele, cria "Forme a palavra" com a palavra do momento da criança, monta a associação de
cores, a memória com figuras do tema e o imprimível do dia — e edita depois.

## 2. Referência de design

Sem tela no Figma (G-18). Mesmo padrão do formulário atual da múltipla escolha
(`src/features/content-create/task/NewTaskScreen.tsx`): `AppHeader` "Nova atividade" /
"Editar atividade" com subtítulo "Banco de atividades", `Field`, `SelectField`, `Checkbox`,
`SegmentedControl`, `CheckList`, `DsButton` de largura total, campos de mídia
`ImagePickerField` e `AudioPickerField` (`src/components/media/`; o "MediaPicker" citado no
backlog não existe com esse nome).

## 3. Fluxo do usuário

**Criar**

1. Banco → `Fab` "Criar" → "Atividade" (opção atual do `CreateContentSheet`, rota
   `/content/new-task`, sem mudar o `ActivitiesScreen`).
2. `/content/new-task` **sem** parâmetro `type` mostra a escolha do tipo
   (`ActivityTypeChooser`): lista de `DsButton` `variant="secondary"` com descrição curta:
   - "Múltipla escolha" — "Leia e responda, com imagem ou áudio opcionais" →
     `router.replace({ pathname: "/content/new-task", params: { type: "multipleChoice" } })` →
     `NewTaskScreen` de hoje, sem mudança;
   - "Forme a palavra", "Associe as cores", "Memória visual", "Imprimível" →
     `router.replace({ pathname: "/content/new-activity", params: { type } })`.
3. `/content/new-activity?type=…` → `ActivityTypeForm` do tipo (§3.1).
4. "Salvar atividade": envia as mídias novas (`uploadTaskMedia`, uma por vez), depois
   `POST /task/create`.
5. Sucesso: `invalidateQueries({ queryKey: ["task"] })`; se a resposta trouxer `Task`
   (`201 Task`), `router.replace("/content/task/{id}")`; se vier vazia (contrato antigo),
   `router.replace("/(tabs)/activities")`. Toast "Atividade criada.".

**Editar**

1. Detalhe → "Editar Atividade" → `/content/task/[id]/edit` (rota existente).
2. A rota decide pelo tipo da tarefa (`useQuery(["task", id])`, a mesma chave do detalhe):
   múltipla escolha → `NewTaskScreen` (hoje); tipos novos → `ActivityTypeForm` preenchido.
3. O tipo não muda (o seletor não aparece na edição). Salvar envia só os campos alterados em
   `PUT /task/update`; volta ao detalhe com `router.back()` (padrão do `NewTaskScreen`).

**3.1 Campos por tipo** (comuns em todos: "Instrução para a criança *" = `prompt` (1–500),
"Categoria *" (as quatro atuais), "Habilidades" (`CheckList` de `GET /task/skills`, até 5),
"Tema" (até 60), "Cor da miniatura" (`SegmentedControl` Menta/Pêssego/Lavanda/Amarelo; opcional))

| Tipo             | Campos específicos                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forme a palavra  | "Palavra *" (2–12 letras; aceita acento; o app converte para maiúsculas); "Letras extras" (até 6, uma por campo curto ou separadas por espaço); imagem de dica; áudio de dica |
| Associe as cores | Lista de pares (2–6): "Palavra" (1–20) + cor escolhida na paleta (`COLOR_PALETTE` da ATV-04b, sem digitar hex); "Adicionar par" / "Remover par"                               |
| Memória visual   | Lista de cartas (2–8): "Texto da carta" (até 20) e/ou imagem; ao menos um dos dois; "Adicionar carta" / "Remover carta"                                                       |
| Imprimível       | "Título *" (1–80), "Instruções *" (1–500), "Disposição" (`SegmentedControl` Lista/Grade/Sequência), itens (1–20): texto (até 200) e/ou imagem, "Linhas para resposta" (0–5)   |

## 4. Estados

| Estado                    | Comportamento e texto                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carregando (edição)       | "Carregando atividade..." (padrão do `NewTaskScreen`)                                                                                                           |
| Erro ao carregar (edição) | "Não foi possível carregar a atividade." + `DsButton` "Tentar novamente"                                                                                        |
| Habilidades indisponíveis | `CheckList` substituído por "Não foi possível carregar as habilidades." + "Tentar novamente"; o resto do formulário salva sem habilidades                       |
| Validação local           | Mensagem embaixo do campo (zod); "Salvar atividade" desabilitado enquanto inválido                                                                              |
| Enviando                  | Botão com `loading`; campos desabilitados; texto "Enviando imagens..." enquanto sobe mídia                                                                      |
| Mídia acima de 10 MB      | "O arquivo excede o limite de 10 MB." (já vem do `TaskMediaTooLargeError`)                                                                                      |
| `400 INVALID_CONTENT`     | Marca o campo de `errors[].field` (§6.5) e mostra "Revise os campos marcados."                                                                                  |
| Outros erros de regra     | Mensagem do `normalizeApiError` (API-07): `INVALID_SKILL`, `INVALID_MEDIA_URL`, `ALTERNATIVES_NOT_ALLOWED`, `TYPE_CHANGE_NOT_ALLOWED`, `LIBRARY_TASK_READ_ONLY` |
| Offline                   | `withOfflineGuard`: "Sem conexão. Verifique a rede e tente novamente." (nada é enviado)                                                                         |
| Sair com alterações       | Sem confirmação nesta tarefa (o `NewTaskScreen` também não tem)                                                                                                 |
| Sucesso                   | Toast "Atividade criada." / "Atividade atualizada." e navegação do §3                                                                                           |

## 5. Contrato de dados

| Método e rota             | Função                                              | Corpo                                                                                                                                             |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /task/upload-media` | `uploadTaskMedia(file)` (existente)                 | multipart `file` → `{ url }`                                                                                                                      |
| `POST /task/create`       | `createActivity(input)` (novo, em `task-create.ts`) | multipart: `category`, `type`, `prompt`, `content` (string JSON), `skills?` (string JSON), `theme?`, `tone?`; **sem** `alternatives` → `201 Task` |
| `PUT /task/update`        | `updateTask(input)` (existente, tipo ampliado)      | JSON: `id` + só os alterados entre `prompt`, `category`, `content`, `skills`, `theme`, `tone`; **nunca** `type`                                   |
| `GET /task/skills`        | `listTaskSkills()` (API-07)                         | query key `["task", "skills"]`                                                                                                                    |

- `createTask` atual (múltipla escolha) não muda; `createActivity` fica ao lado, no mesmo
  arquivo, e devolve `Task | null` (`null` quando o `201` vier vazio).
- `UpdateTaskInput` ganha `content?: TaskContent`, `skills?: string[]`, `theme?: string`,
  `tone?: TaskTone`.
- Mocks: `src/mocks/handlers/task-create.ts` e `task-update.ts` aceitam os tipos novos com as
  validações do §6 (inclusive `INVALID_CONTENT` com `field`), e `GET /task/:id` passa a ver a
  atividade criada.
- Invalidação: `["task"]` (cobre detalhe, lista antiga e o catálogo da ATV-09).

## 6. Regras de negócio e casos de borda

1. **`content.kind` igual ao `type`**, sempre montado pelo app a partir do formulário
   (`buildContent(type, values)` puro).
2. **Limites validados antes do envio** (zod), iguais ao contrato: palavra 2–12 letras (`/^\p{L}+$/u`
   depois do `trim`), extras 0–6 letras únicas; pares 2–6, palavra 1–20, cor da paleta; cartas
   2–8, cada uma com texto ou imagem; imprimível com título 1–80, instruções 1–500, itens 1–20,
   cada um com texto ou imagem, `answerLines` 0–5; habilidades até 5; tema até 60.
3. **Ids dos itens** (`pairs[].id`, `cards[].id`, `items[].id`): gerados no app na criação
   (`p1`, `p2`…, `c1`…, `i1`…, sem repetir no mesmo conteúdo) e **preservados na edição**;
   item novo na edição recebe o próximo número livre.
4. **Mídia**: imagens e áudio são enviados antes de salvar; a URL devolvida vai para o campo do
   `content` (`hintImageUrl`, `hintAudioUrl`, `cards[].imageUrl`, `items[].imageUrl`). Falha num
   upload interrompe o salvamento e mantém o formulário. Na edição, mídia não trocada mantém a
   URL atual.
5. **`INVALID_CONTENT`**: `ApiError.errors[].path` pode vir como `content.word`,
   `content.pairs.2.word` ou só `content` (o `normalizeApiError` guarda o `field` como veio, e o
   backend publicado manda só o primeiro nível do caminho). O mapa
   `fieldFromApiPath(path)` marca o campo exato quando o caminho é completo e, com `content`
   apenas, mostra o erro no topo do formulário: "Revise o conteúdo da atividade.".
6. **Biblioteca**: a edição nunca abre para `source: "LIBRARY"` (o detalhe não mostra "Editar",
   ATV-09); se o `PUT` devolver `403 LIBRARY_TASK_READ_ONLY`, mostra a mensagem.
7. **Imprimível** não entra em caderno, grupo nem sessão (AT-10): o editor não oferece isso.
8. Palavra digitada em minúsculas é convertida para maiúsculas na exibição e no envio
   (`toLocaleUpperCase("pt-BR")`), mantendo o acento.

## 7. Plano de implementação

1. `src/api/endpoints/task-create.ts`: `CreateActivityInput` e `createActivity`;
   `task-update.ts`: ampliar `UpdateTaskInput`. Testes pelo `apiClient` real com os mocks
   (sucesso e `INVALID_CONTENT`).
2. `src/mocks/handlers/task-create.ts` e `task-update.ts`: ramos dos tipos novos (validação,
   `201 Task`, `TYPE_CHANGE_NOT_ALLOWED`, `LIBRARY_TASK_READ_ONLY`), seção no
   `src/mocks/README.md`.
3. `src/features/content-create/activity-types/` (novo):
   - `schema.ts`: um esquema zod por tipo + `buildContent` + `contentToFormValues` (edição);
   - `ActivityTypeChooser.tsx`;
   - `ActivityTypeForm.tsx` (campos comuns, envio, erros) e um componente de campos por tipo:
     `WordBuilderFields.tsx`, `ColorMatchFields.tsx`, `MemoryGameFields.tsx`,
     `PrintableFields.tsx` (listas com `useFieldArray` do React Hook Form);
   - `fieldFromApiPath.ts`.
4. `app/content/new-task.tsx`: sem `type` → `ActivityTypeChooser`; com `type=multipleChoice` →
   `NewTaskScreen`.
5. `app/content/new-activity.tsx` (novo): `ActivityTypeForm` com o `type` da rota (tipo
   inválido → volta para `/content/new-task`).
6. `app/content/task/[id]/edit.tsx`: carrega a tarefa e escolhe `NewTaskScreen` ou
   `ActivityTypeForm` pelo tipo.
7. Paleta de cores: importar `COLOR_PALETTE` de
   `src/features/activities/engine/color-match/colorNames.ts` (ATV-04b; só leitura). Se a ATV-04b
   ainda não estiver na `main`, a ATV-11 espera por ela (não duplica a paleta).
8. Detalhe: a ATV-09 deixa "Editar" só para múltipla escolha; **esta tarefa** mostra "Editar"
   também para os tipos novos alterando a condição em
   `src/features/content-detail/task/TaskDetailScreen.tsx` (uma linha, depois da ATV-09).

## 8. Arquivos

- **Permitidos:** `app/content/new-task.tsx`, `app/content/new-activity.tsx` (novo),
  `app/content/task/[id]/edit.tsx`, `src/features/content-create/activity-types/**` (novo),
  `src/api/endpoints/task-create.ts`, `src/api/endpoints/task-update.ts`,
  `src/mocks/handlers/task-create.ts`, `src/mocks/handlers/task-update.ts`,
  `src/mocks/README.md` (só a seção), `src/features/content-detail/task/TaskDetailScreen.tsx`
  (só a condição do "Editar"), testes ao lado.
- **Proibidos:** `src/features/content-create/task/NewTaskScreen.tsx` (a FEC-06 mexe depois),
  `src/features/activities/ActivitiesScreen.tsx` e `components/CreateContentSheet.tsx`,
  `src/api/types.ts` e `errors.ts` (API-07), `engine/**`, `package.json`.

## 9. Critérios de aceite

| ID           | Critério                                                                                       | Verif. |
| ------------ | ---------------------------------------------------------------------------------------------- | ------ |
| AC-ATV-11-01 | O corpo enviado tem `content.kind` igual ao tipo e respeita os limites antes do envio          | `UT`   |
| AC-ATV-11-02 | `INVALID_CONTENT` com `field` completo marca o campo certo; só `content` mostra o erro no topo | `CT`   |
| AC-ATV-11-03 | Editar mantém os ids dos itens e envia só os campos alterados, sem `type`                      | `UT`   |
| AC-ATV-11-04 | "Múltipla escolha" no seletor abre o formulário atual sem mudança                              | `REV`  |
| AC-ATV-11-05 | Cada tipo criado no app abre e é jogável (ou imprimível) contra o backend real                 | `MAN`  |

## 10. Como testar manualmente (Victor)

Expo Go Android, backend real depois da leva 1.

1. Atividades → "+" → "Atividade": aparece a escolha do tipo.
2. "Forme a palavra": instrução "Forme a palavra da figura", palavra "gato", letras extras "E
   I", uma imagem da galeria → "Salvar atividade": abre o detalhe; "Jogar" funciona com "GATO".
3. Tente uma palavra com número ("GAT0"): o botão não habilita e aparece o erro.
4. "Associe as cores" com 1 par: não salva; com 3 pares salva.
5. "Memória visual" com 2 cartas de texto e 1 com imagem: salva e joga.
6. "Imprimível" com 3 itens em "Sequência": salva; o detalhe mostra o formato "Imprimível".
7. Edite a "Forme a palavra" trocando só o tema: salva e a palavra continua a mesma.
8. "Múltipla escolha" no seletor: formulário de sempre.

## 11. Riscos e perguntas em aberto

- **Formato multipart de `content` e `skills`** (strings JSON) é proposta da especificação; a
  API-06 confirma. Se o backend preferir JSON puro numa rota nova (`POST /task/`), muda só
  `createActivity`.
- **`201 Task` vazio**: tratado (§3, passo 5).
- **`field` com o caminho completo**: o backend publicado manda só o primeiro nível
  (`src/api/errors.ts`); por isso o fallback no topo do formulário.
- Upload de várias imagens (memória/imprimível) em rede lenta pode demorar: um upload por vez,
  com o texto "Enviando imagens..."; sem paralelismo nesta tarefa.

## 12. Fora do escopo

IA para os tipos novos (fica só na múltipla escolha), editar atividade da biblioteca (só
duplicando), mudar o tipo de uma atividade, confirmação ao sair com alterações, reordenar itens
por arrastar.
