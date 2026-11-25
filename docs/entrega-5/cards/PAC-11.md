# PAC-11 — Arquivar e reativar paciente

| Campo             | Valor                                                                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloco / onda      | D — Pacientes e agenda · E5-8 (com a FEC-06; arquivos disjuntos)                                                                                           |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio                                                                                                                 |
| Estimativa        | M · 5–7 h de worker                                                                                                                                        |
| Dependências      | PAC-10 e AGE-06 na `main`; API-07 (pacientes: `Student.status`, `archivedAt`, `listStudents({ status })`); backend leva 3 (§5, PA-02 a PA-05; PP-09); G-70 |
| Estado do backend | **Mock-first**; `PUT /student/:id/status` e `?status=` são novos                                                                                           |
| História          | US5-01 (arquivar os que saíram)                                                                                                                            |

## 1. Objetivo e valor

Paciente que terminou o acompanhamento continua na lista, nas notificações e na contagem.
Arquivar tira o paciente do dia a dia sem apagar nada; os dados continuam no prontuário e nos
relatórios. Reativar desfaz.

## 2. Referência de design

Sem desenho. Filtro "Arquivados" como mais uma opção do `.filter-row` da `PatientsScreen`;
confirmações com `Modal` no padrão do `AppointmentDetailScreen` ("Manter" + ação).

## 3. Fluxo do usuário

1. **Arquivar** (só o dono, `isPatientOwner` da EQP-04): no fim da aba "Visão geral" da ficha,
   `DsButton` `ghost` "Arquivar paciente".
2. Primeira confirmação: título "Arquivar {nome}?", texto "O paciente sai da lista, da contagem e
   das notificações. Os registros continuam guardados e você pode reativá-lo depois." Botões
   "Manter" e "Arquivar".
3. "Arquivar" → `PUT /student/:id/status { status: "ARCHIVED" }`.
   - `200` → `Toast` "Paciente arquivado"; a ficha passa ao estado arquivado (passo 5).
   - `409 HAS_FUTURE_APPOINTMENTS` com `count` → segunda confirmação: "{nome} tem {count}
     atendimento(s) futuro(s). Ao arquivar, eles serão cancelados." Botões "Manter" e
     "Cancelar atendimentos e arquivar".
4. Segunda confirmação → `PUT /student/:id/status { status: "ARCHIVED",
cancelFutureAppointments: true }`. **Só** depois desse toque (AC-PAC-11-01).
5. **Ficha arquivada:** cabeçalho "{idade} anos · Arquivado"; faixa no topo "Arquivado em
   dd/mm/aaaa" com `DsButton` "Reativar paciente"; somem "Iniciar sessão", "Criar novo plano" /
   "Criar PDI" (aba Planos), "Nova avaliação" (aba Avaliações) e "Registrar evolução" de sessões
   pendentes continua (a evolução é de uma sessão que já existiu). Leitura de tudo continua.
6. **Reativar** → `PUT /student/:id/status { status: "ACTIVE" }` → `Toast` "Paciente reativado";
   o paciente volta à lista e à contagem. Os atendimentos cancelados **não** voltam (PA-05); o
   `Toast` diz só "Paciente reativado".
7. **Lista:** `FilterRow` ganha "Arquivados" → `GET /student/?status=ARCHIVED`; cartões sem
   status e sem próximo atendimento, com "Arquivado em dd/mm". Vazio: "Nenhum paciente
   arquivado". Tocar abre a ficha arquivada.
8. **Criar para arquivado por outro caminho** (ex.: a lista da Agenda em cache antigo):
   `409 STUDENT_ARCHIVED` mostra "Este paciente está arquivado. Reative-o na ficha para agendar."
   no formulário de atendimento.

## 4. Estados da tela

| Situação                      | Mensagem / comportamento                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Enviando                      | Botão da confirmação com `loading`                                                             |
| `409 HAS_FUTURE_APPOINTMENTS` | Segunda confirmação (passo 3); sem `count` no corpo: "Este paciente tem atendimentos futuros…" |
| `403`                         | "Só quem cadastrou o paciente pode arquivá-lo."                                                |
| `404 STUDENT_NOT_FOUND`       | "Paciente não encontrado" e volta à lista                                                      |
| Offline                       | Mensagem de rede do `normalizeApiError`; nada muda                                             |
| Lista "Arquivados" com erro   | "Não foi possível carregar os arquivados." + "Tentar novamente"                                |

## 5. Contrato de dados

| Rota                                   | Corpo / query                                 | Resposta        | Erros                                                            |
| -------------------------------------- | --------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `PUT /student/:id/status`              | `status`, `cancelFutureAppointments?`         | `200 Student`   | `400`; `403`; `404`; `409 HAS_FUTURE_APPOINTMENTS` (com `count`) |
| `GET /student/?status=ARCHIVED`        | `status` (`ACTIVE` padrão, `ARCHIVED`, `ALL`) | `200 Student[]` | `400`                                                            |
| `GET /student/:id` (PP-09)             | —                                             | `200 Student`   | `403`; `404 STUDENT_NOT_FOUND`                                   |
| `POST /appointment/` etc. (existentes) | —                                             | —               | novo `409 STUDENT_ARCHIVED`                                      |

- **Escrita** (esta tarefa) em `src/api/endpoints/student-status.ts`:
  `updateStudentStatus(id, { status, cancelFutureAppointments? })`. O `409` precisa do `count`,
  que o `normalizeApiError` descarta: usar o mesmo padrão do `AppointmentApiError`
  (`validateStatus` aceita `409`, lê o corpo e lança `StudentStatusConflictError` com `count`).
- **Leitura de arquivados:** `useStudents({ status: "ARCHIVED" })` com chave `["student", {
status: "ARCHIVED" }]`. O `useStudents()` sem argumento continua com a chave `["student"]` e a
  lista ativa (não quebrar as telas que já usam).
- **Ficha:** passa a ler o paciente por `GET /student/:id` (`useStudent(id)`, chave `["student",
"detail", id]`) se a API-06 registrar a PP-09; senão, procura em `useStudents({ status: "ALL"
})`. Sem isso, a ficha de um arquivado diria "Paciente não encontrado".
- **Invalidação** depois de arquivar/reativar: `["student"]` (lista, overview, detalhe,
  arquivados), `["appointment"]` (atendimentos cancelados) e `["notifications"]`.
- `STUDENT_ARCHIVED` e `HAS_FUTURE_APPOINTMENTS` ganham mensagem na API-07 (leva 3). Se não
  tiverem, a tela mapeia pelo `code`.

## 6. Regras de negócio e casos de borda

1. Só o dono arquiva (PA-02, EQ-11): o botão depende de `isPatientOwner`.
2. O cancelamento dos futuros só acontece com o segundo toque explícito; o app nunca manda
   `cancelFutureAppointments: true` na primeira tentativa.
3. Arquivado sai da lista ativa, da contagem "pacientes ativos", do overview, da recomendação e
   das notificações (PA-03): no app, basta invalidar; nada é filtrado localmente.
4. **Nomes na Agenda:** os atendimentos passados de um arquivado continuam na Agenda, mas o
   paciente sai de `GET /student/`. Para não mostrar "Paciente não encontrado", a
   `AgendaScreen` e o detalhe do atendimento passam a montar o mapa de nomes com
   `useStudents({ status: "ALL" })`; o seletor de paciente do **novo** atendimento continua com
   a lista ativa (arquivado não aparece para agendar).
5. Data do arquivamento em `America/Sao_Paulo` (`archivedAt`).
6. Paciente compartilhado arquivado pelo dono some também para a colega (PA-03); se ela estiver
   na ficha, vale a regra de acesso perdido da EQP-04.
7. Sessão em andamento (fluxo de sessão salvo) de um paciente que foi arquivado: não é tratada
   aqui; o `finish` existente continua (a sessão já existia).

## 7. Plano de implementação

1. `src/api/endpoints/student-status.ts`: `updateStudentStatus` + `StudentStatusConflictError` +
   handler em `src/mocks/handlers/student-status.ts` (um paciente fictício com atendimento futuro
   para o `409`) + teste pelo `apiClient` real (sucesso, `409` com `count`, reenvio com a opção).
2. `src/features/students/useStudents.ts`: parâmetro opcional `{ status }` (sem mudar a chave do
   caso padrão) e `useStudent(id)` se houver PP-09.
3. `src/features/patients/archive/`: `useArchivePatient.ts` (máquina simples: `idle` →
   `confirm` → `confirmCancel(count)` → `done`), `ArchiveDialog.tsx`, `ArchivedBanner.tsx`.
4. `src/features/patients/detail/PatientDetailScreen.tsx` (+ `plans/PatientPlans.tsx`,
   `assessments/PatientAssessments.tsx`): estado arquivado, botão, esconder as ações de criar.
5. `src/features/patients/list/`: opção "Arquivados", cartão do arquivado.
6. `src/features/agenda/AgendaScreen.tsx` e `src/features/agenda/detail/AppointmentDetailScreen.tsx`:
   só trocar a fonte do mapa de nomes (§6, item 4). `src/features/agenda/form/AppointmentFormScreen.tsx`
   e `src/features/agenda/errors.ts`: só a mensagem de `STUDENT_ARCHIVED`.

## 8. Arquivos

- **Permitidos:** `src/api/endpoints/student-status.ts` (escrita), `src/mocks/handlers/student-status.ts`,
  `src/mocks/README.md`, `src/features/students/useStudents.ts`,
  `src/features/patients/archive/**` (novo), `src/features/patients/detail/**`,
  `src/features/patients/list/**`, as três linhas da Agenda do passo 6 e os testes.
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts`, `src/features/patients/form/**` (dona
  na onda: FEC-06), `src/features/notifications/**`.

## 9. Critérios de aceite

| ID           | Critério                                                                                                                      | Verificação |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-PAC-11-01 | Com `409 HAS_FUTURE_APPOINTMENTS`, o app mostra o `count` e só envia `cancelFutureAppointments: true` depois do segundo toque | `CT`        |
| AC-PAC-11-02 | O arquivado sai da lista ativa e aparece em "Arquivados"; reativar o devolve (invalidação de `["student"]`)                   | `CT`        |
| AC-PAC-11-03 | A ficha arquivada não mostra "Iniciar sessão", criar plano nem nova avaliação, e mostra "Reativar paciente"                   | `CT`        |
| AC-PAC-11-04 | A colega (paciente `SHARED`) não vê "Arquivar paciente"                                                                       | `CT`        |

## 10. Como testar manualmente (Victor)

1. Crie o "Paciente Teste Arquivo" e marque um atendimento para a semana que vem.
2. Na ficha, "Arquivar paciente" → "Arquivar": aparece a segunda confirmação com "1 atendimento
   futuro". Toque em "Manter": nada muda.
3. Repita e confirme "Cancelar atendimentos e arquivar": o paciente sai da lista e a contagem
   diminui. Na Agenda, o atendimento aparece como cancelado, com o nome do paciente.
4. Filtro "Arquivados" → abra o paciente: não há "Iniciar sessão"; toque em "Reativar paciente".
5. Volte à lista: o paciente reaparece; o atendimento cancelado continua cancelado.

## 11. Riscos e perguntas em aberto

- **PP-09 (`GET /student/:id`) pode não sair na leva 3.** Padrão: `?status=ALL`.
- **Corpo do `409`:** a especificação diz "com `count`" sem o nome exato do campo. Padrão:
  `{ message: "HAS_FUTURE_APPOINTMENTS", count: number }`; ajustar na API-06.
- **Excluir paciente** não existe na API e continua fora.

## 12. Fora do escopo

Excluir paciente; reativar os atendimentos cancelados; arquivar em lote; o filtro por status
clínico.
