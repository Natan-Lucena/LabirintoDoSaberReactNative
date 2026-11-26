# Fluxos E2E (Maestro)

Fluxos da QA-02 da Entrega 5. **Ainda não foram executados**: foram escritos a partir do código
e dos PRs, sem instalar o Maestro nem abrir o emulador. Detalhes, lacunas e `testID` que faltam
em [`docs/entrega-5/testes/07-maestro.md`](../docs/entrega-5/testes/07-maestro.md).

## Instalar (fora do projeto; nada vai ao `package.json`)

1. Java 17 ou superior (`java -version`).
2. Maestro CLI, conforme `docs.maestro.dev`. No Windows, baixe o `.zip` da última versão, extraia
   fora do repositório e ponha a pasta `bin` no `PATH` (ou use o WSL). Confirme com
   `maestro --version`.
3. Emulador `Pixel_3a_API_34` ligado (`adb devices`) com o Expo Go (`host.exp.exponent`).

Só com a autorização do usuário no momento (AGENTS §7), com a máquina livre.

## Rodar

```bash
pnpm start --clear   # Metro em outra janela; mocks conforme o fluxo (ver o cabeçalho de cada YAML)
maestro test -e EMAIL=<conta> -e SENHA=<senha> .maestro/01-login-atividades-jogo.yaml
maestro test -e EMAIL=<conta> -e SENHA=<senha> .maestro            # todos os fluxos
maestro test --format=junit --output=<arquivo fora do repo> -e EMAIL=... -e SENHA=... .maestro
maestro record -e EMAIL=... -e SENHA=... .maestro/02-agenda-mensal.yaml
```

Credenciais e dados só por `-e`, nunca nos YAML. Relatórios e gravações ficam fora do repositório.
No Expo Go, o primeiro bundle pode demorar e o aviso amarelo (LogBox) cobre botões: o subfluxo
`subflows/abrir-app.yaml` já trata os dois.
