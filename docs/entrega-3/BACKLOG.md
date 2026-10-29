# Entrega 3 — Backlog

> Tarefas refinadas da Entrega 3. Leia antes: [AGENTS.md](../../AGENTS.md),
> [PROJECT.md](../PROJECT.md), o [Roadmap da Entrega 3](ROADMAP.md) e o
> [CONTEXTO-SESSAO](../CONTEXTO-SESSAO.md). O estado de cada tarefa fica no
> [TRACKING](TRACKING.md).
>
> **Fonte do design:** o mesmo Figma Make da Entrega 2
> ([`L7sCNfMhrzOzhtlNpS3cHr`](https://www.figma.com/make/L7sCNfMhrzOzhtlNpS3cHr/Receive-.fig-files)).
> Telas sem desenho no Make usam o design system de `src/components/ds` (G-18, G-38).

> **Atualização 2026-10-29:** o backend entregou o domínio de planos e os pequenos pedidos
> ([BACKEND-ENTREGUE](BACKEND-ENTREGUE.md), com a conferência do Swagger). As fichas de AGE-03,
> AGE-04, PAC-06, PAC-07, REC-02 e do bloco de planos foram reescritas com o contrato real, e
> entraram API-03, SES-05 e FEC-04. O registro rota a rota no `PROJECT.md` ficou para depois, a
> pedido do usuário; até lá, o BACKEND-ENTREGUE é a referência do contrato novo.

## 1. Convenções

- **IDs:** os da [Entrega 2](../entrega-2/BACKLOG.md#1-convenções). Tarefas que vêm da
  Entrega 2 mantêm o ID (AGE-01, PAC-07, PLN-02…); as novas são FEC-01 a FEC-03 (fechamento
  da V1), PAC-08, PLN-00 e QA-06. Critérios de aceite: `AC-<tarefa>-NN`.
- **Verificação:** `UT` (unitário), `CT` (componente), `E2E`, `CMD` (comando), `MAN` (manual no
  app) e `REV` (revisão), como na [Entrega 1](../entrega-1/BACKLOG.md#1-convenções).
- **Ciclo de cada tarefa** (AGENTS §4): ler a ficha → escrever os testes dos AC → ver o
  vermelho → implementar → validar → abrir o PR. Testes ficam em `__tests__/` ao lado do
  código, **nunca dentro de `app/`**.
- **Uma tarefa = um PR**, a partir de `origin/main` (AGENTS §7).
- **API:** cada ficha lista só endpoints que existem no
  [contrato](../PROJECT.md#parte-ii--referência-global-da-api). O que o design pede e a API não
  tem fica em "Sem API (não fazer)": a tela omite o elemento, sem campo inventado e sem guardar
  o dado só no aparelho. As tarefas de planos usam o contrato que a PLN-00 vai registrar.
- **Mocks:** todo endpoint novo no app ganha um handler fiel em `src/mocks/handlers/` (dados
  fictícios), um teste de integração pelo `apiClient` real e uma seção no
  `src/mocks/README.md`.
- **Dependências:** nenhuma nova. Tudo o que as fichas usam já está no `package.json`.
- **Classes de execução** (AGENTS §3):

  | Classe | Modelo          | Uso                               |
  | ------ | --------------- | --------------------------------- |
  | A      | Opus            | Contrato e diagnóstico difícil    |
  | B      | Terra ou Sonnet | Tela ou módulo com contrato claro |
  | C      | Haiku           | Execução mecânica e comandos      |

- **Verificação padrão** (todas as tarefas de código, código de saída 0):

  ```bash
  pnpm run typecheck
  pnpm run lint
  pnpm run test
  npx prettier --check <arquivos alterados>
  python scripts/check-docs.py
  ```

## 2. Histórias

As histórias da [Entrega 2](../entrega-2/BACKLOG.md#3-histórias) continuam valendo. A Entrega 3
acrescenta uma:

| ID     | Como… quero… para…                                                                               | Tarefas |
| ------ | ------------------------------------------------------------------------------------------------ | ------- |
| US3-01 | Como profissional, quero montar meus próprios modelos de anamnese, para aplicá-los aos pacientes | PAC-08  |

| História | Tarefas na Entrega 3           |
| -------- | ------------------------------ |
| US2-02   | AGE-01, AGE-03                 |
| US2-04   | PAC-07                         |
| US2-05   | PAC-04, PAC-06                 |
| US2-06   | AGE-04 (só o início da sessão) |
| US2-07   | PLN-01, PLN-02, PLN-03         |
| US2-08   | PLN-04, PLN-05                 |
| US2-10   | ATV-02                         |
| US2-15   | REC-02, NAV-03                 |

## 3. Propriedade de arquivos compartilhados

Arquivos que mais de uma tarefa precisa alterar. Cada onda tem um único dono por arquivo; as
tarefas seguintes partem da `main` já atualizada.

| Arquivo                                                      | Tarefas, na ordem                          | O que cada uma muda                                                                     |
| ------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `src/api/types.ts`                                           | API-03 → PLN-01                            | contrato de 2026-10-29; tipos do domínio de planos                                      |
| `src/features/home/HomeScreen.tsx`                           | NAV-03 → AGE-04 → PLN-01 → PLN-05          | rotas `/patients`; "Iniciar sessão" com atendimento; "Criar plano"; cartão de sugestões |
| `src/features/patients/detail/PatientDetailScreen.tsx`       | PAC-07 → AGE-04 → PAC-06 → PAC-04          | "Editar" e responsável; "Iniciar sessão"; linha da anamnese; abas e PDI vigente         |
| `src/features/resources/ResourcesScreen.tsx`                 | PAC-08 → REC-02 → PLN-01                   | "Modelos de anamnese"; banner do perfil; "Planos com IA"                                |
| `src/features/agenda/**`                                     | AGE-01 → AGE-03 → AGE-04                   | tela; formulário e detalhe; "Iniciar sessão"                                            |
| `src/features/sessions/**` e `src/stores/session-flow.ts`    | SES-05 → AGE-04                            | caderno no `start` e na retomada; `appointmentId`                                       |
| `src/api/endpoints/plans.ts` e `src/mocks/handlers/plans.ts` | PLN-01 → PLN-02 → PLN-03 → PLN-04 → PLN-05 | leitura; geração; criação; escritas; sugestões                                          |
| `src/mocks/install.ts`                                       | todas as tarefas com handler novo          | só acrescentar a linha do handler                                                       |
| `src/mocks/README.md`                                        | todas as tarefas com endpoint novo         | só acrescentar a seção da tarefa                                                        |

## 4. Tarefas

### 4.1 Bloco A — Fechamento da V1

#### FEC-01 — Rotas da V1 ainda não exercitadas contra o backend real

- **Onda:** E3-4 · **Classe:** C (execução) com revisão B
- **Roteiro detalhado:** [testes/05-fec01-rotas-v1](testes/05-fec01-rotas-v1.md), rota a rota, com a tela que dispara, o corpo e a resposta esperados, o código envolvido, os mocks, os testes automatizados e o que verificar se falhar; decisões pendentes em [testes/00-divergencias](testes/00-divergencias.md) (item 15).
- **Dep.:** FEC-02. **Exige autorização do usuário no momento** para abrir o emulador (AGENTS §7).
- **Endpoints** (todos existem no contrato e já têm função no app):
  - `PUT /task-notebook/update`, `DELETE /task-notebook/delete/:taskNotebookId`
  - `POST /task-group/create`, `GET /task-group/list-by-educator`, `PUT /task-group/update`,
    `DELETE /task-group/delete/:taskGroupId`
  - `PUT /task/update`, `DELETE /task/delete/:id`
  - `GET /task-notebook-session/analysis/student/:studentId/history`
  - `GET /educator/get-last-sessions`
- **Escopo:**
  1. No emulador Android (Expo Go), com `EXPO_PUBLIC_USE_MOCKS=false` e a conta de teste,
     exercitar cada rota acima **pela tela que a usa** (editar e excluir caderno, grupo e
     atividade; histórico de snapshots nos relatórios do aluno).
  2. Registrar, por rota: data, tela, resultado (ok ou divergência) e captura.
  3. Cada divergência vira uma correção **num PR próprio**, com teste que reproduz o problema.
- **Fora do escopo:** agenda e anamnese (são exercitadas nas próprias tarefas); iOS (QA-04).
- **Arquivos:** `docs/entrega-2/QA-05-RELATORIO.md` (seção nova "Entrega 3"). Nenhum código.
- **AC:**
  - AC-FEC-01-01 cada rota da lista tem evidência de chamada real bem-sucedida ou uma
    divergência registrada com o PR de correção. `MAN`
  - AC-FEC-01-02 nenhuma credencial nem dado pessoal no relatório. `REV`

#### FEC-02 — Mocks desligados por padrão em desenvolvimento

- **Onda:** E3-0 · **Classe:** C
- **Dep.:** G-51 (aprovada em 2026-10-28).
- **Hoje:** `getUseMocks` em `src/config/env.ts` devolve `true` quando
  `EXPO_PUBLIC_USE_MOCKS` está ausente e o ambiente é `development`.
- **Escopo:**
  1. Variável ausente ou vazia passa a significar `false` em qualquer ambiente.
  2. `true` continua proibido em `production` (comportamento atual preservado).
  3. `.env.example` e README passam a mostrar o modo mock como opção explícita
     (`EXPO_PUBLIC_USE_MOCKS=true`), com o login fictício.
  4. Os testes que dependiam do padrão antigo passam a definir a variável explicitamente.
- **Fora do escopo:** mudar handlers de mock; mudar a URL do backend.
- **Arquivos alterados:** `src/config/env.ts`, seu teste em `src/config/__tests__/`,
  `.env.example`, `README.md` (seção de execução), `src/mocks/README.md` (primeiro parágrafo).
- **AC:**
  - AC-FEC-02-01 sem a variável, `getUseMocks` devolve `false` em `development`, `preview` e
    `production`. `UT`
  - AC-FEC-02-02 `true` em `production` continua lançando erro. `UT`
  - AC-FEC-02-03 README e `.env.example` descrevem os dois modos. `REV`

#### FEC-03 — Grupo inacessível no detalhe do caderno

- **Onda:** E3-1 · **Classe:** B
- **Dep.:** nenhuma.
- **Hoje:** `useGroupDetailData` procura o grupo em `GET /task-group/list-by-educator`. Um
  grupo de outro educador referenciado num caderno não está nessa lista, e a tela mostra
  "Não encontrado" (achado do QA-05).
- **Endpoints:** `GET /task-group/list-by-educator`, `GET /task-notebook/`.
- **Sem API (não fazer):** detalhe de grupo por id; o pedido está em
  [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md#2-pequenos-pedidos-não-são-domínio-novo) (item 16).
- **Escopo:**
  1. Distinguir "grupo não está entre os seus" de "erro ao carregar".
  2. Para o primeiro caso, mostrar o estado "Grupo indisponível" com o texto "Este grupo não
     pertence à sua conta ou foi excluído." e o botão "Voltar".
  3. No detalhe do caderno, um grupo inacessível aparece na lista sem o toque que abre o
     detalhe, com a mesma indicação.
- **Fora do escopo:** buscar grupos de outros educadores; mudar o player.
- **Arquivos alterados:** `src/features/content-detail/group/**`,
  `src/features/content-detail/notebook/NotebookDetailScreen.tsx` e testes.
- **AC:**
  - AC-FEC-03-01 grupo ausente da lista mostra "Grupo indisponível", não "Não encontrado". `CT`
  - AC-FEC-03-02 erro de rede mostra o erro com "Tentar de novo". `CT`
  - AC-FEC-03-03 no caderno, o item do grupo inacessível não navega. `CT`

#### ATV-02 — Detalhe da atividade no visual novo

- **Onda:** E3-1 · **Classe:** B · **US:** US2-10
- **Dep.:** nenhuma.
- **Hoje:** `TaskDetailScreen` usa o `AppHeader` da Entrega 1 (`@/components/AppHeader`, com
  "Abrir menu"); o resto da V1 usa `@/components/ds`.
- **Figma:** cabeçalho `AppHeader` do Make com voltar; conteúdo com `InfoCard`, `.badge` e
  `SectionTitle`.
- **Endpoints:** `GET /task/:id` (já usado).
- **Escopo:**
  1. Trocar o cabeçalho e os blocos pelo design system (`AppHeader` com `onBack`, `InfoCard`,
     `Badge`, `SectionTitle`, `DsButton`), mantendo a mídia (`AudioPlayer`, imagem).
  2. Manter as ações e os destinos atuais: "Jogar" (`/activities/{id}`), "Editar" e
     "Excluir" com confirmação.
  3. Rótulos de categoria e tipo em português, com os mapas que o app já tem.
- **Fora do escopo:** formato, habilidade e "Imprimir" (sem API); paginação.
- **Arquivos alterados:** `src/features/content-detail/task/TaskDetailScreen.tsx` e testes.
- **AC:**
  - AC-ATV-02-01 o cabeçalho é o do design system, com voltar e sem "Abrir menu". `CT`
  - AC-ATV-02-02 os testes existentes de detalhe, edição e exclusão continuam verdes, com
    asserts ajustados só ao texto novo. `CMD`
  - AC-ATV-02-03 a tela foi conferida no Expo Go contra o Make. `MAN`

### 4.2 Bloco B — Telas com API pronta

#### NAV-03 — Limpeza da Entrega 1

- **Onda:** E3-0 · **Classe:** B · **US:** US2-15
- **Dep.:** **G-47** (aprovada em 2026-10-28).
- **Escopo:**
  1. Trocar as navegações para as rotas da Entrega 1 pelas novas:
     `/students/new` → `/patients/new` e `/students/{id}` → `/patients/{id}`, em `HomeScreen`
     e `PatientsListScreen`.
  2. Remover `app/(tabs)/students.tsx`, `app/(tabs)/appointments.tsx`, `app/students/new.tsx`
     e `app/students/[id].tsx`, e suas entradas em `HIDDEN_TAB_TITLES` de
     `app/(tabs)/_layout.tsx`.
  3. Remover `src/features/students-list/**`, `src/features/student-detail/**` e
     `src/features/student-create/**`, com seus testes, **depois de confirmar com busca que
     nada fora delas os importa**.
  4. Manter: `src/features/students/**` (`useStudents`, usado pela V1), as abas escondidas
     `activities` e `reports` (são telas da V1), `src/features/appointments/**` (base da
     AGE-01) e todo `app/session/**` e `app/content/**`.
- **Fora do escopo:** renomear as abas escondidas; mudar comportamento de qualquer tela.
- **Arquivos:** os listados acima, `app/(tabs)/_layout.tsx`, `HomeScreen.tsx` (só as rotas),
  `PatientsListScreen.tsx` (só as rotas) e os testes que verificam essas rotas.
- **AC:**
  - AC-NAV-03-01 nenhuma referência a `/students` em `app/` e `src/` fora de testes
    removidos (`rg "/students" app src`). `CMD`
  - AC-NAV-03-02 typecheck, lint e testes com código 0; o número de testes cai só pelos
    arquivos removidos (registrar antes e depois). `CMD`
  - AC-NAV-03-03 Início → "Novo paciente" e "Ver ficha" abrem as telas novas. `CT`

#### AGE-01 — Tela Agenda

- **Onda:** E3-1 · **Classe:** B · **US:** US2-02
- **Dep.:** nenhuma (NAV-03 recomendada antes, sem bloquear).
- **Figma:** `AgendaScreen`
  - eyebrow "mês de ano" e título "Agenda";
  - `.date-strip` com `.date-chip` de segunda a domingo da semana, hoje ativo, com setas de
    semana anterior e seguinte;
  - `SectionTitle` "N atendimentos";
  - `.appointment` com hora (`.appointment__time`), linha e nome do paciente; o item atual
    em `--current`; concluído com `check`;
  - botão de largura total "Novo atendimento" (`plus`).
- **Endpoints:** `GET /appointment/` (filtro por dia no cliente) e `GET /student/` (nome do
  paciente).
- **Sem API (não fazer):** duração ("50 min") e tipo do atendimento ("Psicopedagogia").
- **Reaproveita:** `useAppointments`, `selectAppointmentsForDay`, `selectAppointmentDayKeys`
  e `selectDaySummary` de `src/features/appointments/**`; datas em `America/Sao_Paulo`
  (G-13).
- **Escopo:**
  1. Substituir o placeholder de `app/(tabs)/agenda.tsx` pela tela.
  2. Lista do dia escolhido, em ordem de horário; o item atual é o próximo `PENDING` do dia
     de hoje.
  3. Status vindo da API: `COMPLETED` mostra "Concluído"; `CANCELLED` mostra "Cancelado" e
     fica esmaecido.
  4. Tocar num item abre `/agenda/{id}` (AGE-03); "Novo atendimento" abre `/agenda/new`
     com o dia escolhido como parâmetro `date`.
  5. Estados: carregando, erro com "Tentar de novo", dia sem atendimentos ("Nenhum
     atendimento neste dia") e offline com dados salvos (padrão `PendingBanner` da Início).
- **Fora do escopo:** formulário e detalhe (AGE-03); iniciar sessão (AGE-04); visão mensal.
- **Arquivos novos:** `src/features/agenda/AgendaScreen.tsx`,
  `src/features/agenda/components/**`, `src/features/agenda/__tests__/**`.
- **Arquivos alterados:** `app/(tabs)/agenda.tsx`.
- **AC:**
  - AC-AGE-01-01 a faixa mostra a semana atual com hoje ativo e navega para as semanas
    vizinhas. `CT`
  - AC-AGE-01-02 trocar o dia refaz a lista e a contagem "N atendimentos". `CT`
  - AC-AGE-01-03 o item atual é o próximo `PENDING` de hoje, no fuso de SP. `UT`
  - AC-AGE-01-04 tocar num item navega para `/agenda/{id}`; "Novo atendimento" para
    `/agenda/new?date=AAAA-MM-DD`. `CT`
  - AC-AGE-01-05 os estados vazio, erro e carregando aparecem. `CT`

#### API-03 — Tipos e mocks do contrato de 2026-10-29

- **Onda:** E3-2 · **Classe:** B
- **Dep.:** nenhuma.
- **Base de:** as tarefas que usam o contrato novo (atendimento, sessão, paciente, perfil e grupo).
- **Contrato:** [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md) §6 e §9.
- **Escopo:**
  1. `src/api/types.ts`: `Appointment` com `type`, `durationMinutes`, `observation` e
     `notifiedAt` anuláveis; `Student` com `guardianName`, `guardianPhone` e
     `guardianRelationship`; `Educator` com `profession`; `TaskNotebookSession` com
     `taskNotebookId` e `appointmentId`.
  2. Entradas dos endpoints existentes: atendimento (`type`, `durationMinutes`, `status`),
     `start` da sessão (`taskNotebookId`, `appointmentId`) e cadastro de aluno (`guardian*`, só
     quando preenchidos). `scheduledAt` sempre em ISO UTC.
  3. **Privacidade (D1):** `listStudents` e `createStudent` removem `educators` (traz senha de
     educador) antes de devolver, para não ir ao cache persistido.
  4. Mocks fiéis com os campos novos; `POST /appointment/` e `PUT /appointment/:id` devolvem o
     formato do `GET`.
- **Fora do escopo:** telas; transições de status e conflito no mock (AGE-03).
- **Arquivos alterados:** `src/api/types.ts`, `src/api/endpoints/appointment.ts`,
  `src/api/endpoints/session.ts`, `src/api/endpoints/student.ts`,
  `src/api/endpoints/student-create.ts`, `src/mocks/fixtures.ts`,
  `src/mocks/handlers/appointment.ts`, `src/mocks/handlers/student.ts`,
  `src/mocks/handlers/student-create.ts`, `src/mocks/handlers/educator.ts`,
  `src/mocks/handlers/session-analysis.ts`, `src/mocks/README.md` e testes.
- **AC:**
  - AC-API-03-01 typecheck, lint e suíte completa com código 0. `CMD`
  - AC-API-03-02 `listStudents` e `createStudent` não devolvem `educators`. `UT`
  - AC-API-03-03 mocks de atendimento devolvem `durationMinutes` e aceitam `type` e
    `durationMinutes`; respostas sem campos `_`. `UT`
  - AC-API-03-04 o cadastro só envia `guardian*` quando preenchidos. `UT`

#### AGE-02 — Lembrete pelo WhatsApp com mensagem pronta

- **Onda:** E3-5 · **Classe:** B · **US:** US2-03
- **Dep.:** PAC-07 (telefone do responsável) e AGE-04 (dona anterior de `HomeScreen` e do detalhe
  do atendimento).
- **Decisão do usuário (2026-10-29, G-53):** sem API de envio. O botão abre o WhatsApp do
  aparelho pelo link `https://wa.me/<telefone>?text=<mensagem>`, com a mensagem já escrita; quem
  envia é o profissional. Nada é registrado no backend.
- **Telefone:** `guardianPhone` do paciente quando existir, senão `phonenumber`; só dígitos, com o
  código do país `55` na frente quando não vier. Sem telefone, o botão fica desabilitado com a dica
  "Paciente sem telefone cadastrado".
- **Mensagens** (data e hora no fuso de São Paulo; sem o nome do responsável, começa com "Olá!"):
  - lembrete de atendimento: "Olá, {responsável}! Passando para lembrar do atendimento de
    {paciente} na {dia da semana}, {dd/mm}, às {hh:mm}. Qualquer imprevisto, é só avisar por
    aqui." ("no sábado" e "no domingo"; "na" nos demais dias);
  - contato pela ficha: "Olá, {responsável}! Tudo bem? Aqui é {educador}, do acompanhamento de
    {paciente}." (sem o nome do educador: "Olá, {responsável}! Tudo bem? Falo sobre o
    acompanhamento de {paciente}.").
- **Escopo:**
  1. Uma função pura que monta o link (telefone e texto codificado) e as duas mensagens, com
     testes unitários (acentos, nomes ausentes, telefone com e sem `55`, máscara).
  2. **Detalhe do atendimento** `PENDING`: botão "Enviar lembrete pelo WhatsApp".
  3. **Agenda de hoje na Início:** o ícone "Notificar responsável" (`IconButton` `message`) em
     cada item pendente da linha do tempo, com a mesma mensagem.
  4. **Ficha do paciente:** o botão de contato passa a abrir o WhatsApp com a mensagem de contato.
  5. Sem WhatsApp instalado, o link abre no navegador (comportamento do `wa.me`); se o
     `Linking` falhar, mostrar "Não foi possível abrir o WhatsApp".
- **Fora do escopo:** envio automático, registro do envio, modelos de mensagem editáveis.
- **Arquivos novos:** `src/utils/whatsapp.ts` e testes.
- **Arquivos alterados:** `src/features/agenda/detail/AppointmentDetailScreen.tsx`,
  `src/features/home/HomeScreen.tsx` (só a linha do tempo),
  `src/features/patients/detail/PatientDetailScreen.tsx` (só o contato) e testes.
- **AC:**
  - AC-AGE-02-01 o link usa o telefone do responsável, depois o do paciente, só com dígitos e `55`. `UT`
  - AC-AGE-02-02 as mensagens saem com nome, dia, data e hora corretos, e "Olá!" sem nome. `UT`
  - AC-AGE-02-03 os três pontos abrem o link certo pelo `Linking`. `CT`
  - AC-AGE-02-04 sem telefone, o botão fica desabilitado com a dica. `CT`

#### AGE-03 — Novo, detalhe, editar, remarcar, cancelar e excluir atendimento

- **Onda:** E3-3 · **Classe:** B · **US:** US2-02
- **Dep.:** AGE-01 (concluída) e API-03.
- **Figma:** `SimpleFormScreen` (atendimento): eyebrow "Agendamento", título "Novo
  atendimento", campos Paciente (seleção), Data e Horário (`.field-grid`), Tipo de atendimento,
  botão "Agendar atendimento".
- **Endpoints** ([BACKEND-ENTREGUE](BACKEND-ENTREGUE.md) §6 "Atendimento"):
  - `POST /appointment/` — `studentId`, `scheduledAt` (ISO UTC), `observation?`, `type?` (1–50),
    `durationMinutes?` (15–240, padrão 50)
  - `GET /appointment/:id` — detalhe (inexistente: `400 NOT_FOUND`)
  - `PUT /appointment/:id` — `scheduledAt?`, `observation?` (`null` limpa), `type?`,
    `durationMinutes?`, `status?`
  - `DELETE /appointment/:id` — excluir (responde o texto `OK`)
  - `GET /student/` — seleção de paciente
- **Regras do backend que a tela segue:**
  - status: `PENDING → COMPLETED | CANCELLED` e `CANCELLED → PENDING`; `COMPLETED` é final
    (`409 INVALID_STATUS_TRANSITION`);
  - `CANCELLED` e `COMPLETED` não aceitam mudar horário, tipo ou duração
    (`409 APPOINTMENT_NOT_EDITABLE`); a observação pode mudar;
  - reativar e remarcar podem ir juntos: `{ status: "PENDING", scheduledAt }`;
  - conflito com outro `PENDING`: `409 { message: "APPOINTMENT_CONFLICT",
conflictingAppointmentId }`; horários encostados não conflitam.
- **Sem API (não fazer):** "Confirmar por WhatsApp" por atendimento.
- **Escopo:**
  1. **Novo** (`/agenda/new`): paciente, data e horário obrigatórios; tipo (texto livre, com
     sugestões "Psicopedagogia" e "Avaliação") e duração (padrão 50 min) opcionais; observação
     opcional. Aceita `?studentId=` e `?date=` para pré-preencher.
  2. **Detalhe** (`/agenda/{id}`): paciente (toque abre `/patients/{id}`), data, horário, tipo,
     duração, status e observação; ações conforme o status:
     - `PENDING`: "Remarcar", "Editar", "Marcar como concluído", "Cancelar atendimento" e
       "Excluir";
     - `CANCELLED`: "Reativar" (com remarcação opcional), "Editar observação" e "Excluir";
     - `COMPLETED`: "Editar observação".
  3. **Editar e remarcar** (`/agenda/{id}/edit`) usam o formulário do item 1 e enviam **só os
     campos alterados**; o paciente não muda.
  4. **Cancelar** pede confirmação ("O atendimento fica na agenda como cancelado.") e envia
     `status: "CANCELLED"`. **Excluir** pede confirmação ("Excluir atendimento? Ele sai da agenda
     e não pode ser recuperado.").
  5. **Conflito:** a mensagem "Já existe um atendimento nesse horário" aparece no campo de
     horário, com o link "Ver atendimento" para `/agenda/{conflictingAppointmentId}`.
  6. A Agenda (AGE-01) passa a mostrar o tipo e a duração de cada item ("14:00 · 50 min").
  7. Erros: `400 NOT_FOUND` mostra "Atendimento não encontrado" com "Voltar"; os `409` mostram
     a mensagem correspondente; sem reenvio automático.
  8. Mocks: transições de status, `APPOINTMENT_NOT_EDITABLE` e `APPOINTMENT_CONFLICT` acionáveis.
- **Fora do escopo:** "Iniciar sessão" no detalhe (AGE-04); recorrência; lembretes.
- **Arquivos novos:** `app/agenda/new.tsx`, `app/agenda/[id].tsx`, `app/agenda/[id]/edit.tsx`,
  `src/features/agenda/form/**`, `src/features/agenda/detail/**` e testes.
- **Arquivos alterados:** `src/features/agenda/AgendaScreen.tsx` (tipo e duração no item),
  `src/api/endpoints/appointment.ts` (`getAppointment`, se faltar),
  `src/features/appointments/mutations.ts`, `src/mocks/handlers/appointment.ts`,
  `src/mocks/README.md` e testes.
- **AC:**
  - AC-AGE-03-01 criar envia `studentId`, `scheduledAt` em ISO UTC e os opcionais só quando
    preenchidos; o item aparece na Agenda e na Início. `CT`
  - AC-AGE-03-02 editar e remarcar enviam só os campos alterados. `CT`
  - AC-AGE-03-03 cancelar e excluir só chamam a API depois da confirmação; cancelar envia
    `status: "CANCELLED"`. `CT`
  - AC-AGE-03-04 as ações do detalhe seguem o status (`PENDING`, `CANCELLED`, `COMPLETED`). `CT`
  - AC-AGE-03-05 `APPOINTMENT_CONFLICT` aparece no campo de horário com o link para o
    conflitante. `CT`
  - AC-AGE-03-06 `?studentId` e `?date` pré-preenchem o formulário. `CT`

#### AGE-04 — Iniciar sessão a partir do atendimento

- **Onda:** E3-4 · **Classe:** B · **US:** US2-06
- **Dep.:** AGE-03 e SES-05 (dona da store e do `start`).
- **Endpoints:** `POST /task-notebook-session/start` com `appointmentId?`
  ([BACKEND-ENTREGUE](BACKEND-ENTREGUE.md) §6 "Sessão ligada ao caderno"). O `finish` de uma
  sessão iniciada com `appointmentId` marca o atendimento como `COMPLETED`.
- **Escopo:**
  1. Início (hero do próximo atendimento) e detalhe do atendimento `PENDING`: "Iniciar sessão"
     abre `/session/student?studentId={paciente}&appointmentId={atendimento}`.
  2. Ficha do paciente: "Iniciar sessão" abre `/session/student?studentId={paciente}` (sem
     atendimento).
  3. O fluxo de sessão guarda o `appointmentId` e o envia no `start` (pela interface criada na
     SES-05).
  4. Depois do encerramento, as consultas de atendimentos são invalidadas, para a Agenda e a
     Início mostrarem "Concluído".
- **Fora do escopo:** marcar o atendimento como concluído pelo app (o backend faz no `finish`).
- **Arquivos alterados:** `src/features/home/HomeScreen.tsx`,
  `src/features/patients/detail/PatientDetailScreen.tsx`, `src/features/agenda/detail/**`,
  `src/features/sessions/**` e `src/stores/session-flow.ts` (só o `appointmentId`) e testes.
- **AC:**
  - AC-AGE-04-01 os três pontos navegam com os parâmetros certos. `CT`
  - AC-AGE-04-02 o `start` envia o `appointmentId` quando a sessão veio de um atendimento. `UT`
  - AC-AGE-04-03 depois do `finish`, a Agenda mostra o atendimento como concluído (consulta
    invalidada). `CT`
  - AC-AGE-04-04 atendimento que não está `PENDING` não mostra "Iniciar sessão". `CT`

#### SES-05 — Sessão ligada ao caderno (G-06)

- **Onda:** E3-3 · **Classe:** B · **US:** US2-06
- **Dep.:** API-03.
- **Endpoints:** `POST /task-notebook-session/start` com `taskNotebookId?`; sessões e listagens
  devolvem `taskNotebookId` e `appointmentId`; `answer` recusa tarefa fora do caderno
  (`400 TASK_NOT_IN_NOTEBOOK`). Sessão sem caderno continua válida.
- **Hoje:** o player usa o caderno guardado só no aparelho (`resolveSessionTasks`, provisória
  da G-06).
- **Escopo:**
  1. Ao iniciar com um **caderno**, enviar `taskNotebookId` no `start`. Grupo ou atividade
     avulsa continuam sem caderno (o backend não tem esse vínculo).
  2. Na **retomada** (SES-03), quando a sessão do servidor tem `taskNotebookId`, o player usa
     esse caderno, mesmo em outro aparelho; sem ele, mantém o comportamento atual.
  3. Remover a marcação "provisória G-06" de `resolveSessionTasks` onde o contrato agora cobre.
  4. Preparar a store para guardar `appointmentId` (usado pela AGE-04).
- **Arquivos alterados:** `src/features/sessions/**`, `src/stores/session-flow.ts`,
  `src/mocks/handlers/session-analysis.ts` e testes.
- **AC:**
  - AC-SES-05-01 iniciar com caderno envia `taskNotebookId`; com grupo ou atividade, não. `UT`
  - AC-SES-05-02 a retomada usa o `taskNotebookId` da sessão do servidor. `CT`
  - AC-SES-05-03 `TASK_NOT_IN_NOTEBOOK` mostra mensagem neutra, sem travar o player. `CT`

#### PAC-07 — Editar paciente e responsável

- **Onda:** E3-3 · **Classe:** B · **US:** US2-04
- **Dep.:** API-03.
- **Endpoints:** `PUT /student/update/:id` (multipart, campos opcionais), agora com
  `guardianName` (até 100), `guardianPhone` (7–15, **só dígitos**) e `guardianRelationship`
  (até 50); vazio é tratado como não enviado. Os três voltam nas respostas (`null` quando vazios).
- **Escopo:**
  1. `updateStudent(id, input)` em `src/api/endpoints/student-update.ts`, com handler de mock
     fiel (inclusive `404 STUDENT_NOT_FOUND` e `400 STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`) e
     teste de integração; remove `educators` da resposta (D1).
  2. `PatientFormScreen` ganha a seção "Responsável" (nome, telefone e parentesco, opcionais) no
     cadastro e na edição; o telefone é digitado com máscara e **enviado só com dígitos**.
  3. Modo edição: preenche os campos, título "Editar paciente", botão "Salvar alterações", envia
     **só os campos alterados**; nada alterado deixa o botão desabilitado.
  4. Rota `app/patients/[id]/edit.tsx`; "Editar" da ficha abre essa rota.
  5. Ficha: "Responsável: {nome} ({parentesco})" no resumo quando houver; o botão de contato usa
     `guardianPhone` quando existir, senão `phonenumber`.
- **Arquivos novos:** `src/api/endpoints/student-update.ts`,
  `src/mocks/handlers/student-update.ts`, `app/patients/[id]/edit.tsx` e testes.
- **Arquivos alterados:** `src/features/patients/form/PatientFormScreen.tsx`,
  `src/api/endpoints/student-create.ts` (só repassar `guardian*`),
  `src/features/patients/detail/PatientDetailScreen.tsx` (Editar, responsável e contato),
  `src/mocks/install.ts`, `src/mocks/README.md` e testes.
- **AC:**
  - AC-PAC-07-01 a edição envia só os campos alterados; `learningTopics` como string JSON. `UT`
  - AC-PAC-07-02 o telefone do responsável sai só com dígitos. `UT`
  - AC-PAC-07-03 depois de salvar, a ficha e a lista mostram o dado novo. `CT`
  - AC-PAC-07-04 o contato usa o telefone do responsável quando houver. `CT`
  - AC-PAC-07-05 erro da API mostra a mensagem e mantém o formulário preenchido. `CT`

#### PAC-08 — Modelos de anamnese

- **Onda:** E3-2 · **Classe:** B · **US:** US3-01
- **Dep.:** **G-50** (aprovada em 2026-10-28).
- **Por quê:** os modelos são por educador. Sem esta tarefa, um educador novo não tem modelo
  para preencher na PAC-06.
- **Endpoints:** `GET /anamnese/templates/`, `GET /anamnese/templates/:templateId`,
  `POST /anamnese/templates/`, `PUT /anamnese/templates/:templateId`,
  `DELETE /anamnese/templates/:templateId`.
- **Regras do contrato:** título de 1 a 200; descrição até 1000; perguntas `Descriptive`,
  `MultipleChoice`, `Checkbox` e `FileUpload`; `MultipleChoice` e `Checkbox` com pelo menos 2
  opções; **modelo com respostas não pode ser editado nem excluído**
  (`400 TEMPLATE_HAS_RESPONSES`).
- **Escopo:**
  1. **Lista** (`/anamnese/templates`): título, descrição e número de perguntas; "Novo
     modelo"; estado vazio "Nenhum modelo de anamnese".
  2. **Formulário** (`/anamnese/templates/new` e `/anamnese/templates/{id}`): título,
     descrição e perguntas (texto, tipo, obrigatória, opções quando o tipo pede), com
     adicionar, remover e reordenar (subir e descer).
  3. `TEMPLATE_HAS_RESPONSES` ao salvar ou excluir mostra "Este modelo já tem respostas e não
     pode ser alterado."
  4. Acesso por Recursos ("Modelos de anamnese", no grupo "Avaliação e conteúdo") e pela
     tela de anamnese do paciente (PAC-06).
- **Fora do escopo:** modelos prontos fornecidos pelo app; duplicar modelo.
- **Arquivos novos:** `app/anamnese/templates/index.tsx`, `app/anamnese/templates/new.tsx`,
  `app/anamnese/templates/[id].tsx`, `src/features/anamnese/templates/**`,
  `src/mocks/handlers/anamnese-templates.ts` e testes.
- **Arquivos alterados:** `src/api/endpoints/anamnese.ts` (funções de template),
  `ResourcesScreen.tsx` (um item), `src/mocks/install.ts`, `src/mocks/README.md`.
- **AC:**
  - AC-PAC-08-01 a validação do cliente segue as regras do contrato (opções mínimas,
    tamanhos). `UT`
  - AC-PAC-08-02 criar e editar enviam o corpo do contrato, com `options` só nos tipos de
    escolha. `CT`
  - AC-PAC-08-03 `TEMPLATE_HAS_RESPONSES` mostra a mensagem e não perde o formulário. `CT`
  - AC-PAC-08-04 excluir pede confirmação. `CT`

#### PAC-06 — Anamnese do paciente

- **Onda:** E3-6 · **Classe:** B · **US:** US2-05
- **Dep.:** AGE-04 e PAC-07 (donos anteriores de `PatientDetailScreen`) e PAC-08.
- **Figma:** só o destino "Ver síntese"; tela montada com o design system (G-18).
- **Endpoints:**
  - `GET /anamnese/templates/` e `GET /anamnese/templates/:templateId`
  - `POST /anamnese/templates/:templateId/responses` — `studentId` e `answers`
  - `PUT /anamnese/responses/:responseId` — mesma lista `answers` da criação; grava `updatedAt`
    e mantém `answeredAt` (novo em 2026-10-29)
  - `POST /anamnese/responses/upload-file` — arquivo de pergunta `FileUpload` (até 10 MB)
  - `GET /anamnese/responses/student/:studentId` e `GET /anamnese/responses/:responseId`
- **Peculiaridade (D4):** `GET /anamnese/responses/:responseId` de outro educador devolve
  **401** `Unauthorized`; nessa rota o 401 **não** desloga o usuário, mostra "Sem acesso a esta
  anamnese". O `PUT` devolve 403.
- **Sem API (não fazer):** síntese dedicada da anamnese.
- **Escopo:**
  1. Tela `/patients/{id}/anamnese`: respostas do paciente (modelo e "Respondida em …",
     "Editada em …" quando houver), com toque para ver as respostas.
  2. "Nova anamnese": escolher o modelo e preencher; cada tipo usa o campo certo
     (`Descriptive` → texto; `MultipleChoice` → uma opção; `Checkbox` → várias;
     `FileUpload` → seletor de documento com upload antes do envio).
  3. "Editar" numa resposta reabre o formulário preenchido e envia o `PUT` com a lista completa.
  4. Obrigatórias validadas no cliente; os erros `MISSING_*` e `INVALID_*` aparecem na pergunta
     quando possível.
  5. Sem modelo: estado vazio com "Criar modelo" (abre PAC-08).
  6. Na ficha do paciente, a linha "Anamnese" com a data da última resposta abre a tela.
  7. Nenhum texto de resposta em log.
- **Arquivos novos:** `app/patients/[id]/anamnese.tsx`, `src/features/anamnese/responses/**`,
  `src/api/endpoints/anamnese-responses.ts`, `src/mocks/handlers/anamnese-responses.ts` e testes.
- **Arquivos alterados:** `src/features/patients/detail/PatientDetailScreen.tsx` (a linha
  "Anamnese"), `src/mocks/install.ts`, `src/mocks/README.md`.
- **AC:**
  - AC-PAC-06-01 cada tipo de pergunta envia só o campo do seu tipo. `UT`
  - AC-PAC-06-02 pergunta `FileUpload` faz o upload e envia a URL devolvida. `CT`
  - AC-PAC-06-03 obrigatória vazia bloqueia o envio com a mensagem no campo. `CT`
  - AC-PAC-06-04 editar envia o `PUT` com a lista completa e mostra "Editada em". `CT`
  - AC-PAC-06-05 o 401 do detalhe de resposta não desloga. `CT`

#### REC-02 — Perfil e conta

- **Onda:** E3-3 · **Classe:** B · **US:** US2-15
- **Dep.:** API-03.
- **Hoje:** o banner de Recursos leva a "Em breve" e **não existe botão "Sair" no app**.
- **Endpoints:** `GET /educator/me` (agora com `profession`), `PUT /educator/update-educator`
  (`newName?`, `newContact?`, `newProfession?`, de 3 a 100) e `PUT
/educator/update-profile-picture` (multipart `photo`, até 5 MB).
- **Peculiaridade (D3):** a resposta do `update-educator` vem com campos prefixados (`_name`…)
  e inclui `_password`. O app **não lê** essa resposta: depois de salvar, recarrega `GET
/educator/me`, e nada da resposta vai para log ou cache.
- **Sem API (não fazer):** troca de senha (G-49; o backend não entregou nesta etapa).
- **Escopo:**
  1. Tela `/profile`: foto (com `ImagePickerField`), nome, e-mail (somente leitura), contato e
     profissão.
  2. "Salvar" envia só o que mudou; a foto é enviada na hora em que é escolhida.
  3. "Sair" pede confirmação, chama `logout` da store de autenticação (limpa token, cache e fluxo
     de sessão, G-04) e volta para o login.
  4. O banner de Recursos abre `/profile` e mostra a foto e a profissão quando houver.
- **Arquivos novos:** `app/profile.tsx`, `src/features/profile/**`,
  `src/api/endpoints/educator-update.ts`, `src/mocks/handlers/educator-update.ts` e testes.
- **Arquivos alterados:** `src/features/resources/ResourcesScreen.tsx` (banner),
  `src/mocks/install.ts`, `src/mocks/README.md`.
- **AC:**
  - AC-REC-02-01 salvar envia só os campos alterados; validação de 3 a 100. `CT`
  - AC-REC-02-02 depois de salvar, os dados vêm de um novo `GET /educator/me`. `CT`
  - AC-REC-02-03 a foto escolhida é enviada como `photo` e aparece no perfil e no banner. `CT`
  - AC-REC-02-04 "Sair" só desloga depois da confirmação e leva ao login. `CT`
  - AC-REC-02-05 depois de sair, o cache de consultas está vazio. `UT`

#### FEC-04 — Grupo de caderno pelo `GET /task-group/:id`

- **Onda:** E3-3 · **Classe:** B
- **Dep.:** API-03; FEC-03 (concluída).
- **Endpoint:** `GET /task-group/:id` — devolve o grupo quando ele é do educador **ou** está num
  caderno do educador; fora disso `403 UNAUTHORIZED`; inexistente `404 TASK_GROUP_NOT_FOUND`.
- **Escopo:**
  1. `getTaskGroupById(id)` em `src/api/endpoints/content.ts`, com handler de mock fiel e teste
     de integração.
  2. O detalhe do grupo usa essa rota: um grupo de outro educador num caderno do usuário abre
     normalmente (somente leitura: sem "Editar" e "Excluir").
  3. "Grupo indisponível" (FEC-03) fica só para `403` e `404`.
  4. No caderno, o item volta a navegar para todos os grupos; o selo "Indisponível" sai.
- **Arquivos alterados:** `src/api/endpoints/content.ts`, `src/features/content-detail/group/**`,
  `src/features/content-detail/notebook/NotebookDetailScreen.tsx`, `src/mocks/handlers/content.ts`
  e testes.
- **AC:**
  - AC-FEC-04-01 grupo de outro educador num caderno abre o detalhe, sem editar e excluir. `CT`
  - AC-FEC-04-02 `403` e `404` mostram "Grupo indisponível". `CT`

### 4.3 Bloco C — Planos com IA

O backend entregou o domínio em 2026-10-29. O contrato (entidades, regras, rotas e erros) está
em [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md) §2 a §5, conferido com o Swagger (§9). Regras que
valem para todas as fichas:

- só o educador dono do paciente acessa os planos (`403 UNAUTHORIZED`); inexistente é `404`;
- um PDI ativo por paciente (`409 ACTIVE_PDI_ALREADY_EXISTS` com `activePlanId`);
- só plano `ACTIVE` aceita edição, metas, revisão e sugestão (`409 PLAN_NOT_EDITABLE`);
  encerrar é definitivo e **não há exclusão**;
- o progresso vem pronto do servidor (`progress.percent`); o app não calcula;
- datas sem hora em `AAAA-MM-DD`; campos opcionais do plano vêm **ausentes**, não `null`;
- rotas de IA com `AI_TIMEOUT_MS` (90 s, G-46), carregamento, erro e sem reenvio automático.

#### PLN-00 — Contrato do domínio de planos

- **Onda:** E3-0 · **Classe:** A
- **Estado:** concluída em 2026-10-29: o backend publicou o domínio e o contrato está em
  [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md). O registro rota a rota no `PROJECT.md` e o
  `docs/contracts/planos.md` ficaram para depois, a pedido do usuário.
- **AC:**
  - AC-PLN-00-01 cada rota usada pelas fichas de planos está documentada, com resposta e erros
    (BACKEND-ENTREGUE §3 a §5). `REV`
  - AC-PLN-00-02 as fichas PLN-01 a PLN-05 e PAC-04 ajustadas ao contrato real. `REV`

#### PLN-01 — Lista de planos

- **Onda:** E3-6 · **Classe:** B · **US:** US2-07
- **Dep.:** API-03; AGE-04 (dona anterior de `HomeScreen`) e REC-02 (de `ResourcesScreen`).
- **Figma:** `PlansScreen` (`mode=hub`): "Planos com IA" com eyebrow "PDI e planejamento
  educacional"; `AIHero` "Planejamento conectado à evolução real" com "Criar novo plano";
  "Em andamento" com um `InfoCard` por plano.
- **Endpoints:** `GET /plan/` com `studentId?`, `status?` e `type?` → `PlanSummary[]` (todos os
  campos do plano menos `goals`, mais `studentName`), `ACTIVE` primeiro.
- **Escopo:**
  1. Tipos do domínio (`Plan`, `PlanSummary`, `PlanGoal`, `PlanProgress`, `PlanReview`,
     `PlanDraft`, `PlanSuggestion` e as uniões) em `src/api/types.ts`, e as funções de leitura em
     `src/api/endpoints/plans.ts` (`listPlans(filtros)` e `getPlan(id)`), com handlers de mock
     fiéis e testes de integração.
  2. Tela `/plans`: seções "Em andamento" (`ACTIVE`) e "Encerrados"; cada item mostra paciente,
     tipo (PDI ou PE), título, `progress.percent` e a próxima revisão; filtro por tipo.
  3. Cada item abre `/plans/{id}`; "Criar novo plano" abre `/plans/new`.
  4. Atalhos: "Criar plano" da Início abre `/plans/new` e "Planos com IA" de Recursos abre
     `/plans`.
  5. Estados: carregando, erro, vazio ("Nenhum plano ainda") e offline.
- **Arquivos novos:** `app/plans/index.tsx`, `src/features/plans/hub/**`,
  `src/api/endpoints/plans.ts`, `src/mocks/handlers/plans.ts` e testes.
- **Arquivos alterados:** `src/api/types.ts`, `src/features/home/HomeScreen.tsx` e
  `src/features/resources/ResourcesScreen.tsx` (só os destinos), `src/mocks/install.ts`,
  `src/mocks/README.md`.
- **AC:**
  - AC-PLN-01-01 a lista mostra os planos com `progress.percent` e revisão, ativos primeiro. `CT`
  - AC-PLN-01-02 os destinos de item, "Criar novo plano", Início e Recursos estão certos. `CT`
  - AC-PLN-01-03 vazio, erro e carregando aparecem. `CT`

#### PLN-02 — Gerar plano com IA

- **Onda:** E3-7 · **Classe:** B · **US:** US2-07
- **Dep.:** PLN-01.
- **Figma:** `PlansScreen` (`mode=generate`): "Novo planejamento" com o paciente no eyebrow;
  `SegmentedControl` PDI / PE da sessão; "Foco do planejamento"; `AIContext` "Contexto
  conectado"; "Dificuldades consideradas" (`CheckList`); "Duração de referência" (3 ou 6 meses);
  "Gerar planejamento com IA" (`sparkles`).
- **Endpoint:** `POST /plan/generate` — `studentId`, `type`, `focus` (1–1000),
  `consideredDifficulties` (1–20 itens de 1–100), `durationMonths` (3 ou 6, obrigatório no PDI),
  `sessionDate` (obrigatório no PE), `parentPlanId?` (PE), `includeAnamnesisTemplateId?` →
  `200 PlanDraft` (não salva). Erros: `400`, `403`, `404 STUDENT_NOT_FOUND` /
  `PLAN_NOT_FOUND` / `TEMPLATE_NOT_FOUND`, `500 AI_GENERATION_FAILED` / `AI_INVALID_OUTPUT`.
- **Escopo:**
  1. Tela `/plans/new`, com `?studentId=` opcional; sem ele, o primeiro passo é escolher o
     paciente.
  2. "Dificuldades consideradas" vêm de `Student.learningTopics`, já marcadas; pelo menos uma.
  3. PDI: duração 3 ou 6 meses. PE: data da sessão (hoje por padrão) e, se o paciente tiver PDI
     ativo, ele entra como `parentPlanId` (busca com `GET /plan/?studentId=…&type=PDI&status=ACTIVE`).
  4. "Incluir anamnese" (opcional): escolhe um modelo com resposta do paciente e envia
     `includeAnamnesisTemplateId`.
  5. A geração usa `AI_TIMEOUT_MS`, mostra "Gerando o planejamento…", erro com "Tentar de novo"
     e não reenvia sozinha. O resultado abre o rascunho (PLN-03) **sem salvar**.
- **Arquivos novos:** `app/plans/new.tsx`, `src/features/plans/generate/**` e testes.
- **Arquivos alterados:** `src/api/endpoints/plans.ts` (`generatePlanDraft`),
  `src/mocks/handlers/plans.ts`.
- **AC:**
  - AC-PLN-02-01 sem paciente na rota, pede para escolher um. `CT`
  - AC-PLN-02-02 as dificuldades vêm marcadas; desmarcar todas bloqueia a geração. `CT`
  - AC-PLN-02-03 PDI envia `durationMonths`; PE envia `sessionDate` e o PDI ativo como
    `parentPlanId`. `UT`
  - AC-PLN-02-04 carregamento, erro e timeout aparecem, sem reenvio automático. `CT`

#### PLN-03 — Rascunho editável e salvar

- **Onda:** E3-8 · **Classe:** B · **US:** US2-07
- **Dep.:** PLN-02.
- **Figma:** `.generated-sheet`: "Rascunho gerado" com `Badge` "Editável"; "Plano de
  Desenvolvimento Individual"; "Objetivo geral", "Metas prioritárias" e "Ajustes do
  profissional"; "Compartilhar" e "Salvar PDI".
- **Endpoint:** `POST /plan/` com `source: "AI"`; PDI com `startDate`, `endDate` e
  `nextReviewDate?` (as datas sugeridas do rascunho); PE com `sessionDate`; `goals` de 1 a 10.
  Erros: `400 PLAN_WITHOUT_GOALS`, `TOO_MANY_GOALS`, `INVALID_DATES`, `SESSION_DATE_REQUIRED`,
  `INVALID_FIELDS_FOR_PDI`, `INVALID_PARENT_PLAN`, `INVALID_APPOINTMENT`; `409
ACTIVE_PDI_ALREADY_EXISTS` com `activePlanId`.
- **Escopo:**
  1. O rascunho aparece na mesma rota da geração: título, objetivo geral, metas (com critério de
     sucesso) e "Ajustes do profissional" (`professionalNotes`) editáveis; adicionar, remover e
     reordenar metas (1 a 10).
  2. O `rationale` da IA aparece como "Por que essas metas", somente leitura.
  3. "Salvar PDI" / "Salvar PE" envia o `POST /plan/` e abre `/plans/{id}`.
  4. `ACTIVE_PDI_ALREADY_EXISTS`: mensagem "Este paciente já tem um PDI ativo" com "Ver PDI
     ativo" (`/plans/{activePlanId}`); o rascunho não se perde.
  5. "Compartilhar" usa o `Share` nativo com uma síntese em texto.
  6. Sair com rascunho não salvo pede confirmação.
- **Arquivos novos:** `src/features/plans/draft/**` e testes.
- **Arquivos alterados:** `src/features/plans/generate/**` (só a troca para o rascunho),
  `src/api/endpoints/plans.ts` (`createPlan`), `src/mocks/handlers/plans.ts`.
- **AC:**
  - AC-PLN-03-01 título, objetivo e metas são editáveis antes de salvar; 1 a 10 metas. `CT`
  - AC-PLN-03-02 salvar envia `source: "AI"` e as datas do rascunho, e abre o detalhe. `CT`
  - AC-PLN-03-03 `ACTIVE_PDI_ALREADY_EXISTS` leva ao PDI ativo sem perder o rascunho. `CT`
  - AC-PLN-03-04 "Compartilhar" chama o `Share` com a síntese. `CT`
  - AC-PLN-03-05 sair sem salvar pede confirmação. `CT`

#### PLN-04 — Detalhe do plano

- **Onda:** E3-9 · **Classe:** B · **US:** US2-08
- **Dep.:** PLN-03.
- **Figma:** destino "Ver plano completo"; tela montada com o design system (G-18).
- **Endpoints:** `GET /plan/:id`; `PUT /plan/:id` (título, objetivo, notas, `endDate`,
  `nextReviewDate` e a lista completa de `goals`); `PUT /plan/:id/goals/:goalId` (`status`);
  `POST /plan/:id/reviews` (`note`, `nextReviewDate?`); `GET /plan/:id/reviews`;
  `PUT /plan/:id/status` (`COMPLETED` ou `CANCELLED`).
- **Limitação do backend:** o `PUT /plan/:id` não apaga `nextReviewDate` nem
  `professionalNotes` (vazio mantém o valor); a tela não oferece "limpar" esses campos.
- **Escopo:**
  1. Tela `/plans/{id}`: paciente, tipo, status, vigência, próxima revisão, objetivo geral e
     metas com status e `ProgressBar` de `progress.percent`.
  2. Mudar o status de cada meta (Não iniciada, Em andamento, Atingida, Descontinuada).
  3. "Editar plano": reabre o formulário do rascunho com os dados do plano e envia o `PUT` com a
     lista completa de metas (com `id` atualiza, sem `id` cria, ausente remove); meta atingida
     não pode ser removida (`409 GOAL_ACHIEVED_CANNOT_BE_REMOVED`).
  4. "Registrar revisão" (nota e próxima revisão) e a lista "Revisões".
  5. "Encerrar plano": escolher Concluído ou Cancelado, com confirmação ("Não é possível
     reabrir").
  6. Plano encerrado é somente leitura (sem os botões de alteração).
  7. "Plano não encontrado" (`404`) e "Sem acesso" (`403`) com "Voltar".
- **Arquivos novos:** `app/plans/[id].tsx`, `src/features/plans/detail/**` e testes.
- **Arquivos alterados:** `src/api/endpoints/plans.ts` (escritas), `src/mocks/handlers/plans.ts`,
  `src/features/plans/draft/**` (reuso no modo edição).
- **AC:**
  - AC-PLN-04-01 mostra metas, progresso, vigência e revisão do contrato. `CT`
  - AC-PLN-04-02 mudar o status de uma meta atualiza o progresso com a resposta do servidor. `CT`
  - AC-PLN-04-03 editar envia a lista completa de metas com os `id`. `UT`
  - AC-PLN-04-04 registrar revisão aparece na lista de revisões. `CT`
  - AC-PLN-04-05 encerrar pede confirmação e deixa o plano somente leitura. `CT`

#### PLN-05 — Sugestões da IA (sob demanda)

- **Onda:** E3-10 · **Classe:** B · **US:** US2-08
- **Dep.:** PLN-04.
- **Mudança do backend (G-52):** as sugestões são geradas **sob demanda**, não ao encerrar a
  sessão.
- **Endpoints:** `POST /plan/:id/suggestions/generate` (`201` com as novas, `200 []` quando o
  plano já tem 3 pendentes ou nada válido veio); `GET /plan/suggestions?status=PENDING`;
  `POST /plan/suggestions/:id/accept` (`200 Plan`; `409 SUGGESTION_NOT_APPLICABLE` descarta a
  sugestão); `POST /plan/suggestions/:id/dismiss`.
- **Escopo:**
  1. No detalhe do plano ativo, "Pedir sugestões da IA" (com `AI_TIMEOUT_MS`); `[]` mostra
     "Sem sugestões novas para este plano".
  2. Tela `/plans/suggestions`: pendentes de todos os planos (paciente, plano, texto e a mudança
     proposta), com "Aceitar" e "Descartar".
  3. `SUGGESTION_NOT_APPLICABLE`: "Esta sugestão não se aplica mais" e ela sai da lista.
  4. Cartão da Início "N sugestões da IA para revisar" com a contagem de pendentes; com zero, o
     cartão some.
- **Arquivos novos:** `app/plans/suggestions.tsx`, `src/features/plans/suggestions/**` e testes.
- **Arquivos alterados:** `src/features/plans/detail/**` (botão), `src/features/home/HomeScreen.tsx`
  (cartão), `src/api/endpoints/plans.ts`, `src/mocks/handlers/plans.ts`.
- **AC:**
  - AC-PLN-05-01 "Pedir sugestões" mostra as novas ou a mensagem de nenhuma. `CT`
  - AC-PLN-05-02 aceitar aplica no plano; descartar tira da lista. `CT`
  - AC-PLN-05-03 `SUGGESTION_NOT_APPLICABLE` remove a sugestão com a mensagem. `CT`
  - AC-PLN-05-04 a contagem da Início acompanha as pendentes. `CT`

#### PAC-04 — Aba Planos na ficha do paciente

- **Onda:** E3-8 · **Classe:** B · **US:** US2-05
- **Dep.:** PLN-01; PAC-06 (dona anterior de `PatientDetailScreen`).
- **Figma:** `PatientDetail`, `.tabs` Visão geral / Planos; na aba Planos, um `InfoCard` por
  plano e o botão "Criar novo plano".
- **Endpoint:** `GET /plan/?studentId={id}` (usa `listPlans` da PLN-01).
- **Escopo:**
  1. A ficha ganha as abas "Visão geral" (conteúdo atual) e "Planos".
  2. "Planos" lista os planos do paciente (ativos primeiro); cada um abre `/plans/{id}`;
     "Criar novo plano" abre `/plans/new?studentId={id}`.
  3. Na visão geral, o bloco "PDI vigente" mostra o PDI ativo (título, vigência e
     `progress.percent`) com "Ver plano completo"; sem PDI ativo, "Nenhum PDI ativo" com
     "Criar PDI".
  4. A aba "Avaliações" do Make **não** entra (sem API).
- **Arquivos novos:** `src/features/patients/detail/plans/**` e testes.
- **Arquivos alterados:** `src/features/patients/detail/PatientDetailScreen.tsx` e testes.
- **Restrição:** não altera a camada de API de planos; usa as funções da PLN-01.
- **AC:**
  - AC-PAC-04-01 a aba lista os planos do paciente com status. `CT`
  - AC-PAC-04-02 "Criar novo plano" leva o paciente para a geração. `CT`
  - AC-PAC-04-03 o bloco "PDI vigente" mostra o PDI ativo ou o estado vazio. `CT`
  - AC-PAC-04-04 os testes da visão geral continuam verdes. `CMD`

### 4.4 Bloco D — Qualidade

#### QA-06 — Plano de testes da Entrega 3

- **Onda:** E3-11 · **Classe:** B
- **Roteiro detalhado:** o [PLANO-TESTES](PLANO-TESTES.md) é o índice; os casos completos estão em [testes/](testes/01-agenda.md) (148 casos, 103 P1), e as divergências encontradas ao escrevê-los em [testes/00-divergencias](testes/00-divergencias.md).
- **Dep.:** blocos A, B e C concluídos (ou o que estiver pronto, registrado).
- **Escopo:** roteiro manual no formato do [plano da Entrega 1](../entrega-1/PLANO-TESTES.md):
  um caso por AC `MAN` e um por fluxo entre telas (Agenda → atendimento → sessão; ficha →
  editar; ficha → anamnese; plano: gerar → salvar → detalhe; perfil → sair).
- **Arquivos novos:** `docs/entrega-3/PLANO-TESTES.md`.
- **AC:**
  - AC-QA-06-01 todos os casos P1 passam no Android (emulador, Expo Go, backend real). `MAN`

#### QA-02 — E2E com Maestro

- **Onda:** E3-12 · **Classe:** B
- **Roteiro detalhado:** [testes/08-maestro-qa02](testes/08-maestro-qa02.md): pré-requisitos, seletores tirados do código, `testID` que faltam (com nomes propostos), fluxos M-LOGIN, M-AGE, M-PAC, M-PLN e M-PRF com asserções e o esqueleto YAML.
- **Dep.:** QA-06. A ferramenta Maestro é instalada **fora do projeto** (CLI), com autorização
  do usuário; nada entra no `package.json`.
- **Escopo:** fluxos em `.maestro/`, rodando no Expo Go do emulador:
  1. login → Início → Agenda → novo atendimento;
  2. ficha → editar paciente;
  3. gerar plano → salvar → detalhe (se o bloco C estiver pronto);
  4. perfil → sair.
- **AC:**
  - AC-QA-02-01 os fluxos passam no emulador Android, com a evidência da execução. `E2E`

#### QA-03 — Acessibilidade

- **Onda:** E3-12 · **Classe:** B
- **Roteiro detalhado:** [testes/07-acessibilidade-qa03](testes/07-acessibilidade-qa03.md): rótulos e papéis existentes, alvos de toque, contraste dos tokens e o checklist das 16 telas; suspeitas por leitura do código nos itens 25 e 26 de [testes/00-divergencias](testes/00-divergencias.md).
- **Dep.:** QA-06.
- **Escopo:** nas telas novas e alteradas da Entrega 3: leitor de tela (TalkBack), fonte
  grande, contraste e alvos de toque de 44 pontos (G-17).
- **AC:**
  - AC-QA-03-01 o checklist das telas da Entrega 3 fica sem bloqueio. `MAN`

#### QA-04 — Homologação em aparelhos

- **Onda:** E3-12 · **Classe:** B
- **Roteiro detalhado:** [testes/09-aparelhos-qa04](testes/09-aparelhos-qa04.md): matriz tela × plataforma × recurso nativo e 12 casos; riscos de iOS nos itens 27 e 28 de [testes/00-divergencias](testes/00-divergencias.md).
- **Dep.:** QA-06. **Exige** Android físico e Mac ou iPhone, com autorização do usuário.
- **Escopo:** Android físico (inclusive câmera e áudio da ATV-08) e iOS (Expo Go ou build),
  com o backend real.
- **AC:**
  - AC-QA-04-01 a matriz tela × plataforma × aparelho fica registrada; o que não foi testado
    aparece como pendência, nunca como aprovado. `MAN`

## 5. Grafo de dependências

```
G-47 → NAV-03 ✓ · G-51 → FEC-02 ✓ → FEC-01 (emulador)
FEC-03 ✓, ATV-02 ✓, AGE-01 ✓
API-03 → AGE-03 → AGE-04 (← SES-05) → AGE-02 (← PAC-07, G-53)
API-03 → SES-05 → AGE-04
API-03 → PAC-07 → AGE-04 → PAC-06 (← PAC-08) → PAC-04
API-03 → REC-02 → PLN-01
API-03 → FEC-04
G-50 → PAC-08 → PAC-06
PLN-00 ✓ → PLN-01 → PLN-02 → PLN-03 → PLN-04 → PLN-05 (G-52, sob demanda)
PLN-01 → PAC-04
blocos A–C → QA-06 → QA-02, QA-03, QA-04
```

## 6. Histórico

- 2026-10-28: criação pelo orquestrador, com o estado da `main` depois do PR #75, a escolha do
  domínio de planos (G-48) e as propostas G-47, G-49, G-50 e G-51.
- 2026-10-28: G-47, G-49, G-50 e G-51 aprovados pelo usuário; especificação para o backend em
  [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md).
- 2026-10-29: fichas reescritas com o contrato do backend (AGE-03, AGE-04, PAC-06, PAC-07,
  REC-02 e bloco de planos); novas API-03, SES-05 e FEC-04; PLN-00 concluída; G-52.
- 2026-10-29: AGE-02 volta ao escopo como botão do WhatsApp com mensagem pronta (`wa.me`), por
  decisão do usuário (G-53).
- 2026-10-29: tarefas de código concluídas (23 de 27); resumo em [ENTREGA-3](ENTREGA-3.md).
- 2026-10-29: fichas de teste (FEC-01, QA-02, QA-03, QA-04 e QA-06) ligadas aos casos detalhados em
  [testes/](testes/01-agenda.md) e às divergências encontradas.
