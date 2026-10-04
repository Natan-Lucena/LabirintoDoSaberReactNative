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
