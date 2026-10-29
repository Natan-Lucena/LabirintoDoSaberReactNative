# Entrega 3 — Backlog

> Tarefas refinadas da Entrega 3. Leia antes: [AGENTS.md](../../AGENTS.md),
> [PROJECT.md](../PROJECT.md), o [Roadmap da Entrega 3](ROADMAP.md) e o
> [CONTEXTO-SESSAO](../CONTEXTO-SESSAO.md). O estado de cada tarefa fica no
> [TRACKING](TRACKING.md).
>
> **Fonte do design:** o mesmo Figma Make da Entrega 2
> ([`L7sCNfMhrzOzhtlNpS3cHr`](https://www.figma.com/make/L7sCNfMhrzOzhtlNpS3cHr/Receive-.fig-files)).
> Telas sem desenho no Make usam o design system de `src/components/ds` (G-18, G-38).

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

| Arquivo                                                | Tarefas, na ordem                  | O que cada uma muda                                                                    |
| ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `src/features/home/HomeScreen.tsx`                     | NAV-03 → AGE-04 → PLN-01 → PLN-05  | rotas `/patients`; `studentId` no "Iniciar sessão"; "Criar plano"; cartão de sugestões |
| `src/features/patients/detail/PatientDetailScreen.tsx` | PAC-07 → AGE-04 → PAC-06 → PAC-04  | "Editar"; `studentId` no "Iniciar sessão"; link da anamnese; abas                      |
| `src/features/resources/ResourcesScreen.tsx`           | REC-02 → PAC-08 → PLN-01           | banner do perfil; "Modelos de anamnese"; "Planos com IA"                               |
| `src/features/patients/list/PatientsListScreen.tsx`    | NAV-03                             | rotas `/patients`                                                                      |
| `src/mocks/install.ts`                                 | todas as tarefas com endpoint novo | só acrescentar a linha do handler                                                      |
| `src/mocks/README.md`                                  | todas as tarefas com endpoint novo | só acrescentar a seção da tarefa                                                       |
| `src/api/types.ts`                                     | PLN-00 (planos), PAC-06, PAC-08    | só acrescentar tipos que faltam, sem alterar os existentes                             |

## 4. Tarefas

### 4.1 Bloco A — Fechamento da V1

#### FEC-01 — Rotas da V1 ainda não exercitadas contra o backend real

- **Onda:** E3-4 · **Classe:** C (execução) com revisão B
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

#### AGE-03 — Novo, detalhe, editar, remarcar e excluir atendimento

- **Onda:** E3-2 · **Classe:** B · **US:** US2-02
- **Dep.:** AGE-01.
- **Figma:** `SimpleFormScreen` (atendimento): eyebrow "Agendamento", título "Novo
  atendimento", campos Paciente (seleção), Data e Horário (`.field-grid`), botão "Agendar
  atendimento".
- **Endpoints:**
  - `POST /appointment/` — `studentId`, `scheduledAt`, `observation?`
  - `GET /appointment/:id` — detalhe
  - `PUT /appointment/:id` — `scheduledAt?`, `observation?` (`null` limpa)
  - `DELETE /appointment/:id` — excluir
  - `GET /student/` — seleção de paciente
- **Sem API (não fazer):** tipo e duração; "Confirmar por WhatsApp"; **cancelar mantendo o
  registro** (o `PUT` não aceita `status`); validação de conflito de horário.
- **Reaproveita:** as mutações de `src/features/appointments/mutations.ts` (criar, editar,
  remarcar, excluir) e o padrão de formulário de `PatientFormScreen` (React Hook Form + Zod,
  `withOfflineGuard`); `SelectField`, `DateField`, `TimeField` e `Field` do design system.
- **Escopo:**
  1. **Novo** (`/agenda/new`): paciente obrigatório (aceita `?studentId=` e `?date=` para
     pré-preencher), data e horário obrigatórios, observação opcional. `scheduledAt` é montado
     no fuso de SP e enviado em ISO. Ao salvar: toast de sucesso, invalidação da consulta de
     atendimentos e volta para a Agenda.
  2. **Detalhe** (`/agenda/{id}`): paciente (toque abre `/patients/{id}`), data, horário,
     status e observação; ações "Remarcar", "Editar observação" e "Excluir".
  3. **Remarcar e editar observação** usam o mesmo formulário em modo edição e enviam **só os
     campos alterados**; o paciente não muda (a API não aceita).
  4. **Excluir** pede confirmação com o texto "Excluir atendimento? Ele sai da agenda e não
     pode ser recuperado." e só então chama o `DELETE`.
  5. Atendimento `COMPLETED` ou `CANCELLED` mostra o status e não oferece "Remarcar".
  6. Erros: `400 NOT_FOUND` mostra "Atendimento não encontrado" com "Voltar"; validação com
     mensagens por campo; sem reenvio automático.
- **Fora do escopo:** "Iniciar sessão" no detalhe (AGE-04); recorrência; lembretes.
- **Arquivos novos:** `app/agenda/new.tsx`, `app/agenda/[id].tsx`,
  `app/agenda/[id]/edit.tsx`, `src/features/agenda/form/**`,
  `src/features/agenda/detail/**` e testes.
- **Arquivos alterados:** `src/api/endpoints/appointment.ts` só se faltar `getAppointment`
  (`GET /appointment/:id`), com handler de mock e teste de integração.
- **AC:**
  - AC-AGE-03-01 criar envia `studentId`, `scheduledAt` (ISO, SP) e `observation` só quando
    preenchida; o item aparece na Agenda e na Início. `CT`
  - AC-AGE-03-02 remarcar envia só `scheduledAt`; editar observação envia só `observation`
    (vazia vira `null`). `CT`
  - AC-AGE-03-03 excluir só chama a API depois da confirmação. `CT`
  - AC-AGE-03-04 `COMPLETED` e `CANCELLED` não mostram "Remarcar". `CT`
  - AC-AGE-03-05 `?studentId` e `?date` pré-preenchem o formulário. `CT`

#### AGE-04 — Iniciar sessão a partir do atendimento

- **Onda:** E3-3 · **Classe:** B · **US:** US2-06
- **Dep.:** AGE-03.
- **Hoje:** "Iniciar sessão" na Início e na ficha abre `/session/student` **sem** paciente;
  o `StudentStep` já aceita `?studentId=` e pré-seleciona o paciente.
- **Endpoints:** nenhum novo (o fluxo de sessão da V1 já usa `POST /task-notebook-session/start`).
- **Sem API (não fazer):** vincular a sessão ao atendimento (`start` não recebe
  `appointmentId`) e marcar o atendimento como concluído (`PUT` não aceita `status`).
- **Escopo:**
  1. Início (hero do próximo atendimento): "Iniciar sessão" abre
     `/session/student?studentId={id do paciente}`.
  2. Ficha do paciente: "Iniciar sessão" faz o mesmo com o paciente da ficha.
  3. Detalhe do atendimento (AGE-03): botão "Iniciar sessão" para atendimento `PENDING`, com
     o mesmo destino.
  4. Nada mais muda no fluxo de sessão.
- **Fora do escopo:** alterar `src/features/sessions/**` ou a store `session-flow`.
- **Arquivos alterados:** `HomeScreen.tsx`, `PatientDetailScreen.tsx` e
  `src/features/agenda/detail/**` (só o botão e a navegação) e testes.
- **AC:**
  - AC-AGE-04-01 os três pontos navegam com o `studentId` correto. `CT`
  - AC-AGE-04-02 o passo "Paciente" abre com o paciente selecionado. `CT` (teste existente do
    `StudentStep` cobre; registrar)
  - AC-AGE-04-03 atendimento que não está `PENDING` não mostra "Iniciar sessão". `CT`

#### PAC-07 — Editar paciente

- **Onda:** E3-1 · **Classe:** B · **US:** US2-04
- **Dep.:** nenhuma.
- **Hoje:** "Editar" (em "Dificuldades mapeadas") leva a "Em breve"; o contato pelo WhatsApp
  já funciona na ficha.
- **Endpoints:** `PUT /student/update/:id` (multipart, todos os campos opcionais;
  `learningTopics`, se enviado, com pelo menos 1, como string JSON; `photo` opcional) e
  `GET /student/`.
- **Sem API (não fazer):** dados do responsável separados do paciente; status do paciente.
- **Escopo:**
  1. Nova função `updateStudent(id, input)` em `src/api/endpoints/student-update.ts`, com o
     mesmo envio multipart de `createStudent`, handler de mock fiel (inclusive
     `404 STUDENT_NOT_FOUND` e `400 STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR`) e teste de
     integração.
  2. `PatientFormScreen` ganha o modo edição: recebe o paciente, preenche os campos, troca o
     título para "Editar paciente" e o botão para "Salvar alterações", e envia **só os campos
     alterados** (nada alterado = botão desabilitado).
  3. Rota `app/patients/[id]/edit.tsx`; "Editar" da ficha passa a abrir essa rota.
  4. Ao salvar: invalida a consulta de pacientes, mostra o toast e volta para a ficha.
  5. Erros da API aparecem como mensagem, sem reenvio automático.
- **Fora do escopo:** documentos do paciente; trocar o educador; contato (já existe).
- **Arquivos novos:** `src/api/endpoints/student-update.ts`,
  `src/mocks/handlers/student-update.ts`, `app/patients/[id]/edit.tsx` e testes.
- **Arquivos alterados:** `src/features/patients/form/PatientFormScreen.tsx`,
  `PatientDetailScreen.tsx` (só o destino de "Editar"), `src/mocks/install.ts` (uma linha),
  `src/mocks/README.md` (seção).
- **AC:**
  - AC-PAC-07-01 a edição envia só os campos alterados; `learningTopics` como string JSON. `UT`
  - AC-PAC-07-02 depois de salvar, a ficha e a lista mostram o dado novo. `CT`
  - AC-PAC-07-03 o modo criação continua igual (testes existentes verdes). `CMD`
  - AC-PAC-07-04 erro da API mostra a mensagem e mantém o formulário preenchido. `CT`

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

- **Onda:** E3-4 · **Classe:** B · **US:** US2-05
- **Dep.:** AGE-04 (dono anterior de `PatientDetailScreen`) e PAC-08.
- **Figma:** só o destino "Ver síntese"; tela montada com o design system (G-18).
- **Endpoints:**
  - `GET /anamnese/templates/` e `GET /anamnese/templates/:templateId`
  - `POST /anamnese/templates/:templateId/responses` — `studentId` e `answers`
  - `POST /anamnese/responses/upload-file` — arquivo de pergunta `FileUpload` (até 10 MB)
  - `GET /anamnese/responses/student/:studentId` e `GET /anamnese/responses/:responseId`
- **Sem API (não fazer):** editar uma resposta enviada; síntese dedicada da anamnese.
- **Escopo:**
  1. Tela `/patients/{id}/anamnese`: lista das respostas do paciente (modelo e data
     "Respondida em …"), com toque para ver as respostas daquele envio (somente leitura).
  2. "Nova anamnese": escolher o modelo e preencher. Cada tipo usa o campo certo:
     `Descriptive` → texto; `MultipleChoice` → uma opção; `Checkbox` → várias;
     `FileUpload` → seletor de documento, com upload antes do envio.
  3. Obrigatórias validadas no cliente; os erros `MISSING_*` e `INVALID_*` da API aparecem
     na pergunta correspondente quando possível, senão no topo.
  4. Sem modelo: estado vazio com "Criar modelo" (abre PAC-08).
  5. Na ficha do paciente, uma linha "Anamnese" com a data da última resposta abre a tela.
  6. Nenhum texto de resposta em log.
- **Fora do escopo:** editar resposta; gerar análise por IA da anamnese (já existe nos
  relatórios do aluno).
- **Arquivos novos:** `app/patients/[id]/anamnese.tsx`, `src/features/anamnese/responses/**`,
  `src/api/endpoints/anamnese-responses.ts`, `src/mocks/handlers/anamnese-responses.ts` e
  testes.
- **Arquivos alterados:** `PatientDetailScreen.tsx` (a linha "Anamnese"),
  `src/mocks/install.ts`, `src/mocks/README.md`.
- **AC:**
  - AC-PAC-06-01 cada tipo de pergunta envia só o campo do seu tipo (`textValue`,
    `selectedOptionId`, `selectedOptionIds` ou `fileUrl`). `UT`
  - AC-PAC-06-02 pergunta `FileUpload` faz o upload e envia a URL devolvida. `CT`
  - AC-PAC-06-03 obrigatória vazia bloqueia o envio com a mensagem no campo. `CT`
  - AC-PAC-06-04 depois de enviar, a lista e a ficha mostram a nova data. `CT`

#### REC-02 — Perfil e conta

- **Onda:** E3-1 · **Classe:** B · **US:** US2-15
- **Dep.:** nenhuma.
- **Hoje:** o banner de Recursos leva a "Em breve" e **não existe botão "Sair" no app**.
- **Figma:** `.profile-banner` (nome); tela sem desenho, montada com o design system (G-18).
- **Endpoints:** `GET /educator/me`, `PUT /educator/update-educator` (`newName?` e
  `newContact?`, de 3 a 100 caracteres) e `PUT /educator/update-profile-picture` (multipart
  `photo`, até 5 MB).
- **Sem API (não fazer):** papel/profissão ("Psicopedagoga · Administradora").
- **Escopo:**
  1. Tela `/profile`: foto (com `ImagePickerField`), nome, e-mail (somente leitura) e
     contato.
  2. "Salvar" envia só o que mudou; a foto é enviada na hora em que é escolhida.
  3. "Sair" pede confirmação, chama `logout` da store de autenticação (limpa token, cache e
     fluxo de sessão, G-04) e volta para o login.
  4. O banner de Recursos abre `/profile` e mostra a foto quando houver.
  5. Erros da API aparecem como mensagem, sem reenvio automático.
- **Fora do escopo:** trocar senha (G-49); excluir conta.
- **Arquivos novos:** `app/profile.tsx`, `src/features/profile/**`, as funções
  `updateEducator` e `updateProfilePicture` em `src/api/endpoints/educator-update.ts`,
  `src/mocks/handlers/educator-update.ts` e testes.
- **Arquivos alterados:** `ResourcesScreen.tsx` (banner), `src/mocks/install.ts`,
  `src/mocks/README.md`.
- **AC:**
  - AC-REC-02-01 salvar envia só `newName` e/ou `newContact` alterados; validação de 3 a 100. `CT`
  - AC-REC-02-02 a foto escolhida é enviada como `photo` e aparece no perfil e no banner. `CT`
  - AC-REC-02-03 "Sair" só desloga depois da confirmação e leva ao login. `CT`
  - AC-REC-02-04 depois de sair, o cache de consultas está vazio. `UT`

### 4.3 Bloco C — Planos com IA

As fichas abaixo descrevem a tela e o comportamento. **Os endpoints, campos e erros vêm do
contrato que a PLN-00 registra**; até lá, nenhuma tarefa de planos começa. A lista do que foi
pedido ao backend está em [PEDIDOS-BACKEND §1](PEDIDOS-BACKEND.md#1-domínio-planos-com-ia-pdi-e-pe).

#### PLN-00 — Contrato do domínio de planos

- **Onda:** E3-0 · **Classe:** A · **Responsável:** usuário + backend; o orquestrador registra.
- **Dep.:** G-48 (resolvido).
- **Escopo:**
  1. Enviar ao backend o pedido de [PEDIDOS-BACKEND §1](PEDIDOS-BACKEND.md#1-domínio-planos-com-ia-pdi-e-pe).
  2. Quando o backend responder, registrar o contrato em `docs/PROJECT.md` (Parte II, seção
     nova de planos), no mesmo formato das outras seções: rota, autenticação, corpo,
     resposta e erros.
  3. Criar o contrato de implementação `docs/contracts/planos.md` (AGENTS §4): tipos, estados
     do plano, regras de edição, mapeamento de cada tela para as rotas e plano de testes.
  4. Ajustar as fichas PLN-01 a PLN-05 e PAC-04 ao contrato real e registrar as diferenças.
- **AC:**
  - AC-PLN-00-01 cada rota usada pelas fichas de planos está em `PROJECT.md`, com resposta
    e erros. `REV`
  - AC-PLN-00-02 `docs/contracts/planos.md` aprovado pelo orquestrador antes do primeiro
    dispatch de planos. `REV`

#### PLN-01 — Lista de planos

- **Onda:** E3-4 · **Classe:** B · **US:** US2-07
- **Dep.:** PLN-00.
- **Figma:** `PlansScreen` (`mode=hub`): "Planos com IA" com eyebrow "PDI e planejamento
  educacional"; `AIHero` "Planejamento conectado à evolução real" com "Criar novo plano";
  "Em andamento" com um `InfoCard` por plano (paciente, tipo, % e data de revisão).
- **Escopo:**
  1. Tela `/plans` com os planos do educador, conforme o contrato. As funções de leitura de
     `src/api/endpoints/plans.ts` (listar, inclusive por paciente se o contrato tiver, e
     detalhar) nascem aqui, para a PAC-04 usar sem alterar esse arquivo.
  2. Cada item abre `/plans/{id}` (PLN-04); "Criar novo plano" abre `/plans/new` (PLN-02).
  3. Atalhos: "Criar plano" da Início e "Planos com IA" de Recursos passam a abrir `/plans`.
  4. Estados: carregando, erro, vazio ("Nenhum plano ainda") e offline.
- **Fora do escopo:** "Próximas sessões planejadas" (sem pedido ao backend nesta entrega).
- **Arquivos novos:** `app/plans/index.tsx`, `src/features/plans/hub/**`,
  `src/api/endpoints/plans.ts`, `src/mocks/handlers/plans.ts` e testes.
- **Arquivos alterados:** `HomeScreen.tsx` e `ResourcesScreen.tsx` (só os destinos),
  `src/api/types.ts`, `src/mocks/install.ts`, `src/mocks/README.md`.
- **AC:**
  - AC-PLN-01-01 a lista mostra os planos do contrato com % e revisão. `CT`
  - AC-PLN-01-02 os destinos de item, "Criar novo plano", Início e Recursos estão certos. `CT`
  - AC-PLN-01-03 vazio, erro e carregando aparecem. `CT`

#### PLN-02 — Gerar plano com IA

- **Onda:** E3-5 · **Classe:** B · **US:** US2-07
- **Dep.:** PLN-01.
- **Figma:** `PlansScreen` (`mode=generate`): "Novo planejamento" com o paciente no eyebrow;
  `SegmentedControl` PDI / PE da sessão; "Foco do planejamento" (texto); `AIContext`
  "Contexto conectado"; "Dificuldades consideradas" (`CheckList`); "Duração de referência"
  (3 ou 6 meses); "Gerar planejamento com IA" (`sparkles`).
- **Escopo:**
  1. Tela `/plans/new`, com `?studentId=` opcional; sem ele, o primeiro passo é escolher o
     paciente.
  2. "Dificuldades consideradas" vêm de `Student.learningTopics`, já marcadas.
  3. Enviar a geração conforme o contrato, com o timeout de IA do app (`AI_TIMEOUT_MS`,
     G-46), estado de carregamento ("Gerando o planejamento…"), erro com "Tentar de novo" e
     **sem reenvio automático**.
  4. O resultado abre o rascunho (PLN-03) **sem salvar**.
  5. Se o contrato exigir dados de PE que o app não tem (por exemplo, o atendimento), a opção
     PE fica desabilitada com a explicação, e isso é registrado.
- **Arquivos novos:** `app/plans/new.tsx`, `src/features/plans/generate/**` e testes.
- **Arquivos alterados:** `src/api/endpoints/plans.ts`, `src/mocks/handlers/plans.ts`.
- **AC:**
  - AC-PLN-02-01 sem paciente na rota, pede para escolher um. `CT`
  - AC-PLN-02-02 as dificuldades do paciente vêm marcadas e podem ser desmarcadas. `CT`
  - AC-PLN-02-03 carregamento, erro e timeout aparecem, sem reenvio automático. `CT`
  - AC-PLN-02-04 o resultado não é salvo antes da confirmação na PLN-03. `CT`

#### PLN-03 — Rascunho editável e salvar

- **Onda:** E3-6 · **Classe:** B · **US:** US2-07
- **Dep.:** PLN-02.
- **Figma:** `.generated-sheet`: "Rascunho gerado" com `Badge` "Editável"; "Plano de
  Desenvolvimento Individual"; "Objetivo geral", "Metas prioritárias" e "Ajustes do
  profissional"; botões "Compartilhar" e "Salvar PDI".
- **Escopo:**
  1. O rascunho aparece na mesma rota da geração, com objetivo e metas editáveis (adicionar,
     remover e editar metas).
  2. "Salvar PDI" (ou "Salvar PE") persiste conforme o contrato e abre `/plans/{id}`.
  3. "Compartilhar" usa o `Share` nativo com uma síntese em texto (sem dados além dos do
     plano).
  4. Sair com rascunho não salvo pede confirmação.
- **Arquivos novos:** `src/features/plans/draft/**` e testes.
- **Arquivos alterados:** `src/features/plans/generate/**` (só a troca para o rascunho),
  `src/api/endpoints/plans.ts`, `src/mocks/handlers/plans.ts`.
- **AC:**
  - AC-PLN-03-01 objetivo e metas são editáveis antes de salvar. `CT`
  - AC-PLN-03-02 salvar envia o rascunho editado e abre o detalhe. `CT`
  - AC-PLN-03-03 "Compartilhar" chama o `Share` com a síntese. `CT`
  - AC-PLN-03-04 sair sem salvar pede confirmação. `CT`

#### PLN-04 — Detalhe do plano

- **Onda:** E3-7 · **Classe:** B · **US:** US2-08
- **Dep.:** PLN-03.
- **Figma:** destino "Ver plano completo"; tela montada com o design system (G-18).
- **Escopo:**
  1. Tela `/plans/{id}`: paciente, tipo, vigência, data de revisão, objetivo geral e metas
     com progresso (`ProgressBar`).
  2. Atualizar o status de cada meta e registrar a revisão, **se o contrato tiver essas
     operações**; senão, a tela é só de leitura e isso é registrado.
  3. "Editar plano" reabre o rascunho, se o contrato permitir edição.
- **Arquivos novos:** `app/plans/[id].tsx`, `src/features/plans/detail/**` e testes.
- **AC:**
  - AC-PLN-04-01 mostra objetivos, metas, progresso, vigência e revisão do contrato. `CT`
  - AC-PLN-04-02 as atualizações permitidas pelo contrato persistem e refletem na lista. `CT`
  - AC-PLN-04-03 plano inexistente mostra "Plano não encontrado" com "Voltar". `CT`

#### PLN-05 — Sugestões da IA

- **Onda:** E3-8 · **Classe:** B · **US:** US2-08
- **Dep.:** PLN-04 e a **segunda leva** do backend (sugestões). Sem ela, a tarefa fica
  bloqueada e não entra na contagem de telas.
- **Figma:** `InsightCard` da Início ("N sugestões da IA para revisar").
- **Escopo:**
  1. Tela `/plans/suggestions`: lista com aceitar e descartar, conforme o contrato.
  2. Cartão da Início com a contagem real; com zero, o cartão some.
- **Arquivos novos:** `app/plans/suggestions.tsx`, `src/features/plans/suggestions/**` e testes.
- **Arquivos alterados:** `HomeScreen.tsx` (o cartão).
- **AC:**
  - AC-PLN-05-01 aceitar aplica a sugestão no plano; descartar tira da lista. `CT`
  - AC-PLN-05-02 a contagem da Início acompanha a lista. `CT`

#### PAC-04 — Aba Planos na ficha do paciente

- **Onda:** E3-5 · **Classe:** B · **US:** US2-05
- **Dep.:** PLN-01; AGE-04 e PAC-06 (donos anteriores de `PatientDetailScreen`).
- **Figma:** `PatientDetail`, `.tabs` Visão geral / Planos; na aba Planos, um `InfoCard` por
  plano e o botão "Criar novo plano".
- **Escopo:**
  1. A ficha ganha as abas "Visão geral" (conteúdo atual) e "Planos".
  2. "Planos" lista os planos do paciente; cada um abre `/plans/{id}`; "Criar novo plano"
     abre `/plans/new?studentId={id}`.
  3. A aba "Avaliações" do Make **não** entra (sem API).
- **Arquivos novos:** `src/features/patients/detail/plans/**` (componente da aba) e testes.
- **Arquivos alterados:** `PatientDetailScreen.tsx` e testes.
- **Restrição:** não altera a camada de API de planos (dona: PLN-02, na mesma onda); usa as
  funções de leitura criadas na PLN-01.
- **AC:**
  - AC-PAC-04-01 a aba lista os planos do paciente com status. `CT`
  - AC-PAC-04-02 "Criar novo plano" leva o paciente para a geração. `CT`
  - AC-PAC-04-03 os testes da visão geral continuam verdes. `CMD`

### 4.4 Bloco D — Qualidade

#### QA-06 — Plano de testes da Entrega 3

- **Onda:** E3-8 · **Classe:** B
- **Dep.:** blocos A, B e C concluídos (ou o que estiver pronto, registrado).
- **Escopo:** roteiro manual no formato do [plano da Entrega 1](../entrega-1/PLANO-TESTES.md):
  um caso por AC `MAN` e um por fluxo entre telas (Agenda → atendimento → sessão; ficha →
  editar; ficha → anamnese; plano: gerar → salvar → detalhe; perfil → sair).
- **Arquivos novos:** `docs/entrega-3/PLANO-TESTES.md`.
- **AC:**
  - AC-QA-06-01 todos os casos P1 passam no Android (emulador, Expo Go, backend real). `MAN`

#### QA-02 — E2E com Maestro

- **Onda:** E3-9 · **Classe:** B
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

- **Onda:** E3-9 · **Classe:** B
- **Dep.:** QA-06.
- **Escopo:** nas telas novas e alteradas da Entrega 3: leitor de tela (TalkBack), fonte
  grande, contraste e alvos de toque de 44 pontos (G-17).
- **AC:**
  - AC-QA-03-01 o checklist das telas da Entrega 3 fica sem bloqueio. `MAN`

#### QA-04 — Homologação em aparelhos

- **Onda:** E3-9 · **Classe:** B
- **Dep.:** QA-06. **Exige** Android físico e Mac ou iPhone, com autorização do usuário.
- **Escopo:** Android físico (inclusive câmera e áudio da ATV-08) e iOS (Expo Go ou build),
  com o backend real.
- **AC:**
  - AC-QA-04-01 a matriz tela × plataforma × aparelho fica registrada; o que não foi testado
    aparece como pendência, nunca como aprovado. `MAN`

## 5. Grafo de dependências

```
G-47 → NAV-03 ─┐
G-51 → FEC-02 ─┴→ FEC-01 (emulador)
FEC-03, ATV-02, PAC-07, REC-02, AGE-01     (independentes)
AGE-01 → AGE-03 → AGE-04
PAC-07 → AGE-04 → PAC-06 → PAC-04          (dono de PatientDetailScreen)
G-50 (aprovada) → PAC-08 → PAC-06
G-48 → PLN-00 (backend) → PLN-01 → PLN-02 → PLN-03 → PLN-04 → PLN-05 (2ª leva)
PLN-01 → PAC-04
blocos A–C → QA-06 → QA-02, QA-03, QA-04
```

## 6. Histórico

- 2026-10-28: criação pelo orquestrador, com o estado da `main` depois do PR #75, a escolha do
  domínio de planos (G-48) e as propostas G-47, G-49, G-50 e G-51.
- 2026-10-28: G-47, G-49, G-50 e G-51 aprovados pelo usuário; especificação para o backend em
  [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md).
