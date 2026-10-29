# Testes detalhados — Pacientes (PAC-07, PAC-06, PAC-08, PAC-04)

Detalhamento dos casos de [PLANO-TESTES](../PLANO-TESTES.md#2-casos-por-área-índice) para a
rodada manual da QA-06: o que fazer, o que esperar na tela e na rede, e, se falhar, onde olhar no código. Os IDs e
os casos do plano foram preservados; os casos com sufixo `+` são novos. Nada foi executado: a copy foi conferida
no código em 2026-10-29.

**Tarefas cobertas:** PAC-07 (editar paciente e responsável), PAC-08 (modelos de anamnese), PAC-06 (anamnese do
paciente) e PAC-04 (aba Planos e "PDI vigente" na ficha). Fichas no BACKLOG:
[PAC-07](../BACKLOG.md#pac-07--editar-paciente-e-responsável),
[PAC-08](../BACKLOG.md#pac-08--modelos-de-anamnese), [PAC-06](../BACKLOG.md#pac-06--anamnese-do-paciente),
[PAC-04](../BACKLOG.md#pac-04--aba-planos-na-ficha-do-paciente). Contrato do backend:
[BACKEND-ENTREGUE](../BACKEND-ENTREGUE.md) §6 ("Responsável do paciente", "Editar resposta de anamnese") e §9 (D1,
D4, D8, D9).

## 1. Mapa da área

| Rota (`app/...`)                              | Tela / componente                                                                               | Hook e chave de consulta                                                                             | Função de API                                                                                                                                          | Mock (`src/mocks/handlers/...`)                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `app/patients/new.tsx`                        | `src/features/patients/form/PatientFormScreen.tsx` › `PatientFormScreen` (sem `patient`)        | `useMutation` local; invalida `["student"]`                                                          | `createStudent` (`src/api/endpoints/student-create.ts`)                                                                                                | `student-create.ts`                                   |
| `app/patients/[id]/edit.tsx`                  | `PatientFormScreen` com `patient`                                                               | `useStudents` (`["student"]`)                                                                        | `updateStudent` (`src/api/endpoints/student-update.ts`)                                                                                                | `student-update.ts`                                   |
| `app/patients/[id].tsx`                       | `src/features/patients/detail/PatientDetailScreen.tsx` › `PatientDetailScreen`                  | `useStudents`, `useAppointments`, `useStudentAnalysis`, `useStudentSessions`, `useAnamneseResponses` | `listStudents`, `listAppointments`, análises e sessões                                                                                                 | `student.ts`, `appointment.ts`, `session-analysis.ts` |
| `app/patients/[id].tsx` (aba "Planos")        | `src/features/patients/detail/plans/PatientPlans.tsx` › `PatientPlans`, `ActivePdi`             | `usePatientPlans` (`["plan","student",id]`), `useActivePdi` (`["plan","student",id,"PDI","ACTIVE"]`) | `listPlans` (`src/api/endpoints/plans.ts`)                                                                                                             | `plans.ts`                                            |
| `app/anamnese/templates/index.tsx`            | `src/features/anamnese/templates/TemplateListScreen.tsx` › `TemplateListScreen`                 | `useQuery` `["anamnese","templates"]`                                                                | `listAnamneseTemplates` (`src/api/endpoints/anamnese.ts`)                                                                                              | `anamnese.ts`                                         |
| `app/anamnese/templates/new.tsx` e `[id].tsx` | `TemplateFormScreen.tsx` › `TemplateFormScreen`, `templateSchema.ts`                            | `["anamnese","templates",id]`; invalida `["anamnese","templates"]`                                   | `getAnamneseTemplate`, `createAnamneseTemplate`, `updateAnamneseTemplate`, `deleteAnamneseTemplate`                                                    | `anamnese.ts`                                         |
| `app/patients/[id]/anamnese.tsx`              | `src/features/anamnese/responses/AnamneseResponsesScreen.tsx`, `AnamneseForm.tsx`, `answers.ts` | `useAnamneseResponses` (`["anamnese","responses","student",id]`)                                     | `listAnamneseResponsesByStudent`, `createAnamneseResponse`, `updateAnamneseResponse`, `uploadAnamneseFile` (`src/api/endpoints/anamnese-responses.ts`) | `anamnese-responses.ts`                               |

**Design system** (`src/components/ds`): `AppHeader`, `DsButton`, `IconButton`, `Field`, `FieldGrid`,
`SegmentedControl`, `CheckList`, `Checkbox`, `SelectField`, `FeatureRow`, `Tabs`, `InfoCard`, `ProgressBar`,
`SectionTitle`, `Avatar`, `Toast`/`useToast`.

**Regras do app que valem para a área**

- **Privacidade (D1):** `GET /student/`, `POST /student/create` e `PUT /student/update/:id` podem trazer `educators`
  (lista com **senha** de outros educadores). O app descarta o campo em `listStudents`, `createStudent` e
  `updateStudent` antes de devolver aos hooks (`const { educators: _educators, ...student }`), para não ir ao cache
  persistido. Nada de valor desse campo deve aparecer em tela, log ou captura.
- **Telefones só com dígitos:** `phonenumber` e `guardianPhone` são digitados com máscara (`maskPhone` em
  `PatientFormScreen.tsx`, até 11 dígitos, ex.: "(11) 90000-0000") e enviados **sem máscara**
  (`replace(/\D/g, "")`). O backend só aceita 7 a 15 dígitos em `guardianPhone`.
- **Multipart:** `createStudent`/`updateStudent` enviam `FormData`; `learningTopics` vai como **string JSON**
  (`JSON.stringify`), `age` como string (PROJECT.md Parte II "Uploads").
- **Interceptor de 401 (`src/api/client.ts`):** **qualquer** `401` fora do `POST /educator/sign-in` aciona
  `subscribeSessionExpired` e **desloga**. É por isso que o app **não chama** `GET /anamnese/responses/:responseId`
  (D4: 401 para resposta de outro educador). A lista vem de `GET /anamnese/responses/student/:studentId`.

## 2. Cenários de mock úteis (sem backend)

Com `EXPO_PUBLIC_USE_MOCKS=true` (veja [`src/mocks/README.md`](../../../src/mocks/README.md), seções "Edição de
paciente (PAC-07)", "Modelos de anamnese (PAC-08)" e "Respostas de anamnese (PAC-06)"):

- Pacientes mock: `student-1` Lia Monteiro … `student-5` Maya Freitas; **nenhum** tem responsável
  (`guardian*` = `null`) e todos têm `phonenumber`. `student-5` tem sessão aberta.
- **Editar paciente:** `student-not-assigned` como id → `400 STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`; id
  inexistente → `404 STUDENT_NOT_FOUND`.
- **Modelos:** id `has-responses` em `PUT`/`DELETE /anamnese/templates/:id` → `400 TEMPLATE_HAS_RESPONSES`; id
  inexistente → `404 TEMPLATE_NOT_FOUND`. `GET /anamnese/templates/` lista dois modelos fictícios (`template-1`…).
- **Respostas:** `student-1` tem `response-1` do `template-1`; `response-other` é de outro educador (`PUT` → `403
UNAUTHORIZED`, `GET` por id → `401 Unauthorized`, que o app não chama). Códigos de validação simulados:
  `MISSING_REQUIRED_ANSWER`, `MISSING_TEXT_VALUE`, `MISSING_SELECTED_OPTION(S)`, `MISSING_FILE_URL`,
  `INVALID_QUESTION_ID`, `INVALID_OPTION_ID`; upload sem arquivo → `400 FILE_REQUIRED`.
- **Planos:** um PDI ativo, um PE ativo e um PDI concluído; `mock-student-foreign` simula `403 UNAUTHORIZED`.

## 3. Como diagnosticar uma falha da área (roteiro curto)

1. **Campo errado no corpo?** Compare o multipart (`student`) ou o JSON (`anamnese`) com a ficha; em edição o corpo
   deve ter **só** o que mudou (`dirtyFields`).
2. **Erro do backend ou do app?** `4xx` com `message` do contrato (`STUDENT_NOT_FOUND`, `TEMPLATE_HAS_RESPONSES`,
   `MISSING_*`) = backend; tela com dado velho e `2xx` = cache (`["student"]`, `["anamnese", …]`, `["plan"]`).
3. **Reproduza no mock** com o id do §2; se o mock reproduz, o defeito é do app.
4. **`401` inesperado leva ao Login** → alguma tela chamou uma rota de outro educador (D4) ou o token expirou;
   confira o último caminho chamado.

---

## 4. PAC-07 — Editar paciente e responsável

#### PAC-07.1 — Abrir "Editar paciente"

- **Prioridade / AC:** P1 · PAC-07 (MAN) · AC-PAC-07-01
- **Objetivo:** a edição abre preenchida e só habilita "Salvar alterações" quando algo muda.
- **Pré-condição:** Paciente A (com responsável) criado (PLANO-TESTES §1.2).
- **Passos:**
  1. Pacientes → tocar no Paciente A (ficha, aba "Visão geral").
  2. Rolar até a seção **"Dificuldades mapeadas"** e tocar na ação **"Editar"** (texto à direita do título da
     seção; **não há botão "Editar" no cabeçalho**).
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Editar paciente"** (subtítulo "Informações iniciais"); campos preenchidos: "Nome
    completo", "Idade", "Gênero" (Feminino/Masculino), **"Telefone de contato"** (com máscara, ex.: "(11) 90000-0000"),
    seção **"Responsável (opcional)"** com "Nome do responsável", "Telefone do responsável" e "Parentesco", seção
    "Endereço" ("CEP", "Rua", "Número"), "Dificuldades identificadas" (marcadas as do paciente), "Outra
    dificuldade" e "Adicionar dificuldade". O botão **"Salvar alterações"** fica **desabilitado** enquanto nada
    mudar.
  - **Rede (backend real):** a rota usa `GET /student/` já em cache (sem chamada nova; se não houver cache, `GET
/student/` `200`).
  - **Depois:** —
- **Onde está no código:** `app/patients/[id]/edit.tsx` › `EditPatientRoute` (acha o paciente em `useStudents`;
  estados "Carregando paciente", "Não foi possível carregar o paciente" com "Tentar novamente" e "Paciente não
  encontrado" com "Voltar"); `PatientDetailScreen.tsx` (`SectionTitle` com `actionLabel="Editar"`);
  `PatientFormScreen.tsx` › `PatientFormScreen` (`defaultValues`, `canSubmit = isValid && !isPending && (!patient ||
isDirty)`); DS `Field`, `FieldGrid`, `SegmentedControl`, `CheckList`, `DsButton`.
- **Testes automatizados que cobrem:** `src/features/patients/form/__tests__/PatientFormScreen.test.tsx` › "preenche
  a edição, desabilita sem mudanças e envia apenas o telefone alterado". Rodar:
  `pnpm exec vitest run src/features/patients/form/__tests__/PatientFormScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. _Botão habilitado sem mudar nada_ → `isDirty` do react-hook-form; algum `defaultValue` difere do digitado
     (máscara do telefone aplicada ao carregar: `maskPhone(patient.phonenumber)`).
  2. _Telefone de contato aparece em branco/errado_ → o registro vem sem `phonenumber` (D8) ou com mais de 11
     dígitos (`maskPhone` corta em 11); confira `GET /student/`.
  3. _"Paciente não encontrado"_ → o `id` não está em `GET /student/` (paciente de outro educador).
  4. _Rótulo "Telefone" no lugar de "Telefone de contato"_ → build antigo; o rótulo mudou na PAC-07 (TRACKING).
- **Evidência:** captura do formulário de edição (campos de telefone com os dígitos cobertos).
- **Divergência encontrada:** o PLANO-TESTES diz "Tocar em 'Editar'" na ficha; o único ponto de entrada é a ação
  de texto **"Editar"** da seção "Dificuldades mapeadas".

#### PAC-07.2 — Salvar nome e telefone do responsável

- **Prioridade / AC:** P1 · PAC-07 (MAN) · AC-PAC-07-01, AC-PAC-07-02, AC-PAC-07-03
- **Objetivo:** a edição envia só os campos alterados, com o telefone do responsável só em dígitos, e a ficha e a
  lista refletem o dado novo.
- **Pré-condição:** PAC-07.1.
- **Passos:**
  1. Mudar o "Nome completo" (ex.: acrescentar " Silva").
  2. Digitar um novo "Telefone do responsável" com máscara (ex.: "(11) 91111-2222").
  3. Tocar em **"Salvar alterações"**.
  4. Conferir a ficha e a lista de Pacientes.
- **Resultado esperado:**
  - **Tela:** toast **"Paciente salvo com sucesso"** e volta à ficha em ~0,7 s; a ficha mostra o nome novo; a lista
    de Pacientes também; o telefone do responsável fica salvo só com dígitos (confira no PAC-07.3 pelo número do
    `wa.me`).
  - **Rede (backend real):** `PUT /student/update/:id` (**multipart**) com **só** `name` e `guardianPhone`
    (`guardianPhone` = `11911112222`, sem máscara); `learningTopics`, `age` etc. **não** vão se não mudaram;
    resposta `200` com o aluno (`guardianName`, `guardianPhone`, `guardianRelationship` voltam; `null` quando
    vazios). Depois `GET /student/` refeito (invalidação de `["student"]`).
  - **Depois:** ficha e lista (mesma chave `["student"]`) atualizam; `PatientDetailScreen` usa o dado novo no
    contato (PAC-07.3).
- **Onde está no código:** `PatientFormScreen.tsx` › `submit` (monta o `patch` por `dirtyFields`), `mutation`
  (`withOfflineGuard`, `onSuccess` invalida `["student"]` e mostra o toast); `src/api/endpoints/student-update.ts` ›
  `updateStudent` (só envia o que está definido; `learningTopics` como `JSON.stringify`; `guardianPhone` com
  `replace(/\D/g, "")`; remove `educators`); mock `src/mocks/handlers/student-update.ts`.
- **Testes automatizados que cobrem:** `PatientFormScreen.test.tsx` › "preenche a edição, desabilita sem mudanças e
  envia apenas o telefone alterado" e "envia somente as dificuldades modificadas na edição";
  `src/mocks/__tests__/student-update.integration.test.ts` › "envia apenas os campos informados como multipart e
  atualiza a lista"; `src/api/__tests__/backend-contract.test.ts` › "remove educators da lista antes do cache".
- **Se falhar:**
  1. _`400` com mensagem de validação (telefone)_ → o corpo levou máscara ou menos de 7 dígitos; olhe o campo
     `guardianPhone` do multipart.
  2. _Ficha atualiza, lista não (ou o contrário)_ → invalidação de `["student"]`; as duas telas leem `useStudents`.
  3. _Campo que não mudou foi enviado_ → `dirtyFields` marcou o campo (por exemplo, o `setValue` de dificuldades
     usa `shouldDirty: true`).
  4. _`400 STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`_ → paciente de outro educador; no mock use `student-not-assigned`
     para ver a mensagem.
- **Evidência:** capturas da ficha antes/depois; método, caminho, status e **nomes** dos campos do multipart
  (sem os valores de telefone).

#### PAC-07.3 — Resumo com responsável e contato

- **Prioridade / AC:** P1 · PAC-07 (MAN) · AC-PAC-07-04
- **Objetivo:** a ficha mostra o responsável e o contato usa o telefone dele.
- **Pré-condição:** Paciente A com responsável (nome e parentesco preenchidos).
- **Passos:** abrir a ficha; ver o resumo; tocar no ícone **"Contatar responsável"**.
- **Resultado esperado:**
  - **Tela:** abaixo de "{idade} anos · Feminino/Masculino" aparece **"Responsável: {nome} ({parentesco})"**
    (o parêntese só se há parentesco; a linha só se há nome); o ícone abre o `wa.me` com o **telefone do
    responsável** (`55` + dígitos).
  - **Rede (backend real):** nenhuma chamada para abrir.
  - **Depois:** —
- **Onde está no código:** `PatientDetailScreen.tsx` (`patient.guardianName`, `patient.guardianRelationship`,
  `contactUrl`); `src/utils/whatsapp.ts` › `pickContactPhone`, `buildWhatsAppUrl`, `patientContactMessage`.
- **Testes automatizados que cobrem:** `PatientDetailScreen.test.tsx` › "mostra o responsável e usa seu telefone
  para contato" e "desabilita contato sem telefone e apresenta estados vazios próprios".
- **Se falhar:**
  1. _Abre o telefone do paciente_ → `guardianPhone` vazio no `GET /student/` (a edição não gravou) — compare com
     o PAC-07.2.
  2. _Sem a linha "Responsável"_ → `guardianName` ausente; D9 (backend trata vazio como ausente).
- **Evidência:** captura do resumo; o `wa.me` com o número mascarado.

#### PAC-07.4 — Telefone inválido e erro de rede

- **Prioridade / AC:** P2 · AC-PAC-07-05
- **Objetivo:** validação do telefone e erro sem perder o formulário.
- **Pré-condição:** formulário de edição.
- **Passos:** digitar no "Telefone do responsável" só "123"; tentar salvar; depois corrigir, ligar o modo avião e
  salvar de novo.
- **Resultado esperado:**
  - **Tela:** **"Informe um telefone válido"** sob o campo (regra: de 7 a 15 dígitos; vazio é aceito no telefone do
    responsável); o botão fica desabilitado enquanto inválido. No erro de envio aparece uma linha de erro com a
    **mensagem do erro** (offline: **"Sem conexão"**; erro do backend: a `message` dele) e o **formulário continua
    preenchido**, sem voltar.
  - **Rede (backend real):** inválido: nenhuma chamada; offline: `withOfflineGuard` recusa antes de chamar a API.
  - **Depois:** —
- **Onde está no código:** `PatientFormScreen.tsx` › `schema` (`guardianPhone`, `phonenumber`),
  `mutation.error` (texto exibido: `mutation.error.message`); `src/api/query-client.ts` › `withOfflineGuard`,
  `OfflineError`.
- **Testes automatizados que cobrem:** `PatientFormScreen.test.tsx` › "mantém os dados e mostra a mensagem da API
  se a edição falhar" e "bloqueia o salvamento sem todos os dados exigidos pela API".
- **Se falhar:**
  1. _Salvou telefone inválido_ → o `schema` aceita apenas 7 a 15 dígitos; confira `maskPhone` (corta em 11).
  2. _Formulário limpou após erro_ → o componente remontou; veja `router.back` chamado só pelo toast de sucesso.
- **Evidência:** captura do erro de telefone e da linha de erro de envio.
- **Divergência encontrada:** o PLANO-TESTES espera "Não foi possível salvar o paciente" no erro de rede; esse texto
  é só o **fallback** para erros que não são `Error`. Offline, o app mostra **"Sem conexão"**; com backend que
  responde erro, a `message` do backend (ex.: "Validation error"). Registre o texto observado.

#### PAC-07.5 — Apagar o responsável (limitação do backend)

- **Prioridade / AC:** P2 · PAC-07 (MAN)
- **Objetivo:** documentar o comportamento: vazio é "não enviado" para o backend, então o responsável não some.
- **Pré-condição:** paciente com responsável já salvo.
- **Passos:** editar → apagar o "Nome do responsável" → "Salvar alterações" → reabrir a ficha.
- **Resultado esperado:**
  - **Tela:** toast "Paciente salvo com sucesso"; ao reabrir, **o responsável continua salvo** (limitação do
    backend, D9/BACKEND-ENTREGUE §6). **Não é falha do app.**
  - **Rede (backend real):** `PUT /student/update/:id` com `guardianName` = `""` (campo presente e vazio); `200`; a
    resposta devolve o `guardianName` antigo.
  - **Depois:** ficha e lista continuam mostrando o responsável.
- **Onde está no código:** `PatientFormScreen.submit` (`patch.guardianName = values.guardianName.trim()` quando
  `dirtyFields.guardianName`); `updateStudent` (`formData.append(key, value.trim())` mesmo vazio).
- **Testes automatizados que cobrem:** nenhum cobre o apagar (o comportamento é do backend); o envio de vazio é
  coerente com `student-update.integration.test.ts` › "envia apenas os campos informados como multipart e atualiza
  a lista" (o mock ignora campos vazios do responsável, como o backend).
- **Se falhar:** _o responsável sumiu_ → o backend passou a aceitar vazio como "limpar" (mudança de contrato): registre
  como mudança, não como falha. _Erro `400`_ → registre o corpo e a mensagem.
- **Evidência:** capturas antes/depois e o campo `guardianName` do corpo (sem o valor).

#### PAC-07.6 — Cadastro com responsável

- **Prioridade / AC:** P2 · PAC-07 (MAN) · AC-API-03-04
- **Objetivo:** "Novo paciente" aceita o responsável e só envia `guardian*` quando preenchidos.
- **Pré-condição:** nenhuma.
- **Passos:** Pacientes → **"Novo paciente"** → preencher "Nome completo", "Idade" (1 a 50), "Gênero",
  "Telefone de contato", "CEP", "Rua", "Número", ao menos uma dificuldade e a seção "Responsável (opcional)" →
  **"Salvar paciente"**.
- **Resultado esperado:**
  - **Tela:** cabeçalho "Novo paciente"; toast "Paciente salvo com sucesso"; o paciente aparece na lista e a ficha
    mostra "Responsável: …". Validações exatas: "Informe o nome completo", "Informe a idade", "A idade deve ser
    entre 1 e 50", "Selecione o gênero", "Informe um telefone válido", "O CEP deve ter entre 5 e 10 caracteres",
    "Informe a rua", "Informe o número", "Selecione uma dificuldade".
  - **Rede (backend real):** `POST /student/create` (**multipart**) com `name`, `age`, `gender`, `zipcode`, `road`,
    `housenumber`, `phonenumber` (dígitos), `learningTopics` (string JSON) e, **só se preenchidos**, `guardianName`,
    `guardianPhone` (dígitos), `guardianRelationship`; `200/201` com o aluno.
  - **Depois:** lista de Pacientes (`["student"]`) mostra o novo.
- **Onde está no código:** `app/patients/new.tsx`; `PatientFormScreen.tsx` (modo criação); `createStudent` em
  `src/api/endpoints/student-create.ts`; mock `student-create.ts`.
- **Testes automatizados que cobrem:** `PatientFormScreen.test.tsx` › "envia o telefone só com dígitos e as
  dificuldades selecionadas" e "bloqueia o salvamento sem todos os dados exigidos pela API";
  `src/api/__tests__/backend-contract.test.ts` › "remove educators da resposta de criação".
- **Se falhar:**
  1. _`400` na criação_ → campo faltando/formato (`learningTopics` deve ser string JSON; `age` string numérica).
  2. _Paciente sem responsável apesar de preenchido_ → `createStudent` só anexa `guardian*` com texto não vazio.
  3. _Dado de `educators` na captura de rede_ → é do backend (D1); o app o descarta; **não copie o valor**.
- **Evidência:** captura da ficha criada; nomes dos campos do multipart.
- **Divergência encontrada:** o telefone de contato (`phonenumber`) é **obrigatório** no formulário (7 a 15 dígitos);
  não dá para criar um paciente sem telefone, o que impede o "Paciente C" do PLANO-TESTES §1.2 (veja o AGE-02.4 em
  `01-agenda.md`).

## 5. PAC-08 — Modelos de anamnese

**Regras do contrato** (BACKLOG PAC-08; PROJECT.md "Anamnese Template"): título 1–200; descrição até 1000; tipos
`Descriptive`, `MultipleChoice`, `Checkbox`, `FileUpload`; `MultipleChoice` e `Checkbox` com **pelo menos 2
opções**; modelo **com respostas não pode ser editado nem excluído** (`400 TEMPLATE_HAS_RESPONSES`). Os rótulos de
tipo na tela: **"Descritiva"**, **"Múltipla escolha"**, **"Caixas de seleção"**, **"Arquivo"**.

#### PAC-08.1 — Criar modelo

- **Prioridade / AC:** P1 · PAC-08 (MAN) · AC-PAC-08-02
- **Objetivo:** criar um modelo com uma pergunta de cada tipo e ver na lista.
- **Pré-condição:** nenhuma (ou ignore os existentes).
- **Passos:**
  1. Aba **Recursos** → **"Modelos de anamnese"** (grupo "Avaliação e conteúdo").
  2. **"Novo modelo"**; preencher "Título *" e "Descrição".
  3. **"Adicionar pergunta"** quatro vezes; para cada uma preencher "Texto da pergunta *", escolher o "Tipo *"
     (Descritiva, Múltipla escolha com 2 opções via **"Adicionar opção"**, Caixas de seleção com 3 opções,
     Arquivo) e marcar **"Obrigatória"** em uma.
  4. **"Salvar modelo"**.
- **Resultado esperado:**
  - **Tela:** cabeçalho "Novo modelo"; as perguntas aparecem como "Pergunta 1…4"; ao salvar, volta à lista
    "Modelos de anamnese" com o novo item e o subtítulo **"{descrição} · 4 perguntas"** ("1 pergunta" no singular).
    Não há toast.
  - **Rede (backend real):** `POST /anamnese/templates/` com `{ title, description (só se preenchida), questions:
[{ text, type, required, options? }] }` — **`options: [{ text }]` só nas perguntas de escolha**; `201/200` com o
    modelo (cada pergunta com `id`, `order`, `options[].id`). Depois `GET /anamnese/templates/` refeito.
  - **Depois:** o modelo aparece em "Escolher modelo" da anamnese do paciente (PAC-06).
- **Onde está no código:** `app/anamnese/templates/index.tsx` e `new.tsx`; `ResourcesScreen.tsx` (item "Modelos de
  anamnese", `destination: "/anamnese/templates"`); `TemplateListScreen.tsx`; `TemplateFormScreen.tsx` (`useFieldArray`
  com `append`, `typeOptions`, `save`); `templateSchema.ts` › `templateSchema`, `toTemplateInput`;
  `createAnamneseTemplate` em `src/api/endpoints/anamnese.ts`; mock `src/mocks/handlers/anamnese.ts`; DS `AppHeader`,
  `Field`, `SelectField`, `Checkbox`, `DsButton`, `FeatureRow`.
- **Testes automatizados que cobrem:** `src/features/anamnese/templates/__tests__/TemplateFormScreen.test.tsx` ›
  "cria modelo com perguntas em ordem e opções só para escolha"; `templateSchema.test.ts` › "envia opções só para
  tipos de escolha e preserva ordem"; `api.test.ts` › "cria, lista, detalha, edita e exclui um modelo". Rodar a pasta:
  `pnpm exec vitest run src/features/anamnese/templates --maxWorkers=1`.
- **Se falhar:**
  1. _`400` ao salvar_ → `options` presentes em pergunta sem escolha, ou menos de 2 opções (o schema deveria barrar);
     compare o corpo.
  2. _Modelo não aparece na lista_ → invalidação de `["anamnese","templates"]` ou erro silencioso; veja a rede.
  3. _Pergunta de escolha salva sem opções_ → `toTemplateInput` (só inclui `options` nesses dois tipos).
- **Evidência:** captura da lista com o modelo; corpo do `POST` (tipos e se há `options`, sem texto de paciente).

#### PAC-08.2 — Editar modelo (ordem, remover, opções)

- **Prioridade / AC:** P1 · PAC-08 (MAN) · AC-PAC-08-02
- **Objetivo:** reabrir, reordenar e alterar um modelo **sem respostas**.
- **Pré-condição:** PAC-08.1 e nenhum paciente com resposta nesse modelo.
- **Passos:** na lista, tocar no modelo; **"Subir"** a pergunta 3, **"Descer"** a 1; **"Remover"** uma pergunta;
  **"Adicionar opção"** numa pergunta de escolha; **"Salvar modelo"**; reabrir.
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Editar modelo"**, preenchido; "Subir" desabilitado na primeira e "Descer" na última; ao
    reabrir, a ordem e as mudanças persistem.
  - **Rede (backend real):** `GET /anamnese/templates/:id` (`200`); `PUT /anamnese/templates/:id` com título,
    descrição e a **lista completa** de perguntas na nova ordem; `200`.
  - **Depois:** lista atualizada (`["anamnese","templates"]`).
- **Onde está no código:** `app/anamnese/templates/[id].tsx`; `TemplateFormScreen.tsx` (`swap`, `remove`, `reset` a
  partir de `query.data` ordenado por `order`); `updateAnamneseTemplate`.
- **Testes automatizados que cobrem:** `TemplateFormScreen.test.tsx` › "edita modelo enviando opções nos tipos de
  escolha".
- **Se falhar:**
  1. _Ordem não persiste_ → o backend reordena por `order` e o app envia a lista na ordem da tela; compare a ordem
     do corpo com a da tela.
  2. _`400 TEMPLATE_HAS_RESPONSES`_ → o modelo já tem resposta (esperado no PAC-08.5).
- **Evidência:** capturas antes/depois; corpo do `PUT` (ordem dos textos).

#### PAC-08.3 — Validação do formulário de modelo

- **Prioridade / AC:** P2 · AC-PAC-08-01
- **Objetivo:** as mensagens exatas e o bloqueio do envio.
- **Pré-condição:** formulário de modelo.
- **Passos:** tocar em "Salvar modelo" sem título; adicionar pergunta sem texto; pergunta de escolha com 1 opção
  ou com uma opção em branco.
- **Resultado esperado:**
  - **Tela:** **"Informe o título"**; **"O título deve ter até 200 caracteres"**; **"A descrição deve ter até 1000
    caracteres"**; **"Informe a pergunta"**; **"Informe pelo menos duas opções"** (sob as opções); nada é enviado.
  - **Rede (backend real):** nenhuma chamada.
  - **Depois:** —
- **Onde está no código:** `templateSchema.ts` (`questionSchema` com `superRefine`); `TemplateFormScreen.tsx`
  (`zodResolver`).
- **Testes automatizados que cobrem:** `templateSchema.test.ts` › "limita título e descrição" e "exige duas opções
  preenchidas nos tipos de escolha".
- **Se falhar:** _salvou com 1 opção_ → `superRefine`; veja `question.options` (o array pode ter textos vazios).
- **Evidência:** captura das mensagens.
- **Divergência encontrada:** o `schema` aceita **zero perguntas** (`questions: z.array(questionSchema)` sem mínimo);
  o PROJECT.md não exige mínimo, então o backend pode aceitar ou recusar. Se salvar um modelo vazio, registre o
  status e a mensagem.

#### PAC-08.4 — Excluir modelo sem respostas

- **Prioridade / AC:** P1 · PAC-08 (MAN) · AC-PAC-08-04
- **Objetivo:** excluir pede confirmação.
- **Pré-condição:** modelo **sem** respostas.
- **Passos:** abrir o modelo → **"Excluir modelo"** → **"Cancelar"**; de novo → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** diálogo **"Excluir modelo?"** com **"Esta ação não pode ser desfeita."**; "Cancelar" não apaga;
    "Excluir" fecha o diálogo, volta à lista e o modelo sai. O botão "Excluir modelo" só existe na edição.
  - **Rede (backend real):** `DELETE /anamnese/templates/:id` com `200` (corpo `null`); depois `GET
/anamnese/templates/`.
  - **Depois:** o modelo não aparece mais em "Escolher modelo".
- **Onde está no código:** `TemplateFormScreen.tsx` (`confirmOpen`, `deletion`, `Modal`); `deleteAnamneseTemplate`.
- **Testes automatizados que cobrem:** `TemplateFormScreen.test.tsx` › "exige confirmação para excluir e mostra
  erro acionável"; `api.test.ts` › "cria, lista, detalha, edita e exclui um modelo".
- **Se falhar:**
  1. _Excluiu sem confirmação_ → o botão chama `deletion.mutate` direto; veja `setConfirmOpen(true)`.
  2. _Mensagem "Não foi possível concluir a operação. Tente novamente."_ → erro não mapeado (`500`); veja o corpo.
- **Evidência:** captura do diálogo; `DELETE` com status.

#### PAC-08.5 — Modelo com respostas é imutável

- **Prioridade / AC:** P1 · PAC-08 (MAN) · AC-PAC-08-03
- **Objetivo:** `TEMPLATE_HAS_RESPONSES` mostra a mensagem e não perde o formulário.
- **Pré-condição:** modelo com ao menos uma resposta (após o PAC-06.1).
- **Passos:** abrir o modelo; mudar o título e **"Salvar modelo"**; depois **"Excluir modelo"** → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** **"Este modelo já tem respostas e não pode ser alterado."** (linha de erro, nas duas ações); o
    formulário continua preenchido; no excluir o diálogo fecha e a mesma mensagem aparece.
  - **Rede (backend real):** `PUT` e `DELETE /anamnese/templates/:id` respondem **`400`** com `{ message:
"TEMPLATE_HAS_RESPONSES" }`.
  - **Depois:** nada muda no modelo.
- **Onde está no código:** `TemplateFormScreen.tsx` › `errorMessage` (`code === "TEMPLATE_HAS_RESPONSES"`,
  `blockedMessage`), `save.onError`, `deletion.onError`; o `code` vem de `normalizeApiError` em `src/api/errors.ts`
  (o `message` do corpo vira `code`).
- **Testes automatizados que cobrem:** `TemplateFormScreen.test.tsx` › "mantém formulário e mostra erro de modelo
  com respostas"; `api.test.ts` › "bloqueia edição e exclusão quando há respostas".
- **Se falhar:**
  1. _Mensagem genérica_ → o backend devolveu outro código/status (ex.: `409`); registre o corpo.
  2. _Edição passou_ → o backend não bloqueou (mudança de contrato); registre.
  3. _Reproduzir sem backend:_ mock com id `has-responses`.
- **Evidência:** captura da mensagem; status e `message` da resposta.

#### PAC-08.6 — Lista sem modelos

- **Prioridade / AC:** P3 · PAC-08 (MAN)
- **Objetivo:** estado vazio.
- **Pré-condição:** conta sem modelo.
- **Passos:** abrir "Modelos de anamnese".
- **Resultado esperado:**
  - **Tela:** **"Nenhum modelo de anamnese"** e o botão **"Novo modelo"** no topo; erro: "Não foi possível carregar os
    modelos." com **"Tentar novamente"**.
  - **Rede (backend real):** `GET /anamnese/templates/` → `200 []`.
  - **Depois:** —
- **Onde está no código:** `TemplateListScreen.tsx` (`query.data?.length === 0`).
- **Testes automatizados que cobrem:** nenhum teste de tela da lista; `api.test.ts` cobre a API. (Lacuna: considerar
  teste de `TemplateListScreen`.)
- **Se falhar:** _spinner infinito_ → `GET` pendente (partida a frio); _erro_ → veja o status.
- **Evidência:** captura.

## 6. PAC-06 — Anamnese do paciente

**Navegação interna:** `AnamneseResponsesScreen` usa estado local (`list`, `pick`, `view`, `form`), **não rotas**:
o botão **Voltar do cabeçalho** volta ao passo anterior da tela, mas o **botão Voltar do Android** (não há
`BackHandler`) sai da tela inteira para a ficha. Os rótulos: lista ("Anamnese" + "Nova anamnese"), escolha
("Escolher modelo"), leitura ("Anamnese"), formulário ("Nova anamnese" / "Editar anamnese").

**Corpo enviado** (`buildAnswers` em `answers.ts`): lista na **ordem do modelo**, cada item com `questionId` e
`questionType` mais **só** o campo do tipo — `Descriptive` → `textValue`; `MultipleChoice` → `selectedOptionId`;
`Checkbox` → `selectedOptionIds`; `FileUpload` → `fileUrl`. Perguntas opcionais sem resposta ficam **de fora**.

#### PAC-06.1 — Nova anamnese com um modelo

- **Prioridade / AC:** P1 · PAC-06 (MAN) · AC-PAC-06-01
- **Objetivo:** responder cada tipo de pergunta e ver a anamnese na lista e na ficha.
- **Pré-condição:** Paciente A e um modelo com uma pergunta de cada tipo (PAC-08.1).
- **Passos:**
  1. Ficha do Paciente A → linha **"Anamnese"** (subtítulo "Nenhuma anamnese" ou "Última em dd/mm/aaaa").
  2. **"Nova anamnese"** → na tela **"Escolher modelo"** tocar no modelo ("N perguntas").
  3. Preencher: Descritiva (texto), Múltipla escolha (uma opção no seletor), Caixas de seleção (várias),
     Arquivo (veja o PAC-06.2).
  4. **"Salvar anamnese"**.
- **Resultado esperado:**
  - **Tela:** o formulário mostra o título do modelo e cada pergunta com " *" quando obrigatória; ao salvar,
    volta à lista com um item **"{título do modelo}"** e o subtítulo **"Respondida em dd/mm/aaaa"**; ao voltar à
    ficha, a linha "Anamnese" mostra **"Última em dd/mm/aaaa"**.
  - **Rede (backend real):** `GET /anamnese/templates/` (modelos) e `GET /anamnese/responses/student/:studentId`
    ao abrir; `POST /anamnese/templates/:templateId/responses` com `{ studentId, answers: [...] }` (só o campo do
    tipo em cada resposta); `201/200` com a resposta (`id`, `answeredAt`). Depois `GET
/anamnese/responses/student/:studentId` refeito.
  - **Depois:** a ficha atualiza o subtítulo da linha "Anamnese" (mesma chave
    `["anamnese","responses","student",id]`); o modelo passa a recusar edição/exclusão (PAC-08.5).
- **Onde está no código:** `app/patients/[id]/anamnese.tsx`; `AnamneseResponsesScreen.tsx` (`mode`, `responseSubtitle`);
  `AnamneseForm.tsx` › `AnamneseForm` (`save`, `buildAnswers`); `answers.ts`; `useAnamneseResponses.ts` ›
  `anamneseResponsesKey`; `createAnamneseResponse`; `PatientDetailScreen.tsx` (`FeatureRow` "Anamnese",
  `anamneseSubtitle`, `formatResponseDate`); mock `src/mocks/handlers/anamnese-responses.ts`; DS `FeatureRow`,
  `Field`, `SelectField`, `CheckList`, `DsButton`.
- **Testes automatizados que cobrem:** `src/features/anamnese/responses/__tests__/answers.test.ts` › "AC-PAC-06-01
  envia só o campo do tipo de cada pergunta" e "omite perguntas opcionais sem resposta";
  `AnamneseResponsesScreen.test.tsx` › "lista as respostas com o modelo e a data, e abre a leitura";
  `api.test.ts` › "lista as respostas completas do paciente" e "valida as respostas na criação";
  `PatientDetailScreen.test.tsx` › "mostra a data da última resposta". Rodar a pasta:
  `pnpm exec vitest run src/features/anamnese/responses --maxWorkers=1`.
- **Se falhar:**
  1. _`400 MISSING_*`/`INVALID_*`_ → corpo com campo do tipo errado ou id de pergunta/opção que não é do modelo;
     veja o `questionType` e os ids do corpo (mensagens: ver PAC-06.4).
  2. _Resposta salva mas lista vazia_ → invalidação da chave por paciente; veja o `GET` por paciente.
  3. _Seletor de modelos vazio_ → `GET /anamnese/templates/` vazio (modelos são por educador, G-50).
  4. _`401` e volta ao Login_ → alguma chamada usou rota de outro educador; o app não chama `GET
/anamnese/responses/:id` (D4).
- **Evidência:** capturas da lista e da ficha; corpo do `POST` (só os **tipos** e nomes dos campos, sem texto das
  respostas — AC-PAC-06 item 7: nenhuma resposta em log).

#### PAC-06.2 — Pergunta de arquivo (upload antes do envio)

- **Prioridade / AC:** P1 · PAC-06 (MAN) · AC-PAC-06-02
- **Objetivo:** o arquivo é enviado antes da resposta e a URL devolvida vai no `fileUrl`; limite de 10 MB.
- **Pré-condição:** modelo com pergunta de arquivo; um documento pequeno fictício no emulador.
- **Passos:** no formulário, na pergunta "Arquivo" tocar em **"Escolher arquivo"** → escolher o documento →
  **"Salvar anamnese"**; reabrir a anamnese para editar; repetir com um arquivo acima de 10 MB.
- **Resultado esperado:**
  - **Tela:** o nome do arquivo aparece abaixo do botão; depois de salvo e ao reabrir para editar, aparece **"Arquivo
    já enviado"**; arquivo >10 MB mostra **"O arquivo excede o limite de 10 MB."** na pergunta e não é anexado.
  - **Rede (backend real):** `POST /anamnese/responses/upload-file` (**multipart**, campo `file`) → `200 { url }`,
    **antes** do `POST .../responses`; depois a resposta leva `fileUrl` = a URL devolvida. Acima do limite no
    servidor: `400` com `{ message: "THIS FILE IS TO LARGE" }` (a checagem do app usa o `size` do seletor; se o
    seletor não informa tamanho, quem recusa é o servidor).
  - **Depois:** a leitura mostra **"Arquivo enviado"**.
- **Onde está no código:** `AnamneseForm.tsx` › `pickFile` (`DocumentPicker.getDocumentAsync`,
  `MAX_ANAMNESE_FILE_SIZE_BYTES` de `anamnese-responses.ts`), `save.mutationFn` (upload e depois create/update);
  `uploadAnamneseFile`; `answers.ts` › `describeAnswer`; mock `POST /anamnese/responses/upload-file`
  (`400 FILE_REQUIRED` sem arquivo).
- **Testes automatizados que cobrem:** `AnamneseResponsesScreen.test.tsx` › "AC-PAC-06-02 faz o upload antes e
  envia a URL devolvida"; `api.test.ts` › "envia o arquivo em multipart e devolve a URL".
- **Se falhar:**
  1. _Seletor não abre / não devolve `uri`_ → `expo-document-picker` no Expo Go (CONTEXTO §5/§7: cuidados do Expo
     Go); anote o Android e o aplicativo de arquivos.
  2. _Upload ok, resposta sem `fileUrl`_ → `buildAnswers` só inclui `fileUrl` quando preenchido; veja o corpo.
  3. _`400 THIS FILE IS TO LARGE`_ → arquivo grande e o seletor não informou o tamanho.
  4. _Upload feito e criação falhou_ → o arquivo fica órfão no servidor; ao tentar de novo o app **reenvia o arquivo**
     (o rascunho mantém `file`).
- **Evidência:** capturas do nome do arquivo e de "Arquivo já enviado"; método/caminho/status do upload.

#### PAC-06.3 — Editar uma anamnese (PUT)

- **Prioridade / AC:** P1 · PAC-06 (MAN) · AC-PAC-06-04
- **Objetivo:** editar reabre preenchido e envia a lista completa; a lista mostra "Editada em".
- **Pré-condição:** anamnese salva (PAC-06.1).
- **Passos:** lista → tocar na anamnese (leitura) → **"Editar"** → mudar uma resposta → **"Salvar anamnese"**.
- **Resultado esperado:**
  - **Tela:** leitura mostra o título do modelo, "Respondida em …" e cada pergunta com a resposta (ou "Sem
    resposta"; "Arquivo enviado"); "Editar anamnese" abre preenchido; após salvar, a lista mostra **"Respondida em
    dd/mm/aaaa · Editada em dd/mm/aaaa"**.
  - **Rede (backend real):** `PUT /anamnese/responses/:responseId` com `{ answers }` (a **lista completa**, não só o
    alterado); `200` com `updatedAt` e o mesmo `answeredAt`. Resposta de outro educador: `403 UNAUTHORIZED`.
  - **Depois:** a ficha continua com "Última em …" (ordenada por `answeredAt`).
- **Onde está no código:** `AnamneseResponsesScreen.tsx` (`mode.kind === "view"`, "Editar", `responseSubtitle`);
  `AnamneseForm.tsx` (`response` → `updateAnamneseResponse`; `draftsFromResponse`); `updateAnamneseResponse`.
- **Testes automatizados que cobrem:** `AnamneseResponsesScreen.test.tsx` › "AC-PAC-06-04 edita enviando o PUT com
  a lista completa e mostra Editada em"; `api.test.ts` › "edita mantendo answeredAt e gravando updatedAt" e "PUT de
  outro educador devolve 403 e de resposta inexistente 404".
- **Se falhar:**
  1. _"Editada em" não aparece_ → a resposta do `PUT` ou do `GET` por paciente não traz `updatedAt`; confira o
     backend (BACKEND-ENTREGUE §6).
  2. _`404` ao editar_ → o endpoint novo (`PUT /anamnese/responses/:id`) ainda não existe no ambiente.
  3. _Perdeu respostas ao editar_ → o corpo deveria ser a lista completa; compare.
- **Evidência:** captura da lista com "Editada em"; o `PUT` (status).
- **Divergência encontrada:** a ficha descreve "Editada em …"; o app compara `response.updatedAt` apenas pela
  existência do campo. O formulário trata o `PUT` de outro educador (403) como erro genérico: "Não foi possível salvar
  a anamnese. Tente novamente." — não há a mensagem "Sem acesso a esta anamnese" citada na ficha (o app nunca abre
  respostas de outros educadores).

#### PAC-06.4 — Obrigatória vazia

- **Prioridade / AC:** P1 · AC-PAC-06-03
- **Objetivo:** perguntas obrigatórias sem resposta bloqueiam o envio.
- **Pré-condição:** modelo com pergunta obrigatória.
- **Passos:** abrir "Nova anamnese" e tocar em "Salvar anamnese" sem responder a obrigatória.
- **Resultado esperado:**
  - **Tela:** **"Resposta obrigatória"** sob a pergunta (a mensagem é a mesma para **todos os tipos** na validação
    do cliente); nada é enviado. As mensagens **"Escolha uma opção"**, **"Escolha ao menos uma opção"**, **"Envie o
    arquivo"**, **"Informe o texto da resposta"**, **"Pergunta inválida para este modelo"** e **"Opção inválida"**
    só aparecem se o **backend** devolver o código (`MISSING_SELECTED_OPTION`, `MISSING_SELECTED_OPTIONS`,
    `MISSING_FILE_URL`, `MISSING_TEXT_VALUE`, `INVALID_QUESTION_ID`, `INVALID_OPTION_ID`).
  - **Rede (backend real):** cliente: nenhuma chamada. Se o servidor recusar: `400` com `{ message: "<CÓDIGO>",
errors: [{ path: "answers.N…" }] }`; o app põe a mensagem na pergunta do índice `N` (ou numa linha geral).
  - **Depois:** —
- **Onde está no código:** `answers.ts` › `validateDrafts`, `REQUIRED_MESSAGE`; `AnamneseForm.tsx` › `toFormError`,
  `codeMessages`, `GENERIC_ERROR` ("Não foi possível salvar a anamnese. Tente novamente.").
- **Testes automatizados que cobrem:** `answers.test.ts` › "AC-PAC-06-03 acusa obrigatória vazia na pergunta";
  `AnamneseResponsesScreen.test.tsx` › "AC-PAC-06-03 bloqueia o envio com obrigatória vazia" e "mostra o erro da API
  na pergunta e mantém o formulário".
- **Se falhar:**
  1. _Enviou com obrigatória vazia_ → `isAnswered`/`validateDrafts` (por tipo).
  2. _Mensagem na pergunta errada_ → o índice `answers.N` refere-se à lista **enviada** (`sentQuestionIds`), que omite
     opcionais sem resposta.
- **Evidência:** captura da mensagem.
- **Divergência encontrada:** o PLANO-TESTES lista as quatro mensagens por tipo como resultado do cliente; no
  código o cliente sempre usa **"Resposta obrigatória"**.

#### PAC-06.5 — Sem modelo / sem anamnese

- **Prioridade / AC:** P2 · AC-PAC-06-01
- **Objetivo:** estados vazios com caminho para criar modelo.
- **Pré-condição:** conta sem modelo; paciente sem anamnese.
- **Passos:** Ficha → "Anamnese".
- **Resultado esperado:**
  - **Tela:** **"Nenhuma anamnese registrada"** e, sem modelos, o botão **"Criar modelo"** (abre `/anamnese/templates/new`);
    em "Nova anamnese" → "Escolher modelo", sem modelos: **"Nenhum modelo de anamnese"** com **"Criar modelo"**;
    erros: "Não foi possível carregar as anamneses." / "Não foi possível carregar os modelos." com "Tentar
    novamente"; leitura de resposta cujo modelo sumiu: "Modelo não encontrado".
  - **Rede (backend real):** `GET /anamnese/responses/student/:studentId` → `200 []`; `GET /anamnese/templates/` →
    `200 []`.
  - **Depois:** —
- **Onde está no código:** `AnamneseResponsesScreen.tsx` (`noTemplates`, `createTemplate`); `PatientDetailScreen`
  (`anamneseSubtitle`: "Carregando", "Não foi possível carregar", "Nenhuma anamnese").
- **Testes automatizados que cobrem:** `AnamneseResponsesScreen.test.tsx` › "sem modelo mostra o estado vazio com
  Criar modelo"; `PatientDetailScreen.test.tsx` › "mostra Nenhuma anamnese e abre a tela ao tocar".
- **Se falhar:** _sem "Criar modelo"_ → `noTemplates` só é verdadeiro depois que `GET /anamnese/templates/` responde
  com lista vazia (`templates.isSuccess`).
- **Evidência:** captura.

#### PAC-06.6 — 401 de outro educador (ponte para o BE-02)

- **Prioridade / AC:** P1 · Backend (§4.2) · AC-PAC-06-05
- **Objetivo:** o app nunca chama `GET /anamnese/responses/:responseId`; um `401` ali não pode deslogar.
- **Pré-condição:** —
- **Passos:** executar o BE-02 (detalhado em [06-fluxos-e-backend](06-fluxos-e-backend.md)).
- **Resultado esperado:**
  - **Tela:** o fluxo normal da anamnese **não** produz essa chamada; nenhuma tela "Sem acesso a esta anamnese".
  - **Rede (backend real):** o tráfego mostra só `GET .../responses/student/:studentId`, `POST/PUT` de respostas e o
    upload.
  - **Depois:** —
- **Onde está no código:** `useAnamneseResponses.ts` (comentário: não usa `GET /anamnese/responses/:id`);
  `src/api/client.ts` (interceptor de 401 → `subscribeSessionExpired`); `anamnese-responses.ts` (sem função de
  `GET` por id).
- **Testes automatizados que cobrem:** `src/api/__tests__/client.test.ts` (comportamento do 401); não há teste de
  tela para o `GET` por id porque a função não existe.
- **Se falhar:** _volta ao Login ao abrir anamnese_ → algum `GET` por id foi introduzido ou o token expirou; olhe o
  último caminho chamado antes do `401`.
- **Evidência:** lista de caminhos chamados (só métodos e caminhos).
- **Divergência encontrada:** o AC-PAC-06-05 ("o 401 do detalhe de resposta não desloga") não tem implementação
  de tratamento: a decisão foi **não chamar** a rota (TRACKING 2026-10-29), então o AC é atendido por ausência da
  chamada.

## 7. PAC-04 — Aba "Planos" e "PDI vigente" na ficha

**Contrato** ([BACKEND-ENTREGUE §3](../BACKEND-ENTREGUE.md)): `GET /plan/?studentId=…` (lista de `PlanSummary`, sem
`goals`) e `GET /plan/?studentId=…&type=PDI&status=ACTIVE` (PDI vigente; o `activePdi` em `GET /student/` **não**
foi implementado). Progresso = metas atingidas ÷ total, calculado pelo servidor.

#### PAC-04.1 — Alternar entre "Visão geral" e "Planos"

- **Prioridade / AC:** P1 · PAC-04 (MAN) · AC-PAC-04-01, AC-PAC-04-04
- **Objetivo:** a ficha tem duas abas (sem "Avaliações") e a aba Planos lista os planos do paciente.
- **Pré-condição:** Paciente A (com e sem planos, em momentos diferentes).
- **Passos:** ficha → aba **"Planos"** → voltar para **"Visão geral"**.
- **Resultado esperado:**
  - **Tela:** abas **"Visão geral"** e **"Planos"** (rótulo de acessibilidade "Abas da ficha do paciente"); a aba
    "Planos" lista os planos **ativos primeiro**, cada item com título, "**PDI/PE** · Ativo/Concluído/Cancelado",
    barra e "N%" de progresso e "Próxima revisão: dd/mm/aaaa" (se houver); sem planos: **"Nenhum plano para este
    paciente"**; sempre o botão **"Criar novo plano"** no fim; carregando: "Carregando planos..."; erro: "Não foi
    possível carregar os planos." com "Tentar de novo". Voltar para "Visão geral" **preserva** o conteúdo anterior.
  - **Rede (backend real):** `GET /plan/?studentId=<id>` (`200`, `PlanSummary[]`).
  - **Depois:** —
- **Onde está no código:** `PatientDetailScreen.tsx` (`Tabs`, `activeTab`); `PatientPlans.tsx` › `PatientPlans`,
  `PlanItem`, `statusLabels`; `usePatientPlans.ts` › `usePatientPlans` (`["plan","student",studentId]`);
  `listPlans` em `src/api/endpoints/plans.ts`; `formatReviewDate` de `src/features/plans/hub/selectors.ts`; DS `Tabs`,
  `InfoCard`, `ProgressBar`, `DsButton`.
- **Testes automatizados que cobrem:** `src/features/patients/detail/plans/__tests__/PatientPlans.test.tsx` › "lista
  planos do paciente com ativos primeiro, status, progresso e revisão (AC-PAC-04-01)" e "mostra carregamento, erro
  recuperável e vazio"; `PatientDetailScreen.test.tsx` › "alterna entre Visão geral e Planos preservando o
  conteúdo anterior (AC-PAC-04-04)".
- **Se falhar:**
  1. _Lista vazia com planos existentes_ → filtro `studentId` ou `403 UNAUTHORIZED` (paciente de outro educador);
     veja o status do `GET /plan/`.
  2. _Plano novo não aparece_ → a invalidação do prefixo `["plan"]` (feita em `DraftPreview.tsx` e
     `PlanDetailScreen.tsx`) não rodou; puxe/reabra para separar cache de dado.
  3. _Aba "Avaliações" presente_ → build antigo.
- **Evidência:** captura da aba com os planos.

#### PAC-04.2 — "Criar novo plano" com o paciente escolhido

- **Prioridade / AC:** P1 · PAC-04 (MAN) · AC-PAC-04-02
- **Objetivo:** a criação abre já com o paciente.
- **Pré-condição:** PAC-04.1.
- **Passos:** aba "Planos" → **"Criar novo plano"**.
- **Resultado esperado:**
  - **Tela:** abre a geração de planos em `/plans/new?studentId=<id>` com o **paciente já escolhido** (o passo de
    paciente não é pedido de novo).
  - **Rede (backend real):** nenhuma chamada nova ao navegar.
  - **Depois:** o plano gerado e salvo aparece nesta aba (PLN-03).
- **Onde está no código:** `PatientPlans.tsx` › `planCreationRoute` (`NEW_PLAN_ROUTE` = `/plans/new`, `params:
{ studentId }`); `src/features/plans/routes.ts`; `app/plans/new.tsx`.
- **Testes automatizados que cobrem:** `PatientPlans.test.tsx` › "leva o paciente para a geração (AC-PAC-04-02)".
- **Se falhar:** _pede o paciente de novo_ → `studentId` não chegou a `app/plans/new.tsx`; verifique o `router.push`
  e o parâmetro.
- **Evidência:** captura da tela de geração.

#### PAC-04.3 — "PDI vigente" na visão geral

- **Prioridade / AC:** P1 · PAC-04 (MAN) · AC-PAC-04-03
- **Objetivo:** o bloco mostra o PDI ativo ou o convite para criar.
- **Pré-condição:** um paciente **com** PDI ativo e outro **sem**.
- **Passos:** ficha → "Visão geral" → bloco **"PDI vigente"** (acima de "Próxima sessão").
- **Resultado esperado:**
  - **Tela:** com PDI: título, "dd/mm/aaaa a dd/mm/aaaa" (vigência), barra de progresso, **"N% das metas
    atingidas"** e **"Ver plano completo"** (abre o detalhe do plano); sem PDI: **"Nenhum PDI ativo"** e **"Criar
    PDI"** (abre `/plans/new?studentId=…`); carregando "Carregando PDI..."; erro "Não foi possível carregar o PDI
    vigente." com "Tentar de novo".
  - **Rede (backend real):** `GET /plan/?studentId=<id>&type=PDI&status=ACTIVE` (`200`; lista com 0 ou 1 item).
  - **Depois:** ao encerrar o plano (PLN-04.6) o bloco volta a "Nenhum PDI ativo".
- **Onde está no código:** `PatientPlans.tsx` › `ActivePdi`; `usePatientPlans.ts` › `useActivePdi`
  (`["plan","student",id,"PDI","ACTIVE"]`); `planDetailRoute` (`/plans/[id]`).
- **Testes automatizados que cobrem:** `PatientPlans.test.tsx` › "mostra PDI vigente e abre detalhe; sem PDI oferece
  criação (AC-PAC-04-03)".
- **Se falhar:**
  1. _Mostra "Nenhum PDI ativo" com PDI ativo_ → o filtro do backend (`type`/`status`); veja a query enviada e a
     resposta.
  2. _Fica desatualizado após encerrar_ → invalidação do prefixo `["plan"]` em `PlanDetailScreen.tsx`.
- **Evidência:** captura dos dois estados.
- **Divergência encontrada:** o PLANO-TESTES cita "progresso" e "vigência"; o bloco mostra a vigência como
  `startDate a endDate` formatadas por `formatCalendarDate` (sem fuso), e o progresso em porcentagem de metas
  atingidas (a próxima revisão **não** aparece neste bloco, só na aba "Planos").

#### PAC-04.4 — Abrir um plano da aba e voltar

- **Prioridade / AC:** P2 · PAC-04 (MAN)
- **Objetivo:** o detalhe abre e o Voltar retorna à ficha na mesma aba.
- **Pré-condição:** paciente com plano.
- **Passos:** aba "Planos" → tocar num plano → Voltar (botão do cabeçalho e do Android).
- **Resultado esperado:**
  - **Tela:** abre o detalhe (`/plans/{id}`); ao voltar, a ficha reaparece **na aba "Planos"** (o estado da aba é
    local e a ficha permanece montada).
  - **Rede (backend real):** `GET /plan/:id` e demais chamadas do detalhe (PLN-04).
  - **Depois:** alterações no detalhe (status das metas, encerramento) refletem na aba (prefixo `["plan"]`).
- **Onde está no código:** `PlanItem` em `PatientPlans.tsx` (`router.push(planDetailRoute(plan.id))`);
  `PatientDetailScreen` (`useState("overview")`).
- **Testes automatizados que cobrem:** nenhum teste cobre o retorno à mesma aba; `PatientPlans.test.tsx` cobre a
  navegação ao detalhe em "mostra PDI vigente e abre detalhe…".
- **Se falhar:** _volta para "Visão geral"_ → a tela foi remontada (rota diferente) em vez de empilhada; registre o
  caminho de navegação.
- **Evidência:** captura da ficha ao voltar.

## 8. Casos adicionados (IDs novos)

#### PAC-07.7+ — Dificuldades: acrescentar uma "Outra dificuldade" na edição

- **Prioridade / AC:** P3 · AC-PAC-07-01
- **Objetivo:** a nova dificuldade vai no corpo como `learningTopics` (string JSON) com a lista completa.
- **Pré-condição:** PAC-07.1.
- **Passos:** "Outra dificuldade" → digitar um texto → **"Adicionar dificuldade"** → **"Salvar alterações"**.
- **Resultado esperado:**
  - **Tela:** a nova dificuldade aparece marcada; depois de salvar, aparece nas "Dificuldades mapeadas" da ficha.
  - **Rede (backend real):** `PUT /student/update/:id` (multipart) com **só** `learningTopics` = string JSON
    com a lista completa (as marcadas + a nova).
  - **Depois:** ficha e lista atualizam.
- **Onde está no código:** `PatientFormScreen.tsx` › `addCustomDifficulty` (`shouldDirty: true`), `submit`
  (`dirtyFields.learningTopics`); `updateStudent` (`JSON.stringify`).
- **Testes automatizados que cobrem:** `PatientFormScreen.test.tsx` › "envia somente as dificuldades modificadas na
  edição" (cobre AC-PAC-07-01 para `learningTopics`).
- **Se falhar:** _corpo envia array em vez de string_ → `updateStudent` (deve usar `JSON.stringify`, PROJECT.md
  "Uploads").
- **Evidência:** nomes dos campos do multipart.

#### PAC-06.7+ — Anamnese: voltar do Android durante o formulário

- **Prioridade / AC:** P3 · fumaça
- **Objetivo:** documentar a navegação interna: o Voltar do Android sai da tela de anamnese (não volta ao passo
  anterior).
- **Pré-condição:** formulário "Nova anamnese" aberto.
- **Passos:** tocar no Voltar do **cabeçalho** e, em outra tentativa, no Voltar do **Android**.
- **Resultado esperado:**
  - **Tela:** o Voltar do cabeçalho volta à lista; o do Android volta para a **ficha** (sai da tela); o rascunho do
    formulário é descartado sem aviso.
  - **Rede (backend real):** nenhuma.
  - **Depois:** —
- **Onde está no código:** `AnamneseResponsesScreen.tsx` (`toList`, `onBack`); não há `BackHandler`.
- **Testes automatizados que cobrem:** nenhum.
- **Se falhar:** _o app fecha_ → problema de pilha de navegação; anote a versão do Android.
- **Evidência:** captura do passo após o Voltar.
- **Divergência encontrada:** ficha e plano de testes não preveem o comportamento do Voltar do Android nessa tela;
  é consequência de o fluxo ser estado local, e não rotas.
