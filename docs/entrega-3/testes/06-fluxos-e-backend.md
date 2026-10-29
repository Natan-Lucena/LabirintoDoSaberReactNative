# Testes manuais — Fluxos entre telas e conferências do backend

Detalhamento dos fluxos **F1 a F5** (PLANO-TESTES [§3](../PLANO-TESTES.md#3-fluxos-entre-telas-p1)) e
das conferências do backend **BE-01 a BE-08** (PLANO-TESTES
[§4](../PLANO-TESTES.md#4-conferências-do-backend-casos-dedicados)). Os IDs e os casos do plano
original foram preservados; cada fluxo foi aberto em passos (`F1.1`, `F1.2`…) com o **ponto de
verificação entre telas**, a **consulta que precisa ser invalidada** e o **arquivo** onde isso acontece.

> **Estado:** roteiro escrito sem abrir o emulador, o Metro nem o app. Nada foi executado. Textos,
> rotas, funções e testes foram conferidos no código em 2026-10-29.

## Como usar este arquivo

- Um fluxo é um **percurso contínuo**: não feche o app entre os passos e não limpe dados. Falhar num
  passo marca o fluxo como **FALHA**; os casos de área que dependem dele ficam **BLOQ**.
- Cada passo diz o que verificar **ao chegar** à tela seguinte (o "ponto de verificação") e qual
  consulta do TanStack Query precisa estar atualizada. Se a tela mostrar dado velho, o defeito quase
  sempre é uma **invalidação que não alcançou a chave** — o arquivo está indicado em "Onde está no código".
- Os casos de backend não alteram o app: observam a **rede**. Anote método, caminho e status;
  **não copie corpo de resposta** com dados de pessoas, nem `educators`/`_password`/token.

## Mapa

| Fluxo / conferência | Telas e rotas                                                                                                                       | Hooks e consultas                                                                                        | Endpoints                                                                                                                                            | Testes automatizados                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1                  | `/(tabs)/agenda` → `/agenda/new` → `/agenda/[id]` → `/session/student` → `/session/content` → `/session/player` → `/session/finish` | `appointmentQueryKeys.all` = `["appointment"]`; `useSessionFlowStore`                                    | `POST /appointment/`, `POST /task-notebook-session/start` (com `appointmentId`), `POST …/answer`, `POST …/finish`, `GET /appointment/`               | `AppointmentFormScreen.test.tsx`, `ContentStep.test.tsx`, `FinishSessionScreen.test.tsx`, `session-appointment.integration.test.ts`                            |
| F2                  | `/patients/[id]` → `/patients/[id]/edit` → `/patients/[id]` → `wa.me`                                                               | `["student"]` (`useStudents`, `homeQueryKeys.students`)                                                  | `PUT /student/update/:id`, `GET /student/`                                                                                                           | `PatientFormScreen.test.tsx`, `student-update.integration.test.ts`, `whatsapp.test.ts`                                                                         |
| F3                  | `/patients/[id]/anamnese`, `/anamnese/templates/*`                                                                                  | `["anamnese","templates"]` e `anamneseResponsesKey(studentId)` = `["anamnese","responses","student",id]` | `POST/PUT/GET /anamnese/templates/*`, `POST /anamnese/templates/:id/responses`, `PUT /anamnese/responses/:id`, `GET /anamnese/responses/student/:id` | `TemplateFormScreen.test.tsx`, `AnamneseResponsesScreen.test.tsx`, `anamnese/responses/__tests__/api.test.ts`                                                  |
| F4                  | `/patients/[id]` (aba Planos) → `/plans/new` → `/plans/[id]` → `/plans/suggestions`                                                 | `["plan",…]` (ver [04-planos.md](04-planos.md)); `pendingSuggestionsKey`                                 | `POST /plan/generate`, `POST /plan/`, `PUT /plan/:id/goals/:goalId`, `POST /plan/:id/reviews`, suggestions, `PUT /plan/:id/status`                   | testes de planos do [04-planos.md](04-planos.md)                                                                                                               |
| F5                  | `/profile` → Login                                                                                                                  | `homeQueryKeys.educator` = `["educator","me"]`; `queryClient.clear()`                                    | `PUT /educator/update-educator`, `GET /educator/me`, `POST /educator/sign-in`                                                                        | `ProfileScreen.test.tsx`, `ProfileLogout.test.tsx`, `auth.test.ts`                                                                                             |
| BE-01 a BE-08       | telas e relatórios dos casos acima                                                                                                  | —                                                                                                        | ver cada caso                                                                                                                                        | `time.test.ts`, `session-report.test.ts`, `client.test.ts`, `session-expiry.test.ts`, `appointment.test.ts`, `plans-create.test.ts`, `educator-update.test.ts` |

Componentes do design system recorrentes: `AppHeader`, `DsButton`, `Toast`/`useToast`, `Field`,
`DateField`, `TimeField`, `SelectField`, `Badge`, `InfoCard`. Mocks: `src/mocks/README.md`.

**Cenários de mock úteis** (`EXPO_PUBLIC_USE_MOCKS=true`, `educadora.mock@labirinto.test`):
conflito de horário (criar atendimento `PENDING` no mesmo horário → `409 APPOINTMENT_CONFLICT` com
`conflictingAppointmentId`); `409 APPOINTMENT_NOT_EDITABLE` (editar `COMPLETED`/`CANCELLED`);
`404 APPOINTMENT_NOT_FOUND` no `start` (atendimento inexistente ou de outro paciente);
`finish` conclui o atendimento `PENDING` ligado à sessão; `response-other` (anamnese de outro
educador: `PUT` → `403`, `GET` por id → `401`); `409 ACTIVE_PDI_ALREADY_EXISTS` com `student-1`
(planos, ver [04-planos.md](04-planos.md)).

---

## 1. Fluxos entre telas

### F1 — Agenda → novo atendimento → iniciar sessão → encerrar → "Concluído"

**Objetivo:** o atendimento agendado vira "Concluído" na **Agenda**, na **Início** e no **detalhe**
depois de uma sessão ligada a ele. É o fluxo mais sensível a cache: cinco telas leem a mesma chave.
**Dados:** Paciente A (com responsável) e um caderno com 2 a 3 atividades. **Pré-condição:** nenhum
atendimento do Paciente A no mesmo horário.

#### F1.1 — Criar o atendimento para hoje

- **Prioridade / AC:** P1 · AGE-03 (MAN)
- **Objetivo:** o novo item aparece na Agenda e na Início sem recarregar.
- **Passos:** aba **Agenda** → **"Novo atendimento"** → escolher "Paciente Teste Um", a data de hoje e um horário daqui a alguns minutos → **"Agendar atendimento"**.
- **Resultado esperado:**
  - **Tela:** toast **"Atendimento agendado"**; o formulário volta para a Agenda com o item no dia de hoje (ex.: "14:00 · 50 min").
  - **Rede (backend real):** `POST /appointment/` com `studentId`, `scheduledAt` em **ISO UTC** (ex.: `2026-11-03T13:00:00.000Z`; offset `-03:00` dá `400`), `type`/`durationMinutes` se preenchidos; `201` com `id`, `status: "PENDING"`.
  - **Ponto de verificação:** abra a aba **Início**: o item aparece em "Agenda de hoje" **sem puxar para atualizar**.
  - **Consulta invalidada:** `["appointment"]` (`appointmentQueryKeys.all`) — compartilhada pela Agenda, pela Início (`homeQueryKeys.appointments`) e pelo detalhe (`[...appointmentQueryKeys.all, "detail", id]`).
- **Onde está no código:** `app/agenda/new.tsx` → `src/features/agenda/form/AppointmentFormScreen.tsx`; `src/features/appointments/mutations.ts` › `createAppointmentMutationOptions` (`invalidateAppointments`); `src/api/endpoints/appointment.ts` › `createAppointment`; `src/features/appointments/useAppointments.ts` › `appointmentQueryKeys`; `src/features/home/useHomeData.ts` › `homeQueryKeys`. DS: `DateField`, `TimeField`, `SelectField`, `Toast`.
- **Testes automatizados que cobrem:** `src/features/appointments/__tests__/mutations.test.ts` — `it("cria e invalida a Agenda e a Home pela chave compartilhada")`; `AppointmentFormScreen.test.tsx` — `it("AC-AGE-03-01 envia só o obrigatório, com scheduledAt em ISO UTC")`. Rodar: `pnpm exec vitest run src/features/appointments/__tests__/mutations.test.ts src/features/agenda/form/__tests__/AppointmentFormScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. Item não aparece na Início → a Início não leu a chave `["appointment"]` invalidada; conferir `useHomeData.ts` (`homeQueryKeys.appointments`).
  2. "Já existe um atendimento nesse horário" → `409 APPOINTMENT_CONFLICT`: sobrou um atendimento do teste anterior (veja BE-04).
  3. Horário no dia errado → fuso: o app usa `America/Sao_Paulo` (`src/utils/date.ts` › `TIME_ZONE`); compare `scheduledAt` na rede.
  4. `400` na criação → `scheduledAt` fora de ISO UTC (BACKEND-ENTREGUE §8).
- **Evidência:** capturas da Agenda e da Início com o item; `POST /appointment/` e status.

#### F1.2 — Iniciar a sessão pelo atendimento

- **Prioridade / AC:** P1 · AGE-04 (MAN), AC-AGE-04-01
- **Objetivo:** a sessão abre com o paciente já escolhido e o vínculo com o atendimento.
- **Passos:** abrir o atendimento → **"Iniciar sessão"** → ver o paciente → tocar em **"Continuar"** → em "Nova sessão": escolher o caderno, preencher **"Nome da sessão"** (ex.: "Leitura de hoje") → **"Iniciar sessão"**.
- **Resultado esperado:**
  - **Tela:** "Nova sessão" (passo do paciente) abre com **"Paciente Teste Um"** já escolhido; depois, o passo do caderno; ao iniciar, abre o player (`/session/player`).
  - **Rede (backend real):** `POST /task-notebook-session/start` com `studentId`, `name`, `taskNotebookId` (só caderno) e **`appointmentId`**; `201` com o `id` da sessão.
  - **Ponto de verificação:** o `appointmentId` só vale se o paciente escolhido for o do atendimento; escolher outro paciente limpa o vínculo.
  - **Consulta invalidada:** nenhuma ainda.
- **Onde está no código:** `AppointmentDetailScreen.tsx` (botão "Iniciar sessão" → `/session/student` com `studentId` e `appointmentId`; a Início faz o mesmo em `HomeScreen.tsx`); `src/features/sessions/StudentStep.tsx` › `handleNext` (`setAppointmentId`); `ContentStep.tsx` › `handleStart` (`startSession`); `src/stores/session-flow.ts` (`appointmentId`, `setAppointmentId`); `src/api/endpoints/session.ts` › `startSession`.
- **Testes automatizados que cobrem:** `ContentStep.test.tsx` — `it("AC-AGE-04-02: envia o appointmentId no start quando a sessão veio de um atendimento")`, `it("404 APPOINTMENT_NOT_FOUND oferece iniciar sem vínculo, sem reenvio automático")`; `AppointmentDetailScreen.test.tsx` — `it("AC-AGE-04-01 PENDING: Iniciar sessão abre o fluxo com paciente e atendimento")`; `session-appointment.integration.test.ts` — `it("start com atendimento inexistente devolve 404 APPOINTMENT_NOT_FOUND")`.
- **Se falhar:**
  1. Paciente não vem escolhido → `params.studentId` não chegou a `StudentStep`; ver o `router.push` do detalhe.
  2. "Atendimento não encontrado. Inicie a sessão sem vínculo?" com "Iniciar sem vínculo" → `404 APPOINTMENT_NOT_FOUND` (atendimento removido ou de outro paciente); **sem reenvio automático**; escolher "Iniciar sem vínculo" perde a conclusão automática (F1.4 vira N/A).
  3. Sessão já em andamento ("Sessão em andamento": "Retomar" / "Encerrar agora") → resto de teste anterior; encerre-a antes.
  4. Caderno ausente na lista → caderno de teste não existe (veja Dados de teste, PLANO-TESTES §1.2).
- **Evidência:** capturas do passo do paciente; `POST …/start` com `appointmentId` presente (só o campo, não o valor).

#### F1.3 — Responder e encerrar com observação

- **Prioridade / AC:** P1 · AGE-04 (MAN)
- **Objetivo:** concluir a sessão ligada ao atendimento.
- **Passos:** no player, responder pelo menos uma atividade → **"Encerrar sessão"** → em "Registro da sessão", preencher "Registro descritivo" → **"Salvar e atualizar prontuário"** (ou **"Pular"**).
- **Resultado esperado:**
  - **Tela:** o encerramento (`/session/finish`) roda **uma única vez**; ao salvar a observação ou pular, abre o **relatório da sessão** (`/reports/session/[id]`).
  - **Rede (backend real):** `POST /task-notebook-session/answer` (com `timeToAnswer` em **ms**), `POST …/finish`; observação: `POST …/observation`.
  - **Ponto de verificação:** antes de sair do fluxo, `complete()` invalida `["task-notebook-session"]`, `["student-analysis"]` e **`["appointment"]`**.
  - **Consulta invalidada:** `["appointment"]` — é o que atualiza Agenda e Início.
- **Onde está no código:** `src/features/sessions/finish/FinishSessionScreen.tsx` › `runFinish`, `complete` (`invalidateQueries` de `["task-notebook-session"]`, `["student-analysis"]`, `appointmentQueryKeys.all`); `src/features/sessions/player/SessionPlayerScreen.tsx`; `src/api/endpoints/session.ts` › `answerSession`, `finishSession`, `addSessionObservation`; mock: `finish` muda o atendimento `PENDING` para `COMPLETED`.
- **Testes automatizados que cobrem:** `FinishSessionScreen.test.tsx` — `it("AC-AGE-04-03: ao concluir, invalida os atendimentos para a Agenda e a Início")`, `it("AC-SES-04-01: encerra a sessão uma única vez e segue para o registro")`; `session-appointment.integration.test.ts` — `it("finish conclui o atendimento PENDING ligado à sessão")`. Rodar: `pnpm exec vitest run src/features/sessions/finish/__tests__/FinishSessionScreen.test.tsx src/mocks/__tests__/session-appointment.integration.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. "Não foi possível confirmar o encerramento. Verifique a conexão e tente novamente." → timeout/rede no `finish`; o app reconcilia pela listagem (`SESSION_ALREADY_FINISHED`); **não** reenvia sozinho.
  2. "Não foi possível encerrar a sessão. Tente novamente." → outro erro do `finish`; ver o status.
  3. Observação não salva e tela fica → "Tentar novamente"; o texto é preservado.
  4. Relatório com tempo médio 1000× diferente → unidade de tempo (BE-01).
- **Evidência:** capturas do registro e do relatório.

#### F1.4 — Conferir "Concluído" na Agenda, na Início e no detalhe

- **Prioridade / AC:** P1 · AC-AGE-04-03
- **Objetivo:** o atendimento aparece concluído **sem puxar para atualizar** nas três telas.
- **Passos:** do relatório, voltar para a aba **Agenda**; olhar o dia de hoje; abrir a **Início**; abrir o atendimento.
- **Resultado esperado:**
  - **Tela:** selo **"Concluído"** na Agenda e na Início; no detalhe, status "Concluído" e **somente** a ação **"Editar observação"** (sem "Iniciar sessão", "Remarcar", "Cancelar atendimento").
  - **Rede (backend real):** `GET /appointment/` refaz (consulta invalidada) com `status: "COMPLETED"` (o backend conclui o atendimento ao fechar a sessão ligada a ele).
  - **Ponto de verificação:** se continuar "Pendente", compare o `GET /appointment/` da rede: se vier `PENDING`, o backend não concluiu (ver abaixo); se vier `COMPLETED`, é cache.
- **Onde está no código:** `src/features/agenda/AgendaScreen.tsx`; `src/features/home/HomeScreen.tsx`; `AppointmentDetailScreen.tsx` (`statusLabel`, ramos por `status`); `useAppointment`.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` — `it("AC-AGE-03-04 COMPLETED oferece só editar a observação")`; `FinishSessionScreen.test.tsx` — `it("AC-AGE-04-03: ao concluir, invalida os atendimentos para a Agenda e a Início")` (acima).
- **Se falhar:**
  1. Continua "Pendente" na rede → o backend não ligou a sessão ao atendimento (`appointmentId` ausente no `start`, F1.2) ou o atendimento não estava `PENDING`; mock: `finish` só conclui `PENDING`.
  2. Rede `COMPLETED` mas a tela antiga → invalidação não alcançou a tela (`FinishSessionScreen.tsx` › `complete`); a Início usa `homeQueryKeys.appointments`, mesma chave.
  3. Detalhe antigo e lista nova → a chave do detalhe está sob `["appointment"]`, então deveria cair junto; confirme `useAppointment`.
- **Evidência:** três capturas (Agenda, Início, detalhe).

### F2 — Ficha → editar → contato pelo WhatsApp

**Objetivo:** o dado novo do responsável aparece na ficha e na lista e o `wa.me` usa o **telefone novo**.
**Dados:** Paciente A com responsável.

#### F2.1 — Editar o telefone do responsável

- **Prioridade / AC:** P1 · PAC-07 (MAN)
- **Passos:** Pacientes → "Paciente Teste Um" → **"Editar"** → mudar **"Telefone do responsável"** (com máscara) → **"Salvar alterações"**.
- **Resultado esperado:**
  - **Tela:** o botão "Salvar alterações" só habilita após a mudança; toast **"Paciente salvo com sucesso"**; cerca de 0,7 s depois a tela volta (`router.back`) para a ficha.
  - **Rede (backend real):** `PUT /student/update/:id` (multipart) **só** com os campos alterados; `guardianPhone` **só dígitos** (sem máscara); `200`.
  - **Ponto de verificação:** a ficha já mostra o dado novo; a **lista de Pacientes** também.
  - **Consulta invalidada:** `["student"]` (chave de `useStudents` e de `homeQueryKeys.students`).
- **Onde está no código:** `app/patients/[id]/edit.tsx` → `src/features/patients/form/PatientFormScreen.tsx` (`onSuccess`: `invalidateQueries({ queryKey: ["student"] })`, toast, `router.back` após 700 ms); `src/api/endpoints/student-update.ts` › `updateStudent` (descarta `educators`; `guardianPhone.replace(/\D/g, "")`); DS: `Field`, `DsButton`, `Toast`.
- **Testes automatizados que cobrem:** `PatientFormScreen.test.tsx` — `it("preenche a edição, desabilita sem mudanças e envia apenas o telefone alterado")`, `it("mantém os dados e mostra a mensagem da API se a edição falhar")`; `student-update.integration.test.ts` — `it("envia apenas os campos informados como multipart e atualiza a lista")`. Rodar: `pnpm exec vitest run src/features/patients/form/__tests__/PatientFormScreen.test.tsx src/mocks/__tests__/student-update.integration.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. `400` no `guardianPhone` → a máscara foi enviada; o backend só aceita dígitos (BACKEND-ENTREGUE §8).
  2. Lista antiga → `["student"]` não foi invalidada (ver `onSuccess`).
  3. "Informe um telefone válido" → validação local da máscara.
- **Evidência:** `PUT /student/update/:id` e status; capturas da ficha e da lista.

#### F2.2 — Contatar o responsável pelo WhatsApp

- **Prioridade / AC:** P1 · AGE-02 (MAN)
- **Passos:** na ficha, tocar em **"Contatar responsável"**.
- **Resultado esperado:**
  - **Tela:** abre o WhatsApp (ou o navegador, via `wa.me`) com "Olá, {responsável}! Tudo bem? Aqui é {educador}, do acompanhamento de {paciente}." e o **telefone novo** (com `55` na frente quando há 10 ou 11 dígitos).
  - **Rede:** nenhuma ao backend; é `Linking.openURL("https://wa.me/55…?text=…")`.
  - **Ponto de verificação:** o telefone é o do **responsável** (prioridade sobre o `phonenumber` do paciente); sem nenhum, o botão fica desabilitado com "Paciente sem telefone cadastrado".
- **Onde está no código:** `src/utils/whatsapp.ts` › `pickContactPhone`, `buildWhatsAppUrl`, `patientContactMessage`; `src/features/patients/detail/PatientDetailScreen.tsx` (`contactUrl`).
- **Testes automatizados que cobrem:** `src/utils/__tests__/whatsapp.test.ts` — `it("AC-AGE-02-01 prioriza responsável e normaliza telefone com máscara ou DDI")`; `PatientDetailScreen.test.tsx`. Rodar: `pnpm exec vitest run src/utils/__tests__/whatsapp.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Número antigo → a ficha ainda lê o cache (F2.1 falhou na invalidação).
  2. Nada abre → emulador sem WhatsApp e sem navegador; ver [09-aparelhos-qa04.md](09-aparelhos-qa04.md).
  3. Número sem `55` → o telefone não tem 10 ou 11 dígitos (`buildWhatsAppUrl` só acrescenta nesse caso).
- **Evidência:** captura do `wa.me` (só os últimos dígitos, se visível).

### F3 — Ficha → anamnese: criar modelo → responder → editar

**Objetivo:** o modelo nasce, a resposta entra com data, a edição marca "Editada em", e o modelo
**passa a recusar** edição e exclusão. **Pré-condição:** conta sem modelo (ou um modelo novo).

#### F3.1 — Da ficha ao "Criar modelo"

- **Prioridade / AC:** P1 · PAC-06 (MAN)
- **Passos:** ficha → linha **"Anamnese"** → (sem modelo) **"Criar modelo"**.
- **Resultado esperado:** estado vazio com **"Criar modelo"**, que abre `/anamnese/templates/new`. **Rede:** `GET /anamnese/templates/` (`[]`) e `GET /anamnese/responses/student/:id`.
- **Onde está no código:** `app/patients/[id]/anamnese.tsx` → `src/features/anamnese/responses/AnamneseResponsesScreen.tsx`; `useAnamneseResponses.ts` › `anamneseResponsesKey`.
- **Testes automatizados que cobrem:** `AnamneseResponsesScreen.test.tsx` (estado vazio).
- **Se falhar:** erro de carregamento → `GET …/templates/` ou `…/responses/student/:id` falhou; ver o status.
- **Evidência:** captura.

#### F3.2 — Criar o modelo (uma pergunta de cada tipo)

- **Prioridade / AC:** P1 · PAC-08 (MAN)
- **Passos:** "Novo modelo" → título, descrição, 4 perguntas (Descritiva, Múltipla escolha com 2 opções, Caixas de seleção com 3, Arquivo), uma "Obrigatória" → **"Salvar modelo"** → voltar.
- **Resultado esperado:**
  - **Tela:** "Modelos de anamnese" lista o modelo com o número de perguntas; ao voltar para a anamnese do paciente, o modelo **já aparece** para escolha.
  - **Rede (backend real):** `POST /anamnese/templates/` com `title`, `description`, `questions[]`; `201`.
  - **Ponto de verificação:** a lista de modelos e a tela de anamnese do paciente refletem o modelo novo.
  - **Consulta invalidada:** `["anamnese","templates"]` (`TemplateFormScreen.tsx` › `save.onSuccess`, que também faz `router.back()`; o `deletion.onSuccess` invalida a mesma chave).
- **Onde está no código:** `src/features/anamnese/templates/TemplateFormScreen.tsx` (`invalidateQueries`), `templateSchema.ts`, `TemplateListScreen.tsx`; `src/api/endpoints/anamnese.ts`.
- **Testes automatizados que cobrem:** `TemplateFormScreen.test.tsx`, `templateSchema.test.ts`, `anamnese/templates/__tests__/api.test.ts`.
- **Se falhar:** modelo não aparece ao voltar → a invalidação não alcançou a lista da anamnese; olhar `TemplateFormScreen.tsx` › `save.onSuccess` e a chave de `TemplateListScreen.tsx`.
- **Evidência:** capturas da lista de modelos.

#### F3.3 — Responder a anamnese

- **Prioridade / AC:** P1 · PAC-06 (MAN)
- **Passos:** anamnese do paciente → **"Nova anamnese"** → **"Escolher modelo"** → preencher cada tipo → **"Salvar anamnese"**.
- **Resultado esperado:**
  - **Tela:** a anamnese entra na lista com **"Respondida em …"**; a linha "Anamnese" da ficha mostra a data da última.
  - **Rede (backend real):** `POST /anamnese/templates/:templateId/responses` com `answers[]`; `201`. Arquivo: `POST /anamnese/responses/upload-file` (multipart `file`) **antes** do envio; acima de 10 MB a tela mostra "O arquivo excede o limite de 10 MB.".
  - **Ponto de verificação:** a lista e a ficha leem a mesma chave `["anamnese","responses","student",id]`.
  - **Consulta invalidada:** `anamneseResponsesKey(studentId)` (`AnamneseForm.tsx` › `invalidateQueries`).
- **Onde está no código:** `src/features/anamnese/responses/AnamneseForm.tsx`, `answers.ts`; `src/api/endpoints/anamnese-responses.ts` › `createAnamneseResponse`, `uploadAnamneseFile`.
- **Testes automatizados que cobrem:** `anamnese/responses/__tests__/api.test.ts` — `it("valida as respostas na criação")`, `it("envia o arquivo em multipart e devolve a URL")`; `answers.test.ts`.
- **Se falhar:** "Resposta obrigatória"/"Envie o arquivo" → validação local (PAC-06.4); `400` na criação → pergunta obrigatória sem resposta; upload falha → seletor de arquivo e Expo Go ([09-aparelhos-qa04.md](09-aparelhos-qa04.md)).
- **Evidência:** captura da lista e da ficha.

#### F3.4 — Editar a resposta

- **Prioridade / AC:** P1 · PAC-06 (MAN)
- **Passos:** abrir a anamnese → **"Editar"** → mudar uma resposta → salvar → voltar à ficha.
- **Resultado esperado:** "Respondida em … · Editada em …"; **`GET /anamnese/responses/:responseId` não é chamado** (o app lista por paciente). **Rede:** `PUT /anamnese/responses/:responseId` (`200`; mantém `answeredAt`, grava `updatedAt`).
- **Onde está no código:** `AnamneseForm.tsx`; `updateAnamneseResponse`.
- **Testes automatizados que cobrem:** `api.test.ts` — `it("edita mantendo answeredAt e gravando updatedAt")`.
- **Se falhar:** `403 UNAUTHORIZED` → resposta de outro educador; ver BE-02.
- **Evidência:** captura.

#### F3.5 — O modelo respondido recusa edição e exclusão

- **Prioridade / AC:** P1 · PAC-08.5
- **Passos:** Recursos → "Modelos de anamnese" → abrir o modelo respondido → editar e salvar; excluir.
- **Resultado esperado:** "Este modelo já tem respostas e não pode ser alterado." nas duas ações; o formulário não é perdido. **Rede:** `PUT`/`DELETE /anamnese/templates/:id` recusado pelo servidor (erro de negócio).
- **Onde está no código:** `TemplateFormScreen.tsx` (mapeamento do erro); mock: `src/mocks/handlers/anamnese.ts`.
- **Testes automatizados que cobrem:** `TemplateFormScreen.test.tsx`.
- **Se falhar:** o modelo deixa editar → o backend não recusou (ver o status da chamada); mensagem diferente → mapeamento do código do erro em `TemplateFormScreen.tsx`.
- **Evidência:** captura da mensagem e status.

### F4 — Planos: gerar → editar → salvar → detalhe → meta atingida → revisão → sugestões → encerrar

**Objetivo:** o percurso completo do domínio de planos. Cada passo é detalhado nos casos de
[04-planos.md](04-planos.md); aqui ficam os **pontos de verificação entre telas**. **Dados:**
Paciente A **sem** PDI ativo; PLN-05 na `main` (senão pule F4.7).

| Passo | Ação (texto do botão)                                              | Caso de detalhe | Ponto de verificação entre telas                                                                                                                         | Consulta que precisa estar atualizada (arquivo)                                                                                   |
| ----- | ------------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| F4.1  | Ficha → aba **"Planos"** → **"Criar novo plano"**                  | PAC-04.1, 04.2  | A geração abre com o **paciente já escolhido** (`/plans/new?studentId=…`)                                                                                | —                                                                                                                                 |
| F4.2  | **"Gerar planejamento com IA"** (PDI, 3 meses) — **anote o tempo** | PLN-02.2        | Rascunho "não salvo"; `GET /plan/` **igual** (nada persistido)                                                                                           | —                                                                                                                                 |
| F4.3  | Editar título e metas                                              | PLN-03.1        | Entre 1 e 10 metas                                                                                                                                       | —                                                                                                                                 |
| F4.4  | **"Salvar PDI"**                                                   | PLN-03.2        | Abre o **detalhe** (`/plans/{id}`) com as datas do rascunho; sem prompt de descarte                                                                      | `["plan"]` invalidada em `DraftPreview.tsx` › `save.onSuccess` → lista, aba "Planos" e "PDI vigente" refazem                      |
| F4.5  | No detalhe, meta → **"Atingida"**                                  | PLN-04.2        | O progresso sobe com o valor **do servidor**                                                                                                             | `setQueryData(["plan","detail",id])` + `invalidateQueries(["plan"], refetchType "none")` em `PlanDetailScreen.tsx` › `acceptPlan` |
| F4.6  | **"Registrar revisão"** → **"Salvar revisão"**                     | PLN-04.5        | A revisão aparece no topo de "Revisões"                                                                                                                  | `["plan","reviews",id]` via `setQueryData` em `reviewMutation.onSuccess`                                                          |
| F4.7  | **"Pedir sugestões da IA"**; aceitar uma e descartar outra         | PLN-05.1, 05.2  | O cartão da **Início** ("N sugestões da IA para revisar") acompanha; aceitar aplica no plano                                                             | `["plan","suggestions","PENDING"]` (`usePlanSuggestions.ts` › `removeFromList` e `invalidateQueries(["plan"])`)                   |
| F4.8  | **"Encerrar plano"** → "Concluído" → **"Confirmar"**               | PLN-04.6        | Plano **somente leitura**; vai a **"Encerrados"**; "PDI vigente" da ficha volta a **"Nenhum PDI ativo"**; o cartão da Início perde as sugestões do plano | `["plan"]` em `acceptPlan`; sugestões pendentes são descartadas **pelo servidor** ao encerrar                                     |

- **Prioridade / AC:** P1 · PLN-02 a PLN-05, PAC-04.
- **Resultado esperado do fluxo:** cada passo funciona como nos casos de [04-planos.md](04-planos.md); o plano termina somente leitura, em "Encerrados", e a ficha volta a "Nenhum PDI ativo".
- **Onde está no código:** ver o mapa de [04-planos.md](04-planos.md#mapa-da-área).
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("invalida a consulta real da lista depois de salvar")`; `PlanDetailScreen.test.tsx`; `PlanSuggestionsScreen.test.tsx`; `PatientPlans.test.tsx`.
- **Se falhar:** conferir a linha do passo na tabela; se a tela mostra dado velho após o passo, o suspeito é a invalidação indicada na última coluna; se o valor da rede também está errado, é do backend.
- **Evidência:** tempo da geração e das sugestões (tabela de tempos do [04-planos.md](04-planos.md#tempos-da-ia)); uma captura por passo P1.

### F5 — Perfil → sair → login

**Objetivo:** a mudança persiste, a saída limpa o cache e o Voltar não reabre a área logada.
**Pré-condição:** logado. **Dados:** conta de teste (sem credenciais no relatório).

#### F5.1 — Mudar a profissão e salvar

- **Prioridade / AC:** P1 · REC-02 (MAN)
- **Passos:** Recursos → banner do educador → **"Perfil"** → mudar a profissão → **"Salvar"**.
- **Resultado esperado:**
  - **Tela:** toast **"Perfil atualizado"**; o banner de Recursos mostra a profissão nova.
  - **Rede (backend real):** `PUT /educator/update-educator` só com os campos **alterados** (`newName`/`newContact`/`newProfession`); depois `GET /educator/me` (a resposta do `PUT` traz campos `_…` e `_password` e é **descartada**).
  - **Ponto de verificação:** ao reabrir o Perfil, os valores vêm do servidor.
  - **Consulta invalidada:** `["educator","me"]` (`homeQueryKeys.educator`).
- **Onde está no código:** `src/features/profile/ProfileScreen.tsx` › `save` (`updateEducator` + `invalidateQueries({ queryKey: homeQueryKeys.educator })`); `src/api/endpoints/educator-update.ts` › `updateEducator`.
- **Testes automatizados que cobrem:** `ProfileScreen.test.tsx` — `it("valida, salva só o alterado, recarrega /me e envia foto")`; `educator-update.test.ts` — `it("discards the prefixed response including _password and reads /me")`.
- **Se falhar:** profissão antiga → `["educator","me"]` não refez; `400` → campo fora de 3 a 100 caracteres ("Informe entre 3 e 100 caracteres.").
- **Evidência:** capturas do perfil e do banner.

#### F5.2 — Sair e conferir o Login

- **Prioridade / AC:** P1 · REC-02 (MAN), AC-REC-02-05
- **Passos:** **"Sair"** → **"Cancelar"** (não desloga) → **"Sair"** → **"Confirmar saída"** → ver o Login → tocar em Voltar do Android.
- **Resultado esperado:**
  - **Tela:** "Sair da conta?" / "Você precisará entrar novamente para acessar seus dados."; confirmar leva ao **Login**; o Voltar **não** reabre a área logada.
  - **Rede:** nenhuma chamada de saída (a saída é local: apaga o token).
  - **Ponto de verificação:** nada da sessão anterior fica visível; o cache é limpo.
  - **Consulta invalidada:** o cache inteiro é **limpo** (`queryClient.clear()` em `ProfileScreen` › `useEffect` quando `loggedOut`).
- **Onde está no código:** `ProfileScreen.tsx` › `leave`; `src/stores/auth.ts` › `logout` (`clearSession("logout")`); `src/features/auth/useSessionGuard.ts` (redireciona para `(auth)` quando `unauthenticated`); `src/features/auth/token-storage.ts`.
- **Testes automatizados que cobrem:** `ProfileLogout.test.tsx` — `it("waits for confirmation and clears query cache")`; `src/stores/__tests__/auth.test.ts`; `useSessionGuard.test.tsx`.
- **Se falhar:** Voltar reabre a área → o guard não redirecionou (`useSessionGuard`); dados antigos aparecem após novo login → cache persistido de outro educador (o persister é por `educatorId`, `query-persister.ts`).
- **Evidência:** capturas do diálogo e do Login.

#### F5.3 — Entrar de novo

- **Prioridade / AC:** P1 · REC-02 (MAN)
- **Passos:** entrar com a conta de teste.
- **Resultado esperado:** as telas recarregam **do servidor**; a profissão mudada aparece. **Rede:** `POST /educator/sign-in` (`200` com token) e `GET /educator/me` (precisa de token no backend real).
- **Onde está no código:** `src/features/auth/LoginForm.tsx`, `useSignIn.ts` (401 do sign-in vira "credenciais inválidas", **não** expira sessão); `src/api/client.ts` › `isSignInRequest`.
- **Testes automatizados que cobrem:** `useSignIn.test.tsx`; `client.test.ts` — `it("does not emit session expiry for the exact sign-in route")`.
- **Se falhar:** login recusado com mocks desligados → conta errada; login fictício dos mocks entrando → `.env` não foi lido (FEC-02).
- **Evidência:** captura da Início após o login.

---

## 2. Conferências do backend

Cada caso confere uma regra ou divergência do [BACKEND-ENTREGUE](../BACKEND-ENTREGUE.md) §9
no backend **real**. **Como registrar sem dados sensíveis:** anote só `método caminho → status`
(ex.: `GET /appointment/ → 200`) e o **nome** dos campos relevantes, nunca os valores de
`educators`, `_password`, token, e-mail ou telefone. Se o backend mudou, registre a diferença.

#### BE-01 — Unidade de `timeToAnswer` (D2)

- **Prioridade / AC:** P1 · D2
- **Objetivo:** confirmar que o relatório do aluno mostra tempos coerentes com a unidade que o app envia (**milissegundos**).
- **Pré-condição:** uma sessão da V1 com respostas de tempo conhecido.
- **Passos:**
  1. Responder uma atividade esperando cerca de **5 segundos** antes de tocar na alternativa.
  2. Encerrar a sessão e abrir o relatório (tempo médio por resposta).
- **Resultado esperado:**
  - **Tela:** o relatório mostra **cerca de 5,0 s** ("5,0 s"), não "5000 s"/"83 min" nem "0,0 s".
  - **Rede (backend real):** `POST /task-notebook-session/answer` com `timeToAnswer` ≈ 5000 (inteiro, não negativo); o relatório lê `averageTimePerQuestion`, `averageCorrectTime`, `averageIncorrectTime` em **ms**.
  - **Código que depende:** `toApiTimeToAnswer` (`src/features/sessions/player/time.ts`), chamada em `SessionPlayerScreen.tsx`; `formatAnswerDuration` (`src/features/reports/session/sessionReport.ts`), usada em `SessionReportScreen.tsx`.
- **Onde está no código:** `time.ts` › `toApiTimeToAnswer` (`Math.max(0, Math.floor(ms))`); `sessionReport.ts` › `formatAnswerDuration` (divide por 1000; ≥ 60 s vira "N min M s").
- **Testes automatizados que cobrem:** `src/features/sessions/player/__tests__/time.test.ts` — `it("G-07: envia milissegundos inteiros não negativos até confirmação do backend")`; `src/features/reports/session/__tests__/session-report.test.ts`. Rodar: `pnpm exec vitest run src/features/sessions/player/__tests__/time.test.ts src/features/reports/session/__tests__/session-report.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Relatório 1000× **maior** → o backend passou a tratar o valor como **segundos** (o Swagger diz "Segundos"); a correção é do app: converter em `toApiTimeToAnswer` e ajustar `formatAnswerDuration` (G-07).
  2. Relatório 1000× **menor** → o backend passou a devolver segundos nas médias; ajustar só `formatAnswerDuration`.
  3. Valor coerente mas a tela mostra "—" → média `null` (sem resposta correta/incorreta); não é unidade.
- **Evidência:** o valor mostrado, o `timeToAnswer` enviado (só o número) e o status.

#### BE-02 — 401 da anamnese de outro educador (D4)

- **Prioridade / AC:** P1 · D4
- **Objetivo:** o app não depende de `GET /anamnese/responses/:responseId` e um 401 não derruba a sessão.
- **Pré-condição:** id de resposta de **outro** educador, fornecido pelo time (só se houver).
- **Passos:**
  1. Fazer o fluxo normal da anamnese (F3).
  2. Na rede, conferir que o app **não** chama `GET /anamnese/responses/:responseId`.
  3. Se houver o id de outro educador, pedir ao time a chamada de apoio **fora do app**.
- **Resultado esperado:**
  - **Tela:** o app lista e edita pelas rotas por paciente (`GET /anamnese/responses/student/:id`, `PUT /anamnese/responses/:id`).
  - **Rede (backend real):** `GET …/responses/:responseId` de outro educador → `401 Unauthorized` (não 403); o `PUT` da mesma rota → `403 UNAUTHORIZED`.
  - **Código que depende:** `src/api/client.ts` (interceptor de 401) e `src/features/auth/session-expiry.ts` (`connectSessionExpiry`).
- **Onde está no código:** `src/features/anamnese/responses/useAnamneseResponses.ts` (comentário: "Não usa `GET /anamnese/responses/:id`: o 401 dessa rota (D4) seria tratado como sessão expirada"); `src/api/client.ts` (qualquer `401` exceto o do `POST /educator/sign-in` dispara `subscribeSessionExpired`); `session-expiry.ts` (limpa o cache e expira a sessão).
- **Testes automatizados que cobrem:** `src/api/__tests__/client.test.ts` — `it("emits one session-expired event for an authenticated 401")`; `src/features/auth/__tests__/session-expiry.test.ts`; `src/features/anamnese/responses/__tests__/api.test.ts` — `it("PUT de outro educador devolve 403 e de resposta inexistente 404")`.
- **Se falhar:**
  1. O app chama o `GET` por id → regressão de `AnamneseResponsesScreen`/`AnamneseForm`; procure `anamnese/responses/${`.
  2. Volta ao Login ao abrir uma anamnese → algum `401` chegou ao interceptor (token expirado de verdade ou rota por id); confira o caminho do `401` na rede.
  3. Mock × backend: o mock reproduz com `response-other` (`GET` → `401`).
- **Evidência:** lista de chamadas (método e caminho) do fluxo, mostrando ausência do `GET` por id; "não exercitado" se não houver id de outro educador.
- **Divergência encontrada:** o PLANO-TESTES e o BACKEND-ENTREGUE §9 (D4) dizem que "um 401 nessa rota **não desloga** o usuário" / "PAC-06 trata o 401 como 'sem acesso'". No código, **o interceptor trata qualquer 401 autenticado como sessão expirada** (limpa o cache e vai ao Login); a proteção é só **não chamar** a rota por id. Se alguma tela passar a chamá-la, um 401 deslogará. Registre como observado.

#### BE-03 — Erros do atendimento (D5)

- **Prioridade / AC:** P2 · D5
- **Objetivo:** excluir devolve `OK` em texto (sem JSON) e o app trata como sucesso; atendimento inexistente (`400 NOT_FOUND`) vira mensagem própria.
- **Pré-condição:** atendimento de teste.
- **Passos:**
  1. Excluir um atendimento (detalhe → "Excluir atendimento" → "Excluir").
  2. Reabrir o detalhe de um atendimento já excluído (pelo histórico/voltar).
- **Resultado esperado:**
  - **Tela:** toast "Atendimento excluído" e o item some da Agenda; atendimento inexistente: **"Atendimento não encontrado"** com **"Voltar"** (sem "Tentar de novo"), sem erro genérico nem queda.
  - **Rede (backend real):** `DELETE /appointment/:id → 200` com o texto `OK`; `GET /appointment/:id` inexistente → `400 { message: "NOT_FOUND" }`; id fora do formato UUID → `500` (**não ocorre pelo app**, que só usa ids da API).
  - **Código que depende:** `isAppointmentNotFound` e `appointmentErrorMessage` (`src/features/agenda/errors.ts`); `refetchOnNotFound` (`src/features/appointments/mutations.ts`); `useAppointment` (sem retry em `NOT_FOUND`).
- **Onde está no código:** `src/api/endpoints/appointment.ts` › `deleteAppointment` (`apiClient.delete<void>`, ignora o corpo); `AppointmentDetailScreen.tsx` (ramo `query.isError`).
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` — `it("mostra 'Atendimento não encontrado' com Voltar para 400 NOT_FOUND")`, `it("AC-AGE-03-03 excluir só chama a API depois da confirmação e volta")`; `AppointmentFormScreen.test.tsx` — `it("mostra 'Atendimento não encontrado' com Voltar quando o id não existe")`; `appointment.test.ts` — `it("cria, lê, atualiza e exclui")`.
- **Se falhar:**
  1. Excluir mostra erro mas o item some → o backend excluiu e o app tentou reler o detalhe (a consulta cai em `NOT_FOUND` durante a exclusão); o detalhe só mostra o erro se `!deletion.isPending`.
  2. Mensagem genérica "Não foi possível carregar o atendimento." → o código do erro não é `NOT_FOUND` (backend mudou o texto/status); ver a rede.
  3. Tela travada em "Carregando" → `retry` do `useAppointment`.
- **Evidência:** status das chamadas; captura da mensagem.

#### BE-04 — Conflito de horário (`409 APPOINTMENT_CONFLICT`)

- **Prioridade / AC:** P1 · AGE-03 (AC-AGE-03-05)
- **Objetivo:** o conflito aparece no campo de horário com o atendimento conflitante acessível; horário que apenas "encosta" não conflita.
- **Pré-condição:** atendimento **pendente** às 15:00 do Paciente A.
- **Passos:**
  1. Criar outro atendimento no **mesmo dia e horário** (ou remarcar um existente para ele).
  2. Tocar em **"Ver atendimento"**.
  3. Criar um atendimento que **encosta** (começa quando o outro termina).
- **Resultado esperado:**
  - **Tela:** no campo de horário: **"Já existe um atendimento nesse horário"** e o link **"Ver atendimento"** (abre o atendimento conflitante); o formulário continua preenchido. O horário encostado **salva** normalmente.
  - **Rede (backend real):** `POST /appointment/` (ou `PUT /appointment/:id`) → `409 { message: "APPOINTMENT_CONFLICT", conflictingAppointmentId }`.
  - **Código que depende:** `AppointmentApiError` (campo `conflictingAppointmentId`) e `throwOnConflict` em `src/api/endpoints/appointment.ts`; `conflictingAppointmentId` e `CONFLICT_MESSAGE` em `src/features/agenda/errors.ts`.
- **Onde está no código:** `AppointmentFormScreen.tsx` (`conflictId`, `error={conflictId ? CONFLICT_MESSAGE : undefined}`, botão "Ver atendimento"); `acceptConflict` (`validateStatus` permite o `409`, porque o `ApiError` central descarta o corpo).
- **Testes automatizados que cobrem:** `appointment.test.ts` — `it("expõe o atendimento conflitante no erro 409")`; `AppointmentFormScreen.test.tsx` — `it("AC-AGE-03-05 mostra o conflito no campo de horário com o link para o conflitante")`, `it("AC-AGE-03-05 conflito ao remarcar aparece no horário")`.
- **Se falhar:**
  1. Mensagem genérica "Não foi possível concluir a ação. Tente novamente." → o `409` virou `ApiError` simples (perdeu `conflictingAppointmentId`); conferir `acceptConflict`.
  2. Sem link "Ver atendimento" → o corpo do `409` veio sem `conflictingAppointmentId`.
  3. Encostado dá conflito → regra de sobreposição do backend (intervalos meio-abertos); registre os dois horários e durações.
- **Evidência:** capturas; `POST /appointment/ → 409` e código.

#### BE-04b — Status e edição do atendimento (`409`)

- **Prioridade / AC:** P2 · D5/409
- **Objetivo:** mensagens dos `409 APPOINTMENT_NOT_EDITABLE` e `INVALID_STATUS_TRANSITION`.
- **Pré-condição:** atendimento concluído e atendimento cancelado.
- **Passos:** tentar mudar o horário de um concluído (se a tela permitir) e provocar uma transição inválida de status.
- **Resultado esperado:** **"Este atendimento não permite alterar horário, tipo ou duração."** ou **"Essa mudança de status não é permitida."**, sem travar nem reenviar. Se a tela já impede a ação, registre N/A. **Rede:** `409` com `message` = o código.
- **Onde está no código:** `src/features/agenda/errors.ts` › `appointmentErrorMessage`; `AppointmentFormScreen.tsx` e `AppointmentDetailScreen.tsx`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` — `it("mostra a mensagem do 409 de campo não editável, sem reenvio")`; `AppointmentDetailScreen.test.tsx` — `it("mostra o erro 409 de transição sem reenvio automático")`.
- **Se falhar:** mensagem genérica → o `message` do `409` não bate com os códigos; ver a rede.
- **Evidência:** captura e código.

#### BE-05 — PDI ativo já existe (`409 ACTIVE_PDI_ALREADY_EXISTS`)

- **Prioridade / AC:** P1 · PLN-03 (AC-PLN-03-03)
- **Objetivo:** o servidor recusa o segundo PDI ativo e o app leva ao ativo sem perder o rascunho.
- **Pré-condição:** Paciente A com **PDI ativo**.
- **Passos:** gerar novo PDI → editar → **"Salvar PDI"** → **"Ver PDI ativo"** → voltar.
- **Resultado esperado:**
  - **Tela:** "Este paciente já tem um PDI ativo." e **"Ver PDI ativo"** (abre o plano ativo certo); o rascunho **não se perde**.
  - **Rede (backend real):** `POST /plan/ → 409 { message: "ACTIVE_PDI_ALREADY_EXISTS", activePlanId }`.
  - **Código que depende:** `PlanApiError` e `throwOnConflict` em `src/api/endpoints/plans.ts`; `DraftPreview.tsx` (`conflict`).
- **Onde está no código:** ver [04-planos.md](04-planos.md), caso PLN-03.3.
- **Testes automatizados que cobrem:** `GeneratePlanScreen.test.tsx` — `it("mostra o PDI ativo no 409 e conserva os campos do rascunho")`; `plans-create.test.ts` — `it("preserva activePlanId no conflito 409")`.
- **Se falhar:** igual ao PLN-03.3.
- **Evidência:** captura e `POST /plan/ → 409`.

#### BE-05b — Plano encerrado (`409 PLAN_NOT_EDITABLE`)

- **Prioridade / AC:** P2 · PLN-04
- **Objetivo:** qualquer escrita em plano encerrado é recusada; o app já esconde os botões.
- **Pré-condição:** plano encerrado.
- **Passos:** tentar alterar um plano encerrado pelo app (os botões não existem; só uma corrida entre aparelhos chega ao `409`).
- **Resultado esperado:** o app não oferece "Editar plano", "Registrar revisão", "Encerrar plano", "Pedir sugestões da IA" nem os seletores de meta; se algum caminho chegar ao `409`, a tela mostra **"Este plano já foi encerrado."** e o plano não muda.
- **Onde está no código:** `PlanDetailScreen.tsx` (`active`, `conflictMessages.PLAN_NOT_EDITABLE`, `errorMessage`).
- **Testes automatizados que cobrem:** `PlanDetailScreen.test.tsx` — `it("não oferece o botão em plano encerrado")`; `plans-detail.test.ts` — `it("encerra definitivamente e bloqueia todas as escritas")`.
- **Se falhar:** botões aparecem em plano encerrado → `plan.status` desatualizado; reabrir o plano refaz `GET /plan/:id`.
- **Evidência:** captura do plano encerrado.
- **Divergência encontrada:** o PLANO-TESTES fala em "mensagem neutra"; o app mostra o texto específico "Este plano já foi encerrado.".

#### BE-06 — Segurança: senha de educador nas respostas (D1 / D3)

- **Prioridade / AC:** P1 · D1, D3
- **Objetivo:** o **backend** ainda pode devolver `educators` (com senha) e `_password`; o **app** não mostra, não registra e não guarda esses campos.
- **Pré-condição:** ferramenta de rede ou log do app em desenvolvimento.
- **Passos:**
  1. Abrir Pacientes, a ficha e "Editar paciente".
  2. Salvar o perfil (F5.1).
  3. Inspecionar o tráfego de `GET /student/`, `PUT /student/update/:id`, `POST /student/create` (se criou paciente) e `PUT /educator/update-educator`.
  4. Conferir as telas e o armazenamento do app.
- **Resultado esperado:**
  - **Tela / armazenamento:** nenhum campo `educators`, `password` ou `_password` visível nem persistido.
  - **Rede (backend real):** **registre só se o campo está presente** (sim/não), **sem copiar valores**; qualquer vazamento **no app** é **FALHA P1**. Depois de salvar o perfil, o app refaz `GET /educator/me`.
  - **Código que depende:** `listStudents` (`src/api/endpoints/student.ts`), `updateStudent` (`student-update.ts`), `createStudent` (`student-create.ts`) removem `educators` antes de devolver; `updateEducator` (`educator-update.ts`) **descarta** a resposta; tipo `Student.educators?: never` em `src/api/types.ts`.
- **Onde está no código:** os arquivos acima; cache persistido: `src/api/query-persister.ts` (por `educatorId`, cifrado, ver `src/storage/mmkv.ts`, G-41); mocks: `src/mocks/handlers/student.ts` e `educator-update.ts` (imitam o formato real).
- **Testes automatizados que cobrem:** `educator-update.test.ts` — `it("discards the prefixed response including _password and reads /me")`; `student-update.integration.test.ts`; `src/api/__tests__/backend-contract.test.ts`. Rodar: `pnpm exec vitest run src/api/endpoints/__tests__/educator-update.test.ts src/api/__tests__/backend-contract.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Campo aparece no app → alguma função de API deixou de remover `educators`; procurar `educators` em `src/api/endpoints/` e em `src/api/types.ts`.
  2. Aparece no log do Metro → algum `console.log` de resposta; procure `console.` em `src/`.
  3. Backend deixou de devolver → ótimo; registre "não presente" e informe o time (PEDIDOS-BACKEND, item 18).
- **Evidência:** tabela "rota → campo presente (sim/não)"; nenhum valor.

#### BE-07 — Tempo da IA (`POST /plan/generate` e sugestões)

- **Prioridade / AC:** P1 · G-46
- **Objetivo:** medir as três gerações e o pedido de sugestões contra o limite de **90 s** do app.
- **Pré-condição:** rede estável.
- **Passos:** cronometrar PDI 3 meses, PDI 6 meses, PE e um pedido de sugestões (roteiro e tabela em [04-planos.md](04-planos.md#tempos-da-ia)).
- **Resultado esperado:**
  - **Tela:** cada resposta chega em até **90 s**; acima disso, "A geração demorou mais que o esperado. Tente de novo." (geração) e **sem reenvio automático**.
  - **Rede (backend real):** `POST /plan/generate → 200` e `POST /plan/:id/suggestions/generate → 201` ou `200 []`; falhas: `500 AI_GENERATION_FAILED`/`AI_INVALID_OUTPUT`. O backend faz até 2 tentativas ao provedor.
  - **Código que depende:** `AI_TIMEOUT_MS` (`src/api/endpoints/ai-timeout.ts`) aplicado em `generatePlanDraft` e `generatePlanSuggestions`; mensagens em `GeneratePlanScreen.tsx` e `PlanDetailScreen.tsx`.
- **Onde está no código:** ver [04-planos.md](04-planos.md).
- **Testes automatizados que cobrem:** `src/api/__tests__/ai-timeout.test.ts`; `plans-suggestions.test.ts` — `it("usa o timeout da IA na geração")`.
- **Se falhar:** passa de 90 s → anote e proponha novo limite (decisão de gate, G-46); `AI_*` repetido → problema do provedor; confirme no Swagger.
- **Evidência:** a tabela de tempos preenchida.

#### BE-08 — Partida a frio

- **Prioridade / AC:** P2
- **Objetivo:** a primeira chamada depois de ociosidade pode demorar, mas termina sem erro.
- **Pré-condição:** backend ocioso por alguns minutos.
- **Passos:** abrir o app depois de um tempo parado e entrar.
- **Resultado esperado:** o primeiro carregamento demora (alguns segundos a dezenas), mas termina sem erro; se falhar, **"Tentar de novo"** resolve. **Rede:** primeira chamada lenta (`POST /educator/sign-in` ou `GET /educator/me`), as seguintes rápidas. Anote o tempo da primeira resposta.
- **Código que depende:** timeout padrão de **10 s** (`API_TIMEOUT_MS` em `src/api/client.ts`) — uma partida a frio acima de 10 s vira erro de timeout; leituras repetem até 2 vezes em rede/`5xx` (`src/api/query-client.ts` › `shouldRetryRead`); o login mostra "erro de rede" em timeout (`useSignIn.ts`).
- **Onde está no código:** `src/api/client.ts`, `src/api/query-client.ts`, `src/features/auth/useSignIn.ts`.
- **Testes automatizados que cobrem:** `src/api/__tests__/query-client.test.ts`; `client.test.ts` — `it("uses the runtime API URL, an explicit timeout, and injects a token")`.
- **Se falhar:** erro de rede no primeiro login → timeout de 10 s estourou na partida a frio: tente de novo; se for recorrente, considerar elevar o timeout do login (nova decisão).
- **Evidência:** tempo da primeira resposta.

## Resultados

| Caso   | Resultado | Observações |
| ------ | --------- | ----------- |
| F1.1   |           |             |
| F1.2   |           |             |
| F1.3   |           |             |
| F1.4   |           |             |
| F2.1   |           |             |
| F2.2   |           |             |
| F3.1   |           |             |
| F3.2   |           |             |
| F3.3   |           |             |
| F3.4   |           |             |
| F3.5   |           |             |
| F4     |           |             |
| F5.1   |           |             |
| F5.2   |           |             |
| F5.3   |           |             |
| BE-01  |           |             |
| BE-02  |           |             |
| BE-03  |           |             |
| BE-04  |           |             |
| BE-04b |           |             |
| BE-05  |           |             |
| BE-05b |           |             |
| BE-06  |           |             |
| BE-07  |           |             |
| BE-08  |           |             |
