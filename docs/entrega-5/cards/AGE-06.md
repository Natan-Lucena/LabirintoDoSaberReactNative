# AGE-06 — Atendimentos recorrentes

| Campo             | Valor                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloco / onda      | D — Pacientes e agenda · E5-7 (paralela à PAC-10; arquivos disjuntos)                                                                                            |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio-alto (datas e fuso)                                                                                                   |
| Estimativa        | G · 7–9 h de worker                                                                                                                                              |
| Dependências      | AGE-05 na `main`; API-07 (agenda: `AppointmentSeries`, `SeriesResult`, `Appointment.seriesId`, `getAppointmentSeries`); backend leva 3 (§6, RC-01 a RC-08); G-68 |
| Estado do backend | **Mock-first**; rotas `/appointment/series` novas                                                                                                                |
| História          | US5-02 (agendar uma série de uma vez)                                                                                                                            |

## 1. Objetivo e valor

Atendimento de psicopedagogia costuma ser semanal. Hoje cada um é criado à mão. Com a série
(G-68), a profissional cria de 2 a 26 ocorrências de uma vez, vê antes quantas serão e até
quando, sabe quais foram puladas por conflito e muda ou cancela "este e os seguintes".

## 2. Referência de design

Sem desenho. O formulário segue o `AppointmentFormScreen` (`Field`, `FieldGrid`, `FilterRow` das
sugestões de tipo); a escolha da repetição usa `SegmentedControl`; o aviso de puladas usa o
`InfoCard`; as perguntas "Só este / Este e os seguintes" usam `Modal` como o detalhe do
atendimento.

## 3. Fluxo do usuário

**Criar (só no modo `create` do formulário):**

1. Agenda → "Novo atendimento": depois de "Duração", o campo **"Repetir"** com
   `SegmentedControl` "Não repete" (padrão) / "Semanal" / "Quinzenal".
2. Com repetição: `Field` numérico **"Quantas vezes"** (padrão 8; 2–26 semanal, 2–13 quinzenal)
   e a prévia em texto: **"8 atendimentos, toda terça às 14:00, até 12/02"**.
3. O botão vira "Agendar {n} atendimentos" → `POST /appointment/series`.
4. Resposta `201 SeriesResult`:
   - sem puladas: `Toast` "{n} atendimentos agendados" e volta à Agenda;
   - com puladas: a tela **não** volta sozinha; mostra o `InfoCard` "{criados} agendados. {k}
     não foram criados porque o horário já estava ocupado:" e a lista "dd/mm (dia) às hh:mm",
     cada uma com "Ver atendimento" (o `conflictingAppointmentId`). Botão "Concluir" volta à
     Agenda.
5. Todas em conflito: `409 APPOINTMENT_CONFLICT` → "Todos os horários desta série já estão
   ocupados. Escolha outro horário."

**Ocorrência (detalhe do atendimento com `seriesId`):**

6. Linha "Repetição": "Semanal · 3 de 8" (posição pela ordem de `scheduledAt` em
   `GET /appointment/series/:id`); série encerrada: "Semanal · série encerrada".
7. "Editar" e "Remarcar" de uma ocorrência `PENDING` com série ativa → `Modal` "Alterar só este
   atendimento ou este e os seguintes?" com "Só este" / "Este e os seguintes" / "Voltar".
   - "Só este": o fluxo atual (`PUT /appointment/:id`).
   - "Este e os seguintes": o formulário abre no modo `series` (parâmetro `scope=following`),
     com a **data travada** (só horário, duração, tipo e observação; RC-05 usa só o horário de
     `scheduledAt`) → `PUT /appointment/series/:id { fromAppointmentId, … }` só com os campos
     alterados. Resultado com puladas: o mesmo `InfoCard` do passo 4.
8. "Cancelar atendimento" de uma ocorrência com série ativa → `Modal` "Cancelar só este
   atendimento ou este e os seguintes?":
   - "Só este": o fluxo atual (`status: "CANCELLED"`).
   - "Este e os seguintes": segunda frase "Os {k} atendimentos pendentes a partir de dd/mm serão
     cancelados e a série termina." → `POST /appointment/series/:id/cancel { fromAppointmentId }`.
9. **Agenda:** o cartão de um atendimento com `seriesId` ganha o ícone/rótulo "Repete" (e
   "repete semanalmente" no `accessibilityLabel`). Sem chamar a série na lista.

## 4. Estados da tela

| Situação                               | Mensagem / comportamento                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| "Quantas vezes" fora do limite         | "Escolha de 2 a 26 atendimentos." (semanal) / "Escolha de 2 a 13 atendimentos." (quinzenal)               |
| Enviando                               | Botão com `loading`; campos desabilitados                                                                 |
| `409 APPOINTMENT_CONFLICT` (série)     | Frase do passo 5                                                                                          |
| `409 STUDENT_ARCHIVED`                 | "Este paciente está arquivado. Reative-o na ficha para agendar."                                          |
| `409 APPOINTMENT_NOT_EDITABLE` (série) | "Este atendimento não permite alterar horário, tipo ou duração." (já existe em `appointmentErrorMessage`) |
| `404 SERIES_NOT_FOUND`                 | Detalhe sem a linha "Repetição" e as ações voltam a ser as de um atendimento comum                        |
| Série carregando no detalhe            | Linha "Repetição: carregando…"; as ações esperam a série para oferecer "Este e os seguintes"              |
| Offline                                | Mensagem de rede do `normalizeApiError`                                                                   |

## 5. Contrato de dados

| Rota                                  | Corpo                                                                                                       | Resposta                                   | Erros                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `POST /appointment/series`            | `studentId`, `scheduledAt` (ISO), `frequency`, `occurrences`, `type?`, `durationMinutes?`, `observation?`   | `201 SeriesResult`                         | `400`; `403`; `404 STUDENT_NOT_FOUND`; `409 APPOINTMENT_CONFLICT`, `STUDENT_ARCHIVED` |
| `GET /appointment/series/:id`         | —                                                                                                           | `200 AppointmentSeries & { appointments }` | `403`; `404 SERIES_NOT_FOUND`                                                         |
| `PUT /appointment/series/:id`         | `fromAppointmentId` + ao menos um: `scheduledAt` (só a hora vale), `durationMinutes`, `type`, `observation` | `200 SeriesResult`                         | `400`; `403`; `404`; `409 APPOINTMENT_NOT_EDITABLE`                                   |
| `POST /appointment/series/:id/cancel` | `fromAppointmentId`                                                                                         | `200 SeriesResult`                         | `400`; `403`; `404`                                                                   |

- **Funções:** `getAppointmentSeries` (API-07); `createAppointmentSeries`,
  `updateAppointmentSeries` e `cancelAppointmentSeries` (esta tarefa) em
  `src/api/endpoints/appointment-series.ts`. O `409` usa o padrão `acceptConflict` /
  `throwOnConflict` de `src/api/endpoints/appointment.ts` (exportar os dois helpers de lá, sem
  mudar o comportamento, ou repetir o padrão no arquivo novo).
- **Chaves:** `["appointment", "series", id]` (sob `["appointment"]`: todas as mutações de
  atendimento já invalidam).
- **Mutações** em `src/features/appointments/mutations.ts`, no padrão das existentes
  (`withOfflineGuard` + `invalidateQueries(["appointment"])`).
- **Tipos** da API-07: `RecurrenceFrequency`, `AppointmentSeries`, `SeriesResult`,
  `Appointment.seriesId?`.

## 6. Regras de negócio e casos de borda

1. **Prévia no app** (AC-AGE-06-01), função pura `previewSeries({ first, frequency,
occurrences })` em `src/features/agenda/series/preview.ts`: gera as datas somando 7 ou 14
   **dias de calendário de São Paulo** e mantendo a hora local (RC-02), com
   `toBrasiliaISOString`. Devolve `{ count, last, weekdayLabel, time }`. Não prevê conflitos (o
   servidor decide).
2. **Limites:** 2–26 ocorrências e no máximo 6 meses (RC-01). Quinzenal com 26 passaria de um
   ano; o app limita a quinzenal a **13** (12 intervalos = 168 dias). Pergunta ao backend em §11.
3. Ocorrência em conflito é **pulada** (RC-03); o app mostra data e hora de cada uma
   (AC-AGE-06-02) e não tenta recriá-las.
4. "Repetir" só existe ao **criar**. Editar uma ocorrência nunca transforma um atendimento comum
   em série.
5. "Este e os seguintes" só aparece com ocorrência `PENDING` de série sem `endedAt`. Para
   `COMPLETED` / `CANCELLED`, só as ações atuais.
6. "Só este" usa a rota do atendimento (RC-04); "Este e os seguintes" usa a da série
   (AC-AGE-06-03).
7. **Mudar o dia da semana da série** não existe (a rota usa só a hora): no modo
   `scope=following` a data fica desabilitada com a dica "Para mudar o dia, cancele os seguintes
   e crie uma série nova."
8. Reativar uma ocorrência cancelada continua individual (`PUT /appointment/:id`).
9. Paciente arquivado: o seletor do novo atendimento já não o mostra; `STUDENT_ARCHIVED` cobre o
   cache antigo (a PAC-11 acrescenta a mesma mensagem ao formulário; quem chegar depois resolve o
   conflito de texto).
10. Lembretes e WhatsApp (`wa.me`) continuam por ocorrência; nada muda.

## 7. Plano de implementação

1. `src/api/endpoints/appointment-series.ts`: escritas + handlers em
   `src/mocks/handlers/appointment-series.ts` (estado em memória que cria `Appointment`s com
   `seriesId` no mesmo estado do mock de atendimentos; uma ocorrência fictícia em conflito para
   `skipped`) + testes pelo `apiClient` real.
2. `src/features/agenda/series/`: `preview.ts`, `RepeatField.tsx`, `SkippedNotice.tsx`,
   `SeriesScopeDialog.tsx`, `useAppointmentSeries.ts`.
3. `src/features/agenda/form/AppointmentFormScreen.tsx`: "Repetir" no modo `create`; modo
   `scope=following` com data travada; envio para a rota certa; tela de puladas.
4. `src/features/agenda/detail/AppointmentDetailScreen.tsx`: linha "Repetição" e os diálogos de
   escopo antes de "Editar", "Remarcar" e "Cancelar atendimento".
5. `src/features/agenda/AgendaScreen.tsx`: o rótulo "Repete" no cartão (só isso).
6. `app/agenda/[id]/edit.tsx`: repassar o parâmetro `scope`, se a rota não repassar tudo.

## 8. Arquivos

- **Permitidos:** `src/api/endpoints/appointment-series.ts` (escritas),
  `src/api/endpoints/appointment.ts` (só exportar os helpers de `409`),
  `src/mocks/handlers/appointment-series.ts`, `src/mocks/handlers/appointment.ts` (só expor o
  estado para o handler da série), `src/mocks/install.ts`, `src/mocks/README.md`,
  `src/features/agenda/series/**` (novo), `src/features/agenda/form/**`,
  `src/features/agenda/detail/**`, `src/features/agenda/AgendaScreen.tsx` (só o rótulo),
  `src/features/appointments/mutations.ts`, `app/agenda/[id]/edit.tsx` e os testes.
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts`, `src/features/patients/**`,
  `src/features/appointments/components/MiniCalendar.tsx`.

## 9. Critérios de aceite

| ID           | Critério                                                                                                    | Verificação |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ----------- |
| AC-AGE-06-01 | `previewSeries` dá o número e a última data em São Paulo, inclusive atravessando a virada do mês e do ano   | `UT`        |
| AC-AGE-06-02 | As ocorrências puladas aparecem no aviso com data e hora, e o formulário não fecha sozinho                  | `CT`        |
| AC-AGE-06-03 | "Este e os seguintes" chama a rota da série com `fromAppointmentId`; "Só este" chama `PUT /appointment/:id` | `CT`        |
| AC-AGE-06-04 | O detalhe mostra "Semanal · 3 de 8" a partir da série do servidor                                           | `CT`        |

## 10. Como testar manualmente (Victor)

1. Marque um atendimento avulso do "Paciente Teste Um" numa terça às 14:00, daqui a duas semanas.
2. Novo atendimento do mesmo paciente na terça desta semana às 14:00 → "Semanal", 8 vezes: a
   prévia diz "8 atendimentos, toda terça às 14:00, até dd/mm".
3. Agende: o aviso mostra 7 agendados e 1 pulado (a data do passo 1). "Ver atendimento" abre o
   avulso.
4. No mês (AGE-05), as terças têm ponto. Abra a 3ª ocorrência: "Semanal · 3 de 8".
5. "Editar" → "Este e os seguintes" → mude para 15:00: as seguintes passam a 15:00; as anteriores
   continuam às 14:00.
6. Na 5ª ocorrência, "Cancelar atendimento" → "Este e os seguintes": da 5ª em diante ficam
   canceladas; a linha mostra "série encerrada".

## 11. Riscos e perguntas em aberto

- **Limite da quinzenal:** "26 ocorrências" e "6 meses" não cabem juntos. Padrão: o app limita a
  13 e pede confirmação ao backend.
- **Horário de verão:** São Paulo não tem hoje, mas a regra RC-02 (hora local) já cobre se voltar.
- **"3 de 8"** depende de `GET /appointment/series/:id` trazer todas as ocorrências (inclusive
  canceladas). Se trouxer só as pendentes, o app mostra só "Semanal".

## 12. Fora do escopo

Recorrência mensal ou por dias da semana; série sem fim; regra calculada na leitura (G-68,
alternativa); "Confirmar por WhatsApp" (fora por decisão do usuário).
