# Entrega 2 — Backlog

> Histórias e tarefas refinadas do novo design. Leia antes: [AGENTS.md](../../AGENTS.md),
> [PROJECT.md](../PROJECT.md) e o [Roadmap da Entrega 2](ROADMAP.md). O estado de cada tarefa
> não fica aqui, e sim no TRACKING da Entrega 2 (a criar na primeira onda).
>
> **Fonte do design:** Figma Make
> [`L7sCNfMhrzOzhtlNpS3cHr`](https://www.figma.com/make/L7sCNfMhrzOzhtlNpS3cHr/Receive-.fig-files).
> Cada tarefa cita o **componente** de `src/App.tsx` e as **classes** de `src/index.css` do Make,
> que são a referência visual e de comportamento. Para ler o código do Make, use o conector
> Figma: `get_design_context` com `fileKey=L7sCNfMhrzOzhtlNpS3cHr` e `nodeId=0:1`.

## 1. Convenções

- **IDs.**

  | Item               | Formato                               | Exemplo        |
  | ------------------ | ------------------------------------- | -------------- |
  | História           | `US2-NN`                              | `US2-03`       |
  | Tarefa             | `<MÓDULO>-NN` (mesmos IDs do roadmap) | `PAC-03`       |
  | Critério de aceite | `AC-<tarefa>-NN`                      | `AC-PAC-03-02` |
  | Gate               | `G-NN`                                | `G-32`         |

  Os IDs não são reutilizados.

- **Verificação:** os mesmos códigos da [Entrega 1](../entrega-1/BACKLOG.md#1-convenções):
  `UT`, `CT`, `E2E`, `CMD`, `MAN` e `REV`.
- **Protocolo comum:** igual ao da [Entrega 1 §2](../entrega-1/BACKLOG.md#2-protocolo-comum-de-tarefa).
  - Ciclo: contrato, testes, vermelho, implementação, validação e entrega.
  - Testes ficam em `__tests__/` ao lado do código.
  - Nenhuma dependência nova sem gate.
- **API.** Toda tarefa com integração tem dois campos:
  - **Endpoints existentes**, com os endpoints do [contrato atual](../PROJECT.md#parte-ii--referência-global-da-api) que ela usa;
  - **Ainda não existe na API**, com o que o Figma pede e o contrato não tem.

  Os itens que faltam vão para a **API-01**, que traz o contrato real do backend (premissa: o backend
  está pronto, mas a documentação no repositório não cobre os módulos novos). Enquanto o endpoint não
  estiver documentado, a parte da tarefa que depende dele fica bloqueada. Nenhuma tarefa inventa
  campo ou endpoint. A cobertura por domínio está no [§2.3](#23-cobertura-da-api).

- **Backend pronto** (premissa do usuário):
  - critérios com dados são verificados contra a API real em homologação;
  - os mocks (API-02) servem para os testes `UT` e `CT`.
- **Copy:** os textos entre aspas vêm do Figma e são usados literalmente, salvo ajuste de
  acessibilidade registrado.
- **Classes de execução** (AGENTS §3):

  | Classe | Modelo | Uso                    |
  | ------ | ------ | ---------------------- |
  | A      | Opus   | Contrato e arquitetura |
  | B      | Sonnet | Tela ou módulo         |
  | C      | Haiku  | Trabalho mecânico      |

## 2. Referência do design (Figma Make)

### 2.1 Tokens (`src/index.css`, `:root`)

| Grupo       | Tokens                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Marca       | `--brand-50 #eefaf8`, `--brand-100 #d9f3ef`, `--brand-200 #b6e7df`, `--brand-500 #25a99d`, `--brand-600 #168d84`, `--brand-700 #116f69` |
| Tinta       | `--ink-950 #173331`, `--ink-800 #294b48`, `--ink-600 #5a7471`, `--ink-500 #748b88`, `--ink-300 #b8c9c6`                                 |
| Superfícies | `--surface #fff`, `--surface-soft #f6faf9`, `--border #dfeae8`                                                                          |
| Tons        | `--peach #fff1e7` / `--peach-strong #e88a4f`, `--lavender #f1ecff` / `--lavender-strong #7661b5`, `--yellow #fff7d8`                    |
| Estado      | `--warning #a36414`, `--success #16845e`, `--danger #d44c4c`                                                                            |
| Forma       | `--radius-sm 10`, `--radius-md 16`, `--radius-lg 24`, `--content-pad 20` (15 abaixo de 370 dp)                                          |
| Sombra      | `--shadow-sm 0 2 10 rgba(31,75,70,.06)`, `--shadow-md 0 14 36 rgba(31,75,70,.13)`                                                       |
| Tipo        | Nunito 400/500/600/700/800; títulos 24/800 com `letter-spacing -0.6`; eyebrow 12/700 maiúsculo                                          |

### 2.2 Componentes base (`src/App.tsx`)

| Componente Make                                    | Classes CSS                                                                              | Tarefa |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| `Icon` (22 ícones de traço, `iconPaths`)           | `.icon`                                                                                  | DS-02  |
| `Button` (`primary`, `secondary`, `ghost`, `soft`) | `.button`, `.button--*`, `.full-button`, `.dual-actions`                                 | DS-03  |
| `IconButton`                                       | `.icon-button`                                                                           | DS-03  |
| `Avatar` (`mint`, `peach`, `lavender`)             | `.avatar`, `.avatar--*`                                                                  | DS-05  |
| `AppHeader` (eyebrow, título, voltar, sino)        | `.app-header`, `.eyebrow`, `.back-button`                                                | NAV-02 |
| `SectionTitle`                                     | `.section-title`                                                                         | DS-05  |
| `InfoCard`                                         | `.info-card`                                                                             | DS-05  |
| Navegação inferior (`navigation`)                  | `.bottom-nav`, `.bottom-nav__item--active`                                               | NAV-01 |
| Campos                                             | `.field`, `.field-grid`, `.search-field`                                                 | DS-04  |
| Seleção                                            | `.check-list`, `.criteria-list`, `.segmented`, `.switch`, `.filter-chip`, `.tabs`/`.tab` | DS-03  |
| Feedback                                           | `.badge`, `.badge--warning`, `.toast`, `.success-panel`, `.progress`, `.mini-bars`       | DS-05  |
| IA                                                 | `.ai-context`, `.ai-insight`, `.ai-hero`, `.insight-card`                                | DS-05  |

### 2.3 Cobertura da API

O [contrato atual](../PROJECT.md#parte-ii--referência-global-da-api) tem 55 endpoints. A tabela mostra o que ele cobre e o que falta para o novo
design. O detalhe está em cada ficha.

| Domínio do design    | Coberto hoje                                                                                                                  | Falta na API                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Perfil e conta       | `GET /educator/me`, `PUT /educator/update-educator`, `PUT /educator/update-profile-picture`, `POST /educator/update-password` | papel/profissão                                                                 |
| Pacientes            | `GET /student/`, `POST /student/create`, `PUT /student/update/:id`, `POST /student/:id/documents`                             | data de nascimento, responsável, catálogo de dificuldades, status, `GET` por id |
| Agenda               | `GET/POST /appointment/`, `GET/PUT/DELETE /appointment/:id`                                                                   | tipo, duração, cancelar com status, conflito                                    |
| WhatsApp             | `Appointment.notifiedAt` (leitura)                                                                                            | preferência e envio sob demanda (o `notify` é job interno)                      |
| Sessão e evolução    | `task-notebook-session` (`start`, `answer`, `finish`, `observation`, `student/:id`, `report/:id`)                             | PE e critérios, vínculo com o atendimento, sugestão para a próxima sessão       |
| Análise e IA         | `analysis`, `snapshot`, `history` e `analysis/.../ai` por paciente; `POST /ai-task/generate`                                  | — (reaproveitados em PAC-03, EVO e REL)                                         |
| Anamnese             | `anamnese/templates` (CRUD) e `anamnese/responses`                                                                            | síntese dedicada, edição de resposta                                            |
| Planos (PDI/PE)      | —                                                                                                                             | todo o domínio                                                                  |
| Avaliações e escalas | —                                                                                                                             | todo o domínio                                                                  |
| Banco de atividades  | `task`, `task-group`, `task-notebook`                                                                                         | formato, habilidade, recomendação, tipos jogáveis, PDF imprimível               |
| Relatórios           | `report/:sessionId` e análises                                                                                                | documento configurável, PDF, envio, histórico                                   |
| Equipe               | `POST /student/assign-educator`                                                                                               | equipe, papéis, convite                                                         |
| Ajuda e notificações | —                                                                                                                             | tutoriais, notificações do app, push                                            |

## 3. Histórias

| ID     | Como… quero… para…                                                                                                                    | Tarefas                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| US2-01 | Como profissional, quero ver ao abrir o app meu próximo atendimento, a agenda do dia e atalhos, para começar o trabalho sem procurar  | HOME-01                        |
| US2-02 | Como profissional, quero ver e gerenciar minha agenda por dia, para organizar os atendimentos                                         | AGE-01, AGE-03                 |
| US2-03 | Como profissional, quero que os responsáveis recebam confirmações e avisos por WhatsApp, para reduzir faltas                          | AGE-02                         |
| US2-04 | Como profissional, quero cadastrar e encontrar pacientes com suas dificuldades, para ter a base do acompanhamento                     | PAC-01, PAC-02, PAC-07         |
| US2-05 | Como profissional, quero uma ficha do paciente com PDI vigente, próxima sessão, dificuldades e evolução, para decidir o próximo passo | PAC-03, PAC-04, PAC-05, PAC-06 |
| US2-06 | Como profissional, quero registrar a evolução de cada sessão com critérios do PE, para manter o prontuário atualizado                 | AGE-04, EVO-01, EVO-02, EVO-03 |
| US2-07 | Como profissional, quero gerar PDI e PE com IA a partir do contexto do paciente e ajustá-los, para planejar com menos esforço         | PLN-01, PLN-02, PLN-03         |
| US2-08 | Como profissional, quero acompanhar objetivos e revisar sugestões da IA, para manter o plano vivo                                     | PLN-04, PLN-05                 |
| US2-09 | Como profissional, quero aplicar escalas prontas e receber escore e insight, para apoiar a avaliação                                  | AVA-01 a AVA-05                |
| US2-10 | Como profissional, quero um banco de atividades interativas e imprimíveis, para usar nas sessões                                      | ATV-01 a ATV-05                |
| US2-11 | Como profissional, quero gerar relatórios seguros em PDF, imprimir e enviar, para comunicar a família e a escola                      | REL-01, REL-02, REL-03         |
| US2-12 | Como administradora, quero convidar profissionais e ver a equipe, para trabalhar em clínica                                           | EQP-01, EQP-02                 |
| US2-13 | Como novo usuário, quero tutoriais curtos, para aprender a usar o app                                                                 | AJD-01                         |
| US2-14 | Como profissional, quero ser avisada de lembretes, confirmações e sugestões, para não perder nada                                     | NOT-01                         |
| US2-15 | Como profissional, quero acessar todos os recursos e meu perfil num lugar, para navegar com facilidade                                | REC-01, REC-02, NAV-01, NAV-02 |

## 4. Tarefas

### 4.0 Marco V1 (prioridade)

O que é a V1 (decisão do usuário em 2026-10-03, registrada como G-38 a G-41):

- **Escopo:** primeira versão funcionando ponta a ponta com o backend real:
  - criar atividade, inclusive **com IA**;
  - criar aluno/paciente;
  - fazer uma sessão;
  - ver relatórios, inclusive a análise por IA.
- **Visual:** segue o **Figma Make** (G-38), reaproveitando componentes e lógica da Entrega 1
  onde couber.
- **Imagem e áudio** nas atividades entram (G-39).
- **Markdown:** a análise por IA usa uma lib de Markdown (G-40).
- **Expo Go:** a primeira tarefa é **voltar para o Expo Go** (G-41).
  - O app deixa de exigir development build; toda dependência nova tem de rodar no Expo Go.
  - O único bloqueio hoje é o `react-native-mmkv` (Nitro).
- **Sessão:** só tem API em `task-notebook-session`, que é o fluxo de responder tarefas.
  - Por isso, na V1 a sessão é o **player do Figma Make** (`.game-shell`) rodando as tarefas do
    caderno, seguido de um encerramento no estilo de `EvolutionScreen`, só com o que a API tem:
    o registro descritivo vira `observation`.
  - Critérios do PE e sugestão para a próxima sessão ficam para depois, porque não têm API.
- **Tarefas sem tela própria no Make:** criar atividade e montar caderno/grupo são montadas com o
  design system do Make (DS-01 a DS-05), sobre a lógica que já existe (UX3/UX5).

**Ordem da V1:**

| Onda | Tarefas                                                             | Observação                                      |
| ---- | ------------------------------------------------------------------- | ----------------------------------------------- |
| V1-0 | EXPO-01                                                             | Primeira; destrava o desenvolvimento no Expo Go |
| V1-1 | DS-01, DS-02, DS-03, DS-04, DS-05, ATV-08                           | Design system e upload de mídia em paralelo     |
| V1-2 | NAV-01, NAV-02, DS-06                                               | Casca nova                                      |
| V1-3 | HOME-01 (V1), PAC-01, PAC-02 (V1), ATV-01 (V1), CNT-01, REC-01 (V1) | Telas raiz                                      |
| V1-4 | PAC-03 (V1), ATV-06, ATV-07, SES-01                                 | G-06 só bloqueia a INT-01 (G-29, mocks)         |
| V1-5 | ATV-02, ATV-03, SES-02                                              |                                                 |
| V1-6 | SES-03, SES-04, REL-04                                              | REL-04 adiantada para junto da V1-5             |
| V1-7 | REL-05, REL-06                                                      |                                                 |
| V1-8 | INT-01, QA-05                                                       | Integração real e teste ponta a ponta           |

Caminho crítico:

```
EXPO-01 → DS-01 → DS-03 → NAV-01 → PAC-01 → SES-01 (G-06) → SES-02 (G-07)
        → SES-04 → REL-04 → REL-05 → REL-06 → INT-01 → QA-05
```

**Tarefas da Entrega 2 que entram na V1 e como (escopo V1):**

| Tarefa                        | Escopo na V1                                                                                                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-01 a DS-06, NAV-01, NAV-02 | Completas                                                                                                                                                                                                                                         |
| HOME-01 (V1)                  | Hero do próximo atendimento, acesso rápido e agenda de hoje com `GET /appointment/`. Sem "Notificar responsável" nem cartão de sugestões da IA (sem API); "Criar plano" e "Aplicar escala" levam a "Em breve"                                     |
| PAC-01                        | Completa, com o que a API tem (sem status do paciente)                                                                                                                                                                                            |
| PAC-02 (V1)                   | Formulário do Make **mais** os campos que a API exige (`gender`, `zipcode`, `road`, `housenumber`); `age` em vez de data de nascimento; dificuldades como `learningTopics`. Reaproveita a lógica de UX4-C                                         |
| PAC-03 (V1)                   | Resumo, "Dificuldades mapeadas" e "Evolução recente" (análise), mais a lista de sessões do paciente com acesso ao relatório. Sem PDI, sem as abas Planos e Avaliações (G-38 V1)                                                                   |
| ATV-01 (V1)                   | Banco com `GET /task/`, `GET /task-group/list-by-educator` e `GET /task-notebook/`; filtros por categoria e tipo, busca por `promptContains`; botão "+ Criar atividade" (ATV-06/ATV-07). Sem "Interativas/Imprimíveis" nem recomendação (sem API) |
| ATV-02, ATV-03                | Detalhe e player; o tipo jogável na V1 é o quiz (ATV-04c)                                                                                                                                                                                         |
| REC-01 (V1)                   | Recursos com Atividades, Cadernos e grupos, e Relatórios; os demais itens levam a "Em breve"                                                                                                                                                      |

Fichas novas da V1:

#### EXPO-01 — Migração de volta para o Expo Go

- **Classe:** A
- **Dep.:** nenhuma (primeira tarefa da V1)
- **Gate:** G-41
- **Escopo:**
  1. Trocar o MMKV por um armazenamento disponível no Expo Go, **mantendo a interface** de
     `src/storage/mmkv.ts`. Os consumidores são `query-persister.ts`, `AppProviders.tsx`,
     `useSignIn.ts` e `session-flow.ts`.
     - Recomendação: `expo-sqlite/kv-store` (API síncrona, compatível com o persister síncrono
       do TanStack) com criptografia AES-256-GCM em JS (`@noble/ciphers`).
     - A chave fica no SecureStore, como hoje (G-27).
     - Manter o isolamento por educador e a limpeza no logout e na troca de conta (G-04).
  2. Remover `react-native-mmkv` e `react-native-nitro-modules` e o mock de Nitro dos testes.
  3. Scripts:
     - `android` e `ios` voltam a `expo start --android` / `--ios`;
     - `start` abre no Expo Go.
  4. Auditar cada dependência contra o Expo Go do SDK 57. Toda dependência nova da V1 tem de
     ser compatível: `react-native-svg`, `expo-image-picker`, `expo-document-picker`,
     `expo-audio`, `expo-print`, `expo-sharing`, `expo-file-system` e a lib de Markdown.
  5. Atualizar `COMPATIBILIDADE`, `README` e AGENTS §1.
     - A T-108 (dev build) vira opcional.
     - O `android/` gerado continua fora do Git.
- **Fora:** mudar telas.
- **Arquivos:**
  - `src/storage/**` e seus testes;
  - `src/api/query-persister.ts` (só o adaptador);
  - `package.json`, `pnpm-lock.yaml`, `app.json`;
  - `vitest` setup (mocks);
  - `docs/bootstrap/COMPATIBILIDADE.md`, `README.md`.
- **AC:**
  - AC-EXPO-01-01 o app abre e navega no **Expo Go** (Android) com `pnpm start` e leitura do
    QR, sem erro de módulo nativo. `MAN`
  - AC-EXPO-01-02 o cache persistido continua criptografado: o valor gravado não é legível
    sem a chave. `UT`
  - AC-EXPO-01-03 logout e troca de conta apagam os dados do educador anterior (G-04). `UT`
  - AC-EXPO-01-04 testes, typecheck, lint e o bundle Android (`expo export`) passam. `CMD`
  - AC-EXPO-01-05 não há dependência fora do Expo Go no `package.json`; a lista auditada fica
    registrada no COMPATIBILIDADE. `REV`

#### ATV-06 — Criar e editar atividade (manual, com imagem e áudio)

- **Classe:** B
- **US:** US2-10
- **Figma:** sem tela no Make. Usar o padrão de formulário de `SimpleFormScreen` e
  `PlansScreen` (generate): `.field`, `.segmented`, `.check-list` e `full-button`, com os
  componentes DS.
- **Dep.:** DS-03, DS-04, ATV-08
- **Reaproveita:** a lógica de UX3-A (`src/features/content-create/task`).
- **Endpoints existentes:**
  - `POST /task/create` (multipart: `category`, `type`, `prompt`, `alternatives` em JSON,
    `imageFile?`, `audioFile?`);
  - `PUT /task/update`;
  - `GET /task/:id`;
  - `POST /task/upload-media` (até 10 MB).
- **Ainda não existe na API:** nada.
- **Escopo:**
  - enunciado e categoria;
  - 2 a 4 alternativas com exatamente uma correta;
  - **tipo com mídia** (`multipleChoiceWithMedia`) quando houver imagem ou áudio (regras da
    API: tarefa de texto não pode ter mídia; tarefa com mídia exige imagem ou áudio);
  - prévia da imagem e do áudio;
  - editar uma atividade existente.
- **AC:**
  - AC-ATV-06-01 criar com e sem mídia respeita o tipo e as regras da API. `CT`
  - AC-ATV-06-02 a imagem e o áudio aparecem na prévia e no detalhe. `MAN`
  - AC-ATV-06-03 editar envia `PUT /task/update` só com os campos alterados. `CT`
  - AC-ATV-06-04 os erros `TEXT_TASK_CANNOT_HAVE_MEDIA` e `MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO`
    aparecem como mensagem legível. `CT`

#### ATV-07 — Criar atividades com IA

- **Classe:** B
- **US:** US2-10
- **Figma:** sem tela no Make. Referência visual: `PlansScreen` (generate) e `.generated-sheet`.
  - Formulário: `.field`, `.ai-context` e "Gerar com IA" (`sparkles`).
  - Rascunho: `.generated-sheet` com `badge` "Editável" e a lista de tarefas geradas.
- **Dep.:** DS-03, DS-04, DS-05
- **Endpoints existentes:**
  - `POST /ai-task/generate` (`targetAudience`, `instructions`, `quantity` 1–15, `category`;
    devolve `{ tasks: TaskInput[] }`, sempre `multipleChoice`; **não persiste**);
  - `POST /task/batch` (salva as tarefas revisadas).
- **Ainda não existe na API:** geração de tarefas com mídia (a IA só gera texto).
- **Escopo:**
  - formulário com público-alvo (pré-preenchido a partir do paciente, se houver contexto),
    instruções, quantidade e categoria;
  - gerar, com estado de carregando;
  - revisar: editar o enunciado, as alternativas e a correta de cada tarefa, e descartar tarefas;
  - "Salvar N atividades" (batch);
  - opção de criar já um caderno com elas (CNT-01).
- **AC:**
  - AC-ATV-07-01 a geração valida a quantidade (1–15) antes de enviar. `UT`
  - AC-ATV-07-02 os erros `AI_GENERATION_FAILED`, `AI_INVALID_OUTPUT` e `INVALID_QUANTITY` aparecem
    com "Tentar novamente", sem reenvio automático. `CT`
  - AC-ATV-07-03 nada é salvo até o "Salvar"; só as tarefas não descartadas vão no batch. `CT`
  - AC-ATV-07-04 depois de salvar, as atividades aparecem no banco (ATV-01). `CT`

#### ATV-08 — Upload de imagem e áudio

- **Classe:** B
- **Dep.:** EXPO-01
- **Escopo:**
  - componentes `MediaPicker` (imagem por galeria ou câmera com `expo-image-picker`; áudio por
    arquivo com `expo-document-picker`);
  - `AudioPlayer` (`expo-audio`, já instalado);
  - envio por `POST /task/upload-media`, com limite de 10 MB validado antes.
- **Endpoints existentes:** `POST /task/upload-media`.
- **Ainda não existe na API:** nada.
- **AC:**
  - AC-ATV-08-01 um arquivo acima de 10 MB é recusado antes do envio. `UT`
  - AC-ATV-08-02 as permissões negadas mostram a explicação e o atalho para as configurações. `CT`
  - AC-ATV-08-03 funciona no Expo Go. `MAN`

#### CNT-01 — Cadernos e grupos no novo visual

- **Classe:** B
- **Figma:** sem tela no Make; usar `InfoCard`, `.check-list` e `SectionTitle`.
- **Dep.:** DS-03, DS-05
- **Reaproveita:** UX3-N, UX3-G, UX5-N e UX5-G (lógica e testes).
- **Endpoints existentes:** `task-notebook` e `task-group` (create, list, update, delete).
- **Ainda não existe na API:** nada.
- **Escopo:**
  - criar, ver e excluir caderno e grupo, agora também **editar** (`PUT …/update`);
  - escolher as atividades de um grupo;
  - acesso pelo Recursos e pelo banco de atividades.
- **AC:**
  - AC-CNT-01-01 os testes de UX3/UX5 continuam verdes depois do novo visual. `CMD`
  - AC-CNT-01-02 editar caderno e grupo funciona. `CT`
  - AC-CNT-01-03 um caderno criado pode ser usado numa sessão (SES-01). `MAN`

#### SES-01 — Iniciar sessão

- **Classe:** B
- **US:** US2-06
- **Figma:** `.hero-card` ("Iniciar sessão") no Início e ação na ficha do paciente; a escolha do
  caderno é uma folha com `.check-list` (sem tela própria no Make).
- **Dep.:** PAC-01, CNT-01, **G-06**
- **Reaproveita:** T-701 (store do fluxo) e a lógica de T-702/T-703 (escolher paciente, nome e
  conteúdo).
- **Endpoints existentes:**
  - `POST /task-notebook-session/start` (`studentId`, `name` ≤ 100);
  - `GET /task-notebook-session/student/:studentId` (sessão aberta, para reconciliar);
  - `GET /task-notebook/`.
- **Ainda não existe na API:** **o vínculo sessão ↔ caderno** (G-06). O `start` não recebe o
  caderno, mas o `answer` valida `TASK_NOT_IN_NOTEBOOK`.
- **AC:**
  - AC-SES-01-01 escolher paciente, nome e caderno inicia a sessão e abre o player. `CT`
  - AC-SES-01-02 se já houver sessão aberta do paciente, oferece "Retomar" ou "Encerrar agora"
    (G-21), sem criar duplicata. `CT`
  - AC-SES-01-03 um erro do `start` mostra a mensagem, sem reenvio automático (G-08). `CT`

#### SES-02 — Player da sessão

- **Classe:** B
- **US:** US2-06
- **Figma:** `ActivitiesScreen` (jogo): `.game-shell`, `.game-progress` "Atividade N de M",
  `.game-illustration` (a imagem da tarefa, se houver), título e instrução (enunciado),
  alternativas no estilo `.scale-option` ou `.letter-pool`, e `.success-message`.
- **Dep.:** SES-01, ATV-03, ATV-08 (player de áudio), **G-07**
- **Reaproveita:** T-801 (componentes previstos).
- **Endpoints existentes:**
  - `POST /task-notebook-session/answer` (`sessionId`, `taskId`, `selectedAlternativeId`,
    `timeToAnswer`);
  - `GET /task/:id`.
- **Ainda não existe na API:** a **unidade do `timeToAnswer`** (G-07) e a lista ordenada de
  tarefas da sessão (G-06).
- **Escopo:**
  - mostrar cada tarefa com imagem e áudio;
  - medir o tempo;
  - enviar a resposta **uma única vez**, sem permitir trocar depois do envio;
  - avançar até a última.
- **AC:**
  - AC-SES-02-01 cada resposta é enviada uma vez; `TASK_ALREADY_ANSWERED` é tratado como já
    respondida. `CT`
  - AC-SES-02-02 o progresso e o áudio funcionam. `CT` + `MAN`
  - AC-SES-02-03 a perda de rede durante o envio não reenvia sozinha e oferece reconciliar. `CT`

#### SES-03 — Retomada da sessão

- **Classe:** B
- **Dep.:** SES-02
- **Reaproveita:** o desenho da T-803 e a decisão G-21.
- **Endpoints existentes:** `GET /task-notebook-session/student/:studentId`,
  `POST /task-notebook-session/finish`.
- **Ainda não existe na API:** nada.
- **AC:**
  - AC-SES-03-01 ao reabrir o app com sessão aberta, oferece "Retomar" (volta na primeira
    tarefa sem resposta) ou "Encerrar agora". `CT`

#### SES-04 — Encerrar sessão e registro

- **Classe:** B
- **US:** US2-06
- **Figma:** `EvolutionScreen` adaptada:
  - `.session-summary` (nome da sessão, paciente, nº de questões);
  - "Registro descritivo" (textarea);
  - "Salvar e atualizar prontuário";
  - `.success-panel`.
  - Sem critérios nem sugestão da IA na V1 (sem API).
- **Dep.:** SES-02
- **Reaproveita:** T-804.
- **Endpoints existentes:**
  - `POST /task-notebook-session/finish`;
  - `POST /task-notebook-session/observation` (`observation` ≥ 1; só depois de finalizar).
- **Ainda não existe na API:** critérios do PE e sugestão para a próxima sessão.
- **AC:**
  - AC-SES-04-01 a última resposta leva ao `finish` e depois ao registro, com "Pular" ou
    "Salvar". `CT`
  - AC-SES-04-02 salvar envia a observação uma vez e abre o relatório da sessão (REL-04). `CT`

#### REL-04 — Relatório da sessão

- **Classe:** B
- **US:** US2-11
- **Figma:** `ReportsScreen`, área de prévia (`.report-preview`) e componentes `.evolution-card`
  / `.mini-bars` / `.progress` para as métricas.
- **Dep.:** SES-04, DS-05
- **Endpoints existentes:** `GET /task-notebook-session/report/:sessionId`, que devolve:
  - `totalTimeSession` e `totalQuestions`;
  - `averageTimePerQuestion`, `averageCorrectTime` e `averageIncorrectTime`;
  - `percentageByCategory` e `percentageByType`;
  - `observation`.
- **Ainda não existe na API:** nada (depende de G-07 para exibir os tempos na unidade certa).
- **Escopo:** tela com as métricas, a observação e os botões "Imprimir" e "Enviar" (PDF gerado
  no app com `expo-print` a partir dos dados).
- **AC:**
  - AC-REL-04-01 todas as métricas aparecem; um valor `null` aparece como "—". `CT`
  - AC-REL-04-02 o PDF é gerado, impresso e compartilhado no Expo Go. `MAN`
  - AC-REL-04-03 abre no fim da sessão e na lista de sessões do paciente (PAC-03 V1). `CT`

#### REL-05 — Relatórios do aluno (análise)

- **Classe:** B
- **US:** US2-11
- **Figma:** `ReportsScreen`: paciente, período (últimas N sessões ou datas) e "Gerar síntese".
  Os tipos e o "Incluir no documento" ficam restritos ao que a API tem.
- **Dep.:** REL-04
- **Endpoints existentes:**
  - `GET /task-notebook-session/analysis/student/:studentId` (`limit` **ou**
    `startDate`/`endDate`);
  - `POST …/analysis/student/:studentId/snapshot`;
  - `GET …/analysis/student/:studentId/history`.
- **Ainda não existe na API:** os tipos "Anamnese e avaliações" e "Evolução do PDI"; o PDF gerado
  pelo servidor.
- **Escopo:**
  - acerto geral e por categoria;
  - lista de sessões do período;
  - "Salvar snapshot" e o histórico de snapshots;
  - "Imprimir" e "Enviar" em PDF gerado no app.
- **AC:**
  - AC-REL-05-01 a UI não permite combinar `limit` com datas (regra da API). `UT`
  - AC-REL-05-02 o snapshot salvo aparece no histórico. `CT`

#### REL-06 — Análise psicopedagógica com IA

- **Classe:** B
- **US:** US2-11
- **Figma:** `.ai-context` / `.ai-insight` (lavanda) para o bloco de IA e `.privacy-note` para o
  aviso.
- **Dep.:** REL-05, G-40
- **Endpoints existentes:**
  - `GET /task-notebook-session/analysis/student/:studentId/ai` (`limit` ou datas,
    `templateId?` para incluir a anamnese);
  - `GET /anamnese/templates/` para escolher o modelo.
- **Ainda não existe na API:** nada.
- **Escopo:**
  - botão "Gerar análise com IA", com carregando e erro;
  - renderização do Markdown (seções Visão Geral, Pontos Fortes, Dificuldades, Padrões, Melhoria,
    Guia de Intervenção e Considerações Finais) com a lib de Markdown;
  - incluir a análise no PDF do relatório (REL-05).
- **AC:**
  - AC-REL-06-01 o erro `AI_ANALYSIS_FAILED` aparece com "Tentar novamente", sem reenvio
    automático. `CT`
  - AC-REL-06-02 o Markdown aparece com títulos e listas, com a tipografia do tema. `CT` + `MAN`
  - AC-REL-06-03 o texto da análise não vai para log nem para o cache persistido (dado
    sensível). `REV`

#### INT-01 — Integração real da V1

- **Classe:** B (com C para execução)
- **Dep.:** todas as tarefas da V1 de tela
- **Escopo:**
  - `EXPO_PUBLIC_USE_MOCKS=false` contra o backend de homologação;
  - validar endpoint por endpoint: login, `student`, `task` (inclusive mídia e IA),
    `task-group`, `task-notebook`, `task-notebook-session` (start, answer, finish, observation,
    report, analysis e ai) e `appointment`;
  - registrar as divergências e corrigir os tipos.
- **AC:**
  - AC-INT-01-01 cada endpoint da V1 tem evidência de chamada real bem-sucedida (data,
    ambiente). `MAN`
  - AC-INT-01-02 os mocks continuam iguais ao contrato real (testes atualizados). `UT`

#### QA-05 — Teste ponta a ponta da V1

- **Classe:** B/C
- **Dep.:** INT-01
- **Escopo:** roteiro manual e fluxo Maestro, no Expo Go e no Android:
  1. login;
  2. cadastrar paciente;
  3. criar atividade com imagem e áudio;
  4. gerar atividades com IA;
  5. montar caderno;
  6. sessão completa com registro;
  7. relatório da sessão;
  8. relatório do aluno com análise por IA, impresso e compartilhado.
- **AC:**
  - AC-QA-05-01 o roteiro passa sem bloqueio no Android. `MAN`
  - AC-QA-05-02 o fluxo Maestro do caminho feliz passa. `E2E`

### 4.1 Contrato e base

#### API-01 — Contrato real da API

- **Classe:** A
- **US:** todas
- **Dep.:** nenhuma
- **Escopo:**
  - obter a documentação ou OpenAPI do backend;
  - atualizar [PROJECT, Parte II](../PROJECT.md#parte-ii--referência-global-da-api);
  - criar tipos em `src/api/types.ts` e um módulo por domínio em `src/api/endpoints/` para os
    recursos: `patient`, `guardian`, `difficulty`, `appointment`, `messaging` (WhatsApp),
    `plan` (PDI/PE), `plan-suggestion`, `assessment-template`, `assessment`, `anamnese`,
    `activity`, `activity-result`, `session-evolution`, `report`, `team`/`invite`, `tutorial`,
    `notification`, `profile`;
  - criar `docs/entrega-2/API-TELAS.md` (tela × endpoint).
- **Fora:** telas.
- **Arquivos:** `docs/PROJECT.md`, `docs/entrega-2/API-TELAS.md`, `src/api/types.ts`,
  `src/api/endpoints/**`.
- **AC:**
  - AC-API-01-01 cada tela do [roadmap §2](ROADMAP.md#2-mapa-de-telas-do-figma) tem endpoint(s)
    na matriz. `REV`
  - AC-API-01-02 cada campo exibido no Figma está marcado como "existe na API" ou "desvio",
    com a decisão. `REV`
  - AC-API-01-03 os módulos de endpoint são tipados, e o typecheck passa. `CMD`

#### API-02 — Mocks por domínio

- **Classe:** C
- **Dep.:** API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - os 55 endpoints de [PROJECT, Parte II](../PROJECT.md#parte-ii--referência-global-da-api) — mocks dos que ainda não existem nos handlers
- **Ainda não existe na API (pendência para a API-01):**
  - mocks dos recursos novos só depois de a API-01 trazer o contrato
- **Escopo:** handlers mockados para cada endpoint da API-01, nos cenários sucesso, vazio,
  401, 404, erro de validação e falha de rede.
- **Arquivos:** `src/mocks/handlers/<dominio>.ts`, `src/mocks/__tests__/<dominio>.test.ts` e
  uma linha por domínio em `src/mocks/install.ts`.
- **AC:**
  - AC-API-02-01 cada handler tem um teste pelo `apiClient` real, como em
    `src/mocks/__tests__/api-client-integration.test.ts`. `UT`
  - AC-API-02-02 os dados são fictícios, sem nome real de criança. `REV`

### 4.2 Design system

#### DS-01 — Tokens do novo tema

- **Classe:** B
- **Figma:** `:root` do `index.css` (§2.1)
- **Dep.:** nenhuma
- **Escopo:**
  - substituir os valores em `src/theme/palette.js` e `tokens.ts`;
  - expor raio, sombra e espaçamento;
  - pesos Nunito 400–800 (`@expo-google-fonts/nunito` já instalado);
  - mapear sombras CSS para `shadow*` / `elevation`;
  - ajustar o contraste onde o Figma não atinge 4.5:1, como texto branco em `--brand-500`,
    e registrar.
- **Arquivos:** `src/theme/**`, `tailwind.config.js`.
- **AC:**
  - AC-DS-01-01 os tokens do §2.1 estão disponíveis em TS e no Tailwind com os mesmos valores. `UT`
  - AC-DS-01-02 há um teste de contraste para cada par texto/fundo usado nos componentes base. `UT`
  - AC-DS-01-03 as fontes Nunito 400–800 carregam no boot sem flash de fonte do sistema. `MAN`

#### DS-02 — Ícones

- **Classe:** B
- **Figma:** `Icon` e `iconPaths` (22 nomes), `.icon` (traço 1.8, pontas arredondadas)
- **Dep.:** DS-01, G-32
- **Escopo:** componente `Icon` com `react-native-svg` e os paths do Make, com cor por
  `currentColor`/prop.
- **Fora:** os Ionicons, que continuam só até a migração das telas antigas.
- **Arquivos:** `src/components/Icon/**` (novo componente; o atual vira `IconLegacy` se ainda for
  usado).
- **AC:**
  - AC-DS-02-01 os 22 nomes renderizam; tamanho e cor são configuráveis. `CT`
  - AC-DS-02-02 o ícone é decorativo (`accessible={false}`) e o rótulo fica no botão. `CT`

#### DS-03 — Botões e controles

- **Classe:** B
- **Figma:**
  - `Button`: `.button` e `--primary`, `--secondary`, `--ghost`, `--soft`;
  - `IconButton` (`.icon-button` 42);
  - `.back-button`;
  - `.switch` / `--on`;
  - `.check-list` e `.criteria-list` (checkbox 21 com raio 7);
  - `.segmented`;
  - `.filter-chip` / `--active` com `.filter-row` rolável;
  - `.tabs` / `.tab--active`.
- **Dep.:** DS-01, DS-02
- **Arquivos:** `src/components/{Button,IconButton,BackButton,Switch,Checkbox,CheckList,SegmentedControl,FilterChip,Tabs}/**`.
- **AC:**
  - AC-DS-03-01 as variantes visuais batem com o Make (cor, borda, sombra, raio 13, altura 44 e 50
    em `full`). `CT` + `MAN`
  - AC-DS-03-02 role e estado acessíveis (`button`, `switch` com `checked`, `checkbox`, `tab` com
    `selected`). `CT`
  - AC-DS-03-03 o efeito de toque (`scale .98`) é feito com Pressable e respeita "reduzir
    movimento". `CT`

#### DS-04 — Campos e formulários

- **Classe:** B
- **Figma:** `.field` (rótulo 11/800, input com raio 13, foco com borda `brand-500` e anel
  `brand-100`), `.field-grid`, `.search-field`; `select` e `input[type=date|time]` do
  `SimpleFormScreen`
- **Dep.:** DS-01, DS-02
- **Escopo:**
  - `Field` (texto, multilinha, número e telefone);
  - `SelectField` (sheet de opções);
  - `DateField` e `TimeField` com `@react-native-community/datetimepicker`, que já está instalado;
  - `SearchField`.
- **Arquivos:** `src/components/{Field,SelectField,DateField,TimeField,SearchField}/**`.
- **AC:**
  - AC-DS-04-01 integra com RHF + Zod e mostra o erro acessível abaixo do campo. `CT`
  - AC-DS-04-02 data e hora no fuso `America/Sao_Paulo` (G-13). `UT`

#### DS-05 — Cards e blocos

- **Classe:** B
- **Figma:**
  - `Avatar` (`.avatar`, raio 15, iniciais);
  - `.badge`;
  - `InfoCard`;
  - `SectionTitle`;
  - `.feature-row`;
  - `.progress`;
  - `.mini-bars`;
  - `.toast`;
  - `.success-panel`;
  - `.ai-context`, `.ai-insight`, `.ai-hero`, `.insight-card`;
  - `.privacy-note`;
  - `.floating-action`;
  - `.timeline-item` (com `--done` e `--active`).
- **Dep.:** DS-01, DS-02, DS-03
- **Arquivos:** `src/components/{Avatar,Badge,InfoCard,SectionTitle,FeatureRow,ProgressBar,MiniBars,Toast,SuccessPanel,AIBlock,PrivacyNote,Fab,Timeline}/**`.
- **AC:**
  - AC-DS-05-01 os componentes renderizam as variantes do Make. `CT`
  - AC-DS-05-02 o `Toast` some sozinho em 2,2 s e é anunciado ao leitor de tela. `CT`
  - AC-DS-05-03 a tela de catálogo (só em dev) mostra todos os componentes. `MAN`

#### DS-06 — Migração visual das telas mantidas

- **Classe:** B
- **Dep.:** DS-01 a DS-05
- **Escopo:** Login (`app/(auth)/login.tsx`, `LoginForm`), recuperar senha (placeholder), estados
  de tela (`LoadingState`, `EmptyState`, `ErrorState`) e "Em breve", no novo tema.
- **AC:**
  - AC-DS-06-01 os testes existentes continuam verdes. `CMD`
  - AC-DS-06-02 o Login segue as cores e tipografia novas, sem corte de texto no Android. `MAN`

### 4.3 Navegação

#### NAV-01 — Abas Início, Agenda, Pacientes e Recursos

- **Classe:** B
- **US:** US2-15
- **Figma:** `navigation` e `App()` (`rootScreen`), `.bottom-nav` (altura 76, ativo com fundo
  `brand-50` e cor `brand-700`, rótulo 10/800)
- **Dep.:** DS-03, G-31 revisado
- **Escopo:**
  - `app/(tabs)/` com `index`, `agenda`, `patients` e `resources`;
  - as abas atuais Atividades e Relatórios saem da barra;
  - as rotas internas mantêm a aba-mãe ativa.
- **Arquivos:** `app/(tabs)/_layout.tsx`, `src/components/TabBar/**`,
  `src/features/shell/useTabItems.ts`.
- **AC:**
  - AC-NAV-01-01 as 4 abas navegam com os ícones `home`, `calendar`, `users` e `grid`. `CT`
  - AC-NAV-01-02 em `/patients/[id]` a aba Pacientes fica ativa; em `/plans` a aba Recursos fica
    ativa. `CT`
  - AC-NAV-01-03 a barra respeita a safe area inferior. `MAN`

#### NAV-02 — Cabeçalho novo

- **Classe:** B
- **US:** US2-15
- **Figma:** `AppHeader`, `.app-header` (fixo, translúcido), `.eyebrow`, `.back-button`
- **Dep.:** DS-03
- **Escopo:** `AppHeader` com `title`, `subtitle` (eyebrow) e `back`; o sino aparece nas telas
  raiz e o voltar nas internas.
- **Arquivos:** `src/components/AppHeader/**` e o uso em `app/(tabs)/_layout.tsx`.
- **AC:**
  - AC-NAV-02-01 o voltar usa `router.back()` e tem o rótulo "Voltar". `CT`
  - AC-NAV-02-02 o sino abre NOT-01, com o rótulo "Notificações". `CT`

#### NAV-03 — Limpeza da Entrega 1

- **Classe:** B
- **Dep.:** G-33, NAV-01
- **Escopo:** conforme G-33, remover as rotas e telas substituídas:
  - `app/session/*`;
  - `app/content/*` (cadernos e grupos);
  - abas antigas;
  - `features/sessions` e `content-*`.

  Testes de código removido saem junto; nada que continua em uso é removido.

- **AC:**
  - AC-NAV-03-01 sem rota órfã nem import morto (`lint` e `typecheck`). `CMD`
  - AC-NAV-03-02 CI verde. `CMD`

### 4.4 Início

#### HOME-01 — Tela Início

- **Classe:** B
- **US:** US2-01
- **Figma:** `HomeScreen`
  - Cabeçalho "Olá, {nome}" com eyebrow da data por extenso.
  - `.hero-card`: "Próximo atendimento", `.live-dot`, `Avatar`, nome, "horário · tipo", ações
    "Ver ficha" (secondary, `clipboard`) e "Iniciar sessão" (primary, `play`).
  - `.quick-grid` com 4 `.quick-card`: "Novo paciente", "Criar plano", "Aplicar escala",
    "Atividades".
  - `.timeline-card` "Agenda de hoje", com "Ver agenda", itens `--done` e `--active` e
    `IconButton` "Notificar responsável".
  - `.insight-card` "N sugestões da IA para revisar".
- **Dep.:** NAV-01, NAV-02, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /educator/me` — nome para "Olá, {nome}"
  - `GET /appointment/` — agenda de hoje e próximo atendimento (filtro por dia e status no cliente)
  - `GET /student/` — nome do paciente de cada atendimento (não há `GET /student/:id`)
  - `GET /educator/get-last-sessions` — se o Início mostrar sessões recentes
- **Ainda não existe na API (pendência para a API-01):**
  - tipo do atendimento ("Terapia de aprendizagem"): `Appointment` não tem esse campo
  - "Notificar responsável" sob demanda: só existe `POST /appointment/notify`, job interno com `x-job-api-key`, que o app não chama
  - sugestões da IA para revisar (contagem e resumo)
  - resumo "Plano educacional preparado" e "evolução registrada" por atendimento
- **Arquivos:** `app/(tabs)/index.tsx`, `src/features/home/**` (substitui a Home atual).
- **AC:**
  - AC-HOME-01-01 o hero mostra o próximo atendimento não concluído de hoje. Sem nenhum, aparece o
    estado vazio "Sem atendimentos hoje" com "Ver agenda". `CT`
  - AC-HOME-01-02 "Ver ficha" leva a `/patients/{id}`; "Iniciar sessão" leva a
    `/sessions/{appointmentId}/evolution`. `CT`
  - AC-HOME-01-03 os atalhos levam a `/patients/new`, `/plans/new`, `/assessments` e
    `/activities`. `CT`
  - AC-HOME-01-04 a linha do tempo ordena por horário em SP e marca concluído e atual. `UT`
  - AC-HOME-01-05 "Notificar responsável" chama `messaging` uma vez e mostra o toast; um erro mostra
    a mensagem, sem reenvio. `CT`
  - AC-HOME-01-06 o cartão da IA mostra a contagem real e leva a PLN-05. Com zero sugestões, ele
    some. `CT`

### 4.5 Agenda

#### AGE-01 — Tela Agenda

- **Classe:** B
- **US:** US2-02
- **Figma:** `AgendaScreen`
  - eyebrow "mês de ano";
  - `.date-strip` / `.date-chip` / `--active` (seg–sex);
  - `SectionTitle` "N atendimentos";
  - `.appointment` / `--current` com `.appointment__time` (hora e duração), `.appointment__line` e
    `.appointment__copy` (paciente, tipo, "Concluído" com `check`);
  - `full-button` "Novo atendimento" (`plus`).
- **Dep.:** NAV-01, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /appointment/` — lista do educador; o filtro por dia é feito no cliente (a rota não tem query de data)
  - `GET /student/` — nome do paciente
- **Ainda não existe na API (pendência para a API-01):**
  - duração do atendimento ("50 min")
  - tipo do atendimento ("Psicopedagogia", "Avaliação")
- **Reaproveita:** seletores e mutações de `src/features/appointments/` (T-901).
- **Arquivos:** `app/(tabs)/agenda.tsx`, `src/features/agenda/**`.
- **AC:**
  - AC-AGE-01-01 a faixa de dias mostra a semana atual com hoje ativo, e tem navegação para a
    semana anterior e a próxima. `CT`
  - AC-AGE-01-02 trocar o dia refaz a lista e a contagem. `CT`
  - AC-AGE-01-03 o item atual é o próximo não concluído (SP). `UT`
  - AC-AGE-01-04 tocar num item abre as ações (AGE-03). `CT`

#### AGE-02 — Mensagens automáticas (WhatsApp)

- **Classe:** B
- **US:** US2-03
- **Figma:** `.setting-card` "Mensagens automáticas" ("Confirmações, cancelamentos e remarcações
  via WhatsApp"), `.switch`; `IconButton` `message` "Notificar" no item atual; `.toast`
  "Mensagem preparada para o responsável"
- **Dep.:** AGE-01, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `Appointment.notifiedAt` — só leitura, indica se houve notificação
- **Ainda não existe na API (pendência para a API-01):**
  - preferência "Mensagens automáticas" (ligar/desligar)
  - envio manual "Notificar responsável" (o `POST /appointment/notify` é interno)
- **AC:**
  - AC-AGE-02-01 o interruptor reflete e persiste a preferência; um erro reverte a posição e
    avisa. `CT`
  - AC-AGE-02-02 "Notificar" envia uma vez e mostra o toast; sem reenvio automático (G-08). `CT`

#### AGE-03 — Novo, editar, remarcar e cancelar atendimento

- **Classe:** B
- **US:** US2-02
- **Figma:** `SimpleFormScreen` (atendimento)
  - "Novo atendimento" com eyebrow "Agendamento";
  - campos Paciente (select), Data e Horário (`.field-grid`) e Tipo de atendimento;
  - `.setting-card--form` "Confirmar por WhatsApp";
  - "Agendar atendimento".
- **Dep.:** AGE-01, DS-04, PAC-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /appointment/` — `studentId`, `scheduledAt`, `observation?`
  - `PUT /appointment/:id` — só `scheduledAt` e `observation` (remarcar e editar observação)
  - `DELETE /appointment/:id` — excluir
  - `GET /appointment/:id` — detalhe
  - `GET /student/` — seletor de paciente
- **Ainda não existe na API (pendência para a API-01):**
  - tipo do atendimento e duração
  - flag "Confirmar por WhatsApp" por atendimento
  - cancelar mantendo o registro (status `CANCELLED`): o `PUT` não aceita `status`; hoje só há exclusão
  - validação de conflito de horário
- **Arquivos:** `app/agenda/new.tsx`, `app/agenda/[id].tsx`, `src/features/agenda/form/**`.
- **AC:**
  - AC-AGE-03-01 criar envia o payload da API e o item aparece na Agenda e no Início. `CT`
  - AC-AGE-03-02 editar e remarcar só enviam os campos alterados; cancelar pede confirmação. `CT`
  - AC-AGE-03-03 um conflito de horário devolvido pela API aparece no campo. `CT`

#### AGE-04 — Iniciar sessão a partir do atendimento

- **Classe:** B
- **US:** US2-06
- **Dep.:** AGE-01, EVO-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /task-notebook-session/start` — cria a sessão (`studentId`, `name`)
  - `POST /task-notebook-session/finish` — encerra a sessão
- **Ainda não existe na API (pendência para a API-01):**
  - vínculo atendimento ↔ sessão (o `start` não recebe `appointmentId`)
  - marcar o atendimento como concluído: o `PUT /appointment/:id` não aceita `status`
- **Escopo:** "Iniciar sessão" no Início e no item da Agenda abre a Evolução do atendimento e
  marca o início conforme a API.
- **AC:**
  - AC-AGE-04-01 depois de salvar a evolução, o atendimento aparece "Concluído" na Agenda e no
    Início. `CT` + `MAN`

### 4.6 Pacientes

#### PAC-01 — Lista de pacientes

- **Classe:** B
- **US:** US2-04
- **Figma:** `PatientsScreen`
  - eyebrow "N pacientes ativos";
  - `.search-field` "Buscar paciente";
  - `.filter-row` com Todos / Com sessão hoje / Pendências;
  - `.patient-card` com `Avatar` em tom, nome, "idade · status" e próximo atendimento com
    `clock`;
  - `.floating-action` "Cadastrar paciente".
- **Dep.:** NAV-01, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /student/` — lista com nome, idade (`age`), gênero e foto
  - `GET /appointment/` — próximo atendimento por paciente (calculado no cliente)
- **Ainda não existe na API (pendência para a API-01):**
  - status do paciente ("PDI ativo", "Avaliação pendente", "PE em revisão")
  - filtro "Pendências" (depende do status)
  - conceito de "paciente ativo" para a contagem
- **Substitui:** UX4-L (`src/features/students-list`).
- **Arquivos:** `app/(tabs)/patients.tsx`, `src/features/patients/list/**`.
- **AC:**
  - AC-PAC-01-01 a busca ignora acento e maiúscula. `UT`
  - AC-PAC-01-02 "Com sessão hoje" e "Pendências" filtram pelos campos da API. `UT`
  - AC-PAC-01-03 o tom do avatar é determinístico por paciente. `UT`
  - AC-PAC-01-04 o botão flutuante leva a `/patients/new`. `CT`

#### PAC-02 — Novo paciente

- **Classe:** B
- **US:** US2-04
- **Figma:** `SimpleFormScreen` (paciente)
  - "Novo paciente" com eyebrow "Informações iniciais";
  - Nome completo, Data de nascimento, Responsável e Telefone do responsável;
  - "Dificuldades identificadas" (`.check-list`: Linguagem, Consciência fonológica, Leitura e
    escrita, Atenção, Comportamento adaptativo);
  - "Observações adicionais";
  - "Salvar e criar PDI" (`arrow`).
- **Dep.:** DS-04, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /student/create` (multipart) — `name`, `age`, `gender`, `zipcode`, `road`, `housenumber`, `phonenumber`, `learningTopics[]`, `photo?`
- **Ainda não existe na API (pendência para a API-01):**
  - data de nascimento (a API recebe `age`, número)
  - nome do responsável (só existe `phonenumber`)
  - catálogo de dificuldades (a API tem `learningTopics: string[]` livre)
  - observações adicionais
  - desvio inverso: a API **exige** `gender`, `zipcode`, `road` e `housenumber`, que o formulário do Figma não tem; decidir na API-01
- **Substitui:** UX4-C.
- **Arquivos:** `app/patients/new.tsx`, `src/features/patients/form/**`.
- **AC:**
  - AC-PAC-02-01 a validação segue o contrato; o telefone é enviado só com dígitos. `CT`
  - AC-PAC-02-02 as dificuldades vêm do catálogo da API, e não de uma lista fixa. `CT`
  - AC-PAC-02-03 salvar leva a `/plans/new?patientId=` (PLN-02) e o paciente aparece na lista. `CT`

#### PAC-03 — Ficha: Visão geral

- **Classe:** B
- **US:** US2-05
- **Figma:** `PatientDetail`, aba `visao`
  - `.patient-summary`: avatar, nome, "Responsável: …" e `IconButton` `message`.
  - `.tabs`: Visão geral, Planos, Avaliações.
  - `.status-panel` "PDI vigente": `badge` "Ativo", título, "Vigência… · N% dos objetivos em
    progresso", `.progress` e "Ver plano completo".
  - "Próxima sessão": `.next-session-card` (dia e mês em pêssego).
  - "Dificuldades mapeadas" (`.tag-list`, com "Editar").
  - "Evolução recente": `.evolution-card` com +N% e `.mini-bars`.
- **Dep.:** PAC-01, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /student/` — dados do paciente (seleção pelo id no cliente; não há `GET /student/:id`)
  - `GET /appointment/` — próxima sessão
  - `GET /task-notebook-session/analysis/student/:studentId` — acerto por sessão e categoria, base para a "Evolução recente"
  - `Student.learningTopics` — "Dificuldades mapeadas"
- **Ainda não existe na API (pendência para a API-01):**
  - PDI vigente (título, vigência, % dos objetivos)
  - responsável do paciente
  - variação "+N% nos últimos 60 dias" pronta (precisaria ser calculada no cliente a partir da análise; decidir)
- **Arquivos:** `app/patients/[id].tsx`, `src/features/patients/detail/**`.
- **AC:**
  - AC-PAC-03-01 cada bloco mostra o estado vazio próprio: sem PDI, sem sessão, sem
    evolução. `CT`
  - AC-PAC-03-02 o % e a série vêm da API; o cliente não calcula. `CT`
  - AC-PAC-03-03 "Ver plano completo" abre PLN-04 e "Editar" abre PAC-07. `CT`

#### PAC-04 — Ficha: Planos

- **Classe:** B
- **US:** US2-05
- **Figma:** `PatientDetail`, aba `planos`: `InfoCard` "PDI · Mar–Ago 2025", `InfoCard` "PE ·
  Sessão 12/06", `Button` soft "Criar novo plano"
- **Dep.:** PAC-03, PLN-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - PDI e PE por paciente (nenhum endpoint de plano)
- **AC:**
  - AC-PAC-04-01 lista os PDI e PE do paciente, com status. `CT`
  - AC-PAC-04-02 "Criar novo plano" abre PLN-02 com o paciente. `CT`

#### PAC-05 — Ficha: Avaliações

- **Classe:** B
- **US:** US2-05
- **Figma:** `PatientDetail`, aba `avaliacoes`: `InfoCard` "Escala de rastreio TDAH" ("Ver
  resultado"), `InfoCard` "Anamnese" ("Ver síntese"), "Nova avaliação"
- **Dep.:** PAC-03, AVA-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /anamnese/responses/student/:studentId` — anamneses do paciente
- **Ainda não existe na API (pendência para a API-01):**
  - aplicações de escalas (nenhum endpoint de avaliação ou escala)
- **AC:**
  - AC-PAC-05-01 lista as aplicações e a anamnese do paciente. `CT`
  - AC-PAC-05-02 "Ver resultado" leva a AVA-04, "Ver síntese" a PAC-06 e "Nova avaliação" a AVA-02
    com o paciente. `CT`

#### PAC-06 — Anamnese

- **Classe:** B
- **US:** US2-05
- **Figma:** só o destino "Ver síntese"; tela sem desenho, montada com os componentes base
  (G-18).
- **Dep.:** PAC-03, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /anamnese/templates/` e `GET /anamnese/templates/:templateId` — modelos
  - `POST /anamnese/templates/:templateId/responses` — responder
  - `POST /anamnese/responses/upload-file` — pergunta do tipo arquivo
  - `GET /anamnese/responses/student/:studentId` e `GET /anamnese/responses/:responseId` — respostas
  - `GET /task-notebook-session/analysis/student/:studentId/ai?templateId=` — análise em Markdown que inclui a anamnese
- **Ainda não existe na API (pendência para a API-01):**
  - "síntese da anamnese" dedicada (só há a análise geral por IA)
  - editar uma resposta existente (só há criação)
- **Arquivos:** `app/patients/[id]/anamnese.tsx`, `src/features/patients/anamnese/**`.
- **AC:**
  - AC-PAC-06-01 a síntese é exibida e o formulário é preenchível, com tipos de pergunta
    Descritiva, Múltipla escolha, Checkbox e Arquivo (conforme a API). `CT`
  - AC-PAC-06-02 o envio registra a data, e a ficha mostra "Atualizada em". `CT`

#### PAC-07 — Editar paciente e contatar responsável

- **Classe:** B
- **US:** US2-04
- **Dep.:** PAC-02, PAC-03, G-36
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `PUT /student/update/:id` (multipart) — campos opcionais
  - `Student.phonenumber` — número para o contato
- **Ainda não existe na API (pendência para a API-01):**
  - dados do responsável (nome e telefone separados do paciente)
- **Escopo:** reaproveitar o formulário de PAC-02 para edição; o botão `message` abre o WhatsApp
  do responsável por `Linking`, conforme G-36.
- **AC:**
  - AC-PAC-07-01 a edição envia só os campos alterados e reflete na ficha e na lista. `CT`
  - AC-PAC-07-02 sem WhatsApp instalado, oferece a ligação ou mostra o número. `CT`

### 4.7 Evolução da sessão

#### EVO-01 — Evolução da sessão

- **Classe:** B
- **US:** US2-06
- **Figma:** `EvolutionScreen`
  - Cabeçalho "Evolução da sessão" com eyebrow "{paciente} · {data}" e voltar.
  - `.session-summary` "PE · {tema}" com "duração · N critérios mensuráveis".
  - "Critérios da sessão" (`.criteria-list`, título e detalhe como "8 de 10 tentativas").
  - "Registro descritivo" (textarea).
  - `.ai-context` "Sugestão para a próxima sessão".
  - "Salvar e atualizar prontuário".
  - `.success-panel` "Evolução registrada".
- **Dep.:** DS-03, DS-04, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /task-notebook-session/start`, `POST /task-notebook-session/finish`
  - `POST /task-notebook-session/observation` — "Registro descritivo" (só depois de finalizar)
  - `GET /task-notebook-session/analysis/student/:studentId/ai` — texto com "Guia de Intervenção", base possível para a sugestão
- **Ainda não existe na API (pendência para a API-01):**
  - PE da sessão e critérios mensuráveis (listar e salvar critérios)
  - "Sugestão para a próxima sessão" dedicada
  - vínculo da sessão com o atendimento
  - "atualizar prontuário" como entidade própria
- **Arquivos:** `app/sessions/[appointmentId]/evolution.tsx`, `src/features/evolution/**`.
- **AC:**
  - AC-EVO-01-01 os critérios vêm do PE da sessão; sem PE, há um aviso com o atalho "Criar PE"
    (PLN-02). `CT`
  - AC-EVO-01-02 salvar envia os critérios marcados e o registro uma única vez; o botão fica
    desabilitado durante o envio. `CT`
  - AC-EVO-01-03 depois do sucesso, aparece o painel e o atendimento fica concluído. `CT`
  - AC-EVO-01-04 sair com alteração não salva pede confirmação. `CT`

#### EVO-02 — Prontuário

- **Classe:** B
- **US:** US2-06
- **Dep.:** EVO-01, PAC-03
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /task-notebook-session/student/:studentId` — sessões do paciente
  - `GET /task-notebook-session/report/:sessionId` — métricas e observação da sessão
- **Ainda não existe na API (pendência para a API-01):**
  - critérios por sessão no histórico (só existe `observation`)
- **Escopo:** histórico cronológico das evoluções do paciente, com o detalhe de cada registro.
- **Arquivos:** `app/patients/[id]/records.tsx`, `src/features/evolution/records/**`.
- **AC:**
  - AC-EVO-02-01 a evolução salva aparece no topo do histórico. `CT`
  - AC-EVO-02-02 alimenta a "Evolução recente" da ficha (PAC-03). `CT`

#### EVO-03 — Atividade durante a sessão

- **Classe:** B
- **US:** US2-06, US2-10
- **Dep.:** EVO-01, ATV-03, G-35
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /task-notebook-session/answer` — respostas de tarefas de múltipla escolha na sessão
- **Ainda não existe na API (pendência para a API-01):**
  - resultado de atividades que não são de múltipla escolha (jogos)
- **Escopo:** abrir na Evolução uma atividade recomendada (ATV-03) e voltar com o resultado
  anexado, se a API registrar.
- **AC:**
  - AC-EVO-03-01 o resultado aparece no resumo da evolução quando a API suportar; senão, a
    atividade roda sem registro e isso é indicado. `CT`

### 4.8 Planos com IA

#### PLN-01 — Hub de planos

- **Classe:** B
- **US:** US2-07
- **Figma:** `PlansScreen` (`mode=hub`)
  - "Planos com IA" com eyebrow "PDI e planejamento educacional".
  - `.ai-hero` "Planejamento conectado à evolução real" com "Criar novo plano".
  - "Em andamento": `InfoCard` por plano (% e revisão).
  - "Próximas sessões planejadas" (`.compact-list`).
- **Dep.:** NAV-02, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - PDI e PE: listar planos, % e revisão
  - "Próximas sessões planejadas"
- **Arquivos:** `app/plans/index.tsx`, `src/features/plans/hub/**`.
- **AC:**
  - AC-PLN-01-01 lista os planos reais com % e prazo. `CT`
  - AC-PLN-01-02 cada item abre PLN-04, e "Criar novo plano" abre PLN-02. `CT`

#### PLN-02 — Gerar planejamento com IA

- **Classe:** B
- **US:** US2-07
- **Figma:** `PlansScreen` (`mode=generate`)
  - "Novo planejamento" com eyebrow do paciente.
  - `.segmented` PDI / PE da sessão.
  - "Foco do planejamento" (textarea).
  - `.ai-context` "Contexto conectado".
  - "Dificuldades consideradas" (`.check-list`).
  - "Duração de referência" (3 ou 6 meses).
  - "Gerar planejamento com IA" (`sparkles`).
- **Dep.:** PLN-01, PAC-03, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /ai-task/generate` — gera **tarefas** de múltipla escolha, não planos (referência de padrão de IA)
  - `GET /task-notebook-session/analysis/student/:studentId/ai` — análise com "Guia de Intervenção"
- **Ainda não existe na API (pendência para a API-01):**
  - gerar PDI e PE com IA a partir de foco, dificuldades e duração
- **Arquivos:** `app/plans/new.tsx`, `src/features/plans/generate/**`.
- **AC:**
  - AC-PLN-02-01 sem paciente na rota, pede para escolher um. `CT`
  - AC-PLN-02-02 as dificuldades vêm do paciente, já marcadas. `CT`
  - AC-PLN-02-03 a geração mostra o carregamento, o resultado ou o erro, com timeout e sem
    reenvio automático. `CT`
  - AC-PLN-02-04 o PE da sessão pede o atendimento e a data. `CT`

#### PLN-03 — Rascunho editável

- **Classe:** B
- **US:** US2-07
- **Figma:** `.generated-sheet`
  - "Rascunho gerado" com `badge` "Editável";
  - "Plano de Desenvolvimento Individual";
  - "Objetivo geral", "Metas prioritárias" e "Ajustes do profissional";
  - "Compartilhar" e "Salvar PDI".
- **Dep.:** PLN-02, DS-04
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - salvar e editar PDI/PE
- **AC:**
  - AC-PLN-03-01 objetivo e metas são editáveis antes de salvar. `CT`
  - AC-PLN-03-02 salvar persiste e leva ao detalhe (PLN-04). `CT`
  - AC-PLN-03-03 "Compartilhar" usa o `Share` nativo com uma síntese em texto. `CT`

#### PLN-04 — Detalhe do plano

- **Classe:** B
- **US:** US2-08
- **Figma:** só o destino "Ver plano completo" / "Continuar plano"; tela montada com os
  componentes base (G-18).
- **Dep.:** PLN-03
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - detalhe do plano, objetivos, progresso e revisão
- **Arquivos:** `app/plans/[id].tsx`, `src/features/plans/detail/**`.
- **AC:**
  - AC-PLN-04-01 mostra objetivos e metas com progresso, vigência e data de revisão. `CT`
  - AC-PLN-04-02 é possível atualizar o status de cada objetivo e registrar a revisão. `CT`

#### PLN-05 — Sugestões da IA

- **Classe:** B
- **US:** US2-08
- **Figma:** `.insight-card` do Início ("2 sugestões da IA para revisar")
- **Dep.:** PLN-04, HOME-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - sugestões da IA (listar, aceitar, descartar)
- **Arquivos:** `app/plans/suggestions.tsx`, `src/features/plans/suggestions/**`.
- **AC:**
  - AC-PLN-05-01 aceitar aplica a sugestão no plano; descartar remove da lista. `CT`
  - AC-PLN-05-02 a contagem do Início é atualizada. `CT`

### 4.9 Avaliações e escalas

#### AVA-01 — Hub de avaliações

- **Classe:** B
- **US:** US2-09
- **Figma:** `AssessmentsScreen` (`started=false`)
  - `.assessment-hero` "Nova aplicação" com "Escolher escala".
  - "Modelos disponíveis": `InfoCard` com nº de itens e tempo, e "Aplicar escala".
  - "Aplicações recentes": `.result-row` com `.badge--warning`.
- **Dep.:** NAV-02, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /anamnese/templates/` — único recurso de modelos de perguntas, mas é anamnese e não tem escore
- **Ainda não existe na API (pendência para a API-01):**
  - modelos de escala (itens, tempo)
  - aplicações recentes com faixa
- **Arquivos:** `app/assessments/index.tsx`, `src/features/assessments/hub/**`.
- **AC:**
  - AC-AVA-01-01 os modelos e as aplicações vêm da API. `CT`
  - AC-AVA-01-02 a badge reflete a faixa do resultado. `CT`

#### AVA-02 — Aplicar escala

- **Classe:** B
- **US:** US2-09
- **Figma:** `AssessmentsScreen` (`started=true`)
  - `.form-progress` "N de M";
  - `.instruction`;
  - `.question-card` com `.scale-option` / `--active` (Nunca, Às vezes, Frequentemente, Muito).
- **Dep.:** AVA-01, DS-03, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - iniciar e responder uma aplicação de escala
- **Arquivos:** `app/assessments/apply/[templateId].tsx`, `src/features/assessments/apply/**`.
- **AC:**
  - AC-AVA-02-01 as opções vêm da escala do modelo. `CT`
  - AC-AVA-02-02 o progresso atualiza a cada resposta. `CT`
  - AC-AVA-02-03 exige o paciente. `CT`

#### AVA-03 — Escore e insight

- **Classe:** B
- **US:** US2-09
- **Figma:** `.score-preview` ("Pontuação parcial", N/M, faixa e o aviso "O resultado não
  substitui avaliação clínica completa"), `.ai-insight` "Insight preliminar", "Salvar
  rascunho" e "Concluir escala"
- **Dep.:** AVA-02
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - escore, faixa e insight da IA
- **AC:**
  - AC-AVA-03-01 escore, faixa e insight vêm do backend; o cliente não interpreta. `CT`
  - AC-AVA-03-02 o aviso clínico aparece sempre. `CT`
  - AC-AVA-03-03 concluir trava a edição e leva a AVA-04. `CT`

#### AVA-04 — Resultado da aplicação

- **Classe:** B
- **US:** US2-09
- **Figma:** só o destino "Ver resultado" (G-18)
- **Dep.:** AVA-03
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - resultado de uma aplicação
- **Arquivos:** `app/assessments/results/[id].tsx`.
- **AC:**
  - AC-AVA-04-01 mostra escore, faixa, insight e data, e as respostas se a API expuser. `CT`

#### AVA-05 — Rascunhos

- **Classe:** B
- **US:** US2-09
- **Dep.:** AVA-03
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - rascunho de aplicação
- **AC:**
  - AC-AVA-05-01 "Salvar rascunho" persiste no backend. `CT`
  - AC-AVA-05-02 reabrir o rascunho retoma na primeira pergunta sem resposta. `CT`

### 4.10 Banco de atividades

#### ATV-01 — Banco de atividades

- **Classe:** B
- **US:** US2-10
- **Figma:** `ActivitiesScreen` (`activity=false`)
  - "Atividades" com eyebrow "Banco pedagógico";
  - `.search-field` "Buscar por habilidade ou tema";
  - `.filter-row` Todas / Interativas / Imprimíveis;
  - `.activity-feature` ("Recomendado para {paciente}", "Iniciar atividade", `.letter-art`);
  - "Atividades prontas" com "Ver todas";
  - `.activity-grid` com `.activity-thumb--mint`, `--peach`, `--lavender` e `--yellow`.
- **Dep.:** NAV-02, DS-05, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /task/` — filtros `category`, `type`, `promptContains`
  - `GET /task-group/list-by-educator`, `GET /task-notebook/` — conteúdo agrupado
- **Ainda não existe na API (pendência para a API-01):**
  - formato interativa/imprimível, habilidade e tema
  - atividade recomendada por paciente
  - miniatura/ilustração
- **Arquivos:** `app/activities/index.tsx`, `src/features/activities/**` (substitui a aba
  Atividades da Entrega 1).
- **AC:**
  - AC-ATV-01-01 a busca e os filtros usam os campos de habilidade, tema e formato da API. `UT`
  - AC-ATV-01-02 a recomendada só aparece se houver paciente de contexto. `CT`

#### ATV-02 — Ver todas e detalhe

- **Classe:** B
- **US:** US2-10
- **Dep.:** ATV-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /task/:id` — detalhe de uma tarefa
  - `GET /task/` — lista (sem paginação no servidor)
- **Ainda não existe na API (pendência para a API-01):**
  - paginação no servidor
  - detalhe de atividades que não são `Task`
- **AC:**
  - AC-ATV-02-01 lista paginada. `CT`
  - AC-ATV-02-02 o detalhe mostra habilidade e formato, com "Jogar" (ATV-03) ou "Imprimir"
    (ATV-05). `CT`

#### ATV-03 — Motor de atividades interativas

- **Classe:** A/B
- **US:** US2-10
- **Figma:** `.game-shell`, `.game-progress` "Atividade N de M", `.game-illustration`, título,
  instrução, `.success-message` e "Tentar novamente"
- **Dep.:** ATV-02, G-35
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /task-notebook-session/start`, `answer`, `finish` — para o tipo quiz
- **Ainda não existe na API (pendência para a API-01):**
  - catálogo de tipos de atividade jogáveis e registro genérico de resultado
- **Arquivos:** `app/activities/[id].tsx`, `src/features/activities/engine/**`.
- **AC:**
  - AC-ATV-03-01 há um registro de tipos (`type → componente`), e um tipo desconhecido mostra a
    mensagem de indisponível. `UT`
  - AC-ATV-03-02 o progresso avança entre os itens. `CT`
  - AC-ATV-03-03 o resultado é enviado uma vez quando houver paciente ou sessão. `CT`

#### ATV-04 — Tipos de atividade

- **Classe:** B
- **US:** US2-10
- **Dep.:** ATV-03
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - ATV-04c (Leia e responda): `GET /task/` com `type=multipleChoice`, `POST /ai-task/generate` e `POST /task/batch` para criar conteúdo
- **Ainda não existe na API (pendência para a API-01):**
  - ATV-04a, b e d: conteúdo e tipo (`TaskType` só tem `multipleChoice` e `multipleChoiceWithMedia`)
- **Escopo:** um componente por tipo do catálogo da API. Os do Figma:

  | Subtarefa | Atividade           | Formato                                                                         |
  | --------- | ------------------- | ------------------------------------------------------------------------------- |
  | ATV-04a   | **Forme a palavra** | `.word-slots` / `--success`, `.letter-pool`; tocar no slot desfaz a partir dele |
  | ATV-04b   | Associe as cores    | Associação                                                                      |
  | ATV-04c   | Leia e responda     | Quiz; reaproveita o modelo de múltipla escolha da Entrega 1                     |
  | ATV-04d   | Memória visual      | Atenção                                                                         |

- **AC:**
  - AC-ATV-04-01 cada tipo é jogável do início ao fim com acerto e erro. `CT` + `MAN`
  - AC-ATV-04-02 alvos de toque ≥ 44 e rótulos acessíveis nas letras e cartas. `CT`

#### ATV-05 — Imprimíveis

- **Classe:** B
- **US:** US2-10
- **Figma:** miniatura "Complete a sequência · Imprimível" (`print`)
- **Dep.:** ATV-02, G-34
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - PDF de atividade imprimível
- **AC:**
  - AC-ATV-05-01 abre o PDF da atividade, que imprime e é compartilhado (`expo-print` /
    `expo-sharing`). `MAN`

### 4.11 Relatórios

#### REL-01 — Configurar relatório

- **Classe:** B
- **US:** US2-11
- **Figma:** `ReportsScreen`
  - `.privacy-note` "Relatórios seguros por padrão";
  - campos Paciente, Tipo de relatório e Período;
  - "Incluir no documento" (`.check-list` com 5 itens);
  - "Gerar síntese".
- **Dep.:** NAV-02, DS-04, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /task-notebook-session/report/:sessionId` — relatório de uma sessão (JSON)
  - `GET /task-notebook-session/analysis/student/:studentId` — análise numérica
  - `POST /task-notebook-session/analysis/student/:studentId/snapshot` — gera e persiste análise
  - `GET /task-notebook-session/analysis/student/:studentId/ai` — análise em Markdown
- **Ainda não existe na API (pendência para a API-01):**
  - geração de documento com tipo, seções e período configuráveis
  - tipos "Anamnese e avaliações" e "Evolução do PDI" (dependem de escalas e planos)
- **Arquivos:** `app/reports/index.tsx`, `src/features/reports/**`.
- **AC:**
  - AC-REL-01-01 os tipos, as seções e os períodos vêm da API. `CT`
  - AC-REL-01-02 a geração mostra o carregamento e o erro, sem reenvio. `CT`

#### REL-02 — Prévia e exportação

- **Classe:** B
- **US:** US2-11
- **Figma:** `.report-preview` ("Relatório pronto", "PDF · N páginas"), `.paper-preview`,
  "Imprimir" e "Enviar"
- **Dep.:** REL-01, G-34
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - PDF do relatório (nº de páginas, download)
  - envio pelo backend
- **AC:**
  - AC-REL-02-01 o PDF do backend é baixado num arquivo temporário e apagado depois. `UT`
  - AC-REL-02-02 imprime e compartilha. `MAN`
  - AC-REL-02-03 nenhum dado do relatório vai para log. `REV`

#### REL-03 — Histórico de relatórios

- **Classe:** B
- **US:** US2-11
- **Dep.:** REL-02
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /task-notebook-session/analysis/student/:studentId/history` — snapshots de análise
- **Ainda não existe na API (pendência para a API-01):**
  - histórico de relatórios/PDF gerados
- **AC:**
  - AC-REL-03-01 lista os relatórios por paciente, com reabrir e reenviar. `CT`

### 4.12 Recursos, conta, equipe, ajuda e notificações

#### REC-01 — Tela Recursos

- **Classe:** B
- **US:** US2-15
- **Figma:** `MoreScreen` ("Recursos" com eyebrow "Tudo em um só lugar"), `.profile-banner`,
  `featureGroups` (3 grupos e 7 itens) com `.feature-list` / `.feature-row`
- **Dep.:** NAV-01, DS-05
- **Arquivos:** `app/(tabs)/resources.tsx`, `src/features/resources/**`.
- **AC:**
  - AC-REC-01-01 os 7 itens navegam para `plans`, `evolution` (prontuário), `assessments`,
    `activities`, `reports`, `team` e `help`. `CT`
  - AC-REC-01-02 o banner leva ao perfil. `CT`

#### REC-02 — Perfil e conta

- **Classe:** B
- **US:** US2-15
- **Figma:** `.profile-banner` (nome e "Psicopedagoga · Administradora"); tela sem desenho
  (G-18).
- **Dep.:** REC-01, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `GET /educator/me`
  - `PUT /educator/update-educator` — `newName`, `newContact`
  - `PUT /educator/update-profile-picture` — `photo`
  - `POST /educator/update-password`
- **Ainda não existe na API (pendência para a API-01):**
  - papel/profissão ("Psicopedagoga · Administradora")
- **AC:**
  - AC-REC-02-01 editar nome, papel e foto persiste. `CT`
  - AC-REC-02-02 "Sair" limpa a sessão e o cache (G-04). `CT`

#### EQP-01 — Equipe e convites

- **Classe:** B
- **US:** US2-12
- **Figma:** `TeamScreen`
  - "Equipe e convites" com eyebrow "Gestão da clínica";
  - `.invite-card` "Convide um profissional" com "Compartilhar link de convite";
  - "Profissionais ativos" com contagem;
  - `.team-list` (avatar, nome, papel e `badge` "Ativo").
- **Dep.:** REC-01, API-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - `POST /student/assign-educator` — só transfere um paciente para outro educador
- **Ainda não existe na API (pendência para a API-01):**
  - equipe/clínica, lista de profissionais e papéis
  - link de convite
- **Arquivos:** `app/team.tsx`, `src/features/team/**`.
- **AC:**
  - AC-EQP-01-01 o link do convite vem da API e é compartilhado pelo `Share`. `CT`
  - AC-EQP-01-02 a lista e os papéis são reais. `CT`

#### EQP-02 — Permissões por papel

- **Classe:** A/B
- **US:** US2-12
- **Dep.:** EQP-01
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - papéis e permissões
- **AC:**
  - AC-EQP-02-01 o papel "Profissional" não vê o convite nem a gestão. `CT`
  - AC-EQP-02-02 a regra fica num único `usePermissions`. `UT`

#### AJD-01 — Central de ajuda

- **Classe:** B
- **US:** US2-13
- **Figma:** `TeamScreen` (`onboarding`)
  - "Central de ajuda" com eyebrow "Aprenda no seu ritmo";
  - `.video-feature` "COMECE POR AQUI · 4 MIN", "Conheça o Labirinto do Saber";
  - "Tutoriais essenciais" (`.tutorial-list`: 4 itens numerados com duração).
- **Dep.:** REC-01, API-01, G-37
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - tutoriais e vídeos
- **Arquivos:** `app/help.tsx`, `src/features/help/**`.
- **AC:**
  - AC-AJD-01-01 a lista de tutoriais é real. `CT`
  - AC-AJD-01-02 o vídeo toca em tela cheia (`expo-video`). `MAN`

#### NOT-01 — Notificações

- **Classe:** B
- **US:** US2-14
- **Figma:** `IconButton` `bell` "Notificações" no `AppHeader`; a lista não tem desenho (G-18).
- **Dep.:** NAV-02, API-01, G-36
- **Endpoints existentes** ([contrato atual](../PROJECT.md#parte-ii--referência-global-da-api)):
  - nenhum
- **Ainda não existe na API (pendência para a API-01):**
  - notificações do app e contador de não lidas (o `notify` é job interno)
  - registro de token de push
- **Arquivos:** `app/notifications.tsx`, `src/features/notifications/**`.
- **AC:**
  - AC-NOT-01-01 o sino mostra o contador de não lidas. `CT`
  - AC-NOT-01-02 tocar numa notificação marca como lida e navega ao destino. `CT`
  - AC-NOT-01-03 há push nativo só se G-36 aprovar. `MAN`

### 4.13 Qualidade e homologação

#### QA-01 — Plano de testes da Entrega 2

- **Classe:** B
- **Dep.:** N2 a N5
- **Escopo:** roteiro no formato do [plano da Entrega 1](../entrega-1/PLANO-TESTES.md), com um
  caso por AC `MAN` e um por fluxo entre módulos.
- **AC:**
  - AC-QA-01-01 todos os P1 passam no Android. `MAN`

#### QA-02 — E2E Maestro

- **Classe:** B
- **Dep.:** QA-01
- **Escopo:** fluxos em `.maestro/`:
  1. login → Início → iniciar sessão → salvar evolução;
  2. novo paciente → gerar PDI → salvar;
  3. aplicar escala → concluir;
  4. gerar relatório → compartilhar;
  5. novo atendimento.
- **AC:**
  - AC-QA-02-01 os 5 fluxos passam no AVD Android. `E2E`

#### QA-03 — Acessibilidade

- **Classe:** B
- **Dep.:** N2 a N5
- **Escopo:** TalkBack e VoiceOver, fonte grande, contraste e alvos de 44.
- **AC:**
  - AC-QA-03-01 o checklist das 15 telas fica sem bloqueio. `MAN`

#### QA-04 — Homologação em aparelhos

- **Classe:** B
- **Dep.:** QA-01 a QA-03
- **Escopo:** Android físico e iOS via EAS (pendências T-108) com o backend de homologação.
- **AC:**
  - AC-QA-04-01 a matriz tela × plataforma × aparelho fica registrada. `MAN`

## 5. Grafo de dependências (resumo)

```
API-01 ─┬─ API-02
        └─ (dados de todas as telas)
DS-01 → DS-02 → DS-03 → DS-05 → DS-06
DS-01 → DS-04
DS-03 → NAV-01, NAV-02 → NAV-03 (G-33)
NAV-01/02 → HOME-01, AGE-01, PAC-01, REC-01, PLN-01, AVA-01, ATV-01, REL-01, NOT-01
AGE-01 → AGE-02, AGE-03, AGE-04 (← EVO-01)
PAC-01 → PAC-02, PAC-03 → PAC-04 (← PLN-01), PAC-05 (← AVA-01), PAC-06, PAC-07
EVO-01 → EVO-02, EVO-03 (← ATV-03, G-35)
PLN-01 → PLN-02 → PLN-03 → PLN-04 → PLN-05 (← HOME-01)
AVA-01 → AVA-02 → AVA-03 → AVA-04, AVA-05
ATV-01 → ATV-02 → ATV-03 → ATV-04; ATV-02 → ATV-05 (G-34)
REL-01 → REL-02 (G-34) → REL-03
REC-01 → REC-02, EQP-01 → EQP-02, AJD-01 (G-37)
N2–N5 → QA-01 → QA-02; QA-03 → QA-04
```

## 6. Histórico

- 2026-10-03: criação pelo orquestrador a partir do Figma Make e do Roadmap da Entrega 2.
- 2026-10-03: marco V1 (§4.0), com EXPO-01, ATV-06/07/08, CNT-01, SES-01 a 04, REL-04/05/06, INT-01 e QA-05; G-38 a G-41.
- 2026-10-03: endpoints do contrato atual e pendências de API em cada ficha; §2.3 Cobertura da API.
