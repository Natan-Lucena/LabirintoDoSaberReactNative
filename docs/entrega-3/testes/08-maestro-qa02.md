# Testes manuais — E2E com Maestro (QA-02)

Roteiro da tarefa [QA-02](../BACKLOG.md#qa-02--e2e-com-maestro): fluxos E2E com o **Maestro** rodando no
**Expo Go** do emulador Android, contra o backend real. Cada fluxo traz o roteiro passo a passo com o
**seletor** de cada passo tirado do código, a asserção esperada, os dados de teste e, se falhar, a tela/o
componente relacionado, além do esqueleto YAML de referência.

> **Estado:** documento escrito **sem instalar o Maestro, abrir o emulador, o Metro ou o app**. Os YAML abaixo
> são **referência**: **não** existe pasta `.maestro/` e nada deste documento altera o código. Textos,
> rótulos e rotas foram conferidos no código em 2026-10-29; nada foi executado.

## 1. Escopo, regras e pré-requisitos

- **Fluxos (ficha QA-02):** login; Agenda → novo atendimento; ficha → editar paciente; gerar plano → salvar → detalhe;
  perfil → sair. AC-QA-02-01: os fluxos passam no emulador, com a evidência da execução (`E2E`).
- **Regras do projeto:**
  - O Maestro é instalado **fora do projeto** (CLI), **só com a autorização do usuário no momento**; **nada** entra no
    `package.json` nem no lockfile (BACKLOG QA-02; AGENTS §7).
  - **Build nativo e emulador só com autorização do usuário**, com a máquina liberada (só o Android Studio aberto).
  - Backend **real**, mocks desligados (`.env` com `EXPO_PUBLIC_USE_MOCKS=false`), como na rodada do
    [PLANO-TESTES](../PLANO-TESTES.md) §1.1. **Nenhuma credencial, token ou e-mail no repositório, nos YAML nem nas
    capturas:** os YAML recebem os dados por variável de ambiente (`-e EMAIL=… -e SENHA=…`).
  - Dados **fictícios** (PLANO-TESTES §1.2): "Paciente Teste Um", um caderno e a conta de teste do time.
- **Pré-requisitos:**
  1. **Maestro** (CLI) instalado fora do projeto e **Java** exigido por ele; confirme a versão e o método de instalação
     para Windows em `docs.maestro.dev` no momento (no Windows costuma ser o `.zip` da última versão adicionado ao
     `PATH`, ou WSL). Verifique com `maestro --version` (esperado: versão impressa, código 0).
  2. **Emulador** Android (AVD `Pixel_3a_API_34`, [CONTEXTO §5](../../CONTEXTO-SESSAO.md)) ligado e visível em `adb devices`.
  3. **Expo Go** instalado no emulador (id do pacote **`host.exp.exponent`**).
  4. **Metro** em execução: `pnpm start --clear` (Expo Go). Abra o projeto **por URL** `exp://10.0.2.2:8081` (no
     emulador, `10.0.2.2` é o computador); o passo `openLink` dos YAML faz isso. Confirme a porta que o Metro imprimiu.
  5. **Dados da conta de teste:** Paciente A ("Paciente Teste Um") **sem PDI ativo** e com ao menos uma dificuldade
     cadastrada (para a geração), e nenhum atendimento do Paciente A no horário que o fluxo cria.
- **Como rodar (referência):** `maestro test -e EMAIL=… -e SENHA=… -e PACIENTE="Paciente Teste Um" <fluxo>.yaml`;
  relatório com `--format=junit --output=<arquivo fora do repositório>`. **Evidência:** a saída do comando (código 0),
  o relatório e a gravação (`maestro record <fluxo>.yaml`), guardados **fora do repositório**.
- **Cenários de mock úteis** (para ensaiar os YAML **sem backend**, `EXPO_PUBLIC_USE_MOCKS=true`, login
  `educadora.mock@labirinto.test` / `senha123`, [src/mocks/README.md](../../../src/mocks/README.md)): o mock responde
  na hora (a geração de plano não espera a IA) e tem `student-1` (Lia Monteiro) com PDI ativo (`409`); para o fluxo de plano com mock,
  escolha um paciente **sem** PDI ativo (`student-2`, Caio Mendes, ou `student-3`, Nina Azevedo). Mock **não** comprova a QA-02: a
  evidência final é no backend real.
- **Particularidades do Expo Go** (CONTEXTO §5 e §7): o primeiro uso mostra a tela "Development servers" e, na primeira
  abertura de um projeto, um aviso de boas-vindas; o **aviso amarelo (LogBox)** cobre a barra inferior e botões
  (dispense com `tapOn: "Dismiss"` quando aparecer); o Metro nem sempre vê edições — `pnpm start --clear` ao mudar o `.env`;
  `pnpm install --frozen-lockfile` depois de trocar de branch.
- **Testes automatizados que a QA-02 complementa:** o Vitest cobre cada tela isoladamente (ver os arquivos citados em
  cada fluxo); o Maestro prova a **navegação real**, o teclado, os seletores nativos e o backend.

## 2. Como o Maestro enxerga o app (seletores)

- `tapOn: "texto"` e `assertVisible: "texto"` casam o **texto visível** e também o **`accessibilityLabel`** (que no Android vira o
  `content-desc`). Aceitam **regex** (`".*Paciente Teste Um.*"`). `id:` casa o **`testID`** (resource-id no Android).
- **Quase todo o app é localizável por texto ou rótulo**: `DsButton` usa `accessibilityLabel ?? label`; `Field` usa
  `accessibilityLabel ?? label`; as abas e os botões têm rótulo. O ponto fraco são os campos de texto, em que o
  **rótulo visível e o `TextInput` têm o mesmo nome** ("Email", "Foco do planejamento"): o `tapOn` pode acertar o
  `Text` do rótulo (que não abre o teclado). Se acontecer, use `index: 1` (o segundo elemento) ou, melhor, um `testID`.
- **Hoje há poucos `testID`** (nenhum nas telas da Entrega 3): `Screen` (`screen-content`), `Avatar` (`avatar-image`),
  `FigmaIcon`/`Icon` (`figma-icon-<nome>`, `icon-<nome>`), `Timeline` (`timeline-marker-<id>`), `StepIndicator`,
  `MiniBars`. Os componentes do design system (`DsButton`, `Field`, `SelectField`, `DateField`, `TimeField`, `IconButton`,
  `StaticPressable`, `InfoCard`) **não repassam `testID`** hoje.
- **O seletor nativo de hora/data** (`@react-native-community/datetimepicker` em `DateField`/`TimeField`) é do **Android**,
  não do app: o Maestro o enxerga como UI do sistema (botões "OK"/"Cancel", `android:id/button1`, modo de texto
  `android:id/toggle_mode` com `android:id/input_hour` e `android:id/input_minute`). **Verifique os ids no emulador**
  (`maestro studio` ou `adb shell uiautomator dump`).
- **Textos transitórios** (toast "Atendimento agendado", "Plano salvo", "Paciente salvo com sucesso") duram poucos segundos e
  a tela pode navegar em ~0,7 s (`router.back`/`router.replace`): use `extendedWaitUntil` e, quando o toast já sumiu,
  assevere o **efeito** (o item na lista), não o toast.

### 2.1 `testID` que faltam e nomes propostos (sem alterar o código)

Sugestão para uma tarefa futura (arquivo do componente → como aceitar `testID`). **Não implementar nesta tarefa.**

| Elemento                                   | Onde está                                                                      | Nome proposto                                                                     | Por quê                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Campo "Email"                              | `src/features/auth/LoginForm.tsx` › `Field`                                    | `login-email`                                                                     | rótulo e campo têm o mesmo nome                       |
| Campo "Senha"                              | `LoginForm.tsx` › `Field`                                                      | `login-password`                                                                  | idem                                                  |
| Botão "Entrar agora"                       | `LoginForm.tsx` › `DsButton`                                                   | `login-submit`                                                                    | o texto "Entrar" também é o título da tela            |
| Item "Agenda" / "Pacientes" / "Recursos"   | `src/components/ds/BottomNav.tsx`                                              | `tab-agenda`, `tab-patients`, `tab-resources`                                     | "Agenda" é também o título da tela                    |
| Botão "Novo atendimento"                   | `src/features/agenda/AgendaScreen.tsx` › `DsButton`                            | `agenda-new-appointment`                                                          | desambigua do título "Novo atendimento" do formulário |
| Atendimento da lista                       | `AgendaScreen.tsx` › `StaticPressable`                                         | `agenda-appointment-<id>`                                                         | o rótulo tem hora e duração (mudam)                   |
| Campos do formulário de atendimento        | `AppointmentFormScreen.tsx` › `SelectField`, `DateField`, `TimeField`, `Field` | `appointment-patient`, `appointment-date`, `appointment-time`, `appointment-type` | o seletor nativo exige toques precisos                |
| Envio do atendimento                       | `AppointmentFormScreen.tsx` › `DsButton`                                       | `appointment-submit`                                                              | —                                                     |
| Cartão de paciente                         | `src/features/patients/list/PatientsListScreen.tsx` › `PatientCard`            | `patient-card-<id>`                                                               | o rótulo é "Abrir ficha de {nome}"                    |
| "Editar" da ficha                          | `src/features/patients/detail/PatientDetailScreen.tsx` › `SectionTitle`        | `patient-edit`                                                                    | "Editar" aparece em várias telas                      |
| Campo "Nome completo" e envio              | `src/features/patients/form/PatientFormScreen.tsx`                             | `patient-form-name`, `patient-form-submit`                                        | —                                                     |
| Aba "Planos" e "Criar novo plano"          | `PatientDetailScreen.tsx` › `Tabs`; `plans/PatientPlans.tsx`                   | `patient-tab-plans`, `patient-create-plan`                                        | a aba e o botão têm nomes parecidos                   |
| Foco, geração e salvar do plano            | `src/features/plans/generate/GeneratePlanScreen.tsx`, `DraftPreview.tsx`       | `plan-focus`, `plan-generate`, `plan-save`                                        | o texto de "Salvar PDI" muda para "Salvar PE"         |
| Banner "Perfil", "Sair", "Confirmar saída" | `src/features/resources/ResourcesScreen.tsx`; `ProfileScreen.tsx`              | `resources-profile`, `profile-logout`, `profile-logout-confirm`                   | "Sair" é curto e comum                                |

Implementação sugerida: aceitar a prop `testID` nos componentes do design system e repassá-la ao `Pressable`/`TextInput`
(`DsButton.tsx`, `Field.tsx`, `SelectField.tsx`, `DateField.tsx`, `TimeField.tsx`, `StaticPressable.tsx`, `BottomNav.tsx`).
**Divergência encontrada:** a ficha QA-02 não prevê `testID`; sem eles os fluxos dependem de texto e rótulo, que mudam com a copy.

### 2.2 Subfluxo comum (abrir o app e entrar) — `_abrir-app.yaml` e `_login.yaml`

```yaml
# _abrir-app.yaml (referência)
appId: host.exp.exponent
---
- launchApp:
    appId: host.exp.exponent
    clearState: false
- openLink: exp://10.0.2.2:8081 # Metro no computador (porta impressa pelo `pnpm start`)
- runFlow:
    when:
      visible: "Continue" # aviso de boas-vindas do Expo Go, só na primeira abertura
    commands:
      - tapOn: "Continue"
- extendedWaitUntil:
    visible: "Acesse sua conta para continuar" # tela de Login (src/features/auth/LoginForm.tsx / app/(auth)/login.tsx)
    timeout: 120000 # o primeiro bundle pode demorar
```

```yaml
# _login.yaml (referência) — dados por variável: -e EMAIL=... -e SENHA=...
appId: host.exp.exponent
---
- tapOn: "Email" # LoginForm › Field (accessibilityLabel "Email"); se acertar o rótulo, usar index: 1
- inputText: ${EMAIL}
- tapOn: "Senha"
- inputText: ${SENHA}
- hideKeyboard
- tapOn: "Entrar agora" # LoginForm › DsButton
- extendedWaitUntil:
    visible: "Olá, .*" # AppHeader da Início: `Olá, {primeiro nome}` (src/features/home/HomeScreen.tsx)
    timeout: 60000 # partida a frio do backend (BE-08)
```

## 3. Fluxos

Cada fluxo tem: ID, prioridade, objetivo, pré-condição, **roteiro passo a passo** (seletor atual · asserção · se falhar), o esqueleto
YAML e os testes automatizados relacionados. O texto dos botões é o do código.

### M-LOGIN — Login (e recusa de credenciais)

- **Prioridade / AC:** P1 · AC-QA-02-01 (fluxo 1)
- **Objetivo:** abrir o app, entrar com a conta de teste e chegar à Início; e conferir que a senha errada é recusada.
- **Pré-condição:** Metro no ar, `.env` com `EXPO_PUBLIC_USE_MOCKS=false`, conta de teste (variáveis `EMAIL` e `SENHA`).
- **Roteiro:**

| #   | Passo                      | Seletor (texto exato ou rótulo)                                                                             | Asserção esperada                                                          | Se falhar (tela / componente)                                                                                                                                                     |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Abrir o projeto no Expo Go | `openLink: exp://10.0.2.2:8081`                                                                             | `assertVisible: "Acesse sua conta para continuar"` e o título **"Entrar"** | Metro fora do ar ou porta errada; Expo Go na tela "Development servers" (tocar na URL); `BootGate` preso (`src/app-shell/BootGate.tsx`)                                           |
| 2   | Senha errada (negativo)    | `tapOn: "Email"` → `inputText: ${EMAIL}`; `tapOn: "Senha"` → `inputText: "errada"`; `tapOn: "Entrar agora"` | `assertVisible: "E-mail ou senha incorretos. Tente novamente."`            | `src/features/auth/useSignIn.ts` (`INVALID_CREDENTIALS_MESSAGE`, só em `401` do `POST /educator/sign-in`); mock ligado: o login fictício **entra** — `.env` não foi lido (FEC-02) |
| 3   | Entrar com a senha certa   | subfluxo `_login.yaml`                                                                                      | `assertVisible: "Olá, .*"` e a aba **"Início"**                            | Backend frio (BE-08): aumentar o `timeout`; "Não foi possível conectar. Verifique sua internet e tente novamente." = timeout de 10 s (`src/api/client.ts`)                        |
| 4   | Conferir as abas           | —                                                                                                           | `assertVisible: "Início"`, `"Agenda"`, `"Pacientes"`, `"Recursos"`         | `src/features/shell/useTabItems.ts` › `TAB_DEFINITIONS`; `src/components/ds/BottomNav.tsx`                                                                                        |

```yaml
# m-login.yaml (referência)
appId: host.exp.exponent
---
- runFlow: _abrir-app.yaml
- assertVisible: "Entrar"
- tapOn: "Email"
- inputText: ${EMAIL}
- tapOn: "Senha"
- inputText: "senha-errada-fictícia"
- hideKeyboard
- tapOn: "Entrar agora"
- assertVisible: "E-mail ou senha incorretos. Tente novamente."
- runFlow: _login.yaml # limpa o campo e entra com a senha certa (ver nota abaixo)
- assertVisible: "Início"
- assertVisible: "Agenda"
- assertVisible: "Pacientes"
- assertVisible: "Recursos"
```

> Nota: ao reusar `_login.yaml` depois do negativo, os campos ainda têm o texto anterior; use `clearState`/reabrir o app ou
> `eraseText` antes do `inputText`. Alternativa: dois arquivos (`m-login-negativo.yaml` e `m-login.yaml`).

- **Testes automatizados que cobrem:** `src/features/auth/__tests__/LoginForm.test.tsx`, `useSignIn.test.tsx`, `session-expiry.test.ts`, `src/api/__tests__/client.test.ts`
  (`it("does not emit session expiry for the exact sign-in route")`). Rodar: `pnpm exec vitest run src/features/auth/__tests__/useSignIn.test.tsx --maxWorkers=1`.
- **Evidência:** saída do `maestro test` (código 0) e a gravação.

### M-AGE — Agenda → novo atendimento

- **Prioridade / AC:** P1 · AC-QA-02-01 (fluxo 1), AGE-01/AGE-03
- **Objetivo:** da Início, abrir a Agenda, criar um atendimento para hoje e vê-lo na lista.
- **Pré-condição:** M-LOGIN; Paciente A existente; nenhum atendimento dele no horário escolhido; **data de hoje**.
- **Dados:** `PACIENTE="Paciente Teste Um"`; horário de hoje (ex.: 15:30; **na rodada, um horário livre**); tipo "Psicopedagogia".
- **Roteiro:**

| #   | Passo               | Seletor (texto exato ou rótulo)                                                                                                        | Asserção esperada                                         | Se falhar (tela / componente)                                                                                                           |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tocar na aba Agenda | `tapOn: "Agenda"` (item do `BottomNav`; rótulo = "Agenda")                                                                             | `assertVisible: "Novo atendimento"` e o título "Agenda"   | `src/components/ds/BottomNav.tsx`; "Agenda" aparece também como título: se acertar o título, use `index`/`testID` proposto `tab-agenda` |
| 2   | Abrir o formulário  | `tapOn: "Novo atendimento"` (`DsButton`, `AgendaScreen.tsx`)                                                                           | título "Novo atendimento" e o campo **"Paciente"**        | `src/features/agenda/AgendaScreen.tsx` (`router.push` para `/agenda/new` com `date`)                                                    |
| 3   | Escolher o paciente | `tapOn: "Paciente"` (`SelectField`) → `tapOn: ${PACIENTE}` (opção da folha)                                                            | o campo mostra "Paciente Teste Um"                        | `src/components/ds/SelectField.tsx` (folha com `accessibilityLabel` = texto da opção); `GET /student/` falhou → lista vazia             |
| 4   | Data                | a data já vem do dia selecionado da Agenda (hoje)                                                                                      | `assertVisible` com a data de hoje no campo "Data"        | `AppointmentFormScreen.tsx` (parâmetro `date`; `AC-AGE-03-06`)                                                                          |
| 5   | Horário             | `tapOn: "Horário"` (`TimeField`) → diálogo nativo: modo texto (`id: android:id/toggle_mode`), `inputText` hora e minuto, `tapOn: "OK"` | o campo mostra o horário escolhido (`HH:mm`)              | seletor do Android (ver §2); `src/components/ds/TimeField.tsx` (`DateTimePicker mode="time"`); ids a confirmar no emulador              |
| 6   | Tipo                | `tapOn: "Tipo de atendimento"` → `inputText: "Psicopedagogia"`                                                                         | o campo mostra o texto                                    | `Field` "Tipo de atendimento" (máx. 50 caracteres)                                                                                      |
| 7   | Enviar              | `hideKeyboard` → `tapOn: "Agendar atendimento"`                                                                                        | toast **"Atendimento agendado"** (curto) e volta à Agenda | `AppointmentFormScreen.tsx` (`copy.create`); `409` → "Já existe um atendimento nesse horário" (BE-04)                                   |
| 8   | Conferir na lista   | `assertVisible: ".*Paciente Teste Um.*"` (rótulo do cartão: `{hh:mm}, {paciente}, {duração} min · {tipo}`)                             | o item aparece no dia de hoje, com o horário e o tipo     | `src/features/appointments/mutations.ts` (invalidação de `["appointment"]`); `src/features/agenda/AgendaScreen.tsx`                     |
| 9   | Conferir na Início  | `tapOn: "Início"` → `assertVisible: ".*Paciente Teste Um.*"`                                                                           | o atendimento aparece em "Agenda de hoje"                 | `src/features/home/HomeScreen.tsx` (chave `["appointment"]`)                                                                            |

```yaml
# m-agenda-novo-atendimento.yaml (referência)
appId: host.exp.exponent
---
- runFlow: _abrir-app.yaml
- runFlow: _login.yaml
- tapOn: "Agenda"
- tapOn: "Novo atendimento"
- tapOn: "Paciente"
- tapOn: ${PACIENTE}
- tapOn: "Horário"
# diálogo nativo do Android — confirmar os ids no emulador (maestro studio):
- tapOn:
    id: "android:id/toggle_mode"
- tapOn:
    id: "android:id/input_hour"
- inputText: ${HORA} # ex.: 15
- tapOn:
    id: "android:id/input_minute"
- inputText: ${MINUTO} # ex.: 30
- tapOn: "OK"
- tapOn: "Tipo de atendimento"
- inputText: "Psicopedagogia"
- hideKeyboard
- tapOn: "Agendar atendimento"
- extendedWaitUntil:
    visible: ".*${PACIENTE}.*" # item na Agenda (o toast some rápido)
    timeout: 15000
- tapOn: "Início"
- assertVisible: ".*${PACIENTE}.*"
```

- **Testes automatizados que cobrem:** `src/features/agenda/form/__tests__/AppointmentFormScreen.test.tsx` (`it("AC-AGE-03-01 envia só o obrigatório, com scheduledAt em ISO UTC")`),
  `src/features/agenda/__tests__/AgendaScreen.test.tsx`, `src/features/appointments/__tests__/mutations.test.ts`. Rodar:
  `pnpm exec vitest run src/features/agenda/form/__tests__/AppointmentFormScreen.test.tsx --maxWorkers=1`.
- **Evidência:** saída do `maestro test`, gravação e uma captura da Agenda com o item.
- **Observação:** o fluxo cria um atendimento a cada execução; use um horário diferente ou exclua o atendimento ao fim
  (detalhe → "Excluir atendimento" → "Excluir") para a segunda execução não bater em `409 APPOINTMENT_CONFLICT`.

### M-PAC — Ficha → editar paciente

- **Prioridade / AC:** P1 · AC-QA-02-01 (fluxo 2), PAC-07
- **Objetivo:** abrir a ficha de um paciente, editar o nome e ver a mudança na ficha e na lista.
- **Pré-condição:** M-LOGIN; Paciente A. **Dados:** `PACIENTE="Paciente Teste Um"`, `NOVO_NOME="Paciente Teste Um Editado"` (restaure ao final).
- **Roteiro:**

| #   | Passo                  | Seletor (texto exato ou rótulo)                                                               | Asserção esperada                                                          | Se falhar (tela / componente)                                                                                                               |
| --- | ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Aba Pacientes          | `tapOn: "Pacientes"`                                                                          | título **"Pacientes"** e o campo "Buscar paciente"                         | `src/features/patients/list/PatientsListScreen.tsx`                                                                                         |
| 2   | Buscar e abrir a ficha | `tapOn: "Buscar paciente"` → `inputText: ${PACIENTE}` → `tapOn: "Abrir ficha de ${PACIENTE}"` | a ficha abre: `assertVisible: "Visão geral"` e `"Planos"` (abas)           | rótulo do cartão em `PatientsListScreen.tsx` (`Abrir ficha de {nome}`); `src/features/patients/detail/PatientDetailScreen.tsx`              |
| 3   | Abrir a edição         | rolar até **"Dificuldades mapeadas"** → `tapOn: "Editar"`                                     | título **"Editar paciente"**; o botão **"Salvar alterações"** desabilitado | a ação "Editar" é do `SectionTitle` (`src/components/ds/SectionTitle.tsx`); outras telas também têm "Editar" — usar `testID` `patient-edit` |
| 4   | Mudar o nome           | `tapOn: "Nome completo"` → `eraseText` → `inputText: ${NOVO_NOME}`                            | o campo mostra o novo nome; "Salvar alterações" habilita                   | `src/features/patients/form/PatientFormScreen.tsx` (`Field` "Nome completo", `accessibilityLabel` igual ao rótulo → `index: 1`)             |
| 5   | Salvar                 | `hideKeyboard` → `tapOn: "Salvar alterações"`                                                 | toast **"Paciente salvo com sucesso"** e volta à ficha em ~0,7 s           | `PatientFormScreen.tsx` (`onSuccess`: `invalidateQueries(["student"])`, toast, `router.back`); `PUT /student/update/:id`                    |
| 6   | Conferir a ficha       | `assertVisible: ${NOVO_NOME}`                                                                 | a ficha mostra o novo nome                                                 | cache `["student"]` não invalidado (F2.1 em [06-fluxos-e-backend.md](06-fluxos-e-backend.md))                                               |
| 7   | Conferir a lista       | `tapOn: "Voltar"` → `assertVisible: "Abrir ficha de ${NOVO_NOME}"`                            | a lista mostra o nome novo                                                 | idem                                                                                                                                        |
| 8   | Restaurar              | repetir 3–5 com o nome original                                                               | nome original de volta                                                     | —                                                                                                                                           |

```yaml
# m-ficha-editar-paciente.yaml (referência)
appId: host.exp.exponent
---
- runFlow: _abrir-app.yaml
- runFlow: _login.yaml
- tapOn: "Pacientes"
- tapOn: "Buscar paciente"
- inputText: ${PACIENTE}
- tapOn: "Abrir ficha de ${PACIENTE}"
- assertVisible: "Visão geral"
- scrollUntilVisible:
    element: "Dificuldades mapeadas"
- tapOn: "Editar"
- assertVisible: "Editar paciente"
- tapOn: "Nome completo"
- eraseText
- inputText: ${NOVO_NOME}
- hideKeyboard
- tapOn: "Salvar alterações"
- extendedWaitUntil:
    visible: ${NOVO_NOME}
    timeout: 15000
```

- **Testes automatizados que cobrem:** `src/features/patients/form/__tests__/PatientFormScreen.test.tsx` (`it("preenche a edição, desabilita sem mudanças e envia apenas o telefone alterado")`),
  `src/features/patients/detail/__tests__/PatientDetailScreen.test.tsx`, `src/features/patients/list/__tests__/PatientsListScreen.test.tsx`,
  `src/mocks/__tests__/student-update.integration.test.ts`. Rodar: `pnpm exec vitest run src/features/patients/form/__tests__/PatientFormScreen.test.tsx --maxWorkers=1`.
- **Evidência:** saída do `maestro test` e a gravação.
- **Divergência encontrada:** o PLANO-TESTES (NAV-03.2) cita "Novo paciente" na lista de Pacientes; no código o botão da lista é o `Fab` com rótulo **"Cadastrar paciente"**
  (`PatientsListScreen.tsx`); "Novo paciente" é o atalho da **Início**. Para criar paciente em Maestro, use o rótulo do código.

### M-PLN — Gerar plano → salvar → detalhe

- **Prioridade / AC:** P1 · AC-QA-02-01 (fluxo 3), PLN-02/03/04 e PAC-04
- **Objetivo:** da ficha, gerar um PDI com a IA, salvar e ver o detalhe.
- **Pré-condição:** M-LOGIN; Paciente A **sem PDI ativo** (senão aparece "Este paciente já tem um PDI ativo."), com ao menos uma dificuldade; backend real.
- **Dados:** `PACIENTE`, `FOCO="Desenvolver a leitura de palavras simples"`. **A IA leva 30 a 90 s** (`AI_TIMEOUT_MS`): o `timeout` do fluxo é de **100 s** nesse passo.
- **Roteiro:**

| #   | Passo              | Seletor (texto exato ou rótulo)                                                   | Asserção esperada                                                                             | Se falhar (tela / componente)                                                                                                                                                                     |
| --- | ------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Abrir a ficha      | como em M-PAC (passos 1–2)                                                        | abas "Visão geral" e "Planos"                                                                 | —                                                                                                                                                                                                 |
| 2   | Aba "Planos"       | `tapOn: "Planos"` (`Tabs`, papel `tab`)                                           | `assertVisible: "Criar novo plano"`                                                           | `PatientDetailScreen.tsx` › `Tabs`; a aba e o botão têm nomes parecidos (testID `patient-tab-plans`)                                                                                              |
| 3   | Abrir a geração    | `tapOn: "Criar novo plano"` (`DsButton`, `PatientPlans.tsx`)                      | título **"Novo planejamento"**, subtítulo com o nome do paciente, **"Tipo de plano"**         | `src/features/plans/routes.ts` (`NEW_PLAN_ROUTE`); o paciente já vem escolhido (`?studentId=`)                                                                                                    |
| 4   | Preencher o foco   | `tapOn: "Foco do planejamento"` → `inputText: ${FOCO}` → `hideKeyboard`           | o botão "Gerar planejamento com IA" habilita                                                  | `GeneratePlanScreen.tsx` (`canGenerate`); `Field` de rótulo duplicado → `index: 1`                                                                                                                |
| 5   | Gerar              | `tapOn: "Gerar planejamento com IA"`                                              | `assertVisible: "Gerando o planejamento…"` e depois **"Rascunho não salvo"** e **"Editável"** | `generatePlanDraft` (`POST /plan/generate`, 90 s); erros: "Não foi possível gerar agora. Tente de novo em instantes." (`AI_*`), "A geração demorou mais que o esperado. Tente de novo." (timeout) |
| 6   | Salvar             | rolar até o fim do rascunho → `tapOn: "Salvar PDI"`                               | toast **"Plano salvo"** e abre o detalhe em ~0,7 s                                            | `DraftPreview.tsx` › `save` (`POST /plan/`); `409` → "Este paciente já tem um PDI ativo." e "Ver PDI ativo"                                                                                       |
| 7   | Conferir o detalhe | `assertVisible: "Objetivo geral"`, `".*Vigência:.*"`, `"Metas"`, `"Ativo"`        | detalhe com vigência, metas e o selo "Ativo"                                                  | `src/features/plans/detail/PlanDetailScreen.tsx` (`GET /plan/:id`)                                                                                                                                |
| 8   | Conferir a lista   | `tapOn: "Voltar"` (até a Início) → `tapOn: "Recursos"` → `tapOn: "Planos com IA"` | o plano aparece em **"Em andamento"** com o nome do paciente                                  | `src/features/plans/hub/PlansHubScreen.tsx`; invalidação de `["plan"]`                                                                                                                            |

```yaml
# m-plano-gerar-salvar.yaml (referência)
appId: host.exp.exponent
---
- runFlow: _abrir-app.yaml
- runFlow: _login.yaml
- tapOn: "Pacientes"
- tapOn: "Buscar paciente"
- inputText: ${PACIENTE}
- tapOn: "Abrir ficha de ${PACIENTE}"
- tapOn: "Planos"
- tapOn: "Criar novo plano"
- assertVisible: "Novo planejamento"
- tapOn: "Foco do planejamento"
- inputText: ${FOCO}
- hideKeyboard
- tapOn: "Gerar planejamento com IA"
- extendedWaitUntil:
    visible: "Rascunho não salvo"
    timeout: 100000 # IA: 30–90 s (AI_TIMEOUT_MS = 90 s)
- scrollUntilVisible:
    element: "Salvar PDI"
- tapOn: "Salvar PDI"
- extendedWaitUntil:
    visible: ".*Vigência:.*" # detalhe do plano
    timeout: 20000
- assertVisible: "Objetivo geral"
- assertVisible: "Metas"
```

- **Testes automatizados que cobrem:** `src/features/plans/generate/__tests__/GeneratePlanScreen.test.tsx` (`it("envia PDI de 3 meses e mostra rascunho sem salvar")`,
  `it("invalida a consulta real da lista depois de salvar")`), `src/features/plans/detail/__tests__/PlanDetailScreen.test.tsx`,
  `src/api/endpoints/__tests__/plans-generate.test.ts`, `plans-create.test.ts`. Rodar: `pnpm exec vitest run src/features/plans/generate/__tests__/GeneratePlanScreen.test.tsx --maxWorkers=1`.
  Detalhes dos casos em [04-planos.md](04-planos.md).
- **Evidência:** saída do `maestro test`, tempo da geração e a gravação.
- **Observação:** o paciente fica com PDI ativo ao fim; para repetir, **encerre o plano** (detalhe → "Encerrar plano" → "Concluído" → "Confirmar") ou use outro paciente.

### M-PRF — Perfil → sair

- **Prioridade / AC:** P1 · AC-QA-02-01 (fluxo 4), REC-02
- **Objetivo:** abrir o perfil, sair da conta e voltar ao Login.
- **Pré-condição:** M-LOGIN.
- **Roteiro:**

| #   | Passo                             | Seletor (texto exato ou rótulo)                                           | Asserção esperada                                                        | Se falhar (tela / componente)                                                                                   |
| --- | --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1   | Aba Recursos                      | `tapOn: "Recursos"`                                                       | o banner do educador                                                     | `src/features/resources/ResourcesScreen.tsx`                                                                    |
| 2   | Abrir o perfil                    | `tapOn: "Perfil"` (banner, `accessibilityLabel="Perfil"`)                 | título **"Perfil"** e os campos "Nome", "E-mail", "Contato", "Profissão" | `ResourcesScreen.tsx` (rótulo fixo "Perfil"); `src/features/profile/ProfileScreen.tsx` (`GET /educator/me`)     |
| 3   | Tocar em Sair e cancelar          | `tapOn: "Sair"` → `assertVisible: "Sair da conta?"` → `tapOn: "Cancelar"` | o diálogo fecha e o perfil continua                                      | `ProfileScreen.tsx` (`Modal`, `confirmLogout`)                                                                  |
| 4   | Sair de verdade                   | `tapOn: "Sair"` → `tapOn: "Confirmar saída"`                              | `assertVisible: "Acesse sua conta para continuar"` e **"Entrar"**        | `useAuthStore.logout` (`src/stores/auth.ts`); `src/features/auth/useSessionGuard.ts` (redireciona para o Login) |
| 5   | O Voltar não reabre a área logada | `pressKey: back`                                                          | continua no Login                                                        | `useSessionGuard.ts`                                                                                            |

```yaml
# m-perfil-sair.yaml (referência)
appId: host.exp.exponent
---
- runFlow: _abrir-app.yaml
- runFlow: _login.yaml
- tapOn: "Recursos"
- tapOn: "Perfil"
- assertVisible: "Perfil"
- tapOn: "Sair"
- assertVisible: "Sair da conta?"
- tapOn: "Cancelar"
- tapOn: "Sair"
- tapOn: "Confirmar saída"
- extendedWaitUntil:
    visible: "Acesse sua conta para continuar"
    timeout: 15000
- pressKey: back
- assertVisible: "Entrar"
```

- **Testes automatizados que cobrem:** `src/features/profile/__tests__/ProfileLogout.test.tsx` (`it("waits for confirmation and clears query cache")`), `ProfileScreen.test.tsx`, `src/stores/__tests__/auth.test.ts`,
  `src/features/auth/__tests__/useSessionGuard.test.tsx`. Rodar: `pnpm exec vitest run src/features/profile/__tests__/ProfileLogout.test.tsx --maxWorkers=1`.
- **Evidência:** saída do `maestro test` e a gravação.

## 4. Matriz dos fluxos e dados

| Fluxo   | Depende de | Dados de teste                     | Cria dado?      | Limpeza ao fim                                          | Tempo esperado |
| ------- | ---------- | ---------------------------------- | --------------- | ------------------------------------------------------- | -------------- |
| M-LOGIN | —          | `EMAIL`, `SENHA` (variáveis)       | não             | —                                                       | ~1 min         |
| M-AGE   | M-LOGIN    | `PACIENTE`, `HORA`, `MINUTO`       | **atendimento** | excluir o atendimento (detalhe → "Excluir atendimento") | ~2 min         |
| M-PAC   | M-LOGIN    | `PACIENTE`, `NOVO_NOME`            | altera o nome   | repetir com o nome original                             | ~2 min         |
| M-PLN   | M-LOGIN    | `PACIENTE` (sem PDI ativo), `FOCO` | **plano ativo** | "Encerrar plano" → "Concluído" → "Confirmar"            | 1 a 3 min (IA) |
| M-PRF   | M-LOGIN    | —                                  | não             | —                                                       | ~1 min         |

## 5. Pendências e perguntas para a rodada

1. **Autorização do usuário** para instalar o Maestro e abrir o emulador (nada é instalado por este documento).
2. **Ids do diálogo nativo de hora** (`android:id/toggle_mode`, `input_hour`, `input_minute`): confirmar no emulador; se divergirem, ajustar o M-AGE ou propor `TimeField` com entrada de texto.
3. **`testID`** nos componentes do DS (§2.1): decidir se vira tarefa antes de fixar os YAML na pasta `.maestro/` (que **não** é criada aqui).
4. **Estabilidade com o Expo Go:** o aviso de boas-vindas e o LogBox podem aparecer em qualquer ponto; os YAML de referência tratam só o primeiro.
5. Registro: o resultado entra no TRACKING e na seção "Entrega 3" do [QA-05-RELATORIO](../../entrega-2/QA-05-RELATORIO.md) com data, emulador, commit e saída do Maestro.

## 6. Resultados

| Fluxo   | Resultado | Duração | Gravação/relatório | Observações |
| ------- | --------- | ------- | ------------------ | ----------- |
| M-LOGIN |           |         |                    |             |
| M-AGE   |           |         |                    |             |
| M-PAC   |           |         |                    |             |
| M-PLN   |           |         |                    |             |
| M-PRF   |           |         |                    |             |
