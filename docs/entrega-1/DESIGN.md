# Entrega 1 — Design: fontes, telas, tokens e componentes

> Referência local e durável do design das telas 01–07 para a implementação React
> Native. O design é referência visual e de fluxo: não é contrato de API e não
> torna componentes web reutilizáveis em React Native. Conflitos com a API ficam em
> [GATES](GATES.md); a cobertura campo a campo fica em [API-TELAS](API-TELAS.md).

## 1. Fontes e acesso real

| Fonte | Local? | Acesso | Evidência |
|---|---|---|---|
| `Labirinto V4 Mobile - Offline.html` (projeto Claude Design `fe9f5a5d-00c3-4254-9797-0fba2801a1f3`) | Cópia do usuário em `Downloads`, fora do repositório | **Lido integralmente** em 2026-09-24: fonte do protótipo desempacotado localmente | Mesmo horário de atualização do arquivo remoto (2026-09-10 23:13 UTC); ver §7 |
| `Labirinto V4 Mobile.dc.html` | Cópia do usuário em `Downloads` | Comparado: mesmo fonte da versão Offline, sem as fontes embutidas | Mesmas 32 telas, dados e regras de navegação |
| `docs/Prompt - Mobile Fase 1 (Acesso, Início, Sessão, Agenda).md` (discovery do design) | Não | **Lido integralmente** | Copiado pelo botão "Copy" do editor do projeto |
| `components/v4/Components.bundle.js` (35 KB) e `Components.d.ts` (3 KB) | Não | Listados pela API do projeto; **não lidos** | São componentes web do Figma: referência de nome, não código a importar |
| "Mapa de Navegação — Labirinto do Saber (Frontend Web)" | Não | Não acessado | Citado pelo discovery e pelo briefing |
| Briefing do usuário ao líder documental | Sim (na spec da tarefa) | Lido | Spec `task_c312de1f9319` |

Histórico do acesso:

1. Primeira tentativa: `WebFetch` no link deu **HTTP 403**. Pelo Chrome, o visualizador
   abriu, mas o conteúdo fica num iframe de outra origem e só 01 e o topo de 02 foram
   observados em captura.
2. Segunda tentativa (2026-09-24): pelo Chrome, as chamadas de leitura do editor
   (`ListFiles`) listaram os arquivos do projeto. Por pedido do usuário, a leitura
   seguiu **fora do navegador**: a versão Offline já estava em `Downloads`; o pacote foi
   desempacotado num diretório temporário da sessão e o fonte das telas foi lido como
   texto. Nada foi editado no projeto de design e nenhuma mensagem foi enviada.
3. O fonte é um protótipo com dados fictícios e navegação por palavra-chave do texto
   clicado. Destinos derivados dessa navegação são indício, não especificação.

## 2. Catálogo das telas

Estrutura das telas logadas no design: status bar (44), header de 64 com menu à
esquerda, título central e avatar à direita; tab bar **Início · Atividades · Alunos ·
Agenda · Relatórios** onde indicado. Rotas abaixo são **propostas** (Expo Router,
organização do PROJECT §4) e só valem depois do bootstrap.

| # | Chave | Tela | Header | Tabs | Rota proposta | Equivalente web |
|---|---|---|---|---|---|---|
| — | — | Login (fora do conjunto 01–07) | não | não | `app/(auth)/login.tsx` | `/` login |
| 01 | `senha` | Recuperar / Redefinir Senha | não | não | `app/(auth)/forgot-password.tsx` | `/forgotPassword` + `/resetPassword` |
| 02 | `home` | Home com agenda | sim | sim | `app/(tabs)/index.tsx` | `/home` |
| 03 | `homeVazia` | Home sem agenda (mesma tela, estado vazio) | sim | sim | `app/(tabs)/index.tsx` | `/home` |
| 04 | `sessaoAluno` | Iniciar Sessão — escolher aluno | sim | não | `app/session/student.tsx` | `/Session` |
| 05 | `sessaoNome` | Iniciar Sessão — nome e conteúdo | sim | não | `app/session/content.tsx` | `/SessionTitle`, `/SessionType`, `/SessionNotebook` · `/SessionGroup` · `/SessionActivities` |
| 06 | `sessaoPlayer` | Sessão em andamento (+ encerramento) | sim | não | `app/session/player.tsx` | `/SessionInit` |
| 07 | `agenda` | Agenda de Atendimentos | sim | sim | `app/(tabs)/appointments.tsx` | `/agenda` |
| — | — | Formulário de agendamento | — | não | `app/appointment-form.tsx` (modal) | modal da agenda |

### 01 · Recuperar / Redefinir Senha (`senha`)

- Acesso: link "Esqueceu a senha?" no Login. Sem header e sem tabs.
- Uma única tela com indicador de 3 etapas **Email → Código → Senha**.
  Título "Recuperar Senha", subtítulo "Digite seu email para receber o código".
- Etapa 1: email → `PUT /educator/generate-token`.
- Etapa 2: código com validação **apenas local** (≥ 6 caracteres). Não é verificação real.
- Etapa 3: card "Etapa 3/3", "Nova Senha" (mascarado, alternar visibilidade, dica
  mínimo 6; máximo 100 pela API), "Confirmar Nova Senha", botão **Redefinir Senha**
  → `POST /educator/update-password` → Login.
- Badge "Código verificado" e o texto "Código verificado!": só com autorização
  comprovada (G-05). Link **Voltar ao login** em todas as etapas.

### 02/03 · Home (`home` / `homeVazia`)

- Acesso: login bem-sucedido, aba Início, fim da sessão (06).
- Banner turquesa: saudação com o nome do educador, subtítulo com a contagem de
  agendamentos de hoje ou, sem agendamentos, a mensagem de boas-vindas (texto neutro,
  G-11), botão branco **Iniciar Sessão** → 04.
- "Sessões de hoje" (só com itens): cards com borda esquerda de acento (turquesa ou
  rosa), aluno, horário e tag; tocar → Agenda com a data pré-selecionada.
- Estado 03 (sem agendamentos hoje): além de "Últimas Sessões Realizadas", o protótipo tem
  a seção **"Atividades Recentes"** com cards de caderno (título, descrição, tags).
  Decisão (G-11): mostrar os primeiros 3 cadernos de `GET /task-notebook/` na ordem da API,
  com o mapeamento de G-15; tocar abre "Em breve" (G-10). A API não informa uso recente.
- "Últimas Sessões Realizadas" com "Ver todas →" (→ Relatórios, G-10); cards com
  aluno e nome da sessão. Hora, duração, data, categoria e taxa de acerto do design
  não existem na API (G-11). Tocar no card → Relatório da Sessão (G-10).

### 04 · Escolher aluno (`sessaoAluno`)

- Acesso: **Iniciar Sessão** da Home.
- Marcador de passo "1", título "Escolha o aluno que participará desta sessão",
  campo "Buscar Aluno...", lista com avatar circular, nome, "idade • gênero" e nível (G-14).
- Seleção: borda turquesa **e** check circular (não depender só da cor).
- Rodapé **Voltar** (secundário) e **Próximo Passo** (primário, desabilitado sem seleção) → 05.

### 05 · Nome e conteúdo (`sessaoNome`)

- Card "Dê um nome à sessão" (o protótipo grafa "á"; correção ortográfica aplicada
  sem gate, GATES regra 6), placeholder "Ex: Sessão de Alfabetização - 08/04/2026".
- "Como gostaria de começar?", busca "Buscar caderno por nome...", chips
  **Cadernos / Grupos / Atividades**, link "Ver Tudo" (G-10).
- Cards de conteúdo: título, descrição, tags (primeira turquesa, demais neutras). Mapeamento em G-15.
- Rodapé **Voltar** → 04 e **Iniciar Sessão Agora** → `start` → 06 (G-06).

### 06 · Sessão em andamento (`sessaoPlayer`)

- Linha superior: nome do aluno, cronômetro da atividade (Roboto Mono, destaque) e tempo total.
- Card da atividade: enunciado, imagem (toque abre zoom), áudio quando `audioFile`
  existir (ícone `IconSounds`), alternativas selecionáveis (selecionada com fundo
  `rgb(216,245,243)` e borda turquesa). O exemplo do protótipo (animais) é mock; a
  tela precisa atender `multipleChoice` e `multipleChoiceWithMedia` com imagem e/ou áudio.
- **Confirmar Resposta** → `answer` → próxima atividade. Na última: `finish` → folha
  de observação **Pular / Salvar** → `observation` (se Salvar) → **Home**. Sem
  "Continuar sessão" e sem diálogo intermediário (G-16 resolvido pelo briefing).
- Cronômetros pausam em segundo plano e com o app fechado; sair pelo voltar (com
  confirmação) guarda a sessão; ao reabrir, "Retomar" ou "Encerrar agora" (G-21).
- Uso de frente para a criança (PROJECT §6): fonte ampliada e alvos de toque generosos.

### 07 · Agenda de Atendimentos (`agenda`)

- Acesso: aba Agenda; card de "Sessões de hoje" (data pré-selecionada). Acesso por
  notificação/WhatsApp fica fora da entrega.
- Mini calendário mensal "abril 2026" com ‹ ›, grade de 7 colunas, ponto nos dias
  com agendamento, dia selecionado destacado.
- **Novo Agendamento**; "📊 Resumo do Dia": Total de Sessões, Primeira Sessão, Última Sessão.
- "Sessões de Hoje" com data por extenso ("quinta-feira, 02 de abril de 2026"); ao
  selecionar outro dia, o título deve refletir o dia escolhido (copy a confirmar).
- Card: horário e badge de status; aluno; atividade e categoria (G-12); ações
  **Editar / Remarcar / Excluir** (Excluir com confirmação); **Montar Plano da Sessão**, que
  no protótipo abre o Plano de Ensino por IA e nesta entrega abre a tela "Em breve" (G-09).
- Status (API × protótipo): `PENDING` = "Agendada" (acento turquesa), `COMPLETED` =
  "Realizada" (acento `color.success`), `CANCELLED` = "Cancelada" em tag neutra (sem
  visual no protótipo; decisão de 2026-09-24). O status aparece sempre em texto.
- Parâmetros de rota equivalentes ao web: `selectedDate` → `?date=AAAA-MM-DD`;
  `openNew` → `?new=1` (abre o formulário de criação).

## 3. Mapa de navegação proposto

```
Login ──"Esqueceu a senha?"──> 01 ──Redefinir Senha / Voltar ao login──> Login
Login ──sign-in ok──> Home (02/03)
401 em rota autenticada ──> Login (sessão limpa, aviso)

Home ──Iniciar Sessão──> 04 ──Próximo Passo──> 05 ──Iniciar Sessão Agora──> 06
06 ──última resposta──> finish ──> Observação (Pular/Salvar) ──> Home
Home ──card de hoje──> Agenda ?date=
Home ──Ver todas / card de última sessão──> destino G-10

Agenda ──Novo / Editar / Remarcar──> formulário (modal)
Agenda ──Excluir──> ConfirmDialog
Agenda ──Montar Plano da Sessão──> "Em breve" (no protótipo: Plano de Ensino por IA; G-09)

Tabs: Início · Atividades (G-10) · Alunos (G-10) · Agenda · Relatórios (G-10)
Reabrir o app com sessão ativa ──> oferta de retomada (G-08, G-21)
```

## 4. Tokens: valores da fonte e adaptação mobile

Os valores da coluna "Fonte" são exatos do design (CSS). **Não** se presume que
pixels CSS do protótipo virem dp/pt 1:1. A coluna "Proposta" foi **aprovada pelo
usuário em 2026-09-24 (G-17)** e é a referência de T-201.

### Cores

| Token proposto | Fonte (exata) | Uso no design | Nota de acessibilidade (WCAG 2.x, calculado) |
|---|---|---|---|
| `color.primary` | `rgb(114,222,212)` | botões, banner, seleção, passo ativo | Branco sobre ela: **1,60:1** (falha). Preto: 13,11:1; `rgb(26,90,82)`: 4,99:1 (AA texto normal) |
| `color.selection` | `rgb(216,245,243)` | fundo selecionado, tags | Destaque sobre ela: 6,95:1 |
| `color.accent` | `rgb(26,90,82)` | texto de destaque, links | Sobre branco 7,99:1 |
| `color.pink` | `rgb(233,75,143)` | acento, ação destrutiva | Sobre branco 3,58:1: só texto grande, ícones e bordas |
| `color.success` | `rgb(80,200,120)` | acento do agendamento "Realizada" (07) | Sobre branco **2,13:1** e sobre o fundo 2,00:1: só decorativo (borda de acento); o status vai em texto |
| `color.background` | `rgb(246,248,248)` | fundo de tela e de input | — |
| `color.surface` | `#fff` | cards | — |
| `color.border` | `rgb(224,224,224)` | borda de card | 1,32:1: decorativa; não pode ser o único limite de campo |
| `color.tagNeutral` | `rgb(243,244,246)` | tags neutras | Secundário sobre ela 8,34:1 |
| `color.text` | `rgb(0,0,0)` | texto principal | 21:1 |
| `color.textSecondary` | `rgb(63,74,73)` | texto secundário | 9,18:1 no branco; 8,61:1 no fundo |
| `color.textTertiary` | `rgb(158,151,151)` | terciário, placeholder | **2,87:1** no branco e 2,69:1 no fundo: falha para texto |

Adaptações propostas (G-17): texto e ícones sobre `primary` em `accent` ou preto;
placeholder e metadado em tom com ≥ 4,5:1 a aprovar; seleção indicada por borda
turquesa **mais** check, fundo `selection` e `accessibilityState.selected` (a borda
turquesa sobre branco tem 1,60:1, abaixo de 3:1 para componentes); rosa em texto só
≥ 18,66px bold ou 24px regular, ou tom mais escuro aprovado. Tema escuro: sem
referência no design; proposto fora da entrega.

Os contrastes foram calculados com a fórmula de luminância relativa do WCAG
(script Node local sobre os valores RGB acima); refazer a checagem sobre as cores
finais implementadas.

### Tipografia

Famílias: Nunito (interface), Roboto Mono (horários e cronômetro), Roboto (título do header).

| Papel | Fonte (exata) | Proposta mobile (pt/dp, escala do sistema ativa) |
|---|---|---|
| Header | Roboto 400 22px / 28px | 22 / 28 |
| Rótulo da tab bar | Roboto 600 9px / 13px; aba ativa em pill `color.selection` com texto `color.accent`, inativa em `color.textTertiary` | 12 / 16; inativa em tom com ≥ 4,5:1 |
| Título de tela e banner | Nunito 700 17.358px | 20 / 26 |
| Título de seção | Nunito 700 13px | 16 / 22 |
| Título de card | Nunito 700 12px | 15 / 20 |
| Corpo, label | Nunito 400/700 10px, lh 13.138px | 14 / 20 |
| Botão | Nunito 700 10px, lh 14.646px | 16 / 20 |
| Tag, metadado | Nunito 700/400 6.594px, lh 9.891px | 12 / 16 (mínimo) |
| Horário, cronômetro | Roboto Mono | 14 / 20 em listas; 20 / 26 no player |
| Enunciado para a criança (06) | não especificado | ≥ 20 / 28; alternativas ≥ 18 |

Critério da proposta: preservar a ordem hierárquica e o peso da fonte, com mínimos
de legibilidade em aparelho (12 para metadado, 14 para corpo). Respeitar a escala de
fonte do sistema; conteúdo crítico não pode ser truncado com escala 1,3, e nada
pode perder função com escala 2,0 (quebra de linha em vez de corte).

### Forma, espaço e elevação

| Elemento | Fonte (exata) | Proposta |
|---|---|---|
| Card | raio 15.833px, borda 0.492px, sombra `0 2.462px 2.462px rgba(0,0,0,.25)`, padding 20.187px ou 16px 18px (listas) | raio 16, borda `hairlineWidth`, sombra iOS equivalente e `elevation` 2 no Android, padding 20 ou 16×18 |
| Botão primário e banner | raio 16.273px, sombra `0 2.170px 2.170px rgba(0,0,0,.25)`, padding 14px | raio 16, altura mínima 48, padding 14 |
| Input | raio 11px, fundo `rgb(246,248,248)`, padding 13px 14px | raio 12, altura mínima 48, indicador de foco visível |
| Tag | pill, padding 4px 9px | pill, padding 4×10 (sem alvo de toque) |
| Chip de filtro | pill, padding 7px 12px | pill, área de toque mínima 48 com `hitSlop` |
| Borda esquerda de acento | 2.090px | 3 (2 se aprovado) |
| Avatar da lista | 35.804 × 37.828 | 40 × 40 circular (o valor não quadrado parece artefato de extração; confirmar) |
| Status bar / header | 44 / 64 | safe area do sistema / 56–64 |
| Alvo de toque | não especificado | ≥ 44×44 pt (iOS) e ≥ 48×48 dp (Android) |

## 5. Componentes

### Referências extraídas do Figma (não locais, não lidas)

`NativeStatusBar`, `IconsMenu24px`, `IconsAccountCircleFilled24px`,
`IconChevronRight`, `IconChevronDown2`, `IconEdit`, `IconSounds`, `RecordIcon`,
`UserProfile` — de `components/v4/Components.bundle.js` / `Components.d.ts`. São
componentes web: servem como referência de forma e nome, não como código a importar.
Em React Native: status bar do sistema com safe area; ícones por um wrapper `Icon`
(conjunto a confirmar no bootstrap, G-03).

### Primitivos (base de todas as telas)

| Componente | Variações | Telas | Tarefa |
|---|---|---|---|
| `Card` | padrão, acento esquerdo, selecionado, gradiente | todas | T-202 |
| `Button` | primário, secundário, branco sobre primária, pill; loading, desabilitado | todas | T-202 |
| `TextField` | label, dica, erro, senha com visibilidade | Login, 01, 05, formulário | T-202 |
| `SearchField` | com limpar | 04, 05 | T-202 |
| `Tag` | primária, neutra, rosa | 02, 03, 05, 07 | T-202 |
| `FilterChips` | ativo, inativo | 05 | T-202 |
| `SectionHeader` | título, subtítulo, ação opcional | 02, 03, 07 | T-202 |
| `AppHeader` | menu, título, avatar | 02–07 | T-203 |
| `TabBar` | aba ativa | 02, 03, 07 | T-203 |
| `StepIndicator` | 3 etapas; passo único | 01, 04 | T-203 |
| `Avatar` | foto, iniciais | 04, header | T-203 |
| `FooterActions` | Voltar + primária (1 : 1,4) | 04, 05 | T-203 |
| `Icon` | wrapper do conjunto aprovado | todas | T-203 |
| `BottomSheet`, `ConfirmDialog` | formulário, confirmação | 06, 07 | T-204 |
| `LoadingState`, `EmptyState`, `ErrorState`, `PendingBanner` | — | todas | T-205 |

### Domínio

| Componente | Composição | Tarefa | Reuso futuro previsto no design |
|---|---|---|---|
| `GreetingBanner` | saudação, subtítulo, botão | T-602 | Home |
| `ScheduledSessionCard` | acento, aluno, horário, tag | T-602 | Perfil do aluno › Sessões |
| `CompletedSessionCard` | gradiente, aluno, sessão (campos G-11) | T-602 | Relatórios, Perfil |
| `StudentRow` | selecionável, avatar, nome, detalhes | T-702 | Alunos, Gerar Relatório |
| `ContentCard` | título, descrição, tags | T-602 (usado em 03 e 05) | Atividades, Banco de Atividades |
| `AnswerOption` | normal, selecionado, desabilitado | T-801 | atividades interativas |
| `ActivityPlayer` | enunciado, imagem com zoom, áudio, opções, cronômetros | T-801 | demais tipos de atividade |
| `ObservationSheet` | texto, Pular/Salvar, rascunho | T-804 | Relatório da Sessão |
| `MiniCalendar` | 7 colunas, seleção, pontos | T-902 | Gerar Relatório (período) |
| `StatTile` | rótulo, valor | T-902 | Progresso, Relatórios |
| `AppointmentCard` | acento, horário, status, ações, "Montar Plano" | T-902 | — |
| `AppointmentForm` | criar, editar, remarcar | T-904 | — |

O PROJECT lista `react-native-calendars` na stack, e essa escolha não é reaberta: o
`MiniCalendar` (T-902) o envolve e o estiliza conforme este documento. Grade própria
só com incompatibilidade comprovada, escalada e aprovada.

## 6. Estados e acessibilidade exigidos em todas as telas

- Estados: carregando, vazio, erro com nova tentativa, sem conexão (cache visível,
  escrita bloqueada com aviso), envio em andamento (botão desabilitado com indicador).
- Leitor de tela: rótulo, papel e estado em todo controle (`accessibilityRole`,
  `accessibilityLabel`, `accessibilityState` para selecionado/desabilitado); ordem de
  foco igual à ordem visual; anúncios para erros de formulário e mudança de etapa.
- Nada comunicado só por cor (seleção, status, acento rosa/turquesa).
- Alvos ≥ 44 pt / 48 dp; escala de fonte do sistema respeitada.
- **Decidido (G-01):** celular retrato como aceite obrigatório;
  tablet deve manter conteúdo legível sem esticar cards de ponta a ponta (largura
  máxima de conteúdo a definir em T-201).
- Emoji do banner ("👋") e do resumo ("📊") são decorativos: ocultos do leitor de tela.

## 7. Verificação contra o protótipo (2026-09-24)

Cada dúvida registrada em GATES foi conferida no fonte da versão Offline (§1).

| Item | O que o protótipo mostra | Resultado |
|---|---|---|
| C-05 / G-05 | 01 com "Etapa 3/3", badge "Código verificado" e "Código verificado! Agora crie uma nova senha segura" | Confirmado. O badge existe no design; a API não verifica código (G-05 aberto) |
| G-18 Login | Não existe tela de Login entre as 32; "Redefinir Senha" e "Voltar ao login" levam à Home no protótipo | Confirmado: Login sem referência visual |
| C-12 / G-11 | "Olá, Dra. Ana Paula! 👋"; 03 com "Seja bem-vinda!" | Confirmado; a API não tem título nem gênero |
| C-08 / G-11 | Últimas Sessões: aluno, "09:00 • 45min", "08/04/2026", categoria, "Taxa de Acerto 85%" | Confirmado; a API só dá aluno e nome da sessão |
| C-11 / G-12 | Sessões de hoje: aluno, horário, descrição da atividade, categoria | Confirmado; a API não tem atividade nem categoria no agendamento |
| Novo: 03 | Seção "Atividades Recentes" só no estado sem agenda | **Não estava no discovery.** Decidido: primeiros 3 cadernos (G-11) |
| C-09 / G-14 | 04: "8 anos • Feminino" e "Nível 1 - Inicial"; selecionado com borda e ✓ | Confirmado; a API não tem nível |
| C-10 / G-15 | 05: "Alfabetização Divertida", "Histórias Ilustradas" com descrição e tags; chips Cadernos/Grupos/Atividades; "Ver Tudo" | Confirmado; `TaskNotebook` não tem nome. Grafia "Dê um nome á sessão" confirmada |
| 06 | Aluno, dois cronômetros ("00:02", "00:00"), enunciado, área de imagem, 4 alternativas, Confirmar Resposta; sem indicador de progresso nem ícone de áudio | Confirmado. O protótipo não distingue visualmente qual cronômetro é o da atividade: definir na implementação (Roboto Mono em destaque = atividade, conforme discovery) |
| C-03 / G-16 | "Confirmar Resposta" leva ao Relatório da Sessão | Confirmado; prevalece a decisão do usuário (Home) |
| C-04 / G-16 | Não há "Continuar sessão", "Pular" nem folha de observação no fim da sessão | Confirmado que "Continuar sessão" só existia no chat do designer. A observação só aparece como a tela separada "Escrever Observação" (`obs`) |
| G-18 observação | Tela `obs`: resumo da sessão (duração, taxa de acerto), editor com Negrito/Itálico/Lista, contador de caracteres, "Limpar" e "Salvar Relatório" | A folha de observação da entrega usa texto simples multilinha: a API grava `observation` como string, sem formatação |
| C-07 / G-12 | 07: "09:00 até 10:00", badge "Realizada"/"Agendada", aluno, atividade, categoria, Editar/Remarcar/Excluir, "Montar Plano da Sessão" | Confirmado; status mapeado acima (§2, 07) |
| C-02 / G-09 | "Montar Plano da Sessão" navega para `pe` (Plano de Ensino gerado por IA) | Confirmado que o destino do protótipo é o PE. **G-09 revisto:** abre "Em breve" |
| C-06 / G-10 | Tab bar Início · Atividades · Alunos · Agenda · Relatórios; no protótipo levam a Criar Caderno, Progresso do aluno e Gerar Relatório | Confirmado; nesta entrega abrem "Em breve" |
| Header | 64 de altura, `IconsMenu24px` · título Roboto 22/28 · `IconsAccountCircleFilled24px`, fundo `rgb(246,248,248)` | Confirmado |
| C-13 / G-17 | Cores e tamanhos de fonte das telas 01–07 idênticos aos de §4; única cor nova: verde `rgb(80,200,120)` do status "Realizada" | Confirmado; verde adicionado como `color.success` |
| Mini calendário 07 | "abril 2026", ‹ ›, grade de 7 colunas com dias do mês vizinho esmaecidos, dia selecionado em turquesa, ponto nos dias com sessão | Confirmado |
