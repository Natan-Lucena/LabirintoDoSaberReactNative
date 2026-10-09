# LabirintoDoSaberReactNative

## Como rodar

Pré-requisitos: Node 22.13+, pnpm 11, e o app **Expo Go** instalado no celular
(Android) ou um emulador/simulador.

```bash
pnpm install --frozen-lockfile
pnpm start
```

Escaneie o QR Code exibido com o Expo Go (Android: pelo app; iOS: pela câmera).
`pnpm run android` / `pnpm run ios` abrem o Metro já direcionado para cada
plataforma (`expo start --android` / `--ios`), mas ainda pelo Expo Go — não é
preciso development build nem Android Studio/Xcode para isso (G-41/EXPO-01).

Outros comandos:

```bash
pnpm run test       # vitest run
pnpm run typecheck  # tsc --noEmit
pnpm run lint       # eslint .
```

Um development build (EAS, T-108) continua disponível, mas é **opcional**: só é
necessário para recursos nativos fora do Expo Go do SDK 57. A lista de
dependências auditadas contra o Expo Go está em
[`docs/bootstrap/COMPATIBILIDADE.md`](docs/bootstrap/COMPATIBILIDADE.md).

## Backend e mocks

Por padrão, em desenvolvimento, o app usa dados **mockados** (`EXPO_PUBLIC_USE_MOCKS`
ausente = `true`; veja `src/mocks/README.md`; login fictício `educadora.mock@labirinto.test` /
`senha123`). Para usar o backend real, crie um `.env` (não versionado):

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
EXPO_PUBLIC_USE_MOCKS=false
```

e reinicie com `pnpm start --clear`. O Expo só lê o `.env` ao subir.

## Documentação

- [`docs/entrega-2/ENTREGA-V1.md`](docs/entrega-2/ENTREGA-V1.md): o que foi feito na V1, PRs e
  como integrar.
- [`docs/entrega-2/TRACKING.md`](docs/entrega-2/TRACKING.md): estado de cada tarefa.
- [`docs/entrega-2/QA-05-RELATORIO.md`](docs/entrega-2/QA-05-RELATORIO.md): teste contra o
  backend real.
- [`docs/CONTEXTO-SESSAO.md`](docs/CONTEXTO-SESSAO.md): contexto e lições para retomar o trabalho.
