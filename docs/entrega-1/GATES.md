# Entrega 1 — Gates, decisões e conflitos de fonte

> Registro das decisões que condicionam tarefas do [BACKLOG](BACKLOG.md): as já
> tomadas (ver [Decisões registradas](#decisões-registradas)) e as ainda abertas. Uma
> recomendação só vira decisão quando registrada naquela seção. Quem aprova: usuário (produto/stack) ou orquestrador
> (processo), conforme a coluna "Decide". O estado atual de cada gate fica no
> [TRACKING](TRACKING.md#2-gates).

Fontes consideradas: [PROJECT.md](../PROJECT.md) (arquitetura e API, prevalece em
contrato de API), briefing do usuário enviado ao líder documental, contrato
[planejamento-entrega-1](../contracts/planejamento-entrega-1.md) e o documento de
discovery do projeto Claude Design (ver [DESIGN §1](DESIGN.md#1-fontes-e-acesso-real)).

## Regras

1. A coluna "Bloqueia" lista os bloqueios **diretos**; dependentes dessas tarefas
   esperam pelo grafo do BACKLOG. As demais tarefas seguem.
2. Resolver um gate = registrar decisão, quem decidiu, data e evidência na tabela
   de gates do TRACKING e no histórico deste arquivo. Sem registro, continua aberto.
3. Nenhuma resolução pode alterar o contrato da API (Parte II do PROJECT). Se a
   decisão depender do backend, o gate fica aberto até resposta documentada do time
   de backend; o cliente não inventa campo, rota ou semântica.
4. Precedência quando fontes conflitam, salvo decisão explícita em contrário:
   pedido direto do usuário > PROJECT.md (API e arquitetura) > briefing do usuário
   > discovery do design > protótipo visual > comportamento do web.
   Mesmo com precedência clara, o conflito é registrado aqui. Uma decisão do
   usuário não é reaberta por fonte de menor precedência (por exemplo, o chat do
   projeto de design).
5. **Gate aberto não reduz escopo.** Tarefas bloqueadas continuam na entrega; a
   homologação completa (T-1003) exige todas as tarefas do BACKLOG concluídas,
   incluindo T-404 (recuperação, etapa Senha); T-109 (Sentry) já foi retirada por
   decisão do usuário (G-20). Adiar ou retirar
   uma tarefa exige decisão explícita de redução de escopo do usuário, registrada
   no histórico deste arquivo e no TRACKING.
6. Correção ortográfica de copy do protótipo (por exemplo, "á" → "à") não é gate:
   aplica-se diretamente. Mudança de sentido ou de texto de produto continua exigindo decisão.

## Tabela de gates

Estado em 2026-09-24: **abertos só G-05, G-06 e G-07** (dependem do backend; perguntas em
[PERGUNTAS-BACKEND](PERGUNTAS-BACKEND.md)). Os demais estão resolvidos; a decisão vale e
fica em [Decisões registradas](#decisões-registradas). Nos gates resolvidos, a coluna
"Recomendação" é histórica.

| ID | Assunto | Decide | Bloqueia | Recomendação (histórica nos gates resolvidos) |
|---|---|---|---|---|
| G-01 | Plataformas e alvos de aceite (Android/iOS; celular/tablet; orientação; emulador x dispositivo) | Usuário |  **Resolvido** — T-105, T-108, T-1003 | Android primeiro: emulador + 1 aparelho físico; celular retrato como aceite obrigatório e tablet como verificação de layout. iOS depende de macOS ou EAS Build com conta Apple — a máquina observada é Windows, então simulador iOS local não existe. |
| G-02 | Gerenciador de pacotes e autorização de instalação | Usuário |  **Resolvido** — T-101 (e, por dependência, todo o código) | npm, padrão do `create-expo-app`, menor risco de hoisting com React Native. Autorizar instalação apenas no spike T-101 e no bootstrap T-102. |
| G-03 | Dependências além da stack do PROJECT | Usuário (orquestrador aprova lista) |  **Resolvido** — T-201 (fontes), T-203 (ícones), T-304 (conectividade), T-306 (datas, se necessário), T-801 (áudio), T-904 (data/hora) | Aprovar por item, após T-101 confirmar necessidade: fontes Google (Nunito, Roboto, Roboto Mono) via pacote Expo; `@react-native-community/netinfo` para `onlineManager`; biblioteca de datas só se `Intl` do Hermes não formatar pt-BR; `expo-audio`/`expo-av` para `audioFile`; seletor de data/hora nativo. Ícones: preferir `@expo/vector-icons` se vier no template. |
| G-04 | Chave de criptografia do MMKV, ciclo de limpeza e isolamento entre contas | Usuário + líder |  **Resolvido** — T-303 | Chave aleatória gerada no primeiro uso e guardada no SecureStore. Todo dado persistido (cache de queries e fluxo de sessão) fica associado ao `educatorId`. **Logout explícito:** apaga token e cache de queries; se houver sessão em andamento, avisa e só a descarta localmente após confirmação. **401/expiração:** apaga token e cache de queries; preserva o fluxo de sessão criptografado para retomada após novo login **do mesmo** educador. **Login de outro educador:** apaga todos os dados persistidos do anterior antes da primeira renderização autenticada. Invariante obrigatória, independente da política escolhida: nenhuma troca de conta expõe cache ou sessão de outro educador. |
| G-05 | Autorização de `update-password` (e o badge "Código verificado") | Backend + usuário | T-404 | `update-password` só recebe `email` e `newPassword`; não há verificação do código. Não exibir "Código verificado" nem liberar a etapa 3 em produção sem mecanismo confirmado pelo backend. Enquanto isso, etapa 2 é só validação local (≥ 6 caracteres) e a UI não afirma verificação. |
| G-06 | Vínculo conteúdo ↔ sessão e fonte das tarefas do player | Backend + usuário | T-703 (quais chips), T-704, T-802 | `start` recebe só `studentId`/`name` e retorna `TaskNotebookSession` sem tarefas; `answer` retorna `TASK_NOT_IN_NOTEBOOK`/`NOTEBOOK_NOT_FOUND`, indicando vínculo com caderno não documentado. O discovery do design diz que `start` "retorna sessionId e as tarefas" — conflito com o PROJECT, que prevalece. Confirmar com backend antes de integrar. |
| G-07 | Unidade de `timeToAnswer` | Backend | T-802 | Não enviar valor até confirmar; o cronômetro mede internamente em ms e converte na borda. |
| G-08 | Política de reenvio e reconciliação de mutações de sessão sem idempotência (`start`, `answer`; `finish`/`observation` seguem a mesma regra) | Líder + usuário; backend para idempotência |  **Resolvido** — T-704, T-803 | Nenhuma mutação de resultado desconhecido é repetida automaticamente; antes, reconciliar pela listagem `GET /task-notebook-session/student/:studentId`. `answer`: `TASK_ALREADY_ANSWERED` só vira "confirmado" se a resposta existir na listagem com o mesmo `taskId`/`selectedAlternativeId`; divergência vira conflito visível. `start`: sessão sem `finishedAt`, mesmo `name` e `startedAt` ≥ instante do envio menos 2 min de tolerância de relógio (valor a aprovar); uma correspondência é adotada, nenhuma permite nova tentativa explícita, várias viram conflito. `finish`: `finishedAt` na listagem. `observation`: campo `observation` na listagem. Limitação: sem GET individual nem idempotência, a identificação do `start` é heurística; pedir ao backend idempotência ou retorno consultável. |
| G-09 | Destino de "Montar Plano da Sessão" (Agenda) | Usuário |  **Resolvido** — T-905 | Conflito: discovery do design diz Plano de Ensino (PE), mas também lista a tela 04 como acessível "com o aluno do agendamento". PE está fora da entrega. Recomendado: abrir 04 com o aluno pré-selecionado. |
| G-10 | Destinos fora do escopo: tabs Atividades/Alunos/Relatórios, menu, avatar, "Ver todas →", card de "Últimas Sessões", "Ver Tudo" (05) | Usuário |  **Resolvido** — T-501, T-703 ("Ver Tudo") | Manter os controles visíveis conforme design, com tela "Em breve" ou desabilitados com rótulo de acessibilidade explicando. A estrutura de abas do design (Início, Atividades, Alunos, Agenda, Relatórios) diverge da estrutura planejada em PROJECT §4 (`agenda, alunos, conteúdo, perfil`); recomendado seguir o design e registrar a divergência. |
| G-11 | Conteúdo da Home: "Últimas Sessões" e saudação | Usuário (+ backend se exigir campos) |  **Resolvido** — T-602 | `get-last-sessions` devolve no máximo 2 itens com `studentName?` e `sessionName`, sem id, data, duração, categoria ou acerto. Mostrar só o que existe; não calcular taxa de acerto no cliente. `404 EDUCATOR_DOES_NOT_HAVE_SESSIONS` é estado vazio, não erro. Saudação usa `Educator.name` sem título ("Dra.") e com texto neutro de gênero, porque a API não informa título nem gênero do educador. |
| G-12 | Campos de agendamento do design sem suporte na API | Usuário (+ backend se exigir campos) |  **Resolvido** — T-602, T-902, T-904 | A API não tem horário de término, atividade, categoria nem descrição. Exibir só `scheduledAt` (sem "até hh:mm"), status como leitura e `observation` como texto livre. Editar/Remarcar: somente `scheduledAt`/`observation`; aluno e status não são editáveis via `PUT`. "Primeira/Última Sessão" = menor/maior `scheduledAt` do dia. |
| G-13 | Fuso horário, "hoje" e filtros locais | Usuário |  **Resolvido** — T-306, T-901 | `GET /appointment/` não tem filtros: filtrar mês/dia no cliente. Usar o fuso do aparelho para exibir e definir "hoje"; enviar `scheduledAt` em ISO 8601 com offset. Definir se `CANCELLED` entra na contagem (recomendado: não entra na contagem da Home nem no resumo; aparece na lista com badge). |
| G-14 | Dados de aluno exibidos na tela 04 | Usuário |  **Resolvido** — T-702 | `Student` não tem nível. Mostrar "idade • gênero" (`male`/`female` → texto pt-BR aprovado) e omitir a linha de nível; foto por `photoUrl`, iniciais quando `null`. |
| G-15 | Mapeamento de conteúdo na tela 05 e regra do nome | Usuário (depende de G-06) |  **Resolvido** — T-602, T-703 | `TaskNotebook` não tem nome: título = `description` truncada, tags = `category` e contagem de tarefas. Grupo usa `name`; tarefa usa `prompt`. Chips só para tipos aceitos por G-06. Nome da sessão: obrigatório no cliente com 1–100 caracteres após trim (a API só documenta máximo 100). |
| G-16 | Encerramento: ordem finish/observação, "Continuar sessão" e destino | Usuário | — (**resolvido**) | **Resolvido pelo pedido do usuário (briefing):** última resposta → `finish` → folha de observação com Pular/Salvar → Home. Sem "Continuar sessão" e sem diálogo intermediário. O chat do projeto de design e o protótipo (destino Relatório) não reabrem a decisão. |
| G-17 | Escala tipográfica, alvos de toque e contraste (adaptação dos tokens) | Usuário (design) |  **Resolvido** — T-201 | Ver [DESIGN §4](DESIGN.md#4-tokens-valores-da-fonte-e-adaptação-mobile). Não copiar 6.594px/10px; manter hierarquia com mínimos legíveis; texto sobre a primária em `rgb(26,90,82)` e não branco (1,60:1). |
| G-18 | Referência visual do Login, formulário de agendamento, confirmação e folha de observação | Usuário |  **Resolvido** — Aceite visual de T-401, T-804, T-904 (não o início) | Não estão entre as telas 01–07 inspecionadas. Construir com os primitivos e tokens; o aceite visual depende de referência aprovada (protótipo V4 de 32 telas ou decisão explícita). |
| G-19 | Ambiente de backend e dados de teste | Usuário |  **Resolvido** — T-1001, T-1003 (e testes manuais contra API) | Não usar produção com dados reais de crianças para testes. Homologação não tem URL informada; `localhost` do computador não é o do aparelho. Fornecer ambiente e conta de teste, ou autorizar explicitamente outro arranjo. |
| G-20 | Observabilidade (Sentry) | Usuário |  **Resolvido** — T-109 | Stack prevê Sentry; falta projeto/DSN e política de dados (sem PII de crianças em eventos). Não bloqueia as telas, mas T-109 faz parte da entrega: adiá-la exige decisão de redução de escopo (regra 5). |
| G-21 | Política temporal e de abandono da sessão | Usuário |  **Resolvido** — T-803; conclusão de AC-801-04 e AC-802-05 | Nada aprovado. Proposta: cronômetros da atividade e total pausam em segundo plano e com o app fechado, e voltam a contar na retomada; sair do player (voltar do Android, após confirmação) mantém a sessão local para retomada, sem chamar `finish`; ao reabrir o app, oferecer "Retomar" e "Encerrar agora" (que executa o encerramento de T-804 com as respostas já confirmadas); sem expiração automática no cliente; descartar localmente só com confirmação e sem apagar nada no servidor. |

## Decisões registradas

Decididas pelo usuário em 2026-09-24, em resposta às perguntas da sessão Claude Code /
`claude-opus-5-5` (evidência: registro da conversa; espelhado no TRACKING §2).

| Gate | Decisão | Consequência no plano |
|---|---|---|
| G-01 | Development build Expo: **Android** (emulador + aparelho físico) **e iOS via EAS Build**. Aceite obrigatório em **celular retrato**; tablet como checagem de layout. | Expo Go fora (MMKV criptografado). iOS exige conta Apple Developer e aparelho iOS fornecidos pelo usuário; sem eles, AC-108-02 vira pendência. Maestro iOS exige macOS: E2E em Android e iOS validado manualmente. |
| G-02 | **pnpm**; instalação autorizada no spike T-101 e no bootstrap T-102. | T-101 confirma a configuração do pnpm para Expo/Metro. Outras instalações seguem R-01 e G-03. |
| G-03 | Autorizadas: fontes Google via Expo (Nunito, Roboto, Roboto Mono), `@react-native-community/netinfo`, áudio (`expo-audio`) e seletor nativo de data/hora, e lib de datas **só se** o `Intl` do Hermes não atender pt-BR/fuso. | Versões exatas fechadas por T-101. Ícones: `@expo/vector-icons` do template, sem nova dependência. |
| G-04 | Proposta aprovada: chave no SecureStore; logout apaga token e cache (sessão em andamento só após confirmação); 401 preserva a sessão criptografada para o **mesmo** educador; login de outro educador apaga tudo antes de abrir. | AC-303-04 e AC-701-04. |
| G-08 | Nunca repetir mutação de resultado desconhecido automaticamente; reconciliar pela listagem do aluno; tolerância de relógio de **2 min** no `start`; divergência vira conflito visível. | Idempotência continua como pedido ao backend (PERGUNTAS-BACKEND, P4), sem bloquear. |
| G-09 | **Revisto no mesmo dia, após conferir o protótipo:** "Montar Plano da Sessão" abre a **tela "Em breve"**, como os demais destinos fora do escopo. (Decisão anterior, substituída: tela 04 com aluno pré-selecionado.) | O protótipo leva ao Plano de Ensino por IA (`pe`), fora da entrega. AC-702-04 removido. |
| G-10 | Destinos fora do escopo ficam **visíveis e abrem tela "Em breve"**; tab bar com as 5 abas do design. | Divergência com PROJECT §4 registrada (C-06). |
| G-11 | Home mostra **só o que a API fornece**: últimas sessões com aluno e nome da sessão; saudação "Olá, {nome}! 👋" sem título; estado vazio "Boas-vindas!". **Complemento (após conferir o protótipo):** o estado 03 mostra "Atividades Recentes" com os 3 primeiros cadernos de `GET /task-notebook/`, na ordem da API. | Nada calculado no cliente; a API não informa uso recente, então a seção não afirma ordem por uso. |
| G-12 | Agenda com **só campos da API**: início sem "até", status em texto, aluno, observação. Editar = data/hora + observação; Remarcar = data/hora. Primeira/Última = menor/maior horário do dia. **Status:** `PENDING` "Agendada" (acento turquesa), `COMPLETED` "Realizada" (novo token `color.success` `rgb(80,200,120)`, só decorativo), `CANCELLED` "Cancelada" em tag neutra. | Verde do protótipo vira token; cancelado não tem visual no protótipo. |
| G-13 | Fuso **fixo `America/Sao_Paulo`** para "hoje", agrupamento e exibição, independente do aparelho; envio ISO com offset. `CANCELLED` **não conta** na Home nem no Resumo do Dia e **aparece** na lista da Agenda com badge. | T-101 verifica o suporte do Hermes a `timeZone`; AC-306-02/05. |
| G-14 | Tela 04 mostra **idade • gênero**, sem nível; foto ou iniciais. | — |
| G-15 | Proposta aprovada: caderno com título = descrição truncada e tags = categoria + nº de tarefas; grupo por `name`; atividade por `prompt`; nome da sessão obrigatório, 1–100 caracteres. | Chips ainda dependem de G-06. |
| G-16 | Última resposta → `finish` → observação (Pular/Salvar) → Home, sem "Continuar sessão". | Resolvido antes, pelo briefing. |
| G-17 | Proposta do [DESIGN §4](DESIGN.md#4-tokens-valores-da-fonte-e-adaptação-mobile) aprovada (escala mínima, texto sobre turquesa em `rgb(26,90,82)`, alvos ≥ 48). | T-201 liberada quanto a este gate. |
| G-18 | Login, formulário de agendamento, confirmação e folha de observação são **montados com os primitivos e tokens**; aceite visual pelo usuário ao ver no app. | Aceite visual feito com o app rodando. |
| G-19 | **Backend local** na máquina de desenvolvimento, com dados fictícios. | App acessa pelo IP da rede ou `10.0.2.2`; HTTP só no perfil dev (T-106). Nenhum dado real de criança. |
| G-20 | **Adiar Sentry: redução de escopo.** | T-109 cancelada; sai da homologação. |
| G-21 | Proposta aprovada: cronômetros pausam em segundo plano e com o app fechado; sair pelo voltar (com confirmação) guarda a sessão sem `finish`; ao reabrir, "Retomar" ou "Encerrar agora"; sem expiração automática; descartar localmente só com confirmação. | AC-801-04, AC-802-05, AC-803-04. |

## Não objetivos propostos (precisam de confirmação, não bloqueiam)

- Notificações locais ou push, e o acesso à Agenda por notificação/fluxo WhatsApp.
  O fluxo WhatsApp do protótipo não implica backend de notificações nem push nesta entrega.
- Biometria opcional ao abrir o app.
- Tema escuro: o design só tem tema claro, embora a stack preveja suporte (PROJECT §3).
- Cadastro de educador, perfil, CRUD de alunos, catálogo completo de atividades,
  Relatórios, Relatório da Sessão, Plano de Ensino (PE), anamnese, PDF e IA.
- Uso offline completo (PROJECT §7: escrita exige conexão).

## Conflitos de fonte registrados

| # | Fonte A | Fonte B | Tratamento |
|---|---|---|---|
| C-01 | Discovery do design: `start` retorna "sessionId e as tarefas" | PROJECT: retorna `TaskNotebookSession` sem tarefas | PROJECT prevalece; G-06 |
| C-02 | Discovery e protótipo: "Montar Plano da Sessão" → PE (confirmado no fonte) | Discovery: tela 04 acessível pela Agenda com aluno do agendamento | G-09 revisto: "Em breve" |
| C-15 | Protótipo 03: seção "Atividades Recentes" | Discovery não cita; API sem noção de "recente" | G-11 complementado: 3 primeiros cadernos |
| C-16 | Protótipo 07: status "Realizada" em verde `rgb(80,200,120)`, fora da paleta; sem visual de cancelado | API: `PENDING`, `COMPLETED`, `CANCELLED` | G-12 complementado |
| C-17 | Protótipo `obs`: observação com Negrito/Itálico/Lista | API: `observation` é string simples | Texto simples multilinha (G-18) |
| C-03 | Protótipo: fim da sessão → Relatório da Sessão | Briefing/discovery: → Home | Briefing prevalece (Home); G-16 resolvido |
| C-04 | Chat do designer: "Continuar sessão" no modal de observação | Pedido do usuário: última resposta → observação → Home; API: observação só após `finish` | Pedido do usuário prevalece: sem "Continuar sessão"; G-16 resolvido |
| C-14 | Chat do designer: decisões "pendentes de confirmação" | Briefing do usuário | Briefing prevalece; o chat não reabre decisões do usuário (regra 4) |
| C-05 | Design: badge "Código verificado" | API: não há verificação de código | G-05 |
| C-06 | Design: abas Início/Atividades/Alunos/Agenda/Relatórios | PROJECT §4: grupos `agenda, alunos, conteúdo, perfil` | G-10 |
| C-07 | Design: card de agendamento com "hh:mm até hh:mm", atividade, categoria | API: só `scheduledAt`, `observation`, `status` | G-12 |
| C-08 | Design: últimas sessões com hora, duração, data, categoria, acerto | API: `studentName?`, `sessionName` | G-11 |
| C-09 | Design: aluno com nível | API: `Student` sem nível | G-14 |
| C-10 | Design: caderno com título | API: `TaskNotebook` sem `name` | G-15 |
| C-11 | Design: cards de "Sessões de hoje" (Home) | API: agenda vem de `Appointment`, não de sessão | G-12/G-13 |
| C-12 | Design: saudação "Dra. Ana Paula" / "Seja bem-vinda!" | API: `Educator` sem título nem gênero | G-11 |
| C-13 | Design: tipografia 6.594px–10px, texto branco sobre turquesa | Acessibilidade mobile | G-17 |

## Histórico

- 2026-09-24: criação pelo líder documental (Claude Code / claude-opus-5-5). Todos os gates abertos.
- 2026-09-24: revisão corretiva pedida pelo orquestrador (Orca `msg_3462ead39480`,
  `msg_f6414a044ad2`), aplicada por Claude Code / claude-opus-5-5 em execução direta a
  pedido do usuário. G-16 resolvido pelo briefing; G-21 criado; G-04, G-08 e G-20
  reescritos; regras 5 e 6 acrescentadas; conflitos C-03, C-04 e C-14 atualizados.
- 2026-09-24: o usuário decidiu G-01 a G-04, G-08 a G-15, G-17 a G-21 (ver
  [Decisões registradas](#decisões-registradas)). G-20 = redução de escopo: T-109
  cancelada. Continuam abertos G-05, G-06 e G-07, com perguntas redigidas ao backend.
- 2026-09-24: protótipo conferido no fonte da versão Offline ([DESIGN §7](DESIGN.md#7-verificação-contra-o-protótipo-2026-09-24)).
  Todas as dúvidas se confirmaram. Decisões do usuário a partir disso: G-09 revisto
  ("Em breve"); G-11 e G-12 complementados; conflitos C-15 a C-17 registrados.
