# Entrega 2 — Roadmap do novo design (Figma Make)

> Plano para implementar **todo** o novo design do Labirinto do Saber, partindo do app da
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

Formato: **ID — título**. Cada tarefa traz o escopo (o que entra e o que fica fora), as
dependências (Dep.) e os critérios de aceite (AC). As classes seguem o AGENTS §3:

| Classe | Modelo | Uso                    |
| ------ | ------ | ---------------------- |
| A      | Opus   | Arquitetura e contrato |
| B      | Sonnet | Tela ou módulo         |
| C      | Haiku  | Trabalho mecânico      |

Cada tarefa ganha um contrato em `docs/contracts/` antes de começar.

### 5.1 Contrato e base (N0)

**API-01 — Contrato real da API (classe A)**

- Escopo: obter a documentação ou OpenAPI do backend e atualizar `PROJECT.md` Parte II com
  todos os módulos do §3.
  - Tipos em `src/api/types.ts` e um módulo por domínio em `src/api/endpoints/`.
  - Registrar diferenças com o design, como campos que a tela mostra e a API não tem.
- Fora: telas.
- Dep.: nenhuma.
- AC: cada tela do §2 tem endpoint(s) identificado(s) na matriz `API-TELAS` da Entrega 2;
  typecheck verde.

**API-02 — Mocks por domínio para testes (classe C)**

- Escopo: handlers mockados tipados para cada endpoint do API-01, com cenários de sucesso, vazio
  e erro, seguindo o padrão de `src/mocks/`.
- Dep.: API-01.
- AC: teste de integração via `apiClient` para cada handler.

### 5.2 Design system (N1)

**DS-01 — Tokens do novo tema (classe B)**

- Escopo: substituir a paleta de `src/theme/` pelos tokens do `index.css` do Figma.
  - Grupos de tokens: `brand-50…700`, `ink-300…950`, `surface`, `surface-soft`, `border`,
    `peach`, `lavender`, `yellow`, `warning`, `success` e `danger`.
  - Raios 10/16/24, sombras `sm`/`md`, espaçamento de conteúdo 20 (15 em telas ≤ 370 dp), Nunito
    400–800.
  - Validar o contraste (G-17) e registrar ajustes.
- Dep.: nenhuma.
- AC: testes de contraste dos pares texto/fundo usados; Tailwind e tokens TS com os mesmos
  valores.

**DS-02 — Ícones (classe B)**

- Escopo: os 22 ícones de traço do design (home, calendar, users, grid, bell, search, chevron,
  clock, message, sparkles, clipboard, chart, book, file, play, plus, check, arrow, brain, print,
  share, close), via `react-native-svg` (G-32) com os paths do Figma.
- Dep.: DS-01, G-32.
- AC: componente `Icon` com `name`/`size`/cor; teste de snapshot por ícone.

**DS-03 — Botões e controles (classe B)**

- Escopo:
  - `Button` com as variantes `primary`, `secondary`, `ghost` e `soft`, ícone e largura cheia;
  - `IconButton` circular de 42;
  - `BackButton`;
  - `Switch`;
  - `Checkbox`, com a lista marcável `check-list`;
  - `SegmentedControl`;
  - `FilterChip` com rolagem horizontal;
  - `Tabs` com sublinhado.
  - Altura mínima de toque 44.
- Dep.: DS-01, DS-02.
- AC: testes de componente com acessibilidade (role, estado `checked`/`selected`).

**DS-04 — Campos e formulários (classe B)**

- Escopo: `Field` (rótulo + input/textarea/select), `SearchField` com ícone, `FieldGrid` de 2
  colunas e seletores de data, hora e opção (select nativo ou sheet), com foco destacado.
- Dep.: DS-01.
- AC: integração com React Hook Form + Zod e erro acessível.

**DS-05 — Cards e blocos (classe B)**

- Escopo:
  - `Avatar` com iniciais e tons mint, peach e lavender (raio 15);
  - `Badge` normal e warning;
  - `InfoCard`;
  - `SectionTitle` com ação;
  - `FeatureRow`;
  - `ProgressBar`;
  - `MiniBars`;
  - `Toast`;
  - `SuccessPanel`;
  - `AIContext` / `AIInsight` (lavanda);
  - `PrivacyNote`;
  - `FloatingActionButton`.
- Dep.: DS-01, DS-02.
- AC: testes de componente; catálogo visual conferido no emulador.

**DS-06 — Migração visual das telas mantidas (classe B)**

- Escopo: reestilizar o Login, os estados de tela (carregando, vazio e erro) e o "Em breve" com o
  novo tema.
- Fora: telas que serão substituídas.
- Dep.: DS-01 a DS-05.
- AC: Login no novo visual sem regressão de testes.

### 5.3 Navegação e casca (N1)

**NAV-01 — Abas Início, Agenda, Pacientes e Recursos (classe B)**

- Escopo: nova tab bar (76 de altura, ativo com fundo `brand-50`) e rotas do §2.
- Atenção: revoga G-31 (Agenda volta às abas). As abas Atividades e Relatórios saem da barra e
  passam a ser acessadas pelo Recursos.
- Dep.: DS-03.
- AC: as 4 abas navegam; telas internas mantêm a aba-mãe ativa (como `rootScreen` do Figma).

**NAV-02 — Cabeçalho novo (classe B)**

- Escopo: `AppHeader` com eyebrow e título grande; sino nas telas de aba; botão voltar nas telas
  internas. Fundo translúcido fixo.
- Dep.: DS-03.
- AC: cabeçalho em todas as rotas; voltar respeita a pilha.

**NAV-03 — Limpeza de rotas da Entrega 1 (classe B)**

- Escopo: aplicar a decisão G-33 sobre o fluxo antigo de sessão e conteúdo.
  - Remover ou esconder as rotas e telas que saem, sem perder dados nem testes do que fica.
- Dep.: G-33, NAV-01.
- AC: nenhuma rota órfã; o CI continua verde.

### 5.4 Início (N2)

**HOME-01 — Nova tela Início (classe B)**

- Escopo:
  - Cabeçalho "Olá, {nome}" com a data por extenso.
  - **Próximo atendimento** (hero): avatar, horário e tipo, com os botões "Ver ficha" e "Iniciar
    sessão" (vai para EVO).
  - **Acesso rápido**: Novo paciente, Criar plano, Aplicar escala e Atividades.
  - **Agenda de hoje** em linha do tempo:
    - concluído, atual e próximo;
    - botão "Notificar responsável" no atual;
    - "Ver agenda".
  - **Cartão de sugestões da IA**: contagem e resumo, levando a Planos.
  - Estados vazio (sem atendimentos), carregando e erro.
- Dep.: NAV-01, NAV-02, DS-05, API-01 (agenda, pacientes, sugestões de IA).
- AC: dados reais; cada atalho leva à rota certa; contagem no fuso de SP.

### 5.5 Agenda (N2)

**AGE-01 — Tela Agenda (classe B)**

- Escopo:
  - Faixa de dias (seg–sex, com navegação de semana);
  - lista de atendimentos do dia com horário, duração, paciente, tipo e "Concluído";
  - destaque no atendimento atual;
  - título "N atendimentos";
  - botão "Novo atendimento".
- Reaproveita T-901 (dados e mutações) e T-902.
- Dep.: NAV-01, DS-05, API-01.
- AC: troca de dia atualiza a lista; tocar num atendimento abre detalhe/ações (AGE-03).

**AGE-02 — Mensagens automáticas por WhatsApp (classe B)**

- Escopo:
  - Cartão com interruptor "Mensagens automáticas" (confirmação, cancelamento e remarcação), que
    persiste a preferência no backend.
  - Botão "Notificar responsável" no atendimento, que dispara o envio pelo backend e mostra o toast
    "Mensagem preparada para o responsável".
- Dep.: AGE-01, API-01.
- AC: o estado do interruptor persiste; o envio não se repete sozinho (G-08).

**AGE-03 — Novo, editar, remarcar e cancelar atendimento (classe B)**

- Escopo:
  - Formulário: paciente (seletor), data, horário, tipo de atendimento (Terapia de aprendizagem,
    Avaliação…) e "Confirmar por WhatsApp".
  - Edição, remarcação e cancelamento a partir do item da agenda.
- Dep.: AGE-01, DS-04.
- AC: criar, editar e cancelar refletem na Agenda e no Início; validação de conflito conforme
  a API.

**AGE-04 — Atendimento atual → sessão (classe B)**

- Escopo: do atendimento atual (Agenda ou Início), "Iniciar sessão" abre a Evolução daquele
  atendimento (EVO-01) e marca o início conforme a API.
- Dep.: AGE-01, EVO-01.
- AC: o atendimento fica concluído depois de salvar a evolução.

### 5.6 Pacientes (N2)

**PAC-01 — Lista de pacientes (classe B)**

- Escopo:
  - Eyebrow "N pacientes ativos";
  - busca;
  - filtros Todos / Com sessão hoje / Pendências;
  - card com avatar de iniciais, idade, status (PDI ativo, Avaliação pendente, PE em revisão) e
    próximo atendimento;
  - botão flutuante "Cadastrar paciente".
- Substitui a lista de alunos (UX4-L).
- Dep.: NAV-01, DS-05, API-01.
- AC: filtros e busca funcionam com dados reais; status vindo da API.

**PAC-02 — Novo paciente (classe B)**

- Escopo:
  - Nome completo, data de nascimento, responsável, telefone do responsável;
  - dificuldades identificadas (Linguagem, Consciência fonológica, Leitura e escrita, Atenção,
    Comportamento adaptativo);
  - observações;
  - botão "Salvar e criar PDI", que leva a PLN-02 com o paciente.
- Substitui o cadastro de aluno (UX4-C).
- Dep.: DS-04, API-01.
- AC: validação conforme a API; o paciente aparece na lista e na Agenda.

**PAC-03 — Ficha do paciente: Visão geral (classe B)**

- Escopo:
  - Resumo (avatar, responsável, botão de contato);
  - abas Visão geral / Planos / Avaliações;
  - **PDI vigente**: título, vigência, % de progresso e "Ver plano completo";
  - **Próxima sessão**;
  - **Dificuldades mapeadas** (tags, com Editar);
  - **Evolução recente**: variação em % e mini gráfico de barras.
- Dep.: PAC-01, DS-05, API-01.
- AC: dados reais; estados vazios ("sem PDI", "sem sessões").

**PAC-04 — Ficha: aba Planos (classe B)**

- Escopo: lista de PDI e PE do paciente (InfoCards com status e ação) e "Criar novo plano".
- Dep.: PAC-03, PLN-01.
- AC: cada item abre o plano; criar já leva o paciente pré-selecionado.

**PAC-05 — Ficha: aba Avaliações (classe B)**

- Escopo: aplicações de escala e anamnese do paciente e "Nova avaliação".
- Dep.: PAC-03, AVA-01.
- AC: "Ver resultado" abre AVA-04; "Ver síntese" abre PAC-06.

**PAC-06 — Anamnese do paciente (classe B)**

- Escopo: visualizar a síntese da anamnese e preencher/atualizar o formulário de anamnese
  (modelo e respostas da API).
- Dep.: PAC-03, API-01.
- AC: síntese exibida; atualização salva com data.

**PAC-07 — Editar paciente e contatar responsável (classe B)**

- Escopo:
  - editar dados e dificuldades;
  - botão de contato (WhatsApp ou ligação via `Linking`, conforme G-36).
- Dep.: PAC-02, PAC-03.
- AC: a edição reflete na ficha e na lista.

### 5.7 Evolução da sessão (N3)

**EVO-01 — Tela Evolução da sessão (classe B)**

- Escopo:
  - Resumo do PE da sessão (tema, duração, nº de critérios);
  - **critérios mensuráveis**: lista marcável, com detalhe como "8 de 10 tentativas";
  - **registro descritivo**;
  - **sugestão da IA para a próxima sessão**;
  - "Salvar e atualizar prontuário" com o painel de sucesso.
- Dep.: DS-03, DS-04, DS-05, API-01.
- AC: salvar persiste critérios e registro; o atendimento fica concluído; não há reenvio
  automático.

**EVO-02 — Prontuário / histórico de evoluções (classe B)**

- Escopo: lista cronológica das evoluções do paciente, acessível pela ficha, com o detalhe de
  cada registro.
- Dep.: EVO-01, PAC-03.
- AC: a evolução salva aparece no histórico e alimenta a "Evolução recente" (PAC-03).

**EVO-03 — Atividades durante a sessão (classe B)**

- Escopo: a partir da Evolução, abrir uma atividade do banco recomendada para o paciente (ATV-03)
  e voltar com o resultado anexado, se a API registrar.
- Dep.: EVO-01, ATV-03, G-35.
- AC: o resultado da atividade aparece no registro da sessão quando a API suportar.

### 5.8 Planos com IA (N3)

**PLN-01 — Hub de planos (classe B)**

- Escopo:
  - destaque "Planejamento conectado à evolução real" com "Criar novo plano";
  - **Em andamento**: PDI e PE com % e prazo de revisão;
  - **Próximas sessões planejadas**.
- Dep.: NAV-02, DS-05, API-01.
- AC: dados reais; cada item abre o plano.

**PLN-02 — Gerar planejamento com IA (classe B)**

- Escopo:
  - seletor PDI / PE da sessão;
  - foco do planejamento (texto);
  - contexto conectado (aviso de que a IA usa dificuldades, anamnese, avaliações e evolução);
  - dificuldades consideradas (lista marcável, vindas do paciente);
  - duração de referência (3 ou 6 meses);
  - "Gerar planejamento com IA", com estado de carregando e erro.
- Dep.: PLN-01, PAC-03, API-01.
- AC: a geração chama o backend e mostra o rascunho; timeout e erro tratados sem reenvio
  automático.

**PLN-03 — Rascunho editável e salvar (classe B)**

- Escopo:
  - rascunho com objetivo geral, metas prioritárias e campo "Ajustes do profissional";
  - edição do conteúdo;
  - "Salvar PDI/PE" e "Compartilhar".
- Dep.: PLN-02, DS-04.
- AC: o plano salvo aparece no hub e na ficha; compartilhar usa o `Share` nativo com uma síntese.

**PLN-04 — Detalhe do plano e acompanhamento de objetivos (classe B)**

- Escopo: "Ver plano completo": objetivos e metas com progresso, vigência, revisão e edição.
- Dep.: PLN-03.
- AC: o % do plano bate com o da ficha; a revisão registra a data.

**PLN-05 — Sugestões da IA para revisar (classe B)**

- Escopo: lista das sugestões pendentes (cartão do Início), com aceitar/descartar cada uma e
  aplicação no plano.
- Dep.: PLN-04, HOME-01, API-01.
- AC: a contagem do Início diminui ao resolver uma sugestão.

### 5.9 Avaliações e escalas (N4)

**AVA-01 — Hub de avaliações (classe B)**

- Escopo:
  - "Nova aplicação" e "Escolher escala";
  - **modelos disponíveis** (nome, nº de itens, tempo);
  - **aplicações recentes** com badge de faixa (Moderado…).
- Dep.: NAV-02, DS-05, API-01.
- AC: modelos e aplicações vêm da API.

**AVA-02 — Aplicar escala (classe B)**

- Escopo:
  - seleção do paciente;
  - progresso "N de M";
  - instrução;
  - cards de pergunta com opções Nunca / Às vezes / Frequentemente / Muito (escala do modelo);
  - navegação entre itens.
- Dep.: AVA-01, DS-03, API-01.
- AC: todas as respostas são registradas; dá para sair e voltar ao rascunho.

**AVA-03 — Escore e insight (classe B)**

- Escopo:
  - pontuação parcial e total **calculada pelo backend**;
  - faixa interpretativa;
  - aviso "não substitui avaliação clínica";
  - insight preliminar da IA;
  - "Salvar rascunho" e "Concluir escala".
- Dep.: AVA-02.
- AC: o cliente não calcula escore por conta própria se a API devolver; concluir trava a
  edição.

**AVA-04 — Resultado de uma aplicação (classe B)**

- Escopo: tela de resultado: escore, faixa, insight, respostas (se a API permitir) e data.
- Dep.: AVA-03.
- AC: acessível pela ficha e pelo hub.

**AVA-05 — Rascunhos de avaliação (classe B)**

- Escopo: retomar uma aplicação salva como rascunho.
- Dep.: AVA-03.
- AC: o rascunho reabre na pergunta em que parou.

### 5.10 Banco de atividades (N4)

**ATV-01 — Banco de atividades (classe B)**

- Escopo:
  - busca por habilidade ou tema;
  - filtros Todas / Interativas / Imprimíveis;
  - **recomendada para o paciente** (destaque com "Iniciar atividade");
  - grade de **atividades prontas** (tipo e habilidade, miniatura colorida).
- Dep.: NAV-02, DS-05, API-01.
- AC: dados reais; filtros e busca funcionam.

**ATV-02 — Ver todas e detalhe da atividade (classe B)**

- Escopo: lista completa com paginação; detalhe com habilidade, tipo e paciente sugerido.
- Dep.: ATV-01.
- AC: navegação para jogar (ATV-03) ou imprimir (ATV-05).

**ATV-03 — Motor de atividades interativas (classe A/B)**

- Escopo: shell de jogo com progresso "Atividade N de M", ilustração, instrução e feedback de
  sucesso ou erro com "Tentar novamente".
- Dep.: ATV-02, G-35.
- AC: o tipo de atividade é extensível; o resultado é enviado à API quando houver paciente e
  sessão.

**ATV-04 — Tipos de atividade (classe B)** — uma subtarefa por tipo, conforme o catálogo da API:

| Subtarefa | Atividade           | Habilidade · formato                                     |
| --------- | ------------------- | -------------------------------------------------------- |
| ATV-04a   | **Forme a palavra** | Toque nas letras em ordem, com validação                 |
| ATV-04b   | Associe as cores    | Associação                                               |
| ATV-04c   | Leia e responda     | Quiz; reaproveita o modelo de tarefa de múltipla escolha |
| ATV-04d   | Memória visual      | Atenção                                                  |

- Dep.: ATV-03.
- AC: cada tipo jogável do início ao fim no emulador.

**ATV-05 — Atividades imprimíveis (classe B)**

- Escopo: abrir o PDF da atividade imprimível e imprimir/compartilhar (`expo-print` /
  `expo-sharing`, G-34).
- Dep.: ATV-02, G-34.
- AC: o PDF abre, imprime e compartilha no Android.

### 5.11 Relatórios (N5)

**REL-01 — Configurar relatório (classe B)**

- Escopo:
  - nota de privacidade ("Relatórios seguros por padrão");
  - paciente;
  - tipo (Síntese de acompanhamento, Anamnese e avaliações, Evolução do PDI);
  - **incluir no documento** (lista marcável);
  - período;
  - "Gerar síntese".
- Dep.: NAV-02, DS-04, API-01.
- AC: os parâmetros são enviados ao backend; carregando e erro tratados.

**REL-02 — Prévia e exportação (classe B)**

- Escopo: "Relatório pronto" (PDF, nº de páginas), prévia do documento, "Imprimir" e "Enviar"
  (compartilhar o PDF).
- Dep.: REL-01, G-34.
- AC: o PDF gerado pelo backend é baixado, visualizado, impresso e compartilhado.

**REL-03 — Histórico de relatórios (classe B)**

- Escopo: relatórios já gerados por paciente, para reabrir ou reenviar.
- Dep.: REL-02.
- AC: a lista vem da API.

### 5.12 Recursos, equipe, ajuda e notificações (N5)

**REC-01 — Tela Recursos (classe B)**

- Escopo: banner do perfil (nome e papel) e grupos de funcionalidades:
  - Planejamento personalizado;
  - Avaliação e conteúdo;
  - Conta e suporte.
  - Cada item leva à sua rota.
- Dep.: NAV-01, DS-05.
- AC: todas as entradas navegam; nenhum "Em breve" para módulos do roadmap.

**REC-02 — Perfil e conta (classe B)**

- Escopo: dados do profissional (nome, papel, foto), editar perfil e sair (logout já existe).
- Dep.: REC-01, API-01.
- AC: a edição persiste; o logout limpa os dados (G-04).

**EQP-01 — Equipe e convites (classe B)**

- Escopo: "Convide um profissional" (compartilhar o link seguro gerado pelo backend) e
  profissionais ativos com papel (Administradora/Profissional) e status.
- Dep.: REC-01, API-01.
- AC: o link vem da API e é compartilhado pelo `Share` nativo; a lista é real.

**EQP-02 — Permissões por papel (classe A/B)**

- Escopo: esconder ou bloquear ações de admin (convidar, gerenciar equipe) para quem não é
  administrador, conforme os papéis da API.
- Dep.: EQP-01.
- AC: um usuário "Profissional" não vê ações de admin; teste por papel.

**AJD-01 — Central de ajuda (classe B)**

- Escopo: vídeo de boas-vindas ("Conheça o Labirinto do Saber · 4 min") e tutoriais essenciais
  numerados com duração. Reprodução do vídeo conforme G-37.
- Dep.: REC-01, API-01.
- AC: os vídeos tocam; a lista vem da API.

**NOT-01 — Notificações (classe B)**

- Escopo:
  - tela aberta pelo sino;
  - lista de notificações (lembretes, confirmações, sugestões da IA) com lida/não lida;
  - contador no sino.
  - Push nativo (`expo-notifications`) conforme G-36.
- Dep.: NAV-02, API-01.
- AC: o sino mostra as não lidas; tocar numa notificação leva ao destino.

### 5.13 Qualidade e homologação (N6)

**QA-01 — Plano de testes da Entrega 2 (classe B)**

- Escopo: roteiro manual no formato do
  [plano da Entrega 1](../entrega-1/PLANO-TESTES.md), cobrindo as 15 telas, os fluxos entre
  módulos e os destinos do §2.
- Dep.: N2–N5.
- AC: todos os P1 passam no Android.

**QA-02 — E2E Maestro (classe B)**

- Escopo: fluxos críticos: login → Início → iniciar sessão → evolução; cadastrar paciente → criar
  PDI; aplicar escala; gerar relatório.
- Dep.: QA-01.
- AC: rodam no AVD Android no CI ou localmente com evidência.

**QA-03 — Acessibilidade (classe B)**

- Escopo: TalkBack/VoiceOver nas telas principais, fonte grande, contraste e alvos de 44.
- Dep.: N2–N5.
- AC: checklist sem bloqueios.

**QA-04 — Homologação em aparelhos (classe B)**

- Escopo: aparelho Android físico e iOS via EAS (pendências T-108), com o backend de homologação.
- Dep.: QA-01 a QA-03.
- AC: matriz tela × plataforma registrada.

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
