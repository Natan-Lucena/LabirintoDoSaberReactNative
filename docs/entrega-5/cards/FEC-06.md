# FEC-06 — Pendências das Entregas 3 e 4

> Refino da ficha [FEC-06 do BACKLOG](../BACKLOG.md#fec-06--pendências-das-entregas-3-e-4),
> escrito em 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em
> [PLANO](../PLANO.md). Pedido ao backend:
> [PP-05](../ESPECIFICACAO-BACKEND.md#9-pequenos-pedidos-e-pontos-em-aberto--p3).

| Campo           | Valor                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-8                                                                                                                                                              |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio                                                                                                                    |
| Estimativa      | M · 5 h de worker (sem os defeitos da issue #168, que entram com estimativa própria no início da onda)                                                            |
| Dependências    | Backend PP-05 (leva 3) e a API-06 registrando **como** o `null` chega em cada rota (§6.1)                                                                         |
| Backend         | Leva 3. **Não vai para a `main` antes do PP-05**: hoje o backend ignora ou recusa o `null`                                                                        |
| Dona nesta onda | `src/features/patients/form/**`, `src/features/plans/detail/**`, `src/features/content-create/task/**`, `src/api/endpoints/{student-update,plans,task-update}.ts` |

## 1. Objetivo e valor

Três limitações conhecidas desde a Entrega 3 ([ESCOPO-ENTREGA-3 §11](../../entrega-3/ESCOPO-ENTREGA-3.md#11-limitações-conhecidas)):
um campo apagado no formulário é tratado como "não enviado", então o profissional **não
consegue limpar** o responsável do paciente, a próxima revisão e as notas do plano, nem
remover a imagem ou o áudio de uma atividade salva. Hoje o plano chega a bloquear a edição
com "Informe a próxima revisão já definida." e "Informe as notas já registradas.".

## 2. Diagnóstico do código (correções em relação ao backlog)

| Item         | Backlog / especificação dizia | Código real                                                                                                                                  |
| ------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Plano        | `nextReviewAt`, `notes`       | `nextReviewDate` e `professionalNotes` (`UpdatePlanInput` em `src/api/endpoints/plans.ts`; `PlanForm`); a API-06 alinha o nome com o backend |
| Plano (tela) | —                             | `submitEdit` em `PlanDetailScreen.tsx` recusa apagar os dois campos com mensagem; o envio omite o campo vazio                                |
| Paciente     | "envia `null`"                | `PUT /student/update/:id` é **multipart** (`updateStudent` monta `FormData`): `null` não existe em multipart                                 |
| Paciente     | —                             | `PatientFormScreen` manda só os campos sujos (`dirtyFields`); campo apagado vira `""` e é omitido no `create`                                |
| Atividade    | —                             | `NewTaskScreen` (edição) só acrescenta mídia nova; não há como remover; o tipo muda para `multipleChoiceWithMedia` quando entra mídia        |

## 3. Referência de design

Sem desenho novo. Botões `DsButton` `variant="ghost"` junto aos campos e o diálogo de
confirmação no padrão do "Excluir Atividade" do `TaskDetailScreen` (`Modal` com "Cancelar" e a
ação).

## 4. Fluxo do usuário

**Paciente** (`/patients/[id]/edit`, `PatientFormScreen` no modo edição):

1. Com responsável preenchido, aparece "Remover responsável" abaixo dos três campos.
2. Toque → confirmação "Remover o responsável deste paciente? Nome, telefone e parentesco serão
   apagados." → "Remover".
3. Os três campos ficam vazios e marcados para apagar; "Salvar" envia os três como "apagar".
4. Apagar à mão os três campos e salvar tem o mesmo efeito. Apagar só um deles (com os outros
   preenchidos) apaga só esse.

**Plano** (detalhe → "Editar"):

1. Apagar "Próxima revisão (AAAA-MM-DD)" ou "Notas do profissional" e salvar envia o campo como
   `null`; as mensagens que bloqueavam saem.
2. Depois de salvar, o detalhe mostra "Próxima revisão: —" e esconde a seção de notas.

**Atividade de múltipla escolha** (detalhe → "Editar Atividade"):

1. Com imagem salva: prévia + "Remover imagem"; com áudio: player + "Remover áudio".
2. Remover marca para apagar (a prévia some; "Desfazer" aparece até salvar).
3. Salvar envia `imageFile: null` e/ou `audioFile: null`; sem nenhuma mídia restante, envia
   também `type: "multipleChoice"`.

**Defeitos da issue #168**: no início da onda, o orquestrador lista os ainda abertos; cada um
entra no PR com a reprodução e a correção (ou vira tarefa própria, se for grande).

## 5. Estados

| Estado                                                               | Comportamento e texto                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Salvando                                                             | Botões com `loading` (padrão de cada tela)                                                 |
| Sucesso                                                              | Paciente: volta à ficha (como hoje); plano: modo visualização; atividade: volta ao detalhe |
| Erro de validação do servidor                                        | Mensagem do campo (padrão atual de cada formulário)                                        |
| `TEXT_TASK_CANNOT_HAVE_MEDIA` / `MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO` | Mensagens já existentes em `readableTaskError` (`NewTaskScreen`)                           |
| `409 PLAN_NOT_EDITABLE`                                              | Mensagem atual do detalhe do plano                                                         |
| Offline                                                              | `withOfflineGuard` onde a tela já usa                                                      |

## 6. Contrato de dados

| Rota                      | Função                     | Mudança                                                                                                                                       |
| ------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUT /student/update/:id` | `updateStudent(id, input)` | `UpdateStudentInput` aceita `null` em `guardianName`, `guardianPhone`, `guardianRelationship`; a serialização do `null` segue a API-06 (§6.1) |
| `PUT /plan/:id`           | `updatePlan(id, input)`    | `nextReviewDate?: string \| null`, `professionalNotes?: string \| null` (JSON)                                                                |
| `PUT /task/update`        | `updateTask(input)`        | `imageFile?: string \| null`, `audioFile?: string \| null` (JSON)                                                                             |

**6.1 `null` em multipart (pergunta ao backend):** o `FormData` só carrega texto e arquivo. A
especificação pede `null` sem dizer como ele chega numa rota multipart. A API-06 registra a
resposta do backend; as opções são (a) a string vazia `""` significar "apagar" nessa rota, (b) a
string literal `"null"`, ou (c) a rota aceitar JSON quando não há foto. **O worker não escolhe**:
implementa a forma registrada no `PROJECT.md`. Sem resposta até a onda E5-8, o paciente fica fora
do PR (plano e atividade seguem) e a pendência vai para o TRACKING.

Invalidações: as que cada tela já faz (`["student"]` e a ficha; `planQueryKeys.all`; `["task"]`).

## 7. Regras de negócio e casos de borda

1. **Só envia "apagar" quando havia valor**: campo vazio que já estava vazio não vai no corpo
   (evita escrita inútil).
2. **Remover responsável** apaga os três campos juntos; o telefone do responsável continua com a
   máscara e a validação atuais quando preenchido.
3. **Plano**: a validação de vigência da próxima revisão continua quando há data; data vazia é
   válida (vira `null`).
4. **Notas do plano**: texto só com espaços conta como vazio.
5. **Atividade**: remover a única mídia de uma `multipleChoiceWithMedia` envia `type:
"multipleChoice"` junto (regra da API: atividade de texto não tem mídia); trocar a mídia
   (remover e escolher outra antes de salvar) envia só a URL nova.
6. **Atividade da biblioteca** nunca chega aqui (sem "Editar", ATV-09).
7. Nenhum dado do paciente vai para log ou toast de erro.

## 8. Plano de implementação

1. `src/api/endpoints/plans.ts`, `task-update.ts`, `student-update.ts`: tipos com `null` e a
   serialização registrada; testes pelo `apiClient` real com os mocks
   (`src/mocks/handlers/{plans,task-update,student-update}.ts` passam a aceitar e aplicar o
   `null`).
2. `src/features/plans/detail/PlanDetailScreen.tsx`: tirar os dois bloqueios de `submitEdit` e
   enviar `null` quando o campo foi esvaziado (`plan.nextReviewDate && !formDate`,
   `plan.professionalNotes && !values.professionalNotes.trim()`).
3. `src/features/patients/form/PatientFormScreen.tsx`: botão e confirmação; no `patch` da
   edição, campo sujo e vazio com valor anterior → apagar.
4. `src/features/content-create/task/NewTaskScreen.tsx`: estado `removeImage`/`removeAudio`,
   botões "Remover imagem"/"Remover áudio"/"Desfazer", corpo do `updateTask` com `null` e o
   `type` correto.
5. Testes dos AC; seções no `src/mocks/README.md` (PP-05).

## 9. Arquivos

- **Permitidos:** `src/features/patients/form/**`, `src/features/plans/detail/**`,
  `src/features/content-create/task/**`,
  `src/api/endpoints/{student-update,plans,task-update}.ts`,
  `src/mocks/handlers/{student-update,plans,task-update}.ts`, `src/mocks/README.md` (seção),
  testes ao lado; mais os arquivos dos defeitos da #168 listados na spec da onda.
- **Proibidos:** `src/api/types.ts` (se um tipo compartilhado precisar de `null`, a API-07 da
  leva 3 faz), `src/features/patients/detail/**` e `list/**` (PAC-11 na mesma onda),
  `src/features/plans/draft/PlanForm.tsx` (a menos que a validação de notas esteja lá; então só
  ela), `package.json`.

## 10. Critérios de aceite

| ID           | Critério                                                                                             | Verif. |
| ------------ | ---------------------------------------------------------------------------------------------------- | ------ |
| AC-FEC-06-01 | "Remover responsável" envia os três campos como "apagar" e a ficha fica sem responsável              | `CT`   |
| AC-FEC-06-02 | Limpar a próxima revisão envia `nextReviewDate: null` (e as notas, `professionalNotes: null`)        | `CT`   |
| AC-FEC-06-03 | Remover a mídia mostra a atividade sem imagem e sem áudio no detalhe, como múltipla escolha de texto | `MAN`  |
| AC-FEC-06-04 | Campo que já estava vazio não é enviado                                                              | `UT`   |

## 11. Como testar manualmente (Victor)

Expo Go Android, backend real com o PP-05 publicado.

1. Pacientes → "Paciente Teste B" (com responsável) → "Editar" → "Remover responsável"
   → "Remover" → "Salvar": a ficha não mostra mais o responsável; reabra e confira.
2. Planos → um PDI de teste com próxima revisão → "Editar" → apague a data e as notas →
   "Salvar alterações": salva sem erro; o detalhe mostra "Próxima revisão: —".
3. Atividades → uma múltipla escolha com imagem → "Editar Atividade" → "Remover imagem" →
   salvar: o detalhe fica sem imagem e o tipo vira "Múltipla escolha".
4. Na mesma atividade, adicione um áudio e salve: o tipo volta a "Múltipla escolha com mídia".

## 12. Riscos e perguntas em aberto

- **§6.1** (multipart) é a pergunta principal ao backend; sem ela, o paciente fica de fora.
- **Nomes dos campos do plano** na especificação (PP-05) estão diferentes do contrato atual; a
  API-06 confirma com o backend que são `nextReviewDate` e `professionalNotes`.
- A issue #168 pode trazer defeitos maiores que a ficha; o orquestrador separa em tarefa própria
  em vez de inchar este PR.

## 13. Fora do escopo

RP-02 e a repetição das notificações (só backend, G-71 e G-72), `timeToAnswer` antigo (PP-08),
apagar outros campos opcionais não listados no PP-05.
