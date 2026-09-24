# Entrega 1 — Matriz API × telas

> Liga cada elemento das telas da entrega ao contrato da API em
> [PROJECT.md — Parte II](../PROJECT.md#parte-ii--referência-global-da-api).
> O frontend consome a API como está: nenhuma linha abaixo propõe alterar rota,
> campo ou erro. Lacunas apontam para [GATES](GATES.md).

Legenda de cobertura: **OK** = a API fornece; **Parcial** = fornece parte, o
restante depende de gate; **Ausente** = a API não fornece; **Local** = regra só do
cliente, sem chamada.

## 1. Endpoints usados nesta entrega

| Endpoint | Tela/uso | Observações de contrato relevantes ao cliente |
|---|---|---|
| `POST /educator/sign-in` | Login | `401 INVALID_CREDENTIALS` é erro de formulário; o interceptor global de 401 **não** deve tratá-lo como sessão expirada. |
| `GET /educator/me` | Home (saudação), guarda de sessão | Cache por sessão de login (PROJECT §7). |
| `PUT /educator/generate-token` | 01 etapa Email | Body usa `educatorEmail`, não `email`. `404 EDUCATOR_NOT_FOUND`; `500 INTERNAL_ERROR`. |
| `POST /educator/update-password` | 01 etapa Senha | Body `email` + `newPassword` (6–100). `400 PASSWORD_SAME_AS_OLD` / `EDUCATOR_NOT_FOUND`. Sem token: G-05. |
| `GET /educator/get-last-sessions` | Home, Últimas Sessões | Máx. 2 itens `{ studentName?, sessionName }`; `404 EDUCATOR_DOES_NOT_HAVE_SESSIONS` = vazio; `403 UNAUTHORIZED`. |
| `GET /student/` | 04, formulário de agendamento | Barra final no caminho; `401 UNHAUTHORIZED` (grafia da fonte). |
| `GET /task-notebook/` | 05 (Cadernos), 03 (Atividades Recentes) | Retorna `{ notebook, taskGroups }[]`; filtro `descriptionContains`. |
| `GET /task-group/list-by-educator` | 05 (Grupos) | Condicionado a G-06. |
| `GET /task/`, `GET /task/:id` | 05 (Atividades), 06 (conteúdo) | Não encontrado vem como `500 TASK_NOT_FOUND`. Condicionado a G-06. |
| `POST /task-notebook-session/start` | 05 → 06 | Body `studentId`, `name` (máx. 100). Resposta sem tarefas: G-06. Timeout = resultado desconhecido, reconciliar antes de repetir: G-08. |
| `POST /task-notebook-session/answer` | 06 | `timeToAnswer` sem unidade (G-07); `TASK_ALREADY_ANSWERED`, `SESSION_ALREADY_FINISHED`, `TASK_NOT_IN_NOTEBOOK`; sem idempotência (G-08). |
| `POST /task-notebook-session/finish` | Encerramento | `400 SESSION_ALREADY_FINISHED`. Só com zero respostas pendentes; timeout reconciliado por `finishedAt`. |
| `POST /task-notebook-session/observation` | Encerramento | Só após `finish` (`SESSION_NOT_FINISHED`); `observation` mínimo 1 caractere; timeout reconciliado pelo campo `observation`. |
| `GET /task-notebook-session/student/:studentId` | Retomada/reconciliação | Único meio documentado de ler o estado de uma sessão: `finishedAt`, `answers[]`, `observation`, `name`, `startedAt` (G-08). |
| `GET /appointment/` | Home (hoje), 07 | Sem filtros de data: filtro local (G-13). |
| `POST /appointment/` | Formulário (criar) | `studentId`, `scheduledAt` ISO, `observation?`. Timeout: recarregar a lista e procurar o item antes de nova tentativa explícita. |
| `PUT /appointment/:id` | Formulário (editar/remarcar) | Só `scheduledAt?` e `observation?` (`null` limpa). Aluno e status não mudam. Erro "não encontrado" é `400 NOT_FOUND`. |
| `DELETE /appointment/:id` | 07 Excluir | `400 NOT_FOUND`. |
| `GET /appointment/:id` | Não necessário na entrega | Formulário usa o item já carregado; se usado, `400 NOT_FOUND`. |

Fora da entrega (não consumir): cadastro, perfil, uploads, relatórios, análises,
IA, anamnese, `notify`, `watchdog`.

## 2. Matriz por tela e elemento

### Login (dependência funcional, fora do protótipo 01–07)

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Email, senha (6–100) | `sign-in` body | OK | — |
| Link "Esqueceu a senha?" → 01 | Local | Local | — |
| Visual | — | Ausente no conjunto inspecionado | G-18 |

### 01 `senha` — Recuperar / Redefinir Senha

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Etapa 1: email | `generate-token` (`educatorEmail`) | OK | — |
| Etapa 2: código ≥ 6 | Local, sem verificação no servidor | Local | G-05 |
| Badge "Código verificado" | Nenhuma verificação real | Ausente | G-05 |
| Etapa 3: nova senha 6–100, confirmar, visibilidade | `update-password` | Parcial (autorização) | G-05 |
| Voltar ao login | Local | Local | — |

### 02/03 `home` / `homeVazia` — Home

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Saudação com nome | `me.name` | Parcial (título/gênero) | G-11 |
| "Você tem N sessões agendadas para hoje" | `GET /appointment/` filtrado por dia | Parcial (fuso, status) | G-13 |
| Cards "Sessões de hoje": aluno, horário | `Appointment.studentId` + `GET /student/`, `scheduledAt` | OK | G-13 |
| Cards: descrição da atividade, categoria | — | Ausente | G-12 |
| Últimas: aluno, nome da sessão | `get-last-sessions` | OK (máx. 2; aluno opcional) | G-11 |
| Últimas: hora, duração, data, categoria, taxa de acerto | — | Ausente | G-11 |
| Estado vazio (03) | Lista do dia vazia | OK | — |
| 03 "Atividades Recentes" | 3 primeiros de `GET /task-notebook/` (sem noção de "recente" na API) | Parcial | G-11, G-15 |
| Iniciar Sessão → 04 | Local | Local | — |
| Card do dia → Agenda com data | Local (parâmetro de rota) | Local | — |
| "Ver todas →", card de última sessão | Relatórios (fora) | Ausente | G-10 |

### 04 `sessaoAluno` — Escolher aluno

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Lista, busca | `GET /student/` + filtro local por nome | OK | — |
| Avatar, nome, idade, gênero | `photoUrl`, `name`, `age`, `gender` | OK | G-14 (rótulos) |
| Nível ("Nível 1 - Inicial") | — | Ausente | G-14 |

### 05 `sessaoNome` — Nome e conteúdo

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Nome da sessão (máx. 100) | `start.name` | OK (mínimo: G-15) | G-15 |
| Chip Cadernos | `GET /task-notebook/` | Parcial (sem `name`) | G-15 |
| Chip Grupos | `GET /task-group/list-by-educator` | Parcial (uso na sessão) | G-06 |
| Chip Atividades | `GET /task/` | Parcial (uso na sessão) | G-06 |
| Busca por nome | `descriptionContains`/`promptContains` ou filtro local | OK | G-15 |
| Iniciar Sessão Agora | `start` | Parcial (vínculo do conteúdo; timeout ambíguo) | G-06, G-08 |
| Ver Tudo | Catálogo (fora) | Ausente | G-10 |

### 06 `sessaoPlayer` — Sessão em andamento e encerramento

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Nome do aluno | Store do fluxo | Local | — |
| Cronômetros atividade/total | Relógio local | Local | G-07 (envio) |
| Enunciado, alternativas | `Task.prompt`, `Task.alternatives` | OK se a fonte das tarefas for definida | G-06 |
| Imagem com zoom | `Task.imageFile` (URL) | OK | — |
| Áudio | `Task.audioFile` (URL) | OK na API; biblioteca pendente | G-03 |
| Confirmar Resposta | `answer` | Parcial | G-07, G-08 |
| Indicar acerto | `answers[].isCorrect` do servidor | O design não mostra; cliente não calcula | — |
| Encerrar, observação, destino Home (sem "Continuar sessão") | `finish` → `observation` | OK | G-16 resolvido |
| Cronômetro em segundo plano, saída pelo voltar | Relógio local | Local | G-21 |
| Retomada ao reabrir o app | Store persistida + listagem do aluno | Parcial | G-04, G-08, G-21 |

### 07 `agenda` — Agenda de Atendimentos

| Elemento | Fonte | Cobertura | Gate |
|---|---|---|---|
| Mini calendário, pontos por dia | `GET /appointment/` agrupado por dia local | OK | G-13 |
| Resumo: total, primeira, última | Derivado de `scheduledAt` do dia | OK | G-12, G-13 |
| Data por extenso | Formatação local pt-BR | Local | G-03 (se `Intl` insuficiente) |
| Card: horário de início | `scheduledAt` | OK | — |
| Card: "até hh:mm" | — | Ausente | G-12 |
| Card: status | `status` | OK (somente leitura) | G-12 |
| Card: aluno | `studentId` + `GET /student/` | OK | — |
| Card: atividade, categoria | — | Ausente | G-12 |
| Novo Agendamento | `POST /appointment/` | OK | G-18 (visual) |
| Editar / Remarcar | `PUT /appointment/:id` (`scheduledAt`, `observation`) | Parcial (sem aluno/status) | G-12 |
| Excluir com confirmação | `DELETE /appointment/:id` | OK | — |
| Montar Plano da Sessão | Tela "Em breve" (protótipo: Plano de Ensino por IA, fora) | Local | G-09 |
| Status "Agendada" / "Realizada" / "Cancelada" | `status` `PENDING` / `COMPLETED` / `CANCELLED` | OK | — |
| Parâmetros `selectedDate`/`openNew` | Parâmetros de rota | Local | — |

## 3. Discrepâncias adicionais do contrato que afetam o cliente

- Erros de "não encontrado" chegam como `500` em tarefa/grupo/caderno e como
  `400 NOT_FOUND` em agendamento: a camada de erros normaliza pelo `message`, não
  só pelo status.
- Qualquer endpoint pode devolver `500`; toda tela precisa de estado de erro com
  nova tentativa, sem perder o que foi digitado.
- `answer` devolve `isCorrect`; o cliente não recalcula acerto nem mostra
  percentuais derivados localmente.
- O token dura 7 dias e não tem refresh; 401 em rota autenticada limpa sessão e
  volta ao Login com aviso (PROJECT §8), exceto no próprio `sign-in`.
- `GET /appointment/` devolve todos os agendamentos do educador: volume e
  desempenho do filtro local precisam de verificação com dados reais (G-19).
