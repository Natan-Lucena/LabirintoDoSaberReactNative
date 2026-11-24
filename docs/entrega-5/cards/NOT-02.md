# NOT-02 — Push das notificações e preferências

| Campo             | Valor                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloco / onda      | E — Push, ajuda e navegação · E5-9 (paralela à AJD-01; só o `package.json`/lock é compartilhado, ver §8)                                                       |
| Classe / modelo   | B · Codex (ou Sonnet), esforço médio-alto; revisão A do ciclo de vida do token                                                                                 |
| Estimativa        | G · 7–9 h de worker + um development build novo                                                                                                                |
| Dependências      | **BLD-01 concluída** (APK e credenciais FCM); API-07 (push: `NotificationPreferences`, `getNotificationPreferences`); backend leva 4 (§7, PU-01 a PU-07); G-67 |
| Estado do backend | **Mock-first**; o envio do push é do backend (job diário)                                                                                                      |
| História          | US2-14                                                                                                                                                         |

## 1. Objetivo e valor

Desde a Entrega 4 as notificações aparecem só no sino (G-59). Com o development build, o
backend manda **um push por dia**, agrupado e **sem nome de paciente** (PU-03, PU-04). O app
pede a permissão com uma explicação antes, registra o token, abre o destino ao tocar, deixa a
pessoa escolher o que recebe e apaga o token ao sair.

## 2. Referência de design

Sem desenho (G-18). A explicação antes do pedido do sistema é um `Modal` no padrão do app; as
preferências usam `Switch` do `src/components/ds` em linhas com título e descrição.

## 3. Fluxo do usuário

1. **Depois do login**, na primeira abertura das abas, **só no development build** e só se a
   permissão ainda não foi pedida pelo app para este educador: `Modal` "Receber lembretes no
   celular?" com o texto "Avisamos uma vez por dia sobre atendimentos e pendências. O aviso não
   mostra nomes de pacientes." e os botões "Agora não" / "Ativar".
2. "Ativar" → cria o canal Android "Lembretes" → `requestPermissionsAsync()`:
   - concedida → `getExpoPushTokenAsync({ projectId })` → `POST /notification/push-token {
token, platform: "android" }`;
   - negada → nada é enviado; `Toast` "Você pode ativar depois em Perfil → Notificações".
     "Agora não" → nada é pedido; o app não pergunta de novo sozinho.
3. Com o app aberto, um push recebido aparece como banner e atualiza o contador do sino
   (invalida `notificationQueryKeys.unreadCount()`).
4. **Tocar no push** (app aberto, em segundo plano ou fechado):
   - `data.target` presente → marca como lidas as `data.notificationIds` e abre o destino com a
     mesma regra da lista (`AGENDA_DAY` → Agenda; `SESSION` → evolução; `PLAN` → plano;
     `SCALE_APPLICATION` → aplicação ou resultado);
   - sem `target` → abre `/notifications`.
5. **Perfil → "Notificações"** (`/profile/notifications`):
   - `Switch` "Receber notificações no celular" (`pushEnabled`);
   - um `Switch` por tipo: "Atendimentos de hoje", "Evoluções pendentes", "Revisões de plano",
     "Escalas em rascunho" (desabilitados com `pushEnabled` desligado);
   - situação da permissão do aparelho: "Permitidas", "Bloqueadas no Android" (com "Abrir
     configurações", `Linking.openSettings()`) ou "Não pedidas" (com "Ativar", que refaz o
     passo 2);
   - no Expo Go: aviso "O push só funciona no app instalado (development build). No Expo Go, as
     notificações aparecem só no sino." As preferências continuam editáveis (ficam no servidor).
6. **Sair** (Perfil → "Sair" → "Confirmar saída"): `DELETE /notification/push-token { token }`
   **antes** de limpar a sessão; falha ou demora (> 5 s) não impede a saída.

## 4. Estados da tela

| Situação                             | O que aparece                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Expo Go                              | Sem `Modal`, sem pedido de permissão, sem chamada a `push-token`; a lista do sino continua                                  |
| Emulador sem Google Play / sem token | Registro falha em silêncio (log genérico, sem dados); preferências mostram "Não foi possível ativar o push neste aparelho." |
| `400 INVALID_PUSH_TOKEN`             | O app não tenta de novo nesta abertura                                                                                      |
| Preferências carregando / erro       | "Carregando" / "Não foi possível carregar as preferências." + "Tentar de novo"                                              |
| Salvar preferência falhou            | O `Switch` volta ao valor anterior e `Toast` "Não foi possível salvar. Tente de novo."                                      |
| Offline                              | Preferências do cache, `Switch` desabilitados com "Sem conexão"                                                             |
| Sucesso                              | `Switch` muda na hora (otimista) e o servidor confirma                                                                      |

## 5. Contrato de dados

| Rota                              | Corpo                             | Resposta                      | Erros                    |
| --------------------------------- | --------------------------------- | ----------------------------- | ------------------------ |
| `POST /notification/push-token`   | `token`, `platform`               | `200 PushToken`               | `400 INVALID_PUSH_TOKEN` |
| `DELETE /notification/push-token` | `token` (corpo)                   | `204`                         | `400`                    |
| `GET /notification/preferences`   | —                                 | `200 NotificationPreferences` | —                        |
| `PUT /notification/preferences`   | parcial: `pushEnabled?`, `kinds?` | `200 NotificationPreferences` | `400`                    |

- **Funções:** `getNotificationPreferences` (API-07); `registerPushToken`,
  `unregisterPushToken`, `updateNotificationPreferences` (esta tarefa) em
  `src/api/endpoints/push.ts`. O `DELETE` com corpo usa `apiClient.delete(url, { data: { token
} })`.
- **Chaves:** `pushQueryKeys.preferences() = ["notifications", "preferences"]` (sob o prefixo das
  notificações). O `PUT` faz `setQueryData` com a resposta; erro restaura o valor anterior.
- **Push recebido:** `data = { notificationIds: string[], target?: AppNotification["target"] }`
  (PU-04). O texto vem pronto do servidor; o app não monta texto de push.
- **Armazenamento local** (`getStorage(educatorId)` de `src/storage/mmkv.ts`, já cifrado):
  `push.prompted` (o `Modal` já apareceu) e `push.token` (o último token registrado, para o
  logout). Nenhum dado de paciente.

## 6. Regras de negócio e casos de borda

1. **Detectar o Expo Go** com `Constants.executionEnvironment === ExecutionEnvironment.StoreClient`
   (`expo-constants`, já instalado) numa função `isPushSupported()`. No Expo Go, **não importar**
   o `expo-notifications` no topo do módulo: carregar com `require` dentro do caminho suportado,
   para não disparar o aviso do Expo Go sobre push removido.
2. **Canal antes do token** (Android 13+): `setNotificationChannelAsync("lembretes", { name:
"Lembretes", importance: DEFAULT })` antes de pedir a permissão e o token; sem canal, o
   Android não mostra o pedido.
3. `projectId` de `Constants.expoConfig?.extra?.eas?.projectId` (gravado pela BLD-01). Ausente →
   não registra e registra o motivo no log de desenvolvimento.
4. **Token só depois da permissão concedida** (AC-NOT-02-01). Negada: nada é enviado; o app não
   insiste.
5. **Registrar de novo a cada login** e quando o token mudar (`addPushTokenListener`): o backend
   faz upsert (PU-01).
6. **Logout:** `unregisterPushToken(push.token)` com tempo máximo de 5 s e erro ignorado, depois
   `useAuthStore.getState().logout()` (AC-NOT-02-02). A expiração de sessão (`401`) não tem
   token válido para chamar o `DELETE`: o servidor limpa (PU-05) ou reassocia o token no próximo
   login de outra conta (pergunta no §11).
7. **Toque em push com app fechado:** usar `getLastNotificationResponseAsync()` na montagem das
   abas (e `clearLastNotificationResponseAsync()` depois de tratar), além do
   `addNotificationResponseReceivedListener` para app aberto. Se a sessão expirou, o login vem
   primeiro e o destino é descartado.
8. **Navegação do destino** num só lugar: extrair o `switch` de `NotificationsScreen.open` para
   `src/features/notifications/openTarget.ts` (`openNotificationTarget(router, target)`), usado
   pela lista e pelo push, sem mudar o comportamento da lista.
9. `setNotificationHandler` mostra o banner com o app aberto (`shouldShowBanner: true`,
   `shouldShowList: true`, sem som).
10. Preferências desligam só o **push** (PU-06): a lista do sino continua com tudo; o texto da
    tela diz isso.

## 7. Plano de implementação

1. `npx expo install expo-notifications` (pnpm) e o plugin no `app.json` (`"expo-notifications"`
   com `icon` monocromático, se houver asset; `color` da marca; `defaultChannel: "lembretes"`).
2. `src/api/endpoints/push.ts`: escritas + handlers em `src/mocks/handlers/push.ts` + testes pelo
   `apiClient` real.
3. `src/features/notifications/push/`: `support.ts` (`isPushSupported`, `loadNotifications`),
   `registerForPush.ts`, `usePushRegistration.ts` (prompt, registro, listener de token e de
   resposta), `PushPromptDialog.tsx`, `tokenStore.ts`.
4. `src/features/notifications/openTarget.ts` e o uso dele em `NotificationsScreen.tsx`.
5. `app/(tabs)/_layout.tsx`: chamar `usePushRegistration()` dentro do `TabsLayout` (uma linha) e
   renderizar o `PushPromptDialog`.
6. `src/features/notifications/preferences/` + `app/profile/notifications.tsx`.
7. `src/features/profile/ProfileScreen.tsx`: `DsButton` `secondary` "Notificações" e o
   `unregister` no `leave()`.
8. Testes: `vi.mock("expo-notifications")` e `vi.mock("expo-constants")` (como os outros testes
   mockam módulos nativos).
9. Gerar um development build novo (o `expo-notifications` é nativo) com autorização e validar
   com a ferramenta de push da Expo e com o job do backend.

## 8. Arquivos

- **Permitidos:** `package.json`, `pnpm-lock.yaml`, `app.json` (só o plugin),
  `src/api/endpoints/push.ts`, `src/mocks/handlers/push.ts`, `src/mocks/install.ts`,
  `src/mocks/README.md`, `src/features/notifications/**`, `app/profile/notifications.tsx` (novo),
  `app/(tabs)/_layout.tsx` (só o hook e o diálogo), `src/features/profile/ProfileScreen.tsx`
  (item e logout) e os testes.
- **Proibidos:** `src/stores/auth.ts` (o logout continua igual; o `DELETE` acontece antes, no
  perfil), `src/api/types.ts`, `src/api/errors.ts`.
- **Ordem com a AJD-01** (mesma onda): as duas mexem em `package.json` e `pnpm-lock.yaml`. A
  primeira a ser mergeada é dona; a segunda, **depois** desse merge, refaz a branch sobre a
  `origin/main` e roda de novo o `npx expo install` do seu pacote para regenerar o lock (nunca
  editar o lock à mão nem resolver o conflito dele linha a linha).

## 9. Critérios de aceite

| ID           | Critério                                                                                                 | Verificação |
| ------------ | -------------------------------------------------------------------------------------------------------- | ----------- |
| AC-NOT-02-01 | O token só é registrado depois da permissão concedida; negada ou Expo Go, nenhuma chamada a `push-token` | `CT`        |
| AC-NOT-02-02 | O logout chama `DELETE /notification/push-token` antes de limpar a sessão e sai mesmo se ele falhar      | `UT`        |
| AC-NOT-02-03 | `openNotificationTarget` dá o mesmo destino na lista e no push                                           | `UT`        |
| AC-NOT-02-04 | O push chega ao development build Android e o toque abre o destino                                       | `MAN`       |

## 10. Como testar manualmente (Victor)

Precisa do **development build** (APK da BLD-01 atualizado) e do emulador com Google Play ou de um
Android físico.

1. Abra o app instalado e faça login: aparece "Receber lembretes no celular?". Toque em "Ativar" e
   permita.
2. Perfil → Notificações: "Permitidas" e todos os tipos ligados.
3. Peça ao orquestrador para disparar um push de teste (ferramenta de push da Expo ou o job do
   backend). O aviso chega sem nome de paciente; tocar nele abre a tela do destino ou a lista.
4. Desligue "Atendimentos de hoje", feche e abra a tela: continua desligado.
5. Saia da conta: no próximo job, o aparelho não recebe push.
6. No **Expo Go**: faça login; nenhum pedido de permissão aparece e o sino funciona.

## 11. Riscos e perguntas em aberto

- **Mesmo aparelho, outra conta:** se a sessão expirar sem logout e outra pessoa entrar, o
  `POST /notification/push-token` da nova conta deve **mover** o token (upsert pelo token, não
  pelo educador). Pergunta ao backend (PU-01); sem isso, a conta anterior continuaria recebendo.
- **Ícone de notificação** monocromático (96×96, branco): não existe asset. Padrão: usar o ícone
  monocromático do Android que já existe (`android-icon-monochrome.png`) se servir; senão, pedir
  ao usuário.
- **iOS:** fica para a QA-04 com conta Apple.

## 12. Fora do escopo

Notificação local agendada no aparelho; som próprio; push por tipo em horários diferentes;
WhatsApp; push no iOS.
