# BLD-01 — Development build Android

| Campo             | Valor                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Bloco / onda      | E — Push, ajuda e navegação · **E5-0**                                                                                               |
| Classe / modelo   | A (Opus) para a configuração e a revisão; C (Haiku) para rodar comandos; **o usuário** faz login e credenciais                       |
| Estimativa        | M · 3–4 h de worker + ~30 min do usuário + 15–30 min de fila do EAS por build                                                        |
| Dependências      | G-67 confirmado; **autorização do usuário no momento** (build nativo, AGENTS §7); conta Expo do usuário; projeto Firebase para o FCM |
| Estado do backend | Não depende                                                                                                                          |
| História          | US2-14 (push), QA-04 (aparelho)                                                                                                      |

## 1. Objetivo e valor

O push remoto não chega ao Expo Go no Android desde o SDK 53 (documentação do
`expo-notifications`, SDK 57). Para a NOT-02 e para o Android físico da QA-04, o app precisa de
um **development build**: um APK do próprio app com o `expo-dev-client`, gerado na nuvem pelo
EAS. O dia a dia continua no Expo Go (G-41).

## 2. Referência

Documentação do Expo consultada em 2026-11-24 (a página "latest" já é do SDK 58; o projeto está
no 57, e as versões saem de `npx expo install`):

- [Create a development build](https://docs.expo.dev/develop/development-builds/create-a-build/):
  `npx expo install expo-dev-client`; `eas build --platform android --profile development`;
  instalar o APK no emulador ou no aparelho; com o `expo-dev-client` instalado, o `npx expo start`
  passa a abrir o development build.
- [eas.json](https://docs.expo.dev/build/eas-json/): perfil com `developmentClient: true`,
  `distribution: "internal"` e `android.buildType: "apk"` (o APK roda no emulador e no aparelho).
- [Push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/):
  credenciais **FCM V1** no projeto do EAS; o Expo push token precisa do `projectId` do EAS; o
  emulador Android **com Google Play** recebe push.
- [Histórico do T-108](../../bootstrap/COMPATIBILIDADE.md): o build local no Windows falhou várias
  vezes (caminhos longos, CMake) e levou 5–6 min quando funcionou. Por isso, build **na nuvem**.

## 3. Fluxo (quem faz o quê)

| #   | Passo                                                                                                                                                             | Quem                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | Autorizar a BLD-01 e informar a conta Expo (só o nome da conta, nunca senha)                                                                                      | Usuário                         |
| 2   | `npm install --global eas-cli` (fora do projeto) e `eas login` **no terminal do usuário**                                                                         | Usuário                         |
| 3   | Branch a partir de `origin/main`; `npx expo install expo-dev-client` (pnpm, atualiza `package.json` e lock)                                                       | Worker                          |
| 4   | `eas init` (cria o projeto no EAS e grava `extra.eas.projectId` e `owner` no `app.json`)                                                                          | Worker, com o login do passo 2  |
| 5   | Criar `eas.json` (perfil `development`, abaixo) e ajustar o script `start`                                                                                        | Worker                          |
| 6   | Criar o projeto Firebase, baixar o `google-services.json` e gerar a chave da conta de serviço FCM V1                                                              | Usuário                         |
| 7   | Subir as credenciais: `eas credentials` → Android → FCM V1 (chave da conta de serviço); o `google-services.json` como variável de ambiente do EAS do tipo arquivo | Usuário                         |
| 8   | `eas build --profile development --platform android` (nuvem)                                                                                                      | Worker, com autorização         |
| 9   | Instalar o APK no emulador `Pixel_3a_API_34` (imagem **com Google Play**) e abrir com `npx expo start`                                                            | Worker/usuário, com autorização |
| 10  | Registrar versões, comandos e resultado no `COMPATIBILIDADE.md` e uma seção curta no `README.md`                                                                  | Worker                          |

`eas.json` proposto:

```json
{
  "cli": { "appVersionSource": "local" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```

O development build carrega o JavaScript do Metro do computador: o backend continua vindo do
`.env` local (`EXPO_PUBLIC_API_BASE_URL`), como no Expo Go. O `eas.json` não precisa de `env`.

## 4. Estados e verificações

| Situação                                              | O que fazer                                                                                                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-doctor` reclama de versão                       | Usar a versão que o `npx expo install` escolheu; não forçar                                                                                                                         |
| `pnpm start` abre o development build e não o Expo Go | Script `start` passa a `expo start --go` (o Expo Go continua o padrão); `start:dev` = `expo start --dev-client`. Conferir as duas flags com `npx expo start --help` antes de gravar |
| Build falha no EAS                                    | Ler o log do EAS; não tentar build local sem autorização nova                                                                                                                       |
| Emulador sem Google Play                              | O app abre, mas o push da NOT-02 não chega; registrar e usar um AVD com Play Store                                                                                                  |
| CI                                                    | Sem `eas` no CI; typecheck, lint, testes e `npx expo export --platform android` continuam                                                                                           |

## 5. Contrato de dados

Nenhuma rota. Configuração:

- `app.json`: `extra.eas.projectId` e `owner` (do `eas init`); `android.googleServicesFile`
  apontando para o arquivo da variável de ambiente (ver §6, item 3). O plugin do
  `expo-notifications` entra na NOT-02, não aqui.
- **Nenhum segredo no repositório:** a chave FCM V1 fica só no EAS; o `google-services.json` não é
  commitado (`.gitignore`).

## 6. Regras e casos de borda

1. **Login e credenciais são do usuário.** O worker não digita senha, não cria conta e não sobe
   chave; se o terminal pedir, para e pergunta.
2. O Expo Go continua sendo o caminho do dia a dia e da rodada de testes (G-41): depois desta
   tarefa, `pnpm start` + QR continua funcionando igual.
3. **`google-services.json` fora do Git:** o `app.json` é estático e não lê variável de ambiente.
   Proposta: criar `app.config.ts` mínimo que repassa o `app.json` e define
   `android.googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"`
   (o EAS preenche a variável do tipo arquivo no build). Se o usuário preferir commitar o arquivo
   (ele não é segredo para o Firebase, mas tem chaves de API), registrar a decisão e pular o
   `app.config.ts`.
4. O pacote Android continua `com.labirintodosaber.app` (decisão do T-108).
5. iOS fica fora (precisa de conta Apple paga; QA-04).
6. O APK de desenvolvimento não vai para loja nem para pessoas fora do time.

## 7. Plano de implementação

1. Passos 3 a 5 do §3 numa branch `chore/bld-01-dev-build`.
2. `app.config.ts` (se aprovado o §6, item 3) e `.gitignore` com `google-services.json`.
3. `package.json`: scripts `start` (`expo start --go`) e `start:dev` (`expo start --dev-client`).
4. Verificação padrão + `npx expo-doctor` + `npx expo export --platform android`.
5. PR com o código; build e instalação (passos 8 e 9) **só** com a autorização do momento; a
   evidência (link do build no EAS, sem token) vai no PR e no TRACKING.

## 8. Arquivos

- **Permitidos:** `package.json`, `pnpm-lock.yaml`, `app.json`, `app.config.ts` (novo, se
  aprovado), `eas.json` (novo), `.gitignore`, `docs/bootstrap/COMPATIBILIDADE.md`, `README.md`
  (seção curta).
- **Proibidos:** `src/**`, `app/**` (nenhum código de app nesta tarefa), `android/` e `ios/`
  (sem prebuild commitado: o EAS gera na nuvem).

## 9. Critérios de aceite

| ID           | Critério                                                                        | Verificação |
| ------------ | ------------------------------------------------------------------------------- | ----------- |
| AC-BLD-01-01 | `npx expo-doctor` e o CI continuam verdes com o `expo-dev-client` instalado     | `CMD`       |
| AC-BLD-01-02 | `pnpm start` continua abrindo no Expo Go (QR)                                   | `MAN`       |
| AC-BLD-01-03 | O APK do development build abre o app no emulador Android contra o backend real | `MAN`       |
| AC-BLD-01-04 | Nenhuma credencial (chave FCM, `google-services.json`, token do EAS) no diff    | `REV`       |

## 10. Como testar manualmente (Victor)

1. Com o APK instalado no emulador (ou no seu Android), abra o app "Labirinto do Saber" (não o Expo
   Go). Ele pede o servidor de desenvolvimento: rode `pnpm run start:dev` no computador e escolha
   o servidor listado.
2. Faça login com a conta de teste: a Início abre normalmente.
3. Feche e rode `pnpm start`: o QR continua abrindo no Expo Go.

## 11. Riscos e perguntas em aberto

- **Conta Expo e Firebase:** quem cria? Padrão: o usuário, com a conta dele; o projeto Firebase
  fica com o mesmo dono.
- **Cota do EAS gratuito** (fila e número de builds por mês): um build por mudança nativa
  (BLD-01, NOT-02 e AJD-01 se mudar plugin). Planejar os builds juntos quando possível.
- **Flags `--go` / `--dev-client`:** conferir com `npx expo start --help` no SDK 57 antes de
  gravar o script.

## 12. Fora do escopo

Build de produção, loja, iOS, OTA updates (`expo-updates`), CI com EAS.
