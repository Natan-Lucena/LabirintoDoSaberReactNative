# Testes detalhados — Conta, Sessão, Conteúdo e Base (REC-02, SES-05, ATV-02, FEC-03/04, NAV-03, FEC-02)

Detalhamento dos casos de [PLANO-TESTES §2.3 a §2.5 e §2.7](../PLANO-TESTES.md#23-conta-rec-02) para a rodada manual
da QA-06: o que fazer, o que esperar na tela e na rede, e, se falhar, onde olhar no código. Os IDs e os casos do plano
foram preservados; os casos com sufixo `+` são novos. Nada foi executado: a copy foi conferida no código em
2026-10-29.

**Tarefas cobertas e fichas:** [REC-02](../BACKLOG.md#rec-02--perfil-e-conta),
[SES-05](../BACKLOG.md#ses-05--sessão-ligada-ao-caderno-g-06),
[ATV-02](../BACKLOG.md#atv-02--detalhe-da-atividade-no-visual-novo),
[FEC-03](../BACKLOG.md#fec-03--grupo-inacessível-no-detalhe-do-caderno),
[FEC-04](../BACKLOG.md#fec-04--grupo-de-caderno-pelo-get-task-groupid),
[NAV-03](../BACKLOG.md#nav-03--limpeza-da-entrega-1) e
[FEC-02](../BACKLOG.md#fec-02--mocks-desligados-por-padrão-em-desenvolvimento). Contrato:
[BACKEND-ENTREGUE §6](../BACKEND-ENTREGUE.md) ("Sessão ligada ao caderno", "Profissão do educador", "Grupo por id") e
§9 (D3). A FEC-01 (rotas da V1) está em `05-fec01-rotas-v1.md`.

## 1. Mapa da área

| Tarefa    | Rota (`app/...`)                                                                                   | Tela / componente                                                                                                                                                                   | Hook e chave de consulta                                                                       | Função de API                                                                                                                   | Mock (`src/mocks/handlers/...`)                  |
| --------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| REC-02    | `app/profile.tsx`                                                                                  | `src/features/profile/ProfileScreen.tsx` › `ProfileScreen`, `ProfileContents`                                                                                                       | `useQuery` `homeQueryKeys.educator` = `["educator","me"]` (`src/features/home/useHomeData.ts`) | `getMe` (`src/api/endpoints/educator.ts`), `updateEducator`, `updateProfilePicture` (`src/api/endpoints/educator-update.ts`)    | `educator.ts`, `educator-update.ts`              |
| REC-02    | `app/(tabs)/resources.tsx`                                                                         | `src/features/resources/ResourcesScreen.tsx` (banner "Perfil")                                                                                                                      | `useHomeData` (`["educator","me"]`)                                                            | `getMe`                                                                                                                         | `educator.ts`                                    |
| REC-02    | (store) `src/stores/auth.ts`, `src/storage/mmkv.ts`                                                | `useAuthStore.logout`, `connectStorageToAuth`, `clearAllForEducator`                                                                                                                | —                                                                                              | —                                                                                                                               | —                                                |
| SES-05    | `app/session/student.tsx`, `content.tsx`, `player.tsx`, `finish.tsx`                               | `src/features/sessions/StudentStep.tsx`, `ContentStep.tsx`, `player/SessionPlayerScreen.tsx`, `player/sessionTasks.ts`, `resume/ResumeSessionPrompt.tsx`                            | store `src/stores/session-flow.ts` (`seedFromServerSession`, `appointmentId`)                  | `startSession`, `answerSession`, `finishSession`, `listSessionsByStudent` (`src/api/endpoints/session.ts`), `listTaskNotebooks` | `session-analysis.ts`, `content.ts`              |
| ATV-02    | `app/content/task/[id].tsx` (+ `[id]/edit.tsx`, `app/activities/[id].tsx`)                         | `src/features/content-detail/task/TaskDetailScreen.tsx`; edição `src/features/content-create/task/NewTaskScreen.tsx`; jogar `src/features/activities/engine/ActivityPlayScreen.tsx` | `taskQueryKeys` (`["task",id]`, `["task"]`)                                                    | `getTaskById`, `deleteTask`, `updateTask`                                                                                       | `content.ts`, `task-update.ts`, `task-delete.ts` |
| FEC-03/04 | `app/content/notebook/[id].tsx`, `app/content/group/[id].tsx`                                      | `src/features/content-detail/notebook/NotebookDetailScreen.tsx`, `src/features/content-detail/group/GroupDetailScreen.tsx`                                                          | `useGroupDetailData` (`["task-group",id]`, `["task"]`), `["task-notebook"]`                    | `getTaskGroupById` (`GET /task-group/:id`), `listTaskNotebooks`, `listTasks` (`src/api/endpoints/content.ts`)                   | `content.ts` (`group-shared`, `group-private`)   |
| NAV-03    | `app/(tabs)/index.tsx`, `app/(tabs)/patients.tsx`, `app/patients/new.tsx`, `app/patients/[id].tsx` | `HomeScreen.tsx`, `PatientsListScreen.tsx`                                                                                                                                          | —                                                                                              | —                                                                                                                               | —                                                |
| FEC-02    | `app.config.ts`, `src/config/env.ts`, `src/mocks/install.ts`                                       | `getUseMocks`, `getRuntimeUseMocks`, `installApiMocks`                                                                                                                              | —                                                                                              | —                                                                                                                               | `src/mocks/adapter.ts`                           |

**Design system:** `AppHeader`, `DsButton`, `Field`, `Avatar`, `Toast`/`useToast`, `InfoCard`, `Badge`,
`SectionTitle`, `FeatureRow`, `Fab`. Fora do DS: `src/components/media/ImagePickerField.tsx` (foto do perfil) e
`src/components/media/AudioPlayer.tsx`.

**Regras do app que valem para a área**

- **D3 (senha na resposta):** `PUT /educator/update-educator` responde com campos prefixados (`_name`, `_contact`,
  `_profession`, `_photoUrl`) e **`_password`**. `updateEducator` devolve `void` (descarta o corpo) e a tela
  **recarrega** `GET /educator/me` pela invalidação de `["educator","me"]`. Nunca copie nem registre essa resposta.
- **Logout:** `useAuthStore.logout` → `clearSession("logout")`: apaga o token (`src/features/auth/token-storage.ts`),
  zera `status/token/educatorId` e notifica `subscribeAuthCleared`; `connectStorageToAuth` (`src/storage/mmkv.ts`)
  responde a `logout` com `clearAllForEducator` (apaga **todo** o armazenamento do educador: cache de consultas
  persistido e `session:flow`) e a `sessionExpired` só com `clearQueryCache` (preserva o fluxo de sessão). A tela
  de Perfil ainda faz `queryClient.clear()` (cache em memória).
- **SES-05 (G-06 resolvido):** só **caderno** tem vínculo no backend (`taskNotebookId`); o `start` envia
  `taskNotebookId` para caderno; `appointmentId` quando a sessão veio de um atendimento. A lista **ordenada** de
  tarefas continua vindo de `notebook.tasks` em `GET /task-notebook/` (`resolveSessionTasks`).
- **Mocks:** `getUseMocks` devolve `false` quando `EXPO_PUBLIC_USE_MOCKS` está ausente/vazia em qualquer ambiente;
  `true` é proibido em `production`; valor diferente de `true`/`false` lança erro (`src/config/env.ts`).

## 2. Cenários de mock úteis (sem backend)

Com `EXPO_PUBLIC_USE_MOCKS=true` (login `educadora.mock@labirinto.test` / `senha123`; veja
[`src/mocks/README.md`](../../../src/mocks/README.md)):

- **Perfil:** educador fictício com `profession: null`; `PUT /educator/update-educator` aceita `newName`, `newContact`
  e `newProfession` de 3 a 100 e responde com o formato prefixado (o app descarta); `PUT
/educator/update-profile-picture` exige multipart `photo`.
- **Sessão:** `POST /task-notebook-session/start` guarda `taskNotebookId` e `appointmentId`; `answer` devolve `400
TASK_NOT_IN_NOTEBOOK` para tarefa fora do caderno (nem nos grupos dele) — só em sessão **com** caderno; `student-5`
  já começa com uma sessão aberta (cenário de retomada); `setMockSessionAnswerScenario("already-answered" |
"network-error" | "success")` de `src/mocks/handlers/session-analysis.ts`.
- **Grupo por id:** `group-shared` (de outro educador, dentro de `notebook-1`) abre em somente leitura;
  `group-private` → `403 UNAUTHORIZED`; id inexistente → `404 TASK_GROUP_NOT_FOUND`; a lista por educador omite os
  grupos alheios.

## 3. Como diagnosticar uma falha da área (roteiro curto)

1. **App ou backend?** Compare a chamada de rede (método, caminho, status, `message`) com o contrato
   (BACKEND-ENTREGUE §6, PROJECT.md Parte II). `2xx` com tela errada = cache/estado do app.
2. **Reproduza no mock** com o cenário do §2.
3. **Rode o teste automatizado** do caso (campo "Testes").
4. **Sessão e logout:** problemas de "dado da conta anterior" são de `clearAllForEducator` (`mmkv.ts`) ou de
   `queryClient.clear()`; problemas de "Voltar reabre a área logada" são do `SessionGuard`
   (`src/features/auth/useSessionGuard.ts`, `router.replace`).

---

## 4. REC-02 — Perfil e conta

#### REC-02.1 — Abrir o perfil

- **Prioridade / AC:** P1 · REC-02 (MAN)
- **Objetivo:** o banner de Recursos abre `/profile` com os dados reais do servidor.
- **Pré-condição:** logado.
- **Passos:** aba **Recursos** → tocar no banner do educador (rótulo de acessibilidade **"Perfil"**).
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Perfil"** (com voltar); a foto (ou o avatar com iniciais), o nome e, abaixo, a **profissão**
    (ou o e-mail se não houver); o seletor de imagem com **"Escolher imagem"** e **"Tirar foto"**; campos **"Nome"**,
    **"E-mail"** (**somente leitura**, desabilitado), **"Contato"**, **"Profissão"**; botões **"Salvar"** e **"Sair"**.
    Carregando: indicador; erro: "Não foi possível carregar o perfil." com **"Tentar de novo"**.
  - **Rede (backend real):** `GET /educator/me` (`200`, com `profession`; a resposta pode ser reaproveitada do cache da
    Início).
  - **Depois:** —
- **Onde está no código:** `app/profile.tsx`; `ResourcesScreen.tsx` (banner, `router.push("/profile")`);
  `ProfileScreen.tsx` › `ProfileContents` (`educatorQuery`, `reset` com `educator.contact ?? ""` e
  `educator.profession ?? ""`); `getMe`; DS `AppHeader`, `Avatar`, `Field`, `DsButton`.
- **Testes automatizados que cobrem:** `src/features/profile/__tests__/ProfileScreen.test.tsx` › "valida, salva só o
  alterado, recarrega /me e envia foto". Rodar:
  `pnpm exec vitest run src/features/profile --maxWorkers=1`.
- **Se falhar:**
  1. _Campo "Profissão" sempre vazio_ → o backend não devolveu `profession` em `GET /educator/me` (campo novo,
     BACKEND-ENTREGUE §6); olhe a resposta.
  2. _Banner sem foto/nome_ → `useHomeData` (`["educator","me"]`) ainda sem dados.
  3. _`401` e volta ao Login_ → token expirado (interceptor `src/api/client.ts`).
- **Evidência:** captura do perfil (rolar até "Sair"); **sem** o e-mail da conta visível (cubra o campo "E-mail").

#### REC-02.2 — Salvar contato e profissão

- **Prioridade / AC:** P1 · REC-02 (MAN) · AC-REC-02-01, AC-REC-02-02
- **Objetivo:** salvar envia só o que mudou e os dados reabrem do servidor.
- **Pré-condição:** REC-02.1.
- **Passos:**
  1. Mudar o "Contato" e a "Profissão" (3 a 100 caracteres).
  2. Tocar em **"Salvar"**.
  3. Sair da tela e reabrir o perfil; olhar o banner de Recursos.
- **Resultado esperado:**
  - **Tela:** toast **"Perfil atualizado"** (a tela **não** fecha); ao reabrir, os valores novos vêm do servidor; o
    banner de Recursos mostra a profissão. Sem nenhuma mudança, "Salvar" **não faz nada** (sem toast).
  - **Rede (backend real):** `PUT /educator/update-educator` com **só** os campos alterados (`newContact`,
    `newProfession`; `newName` só se o nome mudou), `200`; **em seguida** `GET /educator/me` (invalidação). O corpo do
    `PUT` não é lido pelo app. Valores em branco **não** são enviados (não dá para limpar contato/profissão).
  - **Depois:** Recursos e Início (mesma chave `["educator","me"]`) mostram o dado novo.
- **Onde está no código:** `ProfileScreen.tsx` › `save` (monta `input` condicional; `client.invalidateQueries({
queryKey: homeQueryKeys.educator })`; `toast.show("Perfil atualizado")`); `src/api/endpoints/educator-update.ts` ›
  `updateEducator` (retorna `void`; comentário "The response contains _password; never return or retain it");
  `getMe`.
- **Testes automatizados que cobrem:** `ProfileScreen.test.tsx` › "valida, salva só o alterado, recarrega /me e envia
  foto"; `src/api/endpoints/__tests__/educator-update.test.ts` › "discards the prefixed response including _password
  and reads /me".
- **Se falhar:**
  1. _Salvou mas o perfil mostra o valor antigo_ → o `GET /educator/me` não foi refeito (invalidação) ou o
     backend ainda não gravou `profession`; compare a resposta do `GET`.
  2. _`400` ao salvar_ → `newContact`/`newProfession` fora de 3–100; veja a `message` (aparece em vermelho abaixo
     dos campos, texto do backend).
  3. _Leu `_name` na tela_ → regressão: a tela deve ler só o `GET /educator/me` (D3).
- **Evidência:** capturas antes/depois; método/caminho/status do `PUT` e do `GET`; **sem copiar a resposta do
  `PUT`** (contém `_password`).
- **Divergência encontrada:** contato e profissão em branco são ignorados no envio (nenhum caminho para apagá-los),
  coerente com a ficha ("envia só o que mudou"), mas o plano não avisa; registre como limitação, não falha.

#### REC-02.3 — Validação do nome

- **Prioridade / AC:** P2 · AC-REC-02-01
- **Objetivo:** mensagens e bloqueio.
- **Pré-condição:** perfil aberto.
- **Passos:** apagar o nome e digitar 2 caracteres → "Salvar"; depois colar mais de 100 caracteres → "Salvar";
  repetir em "Contato" com 2 caracteres.
- **Resultado esperado:**
  - **Tela:** **"Informe entre 3 e 100 caracteres."** sob o campo (a validação roda ao tocar em "Salvar"); em
    "Contato"/"Profissão" o vazio é aceito, mas 1 ou 2 caracteres dão a mesma mensagem; nada é enviado.
  - **Rede (backend real):** nenhuma chamada.
  - **Depois:** —
- **Onde está no código:** `ProfileScreen.tsx` › `schema` (`name`, `optionalText`), `handleSubmit(save)`.
- **Testes automatizados que cobrem:** `ProfileScreen.test.tsx` › "valida, salva só o alterado, recarrega /me e envia
  foto".
- **Se falhar:** _enviou nome curto_ → o schema (`min(3)`); _mensagem ausente_ → o `Field` precisa receber
  `fieldState.error?.message`.
- **Evidência:** captura da mensagem.

#### REC-02.4 — Foto de perfil

- **Prioridade / AC:** P1 · REC-02 (MAN) · AC-REC-02-03
- **Objetivo:** a foto é enviada na hora que é escolhida e aparece no perfil e no banner.
- **Pré-condição:** perfil aberto; uma imagem pequena (< 5 MB) na galeria do emulador.
- **Passos:** tocar em **"Escolher imagem"** (rótulo "Escolher imagem da galeria") → escolher a imagem; depois
  conferir o perfil e Recursos. Repetir com uma imagem **> 5 MB** (se houver).
- **Resultado esperado:**
  - **Tela:** toast **"Foto atualizada"**; a foto nova aparece no perfil e no banner de Recursos. Acima de 5 MB:
    **"A foto deve ter até 5 MB."** abaixo do seletor e nada é enviado. Permissão negada: o seletor oferece **"Abrir
    configurações"**.
  - **Rede (backend real):** `PUT /educator/update-profile-picture` (**multipart**, campo **`photo`**) → `200`; depois
    `GET /educator/me` com `photoUrl` novo. Acima do limite no servidor: `400` `{ message: "THIS FILE IS TO LARGE" }`.
  - **Depois:** foto atualizada em Recursos e no perfil.
- **Onde está no código:** `ProfileScreen.tsx` › `choosePhoto` (`updateProfilePicture`, `setPhotoError`);
  `src/api/endpoints/educator-update.ts` › `updateProfilePicture` (checa `size > 5 * 1024 * 1024`, `FormData` com
  `photo`); `src/components/media/ImagePickerField.tsx`; `ResourcesScreen.tsx` (`educator.photoUrl`).
- **Testes automatizados que cobrem:** `educator-update.test.ts` › "uploads multipart photo and rejects a file over
  5 MB"; `ProfileScreen.test.tsx` › "valida, salva só o alterado, recarrega /me e envia foto".
- **Se falhar:**
  1. _Nada acontece ao escolher_ → permissão da galeria ou `expo-image-picker` no Expo Go (CONTEXTO §5); veja se o
     seletor devolveu `uri`.
  2. _Upload `200` mas a foto não muda_ → o `GET /educator/me` voltou com a URL antiga (cache do backend/CDN) ou a
     invalidação não rodou.
  3. _`400`_ → falta `photo` no multipart ou tamanho.
- **Evidência:** capturas do perfil e do banner; `PUT` com status (sem copiar a URL).

#### REC-02.5 — Sair com confirmação

- **Prioridade / AC:** P1 · REC-02 (MAN) · AC-REC-02-04
- **Objetivo:** cancelar não desloga; confirmar leva ao Login.
- **Pré-condição:** perfil aberto.
- **Passos:** **"Sair"** → **"Cancelar"**; **"Sair"** → **"Confirmar saída"**.
- **Resultado esperado:**
  - **Tela:** diálogo **"Sair da conta?"** com **"Você precisará entrar novamente para acessar seus dados."**;
    cancelar fecha sem efeito; confirmar leva à tela de **Login**.
  - **Rede (backend real):** **nenhuma chamada** (o logout é local: apaga token e cache).
  - **Depois:** token apagado do armazenamento seguro; `educatorId` e `status` zerados; cache persistido do
    educador apagado.
- **Onde está no código:** `ProfileScreen.tsx` › `leave`, `confirmLogout`, `Modal`;
  `src/stores/auth.ts` › `logout`, `clearSession`; `src/storage/mmkv.ts` › `connectStorageToAuth`,
  `clearAllForEducator`; `src/features/auth/useSessionGuard.ts` (`router.replace(AUTH_DESTINATION)`);
  `src/features/auth/token-storage.ts` › `clearToken`.
- **Testes automatizados que cobrem:** `src/features/profile/__tests__/ProfileLogout.test.tsx` › "waits for
  confirmation and clears query cache"; `src/stores/__tests__/auth.test.ts` › "logout apaga o token via SecureStore e
  limpa o estado" e "logout notifica os assinantes do evento de limpeza com reason logout".
- **Se falhar:**
  1. _Desloga ao tocar em "Cancelar"_ → o diálogo chamou `leave`; veja `setConfirmLogout(false)`.
  2. _Fica no perfil após confirmar_ → o `SessionGuard` não redirecionou (`useSessionGuard`); confira `status`.
  3. _Erro após confirmar_ → `clearToken` falhou (SecureStore); mensagem vermelha com o erro.
- **Evidência:** capturas do diálogo e do Login.

#### REC-02.6 — Voltar e novo login após sair

- **Prioridade / AC:** P1 · AC-REC-02-05
- **Objetivo:** não restar nada da sessão anterior.
- **Pré-condição:** depois do REC-02.5.
- **Passos:** tocar no Voltar do Android; entrar de novo com a conta de teste; abrir Início, Pacientes e Agenda.
- **Resultado esperado:**
  - **Tela:** o Voltar **não** reabre a área logada; ao entrar, as telas mostram "Carregando…" e recarregam **do
    servidor** (nada do cache anterior).
  - **Rede (backend real):** `POST /educator/sign-in`, `GET /educator/me`, e todas as consultas refeitas
    (`GET /student/`, `GET /appointment/`…).
  - **Depois:** o cache persistido recomeça do zero.
- **Onde está no código:** `useSessionGuard.ts` (`replace`); `ProfileScreen.tsx` › `ProfileScreen` (`client.clear()`
  quando `loggedOut`); `mmkv.ts` › `clearAllForEducator`; `AppProviders.tsx` (`connectStorageToAuth`).
- **Testes automatizados que cobrem:** `ProfileLogout.test.tsx` › "waits for confirmation and clears query cache";
  `src/stores/__tests__/session-flow.test.ts` › "clearSessionFlow e clearAllForEducator (logout) removem
  session:flow".
- **Se falhar:**
  1. _Voltar reabre telas logadas_ → `router.replace` não foi usado ou a pilha não foi limpa.
  2. _Telas mostram dado antigo ao entrar_ → `clearAllForEducator` não rodou (educador ativo desconhecido:
     `getActiveEducatorId()` nulo) ou `client.clear()` não foi chamado.
  3. _Mostra dado de outra conta_ → falha grave de isolamento (`activateEducator`, chave de armazenamento por
     educador); marque **P1**.
- **Evidência:** capturas do Login após o Voltar e da Início após entrar.

#### REC-02.7 — Dados de educadores no tráfego (ponte para o BE-06)

- **Prioridade / AC:** P1 · Backend (§4.6)
- **Objetivo:** o app não mostra, não registra nem persiste `_password` (D3) nem `educators` (D1).
- **Pré-condição:** ferramenta de rede ou log do app em desenvolvimento.
- **Passos:** executar o BE-06 do plano (salvar o perfil e abrir Pacientes).
- **Resultado esperado:**
  - **Tela:** nenhuma tela mostra `_password` nem `educators`.
  - **Rede (backend real):** registrar **só se o campo está presente** na resposta do `PUT /educator/update-educator`
    e de `GET /student/`, sem copiar valores.
  - **Depois:** depois do salvar, a tela usa um novo `GET /educator/me`.
- **Onde está no código:** `educator-update.ts` (`updateEducator` descarta o corpo); `student.ts`,
  `student-create.ts`, `student-update.ts` (removem `educators`).
- **Testes automatizados que cobrem:** `educator-update.test.ts` › "discards the prefixed response including
  _password and reads /me"; `src/api/__tests__/backend-contract.test.ts` › "remove educators da lista antes do
  cache".
- **Se falhar:** _campo presente no cache/log do app_ → **FALHA P1**; localize a função que devolveu a resposta crua.
- **Evidência:** lista dos campos presentes (sim/não), sem valores.

## 5. SES-05 — Sessão ligada ao caderno

**Fluxo:** `/session/student` (`StudentStep`: "Nova sessão" › "Escolha o paciente") → "Continuar" → `/session/content`
(`ContentStep`: "Nome da sessão", "Buscar caderno", lista de **cadernos**, "Iniciar sessão") → `/session/player`
(`SessionPlayerScreen`, "Próxima"/"Encerrar sessão") → `/session/finish`. **Atenção:** `ContentStep` lista só cadernos
(`useContentCatalog("notebook")`); grupo e atividade avulsa **não** são ofertados pelo fluxo de sessão no app.

#### SES-05.1 — Retomar a sessão do caderno

- **Prioridade / AC:** P1 · SES-05 (MAN) · AC-SES-05-01, AC-SES-05-02
- **Objetivo:** reabrir o app e retomar abre o **mesmo caderno**, sem pedir o conteúdo de novo.
- **Pré-condição:** Paciente A; um caderno com 2 ou 3 atividades.
- **Passos:**
  1. Iniciar uma sessão: "Nova sessão" → Paciente A → "Continuar" → nome da sessão → o caderno → **"Iniciar
     sessão"**.
  2. Responder uma atividade e **sair sem encerrar** (feche o app pelos apps recentes).
  3. Reabrir o app no Expo Go.
  4. No aviso **"Sessão em andamento"** tocar em **"Retomar"**.
- **Resultado esperado:**
  - **Tela:** o aviso mostra "“{nome da sessão}” · {paciente} ainda não foi encerrada." com **"Retomar"** e
    **"Encerrar agora"**; "Retomar" abre o player **na primeira atividade sem resposta**, do **mesmo caderno**.
  - **Rede (backend real):** na criação: `POST /task-notebook-session/start` com `{ studentId, name, taskNotebookId }`
    (e `appointmentId` se veio de atendimento); a resposta traz `taskNotebookId`; respostas: `POST
/task-notebook-session/answer`; ao retomar o player busca as atividades (`GET /task-notebook/`, `GET /task/:id`).
  - **Depois:** o fluxo local (`session:flow`) é reidratado pelo educador logado.
- **Onde está no código:** `ContentStep.tsx` › `handleStart` (`...(selected.kind === "notebook" ? { taskNotebookId:
selected.id } : {})`); `ResumeSessionPrompt.tsx` (reidratação SES-03); `SessionPlayerScreen.tsx` ›
  `findActivityIndex`; `sessionTasks.ts` › `resolveSessionTasks`; store `session-flow.ts` › `hydrate`;
  `startSession`/`answerSession` em `src/api/endpoints/session.ts`; mock `session-analysis.ts`.
- **Testes automatizados que cobrem:** `src/features/sessions/__tests__/ContentStep.test.tsx` › "AC-SES-01-01: inicia
  sessão, confirma no store e abre o player"; `src/features/sessions/resume/__tests__/ResumeSessionPrompt.test.tsx` ›
  "Retomar volta ao player, que continua na primeira tarefa sem resposta"; `src/features/sessions/player/__tests__/
SessionPlayerScreen.test.tsx` › "AC-SES-05-02: retomada semeada pula as tarefas já respondidas";
  `src/mocks/__tests__/session-notebook.integration.test.ts` › "guarda taskNotebookId e appointmentId e os devolve nas
  listagens". Rodar: `pnpm exec vitest run src/features/sessions --maxWorkers=1`.
- **Se falhar:**
  1. _Abre outro caderno ou nenhum_ → `sessionTasks.ts` › `resolveSessionTasks` (usa `content.id` da store); confira o
     `content` salvo em `session:flow` e `GET /task-notebook/`.
  2. _Pede o conteúdo de novo_ → o fluxo local foi apagado (logout) — veja o SES-05.2.
  3. _Repete uma atividade já respondida_ → `confirmedAnswers`/`activityIndex` não persistiram (`session-flow.ts`
     `persist`); ou o backend respondeu `TASK_ALREADY_ANSWERED` (a tela trata como "Resposta registrada").
  4. _`start` sem `taskNotebookId`_ → o conteúdo escolhido não era do tipo caderno (não deveria ocorrer na UI).
- **Evidência:** capturas do aviso e do player retomado; corpo do `start` (campos).

#### SES-05.2 — Retomar pelo servidor (sem o fluxo local)

- **Prioridade / AC:** P2 · SES-05 (MAN) · AC-SES-05-02
- **Objetivo:** com a sessão aberta no servidor e **sem** fluxo local (outro aparelho ou outro login), "Retomar" usa o
  `taskNotebookId` da sessão.
- **Pré-condição:** dois aparelhos/emuladores com a mesma conta **ou** (um só emulador) uma sessão aberta e o login
  refeito: com a sessão do SES-05.1 aberta, saia pelo **Perfil → Sair** (o logout apaga o fluxo local) e entre de novo.
  Sem nenhuma das duas opções: **N/A** (registre o motivo).
- **Passos:**
  1. No aparelho 2 (ou após o novo login): "Nova sessão" → escolher o **mesmo** paciente.
  2. Observar o painel **"Sessão em andamento"** e tocar em **"Retomar"**.
- **Resultado esperado:**
  - **Tela:** painel **"Sessão em andamento"** com "“{nome}” ainda não foi encerrada.", **"Retomar"** e **"Encerrar
    agora"** (o botão "Continuar" fica desabilitado); "Retomar" abre o player do **caderno da sessão**, já pulando as
    atividades respondidas no servidor. Caderno removido: **"O caderno desta sessão não está mais disponível."**; falha
    de rede: **"Não foi possível retomar a sessão agora."**.
  - **Rede (backend real):** `GET /task-notebook-session/student/:studentId` (a sessão aberta traz `taskNotebookId`,
    `appointmentId` e `answers`); `GET /task-notebook/` para achar o caderno; depois as consultas do player.
  - **Depois:** o fluxo local é semeado em `running` com as respostas confirmadas.
- **Onde está no código:** `StudentStep.tsx` › `resume`, `canResumeFromServer`, `chooseStudent`; `session-flow.ts` ›
  `seedFromServerSession`; `listSessionsByStudent`; `listTaskNotebooks`.
- **Testes automatizados que cobrem:** `src/features/sessions/__tests__/StudentStep.test.tsx` › "sem fluxo local,
  Retomar semeia o fluxo com o caderno e abre o player", "caderno que não existe mais não retoma e avisa" e "sessão
  aberta em outro aparelho não oferece Retomar, só encerrar no servidor"; `src/stores/__tests__/session-flow.test.ts` ›
  "seedFromServerSession semeia o fluxo em running com caderno e respostas" e "seedFromServerSession é recusado em
  etapa que não seja ociosa ou de seleção".
- **Se falhar:**
  1. _Só "Encerrar agora" e o texto "Esta sessão foi iniciada em outro aparelho e não pode ser retomada aqui…"_ →
     a sessão veio **sem `taskNotebookId`** (sessão antiga, anterior à G-06, ou iniciada sem caderno); confira a
     resposta de `GET /task-notebook-session/student/:id`.
  2. _"O caderno desta sessão não está mais disponível."_ → o caderno não está em `GET /task-notebook/` (excluído).
  3. _Retoma mas começa do zero_ → `session.answers` vazio no servidor (as respostas não foram gravadas).
- **Evidência:** capturas do painel e do player; trecho da resposta (apenas os nomes `taskNotebookId` e
  `appointmentId`, sem ids reais).

#### SES-05.3 — Grupo ou atividade avulsa (sem caderno)

- **Prioridade / AC:** P2 · AC-SES-05-01
- **Objetivo:** só caderno envia `taskNotebookId`; grupo e atividade avulsa iniciam sem vínculo.
- **Pré-condição:** —
- **Passos:** tentar iniciar uma sessão com um **grupo** ou uma **atividade** avulsa pelo fluxo "Nova sessão".
- **Resultado esperado:**
  - **Tela:** a etapa de conteúdo oferece **somente cadernos** ("Escolha o caderno"); portanto o caso **não é
    executável** pela interface atual: registre **N/A (sem caminho na UI)**.
  - **Rede (backend real):** se a interface passar a oferecer grupo/atividade: `POST /task-notebook-session/start`
    **sem** `taskNotebookId`.
  - **Depois:** —
- **Onde está no código:** `ContentStep.tsx` (`useContentCatalog("notebook")`, condição `selected.kind ===
"notebook"`); `useContentCatalog.ts` (suporta `"group"` e `"task"`, não usados pela tela); `sessionTasks.ts`
  (ramos `group` e `task`).
- **Testes automatizados que cobrem:** `ContentStep.test.tsx` › "AC-SES-05-01: grupo ou atividade avulsa iniciam sem
  taskNotebookId" (semeia o conteúdo pela store); `sessionTasks.test.ts` › "resolve grupo e tarefa individual pelas
  APIs existentes".
- **Se falhar:** _se algum caminho oferecer grupo e o `start` levar `taskNotebookId`_ → `ContentStep.handleStart`.
- **Evidência:** captura da etapa "Escolha o caderno".
- **Divergência encontrada:** a ficha SES-05 (item 1) e o PLANO-TESTES falam em grupo e atividade avulsa como
  conteúdo de sessão; no código só a **lista de cadernos** é oferecida (`ContentStep`); a regra "sem vínculo" fica
  coberta só por teste automatizado.

#### SES-05.4 — Resposta fora do caderno (`TASK_NOT_IN_NOTEBOOK`)

- **Prioridade / AC:** P3 · AC-SES-05-03
- **Objetivo:** mensagem neutra, sem travar o player.
- **Pré-condição:** só se houver como provocar (ex.: caderno alterado durante a sessão); senão **N/A**.
- **Passos:** responder uma atividade que não pertence ao caderno da sessão.
- **Resultado esperado:**
  - **Tela:** **"Esta atividade não faz parte do caderno da sessão."** em vermelho; o player continua e permite
    seguir; a resposta **não** fica pendente nem trava a sequência.
  - **Rede (backend real):** `POST /task-notebook-session/answer` → **`400`** com `{ message: "TASK_NOT_IN_NOTEBOOK" }`.
  - **Depois:** —
- **Onde está no código:** `SessionPlayerScreen.tsx` › `submitAnswer` (ramo `apiError.code === "TASK_NOT_IN_NOTEBOOK"`);
  mock: `src/mocks/handlers/session-analysis.ts`.
- **Testes automatizados que cobrem:** `SessionPlayerScreen.test.tsx` › "AC-SES-05-03: TASK_NOT_IN_NOTEBOOK mostra
  mensagem neutra e deixa seguir"; `session-notebook.integration.test.ts` › "answer devolve TASK_NOT_IN_NOTEBOOK para
  tarefa fora do caderno".
- **Se falhar:** _marca como pendente e pede "Tentar reenviar"_ → o ramo não foi alcançado (o código do erro vem de
  `normalizeApiError`, que usa o `message` do corpo como `code`).
- **Evidência:** captura da mensagem e do `400`.

## 6. ATV-02, FEC-03 e FEC-04 — Conteúdo

#### ATV-02.1 — Detalhe da atividade no visual novo

- **Prioridade / AC:** P1 · AC-ATV-02-01, AC-ATV-02-03
- **Objetivo:** cabeçalho do design system com voltar, sem "Abrir menu"; selos em português; mídia funcional.
- **Pré-condição:** uma atividade com mídia (imagem ou áudio) e outra sem.
- **Passos:** Banco de atividades (aba **Atividades**) → tocar numa atividade; rolar; repetir com a que tem mídia;
  comparar com o Figma Make (conector `get_design_context`, `fileKey=L7sCNfMhrzOzhtlNpS3cHr`).
- **Resultado esperado:**
  - **Tela:** cabeçalho **"Atividade"** com botão **voltar** e **sem** "Abrir menu"; título **"Atividade de {Categoria}"**
    e dois selos (categoria e tipo, em português: ex.: "Leitura", "Múltipla escolha"); seções **"Enunciado"**,
    **"Alternativas"** (a correta com ícone de check e selo **"Correta"**) e **"Material de apoio"**: sem mídia
    **"Sem material de apoio"**; com mídia **"Áudio da atividade"** (reprodutor) e/ou **"Imagem da atividade"** (a
    imagem). Carregando "Carregando atividade"; id inexistente **"Não encontrado"** com "Voltar"; erro "Não foi
    possível carregar a atividade." com "Tentar novamente".
  - **Rede (backend real):** `GET /task/:id` (`200`; id inexistente responde **`500 TASK_NOT_FOUND`**, não 404).
  - **Depois:** —
- **Onde está no código:** `app/content/task/[id].tsx`; `TaskDetailScreen.tsx` › `TaskDetailScreen`
  (`getCategoryLabel`, `getTypeLabel` de `src/features/reports/session/sessionReport.ts`, `taskQueryKeys`, `isNotFound`
  = `code === "TASK_NOT_FOUND"`); `AudioPlayer`; DS `AppHeader`, `Badge`, `InfoCard`, `SectionTitle`, `DsButton`;
  `getTaskById` em `src/api/endpoints/content.ts`.
- **Testes automatizados que cobrem:** `src/features/content-detail/task/__tests__/TaskDetailScreen.test.tsx` ›
  "ATV-02: usa o cabeçalho novo com voltar e sem abrir menu", "mostra título, enunciado, alternativas e sem material de
  apoio (D-02)", "mostra os nomes dos arquivos de material de apoio quando existem" e "mostra 'Não encontrado' para id
  inexistente e volta (D-08)". Rodar:
  `pnpm exec vitest run src/features/content-detail/task --maxWorkers=1`.
- **Se falhar:**
  1. _Cabeçalho com "Abrir menu"_ → o componente antigo `@/components/AppHeader` voltou; a tela deve usar
     `@/components/ds`.
  2. _Mídia não carrega (imagem/áudio)_ → URL do `S3` inacessível ou `expo-audio` no Expo Go (CONTEXTO §7); abra a URL
     e veja o `GET /task/:id`.
  3. _Selo em inglês (ex.: `reading`)_ → `getCategoryLabel`/`getTypeLabel` sem mapeamento para o valor.
  4. _`TaskDetailScreen.test.tsx` com timeout só na suíte completa_ → instabilidade conhecida (CONTEXTO §4); rode
     isolado.
- **Evidência:** capturas das duas atividades e do Make lado a lado.
- **Divergência encontrada:** a ficha fala em "categoria e tipo em selos" e o plano em "cabeçalho com voltar"; o
  cabeçalho mostra só "Atividade" (sem subtítulo) e o título "Atividade de {Categoria}" repete a categoria do selo.

#### ATV-02.2 — Jogar, editar e excluir

- **Prioridade / AC:** P1 · ATV-02 (MAN) · AC-ATV-02-02
- **Objetivo:** as ações do detalhe levam aos destinos certos.
- **Pré-condição:** ATV-02.1; uma atividade de teste descartável para o "Excluir".
- **Passos:**
  1. **"Jogar"** → responder → voltar.
  2. **"Editar Atividade"** → mudar o enunciado → **"Salvar atividade"**.
  3. **"Excluir Atividade"** → **"Cancelar"**; de novo → **"Excluir"**.
- **Resultado esperado:**
  - **Tela:** "Jogar" (só em tipo jogável) abre `/activities/{id}` (motor; ao acertar, "Muito bem!"); "Editar Atividade"
    abre "Editar atividade" preenchida e, ao salvar, volta ao **detalhe** (`router.replace`); "Excluir Atividade" abre
    **"Excluir Atividade?"** com "Cancelar"/"Excluir"; excluir volta à lista e a atividade some; erro: **"Não foi
    possível excluir a atividade."**.
  - **Rede (backend real):** editar: `PUT /task/update` com **só** os campos alterados (`{ id, prompt }`; com mídia
    nova: `imageFile`/`audioFile` como **URL** e `type: "multipleChoiceWithMedia"`, depois de `POST
/task/upload-media`); excluir: `DELETE /task/delete/:id` (`200`, corpo `null`).
  - **Depois:** lista de atividades (`["task"]`) atualizada; detalhe removido do cache.
- **Onde está no código:** `TaskDetailScreen.tsx` › `goToPlay`, `goToEdit`, `deleteMutation`;
  `src/features/content-create/task/NewTaskScreen.tsx` › `mutation` (compara com `initialTask`);
  `src/features/activities/engine/registry.ts` › `isActivityTypePlayable`; `updateTask`, `deleteTask`; mocks
  `task-update.ts`, `task-delete.ts`. (A rota por rota está em `05-fec01-rotas-v1.md`, FEC-01.6 e FEC-01.7.)
- **Testes automatizados que cobrem:** `TaskDetailScreen.test.tsx` › "ATV-02: o botão Jogar abre o player da
  atividade", "editar abre a rota de edição da atividade", "excluir pede confirmação, chama o endpoint e volta
  (D-05/AC-03)" e "mostra erro de exclusão sem reenvio automático (AC-03/G-08)"; `NewTaskScreen.test.tsx` › "envia
  somente os campos alterados pelo PUT /task/update".
- **Se falhar:**
  1. _"Jogar" não aparece_ → tipo não jogável (`isActivityTypePlayable`); esperado para alguns tipos.
  2. _`500 TASK_NOT_FOUND` ao editar/excluir_ → contrato (PROJECT.md: "não encontrado" volta como 500); o app mostra o
     erro genérico.
  3. _Exclusão não some da lista_ → invalidação de `["task"]` (`taskQueryKeys.list`).
- **Evidência:** capturas das três ações; `PUT`/`DELETE` com status.

#### FEC-03.1 — Grupo de outro educador no caderno

- **Prioridade / AC:** P2 · FEC-03 (MAN) · AC-FEC-03-01, AC-FEC-03-03 (reinterpretados pela FEC-04)
- **Objetivo:** com a FEC-04, o grupo alheio num caderno **abre** em leitura; "Grupo indisponível" só para grupo sem
  acesso ou inexistente.
- **Pré-condição:** caderno que contenha um grupo de **outro educador** (se houver; senão **N/A**).
- **Passos:** abrir o caderno → tocar no grupo.
- **Resultado esperado:**
  - **Tela:** o grupo abre com a linha **"Grupo de outro educador"** e **sem** "Editar Grupo"/"Excluir Grupo". Para um
    id sem acesso (`403`) ou inexistente (`404`): **"Grupo indisponível"**, **"Este grupo não pertence à sua conta ou
    foi excluído."** e **"Voltar"** (não "Não encontrado").
  - **Rede (backend real):** `GET /task-group/:id` → `200` (grupo próprio ou presente em caderno do educador); `403
UNAUTHORIZED` fora disso; `404 TASK_GROUP_NOT_FOUND` inexistente.
  - **Depois:** —
- **Onde está no código:** `GroupDetailScreen.tsx` › `GroupDetailScreen` (`isNotFound`, `otherEducator`, `ownGroup`);
  `useGroupDetailData.ts` (`isNotFound` = `status` 403 ou 404); `getTaskGroupById`; mock `content.ts` (`group-shared`,
  `group-private`).
- **Testes automatizados que cobrem:** `src/features/content-detail/group/__tests__/GroupDetailScreen.test.tsx` ›
  "abre grupo de outro educador apenas para leitura (AC-FEC-04-01)" e "mostra grupo indisponível para id fora da lista
  e volta (AC-FEC-03-01)"; `GroupDetailScreen.integration.test.tsx`; `src/api/endpoints/__tests__/
content-group-by-id.integration.test.ts` › "distingue 403 de 404".
- **Se falhar:**
  1. _"Grupo indisponível" para grupo que deveria abrir_ → o backend respondeu `403` (o grupo não está em caderno do
     usuário); veja o status do `GET /task-group/:id`.
  2. _Grupo alheio mostra "Editar Grupo"_ → `ownGroup` (compara `educatorId` do grupo com o id do educador;
     `authEducatorId` fica nulo ao reabrir o app e a tela consulta `GET /educator/me`); confira os dois ids.
- **Evidência:** capturas do grupo alheio e (se possível) do estado indisponível.

#### FEC-04.1 — Grupo próprio abre pelo `GET /task-group/:id`

- **Prioridade / AC:** P1 · FEC-04 (MAN) · AC-FEC-04-01
- **Objetivo:** o detalhe do grupo usa a rota nova e o item do caderno sempre navega.
- **Pré-condição:** caderno com grupo próprio.
- **Passos:** abrir o caderno → tocar no grupo.
- **Resultado esperado:**
  - **Tela:** detalhe do grupo: nome, selo da categoria, seção **"Atividades do grupo"** (cada atividade com
    "N alternativas"; item ausente: "Atividade indisponível"; grupo sem atividades: "Sem atividades"); **não há** selo
    "Indisponível" no item do caderno.
  - **Rede (backend real):** `GET /task-group/:id` (`200`) e `GET /task/` (lista de atividades para resolver os itens).
  - **Depois:** —
- **Onde está no código:** `NotebookDetailScreen.tsx` (`InfoCard` de grupo, `router.push('/content/group/{id}')`);
  `useGroupDetailData.ts` (chaves `["task-group", groupId]` e `["task"]`); `getTaskGroupById` e `listTasks`.
- **Testes automatizados que cobrem:** `NotebookDetailScreen.test.tsx` › "toca num grupo e navega para o detalhe do
  grupo", "abre grupo de outro educador presente no caderno (AC-FEC-04-01)" e "falha na antiga lista de grupos não
  impede o caderno (FEC-04)"; `GroupDetailScreen.test.tsx` › "mostra nome, categoria e atividades do grupo".
- **Se falhar:**
  1. _Tela "Não foi possível carregar o grupo."_ → o `GET /task-group/:id` falhou com status diferente de 403/404;
     "Tentar de novo" refaz as duas consultas.
  2. _`404` em rota que deveria existir_ → o ambiente do backend ainda não tem `GET /task-group/:id` (rota nova,
     BACKEND-ENTREGUE §6).
- **Evidência:** captura do detalhe; `GET /task-group/:id` com status.

#### FEC-04.2 — Ações do grupo próprio e erro de rede

- **Prioridade / AC:** P2 · FEC-04 (MAN) · AC-FEC-04-02
- **Objetivo:** grupo próprio mostra editar e excluir; o erro de rede permite tentar de novo.
- **Pré-condição:** grupo próprio.
- **Passos:** abrir o grupo; conferir os botões; com o modo avião ligado, abrir outro grupo.
- **Resultado esperado:**
  - **Tela:** **"Excluir Grupo"** e **"Editar Grupo"**; o excluir abre **"Excluir {nome do grupo}?"** com
    "Cancelar"/"Excluir"; erro de rede: **"Não foi possível carregar o grupo."** com **"Tentar de novo"**.
  - **Rede (backend real):** `GET /task-group/:id`; excluir: `DELETE /task-group/delete/:id` (ver FEC-01.5).
  - **Depois:** —
- **Onde está no código:** `GroupDetailScreen.tsx` (`ownGroup`, `Modal`, `refetch`).
- **Testes automatizados que cobrem:** `GroupDetailScreen.test.tsx` › "mostra erro recuperável com nova tentativa",
  "abre o formulário preenchido ao tocar em Editar Grupo" e "exclui com confirmação e volta (D-05, AC-03)".
- **Se falhar:** _botões ausentes no grupo próprio_ → `ownGroup` falso (id do educador não resolvido); confira
  `useAuthStore().educatorId` e `GET /educator/me`.
- **Evidência:** captura.

## 7. NAV-03 e FEC-02 — Limpeza e mocks

#### NAV-03.1 — Atalhos da Início abrem as telas novas

- **Prioridade / AC:** P1 · NAV-03 (MAN)
- **Objetivo:** "Novo paciente" e "Ver ficha" levam às telas novas (`/patients/...`), não às da Entrega 1.
- **Pré-condição:** Início com atendimento de hoje.
- **Passos:** Início → **"Novo paciente"** (acesso rápido); voltar; no cartão do próximo atendimento, **"Ver ficha"**.
- **Resultado esperado:**
  - **Tela:** "Novo paciente" abre o formulário **"Novo paciente"** (subtítulo "Informações iniciais"); "Ver ficha" abre
    a ficha **com abas** ("Visão geral", "Planos") do paciente do atendimento.
  - **Rede (backend real):** a ficha usa `GET /student/`, `GET /appointment/`, análises e sessões do paciente.
  - **Depois:** —
- **Onde está no código:** `HomeScreen.tsx` (`router.push("/patients/new")`, `router.push(`/patients/${nextPatient.id}`)`);
  rotas `app/patients/new.tsx` e `app/patients/[id].tsx`. As rotas antigas `app/(tabs)/students.tsx`,
  `app/(tabs)/appointments.tsx`, `app/students/*` **não existem mais** (e `HIDDEN_TAB_TITLES` em
  `app/(tabs)/_layout.tsx` tem só `activities` e `reports`).
- **Testes automatizados que cobrem:** `src/features/home/__tests__/HomeScreen.test.tsx` › "mostra o próximo
  atendimento, agenda ordenada e os atalhos"; `src/features/patients/list/__tests__/PatientsListScreen.test.tsx` ›
  "navega para ficha e cadastro".
- **Se falhar:** _abre tela antiga/rota inexistente_ → `rg "/students" app src` deve voltar vazio fora de
  `features/students/useStudents`; o `.expo/types` desatualizado causa erro de rota no typecheck (CONTEXTO §7).
- **Evidência:** capturas das duas telas.

#### NAV-03.2 — Pacientes: cadastro e ficha

- **Prioridade / AC:** P1 · NAV-03 (MAN)
- **Objetivo:** a lista abre formulário e ficha novos; o Voltar do Android percorre as telas.
- **Pré-condição:** Pacientes com ao menos um paciente.
- **Passos:** aba Pacientes → o botão flutuante **"Cadastrar paciente"** (ícone `+`); voltar; tocar num paciente;
  Voltar do Android repetidamente.
- **Resultado esperado:**
  - **Tela:** formulário "Novo paciente" e ficha com abas; o Voltar sai de cada tela sem cair em rota quebrada nem
    em tela da Entrega 1.
  - **Rede (backend real):** `GET /student/` (lista).
  - **Depois:** —
- **Onde está no código:** `PatientsListScreen.tsx` (`Fab` com `accessibilityLabel="Cadastrar paciente"`,
  `navigate(router, "/patients/new")`, `navigate(router, "/patients/${item.id}")`); DS `Fab`.
- **Testes automatizados que cobrem:** `PatientsListScreen.test.tsx` › "navega para ficha e cadastro".
- **Se falhar:** _rota quebrada_ → `app/patients/*`; _lista vazia_ → "Nenhum paciente encontrado" e erro "Não foi
  possível carregar os pacientes".
- **Evidência:** captura.
- **Divergência encontrada:** o PLANO-TESTES diz "tocar em 'Novo paciente'" na lista; no código é um **botão
  flutuante** com o rótulo "Cadastrar paciente" (sem texto "Novo paciente"); o título do formulário é "Novo
  paciente".

#### FEC-02.1 — Mocks desligados com `EXPO_PUBLIC_USE_MOCKS=false`

- **Prioridade / AC:** P1 · AC-FEC-02-01
- **Objetivo:** o app usa o backend real: o login fictício é recusado.
- **Pré-condição:** `.env` com `EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app` e
  `EXPO_PUBLIC_USE_MOCKS=false`; Metro reiniciado com `pnpm start --clear` (o Expo só lê o `.env` ao subir).
- **Passos:** tentar entrar com o **login fictício dos mocks** (e-mail e senha do README, **sem** copiá-los para o
  relatório); depois com a conta de teste.
- **Resultado esperado:**
  - **Tela:** o login fictício é **recusado** (credenciais inválidas); a conta de teste entra e mostra **dados
    reais** (não os da fixture: não aparece "Lia Monteiro", "Caio Mendes", etc.).
  - **Rede (backend real):** `POST /educator/sign-in` → `401 INVALID_CREDENTIALS` para o fictício; `200 { token }` para a
    conta de teste; depois `GET /educator/me`.
  - **Depois:** —
- **Onde está no código:** `src/config/env.ts` › `getUseMocks`, `getRuntimeUseMocks`; `app.config.ts`
  (`extra.useMocks = process.env.EXPO_PUBLIC_USE_MOCKS ?? ""`); `src/mocks/install.ts` › `installApiMocks`
  (só troca o adaptador se `getRuntimeUseMocks()` for `true`); `src/api/client.ts`.
- **Testes automatizados que cobrem:** `src/config/__tests__/env.test.ts` › `getUseMocks` ("defaults to false in %s when
  unset or empty", "honors an explicit true/false value outside production", "rejects an explicit true in
  production"); `src/mocks/__tests__/install.test.ts`.
- **Se falhar:**
  1. _O login fictício entra_ → a variável não foi lida: o Metro não foi reiniciado com `--clear` ou o `.env` está
     errado; confira o valor em `Constants.expoConfig.extra.useMocks`.
  2. _App não abre_ → `EXPO_PUBLIC_USE_MOCKS` com valor diferente de `true`/`false` lança erro no boot.
  3. _Login real falha com `401`_ → conta de teste inexistente no backend; não é do app.
- **Evidência:** captura da recusa do login fictício e da Início com dados reais.

#### FEC-02.2 — Sem a variável

- **Prioridade / AC:** P2 · AC-FEC-02-01, AC-FEC-02-02
- **Objetivo:** ausente ou vazia = sem mocks, mesmo em `development`.
- **Pré-condição:** `.env` **sem** `EXPO_PUBLIC_USE_MOCKS` (só num `.env` de teste; restaure depois).
- **Passos:** `pnpm start --clear` → abrir → repetir o login fictício.
- **Resultado esperado:**
  - **Tela:** mesmo resultado do FEC-02.1: o login fictício é recusado.
  - **Rede (backend real):** as chamadas saem para a URL do `.env` (`https://labirinto-do-saber.vercel.app`, ou o
    backend local `http://10.0.2.2:3000` do `.env.example`).
  - **Depois:** **restaure o `.env`** ao final.
- **Onde está no código:** `getUseMocks` (variável ausente, vazia ou só espaços → `false`); `.env.example`
  (modo mock é opção explícita).
- **Testes automatizados que cobrem:** `env.test.ts` › "defaults to false in %s when unset or empty".
- **Se falhar:** _mocks ativos sem a variável_ → um `.env` ou variável de ambiente do terminal ainda define
  `EXPO_PUBLIC_USE_MOCKS`; confira `env`/`printenv` e reinicie com `--clear`.
- **Evidência:** captura do login recusado.

## 8. Casos adicionados (IDs novos)

#### REC-02.8+ — Sessão expirada não apaga o fluxo de sessão

- **Prioridade / AC:** P3 · fumaça (G-04)
- **Objetivo:** documentar a diferença entre **logout** e **sessão expirada**: só o logout apaga o fluxo de sessão local.
- **Pré-condição:** sessão aberta (SES-05.1); token inválido (só se houver como expirar o token; senão **N/A**).
- **Passos:** provocar um `401` em qualquer tela; entrar de novo.
- **Resultado esperado:**
  - **Tela:** volta ao Login; ao entrar, o aviso "Sessão em andamento" ainda pode oferecer "Retomar" (o `session:flow` é
    preservado); no logout (REC-02.5) ele **não** é oferecido.
  - **Rede (backend real):** o `401` da chamada que expirou.
  - **Depois:** o cache de consultas persistido foi limpo (`clearQueryCache`).
- **Onde está no código:** `src/stores/auth.ts` › `expireSession`; `mmkv.ts` › `connectStorageToAuth` (`sessionExpired` →
  `clearQueryCache`); `src/api/client.ts` (interceptor de 401).
- **Testes automatizados que cobrem:** `session-flow.test.ts` › "clearQueryCache (sessionExpired) preserva session:flow";
  `auth.test.ts` › "expireSession notifica os assinantes do evento de limpeza com reason sessionExpired".
- **Se falhar:** _o fluxo some na expiração_ → `clearQueryCache` apaga chaves além do prefixo de consultas
  (`QUERY_KEY_PREFIX` em `mmkv.ts`).
- **Evidência:** captura do aviso após o novo login.
