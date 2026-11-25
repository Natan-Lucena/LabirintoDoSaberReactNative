# ATV-05 — Imprimíveis

> Refino da ficha [ATV-05 do BACKLOG](../BACKLOG.md#atv-05--imprimíveis), escrito em 2026-11-24 a
> partir do código da `main` (`3588b78`). Plano da entrega em [PLANO](../PLANO.md). Conteúdo
> proposto na [especificação §2.2](../ESPECIFICACAO-BACKEND.md#22-entidades); a API-06 confirma.

| Campo           | Valor                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-4                                                                                                                                                    |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio (HTML puro e o caminho de PDF que já existe)                                                             |
| Estimativa      | M · 5 h de worker                                                                                                                                       |
| Dependências    | ATV-09 na `main` (`navigation.ts` e `TaskDetailScreen`); API-07 leva 1 (`PrintableContent` e mocks); G-66; G-34 e G-45                                  |
| Backend         | Leva 1 (§2). Mock-first; vai para a `main` depois da ATV-09 (que espera a leva 1)                                                                       |
| Dona nesta onda | `src/features/activities/printable/**` (novo), `app/activities/print/[id].tsx` (novo), `src/features/activities/navigation.ts`, o "Imprimir" no detalhe |

## 1. Objetivo e valor

História **US2-10**. Parte do trabalho psicopedagógico é no papel: a ficha para a criança fazer
em casa ou na escola. O imprimível do design ("Complete a sequência · Imprimível") vira um PDF
limpo, gerado no aparelho (G-66), que o profissional imprime ou envia ao responsável.

## 2. Referência de design

- Figma Make: só a miniatura "Complete a sequência · Imprimível" (ícone `print`) no
  `.activity-grid`. A tela de prévia não tem desenho: segue o padrão da prévia de relatório
  (`ReportPreviewScreen`, `.paper-preview` da REL-02): folha branca com sombra `shape.shadow.sm`,
  "Imprimir" e "Compartilhar PDF".
- Lacuna do conector Figma: ver [ATV-04a §2](ATV-04a.md#2-referência-de-design).

## 3. Fluxo do usuário

Entradas:

- Banco ou "Ver todas" → cartão de um imprimível → **direto** a `/activities/print/[id]` (esta
  tarefa altera `taskDestination` em `src/features/activities/navigation.ts`).
- Recomendado → "Iniciar atividade" num imprimível → mesmo destino.
- Detalhe de um imprimível (`/content/task/[id]`) → botão **"Imprimir"** (ícone `print`) no lugar
  de "Jogar" → `/activities/print/[id]`.

Tela `PrintableScreen` (`SafeAreaView` `edges={["left","right","bottom"]}` + `AppHeader`
"Imprimível" com o título como subtítulo, `onBack={router.back}`):

1. `Field` "Nome da criança (opcional)", até 40 caracteres, com o texto de apoio "Aparece só no
   PDF; não é salvo."
2. Prévia da folha (`PrintablePreview`, componentes nativos, não WebView): título, linha "Nome:"
   (preenchida ou em branco) e "Data: _**/**_/_____", instruções, itens no `layout`.
3. `DsButton` "Imprimir" → diálogo de impressão do sistema (`Print.printAsync`).
4. `DsButton` "Compartilhar PDF" (`variant="secondary"`) → gera o PDF e abre o compartilhamento.
5. Voltar descarta o nome digitado.

## 4. Estados

| Estado                  | Comportamento e texto                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Carregando              | `LoadingState` "Carregando atividade" (como o `ActivityPlayScreen`)                              |
| `404 TASK_NOT_FOUND`    | "Atividade não encontrada." + "Voltar"                                                           |
| Outro erro              | "Não foi possível carregar a atividade." + "Tentar novamente"                                    |
| Não é imprimível        | `type !== "printable"` ou sem `content`: "Esta atividade não é imprimível." + "Voltar"           |
| Gerando PDF             | Botões desabilitados; o botão tocado com `loading`                                               |
| Falha ao imprimir/gerar | Toast "Não foi possível gerar o PDF. Tente novamente."; cancelar o diálogo do sistema não é erro |
| Offline                 | A tela usa o cache da tarefa (`["task", id]`); imagens remotas podem não aparecer no PDF (§11)   |
| Sucesso                 | Nada a mostrar além do diálogo do sistema                                                        |

## 5. Contrato de dados

- `GET /task/:id` por `getTaskById` (query key `["task", id]`, compartilhada com o detalhe).
- Nenhuma escrita. O nome da criança **não** vai para o servidor, para o cache do TanStack Query
  nem para o armazenamento local: é estado do componente.

```ts
interface PrintableContent {
  kind: "printable";
  title: string; // 1–80
  instructions: string; // 1–500
  layout: "LIST" | "GRID" | "SEQUENCE";
  items: {
    id: string;
    text?: string;
    imageUrl?: string;
    answerLines?: number;
  }[]; // 1–20
}
```

## 6. Regras de negócio e casos de borda

1. **HTML puro e escapado**: `buildPrintableHtml(content, { childName? })` em
   `printable/printableHtml.ts`, usando o `escapeHtml` de
   `src/features/reports/session/sessionReport.ts` em todo texto (título, instruções, itens,
   nome).
2. **Layouts**: `LIST` = lista numerada, um item por linha; `GRID` = tabela de 2 colunas;
   `SEQUENCE` = itens em linha separados por "→", com quebra quando não cabem.
3. **Linhas de resposta**: `answerLines` (0–5) linhas de 28 px com borda inferior embaixo do item;
   ausente = 0.
4. **Imagem do item**: `<img>` com largura máxima de 160 px; item sem texto e sem imagem (dado
   fora do contrato) é ignorado.
5. **Página A4**, margens de 16 mm, fonte sem serifa de 14 pt, título 20 pt; sem logo, sem dado
   do profissional.
6. **Nome da criança**: só no PDF, nunca no nome do arquivo (o arquivo se chama
   `atividade-imprimivel.pdf`).
7. **Arquivo temporário** apagado depois de compartilhar: `sharePdfFromBase64(base64,
"atividade-imprimivel.pdf", { deleteAfterShare: true })` (G-45: o PDF é regravado a partir do
   base64 porque o arquivo do `expo-print` não é legível no Expo Go).
8. O imprimível nunca é "jogado": não entra no motor nem na sessão (a EVO-03 filtra).

## 7. Plano de implementação

1. `src/features/activities/printable/printableHtml.ts`: `buildPrintableHtml`.
2. `src/features/activities/printable/pdf.ts`: `printPrintable(content, childName?)`
   (`Print.printAsync({ html })`) e `sharePrintablePdf(content, childName?)`
   (`Print.printToFileAsync({ html, base64: true })` + `sharePdfFromBase64` com
   `deleteAfterShare`), espelhando `src/features/reports/document/pdf.ts`.
3. `src/features/activities/printable/PrintablePreview.tsx` e `PrintableScreen.tsx`.
4. `app/activities/print/[id].tsx` (novo): lê `id` com `useLocalSearchParams` e renderiza a tela.
5. `src/features/activities/navigation.ts`: `taskDestination` devolve `/activities/print/[id]`
   quando `format === "PRINTABLE"` (ou `type === "printable"`).
6. `src/features/content-detail/task/TaskDetailScreen.tsx`: botão "Imprimir" para o imprimível.
7. Testes: `printableHtml` (UT) e o destino do imprimível (UT de `navigation.ts`). Mockar
   `expo-print` e `expo-sharing` como em `src/features/reports/**/__tests__`.

## 8. Arquivos

- **Permitidos:** `src/features/activities/printable/**` (novo), `app/activities/print/[id].tsx`
  (novo), `src/features/activities/navigation.ts`,
  `src/features/content-detail/task/TaskDetailScreen.tsx` (só o botão), testes ao lado.
- **Proibidos:** `src/features/reports/**` (só importar `escapeHtml` e `sharePdfFromBase64`),
  `src/features/activities/ActivitiesScreen.tsx` (o destino passa por `navigation.ts`),
  `src/api/**`, `package.json` (`expo-print` e `expo-sharing` já estão instalados).

## 9. Critérios de aceite

| ID           | Critério                                                                                         | Verif.       |
| ------------ | ------------------------------------------------------------------------------------------------ | ------------ |
| AC-ATV-05-01 | O HTML tem o título, as instruções e todos os itens, no layout do conteúdo, com o texto escapado | `UT`         |
| AC-ATV-05-02 | O PDF imprime e é compartilhado no Expo Go (Android); o arquivo temporário é apagado             | `MAN`        |
| AC-ATV-05-03 | O nome da criança aparece só no PDF e não é enviado nem salvo                                    | `UT` + `REV` |
| AC-ATV-05-04 | O cartão de um imprimível abre a prévia, não o jogo                                              | `UT`         |

## 10. Como testar manualmente (Victor)

Expo Go Android, backend real com a leva 1 (antes, modo mock).

1. Atividades → "Imprimíveis" → "Complete a sequência": abre a prévia, com "Nome:" em branco.
2. Digite "Criança Teste" no nome: a prévia mostra o nome.
3. "Imprimir": abre o diálogo de impressão do Android (pode escolher "Salvar como PDF").
4. "Compartilhar PDF": abre o compartilhamento; envie para o Drive ou e-mail de teste; o PDF tem
   o nome e os itens na disposição certa.
5. Volte e entre de novo: o nome está em branco.
6. Abra um imprimível com imagens: as imagens aparecem no PDF (se não, registre no teste).

## 11. Riscos e perguntas em aberto

- **Imagens remotas no `expo-print`**: o Android carrega `<img src="https://…">` no WebView de
  impressão, mas pode gerar o PDF antes de a imagem chegar. Se acontecer no teste manual, o
  plano B (sem dependência nova) é baixar cada imagem com `expo-file-system` e embutir como
  `data:` base64 antes de gerar o HTML; registrar o resultado no PR.
- **G-66** (proposta): se o backend preferir guardar um PDF pronto, esta tarefa vira "baixar e
  compartilhar" (como a REL-02 da Entrega 2 previa).
- Nome da criança em PDF compartilhado é dado pessoal: o profissional decide; o app não guarda.

## 12. Fora do escopo

Editor do imprimível (ATV-11), imprimível em sessão ou caderno (AT-10), modelos visuais
diferentes por tema, cabeçalho com logo da clínica.
