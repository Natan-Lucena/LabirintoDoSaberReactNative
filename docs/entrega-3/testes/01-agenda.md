# Testes detalhados — Agenda (AGE-01 a AGE-04)

Detalhamento dos casos de [PLANO-TESTES §2.1](../PLANO-TESTES.md#21-agenda-age-01-a-age-04) para a rodada
manual da QA-06: o que fazer, o que esperar na tela e na rede, e, se falhar, onde olhar no código. Os IDs e os
casos do plano foram preservados; acrescentei só os casos com sufixo `+` (IDs novos). Nada foi executado: o
texto de tela foi conferido no código em 2026-10-29 (`rg` pelo texto exato).

**Tarefas cobertas:** AGE-01 (tela Agenda), AGE-02 (lembrete pelo WhatsApp, G-53), AGE-03 (novo, detalhe, editar,
remarcar, cancelar, excluir), AGE-04 (iniciar sessão pelo atendimento) e o trecho de SES-05 que guarda o
`appointmentId`. Fichas: [BACKLOG AGE-01](../BACKLOG.md#age-01--tela-agenda),
[AGE-02](../BACKLOG.md#age-02--lembrete-pelo-whatsapp-com-mensagem-pronta),
[AGE-03](../BACKLOG.md#age-03--novo-detalhe-editar-remarcar-cancelar-e-excluir-atendimento),
[AGE-04](../BACKLOG.md#age-04--iniciar-sessão-a-partir-do-atendimento). Contrato do backend:
[BACKEND-ENTREGUE §6 "Atendimento"](../BACKEND-ENTREGUE.md) e D5/D6 da §9.

## 1. Mapa da área

| Rota (`app/...`)                          | Tela / componente                                                                                 | Hook e chave de consulta                                                    | Função de API (`src/api/endpoints/appointment.ts`)         | Mock (`src/mocks/handlers/appointment.ts`) |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `app/(tabs)/agenda.tsx`                   | `src/features/agenda/AgendaScreen.tsx` › `AgendaScreen`                                           | `useAppointments` (`["appointment"]`) e `useStudents` (`["student"]`)       | `listAppointments` (`GET /appointment/`)                   | `GET /appointment/`                        |
| `app/agenda/new.tsx`                      | `src/features/agenda/form/AppointmentFormScreen.tsx` › `AppointmentFormScreen`                    | `useCreateAppointmentMutation` (`src/features/appointments/mutations.ts`)   | `createAppointment` (`POST /appointment/`)                 | `POST /appointment/`                       |
| `app/agenda/[id].tsx`                     | `src/features/agenda/detail/AppointmentDetailScreen.tsx` › `AppointmentDetailScreen`              | `useAppointment` (`["appointment","detail",id]`), `useUpdate…`/`useDelete…` | `getAppointment`, `updateAppointment`, `deleteAppointment` | `GET/PUT/DELETE /appointment/:id`          |
| `app/agenda/[id]/edit.tsx`                | o mesmo `AppointmentFormScreen`, com `mode` = `edit`, `reschedule`, `reactivate` ou `observation` | `useAppointment` + `useUpdateAppointmentMutation`                           | `updateAppointment`                                        | `PUT /appointment/:id`                     |
| `app/session/student.tsx` e `content.tsx` | `src/features/sessions/StudentStep.tsx`, `ContentStep.tsx`                                        | store `src/stores/session-flow.ts` (`appointmentId`, `setAppointmentId`)    | `startSession` (`src/api/endpoints/session.ts`)            | `src/mocks/handlers/session-analysis.ts`   |
| `app/session/finish.tsx`                  | `src/features/sessions/finish/FinishSessionScreen.tsx`                                            | invalida `appointmentQueryKeys.all` em `complete()`                         | `finishSession`, `addSessionObservation`                   | `POST /task-notebook-session/finish`       |
| `app/(tabs)/index.tsx` (Início)           | `src/features/home/HomeScreen.tsx` › `HomeScreen`                                                 | `useHomeQuery` (`homeQueryKeys`)                                            | `listAppointments`, `listStudents`, `getMe`                | `GET /appointment/`, `GET /student/`       |

Utilitários: `src/utils/date.ts` (`TIME_ZONE`, `dayKey`, `formatTime`, `formatLongDate`, `toBrasiliaISOString`),
`src/features/agenda/form/datetime.ts` (`dateFromKey`, `combineDateAndTime`), `src/features/agenda/selectors.ts`
(`selectCurrentAppointment`), `src/features/appointments/selectors.ts` (`selectAppointmentsForDay`,
`selectDaySummary`, `selectAppointmentDayKeys`), `src/features/agenda/errors.ts`
(`appointmentErrorMessage`, `conflictingAppointmentId`, `isAppointmentNotFound`, `CONFLICT_MESSAGE`) e
`src/utils/whatsapp.ts` (`pickContactPhone`, `buildWhatsAppUrl`, `appointmentReminderMessage`,
`patientContactMessage`).

**Design system usado** (`src/components/ds`): `AppHeader`, `DsButton`, `IconButton`, `SectionTitle`,
`StaticPressable`, `Badge`, `Field`, `FieldGrid`, `SelectField`, `DateField`, `TimeField`, `FilterRow`, `Toast` e
`useToast`, `Timeline` (Início). Fora do DS: `src/components/PendingBanner` (aviso offline) e `FigmaIcon`.

**Regras do app que valem para a área toda**

- **Fuso:** tudo em `America/Sao_Paulo` (G-13). A faixa da semana usa a data civil (`AAAA-MM-DD`); o horário usa
  `formatTime`. O corpo enviado leva `scheduledAt` em **ISO UTC com `Z`** (`createAppointment` e `updateAppointment`
  normalizam com `new Date(...).toISOString()`); o backend recusa offset (`-03:00`) com `400` (BACKEND-ENTREGUE §8).
  Como São Paulo está em UTC−3, 14:00 locais viram `17:00:00.000Z`.
- **Erro `409`:** o cliente HTTP central (`src/api/client.ts`) normaliza só `message`. Por isso `appointment.ts`
  aceita o `409` por `validateStatus` e lança `AppointmentApiError` com `conflictingAppointmentId` lido do corpo
  (`throwOnConflict`). Os códigos que a tela entende: `APPOINTMENT_CONFLICT`, `APPOINTMENT_NOT_EDITABLE`,
  `INVALID_STATUS_TRANSITION` (`src/features/agenda/errors.ts`).
- **Sem reenvio automático** nas mutações; offline, `withOfflineGuard` recusa antes de chamar a API
  (`OfflineError`, mensagem "Sem conexão", que a tela de atendimento troca por "Não foi possível concluir a ação.
  Tente novamente.").
- **Invalidação:** toda mutação de atendimento invalida `["appointment"]` (prefixo; atinge Agenda, Início e o
  detalhe). `400 NOT_FOUND` dispara `refetchQueries` (`refetchOnNotFound` em `mutations.ts`).

## 2. Cenários de mock úteis (sem backend)

Com `EXPO_PUBLIC_USE_MOCKS=true` (login `educadora.mock@labirinto.test` / `senha123`; veja
[`src/mocks/README.md`](../../../src/mocks/README.md)):

- Fixtures de hoje (`src/mocks/fixtures.ts` › `MOCK_APPOINTMENTS`): `appointment-1` 08:00 `PENDING` (Lia Monteiro),
  `appointment-2` 10:00 `COMPLETED`, `appointment-3` 14:00 `PENDING`, `appointment-4` 16:00 `CANCELLED`. Todos os
  pacientes mock têm `phonenumber` e **nenhum** tem responsável.
- **Conflito:** crie dois atendimentos sobrepostos no mesmo horário → `409 APPOINTMENT_CONFLICT` com
  `conflictingAppointmentId`; horários encostados não conflitam.
- **Transição inválida / não editável:** só por teste automatizado (a tela não oferece o caminho); veja o BE-04b.
- **Atendimento inexistente:** abrir `/agenda/<id inexistente>` devolve `400 NOT_FOUND`.
- **Agenda vazia:** `setMockHomeScenario("no-appointments")` de `src/mocks/fixtures.ts` (afeta Início e Agenda).
- **Sessão de atendimento:** `POST /task-notebook-session/start` com `appointmentId` inexistente ou de outro
  paciente devolve `404 APPOINTMENT_NOT_FOUND`; o `finish` muda o atendimento `PENDING` para `COMPLETED` no mock.

## 3. Como diagnosticar uma falha da área (roteiro curto)

1. **Erro do app ou do backend?** Confira o método, o caminho e o status da chamada (rede do Metro/Expo). Status
   `2xx` com tela errada = app (seletor, fuso, cache). `409`/`400`/`500` com mensagem do backend = contrato
   (BACKEND-ENTREGUE §6 e §9; PROJECT.md Parte II "Appointment").
2. **Reproduza no mock** com o cenário correspondente (§2). Se o mock reproduz, o defeito é do app; se só o
   backend real falha, é divergência de contrato (registre em PERGUNTAS/PEDIDOS-BACKEND).
3. **Rode o teste automatizado** do caso (campo "Testes" de cada caso) para ver se a regra continua coberta.
4. **Cache:** dado velho na tela após mutação = invalidação (`["appointment"]`); puxe a tela de novo ou feche e
   abra o app para separar problema de cache de problema de dado.

---

## 4. AGE-01 — Tela Agenda

#### AGE-01.1 — Faixa da semana, setas e título

- **Prioridade / AC:** P1 · Fumaça (AGE-01) · AC-AGE-01-01
- **Objetivo:** a Agenda abre com a semana atual, hoje ativo, e as setas trocam a semana. É a porta de entrada de
  todos os casos da área.
- **Pré-condição:** logado; Pacientes A, B e C criados (PLANO-TESTES §1.2); backend real, mocks desligados.
- **Passos:**
  1. Tocar na aba **Agenda** da barra inferior.
  2. Olhar o topo: eyebrow, título, intervalo da semana e os sete chips.
  3. Tocar em **"Semana anterior"** e depois em **"Próxima semana"** (botões de ícone com esses rótulos de
     acessibilidade).
  4. Voltar para a semana de hoje.
- **Resultado esperado:**
  - **Tela:** eyebrow com mês e ano por extenso em português (ex.: "outubro de 2026"); título **"Agenda"**; linha com
    o intervalo da semana no formato "26 de outubro – 1 de novembro"; sete chips `seg ter qua qui sex sáb dom`
    (segunda a domingo) com o dia do mês; o chip de hoje vem ativo (rótulo de acessibilidade "Hoje, 29 de outubro");
    um ponto no chip dos dias que têm atendimento; botão de largura total **"Novo atendimento"** no fim; sem tela
    em branco. Cada seta soma ou subtrai 7 dias e mantém o mesmo dia da semana selecionado.
  - **Rede (backend real):** ao abrir, `GET /appointment/` e `GET /student/` (status `200`). Trocar a semana **não**
    faz nova chamada (o filtro por dia é no cliente).
  - **Depois:** nada muda em outras telas.
- **Onde está no código:** rota `app/(tabs)/agenda.tsx`; `src/features/agenda/AgendaScreen.tsx` › `AgendaScreen`
  (`weekStart`, `shiftKey`, `keyDate`, formatadores `monthFormatter` e `dateFormatter` em `timeZone: "UTC"` sobre
  a chave `AAAA-MM-DD` ao meio-dia UTC); hooks `useAppointments` (`["appointment"]`) e `useStudents` (`["student"]`);
  DS `IconButton`, `StaticPressable`, `SectionTitle`, `DsButton`; utilitário `dayKey` em `src/utils/date.ts`.
- **Testes automatizados que cobrem:** `src/features/agenda/__tests__/AgendaScreen.test.tsx` › "mostra semana
  atual, hoje ativo, muda dia e navega semanas (AC-AGE-01-01/02)". Rodar:
  `pnpm exec vitest run src/features/agenda/__tests__/AgendaScreen.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. _Semana começa no domingo ou "hoje" errado perto da meia-noite_ → `weekStart` (usa `getUTCDay` da chave) ou
     `dayKey` no fuso; reproduzir com data do aparelho em outro fuso (`src/utils/__tests__/date.test.ts` cobre o
     fuso fixo). Causa provável: `new Date()` local no lugar de `dayKey`.
  2. _Tela de erro "Não foi possível carregar a agenda."_ → a tela exige **as duas** consultas (`appointmentsQuery`
     e `studentsQuery`); veja qual chamada falhou na rede. `GET /student/` com `5xx` derruba a Agenda inteira.
  3. _Carregando sem fim_ → partida a frio da Vercel (BE-08) ou token inválido (`401` leva ao Login pelo
     interceptor, `src/api/client.ts`).
  4. _Chip sem ponto apesar de ter atendimento_ → `selectAppointmentDayKeys` (mês visível); compare com a lista.
     Diferenciar app de backend: o mesmo atendimento aparece em `GET /appointment/` com o `scheduledAt` do dia.
- **Evidência:** captura da Agenda com a semana e o chip de hoje; anotar a data do aparelho e o AVD.

#### AGE-01.2 — Trocar o dia e a contagem

- **Prioridade / AC:** P1 · Fumaça (AGE-01) · AC-AGE-01-02, AC-AGE-01-05
- **Objetivo:** escolher outro dia refaz a lista e a contagem; dia vazio mostra o estado vazio.
- **Pré-condição:** AGE-01.1; ao menos um atendimento hoje e um dia sem atendimento na semana.
- **Passos:**
  1. Tocar em outro chip da faixa (dia vazio).
  2. Tocar no chip de hoje.
- **Resultado esperado:**
  - **Tela:** o `SectionTitle` mostra **"N atendimentos"** (singular "1 atendimento"); a contagem **exclui os
    cancelados** (`selectDaySummary`); dia sem itens mostra **"Nenhum atendimento neste dia"**; o chip tocado fica
    ativo e a lista vem em ordem de horário; o eyebrow acompanha o mês do dia escolhido.
  - **Rede (backend real):** nenhuma chamada nova.
  - **Depois:** nada.
- **Onde está no código:** `AgendaScreen` (`selectedDay`, `selectAppointmentsForDay`, `selectDaySummary` em
  `src/features/appointments/selectors.ts`); DS `SectionTitle`.
- **Testes automatizados que cobrem:** `AgendaScreen.test.tsx` › "mostra semana atual, hoje ativo, muda dia e
  navega semanas (AC-AGE-01-01/02)" e "mostra dia vazio e banner offline com dados salvos (AC-AGE-01-05)";
  `src/features/appointments/__tests__/selectors.test.ts`. Rodar os dois arquivos com `--maxWorkers=1`.
- **Se falhar:**
  1. _Contagem inclui cancelado_ → `selectDaySummary` (filtro `status !== "CANCELLED"`); decisão do TRACKING
     (2026-10-28, AGE-01).
  2. _Atendimento no dia errado (perto da meia-noite)_ → `dayKey(new Date(scheduledAt))`; confira o `scheduledAt`
     UTC da resposta: 02:00Z é 23:00 do dia anterior em SP.
  3. _Lista fora de ordem_ → `selectAppointmentsForDay` ordena por `getTime()`.
- **Evidência:** captura de um dia com itens e de um dia vazio.

#### AGE-01.3 — Status, tipo, duração e item atual

- **Prioridade / AC:** P2 · Fumaça (AGE-01) · AC-AGE-01-03, AC-AGE-03 item 6
- **Objetivo:** cada item mostra hora, paciente, "duração · tipo", e o estado (Concluído, Cancelado); o destaque
  "atual" só existe hoje.
- **Pré-condição:** hoje com um atendimento `PENDING`, um `COMPLETED` e um `CANCELLED` (use o AGE-03.7 e o F1 para
  criar os estados).
- **Passos:**
  1. Abrir o dia de hoje.
  2. Comparar os três itens; abrir outro dia com um `PENDING` e observar o destaque.
- **Resultado esperado:**
  - **Tela:** item `PENDING`: hora (ex.: "14:00"), nome e linha "50 min" ou "50 min · Psicopedagogia" (duração
    sempre presente; tipo só se existir); o **primeiro `PENDING` do dia de hoje** tem borda e fundo de destaque e a
    linha lateral mais forte; `COMPLETED`: ícone de check e texto **"Concluído"**; `CANCELLED`: texto
    **"Cancelado"** e o cartão com `opacity` reduzida (0,48) e fora da contagem. Em outro dia **não** há destaque.
    Paciente que não está em `GET /student/` aparece como "Paciente não encontrado".
  - **Rede (backend real):** nenhuma chamada nova.
  - **Depois:** —
- **Onde está no código:** `AgendaScreen` (montagem de `details`, estilos `current`, `cancelled`);
  `src/features/agenda/selectors.ts` › `selectCurrentAppointment`; `src/features/appointments/selectors.ts`.
- **Testes automatizados que cobrem:** `src/features/agenda/__tests__/selectors.test.ts` › "escolhe o primeiro
  pendente de hoje em São Paulo, mesmo com lista desordenada" e "não destaca item de outro dia";
  `AgendaScreen.test.tsx` › "mostra status e abre detalhe e criação com dia selecionado (AC-AGE-01-04)" e "mostra
  duração e tipo de cada atendimento (AGE-03)".
- **Se falhar:**
  1. _Dois itens destacados ou nenhum_ → `selectCurrentAppointment` (compara `selectedDay` com `dayKey(now)`).
  2. _Tipo ausente apesar de preenchido_ → o `POST/PUT` não enviou `type` (veja o corpo) ou o backend não
     devolveu; `AppointmentFormScreen.submit` só envia `type` quando preenchido.
  3. _"min" errado_ → `durationMinutes` vem do backend (padrão 50; registros antigos 50).
- **Evidência:** captura do dia com os três estados.
- **Divergência encontrada:** o Início (`HomeScreen`) escolhe o "próximo atendimento" com `selectNextAppointment`
  (primeiro item que não é `COMPLETED` nem `CANCELLED`, de hoje), regra irmã mas separada do destaque da Agenda.

#### AGE-01.4 — Offline com dados salvos

- **Prioridade / AC:** P3 · Fumaça (AGE-01) · AC-AGE-01-05
- **Objetivo:** sem rede, a Agenda mostra o cache persistido com aviso.
- **Pré-condição:** Agenda já carregada alguma vez (cache em `expo-sqlite/kv-store`, cifrado).
- **Passos:** ligar o modo avião no emulador; reabrir a aba Agenda (ou fechar e abrir o app); depois desligar o
  modo avião.
- **Resultado esperado:**
  - **Tela:** banner **"Sem conexão - mostrando dados salvos"** (`PendingBanner`) e a lista do cache; sem erro; ao
    voltar a rede o aviso some.
  - **Rede (backend real):** com o avião, nenhuma resposta; ao voltar, refetch `GET /appointment/` e `GET /student/`.
  - **Depois:** —
- **Onde está no código:** `AgendaScreen` (`useOnline` em `src/hooks/useOnline.ts`); persistência em
  `src/api/query-persister.ts` e `src/api/QueryProvider.tsx`; cache por educador em `src/storage/mmkv.ts`.
- **Testes automatizados que cobrem:** `AgendaScreen.test.tsx` › "mostra dia vazio e banner offline com dados
  salvos (AC-AGE-01-05)"; `src/api/__tests__/query-persister.test.ts`.
- **Se falhar:**
  1. _Tela de erro em vez do cache_ → o cache não foi persistido (primeira abertura sem rede) ou foi limpo por
     logout/troca de educador (`activateEducator` em `mmkv.ts`); abra a Agenda com rede antes.
  2. _Banner permanece com rede_ → `useOnline` não percebeu a volta; reabra o app.
- **Evidência:** captura com o banner.

## 5. AGE-02 — Lembrete pelo WhatsApp (G-53: manual, sem envio automático)

**Contrato do link** (`src/utils/whatsapp.ts`): `buildWhatsAppUrl(phone, message)` devolve
`https://wa.me/<dígitos>?text=<mensagem com encodeURIComponent>`; telefone = `pickContactPhone(student)`
(`guardianPhone` quando tem dígitos, senão `phonenumber`); só dígitos; prefixo `55` somado quando o número **não
começa com `55`** e tem **10 ou 11 dígitos**. **Nada é enviado nem registrado no backend:** quem toca em "enviar"
no WhatsApp é a pessoa. A única chamada de rede relevante é a abertura do `Linking` (sem tráfego para a API).

#### AGE-02.1 — Lembrete pelo detalhe do atendimento

- **Prioridade / AC:** P1 · AGE-02 (MAN) · AC-AGE-02-02, AC-AGE-02-03
- **Objetivo:** o botão abre o WhatsApp com a mensagem pronta, no dia e hora certos, para o responsável.
- **Pré-condição:** atendimento **`PENDING`** do Paciente A (com responsável: nome, parentesco e telefone só com
  dígitos); emulador com WhatsApp ou navegador.
- **Passos:**
  1. Agenda → tocar no atendimento.
  2. Tocar em **"Enviar lembrete pelo WhatsApp"**.
  3. Conferir o número e o texto na tela do WhatsApp (ou da página `wa.me`).
- **Resultado esperado:**
  - **Tela:** abre `https://wa.me/55<DDD+número do responsável>?text=…` com **"Olá, {responsável}! Passando para
    lembrar do atendimento de {paciente} na {dia da semana}, {dd/mm}, às {hh:mm}. Qualquer imprevisto, é só
    avisar por aqui."** — ex.: "na segunda-feira, 03/11, às 14:00"; **"no sábado"/"no domingo"** nesses dias.
    Dia, data e hora no fuso de São Paulo. O botão fica habilitado só se houver telefone.
  - **Rede (backend real):** nenhuma chamada à API (só o `Linking.openURL`).
  - **Depois:** nada muda; o atendimento continua `PENDING`.
- **Onde está no código:** `AppointmentDetailScreen` (`reminderUrl`, botão "Enviar lembrete pelo WhatsApp");
  `src/utils/whatsapp.ts` › `appointmentReminderMessage`, `buildWhatsAppUrl`, `pickContactPhone`;
  `src/utils/date.ts` › `formatTime`; `Linking` de `react-native`; DS `DsButton`.
- **Testes automatizados que cobrem:** `src/utils/__tests__/whatsapp.test.ts` › "AC-AGE-02-01 prioriza responsável
  e normaliza telefone com máscara ou DDI", "AC-AGE-02-02 formata lembrete no fuso de São Paulo", "AC-AGE-02-02 usa
  'no' para sábado e domingo e 'na' para dias úteis"; `AppointmentDetailScreen.test.tsx` › "AC-AGE-02-03 abre
  lembrete do atendimento no WhatsApp". Rodar com `--maxWorkers=1`.
- **Se falhar:**
  1. _Hora errada (±3 h)_ → `appointmentReminderMessage` usa `formatTime` no fuso fixo; compare com o
     `scheduledAt` UTC. Se a hora do detalhe estiver certa e a da mensagem errada, o erro é na mensagem.
  2. _Número sem `55`_ → ver a divergência abaixo (DDD 55) ou telefone com 12+ dígitos já "com DDI" estranho.
  3. _Mensagem sem nome do responsável ("Olá!")_ → `student.guardianName` vazio; confira `GET /student/` (D8: campos
     podem faltar) e a edição do paciente (PAC-07).
  4. _WhatsApp não abre e nada aparece_ → `Linking.openURL` rejeitou; esperado o toast do AGE-02.5.
- **Evidência:** captura da tela do WhatsApp/navegador com o número **mascarado** (cobrir os dígitos) e a mensagem.
- **Divergência encontrada:** `buildWhatsAppUrl` só soma `55` quando o número **não começa com `55`**; um telefone
  de 10 ou 11 dígitos com **DDD 55** (região de Santa Maria, RS) **não recebe o prefixo** e vira `wa.me/55…` com o
  DDD no lugar do código do país. A ficha AGE-02 não prevê o caso; registre se o dado de teste usar DDD 55.

#### AGE-02.2 — Lembrete pela Início

- **Prioridade / AC:** P1 · AGE-02 (MAN) · AC-AGE-02-03
- **Objetivo:** o mesmo link a partir da linha do tempo da Início.
- **Pré-condição:** AGE-02.1; o atendimento é de **hoje** e `PENDING`.
- **Passos:** aba **Início** → seção **"Agenda de hoje"** → no item pendente do Paciente A, tocar em **"Lembrete"**.
- **Resultado esperado:**
  - **Tela:** abre o `wa.me` com a **mesma** mensagem e o telefone do responsável. A ação "Lembrete" (texto, não
    ícone: decisão do TRACKING 2026-10-29 para não alterar o DS) aparece **só** em item `PENDING` **com telefone**;
    item concluído, cancelado ou sem telefone **não** mostra a ação.
  - **Rede (backend real):** nenhuma chamada à API.
  - **Depois:** —
- **Onde está no código:** `src/features/home/HomeScreen.tsx` › `HomeScreen` (`timelineItems`, `reminderUrl`,
  `actionLabel: "Lembrete"`); DS `Timeline`; mesmas funções de `src/utils/whatsapp.ts`.
- **Testes automatizados que cobrem:** `src/features/home/__tests__/HomeScreen.test.tsx` › "AC-AGE-02-03 mostra
  Lembrete só em item pendente com telefone" e "AC-AGE-02-04 omite a ação de lembrete sem telefone".
- **Se falhar:**
  1. _Sem "Lembrete" num pendente com telefone_ → o paciente não veio em `GET /student/` (`student` nulo) ou o
     item não é de hoje (`selectTodayAppointments`).
  2. _Mensagem diferente da do detalhe_ → ambas chamam `appointmentReminderMessage`; compare os parâmetros.
- **Evidência:** captura da linha do tempo e da tela do `wa.me`.

#### AGE-02.3 — Contato pela ficha do paciente

- **Prioridade / AC:** P1 · AGE-02 (MAN) · AC-AGE-02-03
- **Objetivo:** o ícone de contato da ficha abre o WhatsApp com a mensagem de apresentação do educador.
- **Pré-condição:** ficha do Paciente A (com responsável).
- **Passos:** Pacientes → Paciente A → tocar no ícone **"Contatar responsável"** (botão de ícone `message` no topo
  do resumo, sem texto visível).
- **Resultado esperado:**
  - **Tela:** abre `wa.me` com **"Olá, {responsável}! Tudo bem? Aqui é {educador}, do acompanhamento de
    {paciente}."**; sem nome do educador (`/educator/me` sem nome): "Olá, {responsável}! Tudo bem? Falo sobre o
    acompanhamento de {paciente}."; sem responsável cadastrado: começa com "Olá!".
  - **Rede (backend real):** nenhuma chamada à API para abrir; o nome do educador vem de `GET /educator/me`
    (já carregado pela ficha).
  - **Depois:** —
- **Onde está no código:** `src/features/patients/detail/PatientDetailScreen.tsx` › `PatientDetailScreen`
  (`contactUrl`, `openContact`, `IconButton` com `accessibilityLabel="Contatar responsável"`); hook `useHomeData`
  (educador); `patientContactMessage` em `src/utils/whatsapp.ts`.
- **Testes automatizados que cobrem:** `src/features/patients/detail/__tests__/PatientDetailScreen.test.tsx` ›
  "mostra o responsável e usa seu telefone para contato"; `src/utils/__tests__/whatsapp.test.ts` › "AC-AGE-02-02
  omite apresentação quando educador não tem nome".
- **Se falhar:**
  1. _Abre com o telefone do paciente em vez do responsável_ → `pickContactPhone` (só usa o do responsável se tem
     dígitos); confira `guardianPhone` em `GET /student/` (PAC-07.2).
  2. _"Falo sobre…" apesar do educador ter nome_ → `useHomeData().educator` ainda não carregou.
- **Evidência:** captura da mensagem (telefone mascarado).
- **Divergência encontrada:** o plano e a ficha falam em "botão"; no código é um **ícone sem texto** (só o rótulo
  de acessibilidade "Contatar responsável"); o texto "Paciente sem telefone cadastrado" aparece ao lado quando
  não há telefone.

#### AGE-02.4 — Telefone alternativo e botão desabilitado

- **Prioridade / AC:** P2 · AC-AGE-02-01, AC-AGE-02-04
- **Objetivo:** sem responsável, usa o telefone do paciente; sem nenhum telefone, o botão fica desabilitado com a
  dica.
- **Pré-condição:** atendimento `PENDING` dos Pacientes B (sem responsável, com telefone) e C (sem telefone).
- **Passos:** abrir o atendimento de B e tocar em "Enviar lembrete pelo WhatsApp"; abrir o de C.
- **Resultado esperado:**
  - **Tela:** B: `wa.me/55<telefone do paciente>`, mensagem começando com "Olá! Passando para lembrar…" (sem nome);
    C: botão **desabilitado** e o texto **"Paciente sem telefone cadastrado"** abaixo.
  - **Rede (backend real):** nenhuma chamada à API.
  - **Depois:** —
- **Onde está no código:** `AppointmentDetailScreen` (`disabled={!reminderUrl}` e o `Text` da dica);
  `pickContactPhone`, `buildWhatsAppUrl`.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "AC-AGE-02-04 desabilita lembrete sem
  telefone"; `whatsapp.test.ts` (normalização).
- **Se falhar:**
  1. _Botão habilitado sem telefone_ → `buildWhatsAppUrl` devolve `null` só sem dígitos; confira o `phonenumber`
     (pode vir em branco, não `null`).
  2. _Paciente C não existe_ → **o formulário "Novo paciente" exige telefone de 7 a 15 dígitos**
     (`PatientFormScreen`, schema `phonenumber`); não dá para criar o Paciente C pelo app. Use um paciente
     antigo sem telefone (D8 admite registros sem o campo) ou valide só por teste automatizado.
- **Evidência:** captura dos dois detalhes.
- **Divergência encontrada:** o PLANO-TESTES §1.2 manda criar o Paciente C "sem nenhum telefone" pelo cadastro,
  mas o formulário recusa. Registre "N/A (sem dado)" se não houver paciente antigo.

#### AGE-02.5 — WhatsApp indisponível

- **Prioridade / AC:** P3 · AGE-02 (MAN)
- **Objetivo:** sem o app do WhatsApp, o link abre no navegador; se o `Linking` falhar, há aviso.
- **Pré-condição:** emulador sem WhatsApp instalado.
- **Passos:** repetir o AGE-02.1.
- **Resultado esperado:**
  - **Tela:** o navegador abre a página do `wa.me` (comportamento do próprio link). Se `Linking.openURL` rejeitar:
    toast **"Não foi possível abrir o WhatsApp"** e a tela continua usável.
  - **Rede (backend real):** nenhuma à API.
  - **Depois:** —
- **Onde está no código:** `AppointmentDetailScreen` (`.catch(() => toast.show(...))`), `HomeScreen` e
  `PatientDetailScreen` (mesmo padrão); DS `Toast`/`useToast`.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "avisa quando o WhatsApp não pode ser
  aberto".
- **Se falhar:**
  1. _Nada acontece e não há toast_ → o `Linking` resolveu sem abrir (emulador sem navegador padrão); não é falha
     do app. Registre o comportamento.
  2. _Queda do app_ → `Linking` sem `catch`; confira as três telas (detalhe, Início, ficha).
- **Evidência:** captura do navegador ou do toast.

## 6. AGE-03 — Novo, detalhe, editar, remarcar, cancelar e excluir

**Regras do backend que a tela segue** (BACKEND-ENTREGUE §6): transições `PENDING → COMPLETED | CANCELLED` e
`CANCELLED → PENDING` (`COMPLETED` é final); `CANCELLED`/`COMPLETED` não aceitam mudar horário, tipo ou duração
(`409 APPOINTMENT_NOT_EDITABLE`); reativar e remarcar podem ir juntos (`{ status: "PENDING", scheduledAt }`);
conflito com outro `PENDING` devolve `409 { message: "APPOINTMENT_CONFLICT", conflictingAppointmentId }`; horários
encostados não conflitam; `durationMinutes` 15–240 (padrão 50), `type` 1–50.

**Validação do formulário** (`schema` em `AppointmentFormScreen.tsx`, Zod + react-hook-form, `mode: "onChange"`):

| Campo               | Regra                              | Mensagem exata                              |
| ------------------- | ---------------------------------- | ------------------------------------------- |
| Paciente            | obrigatório                        | "Selecione o paciente"                      |
| Data                | obrigatória (mensagem não exibida) | "Selecione a data"                          |
| Horário             | obrigatório (mensagem não exibida) | "Selecione o horário"                       |
| Tipo de atendimento | até 50 caracteres (`maxLength` 50) | "O tipo deve ter até 50 caracteres"         |
| Duração (minutos)   | vazio ou 15 a 240 (só dígitos)     | "A duração deve ser entre 15 e 240 minutos" |

O botão de envio fica desabilitado enquanto o formulário é inválido, durante o envio e depois do toast
(`canSubmit`); por isso, "enviar vazio" é **bloqueado pelo botão**, sem mensagem de campo até tocar/alterar os
campos.

#### AGE-03.1 — Criar atendimento

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-01
- **Objetivo:** criar um atendimento e vê-lo na Agenda (e na Início, se for hoje).
- **Pré-condição:** Paciente A.
- **Passos:**
  1. Agenda → **"Novo atendimento"**.
  2. Em "Paciente" (`SelectField`, "Selecionar paciente") escolher o Paciente A; escolher **Data** e **Horário**.
  3. Em "Tipo de atendimento" tocar no atalho **"Psicopedagogia"** (também há "Avaliação"); deixar a duração
     vazia (padrão 50) ou preencher.
  4. Tocar em **"Agendar atendimento"**.
- **Resultado esperado:**
  - **Tela:** cabeçalho "Novo atendimento" (subtítulo "Agendamento"); toast **"Atendimento agendado"**; ~0,7 s
    depois volta para a tela anterior (Agenda); o item aparece no dia certo com "14:00" e "50 min · Psicopedagogia"
    (a duração aparece mesmo sem ter sido digitada); se for hoje, aparece também em "Agenda de hoje" na Início.
  - **Rede (backend real):** `POST /appointment/` com corpo `{ studentId, scheduledAt: "<ISO UTC com Z>", type:
"Psicopedagogia" }` — **`durationMinutes` e `observation` só vão se preenchidos**; resposta `201`/`200` no
    formato do `GET` (`id`, `educatorId`, `studentId`, `scheduledAt`, `observation`, `status: "PENDING"`,
    `notifiedAt`, `type`, `durationMinutes`, `createdAt`). Depois `GET /appointment/` refeito (invalidação).
  - **Depois:** Agenda e Início (`["appointment"]`) atualizam sem puxar a tela.
- **Onde está no código:** `app/agenda/new.tsx`; `AppointmentFormScreen.tsx` › `AppointmentForm` (`submit`,
  `typeSuggestions`, `copy.create`); `src/features/agenda/form/datetime.ts` › `combineDateAndTime`;
  `src/features/appointments/mutations.ts` › `createAppointmentMutationOptions`; `src/api/endpoints/appointment.ts`
  › `createAppointment`; DS `SelectField`, `DateField`, `TimeField`, `FieldGrid`, `Field`, `FilterRow`, `Toast`.
- **Testes automatizados que cobrem:** `src/features/agenda/form/__tests__/AppointmentFormScreen.test.tsx` ›
  "AC-AGE-03-01 envia só o obrigatório, com scheduledAt em ISO UTC" e "AC-AGE-03-01 envia tipo, duração e
  observação quando preenchidos"; `src/features/appointments/__tests__/mutations.test.ts` › "cria e invalida a
  Agenda e a Home pela chave compartilhada"; `src/api/endpoints/__tests__/appointment.test.ts` › "cria, lê,
  atualiza e exclui"; `src/mocks/__tests__/appointment-handlers.test.ts` › "aceita tipo e duração e responde no
  formato do GET".
- **Se falhar:**
  1. _`400` ao criar_ → `scheduledAt` com offset (o corpo deve terminar em `Z`; `createAppointment` normaliza) ou
     campo fora do contrato (`type` >50, `durationMinutes` fora de 15–240). Veja a mensagem de validação.
  2. _Item no horário errado (±3 h)_ → `combineDateAndTime`/`toBrasiliaISOString` (`src/utils/date.ts`); compare o
     `Z` enviado com o horário escolhido (14:00 SP = `17:00:00.000Z`).
  3. _Item criado mas não aparece_ → invalidação (`invalidateAppointments`) ou filtro por `dayKey`; o `GET`
     retorna o item? Se sim, é cache/filtro do app.
  4. _`401`/Login_ → token expirado (interceptor); não é do caso.
- **Evidência:** captura do formulário preenchido, do toast e do item na Agenda; método, caminho e status do `POST`.

#### AGE-03.2 — Pré-preenchimento por `date` e `studentId`

- **Prioridade / AC:** P2 · AC-AGE-03-06
- **Objetivo:** o dia selecionado na Agenda e o paciente da ficha chegam ao formulário.
- **Pré-condição:** outro dia (não hoje) selecionado na Agenda; ficha do Paciente A.
- **Passos:** Agenda → escolher outro dia → "Novo atendimento"; depois, voltar e abrir o formulário a partir de
  `/agenda/new?studentId=<id>` quando houver caminho pela ficha.
- **Resultado esperado:**
  - **Tela:** a data vem preenchida com o dia escolhido; com `studentId`, o paciente vem selecionado.
  - **Rede (backend real):** nenhuma chamada nova ao abrir (só `GET /student/` para as opções).
  - **Depois:** —
- **Onde está no código:** `AgendaScreen` (`params: { date: selectedDay }`); `app/agenda/new.tsx`
  (`useLocalSearchParams`); `AppointmentFormScreen` › `initialValues`; `dateFromKey`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` › "AC-AGE-03-06 pré-preenche paciente e
  data pelos parâmetros"; `AgendaScreen.test.tsx` › "mostra status e abre detalhe e criação com dia selecionado
  (AC-AGE-01-04)".
- **Se falhar:**
  1. _Data sempre em hoje_ → o parâmetro `date` não chegou (`router.push` com `params`) ou `dateFromKey` rejeitou o
     formato (exige `AAAA-MM-DD`).
  2. _Paciente não pré-selecionado_ → ver a divergência.
- **Evidência:** captura do formulário com a data.
- **Divergência encontrada:** a ficha do paciente **não tem botão para novo atendimento**
  (`PatientDetailScreen` não referencia `/agenda/new`); o parâmetro `studentId` só existe na rota. Teste-o digitando
  a rota (deep link do Expo Go) ou registre "N/A (sem caminho pela ficha)".

#### AGE-03.3 — Validações do formulário

- **Prioridade / AC:** P2 · AGE-03 (MAN) · AC-AGE-03-01
- **Objetivo:** as mensagens exatas e o bloqueio do envio.
- **Pré-condição:** formulário aberto.
- **Passos:** com tudo vazio, observar o botão; escolher só o paciente; digitar duração **10**, depois **300**;
  digitar 51 caracteres no tipo.
- **Resultado esperado:**
  - **Tela:** **"A duração deve ser entre 15 e 240 minutos"** sob o campo para 10 e 300; "O tipo deve ter até 50
    caracteres" (o `Field` tem `maxLength` 50, então o 51º caractere pode nem entrar, e a mensagem não aparece);
    "Selecione o paciente" sob o seletor de paciente. O botão fica **desabilitado** enquanto algo é inválido; nada é
    enviado.
  - **Rede (backend real):** nenhuma chamada.
  - **Depois:** —
- **Onde está no código:** `AppointmentFormScreen.tsx` › `schema` e `canSubmit`; DS `Field`, `SelectField`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` › "bloqueia o envio sem paciente, data e
  horário" e "valida a duração entre 15 e 240 minutos".
- **Se falhar:**
  1. _Botão habilitado com dado inválido_ → `isValid` do react-hook-form com `mode: "onChange"`; o campo "Duração"
     remove não dígitos (`replace(/\D/g, "")`).
  2. _Sem mensagem em Data e Horário_ → esperado: `DateField` não recebe `error` no formulário e `TimeField` só
     recebe o aviso de conflito, então "Selecione a data" e "Selecione o horário" existem no `schema` mas **não
     aparecem**; só o botão desabilitado indica a falta.
- **Evidência:** captura de um erro de duração.
- **Divergência encontrada:** o PLANO-TESTES lista "Selecione a data" e "Selecione o horário" como mensagens
  visíveis; no código elas não são renderizadas (`AppointmentFormScreen.tsx`, `DateField`/`TimeField` sem `error`).

#### AGE-03.4 — Detalhe e ações de um atendimento `PENDING`

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-04
- **Objetivo:** o detalhe mostra os dados e as ações do status.
- **Pré-condição:** atendimento pendente com tipo, duração e observação.
- **Passos:** Agenda → tocar no item; conferir; tocar no nome do paciente; voltar.
- **Resultado esperado:**
  - **Tela:** cabeçalho "Atendimento" (subtítulo "Agenda"); selo **"Pendente"**; o nome do paciente (toque abre
    `/patients/{id}`); linhas **Data** (por extenso, ex.: "segunda-feira, 03 de novembro de 2026"), **Horário**
    ("14:00"), **Tipo** ("Não informado" se vazio), **Duração** ("50 min") e **Observação** ("Sem observação" se
    vazia). Ações, nesta ordem: **"Iniciar sessão"**, **"Enviar lembrete pelo WhatsApp"**, **"Marcar como
    concluído"**, **"Remarcar"**, **"Editar"**, **"Cancelar atendimento"**, **"Excluir atendimento"**.
  - **Rede (backend real):** `GET /appointment/:id` (`200`); `GET /student/` para o nome.
  - **Depois:** —
- **Onde está no código:** `app/agenda/[id].tsx`; `AppointmentDetailScreen.tsx` (`statusLabel`, `Row`,
  `useAppointment`, `useStudents`); `src/features/agenda/detail/useAppointment.ts` (chave
  `["appointment","detail",id]`, sem retry em `NOT_FOUND`); DS `AppHeader`, `Badge`, `DsButton`, `StaticPressable`.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "mostra paciente, data, horário, tipo,
  duração, status e observação", "tocar no paciente abre a ficha dele", "AC-AGE-03-04 PENDING oferece remarcar,
  editar, concluir, cancelar e excluir".
- **Se falhar:**
  1. _Ação ausente_ → as ações dependem de `appointment.status`; confira o status devolvido pelo `GET`.
  2. _"Paciente não encontrado"_ → o `studentId` não está em `GET /student/` (paciente de outro educador).
  3. _Detalhe "congelado" depois de mudar em outra tela_ → invalidação do prefixo `["appointment"]`; a chave do
     detalhe herda o prefixo.
- **Evidência:** captura do detalhe completo (rolar até as ações).
- **Divergência encontrada:** o rótulo da última ação é **"Excluir atendimento"** (o PLANO e a ficha dizem
  "Excluir"); a confirmação usa o botão **"Excluir"**. "Marcar como concluído" não pede confirmação e não mostra
  toast; "Iniciar sessão" é a primeira ação (a ficha do AGE-04 a coloca no mesmo bloco).

#### AGE-03.5 — Remarcar

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-02
- **Objetivo:** mudar só o horário.
- **Pré-condição:** atendimento pendente; outro horário livre.
- **Passos:** detalhe → **"Remarcar"** → mudar a Data ou o Horário → **"Remarcar atendimento"**.
- **Resultado esperado:**
  - **Tela:** cabeçalho "Remarcar atendimento"; Paciente, Tipo, Duração e Observação ficam **desabilitados**
    (`detailsLocked` e `observationLocked`); toast **"Atendimento remarcado"**; volta ao detalhe; a Agenda mostra o
    novo horário (no novo dia, se mudou a data).
  - **Rede (backend real):** `PUT /appointment/:id` com corpo **só** `{ scheduledAt: "<ISO UTC com Z>" }`; `200` com o
    atendimento no formato do `GET`. Sem mudança, o botão apenas volta (sem `PUT`).
  - **Depois:** Agenda, Início e detalhe atualizam.
- **Onde está no código:** `AppointmentDetailScreen` (`openForm("reschedule")`); `app/agenda/[id]/edit.tsx`;
  `AppointmentFormScreen` › `resolveMode`, `submit` (só `scheduledAt` quando difere); `mutations.ts` ›
  `updateAppointmentMutationOptions`; `updateAppointment`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` › "AC-AGE-03-02 remarcar envia só o novo
  horário"; `mutations.test.ts` › "remarca enviando somente scheduledAt".
- **Se falhar:**
  1. _`409 APPOINTMENT_CONFLICT`_ → outro `PENDING` ocupa o intervalo (veja o BE-04); o aviso vai no campo
     Horário.
  2. _`400` por offset_ → corpo sem `Z`; `updateAppointment` normaliza `scheduledAt`.
  3. _Horário não muda na Agenda_ → cache; confira a resposta do `PUT`.
- **Evidência:** captura antes/depois; `PUT` com status.

#### AGE-03.6 — Editar tipo e duração

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-02
- **Objetivo:** editar enviando só os campos alterados; observação vazia vira `null`.
- **Pré-condição:** atendimento pendente.
- **Passos:** detalhe → **"Editar"** → mudar o Tipo e a Duração → **"Salvar alterações"**; repetir apagando a
  observação.
- **Resultado esperado:**
  - **Tela:** cabeçalho "Editar atendimento"; o paciente fica fixo (desabilitado); toast **"Atendimento
    atualizado"**; o detalhe e a Agenda refletem.
  - **Rede (backend real):** `PUT /appointment/:id` com **só** os campos que mudaram (ex.: `{ type, durationMinutes }`);
    apagar a observação envia `{ observation: null }`; nada alterado → volta sem `PUT`.
  - **Depois:** Agenda mostra "{duração} min · {tipo}".
- **Onde está no código:** `AppointmentFormScreen` › `submit` (compara com `appointment`), `copy.edit`;
  `updateAppointment`; `UpdateAppointmentInput`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` › "AC-AGE-03-02 editar envia só os campos
  alterados", "AC-AGE-03-02 limpar a observação envia null", "mantém o paciente fixo na edição".
- **Se falhar:**
  1. _Corpo com todos os campos_ → `submit` deveria comparar com o original; compare o corpo enviado.
  2. _`409 APPOINTMENT_NOT_EDITABLE`_ → o atendimento mudou de status em outro lugar (ver BE-04b).
  3. _Duração volta a 50_ → o campo vazio não envia `durationMinutes`; é o padrão do backend.
- **Evidência:** corpo do `PUT` e captura do detalhe atualizado.

#### AGE-03.7 — Cancelar (com confirmação)

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-03
- **Objetivo:** cancelar só depois da confirmação.
- **Pré-condição:** atendimento pendente que não seja o do fluxo F1.
- **Passos:** detalhe → **"Cancelar atendimento"** → **"Manter"**; de novo → **"Sim, cancelar"**.
- **Resultado esperado:**
  - **Tela:** diálogo **"Cancelar atendimento?"** com **"O atendimento fica na agenda como cancelado."**; "Manter"
    fecha **sem** chamar a API; "Sim, cancelar" muda o selo para **"Cancelado"** (selo de aviso), as ações viram
    "Reativar", "Editar observação" e "Excluir atendimento"; na Agenda o item fica esmaecido e sai da contagem.
    Não há toast.
  - **Rede (backend real):** `PUT /appointment/:id` com corpo **`{ status: "CANCELLED" }`** apenas; `200`.
  - **Depois:** Agenda, Início (sai de "Próximo atendimento") e detalhe atualizam.
- **Onde está no código:** `AppointmentDetailScreen` (`dialog === "cancel"`, `setStatus`, `Modal`);
  `useUpdateAppointmentMutation`; `updateAppointment`.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "AC-AGE-03-03 cancelar só chama a API
  depois da confirmação".
- **Se falhar:**
  1. _API chamada ao tocar em "Cancelar atendimento"_ → o diálogo não bloqueou; veja `setDialog("cancel")`.
  2. _`409 INVALID_STATUS_TRANSITION`_ → o status local estava desatualizado (já concluído); mensagem "Essa mudança
     de status não é permitida.".
  3. _Selo não muda_ → resposta do `PUT` sem `status` ou invalidação; confira a resposta.
- **Evidência:** capturas do diálogo e do detalhe cancelado; o `PUT`.

#### AGE-03.8 — Reativar um cancelado

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-04
- **Objetivo:** reativar (com e sem novo horário) e editar a observação.
- **Pré-condição:** atendimento cancelado (AGE-03.7).
- **Passos:** abrir o cancelado; conferir as ações; **"Reativar"** → **"Reativar atendimento"** sem mexer em nada;
  cancelar de novo e reativar mudando o horário.
- **Resultado esperado:**
  - **Tela:** ações **"Reativar"**, **"Editar observação"**, **"Excluir atendimento"** (sem remarcar, sem iniciar
    sessão, sem lembrete); o formulário "Reativar atendimento" permite mudar o horário; toast **"Atendimento
    reativado"**; status volta a "Pendente".
  - **Rede (backend real):** `PUT /appointment/:id` com `{ status: "PENDING" }` (e `scheduledAt` quando mudou:
    `{ status: "PENDING", scheduledAt }`); `200`. Reativar para cima de outro `PENDING` → `409
APPOINTMENT_CONFLICT`.
  - **Depois:** Agenda e Início voltam a contar o item.
- **Onde está no código:** `AppointmentDetailScreen` (`openForm("reactivate")`); `AppointmentFormScreen` ›
  `resolveMode` (só `CANCELLED` aceita `reactivate`), `copy.reactivate`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` › "reativar envia status PENDING" e
  "reativar aceita a remarcação opcional"; `AppointmentDetailScreen.test.tsx` › "AC-AGE-03-04 CANCELLED oferece
  reativar, editar observação e excluir".
- **Se falhar:**
  1. _Formulário abre em "Editar observação"_ → o modo pedido não é aceito para o status (`resolveMode`).
  2. _`409`_ → conflito ao reativar no horário original (outro atendimento o ocupou depois do cancelamento).
- **Evidência:** corpo do `PUT` e captura do status "Pendente".
- **Divergência encontrada:** no modo `reactivate` o formulário deixa **Tipo e Duração editáveis**
  (`detailsLocked` só vale para `reschedule` e `observation`); a ficha só prevê reativar com remarcação opcional.
  Se o backend recusar tipo/duração junto de `status: "PENDING"`, o erro mostrado é o genérico.

#### AGE-03.9 — Excluir

- **Prioridade / AC:** P1 · AGE-03 (MAN) · AC-AGE-03-03
- **Objetivo:** excluir com confirmação; o backend responde o texto `OK`.
- **Pré-condição:** atendimento criado só para isso.
- **Passos:** detalhe → **"Excluir atendimento"** → **"Manter"**; de novo → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** diálogo **"Excluir atendimento?"** / **"Ele sai da agenda e não pode ser recuperado."**; depois toast
    **"Atendimento excluído"** e retorno à Agenda em ~0,7 s; o item some.
  - **Rede (backend real):** `DELETE /appointment/:id` com `200` e corpo de texto `OK` (sem JSON; o app trata como
    sucesso). Depois `GET /appointment/` refeito.
  - **Depois:** Agenda e Início atualizam.
- **Onde está no código:** `AppointmentDetailScreen` (`remove`, estado `deleted`; a tela troca por um painel
  vazio com o toast para não refazer o `GET` do excluído); `useDeleteAppointmentMutation`; `deleteAppointment`.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "AC-AGE-03-03 excluir só chama a API
  depois da confirmação e volta"; `appointment.test.ts` › "cria, lê, atualiza e exclui".
- **Se falhar:**
  1. _Mensagem "Atendimento não encontrado" logo após excluir_ → o detalhe refez o `GET` do id excluído (`400
NOT_FOUND`); o código evita isso com `deleted`/`deletion.isPending`.
  2. _Erro ao excluir_ → texto "Não foi possível concluir a ação. Tente novamente."; veja o status do `DELETE`.
- **Evidência:** captura do diálogo; `DELETE` com status e corpo `OK`.

#### AGE-03.10 — Atendimento concluído

- **Prioridade / AC:** P2 · AGE-03 (MAN) · AC-AGE-03-04
- **Objetivo:** concluído só permite editar a observação.
- **Pré-condição:** atendimento concluído (após o F1 ou por "Marcar como concluído").
- **Passos:** abrir o concluído; **"Editar observação"** → alterar → **"Salvar observação"**.
- **Resultado esperado:**
  - **Tela:** selo "Concluído"; **única ação "Editar observação"** (sem remarcar, cancelar, iniciar sessão nem
    excluir); no formulário só a Observação é editável; toast **"Observação salva"**.
  - **Rede (backend real):** `PUT /appointment/:id` com `{ observation }` apenas; `200`.
  - **Depois:** detalhe mostra a observação nova.
- **Onde está no código:** `AppointmentDetailScreen` (ações por `status`); `AppointmentFormScreen` (`mode:
"observation"`, `scheduleLocked`, `detailsLocked`).
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "AC-AGE-03-04 COMPLETED oferece só
  editar a observação"; `AppointmentFormScreen.test.tsx` › "atendimento concluído só aceita editar a observação".
- **Se falhar:**
  1. _Aparece "Excluir atendimento" no concluído_ → a ficha AGE-03 não lista "Excluir" para `COMPLETED`; o código
     também o oculta (`status !== "COMPLETED"`); investigue o status devolvido.
  2. _`409 APPOINTMENT_NOT_EDITABLE`_ → o formulário enviou campo de horário/tipo/duração; o `PUT` deve levar só
     `observation`.
- **Evidência:** captura do detalhe concluído.

#### AGE-03.11 — Conflito de horário (ponte para o BE-04)

- **Prioridade / AC:** P1 · Backend (§4.4) · AC-AGE-03-05
- **Objetivo:** o `409 APPOINTMENT_CONFLICT` aparece no campo de horário com o link para o conflitante.
- **Pré-condição:** atendimento `PENDING` existente (ex.: 15:00, 50 min).
- **Passos:**
  1. Criar outro atendimento no **mesmo dia e horário** e tocar em "Agendar atendimento".
  2. Tocar em **"Ver atendimento"**.
  3. Voltar e criar outro que **começa quando o primeiro termina** (15:50).
- **Resultado esperado:**
  - **Tela:** o campo **Horário** mostra **"Já existe um atendimento nesse horário"** e abaixo aparece o botão
    **"Ver atendimento"** (abre `/agenda/{conflictingAppointmentId}`); o formulário **continua preenchido**; mudar
    data ou horário limpa o erro (`mutation.reset()`). O horário encostado **não** conflita e é salvo.
  - **Rede (backend real):** `POST /appointment/` responde **`409`** com corpo `{ message: "APPOINTMENT_CONFLICT",
conflictingAppointmentId: "<uuid>" }`; o app **não** reenvia.
  - **Depois:** nada é criado no conflito; no horário encostado, o item aparece normalmente.
- **Onde está no código:** `AppointmentFormScreen` (`conflictId`, `CONFLICT_MESSAGE`, botão "Ver atendimento");
  `src/api/endpoints/appointment.ts` › `AppointmentApiError`, `throwOnConflict`, `acceptConflict`;
  `src/features/agenda/errors.ts` › `conflictingAppointmentId`.
- **Testes automatizados que cobrem:** `AppointmentFormScreen.test.tsx` › "AC-AGE-03-05 mostra o conflito no
  campo de horário com o link para o conflitante" e "AC-AGE-03-05 conflito ao remarcar aparece no horário";
  `appointment.test.ts` › "expõe o atendimento conflitante no erro 409"; `appointment-handlers.test.ts` › "recusa
  intervalo sobreposto a outro PENDING e aceita horários encostados".
- **Se falhar:**
  1. _Mensagem genérica "Não foi possível concluir a ação."_ → o `409` não foi lido (o `validateStatus` de
     `acceptConflict` ou o corpo sem `message`); confira o corpo do `409`.
  2. _Sem o link "Ver atendimento"_ → `conflictingAppointmentId` ausente do corpo (backend) — divergência de
     contrato, não do app.
  3. _Horário encostado recusado_ → regra do backend (intervalo `[início, início+duração)`); registre o corpo.
- **Evidência:** captura do campo com o erro e do atendimento aberto pelo link; status `409` e o campo
  `conflictingAppointmentId` (sem copiar outros dados).

## 7. AGE-04 — Iniciar sessão a partir do atendimento

**Fluxo de dados:** "Iniciar sessão" navega para `/session/student?studentId=<paciente>&appointmentId=<atendimento>`.
`StudentStep.handleNext` guarda o `appointmentId` na store (`setAppointmentId`) **só** se o paciente escolhido é o do
atendimento (`params.studentId === selected.id`); caso contrário grava `null`. `ContentStep.handleStart` envia
`POST /task-notebook-session/start` com `{ studentId, name, taskNotebookId (se caderno), appointmentId (se houver) }`.
O backend marca o atendimento `COMPLETED` no `finish` se ele estiver `PENDING` (BACKEND-ENTREGUE §6).

#### AGE-04.1 — Iniciar pela Início

- **Prioridade / AC:** P1 · AGE-04 (MAN) · AC-AGE-04-01
- **Objetivo:** o hero do próximo atendimento inicia a sessão já com o paciente.
- **Pré-condição:** atendimento `PENDING` de hoje do Paciente A.
- **Passos:** Início → no cartão **"Próximo atendimento"** tocar em **"Iniciar sessão"**; na tela "Nova sessão"
  seguir o fluxo da V1 (escolher o paciente já marcado, **"Continuar"**, caderno, nome, **"Iniciar sessão"**).
- **Resultado esperado:**
  - **Tela:** abre "Nova sessão" ("Escolha o paciente") **com o Paciente A selecionado** (se já houver sessão
    aberta dele, aparece "Sessão em andamento" com "Retomar" e "Encerrar agora"); depois "Escolha o caderno"; o
    player abre.
  - **Rede (backend real):** `GET /task-notebook-session/student/:studentId` (verifica sessão aberta);
    `POST /task-notebook-session/start` com `{ studentId, name, taskNotebookId, appointmentId }` → `200/201` com a
    sessão (`taskNotebookId` e `appointmentId` preenchidos). Atendimento de outro educador/paciente: `404
APPOINTMENT_NOT_FOUND`.
  - **Depois:** o atendimento só vira "Concluído" no encerramento (AGE-04.3).
- **Onde está no código:** `HomeScreen` (`router.push({ pathname: "/session/student", params })`);
  `StudentStep.tsx` › `StudentStep` (`useLocalSearchParams`, `chooseStudent`, `handleNext`); `ContentStep.tsx` ›
  `handleStart`; `src/stores/session-flow.ts` › `setAppointmentId`; `src/api/endpoints/session.ts` › `startSession`.
- **Testes automatizados que cobrem:** `src/features/sessions/__tests__/StudentStep.test.tsx` › "AC-AGE-04-02:
  guarda o appointmentId da rota ao continuar com o paciente do atendimento" e "sessão avulsa limpa o
  appointmentId herdado"; `ContentStep.test.tsx` › "AC-AGE-04-02: envia o appointmentId no start quando a sessão
  veio de um atendimento"; `HomeScreen.test.tsx` › "mostra o próximo atendimento, agenda ordenada e os atalhos";
  `src/stores/__tests__/session-flow.test.ts` › "appointmentId começa nulo e tem setter persistido".
- **Se falhar:**
  1. _Paciente não vem marcado_ → `params.studentId` não casou com `GET /student/`; veja `useEffect` de
     `StudentStep`.
  2. _`start` sem `appointmentId`_ → `setAppointmentId` gravou `null` (paciente escolhido manualmente é outro) ou o
     passo "Continuar" foi pulado; confira o corpo do `POST`.
  3. _Erro "Atendimento não encontrado. Inicie a sessão sem vínculo?"_ → `404 APPOINTMENT_NOT_FOUND`: botão **"Iniciar
     sem vínculo"** reenvia o `start` **sem** `appointmentId` (sem reenvio automático). Registre o caso.
- **Evidência:** captura do passo com o paciente marcado; corpo do `start` (campos, sem dados pessoais).
- **Divergência encontrada:** o atendimento "atual" do hero da Início é o primeiro item que **não é concluído nem
  cancelado** (`selectNextAppointment`), não necessariamente o próximo no relógio — um `PENDING` atrasado de hoje
  continua como "próximo".

#### AGE-04.2 — Iniciar pelo detalhe do atendimento

- **Prioridade / AC:** P1 · AGE-04 (MAN) · AC-AGE-04-01
- **Objetivo:** mesmo comportamento a partir do detalhe.
- **Pré-condição:** atendimento `PENDING`.
- **Passos:** Agenda → item → **"Iniciar sessão"**; seguir o fluxo.
- **Resultado esperado:**
  - **Tela / Rede / Depois:** igual ao AGE-04.1.
- **Onde está no código:** `AppointmentDetailScreen` (primeira `DsButton` "Iniciar sessão", `router.push` com
  `appointmentId`); demais como no AGE-04.1.
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "AC-AGE-04-01 PENDING: Iniciar sessão
  abre o fluxo com paciente e atendimento".
- **Se falhar:**
  1. _Botão desabilitado_ → `busy` (mutação em andamento) — aguarde.
  2. As demais, como no AGE-04.1.
- **Evidência:** captura do `start`.

#### AGE-04.3 — Atendimento fica "Concluído" ao encerrar

- **Prioridade / AC:** P1 · AGE-04 (MAN) · AC-AGE-04-03
- **Objetivo:** o `finish` do backend conclui o atendimento e o app atualiza Agenda e Início.
- **Pré-condição:** sessão iniciada pelo atendimento (AGE-04.1 ou 04.2), com ao menos uma resposta.
- **Passos:**
  1. No player, responder e seguir até o botão **"Encerrar sessão"** (última atividade).
  2. Na tela "Registro da sessão" digitar o registro e tocar em **"Salvar e atualizar prontuário"** (ou **"Pular"**).
  3. Voltar à Agenda e à Início **sem puxar para atualizar**.
- **Resultado esperado:**
  - **Tela:** "Encerrando a sessão..." e depois o campo "Registro descritivo"; após salvar, abre o relatório da
    sessão; o atendimento aparece **"Concluído"** (check) na Agenda, na Início e no detalhe (que passa a ter só
    "Editar observação").
  - **Rede (backend real):** `POST /task-notebook-session/finish` `{ sessionId }` (`200`); `POST
/task-notebook-session/observation` `{ sessionId, observation }` (`200`); em seguida o app refaz `GET
/appointment/` (invalidação). O atendimento volta com `status: "COMPLETED"` — **efeito do backend**, não de uma
    chamada do app.
  - **Depois:** `["task-notebook-session"]`, `["student-analysis"]` e `["appointment"]` são invalidados em
    `complete()`; a ficha do paciente mostra a sessão nova.
- **Onde está no código:** `FinishSessionScreen.tsx` › `runFinish`, `save`, `complete` (as três invalidações);
  `src/features/appointments/useAppointments.ts` › `appointmentQueryKeys`; `finishSession`,
  `addSessionObservation`; store `session-flow` (`finish`, `awaitObservation`, `close`).
- **Testes automatizados que cobrem:** `src/features/sessions/finish/__tests__/FinishSessionScreen.test.tsx` ›
  "AC-AGE-04-03: ao concluir, invalida os atendimentos para a Agenda e a Início" e "ao concluir, invalida sessões
  e análise para a ficha do paciente atualizar"; `src/mocks/__tests__/session-appointment.integration.test.ts` ›
  "finish conclui o atendimento PENDING ligado à sessão" e "finish não altera atendimento que não está PENDING".
- **Se falhar:**
  1. _Atendimento continua "Pendente" na Agenda_ → (a) o `start` não levou `appointmentId` (confira o corpo do
     `start` no AGE-04.1) — causa mais provável; (b) o backend não concluiu no `finish` (consulte `GET
/appointment/:id` e compare); (c) invalidação não rodou porque a pessoa saiu antes de `complete()`.
  2. _Fica "Pendente" até puxar a tela_ → `complete()` só invalida **depois** de salvar/pular o registro; se o
     app foi fechado entre o `finish` e o registro, o atendimento já está concluído no servidor mas o cache antigo
     persiste até o próximo refetch.
  3. _Erro ao encerrar_ → mensagens "Não foi possível confirmar o encerramento. Verifique a conexão e tente
     novamente." ou "Não foi possível encerrar a sessão. Tente novamente." (`runFinish`).
- **Evidência:** capturas da Agenda e da Início com "Concluído"; o `start` (campos) e o `finish`/`GET
/appointment/:id` com status.
- **Divergência encontrada:** a invalidação ocorre no `complete()` (ao salvar ou pular o registro), **não** logo
  após o `finish`; a ficha AGE-04 diz "depois do encerramento". Na prática a janela é curta, mas existe.

#### AGE-04.4 — Sem "Iniciar sessão" fora do `PENDING`

- **Prioridade / AC:** P2 · AC-AGE-04-04
- **Objetivo:** concluído e cancelado não oferecem iniciar sessão.
- **Pré-condição:** atendimentos concluído e cancelado.
- **Passos:** abrir o detalhe de cada um.
- **Resultado esperado:**
  - **Tela:** sem "Iniciar sessão" (nem "Enviar lembrete"): concluído só "Editar observação"; cancelado "Reativar",
    "Editar observação" e "Excluir atendimento".
  - **Rede (backend real):** só `GET /appointment/:id`.
  - **Depois:** —
- **Onde está no código:** `AppointmentDetailScreen` (bloco `appointment.status === "PENDING"`).
- **Testes automatizados que cobrem:** `AppointmentDetailScreen.test.tsx` › "AC-AGE-03-04 CANCELLED oferece
  reativar, editar observação e excluir" e "AC-AGE-03-04 COMPLETED oferece só editar a observação".
- **Se falhar:** _botão aparece num concluído_ → status desatualizado no cache; confira `GET /appointment/:id`.
- **Evidência:** captura dos dois detalhes.

#### AGE-04.5 — Iniciar pela ficha (sem atendimento)

- **Prioridade / AC:** P2 · AC-AGE-04-01
- **Objetivo:** a ficha inicia a sessão sem ligar atendimento; a agenda não muda ao encerrar.
- **Pré-condição:** ficha do Paciente A (visão geral); um atendimento `PENDING` do mesmo paciente.
- **Passos:** Pacientes → Paciente A → rolar até o botão **"Iniciar sessão"** (fim da visão geral) → seguir o fluxo
  e encerrar.
- **Resultado esperado:**
  - **Tela:** abre "Nova sessão" com o paciente já marcado.
  - **Rede (backend real):** `POST /task-notebook-session/start` **sem** `appointmentId` (e com `taskNotebookId` se
    caderno).
  - **Depois:** ao encerrar, **nenhum** atendimento muda de status.
- **Onde está no código:** `PatientDetailScreen` (`DsButton` "Iniciar sessão", `params: { studentId }`);
  `StudentStep.handleNext` (grava `null` se não há `appointmentId`).
- **Testes automatizados que cobrem:** `StudentStep.test.tsx` › "sessão avulsa limpa o appointmentId herdado";
  `PatientDetailScreen.test.tsx` › "mostra resumo, dados da API, evolução e acessos da ficha".
- **Se falhar:**
  1. _Atendimento foi concluído sem querer_ → `appointmentId` herdado de uma sessão anterior na store; veja o corpo
     do `start` e `setAppointmentId(null)`.
  2. _Botão não aparece_ → a aba ativa é "Planos"; o botão só existe em "Visão geral".
- **Evidência:** corpo do `start` sem `appointmentId`.

## 8. Casos adicionados (IDs novos)

#### AGE-03.12+ — Ver o atendimento a partir da ficha do paciente ("Próxima sessão")

- **Prioridade / AC:** P3 · fumaça
- **Objetivo:** a ficha mostra o próximo atendimento do paciente; confirma coerência com a Agenda.
- **Pré-condição:** Paciente A com atendimento futuro não cancelado.
- **Passos:** Pacientes → Paciente A → seção **"Próxima sessão"**; compare com a Agenda.
- **Resultado esperado:**
  - **Tela:** cartão "Atendimento agendado" com dia/mês e hora; sem atendimento: "Nenhuma sessão agendada". O cartão
    **não é tocável** (não abre o detalhe).
  - **Rede (backend real):** reaproveita `GET /appointment/` (mesma chave `["appointment"]`).
  - **Depois:** —
- **Onde está no código:** `PatientDetailScreen` › `findNextAppointment` (futuro, não cancelado, mais próximo),
  `formatDateParts`.
- **Testes automatizados que cobrem:** `PatientDetailScreen.test.tsx` › "escolhe o próximo atendimento não
  cancelado a partir de agora".
- **Se falhar:** _mostra um atendimento já passado_ → `findNextAppointment` compara com `now`; confira o relógio do
  emulador.
- **Evidência:** captura da ficha e da Agenda lado a lado.

#### AGE-04.6+ — Retomar sessão de atendimento mantém o vínculo

- **Prioridade / AC:** P3 · AC-SES-05-02 (cruza com o SES-05)
- **Objetivo:** uma sessão aberta com `appointmentId` e retomada pelo servidor continua ligada ao atendimento.
- **Pré-condição:** sessão iniciada pelo atendimento e **não** encerrada; fluxo local perdido (veja o SES-05.2/05.1
  no arquivo `03-conta-sessao-conteudo-base.md`).
- **Passos:** retomar pelo "Sessão em andamento" → "Retomar"; encerrar.
- **Resultado esperado:**
  - **Tela:** o atendimento fica "Concluído" ao encerrar, como no AGE-04.3.
  - **Rede (backend real):** `GET /task-notebook-session/student/:id` já traz `appointmentId`.
  - **Depois:** igual ao AGE-04.3.
- **Onde está no código:** `session-flow.ts` › `seedFromServerSession` (`appointmentId: session.appointmentId ?? null`);
  `StudentStep.resume`.
- **Testes automatizados que cobrem:** `session-flow.test.ts` › "seedFromServerSession semeia o fluxo em running com
  caderno e respostas"; `StudentStep.test.tsx` › "sem fluxo local, Retomar semeia o fluxo com o caderno e abre o
  player".
- **Se falhar:** _atendimento não conclui_ → `appointmentId` não veio na sessão do servidor (veja a resposta de `GET
/task-notebook-session/student/:id`).
- **Evidência:** captura do atendimento "Concluído" após a retomada.
