# Testes manuais — Homologação em aparelhos (QA-04)

Roteiro da tarefa [QA-04](../BACKLOG.md#qa-04--homologação-em-aparelhos): **Android físico** (inclusive câmera
e áudio da ATV-08) e **iOS** (Expo Go ou build), com o **backend real**. Traz a matriz tela × plataforma × recurso
nativo, o que esperar em cada plataforma no Expo Go, onde cada recurso está no código e, se falhar, o que
verificar (permissões, limitações do Expo Go, [COMPATIBILIDADE §9](../../bootstrap/COMPATIBILIDADE.md#96-instaladas-na-v1-e-comportamento-observado-no-expo-go-2026-10-09)).

> **Estado:** roteiro escrito **sem abrir emulador, Metro nem app e sem aparelho**. Nada foi executado. A QA-04
> **exige** Android físico e Mac ou iPhone **com autorização do usuário**; o que não for testado fica como
> **pendência, nunca como aprovado** (AC-QA-04-01; AGENTS §4 "Em tarefas mobile"). Testes unitários e a renderização web **não comprovam**
> funcionamento nativo.

## 1. Escopo, regras e preparação

- **Plataformas:**
  - **Android físico** com o Expo Go (QR code ou URL `exp://<IP do computador>:8081`); anote marca, modelo e versão do Android.
  - **iOS** com o Expo Go do App Store num **iPhone** (a compatibilidade do SDK 57 com a versão do Expo Go da loja deve ser
    conferida) ou um build (EAS, G-01); anote o modelo e a versão do iOS. Sem iPhone/Mac, **todas** as linhas de iOS ficam **N/A (pendente)**.
  - O **emulador** Android já foi coberto pela rodada do [PLANO-TESTES](../PLANO-TESTES.md); aqui o foco é o que só o aparelho real mostra.
- **Regras:**
  - Build nativo e aparelho só com a autorização do usuário no momento; **sem credenciais, tokens, e-mails ou dados reais** em capturas e relatos
    (use os dados fictícios do PLANO-TESTES §1.2). Imagens, áudios e documentos de teste **fictícios** e pequenos.
  - Backend real, mocks desligados (`EXPO_PUBLIC_USE_MOCKS=false`); computador e aparelho **na mesma rede** (o `localhost` do computador
    **não** é o do aparelho; o app usa `EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app`, então o backend não depende da rede local).
  - `pnpm start --clear` depois de mudar o `.env` ou de trocar de branch (e `pnpm install --frozen-lockfile`); cuidados do Expo Go em
    [CONTEXTO-SESSAO §5 e §7](../../CONTEXTO-SESSAO.md).
- **Evidência (por linha da matriz):** captura de tela (`E3-QA04-<NN>.png`, **fora do repositório**), aparelho/versão, commit testado, resultado
  (OK, FALHA, N/A com o motivo, BLOQ). Para a **rede**, método, caminho e status (sem corpo de resposta).
- **Cenários de mock úteis** (`EXPO_PUBLIC_USE_MOCKS=true`, [src/mocks/README.md](../../../src/mocks/README.md)): ensaiam os recursos nativos **sem backend** (galeria,
  documento, PDF, compartilhamento, `wa.me`), pois nenhum deles depende da resposta do servidor; a evidência final é com o backend real.
- **Dependências nativas** (versões em `package.json`; plugins em `app.json`): `expo-image-picker` (permissões de fotos e câmera), `expo-document-picker`,
  `expo-audio`, `expo-print`, `expo-sharing`, `expo-file-system`, `expo-secure-store`, `expo-sqlite`, `@react-native-community/datetimepicker`,
  `@react-native-community/netinfo`, `react-native-safe-area-context`. No Expo Go, os textos de permissão são os **do próprio Expo Go**; os do `app.json`
  (`photosPermission`, `cameraPermission`) só valem num build.

## 2. Matriz tela × plataforma × recurso nativo

Preencha cada célula com OK, FALHA (+ID da linha da §3), N/A ou BLOQ. "Recurso" é o que a tela usa de nativo.

| Tela / fluxo                                      | Recurso nativo                                                         | Android físico | iOS | Caso                   |
| ------------------------------------------------- | ---------------------------------------------------------------------- | -------------- | --- | ---------------------- |
| Login                                             | teclado, `expo-secure-store` (token), `NetInfo`                        |                |     | DEV-09, DEV-10         |
| Início (lembrete "Lembrete", cartão de sugestões) | `Linking` (`wa.me`), área segura                                       |                |     | DEV-05, DEV-08         |
| Agenda e Detalhe do atendimento                   | `Linking` (WhatsApp), fuso `America/Sao_Paulo`                         |                |     | DEV-05, DEV-07         |
| Novo/Editar atendimento                           | `@react-native-community/datetimepicker` (data e hora), teclado, fuso  |                |     | DEV-07, DEV-08         |
| Novo/Editar paciente                              | teclado (máscara de telefone/CEP), `KeyboardAvoidingView`              |                |     | DEV-08                 |
| Ficha do paciente                                 | `Linking` (WhatsApp), `Alert`                                          |                |     | DEV-05                 |
| Anamnese (resposta com arquivo)                   | `expo-document-picker`                                                 |                |     | DEV-03                 |
| Modelos de anamnese                               | teclado, `Modal` de exclusão                                           |                |     | DEV-08                 |
| Perfil                                            | `expo-image-picker` (galeria e câmera), `Modal` de saída               |                |     | DEV-01                 |
| Recursos                                          | navegação, área segura                                                 |                |     | DEV-08                 |
| Banco de atividades / nova atividade (ATV-08)     | `expo-image-picker` (galeria e câmera), `expo-document-picker` (áudio) |                |     | DEV-01, DEV-02, DEV-03 |
| Detalhe da atividade e jogar                      | `expo-audio` (`AudioPlayer`)                                           |                |     | DEV-02                 |
| Sessão (player) e relatório da sessão             | `expo-audio`, `expo-print`, `expo-sharing`, `expo-file-system`         |                |     | DEV-02, DEV-04         |
| Relatórios do aluno                               | `expo-print`, `expo-sharing`, `expo-file-system`                       |                |     | DEV-04                 |
| Planos: gerar e rascunho                          | `Share` (síntese em texto), `Alert` (descartar rascunho), teclado      |                |     | DEV-06, DEV-08         |
| Planos: lista, detalhe e sugestões                | `Alert` (encerrar), teclado                                            |                |     | DEV-08                 |

## 3. Casos por recurso

Formato do [QA-06](../PLANO-TESTES.md): objetivo, pré-condição, passos, resultado esperado por plataforma, onde está no código, testes
automatizados relacionados (que **não** substituem o aparelho), "Se falhar" e evidência.

#### DEV-01 — Câmera e galeria (ATV-08 e foto do perfil)

- **Prioridade / AC:** P1 · AC-QA-04-01 (ATV-08, REC-02)
- **Objetivo:** escolher uma imagem pela **galeria** e **fotografar** pela câmera, em dois pontos do app, com as permissões do sistema.
- **Pré-condição:** aparelho com ao menos uma foto pequena (< 5 MB, fictícia); permissões ainda **não** concedidas (para ver o pedido).
- **Passos:**
  1. **Perfil** (Recursos → "Perfil"): tocar em **"Escolher imagem da galeria"**; conceder a permissão; escolher uma foto.
  2. Tocar em **"Tirar foto"**; conceder a permissão da câmera; fotografar e confirmar.
  3. Negar a permissão (configurações do sistema) e tocar de novo.
  4. **Nova atividade** (Banco de atividades → criar): repetir em "Escolher imagem"/"Tirar foto" do campo de imagem; "Remover imagem".
- **Resultado esperado:**
  - **Android:** pedido de permissão do sistema; a galeria abre o seletor de fotos; a câmera abre o app de câmera. A imagem aparece na pré-visualização; no **Perfil**
    sobe na hora ("Enviando imagem..." → toast "Foto atualizada") com `PUT /educator/update-profile-picture` (multipart `photo`, `200`); acima de 5 MB: "A foto deve ter até 5 MB.".
  - **iOS (Expo Go):** pedidos de permissão com os textos do Expo Go; galeria no seletor de fotos do iOS; câmera real (o **simulador não tem câmera**). Mesmo envio do Perfil.
  - **Permissão negada (ambos):** **"Permita o acesso às fotos nas configurações para escolher uma imagem."** e o botão **"Abrir configurações"** (abre os ajustes do app).
  - **Rede (backend real):** Perfil → `PUT /educator/update-profile-picture → 200`; atividade → upload de mídia (`POST /task/upload-media`, ver `src/api/endpoints/task-upload-media.ts`).
- **Onde está no código:** `src/components/media/ImagePickerField.tsx` › `ImagePickerField` (`requestCameraPermissionsAsync`, `requestMediaLibraryPermissionsAsync`,
  `launchCameraAsync`, `launchImageLibraryAsync`, `Linking.openSettings`); uso em `src/features/profile/ProfileScreen.tsx` (`choosePhoto`) e
  `src/features/content-create/task/NewTaskScreen.tsx`; limite de 5 MB em `src/api/endpoints/educator-update.ts` › `updateProfilePicture`.
- **Testes automatizados que cobrem:** `src/components/media/__tests__/ImagePickerField.test.tsx`; `src/api/endpoints/__tests__/educator-update.test.ts` (`it("uploads multipart photo and rejects a file over 5 MB")`);
  `task-upload-media.test.ts`. Rodar: `pnpm exec vitest run src/components/media/__tests__/ImagePickerField.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. Nenhum pedido de permissão e a câmera não abre → **emulador/simulador sem câmera**, ou a permissão já foi negada antes (limpe nas configurações do Expo Go).
  2. A câmera **não foi testada** na V1 (COMPATIBILIDADE §9.6: "A câmera não foi testada no emulador") — esta é a primeira validação real; falha aqui pode ser
     do Expo Go (sem a permissão da câmera) ou de `launchCameraAsync`.
  3. Upload falha → olhe a rede: `400`/`413` indica tamanho/tipo; `401` volta ao Login. O arquivo vem de `asset.uri` (`file://`); no iOS, fotos HEIC podem subir como `image/heic`
     (verificar `mimeType` e o aceite do backend).
  4. Mensagem "nas fotos" também aparece quando a **câmera** é negada (mesmo texto): **observação**, não falha de função.
- **Evidência:** capturas da permissão, da pré-visualização e do toast; status de `PUT /educator/update-profile-picture`.

#### DEV-02 — Áudio (ATV-08 e jogo): `expo-audio`

- **Prioridade / AC:** P1 · AC-QA-04-01 (ATV-08)
- **Objetivo:** tocar e pausar o áudio de uma atividade (remoto e local) no aparelho real.
- **Pré-condição:** atividade com áudio (URL do backend) e outra a ser criada com um **áudio local** pequeno (fictício) no aparelho.
- **Passos:**
  1. Abrir a atividade com áudio (Detalhe da atividade, jogar, ou o **player da sessão**) → tocar em **"Tocar áudio"** → **"Pausar áudio"**.
  2. Em **Nova atividade**, tocar em **"Escolher arquivo de áudio"**, escolher o áudio; tocar no player de pré-visualização.
  3. No iOS, repetir com a chave de **silencioso** ligada.
- **Resultado esperado:**
  - **Android:** o áudio toca no alto-falante; o botão alterna "Tocar áudio"/"Pausar áudio".
  - **iOS (Expo Go):** idem, **mas** com a chave de silencioso ligada o som pode **não** sair (o app não configura o modo de áudio, ver "Se falhar").
  - Seleção do arquivo: o seletor de documentos do sistema com filtro `audio/*`; o arquivo é copiado para o cache do app.
- **Onde está no código:** `src/components/media/AudioPlayer.tsx` › `AudioPlayer` (`useAudioPlayer`, `useAudioPlayerStatus`, `player.play()`/`pause()`);
  `src/components/media/AudioPickerField.tsx` › `selectAudio` (`DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true })`);
  usos: `src/features/content-detail/task/TaskDetailScreen.tsx`, `src/features/activities/engine/QuizActivity.tsx`,
  `src/features/sessions/player/SessionPlayerScreen.tsx`, `src/features/content-create/task/NewTaskScreen.tsx`. Plugin `expo-audio` em `app.json`.
- **Testes automatizados que cobrem:** `src/components/media/__tests__/AudioPlayer.test.tsx`, `AudioPickerField.test.tsx`. Rodar:
  `pnpm exec vitest run src/components/media/__tests__/AudioPlayer.test.tsx --maxWorkers=1`.
- **Se falhar:**
  1. iOS sem som com o aparelho no silencioso → o código **não** chama `setAudioModeAsync` (sem `playsInSilentMode`): é uma limitação do app, não do aparelho; registre e abra tarefa.
  2. Não toca com URL remota → URL do áudio inacessível/`http` (iOS bloqueia `http` sem ATS no build); confira a URL na rede.
  3. Não toca o áudio local → o seletor devolveu um `content://`/`file://` que o player não lê; confirme `copyToCacheDirectory` e o tipo do arquivo.
  4. Botão não muda de rótulo → `status.playing` não atualiza (limitação da versão do `expo-audio` no Expo Go); registre a versão.
- **Evidência:** gravação curta (com som) ou nota do resultado; aparelho e estado da chave de silencioso.

#### DEV-03 — Seletor de documento (anamnese e áudio)

- **Prioridade / AC:** P1 · AC-QA-04-01 (PAC-06)
- **Objetivo:** anexar um arquivo na pergunta de **arquivo** da anamnese e enviar.
- **Pré-condição:** modelo de anamnese com pergunta do tipo "Arquivo" (PAC-08.1); um documento pequeno fictício (PDF/imagem) e outro **> 10 MB** no aparelho.
- **Passos:**
  1. Ficha → "Anamnese" → "Nova anamnese" → escolher o modelo → em "Arquivo", tocar em **"Escolher arquivo"**; escolher o documento pequeno; **"Salvar anamnese"**.
  2. Repetir com o arquivo > 10 MB.
- **Resultado esperado:**
  - **Android:** o seletor de arquivos do sistema (Documentos); o nome do arquivo aparece; ao salvar, o upload ocorre **antes** do envio (`POST /anamnese/responses/upload-file` multipart `file`, `200 { url }`), depois
    `POST /anamnese/templates/:templateId/responses → 201`. Reabrir mostra "Arquivo já enviado".
  - **iOS (Expo Go):** o seletor do app Arquivos (iCloud/Neste iPhone); mesmo resultado.
  - Arquivo > 10 MB: **"O arquivo excede o limite de 10 MB."**, sem envio.
- **Onde está no código:** `src/features/anamnese/responses/AnamneseForm.tsx` › `pickFile` (`DocumentPicker.getDocumentAsync`, `MAX_ANAMNESE_FILE_SIZE_BYTES`); `src/api/endpoints/anamnese-responses.ts` › `uploadAnamneseFile`,
  `createAnamneseResponse`.
- **Testes automatizados que cobrem:** `src/features/anamnese/responses/__tests__/AnamneseResponsesScreen.test.tsx`; `.../api.test.ts` (`it("envia o arquivo em multipart e devolve a URL")`). Rodar:
  `pnpm exec vitest run src/features/anamnese/responses/__tests__/api.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. O seletor não abre → o Expo Go bloqueou o módulo (`expo-document-picker` roda no Expo Go, COMPATIBILIDADE §9.6) ou o app de arquivos do aparelho está desativado.
  2. Upload falha com `400`/`413` → `FILE_REQUIRED` (sem arquivo) ou tamanho; confira `asset.size` (alguns provedores de nuvem devolvem `size` vazio — o limite de 10 MB só é checado quando `size` vem).
  3. O arquivo escolhido na nuvem (Drive/iCloud) não baixa → `copyToCacheDirectory: true` pode falhar sem rede.
- **Evidência:** captura do arquivo escolhido e de "Arquivo já enviado"; `POST …/upload-file → 200`.

#### DEV-04 — PDF: imprimir e enviar (`expo-print`, `expo-sharing`, `expo-file-system`; G-45)

- **Prioridade / AC:** P1 · AC-QA-04-01 (REL-04/REL-05)
- **Objetivo:** gerar e compartilhar o PDF dos relatórios no aparelho, com a regravação em base64 do G-45.
- **Pré-condição:** sessão encerrada com relatório (SES/REL); relatório do aluno com análise.
- **Passos:**
  1. Relatório da sessão → **"Imprimir"** (pré-visualização) e **"Enviar"** (compartilhar o PDF).
  2. Relatórios do aluno → **"Imprimir"** e **"Enviar"**.
  3. Escolher um destino do compartilhamento (e-mail, WhatsApp, Drive, Salvar em Arquivos).
- **Resultado esperado:**
  - **Android:** "Imprimir" abre a pré-visualização/serviço de impressão do sistema; "Enviar" abre a folha de compartilhamento com um **PDF legível** (`relatorio-sessao.pdf`/`relatorio-aluno.pdf`).
  - **iOS (Expo Go):** "Imprimir" abre a folha de impressão; "Enviar" abre a folha de compartilhamento (AirDrop, Mensagens, Arquivos).
  - O PDF abre no destino com o conteúdo do relatório (sem dados de outros pacientes).
- **Onde está no código:** `src/features/reports/session/pdf.ts` › `printSessionReport` (`Print.printAsync`), `shareSessionReport` (`Print.printToFileAsync({ base64: true })` + `sharePdfFromBase64`);
  `src/features/reports/student/pdf.ts` (`printStudentReport`, `shareStudentReport`); `src/features/reports/sharePdf.ts` › `sharePdfFromBase64` (`File`/`Paths.cache` do `expo-file-system`, `Sharing.shareAsync`);
  telas `SessionReportScreen.tsx` e `StudentReportsScreen.tsx`.
- **Testes automatizados que cobrem:** `src/features/reports/session/__tests__/SessionReportScreen.test.tsx`, `session-report.test.ts`; `src/features/reports/student/__tests__/StudentReportsScreen.test.tsx`, `studentReport.test.ts`. Rodar:
  `pnpm exec vitest run src/features/reports/session src/features/reports/student --maxWorkers=1`.
- **Se falhar:**
  1. "Not allowed to read file under given URL"/"Missing READ permission" → regressão do **G-45**: o app deve regravar o base64 no cache do app antes de compartilhar (`sharePdfFromBase64`); só acontece se o `printToFileAsync` voltar a ser usado direto.
  2. A folha de compartilhamento abre e o PDF chega **vazio/corrompido** → `base64` vazio (`file.base64 ?? ""`); confirme `printToFileAsync` com `base64: true`.
  3. No iOS, a pré-visualização não abre → limitação do `expo-print` no Expo Go; teste num build.
  4. Conteúdo com acento quebrado → HTML sem `charset` (`buildSessionReportHtml` usa `<meta charset="utf-8" />`).
- **Evidência:** captura da folha de compartilhamento; o PDF aberto no destino (sem dados reais).

#### DEV-05 — WhatsApp (`Linking` para `wa.me`; G-53)

- **Prioridade / AC:** P1 · AC-QA-04-01 (AGE-02)
- **Objetivo:** o lembrete e o contato abrem o WhatsApp **real** com a mensagem pronta; nada é enviado sozinho.
- **Pré-condição:** WhatsApp instalado no aparelho; Paciente A com responsável (telefone fictício **seu**, para não escrever a um terceiro); Paciente C sem telefone.
- **Passos:**
  1. Atendimento pendente → **"Enviar lembrete pelo WhatsApp"**.
  2. Início → **"Lembrete"**.
  3. Ficha → **"Contatar responsável"**.
  4. Repetir **sem** o WhatsApp instalado (se possível).
- **Resultado esperado:**
  - **Android:** o WhatsApp abre na conversa do número com o texto da mensagem preenchido (**não enviado**); a mensagem traz dia, data e hora corretos (fuso de São Paulo).
  - **iOS:** o link `wa.me` abre o WhatsApp (ou o navegador, se o app não estiver instalado).
  - Sem o app: o navegador abre a página do `wa.me`; se nada abrir, toast **"Não foi possível abrir o WhatsApp"**.
  - Paciente sem telefone: botão **desabilitado** + "Paciente sem telefone cadastrado".
- **Onde está no código:** `src/utils/whatsapp.ts` › `pickContactPhone`, `buildWhatsAppUrl`, `appointmentReminderMessage`, `patientContactMessage`; `Linking.openURL` em
  `src/features/agenda/detail/AppointmentDetailScreen.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/patients/detail/PatientDetailScreen.tsx` › `openContact`.
- **Testes automatizados que cobrem:** `src/utils/__tests__/whatsapp.test.ts` (`it("AC-AGE-02-01 prioriza responsável e normaliza telefone com máscara ou DDI")`);
  `AppointmentDetailScreen.test.tsx` (`it("avisa quando o WhatsApp não pode ser aberto")`). Rodar: `pnpm exec vitest run src/utils/__tests__/whatsapp.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Abre o WhatsApp **sem** o texto → `encodeURIComponent` da mensagem (acentos) ou versão do WhatsApp; confira o URL (`?text=`).
  2. Número errado → `pickContactPhone` prioriza o **responsável**; sem `55` o app o acrescenta só com 10 ou 11 dígitos.
  3. iOS não abre o WhatsApp → `Linking.openURL` de `https://wa.me/…` depende do app instalado; o Expo Go no iOS não precisa de `LSApplicationQueriesSchemes` para `https`.
  4. Dia da semana errado → fuso (DEV-07).
- **Evidência:** captura da conversa com a mensagem (só os últimos dígitos do número, se visíveis).

#### DEV-06 — Compartilhar o rascunho do plano (`Share`)

- **Prioridade / AC:** P2 · AC-QA-04-01 (PLN-03)
- **Objetivo:** a síntese em texto do rascunho abre a folha de compartilhamento do sistema.
- **Pré-condição:** rascunho de plano aberto (gerado e não salvo).
- **Passos:** tocar em **"Compartilhar"**; escolher um destino (Notas/e-mail); cancelar a folha.
- **Resultado esperado:**
  - **Android:** o seletor ("Compartilhar via") com o texto: título, objetivo, "Metas:" e metas numeradas; cancelar mantém o rascunho.
  - **iOS:** a folha de compartilhamento com o mesmo texto.
  - **Rede:** nenhuma.
- **Onde está no código:** `src/features/plans/generate/DraftPreview.tsx` › `onShare` (`Share.share({ message })` do `react-native`); `src/features/plans/draft/PlanForm.tsx` (botão "Compartilhar").
- **Testes automatizados que cobrem:** `src/features/plans/generate/__tests__/GeneratePlanScreen.test.tsx` — `it("compartilha uma síntese com metas numeradas")`.
- **Se falhar:** folha vazia → `values.goals` sem metas; folha não abre → sem apps de compartilhamento instalados (emulador); no iOS o `Share` do RN usa `message` (sem `url`).
- **Evidência:** captura da folha com o texto.

#### DEV-07 — Fuso horário (`America/Sao_Paulo`) e seletores de data e hora

- **Prioridade / AC:** P1 · AC-QA-04-01 (G-13, AGE-03)
- **Objetivo:** a Agenda mostra e cria horários em **São Paulo** mesmo com o aparelho em **outro fuso**; os seletores nativos de data e hora funcionam.
- **Pré-condição:** atendimento criado para hoje; aparelho com fuso **automático** e, no teste, com um fuso diferente (ex.: Lisboa) — **volte ao original** ao fim.
- **Passos:**
  1. Com o fuso do aparelho em outro lugar, abrir a **Agenda** e a **Início**: conferir hora e "hoje".
  2. Criar um atendimento: tocar em **"Data"** e **"Horário"**, escolher valores no seletor nativo; **"Agendar atendimento"**.
  3. Abrir o detalhe e o lembrete do WhatsApp (DEV-05): conferir dia e hora.
- **Resultado esperado:**
  - **Android:** os campos abrem o **diálogo** nativo de data/hora (OK/Cancelar); o horário mostrado e enviado é o de **São Paulo** (ISO UTC na rede, ex.: `…T13:00:00.000Z` para 10:00 em São Paulo).
  - **iOS:** o seletor aparece **inline** (rolagem) no próprio campo (ver "Se falhar").
  - O "hoje" e o agrupamento por dia seguem São Paulo, não o fuso do aparelho.
- **Onde está no código:** `src/utils/date.ts` (`TIME_ZONE`, `formatTime`, `dayKey`, `getTodayKey`, `toBrasiliaISOString`); `src/components/ds/DateField.tsx`, `src/components/ds/TimeField.tsx` (`DateTimePicker`);
  `src/features/agenda/form/datetime.ts`; `src/features/agenda/AgendaScreen.tsx`; envio em `src/api/endpoints/appointment.ts` (`scheduledAt` ISO UTC).
- **Testes automatizados que cobrem:** `src/utils/__tests__/date.test.ts`; `src/features/agenda/__tests__/selectors.test.ts`; `AppointmentFormScreen.test.tsx` — `it("AC-AGE-03-01 envia só o obrigatório, com scheduledAt em ISO UTC")`. Rodar:
  `pnpm exec vitest run src/utils/__tests__/date.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Hora deslocada → conversão pelo fuso do aparelho em algum `new Date(...).getHours()`: **`TimeField.handleChange` usa `picked.getHours()` (hora local do aparelho)** e a recompõe com `toBrasiliaISOString`;
     com o aparelho em outro fuso, o valor escolhido no seletor **é interpretado como hora de São Paulo** — confirme que o resultado é o pretendido.
  2. **iOS:** o `handleChange` de `DateField`/`TimeField` chama `setOpen(false)` a **cada** evento; no iOS o seletor emite eventos ao rolar, então o campo pode **fechar na primeira rolagem** (escrito para o diálogo do Android) — **risco a verificar** em aparelho.
  3. Horário "hoje" errado perto da meia-noite → `getTodayKey` em São Paulo vs. o dia local; teste às 21h–03h.
- **Evidência:** capturas da Agenda com o fuso trocado; `POST /appointment/ → scheduledAt` (só o campo).

#### DEV-08 — Teclado e área segura

- **Prioridade / AC:** P2 · AC-QA-04-01
- **Objetivo:** campos e botões não ficam cobertos pelo teclado, e cabeçalho/barra inferior respeitam entalhe e barra de gestos.
- **Pré-condição:** aparelho com **entalhe/ilha dinâmica** (iOS) e com **navegação por gestos** (Android).
- **Passos:**
  1. Em cada formulário (Login, Novo atendimento, Novo/Editar paciente, Anamnese, Modelos de anamnese, Perfil, Gerar plano e rascunho, Detalhe do plano em edição/revisão): tocar no **último campo**, abrir o teclado, rolar até o botão de envio.
  2. Girar o aparelho (o app é `portrait`; confirme que **não** gira).
  3. Olhar o **topo** (cabeçalho) e a **base** (barra de abas) de cada tela.
- **Resultado esperado:**
  - **Android:** o teclado **redimensiona** a janela; o botão de envio é alcançável pela rolagem; a barra de abas respeita a barra de gestos.
  - **iOS:** os formulários **com** `KeyboardAvoidingView` (Novo/Editar atendimento e paciente) sobem; **os demais** não têm — o teclado pode **cobrir** o campo em foco (verificar).
  - O **cabeçalho** (`AppHeader`, `paddingTop: 24` fixo) não fica sob a barra de status/ilha.
- **Onde está no código:** `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"` em `src/features/agenda/form/AppointmentFormScreen.tsx` e `src/features/patients/form/PatientFormScreen.tsx` (só estes dois);
  `SafeAreaProvider` em `app/_layout.tsx`; `useSafeAreaInsets` em `src/components/ds/BottomNav.tsx` (`paddingBottom: 7 + insets.bottom`) e `src/features/patients/list/PatientsListScreen.tsx`;
  `SafeAreaView` em `src/components/Screen/index.tsx`, `src/features/sessions/**`; `AppHeader` em `src/components/ds/AppHeader.tsx` (`paddingTop: 24`, **sem** `insets.top`).
- **Testes automatizados que cobrem:** nenhum cobre teclado/área segura nativos (os testes só renderizam).
- **Se falhar:**
  1. Teclado cobre o campo no iOS → faltam `KeyboardAvoidingView`/`keyboardShouldPersistTaps` nas telas de Perfil, Anamnese, Modelos e Planos; abrir tarefa.
  2. Cabeçalho sob a barra de status/ilha → o `AppHeader` não usa `insets.top`; no Android (edge-to-edge) e no iOS com entalhe isso pode acontecer — **verificar** (a V1 validada no emulador não o relatou).
  3. Barra de abas sob a barra de gestos → `BottomNav` usa `insets.bottom`; confira `SafeAreaProvider`.
- **Evidência:** capturas dos formulários com o teclado aberto e do topo/base de uma tela.

#### DEV-09 — Sessão, token e armazenamento seguro (`expo-secure-store`, `expo-sqlite`)

- **Prioridade / AC:** P1 · AC-QA-04-01 (G-41)
- **Objetivo:** o login persiste entre aberturas, e sair limpa token e cache, no aparelho real.
- **Pré-condição:** conta de teste.
- **Passos:** entrar → fechar o app (remover da lista de recentes) → reabrir; depois **"Sair"** → "Confirmar saída" → reabrir.
- **Resultado esperado:**
  - **Android e iOS:** reabrir mantém a sessão (vai direto à Início, com os dados do cache e a atualização da rede); depois de sair, reabrir mostra o **Login** e nenhum dado da conta anterior.
  - **Rede:** `GET /educator/me → 200` ao reabrir com sessão; sem sessão, nenhuma chamada autenticada.
- **Onde está no código:** `src/features/auth/token-storage.ts` (`SecureStore.getItemAsync/setItemAsync`); `src/stores/auth.ts`; `src/storage/mmkv.ts` e `src/storage/encryption-key.ts` (chave no SecureStore, cache em `expo-sqlite/kv-store` cifrado, G-41);
  `src/api/query-persister.ts` (cache por `educatorId`); `src/features/auth/useSessionGuard.ts`.
- **Testes automatizados que cobrem:** `src/stores/__tests__/auth.test.ts`; `src/api/__tests__/query-persister.test.ts`; `src/storage/__tests__/mmkv.test.ts`, `encryption-key.test.ts`. Rodar: `pnpm exec vitest run src/stores/__tests__/auth.test.ts src/api/__tests__/query-persister.test.ts --maxWorkers=1`.
- **Se falhar:**
  1. Sessão perdida ao reabrir → `SecureStore` não gravou o token (Expo Go no iOS usa o Keychain do Expo Go); `hydrate` em `auth.ts`.
  2. Dados da conta anterior aparecem após sair/entrar em outra conta → o cache persistido não foi limpo/ficou com outro `educatorId` (`query-persister.ts`).
  3. Erro ao abrir o cache → chave de cifra ausente (`encryption-key.ts`); desinstalar/limpar o Expo Go cria uma chave nova (esperado).
- **Evidência:** capturas da Início ao reabrir e do Login após sair.

#### DEV-10 — Conectividade (`NetInfo`) e backend no aparelho

- **Prioridade / AC:** P2 · AC-QA-04-01
- **Objetivo:** o aviso offline aparece e some corretamente no aparelho (modo avião, Wi‑Fi↔dados).
- **Pré-condição:** Agenda e lista de planos já carregadas.
- **Passos:** ligar o modo avião → abrir Agenda e Planos; desligar e conferir a recuperação; trocar de Wi‑Fi para dados móveis com o app aberto.
- **Resultado esperado:**
  - **Android e iOS:** faixa **"Sem conexão - mostrando dados salvos"** com os dados do cache; ao voltar a rede, a faixa some e as listas refazem; ações de escrita offline mostram erro sem travar.
  - **Rede:** retomada das chamadas `GET /appointment/`, `GET /plan/` ao voltar.
- **Onde está no código:** `src/hooks/useOnline.ts` e `connectOnlineManagerToNetInfo` (`@react-native-community/netinfo`); `src/api/query-client.ts` (`networkMode: "online"`, `withOfflineGuard`); `PendingBanner` em `src/components/PendingBanner/`.
- **Testes automatizados que cobrem:** `src/hooks/__tests__/useOnline.test.tsx`; `src/api/__tests__/query-client.test.ts`. Rodar: `pnpm exec vitest run src/hooks/__tests__/useOnline.test.tsx --maxWorkers=1`.
- **Se falhar:** faixa não aparece → `NetInfo` não notificou (Expo Go); a faixa não some → o `onlineManager` ficou `offline`; `isInternetReachable` nulo em redes que filtram (verificar).
- **Evidência:** capturas offline e online.

#### DEV-11 — `Alert` e `Modal` nativos

- **Prioridade / AC:** P2 · AC-QA-04-01
- **Objetivo:** os diálogos do app (sair, excluir, cancelar atendimento, encerrar plano, descartar rascunho) se comportam em cada plataforma.
- **Passos:** acionar "Sair" (Perfil), "Excluir atendimento"/"Cancelar atendimento" (Detalhe do atendimento), "Excluir modelo" (Modelos de anamnese), "Encerrar plano" (Detalhe do plano), voltar com rascunho (Gerar plano).
- **Resultado esperado:**
  - **Android:** `Modal` do app (sair, atendimento, modelo) e `Alert` do sistema (plano); o botão **Voltar** do Android fecha o `Modal` (`onRequestClose`) e aciona `beforeRemove` no rascunho de plano.
  - **iOS:** os `Alert` aparecem como alertas do iOS (botão destrutivo em vermelho); os `Modal` cobrem a tela; **não há botão Voltar** — o gesto de voltar da navegação aciona `beforeRemove`.
- **Onde está no código:** `src/features/profile/ProfileScreen.tsx`, `src/features/agenda/detail/AppointmentDetailScreen.tsx`, `src/features/anamnese/templates/TemplateFormScreen.tsx` (`Modal`);
  `src/features/plans/detail/PlanDetailScreen.tsx` e `src/features/plans/generate/GeneratePlanScreen.tsx` (`Alert.alert`, `navigation.addListener("beforeRemove")`).
- **Testes automatizados que cobrem:** `ProfileLogout.test.tsx`, `AppointmentDetailScreen.test.tsx`, `PlanDetailScreen.test.tsx`, `GeneratePlanScreen.test.tsx`.
- **Se falhar:** o `Modal` não fecha com o gesto/Voltar → falta `onRequestClose` (os usados têm); `beforeRemove` não dispara no iOS → verificar o gesto de voltar do Expo Router.
- **Evidência:** capturas dos diálogos.

#### DEV-12 — Fonte do sistema e tema (iOS Dynamic Type, Android fonte grande)

- **Prioridade / AC:** P3 · AC-QA-04-01 (ver QA-03)
- **Objetivo:** o app não quebra com a fonte do sistema no máximo em cada plataforma.
- **Passos:** aumentar a fonte (Android: Tamanho da fonte; iOS: Tamanho do texto/Texto maior) e abrir Agenda, ficha, formulários e Planos.
- **Resultado esperado:** sem texto cortado nem sobreposto (checklist em [07-acessibilidade-qa03.md](07-acessibilidade-qa03.md)); o app é só **tema claro** (`userInterfaceStyle: "light"`) e **retrato**; o modo escuro do sistema **não** altera as cores.
- **Onde está no código:** `app.json` (`userInterfaceStyle`, `orientation`); `src/theme/typography.ts` (família por peso, FX4); achados em [07-acessibilidade-qa03.md](07-acessibilidade-qa03.md) §1.4.
- **Testes automatizados que cobrem:** `src/theme/__tests__/fonts.test.ts`, `tokens.test.ts`, `shape.test.ts` (tokens e fontes).
- **Se falhar:** corte da última letra no Android com `fontWeight` + fonte custom → armadilha FX4 (CONTEXTO §4); botões truncados → `numberOfLines={1}` no `DsButton`.
- **Evidência:** capturas em fonte máxima.

## 4. O que esperar no Expo Go (limitações conhecidas)

| Assunto                       | Comportamento no Expo Go                                                                                                                                    | Onde está documentado                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-print` + `expo-sharing` | O arquivo de `printToFileAsync` **não é legível**; o app regrava o base64 no cache (`sharePdfFromBase64`, G-45). `printAsync` funciona.                     | [COMPATIBILIDADE §9.6](../../bootstrap/COMPATIBILIDADE.md#96-instaladas-na-v1-e-comportamento-observado-no-expo-go-2026-10-09); G-45 em [GATES](../../entrega-1/GATES.md) |
| `expo-image-picker`           | Galeria validada no emulador (ATV-08); **câmera não testada** até esta rodada; permissões com os textos do Expo Go.                                         | COMPATIBILIDADE §9.6                                                                                                                                                      |
| `expo-document-picker`        | Seleção de áudio validada no emulador; documentos da anamnese ainda não exercitados em aparelho.                                                            | COMPATIBILIDADE §9.6                                                                                                                                                      |
| NativeWind + `Pressable`      | O `style` em função do `Pressable` é descartado; use `StaticPressable` (G-44).                                                                              | CONTEXTO §7                                                                                                                                                               |
| Texto do botão                | O Android guardava a largura medida durante o "carregando"; o `DsButton` remonta o rótulo.                                                                  | COMPATIBILIDADE §9.6                                                                                                                                                      |
| IA (timeout)                  | As rotas de IA levam 30–90 s (`AI_TIMEOUT_MS`, G-46).                                                                                                       | CONTEXTO §7                                                                                                                                                               |
| Metro                         | Reinicie com `--clear` ao trocar de branch; `pnpm install --frozen-lockfile` antes de subir.                                                                | CONTEXTO §7                                                                                                                                                               |
| Permissões do `app.json`      | `photosPermission`/`cameraPermission` só valem num **build**; no Expo Go valem os textos do Expo Go.                                                        | `app.json` (plugin `expo-image-picker`)                                                                                                                                   |
| iOS                           | O Expo Go do iOS precisa de iPhone (sem iPhone/Mac, as linhas de iOS ficam **N/A pendente**); build local de iOS exige Mac/Xcode, o caminho é o EAS (G-01). | COMPATIBILIDADE §2                                                                                                                                                        |

## 5. Resultado da rodada (QA-04)

| Item                                    | Android físico | iOS | Observações / pendência |
| --------------------------------------- | -------------- | --- | ----------------------- |
| DEV-01 Câmera e galeria                 |                |     |                         |
| DEV-02 Áudio                            |                |     |                         |
| DEV-03 Seletor de documento             |                |     |                         |
| DEV-04 PDF (imprimir e enviar)          |                |     |                         |
| DEV-05 WhatsApp                         |                |     |                         |
| DEV-06 Compartilhar o rascunho do plano |                |     |                         |
| DEV-07 Fuso e seletores de data/hora    |                |     |                         |
| DEV-08 Teclado e área segura            |                |     |                         |
| DEV-09 Sessão, token e armazenamento    |                |     |                         |
| DEV-10 Conectividade                    |                |     |                         |
| DEV-11 `Alert` e `Modal`                |                |     |                         |
| DEV-12 Fonte do sistema e tema          |                |     |                         |

Aparelho Android: ______ · Android: ______ · iPhone: ______ · iOS: ______ · Expo Go (versão): ______ · Commit testado: ______ · Data: ______
Itens **não testados** aparecem como **pendência** (AC-QA-04-01), nunca como aprovados; o resultado entra no TRACKING e no [QA-05-RELATORIO](../../entrega-2/QA-05-RELATORIO.md) ("Entrega 3").
