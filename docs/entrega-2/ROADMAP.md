# Entrega 2 — Roadmap do novo design (Figma Make)

> Tarefas refinadas: [BACKLOG da Entrega 2](BACKLOG.md). Plano para implementar **todo** o novo design do Labirinto do Saber, partindo do app da
> Entrega 1. Fonte do design: Figma Make
> [`L7sCNfMhrzOzhtlNpS3cHr`](https://www.figma.com/make/L7sCNfMhrzOzhtlNpS3cHr/Receive-.fig-files),
> lido em 2026-10-03: `src/App.tsx` (14 telas) e `src/index.css` (design system).
> Premissa do usuário: **o backend já existe** para tudo o que o design mostra. O roadmap
> anterior está em [Entrega 1 — Roadmap](../entrega-1/ROADMAP.md).

## 1. O que muda em relação à Entrega 1

| Tema                | Entrega 1 (hoje na `main`)                      | Novo design                                                                                                                                                                        |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Público e linguagem | Educadora, alunos                               | Profissional (psicopedagoga), **pacientes**, responsável                                                                                                                           |
| Abas                | Tela Inicial, Atividades, Alunos, Relatórios    | **Início, Agenda, Pacientes, Recursos**                                                                                                                                            |
| Cabeçalho           | Menu + título + avatar                          | Subtítulo pequeno ("eyebrow") + título grande + **sino de notificações**; telas internas com botão voltar redondo                                                                  |
| Visual              | Verde-água #72DED4, cards com borda lateral     | Novo sistema: teal `#168D84`, tinta `#173331`, pêssego, lavanda e amarelo, raios 10/16/24, sombras suaves, Nunito 400–800, ícones de traço                                         |
| Sessão              | Escolher aluno → conteúdo → player (incompleto) | Atendimento da agenda → **Evolução da sessão** (critérios do PE, registro, sugestão da IA, prontuário)                                                                             |
| Conteúdo            | Cadernos, grupos e atividades (CRUD)            | **Banco de atividades** (interativas e imprimíveis) + atividade jogável ("Forme a palavra")                                                                                        |
| Novos módulos       | —                                               | **Planos com IA (PDI/PE)**, **Avaliações e escalas**, **Relatórios em PDF**, **Equipe e convites**, **Central de ajuda**, **mensagens automáticas por WhatsApp**, **notificações** |
| Dados               | Mocks (G-29)                                    | **Backend real** (premissa); mocks ficam só nos testes                                                                                                                             |

O que se aproveita da Entrega 1:

- toda a infraestrutura: Expo, TypeScript strict, `apiClient`, sessão segura, MMKV, TanStack Query, guarda de sessão, CI e testes;
- o Login, que só é reestilizado;
- dados e mutações de agenda (T-901);
- listagem e cadastro de alunos, como base dos pacientes;
- a camada de mocks, que continua servindo aos testes.

As telas de Entrega 1 que o novo design não mostra ficam **fora** até decisão (ver §6):

- caderno e grupo;
- tela 04/05 de sessão;
- player antigo.

## 2. Mapa de telas do Figma

| #   | Tela do Figma                                                      | Rota proposta                                                         | Módulo |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------- | ------ |
| 1   | `HomeScreen` — Início                                              | `app/(tabs)/index.tsx`                                                | HOME   |
| 2   | `AgendaScreen` — Agenda                                            | `app/(tabs)/agenda.tsx`                                               | AGE    |
| 3   | `SimpleFormScreen` (atendimento) — Novo atendimento                | `app/agenda/new.tsx`                                                  | AGE    |
| 4   | `PatientsScreen` — Pacientes                                       | `app/(tabs)/patients.tsx`                                             | PAC    |
| 5   | `SimpleFormScreen` (paciente) — Novo paciente                      | `app/patients/new.tsx`                                                | PAC    |
| 6   | `PatientDetail` — ficha com abas Visão geral / Planos / Avaliações | `app/patients/[id].tsx`                                               | PAC    |
| 7   | `MoreScreen` — Recursos                                            | `app/(tabs)/resources.tsx`                                            | REC    |
| 8   | `PlansScreen` (hub) — Planos com IA                                | `app/plans/index.tsx`                                                 | PLN    |
| 9   | `PlansScreen` (generate) — Novo planejamento                       | `app/plans/new.tsx`                                                   | PLN    |
| 10  | `AssessmentsScreen` (hub e aplicação) — Avaliações                 | `app/assessments/index.tsx`, `app/assessments/apply/[templateId].tsx` | AVA    |
| 11  | `ActivitiesScreen` (banco e jogo) — Atividades                     | `app/activities/index.tsx`, `app/activities/[id].tsx`                 | ATV    |
| 12  | `ReportsScreen` — Relatórios                                       | `app/reports/index.tsx`                                               | REL    |
| 13  | `EvolutionScreen` — Evolução da sessão                             | `app/sessions/[appointmentId]/evolution.tsx`                          | EVO    |
| 14  | `TeamScreen` — Equipe e convites                                   | `app/team.tsx`                                                        | EQP    |
| 15  | `TeamScreen` (onboarding) — Central de ajuda                       | `app/help.tsx`                                                        | AJD    |

Destinos que o design aciona mas não desenha, tratados nas tarefas indicadas:

| Destino                               | Tarefa |
| ------------------------------------- | ------ |
| Lista de notificações (sino)          | NOT-01 |
| Perfil (banner do Recursos)           | REC-02 |
| "Ver plano completo" (detalhe do PDI) | PLN-04 |
| Resultado de uma aplicação            | AVA-04 |
| "Ver todas" do banco de atividades    | ATV-02 |
| "Ver síntese" da anamnese             | PAC-06 |
| Contatar responsável                  | PAC-07 |

## 3. Premissas e contrato de API

- **O backend já implementa tudo** que as telas mostram: pacientes e responsáveis, dificuldades,
  agenda, mensagens WhatsApp, PDI e PE com IA, escalas, avaliações e insights, banco de
  atividades, evolução e prontuário, relatórios em PDF, equipe e convites, tutoriais e
  notificações.
- O contrato publicado em [PROJECT, Parte II](../PROJECT.md#parte-ii--referência-global-da-api)
  não cobre esses módulos. A tarefa **API-01** traz o contrato real (OpenAPI ou documentação do
  backend) para `PROJECT.md` e `src/api/types.ts` antes de qualquer tela que dependa dele.
  Nenhuma tarefa inventa endpoint ou campo. Se faltar algo, a tarefa para e registra a dúvida.
- Cada ficha do backlog lista os **endpoints existentes** que usa e o que **ainda não existe na
  API**. O resumo por domínio está em [BACKLOG §2.3](BACKLOG.md#23-cobertura-da-api). Planos
  (PDI/PE), escalas, equipe, tutoriais e notificações não têm nenhum endpoint documentado hoje.
- **Integração real** desde o início, com `EXPO_PUBLIC_USE_MOCKS=false` em homologação. Os mocks
  de cada módulo continuam existindo para testes e para desenvolvimento sem backend.
- Regras herdadas que continuam valendo:
  - fuso `America/Sao_Paulo` (G-13);
  - nenhum reenvio automático de mutação (G-08);
  - contraste acessível (G-17);
  - dados fictícios nos testes;
  - nenhum dado sensível de criança em log;
  - relatório exporta sínteses, não respostas brutas, como o próprio design pede.

## 4. Marcos

| Marco                        | Objetivo                                        | Tarefas                                                         | Saída verificável                                      |
| ---------------------------- | ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| N0 — Contrato e decisões     | Contrato real da API e decisões do §6           | API-01, API-02, decisões G-32 a G-37                            | Tipos e endpoints no repositório; decisões em GATES    |
| N1 — Design system e casca   | Novo visual e nova navegação                    | DS-01 a DS-06, NAV-01 a NAV-03                                  | 4 abas, cabeçalho novo e componentes no emulador       |
| N2 — Núcleo do atendimento   | Início, Agenda e Pacientes                      | HOME-01, AGE-01 a AGE-04, PAC-01 a PAC-07                       | Fluxo agenda → ficha → atendimento com backend real    |
| N3 — Sessão e planejamento   | Evolução e planos com IA                        | EVO-01 a EVO-03, PLN-01 a PLN-05                                | Atendimento registrado; PDI gerado, editado e salvo    |
| N4 — Avaliação e conteúdo    | Escalas e banco de atividades                   | AVA-01 a AVA-05, ATV-01 a ATV-05                                | Escala aplicada com escore; atividade jogada até o fim |
| N5 — Documentos e conta      | Relatórios, equipe, ajuda, notificações, perfil | REL-01 a REL-03, EQP-01, EQP-02, AJD-01, NOT-01, REC-01, REC-02 | PDF gerado e compartilhado; convite enviado            |
| N6 — Qualidade e homologação | Acessibilidade, E2E e aparelhos                 | QA-01 a QA-04                                                   | Plano de testes da Entrega 2 verde em Android e iOS    |

N2, N3, N4 e N5 podem andar em paralelo depois de N1, com arquivos disjuntos.

## 5. Tarefas

As tarefas estão **refinadas no [BACKLOG da Entrega 2](BACKLOG.md)**. Cada ficha traz:

- a história (US);
- o componente e as classes do Figma Make;
- os recursos de API;
- as dependências e os gates;
- os arquivos exclusivos;
- os critérios de aceite numerados com o tipo de verificação.

As histórias US2-01 a US2-15 estão no [BACKLOG §3](BACKLOG.md#3-histórias).

| Tarefa                                                                   | Título                                        | US     | Figma (Make)                                                                            | Marco | Onda | Dependências                  |
| ------------------------------------------------------------------------ | --------------------------------------------- | ------ | --------------------------------------------------------------------------------------- | ----- | ---- | ----------------------------- |
| [API-01](BACKLOG.md#api-01--contrato-real-da-api)                        | Contrato real da API                          | todas  | —                                                                                       | N0    | 1    | —                             |
| [API-02](BACKLOG.md#api-02--mocks-por-domínio)                           | Mocks por domínio                             | todas  | —                                                                                       | N0    | 2    | API-01                        |
| [DS-01](BACKLOG.md#ds-01--tokens-do-novo-tema)                           | Tokens do novo tema                           | —      | `:root` do `index.css`                                                                  | N1    | 1    | —                             |
| [DS-02](BACKLOG.md#ds-02--ícones)                                        | Ícones                                        | —      | `Icon`, `iconPaths`                                                                     | N1    | 2    | DS-01, G-32                   |
| [DS-03](BACKLOG.md#ds-03--botões-e-controles)                            | Botões e controles                            | —      | `Button`, `IconButton`, `.switch`, `.check-list`, `.segmented`, `.filter-chip`, `.tabs` | N1    | 2    | DS-01, DS-02                  |
| [DS-04](BACKLOG.md#ds-04--campos-e-formulários)                          | Campos e formulários                          | —      | `.field`, `.field-grid`, `.search-field`                                                | N1    | 2    | DS-01, DS-02                  |
| [DS-05](BACKLOG.md#ds-05--cards-e-blocos)                                | Cards e blocos                                | —      | `Avatar`, `InfoCard`, `SectionTitle`, `.badge`, `.toast`, `.ai-*`, `.timeline-item`     | N1    | 2    | DS-01 a DS-03                 |
| [DS-06](BACKLOG.md#ds-06--migração-visual-das-telas-mantidas)            | Migração visual das telas mantidas            | —      | —                                                                                       | N1    | 3    | DS-01 a DS-05                 |
| [NAV-01](BACKLOG.md#nav-01--abas-início-agenda-pacientes-e-recursos)     | Abas Início, Agenda, Pacientes e Recursos     | US2-15 | `navigation`, `.bottom-nav`                                                             | N1    | 3    | DS-03, G-31                   |
| [NAV-02](BACKLOG.md#nav-02--cabeçalho-novo)                              | Cabeçalho novo                                | US2-15 | `AppHeader`, `.eyebrow`, `.back-button`                                                 | N1    | 3    | DS-03                         |
| [NAV-03](BACKLOG.md#nav-03--limpeza-da-entrega-1)                        | Limpeza da Entrega 1                          | —      | —                                                                                       | N1    | 4    | G-33, NAV-01                  |
| [HOME-01](BACKLOG.md#home-01--tela-início)                               | Tela Início                                   | US2-01 | `HomeScreen`                                                                            | N2    | 4    | NAV-01, NAV-02, DS-05, API-01 |
| [AGE-01](BACKLOG.md#age-01--tela-agenda)                                 | Tela Agenda                                   | US2-02 | `AgendaScreen`                                                                          | N2    | 4    | NAV-01, DS-05, API-01         |
| [AGE-02](BACKLOG.md#age-02--mensagens-automáticas-whatsapp)              | Mensagens automáticas (WhatsApp)              | US2-03 | `.setting-card`, `.switch`, `.toast`                                                    | N2    | 5    | AGE-01                        |
| [AGE-03](BACKLOG.md#age-03--novo-editar-remarcar-e-cancelar-atendimento) | Novo, editar, remarcar e cancelar atendimento | US2-02 | `SimpleFormScreen` (atendimento)                                                        | N2    | 5    | AGE-01, DS-04, PAC-01         |
| [AGE-04](BACKLOG.md#age-04--iniciar-sessão-a-partir-do-atendimento)      | Iniciar sessão a partir do atendimento        | US2-06 | `.hero-card`, `.appointment--current`                                                   | N2    | 7    | AGE-01, EVO-01                |
| [PAC-01](BACKLOG.md#pac-01--lista-de-pacientes)                          | Lista de pacientes                            | US2-04 | `PatientsScreen`                                                                        | N2    | 4    | NAV-01, DS-05, API-01         |
| [PAC-02](BACKLOG.md#pac-02--novo-paciente)                               | Novo paciente                                 | US2-04 | `SimpleFormScreen` (paciente)                                                           | N2    | 5    | DS-04, API-01                 |
| [PAC-03](BACKLOG.md#pac-03--ficha-visão-geral)                           | Ficha: Visão geral                            | US2-05 | `PatientDetail` aba `visao`                                                             | N2    | 5    | PAC-01                        |
| [PAC-04](BACKLOG.md#pac-04--ficha-planos)                                | Ficha: Planos                                 | US2-05 | `PatientDetail` aba `planos`                                                            | N2    | 6    | PAC-03, PLN-01                |
| [PAC-05](BACKLOG.md#pac-05--ficha-avaliações)                            | Ficha: Avaliações                             | US2-05 | `PatientDetail` aba `avaliacoes`                                                        | N2    | 6    | PAC-03, AVA-01                |
| [PAC-06](BACKLOG.md#pac-06--anamnese)                                    | Anamnese                                      | US2-05 | destino "Ver síntese"                                                                   | N2    | 6    | PAC-03                        |
| [PAC-07](BACKLOG.md#pac-07--editar-paciente-e-contatar-responsável)      | Editar paciente e contatar responsável        | US2-04 | `.patient-summary` (`message`)                                                          | N2    | 6    | PAC-02, PAC-03, G-36          |
| [EVO-01](BACKLOG.md#evo-01--evolução-da-sessão)                          | Evolução da sessão                            | US2-06 | `EvolutionScreen`                                                                       | N3    | 6    | DS-03 a DS-05, API-01         |
| [EVO-02](BACKLOG.md#evo-02--prontuário)                                  | Prontuário                                    | US2-06 | —                                                                                       | N3    | 7    | EVO-01, PAC-03                |
| [EVO-03](BACKLOG.md#evo-03--atividade-durante-a-sessão)                  | Atividade durante a sessão                    | US2-06 | —                                                                                       | N3    | 8    | EVO-01, ATV-03, G-35          |
| [PLN-01](BACKLOG.md#pln-01--hub-de-planos)                               | Hub de planos                                 | US2-07 | `PlansScreen` (hub)                                                                     | N3    | 5    | NAV-02, DS-05                 |
| [PLN-02](BACKLOG.md#pln-02--gerar-planejamento-com-ia)                   | Gerar planejamento com IA                     | US2-07 | `PlansScreen` (generate)                                                                | N3    | 6    | PLN-01, PAC-03                |
| [PLN-03](BACKLOG.md#pln-03--rascunho-editável)                           | Rascunho editável                             | US2-07 | `.generated-sheet`                                                                      | N3    | 7    | PLN-02                        |
| [PLN-04](BACKLOG.md#pln-04--detalhe-do-plano)                            | Detalhe do plano                              | US2-08 | destino "Ver plano completo"                                                            | N3    | 8    | PLN-03                        |
| [PLN-05](BACKLOG.md#pln-05--sugestões-da-ia)                             | Sugestões da IA                               | US2-08 | `.insight-card`                                                                         | N3    | 9    | PLN-04, HOME-01               |
| [AVA-01](BACKLOG.md#ava-01--hub-de-avaliações)                           | Hub de avaliações                             | US2-09 | `AssessmentsScreen`                                                                     | N4    | 5    | NAV-02, DS-05                 |
| [AVA-02](BACKLOG.md#ava-02--aplicar-escala)                              | Aplicar escala                                | US2-09 | `.question-card`, `.scale-option`                                                       | N4    | 6    | AVA-01                        |
| [AVA-03](BACKLOG.md#ava-03--escore-e-insight)                            | Escore e insight                              | US2-09 | `.score-preview`, `.ai-insight`                                                         | N4    | 7    | AVA-02                        |
| [AVA-04](BACKLOG.md#ava-04--resultado-da-aplicação)                      | Resultado da aplicação                        | US2-09 | destino "Ver resultado"                                                                 | N4    | 8    | AVA-03                        |
| [AVA-05](BACKLOG.md#ava-05--rascunhos)                                   | Rascunhos                                     | US2-09 | "Salvar rascunho"                                                                       | N4    | 8    | AVA-03                        |
| [ATV-01](BACKLOG.md#atv-01--banco-de-atividades)                         | Banco de atividades                           | US2-10 | `ActivitiesScreen`                                                                      | N4    | 5    | NAV-02, DS-05                 |
| [ATV-02](BACKLOG.md#atv-02--ver-todas-e-detalhe)                         | Ver todas e detalhe                           | US2-10 | "Ver todas"                                                                             | N4    | 6    | ATV-01                        |
| [ATV-03](BACKLOG.md#atv-03--motor-de-atividades-interativas)             | Motor de atividades interativas               | US2-10 | `.game-shell`                                                                           | N4    | 7    | ATV-02, G-35                  |
| [ATV-04](BACKLOG.md#atv-04--tipos-de-atividade)                          | Tipos de atividade                            | US2-10 | `.word-slots`, `.letter-pool`, `.activity-grid`                                         | N4    | 8    | ATV-03                        |
| [ATV-05](BACKLOG.md#atv-05--imprimíveis)                                 | Imprimíveis                                   | US2-10 | miniatura "Imprimível"                                                                  | N4    | 8    | ATV-02, G-34                  |
| [REL-01](BACKLOG.md#rel-01--configurar-relatório)                        | Configurar relatório                          | US2-11 | `ReportsScreen`                                                                         | N5    | 5    | NAV-02, DS-04                 |
| [REL-02](BACKLOG.md#rel-02--prévia-e-exportação)                         | Prévia e exportação                           | US2-11 | `.report-preview`, `.paper-preview`                                                     | N5    | 6    | REL-01, G-34                  |
| [REL-03](BACKLOG.md#rel-03--histórico-de-relatórios)                     | Histórico de relatórios                       | US2-11 | —                                                                                       | N5    | 7    | REL-02                        |
| [REC-01](BACKLOG.md#rec-01--tela-recursos)                               | Tela Recursos                                 | US2-15 | `MoreScreen`                                                                            | N5    | 4    | NAV-01, DS-05                 |
| [REC-02](BACKLOG.md#rec-02--perfil-e-conta)                              | Perfil e conta                                | US2-15 | `.profile-banner`                                                                       | N5    | 5    | REC-01                        |
| [EQP-01](BACKLOG.md#eqp-01--equipe-e-convites)                           | Equipe e convites                             | US2-12 | `TeamScreen`                                                                            | N5    | 5    | REC-01                        |
| [EQP-02](BACKLOG.md#eqp-02--permissões-por-papel)                        | Permissões por papel                          | US2-12 | —                                                                                       | N5    | 6    | EQP-01                        |
| [AJD-01](BACKLOG.md#ajd-01--central-de-ajuda)                            | Central de ajuda                              | US2-13 | `TeamScreen` (onboarding)                                                               | N5    | 5    | REC-01, G-37                  |
| [NOT-01](BACKLOG.md#not-01--notificações)                                | Notificações                                  | US2-14 | sino do `AppHeader`                                                                     | N5    | 5    | NAV-02, G-36                  |
| [QA-01](BACKLOG.md#qa-01--plano-de-testes-da-entrega-2)                  | Plano de testes da Entrega 2                  | —      | —                                                                                       | N6    | 9    | N2 a N5                       |
| [QA-02](BACKLOG.md#qa-02--e2e-maestro)                                   | E2E Maestro                                   | —      | —                                                                                       | N6    | 10   | QA-01                         |
| [QA-03](BACKLOG.md#qa-03--acessibilidade)                                | Acessibilidade                                | —      | —                                                                                       | N6    | 9    | N2 a N5                       |
| [QA-04](BACKLOG.md#qa-04--homologação-em-aparelhos)                      | Homologação em aparelhos                      | —      | —                                                                                       | N6    | 10   | QA-01 a QA-03                 |

**54 tarefas.** A ATV-04 conta como uma, com quatro subtarefas (a–d).

## 6. Decisões necessárias (propostas para GATES)

| Gate           | Decisão                                                         | Recomendação                                                                                                                                                              | Bloqueia                |
| -------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| G-32           | Ícones do Figma                                                 | Adicionar `react-native-svg` (exige rebuild nativo, já viável desde a T-108) e usar os paths do Figma                                                                     | DS-02                   |
| G-33           | Destino do fluxo antigo (cadernos, grupos, telas 04/05, player) | Substituir: o atendimento vira Agenda → Evolução e o conteúdo vira Banco de atividades; o modelo de tarefa de múltipla escolha vive como tipo "Leia e responda" (ATV-04c) | NAV-03, EVO-03, ATV-04c |
| G-34           | PDF, impressão e compartilhamento                               | `expo-print` + `expo-sharing` + `expo-file-system` (rebuild nativo)                                                                                                       | ATV-05, REL-02          |
| G-35           | Atividade jogada durante a sessão registra resultado?           | Sim, se a API tiver o endpoint; senão, a atividade roda sem registro                                                                                                      | ATV-03, EVO-03          |
| G-36           | Contato e notificações                                          | Contato pelo app do WhatsApp via `Linking`; push com `expo-notifications` só se o backend enviar push. Sem push, só a lista do sino                                       | PAC-07, NOT-01          |
| G-37           | Vídeos da Central de ajuda                                      | `expo-video` com URL da API (rebuild nativo)                                                                                                                              | AJD-01                  |
| G-31 (revisão) | Agenda nas abas                                                 | Revogar: o novo design traz Agenda como aba                                                                                                                               | NAV-01                  |

## 7. Ondas sugeridas

| Onda | Tarefas                                                                                        | Observação                                                |
| ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1    | API-01, DS-01, decisões do §6                                                                  | Contrato e tokens destravam o resto                       |
| 2    | API-02, DS-02, DS-03, DS-04, DS-05                                                             | Componentes em paralelo (arquivos disjuntos)              |
| 3    | NAV-01, NAV-02, DS-06                                                                          | Casca nova                                                |
| 4    | HOME-01, AGE-01, PAC-01, REC-01, NAV-03                                                        | Telas raiz das abas                                       |
| 5    | AGE-02, AGE-03, PAC-02, PAC-03, PLN-01, AVA-01, ATV-01, REL-01, EQP-01, AJD-01, NOT-01, REC-02 | Maior paralelismo; limitar pelo uso de memória da máquina |
| 6    | EVO-01, PAC-04, PAC-05, PAC-06, PAC-07, PLN-02, AVA-02, ATV-02, REL-02, EQP-02                 |                                                           |
| 7    | AGE-04, EVO-02, PLN-03, AVA-03, ATV-03, REL-03                                                 |                                                           |
| 8    | PLN-04, AVA-04, AVA-05, ATV-04, ATV-05, EVO-03                                                 |                                                           |
| 9    | PLN-05, QA-01, QA-03                                                                           |                                                           |
| 10   | QA-02, QA-04                                                                                   | Homologação                                               |

Caminho crítico:

```
API-01 → DS-01 → DS-03 → NAV-01 → PAC-01 → PAC-03 → PLN-01 → PLN-02 → PLN-03
       → PLN-04 → PLN-05 → QA-01 → QA-02 → QA-04
```

Planos com IA é o ramo mais longo, porque depende de pacientes, da geração e do
acompanhamento.

## 8. Riscos

| Risco                                                       | Efeito                               | Mitigação                                                                        |
| ----------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Contrato real difere do que o design mostra                 | Telas com campos sem dados           | API-01 primeiro; desvio registrado por tarefa, sem inventar campo                |
| Dependências nativas novas (SVG, print, vídeo, push)        | Rebuild e falhas de build no Windows | Agrupar as instalações num único rebuild (onda 1–2); receita A-21 já documentada |
| Geração por IA lenta ou falhando                            | UX travada                           | Estados de carregando e erro, timeout, sem reenvio automático, rascunho editável |
| Dados sensíveis de crianças (anamnese, escalas, relatórios) | Exposição indevida                   | Sínteses por padrão, nada em log, MMKV criptografado, logout limpa tudo          |
| Volume de trabalho (cerca de 60 tarefas)                    | Prazo                                | Ondas com paralelismo real e um dono de integração por módulo                    |
| Retrabalho das telas da Entrega 1                           | Esforço duplicado                    | G-33 decide cedo o que sai; o reaproveitamento está no §1                        |

## 9. Manutenção

O orquestrador atualiza este roadmap quando uma decisão do §6 for tomada ou quando o contrato
real (API-01) mudar escopo. Tarefas viram fichas no BACKLOG da Entrega 2, e o progresso vai
para o TRACKING. Este documento não marca nenhuma implementação como pronta.
