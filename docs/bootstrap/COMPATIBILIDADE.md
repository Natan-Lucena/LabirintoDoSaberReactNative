# Bootstrap — Compatibilidade da stack (T-101)

> Resultado do spike T-101 ([BACKLOG](../entrega-1/BACKLOG.md#t-101--spike-de-compatibilidade-da-stack)).
> Executado em 2026-09-24 por Claude Code / `claude-opus-5-5`, num projeto descartável
> fora do repositório. As versões abaixo são as **validadas**; a T-102 as usa como estão,
> sem "atualizar para a mais recente". Mudar uma versão exige repetir a checagem
> correspondente e registrar aqui.

## 1. Resumo

| Tema               | Decisão / resultado                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Base               | **Expo SDK 57** (`expo` 57.0.24), React Native 0.86.3, React 19.2.3, Hermes, New Architecture                                                  |
| Expo Go            | **Não usar.** Development build obrigatório (MMKV v4 via Nitro Modules é código nativo)                                                        |
| Gerenciador        | **pnpm 11** em modo isolado (padrão), com `allowBuilds` explícito em `pnpm-workspace.yaml`                                                     |
| TypeScript         | **6.0.3** (fixado pelo template do SDK 57; decisão do usuário em 2026-09-24, G-23)                                                             |
| Testes             | **Vitest 5 + `vitest-native` + React Native Testing Library 14** (decisão do usuário, G-22). Jest foi validado e descartado                    |
| Estilo             | **NativeWind 4.2.7 + Tailwind CSS 3.4.19**; `react-native-css-interop` 0.2.7 como dependência direta                                           |
| Verificado         | `expo-doctor` 21/21, `typecheck`, testes, bundle Android com bytecode Hermes e `prebuild` Android: todos com código 0                          |
| **Não verificado** | Build nativo, execução no emulador e `Intl`/MMKV/SecureStore **em runtime Hermes**: adiados por pedido do usuário; entram em T-108 (AC-108-03) |

## 2. Ambiente observado

Windows 11 Pro; Node 22.22.3; pnpm 11.8.0; Java 17.0.10; Android SDK com build-tools
33–36, platforms 33–36, NDK 25/26/27 e AVDs `Medium_Phone_API_36`, `Pixel_3a_API_34` e
`Pixel_7a_API_30`. Sem `eas-cli` nem Maestro instalados. Windows com
`LongPathsEnabled = 0` (sem suporte a caminhos acima de 260 caracteres).

Requisitos oficiais do SDK 57 ([docs.expo.dev/versions](https://docs.expo.dev/versions/latest/)):
Node 22.13+, Android 7+ (compile/target SDK 36), iOS 16.4+, Xcode 26.4+ (só para build
iOS local; aqui o iOS sai pelo EAS, G-01).

## 3. Versões validadas

"Como" indica a origem da versão: **SDK** = escolhida por `npx expo install` como
compatível com o SDK 57 (fonte: `bundledNativeModules` do pacote `expo`); **latest** =
versão mais recente no npm em 2026-09-24, sem vínculo com o SDK; **fixada** = escolhida
no spike para resolver conflito, com o motivo em §5.

### Runtime — Entrega 1

| Pacote                                                                                                                 | Versão                | Como                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo`                                                                                                                 | ~57.0.24              | template SDK 57                                                                                                                                                                                     |
| `react` / `react-native`                                                                                               | 19.2.3 / 0.86.3       | template                                                                                                                                                                                            |
| `expo-router`                                                                                                          | ~57.0.22              | template                                                                                                                                                                                            |
| `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-constants`, `expo-linking`, `expo-system-ui`, `expo-image` | 57.0.x (template)     | template                                                                                                                                                                                            |
| `react-native-reanimated` / `react-native-worklets`                                                                    | 4.5.1 / 0.10.1        | template                                                                                                                                                                                            |
| `react-native-gesture-handler`                                                                                         | ~2.32.0               | template (a 3.x existe, mas não é a do SDK)                                                                                                                                                         |
| `react-native-safe-area-context` / `react-native-screens`                                                              | ~5.7.0 / ~4.26.0      | template                                                                                                                                                                                            |
| `expo-secure-store`                                                                                                    | ~57.0.4               | SDK                                                                                                                                                                                                 |
| `react-native-mmkv`                                                                                                    | 4.3.2                 | latest                                                                                                                                                                                              |
| `react-native-nitro-modules`                                                                                           | 0.37.1                | latest — **obrigatório** para o MMKV v4 (peer não instalado automaticamente)                                                                                                                        |
| `expo-crypto`                                                                                                          | ~57.0.3               | SDK — G-27 (usuário autorizou em 2026-09-24): gera a chave AES-256 do MMKV (`getRandomBytesAsync`, T-303), sem fonte de bytes aleatórios criptográfica disponível no RN/Hermes sem dependência nova |
| `@shopify/flash-list`                                                                                                  | 2.0.2                 | SDK (a 2.3.2 existe, mas não é a do SDK)                                                                                                                                                            |
| `@expo/vector-icons`                                                                                                   | ~15.1.1               | SDK — G-28 (T-203): ícones de `Icon`/`TabBar`/`AppHeader`/`Avatar`                                                                                                                                  |
| `react-native-calendars`                                                                                               | 1.1314.0              | latest                                                                                                                                                                                              |
| `@react-native-community/netinfo`                                                                                      | 12.0.1                | SDK (G-03)                                                                                                                                                                                          |
| `expo-audio` + `expo-asset`                                                                                            | ~57.0.5 + ~57.0.18    | SDK (G-03); `expo-asset` é peer obrigatório do `expo-audio`                                                                                                                                         |
| `@react-native-community/datetimepicker`                                                                               | 9.1.0                 | SDK (G-03)                                                                                                                                                                                          |
| `@expo-google-fonts/nunito` / `roboto` / `roboto-mono`                                                                 | 0.4.2 / 0.4.3 / 0.4.2 | latest (G-03)                                                                                                                                                                                       |
| `@tanstack/react-query`                                                                                                | 5.103.2               | latest                                                                                                                                                                                              |
| `@tanstack/react-query-persist-client`                                                                                 | 5.103.2               | fixada: mesma linha do `@tanstack/react-query` (G-26, T-304)                                                                                                                                        |
| `@tanstack/query-sync-storage-persister`                                                                               | 5.103.2               | fixada: mesma linha do `@tanstack/react-query` (G-26, T-304)                                                                                                                                        |
| `zustand`                                                                                                              | 5.0.15                | latest                                                                                                                                                                                              |
| `axios`                                                                                                                | 1.20.0                | latest                                                                                                                                                                                              |
| `react-hook-form` + `@hookform/resolvers`                                                                              | 7.88.0 + 5.9.1        | latest                                                                                                                                                                                              |
| `zod`                                                                                                                  | 4.6.5                 | latest (Zod 4; o backend usa Zod — conferir mensagens de erro na T-301)                                                                                                                             |
| `nativewind`                                                                                                           | 4.2.7                 | fixada: última estável; a 5.0 está em release candidate                                                                                                                                             |
| `react-native-css-interop`                                                                                             | 0.2.7                 | fixada: exatamente a dependência do `nativewind` 4.2.7 (§5, A-03)                                                                                                                                   |
| `tailwindcss`                                                                                                          | 3.4.19                | fixada: o NativeWind 4 exige Tailwind `~3`; a 4.x não serve                                                                                                                                         |

### Desenvolvimento

| Pacote                                          | Versão                          | Como                                                                                                                              |
| ----------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `typescript`                                    | ~6.0.3                          | template (G-23)                                                                                                                   |
| `@types/react`                                  | ~19.2.2                         | template                                                                                                                          |
| `vitest` / `vite`                               | 5.0.1 / 8.3.0                   | latest (G-22)                                                                                                                     |
| `vitest-native`                                 | 0.13.0                          | latest; suporta Vitest 4–5, RNTL 12–14, RN 0.81–0.87                                                                              |
| `@testing-library/react-native`                 | 14.0.1                          | latest                                                                                                                            |
| `test-renderer`                                 | ~1.2.0                          | fixada: a 1.3 puxa `react-reconciler` que exige React 19.3                                                                        |
| `@react-native/babel-preset`                    | 0.86.3                          | fixada: igual ao minor do React Native (exigido pelo `vitest-native`)                                                             |
| `@babel/core`                                   | ^7.29.7                         | fixada: o `latest` é 8.x, mas o ecossistema RN continua no Babel 7                                                                |
| `babel-preset-expo`                             | ^57.0.12                        | SDK; obrigatório como dependência direta quando existe `babel.config.js`                                                          |
| `eslint-config-expo`                            | 57.0.2                          | linha do SDK (T-103; não instalado no spike)                                                                                      |
| `eslint` / `prettier` / `husky` / `lint-staged` | 9.39.5 / 3.9.9 / 9.1.7 / 17.5.1 | ESLint 9.39.5 fixado na T-103: `eslint-config-expo@57.0.2` publica peer `eslint >=8.10`; `eslint-plugin-react@7.37.5` publica `^3 |     | ^4  |     | ^5  |     | ^6  |     | ^7  |     | ^8  |     | ^9.7`. Consulta ao registry e `pnpm run lint` com codigo 0 em 2026-09-24 |

### Fora da Entrega 1 (validadas, não instalar agora — G-24)

`expo-image-picker` ~57.0.19, `expo-document-picker` ~57.0.2, `expo-file-system` ~57.0.7,
`expo-print` ~57.0.2, `expo-sharing` ~57.0.21, `expo-notifications` ~57.0.20 (todas
escolhidas pelo SDK; `expo-doctor` 21/21 com elas instaladas). `@sentry/react-native` não
foi testado (T-109 cancelada, G-20).

Remover do template na T-102, por não serem usados: `@expo/ui`, `expo-glass-effect`,
`expo-symbols`, `expo-web-browser`, `expo-device`, e as telas/componentes de exemplo.
`react-native-web` e `react-dom` só ficam se a T-102 usar a fumaça web do AC-102-02.

## 4. Checagens executadas

Todas no projeto descartável `C:\Users\zerog\spike-t101\labirintoDoSaberMobile`
(caminho com o mesmo comprimento do repositório), exceto a primeira linha.

| #   | Comando                                                                                                                              | Código | Resultado                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `pnpm create expo-app@latest labirinto-spike --template default --yes`                                                               | 0      | Projeto SDK 57 em 2 min 10 s                                                                                                                                                                                                  |
| 2   | `npx expo install <runtime da stack>`                                                                                                | 0      | Versões da §3                                                                                                                                                                                                                 |
| 3   | `pnpm peers check`                                                                                                                   | 0      | Sem conflitos, após as fixações da §3                                                                                                                                                                                         |
| 4   | `npx expo-doctor`                                                                                                                    | 0      | 21/21 (antes do `expo-asset`: 20/21, código 1)                                                                                                                                                                                |
| 5   | `pnpm run typecheck` (`tsc --noEmit`)                                                                                                | 0      | Após A-05 e A-06 (antes: código 2)                                                                                                                                                                                            |
| 6   | `pnpm test` (`vitest run`)                                                                                                           | 0      | 2 arquivos, 4 testes, ~5 s: RNTL, `Intl` pt-BR com `America/Sao_Paulo` (Node), MMKV em teste e **tela inteira** com FlashList, calendars, Reanimated, SecureStore simulado e MMKV, com React Native real (plataforma Android) |
| 7   | `npx expo export --platform android`                                                                                                 | 0      | Bundle com bytecode Hermes, 4,7 MB                                                                                                                                                                                            |
| 8   | `npx expo prebuild --platform android --no-install`                                                                                  | 0      | `newArchEnabled=true`, `hermesEnabled=true`                                                                                                                                                                                   |
| 9   | `gradlew assembleRelease -PreactNativeArchitectures=x86_64`                                                                          | 1      | **Falhou** (A-08). Não repetido: o usuário pediu para só compilar quando ele liberar                                                                                                                                          |
| 10  | `npx expo install expo-crypto` (T-303, G-27, no repositório)                                                                         | 0      | `expo-crypto@57.0.3` instalado                                                                                                                                                                                                |
| 11  | `pnpm peers check` (T-303, após `expo-crypto`)                                                                                       | 0      | Sem conflitos                                                                                                                                                                                                                 |
| 12  | `npx expo-doctor` (T-303, após `expo-crypto`)                                                                                        | 0      | 21/21                                                                                                                                                                                                                         |
| 13  | `pnpm install --frozen-lockfile` (T-203, no repositório)                                                                             | 0      | Reinstalação limpa, 43,5 s                                                                                                                                                                                                    |
| 14  | `npx expo install @expo/vector-icons` (T-203, G-28, no repositório)                                                                  | 0      | `@expo/vector-icons@15.1.1` instalado                                                                                                                                                                                         |
| 15  | `pnpm peers check` (T-203, após `@expo/vector-icons`)                                                                                | 0      | Sem conflitos                                                                                                                                                                                                                 |
| 16  | `npx expo-doctor` (T-203, após `@expo/vector-icons`)                                                                                 | 0      | 21/21                                                                                                                                                                                                                         |
| 17  | `pnpm add @tanstack/react-query-persist-client@5.103.2 @tanstack/query-sync-storage-persister@5.103.2` (T-304, G-26, no repositório) | 0      | Instaladas na linha 5.103.2 do `@tanstack/react-query`                                                                                                                                                                        |
| 18  | `pnpm peers check` (T-304, após o persister)                                                                                         | 0      | Sem conflitos                                                                                                                                                                                                                 |
| 19  | `npx expo-doctor` (T-304, após o persister)                                                                                          | 0      | 21/21                                                                                                                                                                                                                         |

Para comparação, o Jest (`jest-expo` 57 + Jest 29) também passou nos mesmos testes
(3/3, código 0), antes da troca pedida pelo usuário.

## 5. Achados e requisitos para as próximas tarefas

| ID   | Achado                                                                                                                                                                                                                                                 | Requisito                                                                                                                                                                                                                         | Tarefa                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| A-01 | pnpm 11 bloqueia scripts de build de dependências e falha com `ERR_PNPM_IGNORED_BUILDS`                                                                                                                                                                | `pnpm-workspace.yaml` com `allowBuilds` explícito. No spike: `'@parcel/watcher': false` e `unrs-resolver: false` (usam binários pré-compilados; os testes passaram assim). Novos pacotes com script exigem decisão registrada     | T-102                                                            |
| A-02 | O MMKV v4 depende de `react-native-nitro-modules`, que não vem junto                                                                                                                                                                                   | Instalar `react-native-nitro-modules` diretamente                                                                                                                                                                                 | T-102                                                            |
| A-03 | NativeWind 4 + pnpm isolado: o bundle falha com `Unable to resolve module react-native-css-interop/jsx-runtime` ([nativewind#1849](https://github.com/nativewind/nativewind/issues/1849), [#701](https://github.com/nativewind/nativewind/issues/701)) | `react-native-css-interop@0.2.7` como dependência direta. Não usar `node-linker=hoisted`                                                                                                                                          | T-102, T-201                                                     |
| A-04 | Com `babel.config.js` próprio (NativeWind), o Gradle não encontra `babel-preset-expo`                                                                                                                                                                  | `babel-preset-expo` como dependência direta de desenvolvimento                                                                                                                                                                    | T-102                                                            |
| A-05 | O TypeScript 6 passou a exigir declaração para `import "*.css"`; ela vem de `expo-env.d.ts`, que o template ignora no git e que só o `expo start` gera                                                                                                 | **Resolvido na T-102:** `app-env.d.ts` versionado com `/// <reference types="expo/types" />`. Versionar o `expo-env.d.ts` não funciona: o `expo start` o reescreve e o recoloca no `.gitignore`. Typecheck validado com e sem ele | T-102                                                            |
| A-06 | O TypeScript 6 não inclui tipos globais de runner automaticamente                                                                                                                                                                                      | Importar `describe/test/expect/vi` de `vitest` explicitamente (validado), ou declarar `types` no tsconfig                                                                                                                         | T-104                                                            |
| A-07 | O limite de 260 caracteres do Windows quebrou o bundle numa pasta de 274 caracteres (`hermesc.exe ENOENT`)                                                                                                                                             | G-25 foi revisto: o repositório permanece no OneDrive, com o risco aceito. Manter caminhos temporários curtos; opcionalmente, o usuário pode ativar `LongPathsEnabled`                                                            | T-108 e instalações futuras                                      |
| A-08 | Build Android falhou em `ExtractAarTransform` do `react-android-0.86.3-release.aar` no cache do Gradle                                                                                                                                                 | Causa não isolada (trava de arquivo ou cache corrompido são hipóteses). Repetir no caminho definitivo; se persistir, limpar só a entrada desse `.aar` no cache do Gradle e registrar                                              | T-108                                                            |
| A-09 | O template do SDK 57 usa `src/app/` para as rotas; o PROJECT e o BACKLOG usam `app/` na raiz                                                                                                                                                           | Manter `app/` na raiz (decisão documentada; o Expo Router aceita as duas). A T-102 move as rotas e mantém o alias `@/` → `src/`                                                                                                   | T-102                                                            |
| A-10 | O template liga `experiments.reactCompiler` e `typedRoutes`                                                                                                                                                                                            | Manter os dois (typedRoutes atende "parâmetros tipados" do PROJECT). O React Compiler é padrão do SDK; se atrapalhar, desligar com registro                                                                                       | T-102                                                            |
| A-11 | `vitest-native` é recente (março de 2026), ainda antes da 1.0 e tem um mantenedor                                                                                                                                                                      | Risco aceito com a escolha do Vitest. Fixar a versão; se o projeto for abandonado, o Jest continua validado (§4) como plano B                                                                                                     | T-104                                                            |
| A-12 | Pacotes com JSX sem compilar (`react-native-calendars` e dependências) quebram no Vitest                                                                                                                                                               | `reactNative({ platform: "android", transform: ["react-native-calendars", "recyclerlistview", "react-native-swipe-gestures"] })`. `setPlatform()` só existe no motor `mock`; no motor nativo a plataforma vai na config           | T-104                                                            |
| A-13 | O MMKV v4 importa os Nitro Modules no carregamento; em teste não há módulo nativo                                                                                                                                                                      | Mock mínimo no setup: `vi.mock("react-native-nitro-modules", () => ({ NitroModules: { createHybridObject: vi.fn() } }))`. O MMKV devolve instância em memória sozinho em ambiente de teste                                        | T-104                                                            |
| A-14 | No RNTL 14, `render` é assíncrono                                                                                                                                                                                                                      | `await render(...)` em todos os testes de componente                                                                                                                                                                              | T-104 e todas as tarefas com `CT`                                |
| A-15 | Plugins do `babel.config.js` (NativeWind) não rodam no Vitest: o JSX passa pelo Oxc do Vite 8                                                                                                                                                          | Testes não verificam estilo por `className`; contraste e tokens são testados pelos valores de `src/theme` (AC-201-02)                                                                                                             | T-104, T-201                                                     |
| A-16 | Maestro roda no Windows (Java 17+); iOS exige macOS/Xcode; a documentação lista APIs Android 29–34 ([docs.maestro.dev](https://docs.maestro.dev/get-started/supported-platform/android))                                                               | E2E no AVD `Pixel_3a_API_34`; instalar o Maestro na T-105                                                                                                                                                                         | T-105                                                            |
| A-18 | pnpm 11 recusa versões publicadas há pouco tempo (`minimumReleaseAge`) e grava exceções em `minimumReleaseAgeExclude` no `pnpm-workspace.yaml`, reescrevendo o arquivo (comentários somem)                                                             | Deixar a lista sob gestão do pnpm e revisar no diff; comentários sobre `allowBuilds` ficam neste documento, não no YAML                                                                                                           | T-102 e toda instalação                                          |
| A-19 | Sem `react-dom`, o `pnpm peers check` falha: o `expo-router` traz componentes web (Radix, vaul) que o exigem                                                                                                                                           | Manter `react-dom` 19.2.3 (sem alvo web; `react-native-web` fica fora)                                                                                                                                                            | T-102                                                            |
| A-17 | `@babel/core` latest é 8.x; `@types/jest`/`jest` latest (30) não servem ao `jest-expo` 57                                                                                                                                                              | Seguir as fixações da §3; não aceitar sugestões "is available" do pnpm sem repetir o spike                                                                                                                                        | Todas                                                            |
| A-20 | `vitest-native` aplica automaticamente um preset próprio para `react-native-mmkv` (não o mock interno da lib): a classe mockada expõe `delete(key)`, não `remove(key)` como o tipo `MMKV` real (só existe em runtime nativo/Nitro)                     | Código de produção usa a API real (`remove`); testes que chamam `remove` precisam de `vi.mock("react-native-mmkv", ...)` local com uma instância própria compatível com a API real, em vez de confiar no preset automático        | T-303, e qualquer tarefa que teste `remove()`/`delete()` do MMKV |

## 6. Respostas aos requisitos da T-101

- **R1 (versões):** §3, com a origem de cada versão; fontes: `bundledNativeModules` do
  `expo` 57.0.24, npm em 2026-09-24, [changelog do SDK 57](https://expo.dev/changelog/sdk-57)
  e [tabela de versões do Expo](https://docs.expo.dev/versions/latest/).
- **R2 (Expo Go × dev build):** dev build. O MMKV v4 depende de Nitro Modules (nativo),
  e o changelog do SDK 57 informa que o Expo Go dessa versão ainda aguardava aprovação nas lojas.
- **R3 (dependências extras, G-03):** lista fechada na §3 (fontes, NetInfo, `expo-audio`
  com `expo-asset`, datetimepicker). **Nenhuma lib de datas** por ora: o `Intl` do Node
  formatou "quinta-feira, 02 de abril de 2026", "23:30" e o dia `2026-04-02` para
  `2026-04-03T02:30Z` em `America/Sao_Paulo`. Falta confirmar no Hermes (R4).
- **R4 (`Intl` no Hermes com `timeZone`):** **pendente de runtime.** A tela de verificação
  do spike (Apêndice A) imprime os mesmos valores no aparelho, mas o build nativo foi
  adiado. Passa a ser o AC-108-03; se falhar, a T-306 usa a lib de datas autorizada em G-03.
- **R5 (comandos reais):** §7.
- **R6 (pnpm):** modo isolado padrão, sem `.npmrc`; `allowBuilds` (A-01); dependências
  diretas A-02, A-03 e A-04.

## 7. Comandos para a T-102

Validados no spike (código 0), a partir de um diretório vazio fora do OneDrive:

```bash
pnpm create expo-app@latest <nome> --template default --yes
cd <nome>
npx expo install expo-secure-store react-native-mmkv react-native-nitro-modules \
  @shopify/flash-list react-native-calendars @react-native-community/netinfo \
  expo-audio expo-asset @react-native-community/datetimepicker \
  @expo-google-fonts/nunito @expo-google-fonts/roboto @expo-google-fonts/roboto-mono
npx expo install nativewind@4.2.7 tailwindcss@3.4.19
pnpm add react-native-css-interop@0.2.7 @tanstack/react-query zustand axios \
  react-hook-form @hookform/resolvers zod
pnpm add -D babel-preset-expo
npx expo-doctor
pnpm run typecheck
npx expo export --platform android
```

A T-104 acrescenta: `pnpm add -D vitest@5.0.1 vitest-native@0.13.0 vite@8.3.0
@react-native/babel-preset@0.86.3 @babel/core@^7.29.7 @testing-library/react-native@14.0.1
test-renderer@~1.2.0`. Depois de cada instalação, rodar `pnpm peers check`.

## 7.1 Aplicação na T-102 (2026-09-24)

O template gerado nesse dia trouxe patches mais novos dentro do SDK 57 (`expo` ~57.0.25,
`expo-router` ~57.0.23, `expo-linking` ~57.0.11, `babel-preset-expo` 57.0.13), dentro da
faixa `~57.0` e aprovados pelo `expo-doctor`. As demais versões são as da §3.

## 8. Limpeza

Os projetos descartáveis foram apagados ao fim do spike. O daemon do Gradle do spike foi
parado; nenhum processo do spike ficou ativo. Processos Java de outros projetos não
foram tocados.

## Apêndice A — Tela de verificação em runtime (para AC-108-03)

Funções usadas na tela de verificação e nos testes (`src/probe.ts` no spike):

```ts
export const SP = "America/Sao_Paulo";
export const SAMPLE = new Date("2026-04-03T02:30:00Z"); // 02/04/2026 23:30 em SP

export function formatLongDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SP,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d); // esperado: "quinta-feira, 02 de abril de 2026"
}
export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SP,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d); // "23:30"
}
export function dayKey(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: SP,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`; // "2026-04-02"
}
```

A tela também verificava: `createMMKV({ id, encryptionKey: <32 bytes>, encryptionType: "AES-256" })`
com `isEncrypted === true` e leitura do valor gravado; `SecureStore.setItemAsync`/`getItemAsync`;
`typeof HermesInternal === "object"`; e `Intl.DateTimeFormat().resolvedOptions().timeZone`.
Cada resultado era impresso como `[SPIKE] chave = valor` (visível no `adb logcat`).
