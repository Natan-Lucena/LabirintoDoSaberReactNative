# Testes manuais — Acessibilidade (QA-03)

Detalhamento do checklist de acessibilidade do [PLANO-TESTES](../PLANO-TESTES.md) §5 e da ficha
[QA-03](../BACKLOG.md#qa-03--acessibilidade): TalkBack, fonte grande, contraste e alvos de toque,
**tela por tela**. Cada tela traz os `accessibilityLabel`/`accessibilityRole` que **existem** no código, os
elementos interativos **sem rótulo ou com rótulo ambíguo** encontrados **por leitura do código**, os riscos de
fonte grande, os pares de contraste e as medidas dos alvos, o resultado esperado e, se falhar, o componente a
corrigir.

> **Estado:** roteiro escrito **sem abrir o emulador, o Metro nem o app**; nada foi executado. Os achados
> abaixo vêm da leitura do código (2026-10-29) e dos valores de `src/theme/` — são **suspeitas verificáveis**,
> não falhas confirmadas. A rodada confirma ou descarta cada uma em aparelho.

## Escopo, referências e como medir

- **Telas:** as 16 telas da Entrega 3 (antiga tabela do PLANO-TESTES §5, substituída por este arquivo) (Agenda, Novo/Editar/Remarcar/Reativar atendimento, Detalhe
  do atendimento, Início, Novo/Editar paciente, Ficha com abas, Anamnese, Modelos de anamnese, Perfil, Recursos,
  Detalhe da atividade, Detalhe do grupo e do caderno, Planos: lista, gerar e rascunho, detalhe, sugestões).
- **Referências:** G-17 (tokens: alvo mínimo `shape.minTouchTarget` = **48**; o PLANO-TESTES adota **44 pt** como
  limite de aprovação — registre as medidas entre 44 e 47 como "observação", não falha), G-42 (botão primário:
  texto branco sobre `brand-700`) e G-44 (`StaticPressable`), em [GATES](../../entrega-1/GATES.md).
  Armadilha de texto: **CONTEXTO §4 / FX4** — corte da última letra no Android com `fontWeight` + fonte custom
  ([CONTEXTO-SESSAO](../../CONTEXTO-SESSAO.md)).
- **Como testar:**
  1. **TalkBack:** Configurações → Acessibilidade → TalkBack. Percorra com deslizar para a direita/esquerda; toque duplo
     ativa. Anote a **ordem de foco**, o **texto lido** de cada elemento e se o **papel** (botão, aba, caixa de seleção,
     alerta) é anunciado. Para cabeçalhos, use a navegação por cabeçalhos do TalkBack.
  2. **Fonte grande:** Configurações → Tela → Tamanho da fonte (máximo) e, se houver, Tamanho de exibição (máximo). Abra cada tela e role.
  3. **Contraste:** a coluna "Contraste calculado" abaixo usa a fórmula WCAG de `src/theme/contrast.ts` › `getContrastRatio`
     (mínimo **4,5:1** para texto normal e **3:1** para texto grande e ícones). Confirme visualmente os pares marcados "verificar".
  4. **Alvo 44 pt:** Opções do desenvolvedor → "Mostrar limites de layout" e meça com a régua do emulador, ou use o
     **Accessibility Scanner** (se disponível). Considere `hitSlop` (aumenta a área de toque, não a visual).
- **Cenários de mock úteis:** com `EXPO_PUBLIC_USE_MOCKS=true` há dados para quase todas as telas (atendimentos,
  pacientes, planos, sugestões); estados de erro/vazio ficam em [src/mocks/README.md](../../../src/mocks/README.md).
  A acessibilidade **não** depende do backend; os mocks bastam (a QA-03 pode rodar sem rede).
- **Testes automatizados:** nenhum cobre TalkBack real. Os testes de tela conferem **rótulos** por `getByLabelText`/`getByRole`; rode,
  por exemplo, `pnpm exec vitest run src/features/agenda/__tests__/AgendaScreen.test.tsx --maxWorkers=1`.

## 1. Inventário global (componentes do design system)

Tudo em `src/components/ds/`. Os componentes abaixo concentram quase todos os achados: corrigi-los uma vez corrige
todas as telas.

### 1.1 Rótulos e papéis que existem

| Componente (arquivo)                        | Papel (`accessibilityRole`)    | Rótulo (`accessibilityLabel`)                                           | Estado / outros                                                |
| ------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `DsButton` (`DsButton.tsx`)                 | `button`                       | `accessibilityLabel ?? label`                                           | `accessibilityState={{ disabled, busy }}`; `numberOfLines={1}` |
| `IconButton` (`IconButton.tsx`)             | `button`                       | **obrigatório** (`accessibilityLabel: string`)                          | `disabled`                                                     |
| `BackButton` (`BackButton.tsx`)             | `button`                       | "Voltar" (padrão)                                                       | —                                                              |
| `AppHeader` (`AppHeader.tsx`)               | `header` no título             | sino: "Notificações" (só sem `onBack`)                                  | título e subtítulo com `numberOfLines={1}`                     |
| `Tabs` (`Tabs.tsx`)                         | `tab`                          | `option.label`; o grupo recebe `accessibilityLabel` do chamador         | `selected`, `disabled`                                         |
| `SegmentedControl` (`SegmentedControl.tsx`) | `radio`                        | `option.label`; o grupo recebe `accessibilityLabel` do chamador         | `selected`, `disabled`                                         |
| `FilterRow`/`FilterChip` (`FilterChip.tsx`) | `button`                       | `label`                                                                 | `selected`, `disabled`                                         |
| `Checkbox`/`CheckList` (`Checkbox.tsx`)     | `checkbox`                     | `label`                                                                 | `checked`, `disabled`                                          |
| `Switch` (`Switch.tsx`)                     | `switch`                       | `accessibilityLabel` opcional                                           | `checked`, `disabled`                                          |
| `Field` (`Field.tsx`)                       | (campo de texto)               | `accessibilityLabel ?? label`; `accessibilityHint={error}`              | erro com `alert` + `accessibilityLiveRegion="polite"`          |
| `DateField`, `TimeField`, `SelectField`     | `button`                       | `accessibilityLabel ?? label`; `accessibilityHint={error}`              | `disabled`; erro com `alert` + live region                     |
| `SelectField` (folha de opções)             | `button`                       | fundo: "Fechar"; cada opção: o texto da opção                           | `selected` na opção atual                                      |
| `InfoCard`, `FeatureRow`, `InsightCard`     | `button` (quando há `onPress`) | **`accessibilityLabel ?? title`** (ver achado G7)                       | —                                                              |
| `ProgressBar` (`ProgressBar.tsx`)           | `progressbar`                  | **obrigatório**                                                         | `accessibilityValue={{ min:0, max:100, now }}`                 |
| `Toast` (`Toast.tsx`)                       | `alert`                        | o texto da mensagem                                                     | `accessibilityLiveRegion="polite"`                             |
| `Avatar` (`Avatar.tsx`)                     | (acessível)                    | o nome                                                                  | —                                                              |
| `SearchField` (`SearchField.tsx`)           | (campo)                        | `accessibilityLabel ?? placeholder ?? "Buscar"`; limpar: "Limpar busca" | —                                                              |
| `SectionTitle` (`SectionTitle.tsx`)         | **nenhum** no título           | ação: o `actionLabel`                                                   | ver achado G6                                                  |
| `Timeline` (`Timeline.tsx`)                 | `button` só na ação            | ação: o `actionLabel` (ex.: "Lembrete")                                 | —                                                              |
| `BottomNav` (`BottomNav.tsx`)               | (itens)                        | o rótulo do item                                                        | `fontSize: 10`, `numberOfLines={1}`                            |

Outros: `StaticPressable` repassa as props de acessibilidade (G-44). Alertas do sistema (`Alert.alert`) e
`Modal` do React Native são nativos; no Android o foco fica preso no diálogo. Nenhum componente do app usa
`accessibilityViewIsModal`, `allowFontScaling` ou `maxFontSizeMultiplier` (a fonte **escala por padrão**).

### 1.2 Alvos de toque (altura × largura, em pt)

| Componente                                                  | Medida no código                                | Avaliação (limite 44; G-17 = 48)                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `DsButton`                                                  | `minHeight: 44` (`fullWidth`: 50)               | OK em 44; **abaixo de 48** (G-17)                                                                            |
| `BackButton`                                                | 40 × 40                                         | **Abaixo de 44**                                                                                             |
| `IconButton`                                                | 42 × 42                                         | **Abaixo de 44** (setas da Agenda, "Contatar responsável" na ficha, sino)                                    |
| `Tabs`                                                      | `height: 43`, `flex: 1`                         | **Abaixo de 44** por 1 pt                                                                                    |
| `SegmentedControl`                                          | `height: 39` por segmento                       | **Abaixo de 44** ("Tipo de plano", "Duração de referência", "Gênero")                                        |
| `Checkbox` (linha)                                          | `minHeight: 43`                                 | 1 pt abaixo de 44 (cresce com texto longo)                                                                   |
| `Switch`                                                    | 44 × 26                                         | Altura 26: **verificar** o toque (não há `hitSlop`)                                                          |
| `FilterChip`                                                | `paddingVertical: 8` + texto 15 ≈ **31**        | **Abaixo de 44** (filtro "Todos/PDI/PE" dos Planos)                                                          |
| `SearchField`                                               | `height: 48`                                    | OK                                                                                                           |
| `SectionTitle` (ação), `Timeline` (ação), `InfoCard` (ação) | texto de 11–13 px + `hitSlop: 8`                | **Abaixo de 44** (≈ 31–33 pt): "Editar" da ficha, "Lembrete" da Início                                       |
| `Field`, `DateField`, `TimeField`, `SelectField`            | `minHeight: shape.minTouchTarget` (48)          | OK                                                                                                           |
| `BottomNav` (item)                                          | `minHeight: shape.minTouchTarget` (48)          | OK                                                                                                           |
| Chips de dia da Agenda                                      | `minHeight: 66`, largura `flex: 1` entre 7 dias | Largura ≈ `(largura − 40 − 30) / 7`: **≈ 45 pt a 360 dp**, **≈ 39 pt a 320 dp** — verificar em tela estreita |
| `Fab`                                                       | 54 × 54                                         | OK (não usado nas telas da Entrega 3)                                                                        |

### 1.3 Contraste dos tokens (calculado com `getContrastRatio`)

| Par (texto sobre fundo)                                            | Razão             | Resultado                           | Onde aparece                                                                                                                                        |
| ------------------------------------------------------------------ | ----------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text` `#173331` sobre `surface` `#ffffff`                         | 13,5:1            | OK                                  | corpo e títulos                                                                                                                                     |
| `textSecondary` `#5a7471` sobre `surface` / `background` `#f6faf9` | 5,03 / 4,79:1     | OK                                  | descrições, metas, textos de apoio                                                                                                                  |
| branco sobre `brand-700` `#116f69` (G-42)                          | 6,0:1             | OK                                  | botão primário, dia ativo da Agenda                                                                                                                 |
| `brand-700` sobre `brand-100` / `brand-50`                         | 5,15 / 5,62:1     | OK                                  | `Badge`, botão secundário/soft                                                                                                                      |
| `warningTextOnYellow` `#985c10` sobre `yellow` `#fff7d8`           | 5,05:1            | OK                                  | selo de plano encerrado                                                                                                                             |
| **`danger` `#d44c4c` sobre `surface` / `background`**              | **4,25 / 4,04:1** | **Abaixo de 4,5**                   | **todas as mensagens de erro** (`Field`, `DateField`, `TimeField`, `SelectField` e `styles.error` das telas)                                        |
| `dangerTextOnSurface` `#c53b3b` sobre `surface`                    | 5,17:1            | OK                                  | token existente, **não usado** pelos componentes de erro                                                                                            |
| **`brand-600` `#168d84` sobre `surface` / `background`**           | **4,06 / 3,86:1** | **Abaixo de 4,5**                   | ações de texto: "Editar" (`SectionTitle`), links                                                                                                    |
| **`ink-500` `#748b88` sobre `surface` / `background`**             | **3,63 / 3,45:1** | **Abaixo de 4,5**                   | rótulo de aba inativa (`Tabs`), subtítulo do `AppHeader`, item inativo do `BottomNav`, placeholders de `DateField`/`SelectField`, dias de outro mês |
| `ink-300` `#b8c9c6` sobre branco                                   | 1,72:1            | decorativo                          | borda do `Checkbox`/`Switch` (não é texto; **3:1 para componentes de UI** não é atingido — verificar)                                               |
| **Estados desabilitados** (`opacity: 0.5`)                         | 2,0–2,2:1         | isento pela WCAG, mas **verificar** | `DsButton`, `Field`, `Tabs`, `SegmentedControl`                                                                                                     |
| **Item cancelado da Agenda** (`opacity: 0.48` no cartão inteiro)   | **1,9–2,7:1**     | **Falha provável**                  | `AgendaScreen.tsx` › `styles.cancelled`: o texto "Cancelado" e o nome ficam ilegíveis; é **informação**, não estado desabilitado                    |

### 1.4 Achados globais (suspeitas por leitura do código)

| #   | Achado                                                                                                                                                                                                                                                                                                                          | Onde corrigir                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G1  | **Erros em `color.danger` (4,25:1 / 4,04:1)**: abaixo de 4,5:1 em todo texto de erro.                                                                                                                                                                                                                                           | `Field.tsx`, `DateField.tsx`, `TimeField.tsx`, `SelectField.tsx` (`styles.error`) e `styles.error` das telas: usar `semanticColor.dangerTextOnSurface` |
| G2  | **`ink-500` como texto (3,63:1)** em abas inativas, subtítulo do cabeçalho, `BottomNav` e placeholders.                                                                                                                                                                                                                         | `Tabs.tsx` (`label`), `AppHeader.tsx` (`eyebrow`), `BottomNav.tsx`, `DateField.tsx`/`SelectField.tsx` (placeholder): usar `ink-600`                    |
| G3  | **Ação "Editar" (`brand-600`, 13 px, ≈ 33 pt)** na ficha: contraste 4,06:1 e alvo pequeno.                                                                                                                                                                                                                                      | `SectionTitle.tsx` (`action`: `brand-700` e `minHeight` 44)                                                                                            |
| G4  | **Alvos abaixo de 44:** `BackButton` 40, `IconButton` 42, `Tabs` 43, `SegmentedControl` 39, `FilterChip` ≈ 31, ações de texto ≈ 31–33.                                                                                                                                                                                          | cada componente do §1.2: `minHeight`/`minWidth` 44 (ou `hitSlop`)                                                                                      |
| G5  | **`numberOfLines={1}` em `DsButton`, `AppHeader` e `BottomNav`**: com fonte máxima, textos longos ("Salvar e atualizar prontuário", "Gerar planejamento com IA", "Enviar lembrete pelo WhatsApp", título do plano) viram reticências; o **rótulo de acessibilidade** continua completo, mas o texto visível some.               | `DsButton.tsx` (`numberOfLines`), `AppHeader.tsx`, `BottomNav.tsx`: permitir 2 linhas ou reduzir o texto                                               |
| G6  | **`SectionTitle` sem `accessibilityRole="header"`**: o TalkBack não navega por cabeçalhos nas seções (Metas, Revisões, Sugestões da IA, "PDI vigente", "Próxima sessão"…).                                                                                                                                                      | `SectionTitle.tsx` (`accessibilityRole="header"` no título; o `SectionHeader` legado já tem)                                                           |
| G7  | **`InfoCard`, `FeatureRow` e `InsightCard` leem só o `title`** quando o chamador não passa `accessibilityLabel`: o **subtítulo/descrição se perde** no TalkBack.                                                                                                                                                                | passe `accessibilityLabel` completo nas telas (como `PlansHubScreen` e `PatientPlans` já fazem) **ou** componha título + descrição no componente       |
| G8  | **Rótulos ambíguos:** vários botões com o mesmo nome na mesma tela ("Remover" das perguntas, "Adicionar opção", "Lembrete", "Editar").                                                                                                                                                                                          | telas indicadas nos casos abaixo (acrescentar `accessibilityLabel` com o índice/contexto)                                                              |
| G9  | **FX4 (fontWeight + fonte custom):** nenhuma tela da Entrega 3 usa `fontWeight`; só os componentes legados `src/components/Avatar/index.tsx`, `src/components/StepIndicator/index.tsx` e `src/features/students/StudentRow.tsx` (não usados pelas telas novas). A tipografia usa a família do peso (`src/theme/typography.ts`). | nada a corrigir nas telas; confirme visualmente o corte da última letra em fonte grande                                                                |
| G10 | **Texto pequeno (10–12 px)** em `Tabs`, `Badge`, `FilterChip`, `BottomNav`, `Field` (rótulo 11 px), `Timeline`: com a fonte do sistema no máximo ficam legíveis, mas `Tabs` (`height: 43`) e `SegmentedControl` (`height: 39`) têm **altura fixa** e podem **cortar** ao quebrar em 2 linhas.                                   | `Tabs.tsx` e `SegmentedControl.tsx`: trocar `height` por `minHeight`                                                                                   |

---

## 2. Roteiro por tela

Formato de cada tela: **A** rótulos/papéis existentes; **B** elementos sem rótulo ou ambíguos; **C** passos de
TalkBack e resultado esperado; **D** fonte grande; **E** contraste; **F** alvos; **Se falhar** (componente a
corrigir) e **Evidência**. ID dos itens: `A11Y-<tela>-<TB|FG|CT|AL>`.

### Tela 1 — Agenda (`/(tabs)/agenda`)

Arquivos: `app/(tabs)/agenda.tsx` → `src/features/agenda/AgendaScreen.tsx` › `AgendaScreen`; testes:
`src/features/agenda/__tests__/AgendaScreen.test.tsx`.

- **A. Rótulos e papéis existentes:** setas da semana (`IconButton`): "Semana anterior" e "Próxima semana"; cada dia
  (`StaticPressable`, papel `button`, estado `selected`): "Hoje, 29 de outubro" / "30 de outubro"…; cada atendimento
  (`StaticPressable`, `button`): `"{hh:mm}, {paciente}, {duração} min · {tipo}[, Concluído|, Cancelado]"`; botão
  **"Novo atendimento"** (`DsButton`); aviso offline `PendingBanner` ("Sem conexão - mostrando dados salvos"); estados:
  "Carregando agenda...", erro com "Tentar de novo", "Nenhum atendimento neste dia".
- **B. Sem rótulo / ambíguo:** nenhum `Pressable` sem rótulo. O título "Agenda" é `Text` simples (**sem `header`**) e o
  eyebrow do mês ("outubro de 2026") vem **antes** do título (ordem de leitura: mês → "Agenda"). O contador
  `SectionTitle` ("N atendimentos") **não é cabeçalho** (G6). O texto visual "Concluído"/"Cancelado" dentro do cartão é
  lido de novo (já está no rótulo do cartão).
- **C. TalkBack (A11Y-AGE-TB):** percorra do topo: mês → "Agenda" → "Semana anterior" → intervalo da semana → "Próxima
  semana" → 7 dias (o ativo anuncia "selecionado") → contagem → atendimentos (um foco por cartão, com o rótulo completo)
  → "Novo atendimento". **Esperado:** ordem visual = ordem de foco; ao trocar de dia, o conteúdo muda sem o foco se perder;
  o item cancelado é anunciado "Cancelado".
- **D. Fonte grande (A11Y-AGE-FG):** o título (24 px) e o mês escalam; os **chips de dia** (7 em linha, `flex: 1`)
  recebem `dateLabel` e `dateNumber` — em fonte máxima o rótulo curto ("qua") pode **quebrar ou cortar**; `minHeight: 66` não
  limita a altura. Os cartões de atendimento (`minHeight: 80`) crescem. **Esperado:** sem texto cortado nem sobreposto; o botão
  "Novo atendimento" alcançável pela rolagem.
- **E. Contraste (A11Y-AGE-CT):** dia ativo (branco sobre `brand-700` 6,0:1) OK; rótulos `textSecondary` 4,79–5,03 OK; **item
  cancelado: texto a 48% de opacidade → 1,9–2,7:1 (falha provável)**; "Concluído" com ícone `brand-700` OK.
- **F. Alvos (A11Y-AGE-AL):** setas 42 pt (**G4**); chips de dia ≈ 45 pt de largura a 360 dp, ≈ 39 pt a 320 dp; cartão
  80 pt OK; "Novo atendimento" 50 pt OK.
- **Se falhar:** setas → `IconButton.tsx`; item cancelado → `AgendaScreen.tsx` (`styles.cancelled`: trocar `opacity`
  por cor de texto com contraste); chips → `AgendaScreen.tsx` (`styles.dateChip`, `strip`); título → `AppHeader`/`SectionTitle`.
- **Evidência:** gravação do TalkBack (ou notas da ordem), captura em fonte máxima, captura do item cancelado.

### Tela 2 — Novo atendimento / Editar / Remarcar / Reativar (`/agenda/new`, `/agenda/[id]/edit`)

Arquivos: `app/agenda/new.tsx`, `app/agenda/[id]/edit.tsx` → `src/features/agenda/form/AppointmentFormScreen.tsx`;
testes: `src/features/agenda/form/__tests__/AppointmentFormScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` (título "Novo atendimento"/…; subtítulo "Agendamento"; voltar "Voltar");
  `SelectField` "Paciente"; `DateField` "Data"; `TimeField` "Horário" (cada um `button` com o rótulo e
  `accessibilityHint={error}`); botão **"Ver atendimento"** (`DsButton`) no conflito; `Field` "Tipo de atendimento",
  "Duração (minutos)", "Observação"; botão de envio (`copy[mode].submit`, ex.: "Agendar atendimento"); erro geral com
  `accessibilityRole="alert"`.
- **B. Sem rótulo / ambíguo:** os campos de data e hora abrem o **seletor nativo**; o valor lido pelo TalkBack é o texto
  exibido (confirme que o **valor** é anunciado, não só "Data"). "Ver atendimento" não diz **qual** atendimento (G8).
- **C. TalkBack (A11Y-AGF-TB):** ordem Paciente → Data → Horário → (Ver atendimento) → Tipo → Duração → Observação →
  enviar. **Esperado:** ao enviar vazio, os erros ("Selecione o paciente"…) são **anunciados** (live region) e o foco
  não se perde; o erro de conflito ("Já existe um atendimento nesse horário") é lido junto do campo de horário
  (`accessibilityHint`).
- **D. Fonte grande (A11Y-AGF-FG):** rótulos dos campos têm 11 px; `Field` multilinha (`minHeight: 110`) cresce; o rótulo "Duração
  (minutos)" pode quebrar; botão de envio com `numberOfLines={1}` (**G5**). **Esperado:** nada fora da tela; teclado
  não cobre o botão (use a rolagem).
- **E. Contraste (A11Y-AGF-CT):** erros em `danger` (**G1**, 4,25:1); valor do campo em `text`; placeholders/ícone
  de seta em `ink-500` (**G2**, 3,63:1).
- **F. Alvos (A11Y-AGF-AL):** campos 48 pt OK; botões 44/50 pt.
- **Se falhar:** erros → `Field.tsx`/`DateField.tsx`/`TimeField.tsx`/`SelectField.tsx` (`styles.error`); valor do campo
  não anunciado → `DateField.tsx`/`TimeField.tsx` (`accessibilityLabel`/`accessibilityValue`); "Ver atendimento" →
  `AppointmentFormScreen.tsx` (acrescentar o horário do conflito ao rótulo).
- **Evidência:** notas de leitura do TalkBack nos 3 campos; captura com erro.

### Tela 3 — Detalhe do atendimento (`/agenda/[id]`)

Arquivos: `app/agenda/[id].tsx` → `src/features/agenda/detail/AppointmentDetailScreen.tsx`; testes:
`src/features/agenda/detail/__tests__/AppointmentDetailScreen.test.tsx`.

- **A. Rótulos e papéis:** paciente (`StaticPressable`, `button`, rótulo = nome; `minHeight: 44`); selo de status (`Badge`);
  linhas "Data", "Horário", "Tipo", "Duração", "Observação" (`Row`: texto rótulo + valor); ações (`DsButton`): "Iniciar
  sessão", "Enviar lembrete pelo WhatsApp", "Marcar como concluído", "Remarcar", "Editar", "Cancelar atendimento",
  "Reativar", "Editar observação", "Excluir atendimento"; diálogo (`Modal`): título "Excluir atendimento?" /
  "Cancelar atendimento?", texto, "Manter" e "Excluir"/"Sim, cancelar"; `Toast` ("Atendimento excluído"…, papel `alert`);
  estados "Atendimento não encontrado" + "Voltar", erro com "Tentar de novo".
- **B. Sem rótulo / ambíguo:** o título do diálogo é `Text` simples (**sem `header`**); o `Modal` não usa
  `accessibilityViewIsModal` (no Android o foco fica no diálogo; **confirme** que o TalkBack não lê a tela de trás). O ícone
  de "desabilitado" do lembrete sem telefone: o motivo ("Paciente sem telefone cadastrado") é texto visível — confirme que o TalkBack o lê.
- **C. TalkBack (A11Y-AGD-TB):** ordem Paciente → status → Data → Horário → Tipo → Duração → Observação → ações. **Esperado:**
  botão desabilitado anunciado "desabilitado"; ao abrir o diálogo, o foco vai para o título/primeiro botão; **"Manter"
  fecha** e devolve o foco; o toast "Atendimento excluído" é anunciado sozinho.
- **D. Fonte grande (A11Y-AGD-FG):** textos dos botões longos ("Enviar lembrete pelo WhatsApp") com `numberOfLines={1}` (**G5**);
  diálogo com duas ações lado a lado: com fonte máxima podem **estourar a largura** (verificar `dialogActions`).
- **E. Contraste (A11Y-AGD-CT):** erro em `danger` (**G1**); status "Pendente" em `Badge` OK; texto de apoio `textSecondary` OK.
- **F. Alvos (A11Y-AGD-AL):** botões 44–50 pt; paciente 44 pt OK.
- **Se falhar:** diálogo → `AppointmentDetailScreen.tsx` (`Modal`: acrescentar `accessibilityViewIsModal` e `accessibilityRole="header"` no
  título); botões truncados → `DsButton.tsx`.
- **Evidência:** notas do foco no diálogo; captura em fonte máxima.

### Tela 4 — Início (`/(tabs)/index`) — lembrete e cartão de sugestões

Arquivos: `app/(tabs)/index.tsx` → `src/features/home/HomeScreen.tsx`; testes: `src/features/home/__tests__/HomeScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` ("Olá, {nome}" + data); linha do tempo (`Timeline`): ação **"Lembrete"** (`button`, `hitSlop: 8`);
  "Ver ficha" e **"Iniciar sessão"** (`DsButton`); "Ver agenda"; cartão `InsightCard` ("N sugestões da IA para revisar"; rótulo = título);
  "Acesso rápido": "Novo paciente", "Criar plano", "Aplicar escala", "Atividades" (`QuickAccess`, `button`, rótulo = o texto).
- **B. Sem rótulo / ambíguo:** **"Lembrete"** repete-se em cada atendimento pendente, **sem dizer de quem** (G8); o `InsightCard` lê só o
  título (o texto "Veja o que a IA propõe…" se perde, G7).
- **C. TalkBack (A11Y-HOM-TB):** ordem saudação → agenda de hoje (hora, título, "Lembrete") → … → cartão de sugestões → "Acesso rápido". **Esperado:** "Lembrete"
  de cada item distinguível (hoje **falha provável**: todos se chamam "Lembrete").
- **D. Fonte grande (A11Y-HOM-FG):** `Timeline` usa 11–13 px; os botões lado a lado ("Ver ficha"/"Iniciar sessão") podem quebrar;
  a grade "Acesso rápido" (`quickGrid`) pode cortar rótulos.
- **E. Contraste (A11Y-HOM-CT):** ação "Lembrete" em `brand-700` OK; subtítulos `ink-600` OK.
- **F. Alvos (A11Y-HOM-AL):** "Lembrete" ≈ 31 pt de altura (**G4**); demais OK.
- **Se falhar:** `Timeline.tsx` (ação: `accessibilityLabel` com paciente/hora e `minHeight` 44) e `HomeScreen.tsx` (`actionLabel`).
- **Evidência:** notas de leitura de dois "Lembrete".

### Tela 5 — Novo paciente / Editar paciente (`/patients/new`, `/patients/[id]/edit`)

Arquivos: `app/patients/new.tsx`, `app/patients/[id]/edit.tsx` → `src/features/patients/form/PatientFormScreen.tsx`; testes:
`src/features/patients/form/__tests__/PatientFormScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` ("Editar paciente"/"Novo paciente", subtítulo "Informações iniciais"); `Field` com
  `accessibilityLabel`: "Nome completo", "Idade", "Telefone de contato", "Nome do responsável", "Telefone do responsável", "Parentesco", "CEP",
  "Rua", "Número", "Outra dificuldade"; `SegmentedControl` "Gênero" (papel `radio`); `CheckList` das dificuldades
  (papel `checkbox`); botão "Adicionar dificuldade"; envio "Salvar alterações"/"Salvar paciente"; erros com `alert`.
- **B. Sem rótulo / ambíguo:** a seção "Responsável (opcional)" é um `SectionTitle` (**sem `header`**, G6); dificuldades adicionadas
  entram como `Checkbox` (rótulo = texto). Sem elemento interativo sem rótulo.
- **C. TalkBack (A11Y-PAC-TB):** ordem Nome → Idade → Gênero → Telefone → Responsável (Nome, Telefone, Parentesco) → Endereço → Dificuldades → envio.
  **Esperado:** "Gênero" anuncia o grupo e "selecionado"; as dificuldades são "caixa de seleção, marcada/desmarcada"; erros
  ("Informe um telefone válido") são anunciados; o botão desabilitado ("Salvar alterações" sem mudanças) é "desabilitado".
- **D. Fonte grande (A11Y-PAC-FG):** `FieldGrid` (duas colunas: Idade/Gênero, CEP/Rua/Número) pode **apertar** em fonte máxima; o
  `SegmentedControl` (`height: 39`, **G10**) **corta** "Feminino"/"Masculino" se quebrar.
- **E. Contraste (A11Y-PAC-CT):** erros `danger` (**G1**); placeholders do campo (padrão do sistema) — verificar.
- **F. Alvos (A11Y-PAC-AL):** campos 48 pt; `SegmentedControl` 39 pt (**G4**); `Checkbox` 43 pt.
- **Se falhar:** `SegmentedControl.tsx` (`height` → `minHeight` 44), `FieldGrid.tsx`, `Field.tsx` (erro/placeholder).
- **Evidência:** capturas em fonte máxima; notas do TalkBack no "Gênero".

### Tela 6 — Ficha do paciente com abas (`/patients/[id]`)

Arquivos: `app/patients/[id].tsx` → `src/features/patients/detail/PatientDetailScreen.tsx`, `.../plans/PatientPlans.tsx`;
testes: `src/features/patients/detail/__tests__/PatientDetailScreen.test.tsx`,
`src/features/patients/detail/plans/__tests__/PatientPlans.test.tsx`.

- **A. Rótulos e papéis:** `Avatar` (nome); **"Contatar responsável"** (`IconButton`, `disabled` sem telefone); `Tabs` com
  `accessibilityLabel="Abas da ficha do paciente"` e abas "Visão geral" e "Planos" (papel `tab`, `selected`); "PDI vigente" (`SectionTitle`,
  `InfoCard` sem `onPress`, `ProgressBar` "Progresso do PDI: N%", "Ver plano completo", "Criar PDI"); aba Planos: `InfoCard` com rótulo
  `"Abrir plano {título}, {tipo}, {status}, {N}%"`, `ProgressBar` "Progresso de {título}: N%", "Criar novo plano"; evolução
  (`ProgressBar` por categoria: `"{categoria}: N%"`); sessões (`Pressable`, "Ver relatório da sessão {nome}"); linha "Anamnese"
  (`FeatureRow`, rótulo = "Anamnese"); "Editar" (ação do `SectionTitle` "Dificuldades mapeadas"); "Iniciar sessão".
- **B. Sem rótulo / ambíguo:** **"Editar"** (G8) não diz o quê (só edita o paciente); a linha **"Anamnese"** lê **só o título** — a data da última resposta
  ("Última em dd/mm/aaaa") se perde (**G7**); **"Contatar responsável"** desabilitado: o motivo é texto visível ("Paciente sem telefone cadastrado"); o `InfoCard` de plano
  e a `ProgressBar` ao lado são lidos **duas vezes** (o rótulo do cartão já tem o percentual).
- **C. TalkBack (A11Y-FIC-TB):** ordem avatar/dados → "Contatar responsável" → abas → conteúdo da aba. **Esperado:** cada aba é anunciada
  "aba, selecionada, 1 de 2" (confirme o "1 de 2"); trocar de aba move o foco para o conteúdo novo (hoje **não** há mudança de foco explícita — verificar);
  o `ProgressBar` anuncia o percentual.
- **D. Fonte grande (A11Y-FIC-FG):** o resumo do paciente (avatar + texto + `IconButton`) pode **espremer** o nome; `Tabs` com `height: 43` e fonte 11 px (**G10**);
  textos de cartões de plano longos quebram.
- **E. Contraste (A11Y-FIC-CT):** aba inativa `ink-500` (**G2**, 3,63:1); "Editar" `brand-600` (**G3**, 4,06:1); metadados `ink-600` OK.
- **F. Alvos (A11Y-FIC-AL):** `IconButton` 42 pt e `Tabs` 43 pt (**G4**); "Editar" ≈ 33 pt.
- **Se falhar:** `Tabs.tsx` (cor e altura), `SectionTitle.tsx` (ação "Editar"), `FeatureRow.tsx` (rótulo), `IconButton.tsx` (tamanho).
- **Evidência:** notas das abas e da linha "Anamnese"; captura em fonte máxima.

### Tela 7 — Anamnese do paciente (`/patients/[id]/anamnese`)

Arquivos: `app/patients/[id]/anamnese.tsx` → `src/features/anamnese/responses/AnamneseResponsesScreen.tsx`, `AnamneseForm.tsx`; testes:
`src/features/anamnese/responses/__tests__/AnamneseResponsesScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` ("Anamnese", "Escolher modelo", "Nova anamnese"/"Editar anamnese"); "Nova anamnese" e "Criar modelo"
  (`DsButton`); lista de modelos e de respostas (`FeatureRow`, rótulo = título); "Editar" (resposta); no formulário: `Field`, `SelectField`
  (por pergunta, rótulo = texto da pergunta), `CheckList` (checkbox), **"Escolher arquivo"** (`DsButton`), "Salvar anamnese"; indicador
  de carregamento com `accessibilityLabel` ("Carregando modelos", "Carregando anamneses"); erros com `alert`.
- **B. Sem rótulo / ambíguo:** as linhas da lista **lêem só o título** (modelo) — **"Respondida em … · Editada em …"** e **"N perguntas"** se perdem (**G7**);
  duas respostas do mesmo modelo ficam **indistinguíveis** no TalkBack; o botão de arquivo não diz **qual pergunta**
  (G8), e o nome do arquivo escolhido deve ser lido (verificar).
- **C. TalkBack (A11Y-ANA-TB):** lista → "Nova anamnese"; no formulário, pergunta a pergunta (cada campo com o texto da pergunta). **Esperado:** em respostas
  obrigatórias vazias, "Resposta obrigatória"/"Escolha uma opção"/"Escolha ao menos uma opção"/"Envie o arquivo" são anunciados.
- **D. Fonte grande (A11Y-ANA-FG):** perguntas longas (rótulos de 11 px dentro de `Field`) e opções longas quebram; "Escolher arquivo" com `numberOfLines={1}`.
- **E. Contraste (A11Y-ANA-CT):** `styles.error` `danger` (**G1**); subtítulo da linha `ink-600` OK.
- **F. Alvos (A11Y-ANA-AL):** linhas ≥ 48 pt; `Checkbox` 43 pt; botões 44 pt.
- **Se falhar:** `FeatureRow.tsx` (incluir o subtítulo no rótulo) ou `AnamneseResponsesScreen.tsx` (passar `accessibilityLabel`); `AnamneseForm.tsx` (rótulo do botão de arquivo com a pergunta).
- **Evidência:** notas de leitura de duas linhas da lista.

### Tela 8 — Modelos de anamnese (`/anamnese/templates`, `/new`, `/[id]`)

Arquivos: `app/anamnese/templates/*.tsx` → `src/features/anamnese/templates/TemplateListScreen.tsx`, `TemplateFormScreen.tsx`; testes:
`src/features/anamnese/templates/__tests__/TemplateFormScreen.test.tsx`.

- **A. Rótulos e papéis:** lista: "Novo modelo", `FeatureRow` por modelo (rótulo = título); formulário: `Field` "Título *", "Descrição", "Texto da pergunta *";
  `SelectField` "Tipo *"; `Checkbox` "Obrigatória"; `Field` "Opção N"; botões **"Subir pergunta N"** e **"Descer pergunta N"** (rótulo com índice);
  **"Remover opção N da pergunta M"** (rótulo com índices); "Adicionar pergunta"; "Salvar modelo"; "Excluir modelo"; diálogo `Modal` ("Excluir modelo?" /
  "Esta ação não pode ser desfeita." / "Cancelar" e "Excluir"); indicadores de carregamento rotulados.
- **B. Sem rótulo / ambíguo:** **"Remover"** (de cada **pergunta**) **não leva o número** — com 4 perguntas há 4 botões "Remover" iguais (G8; os "Subir/Descer"
  **têm** o índice); **"Adicionar opção"** idem (um por pergunta, sem número); as linhas da lista lêem só o título (**G7**: perde "N perguntas").
- **C. TalkBack (A11Y-TPL-TB):** percorra uma pergunta inteira (Subir/Descer/Remover → Texto → Tipo → Obrigatória → Opções). **Esperado:** o botão
  desabilitado ("Subir pergunta 1") é "desabilitado"; ao excluir, o diálogo prende o foco; o erro "Este modelo já tem respostas e não pode ser alterado."
  é anunciado.
- **D. Fonte grande (A11Y-TPL-FG):** três botões em linha (`Remover`, `Subir`, `Descer`) por pergunta podem **quebrar/cortar**; título "Pergunta N".
- **E. Contraste (A11Y-TPL-CT):** erro `danger` (**G1**).
- **F. Alvos (A11Y-TPL-AL):** `DsButton` 44 pt; `Checkbox` 43 pt.
- **Se falhar:** `TemplateFormScreen.tsx` › botões "Remover" e "Adicionar opção": acrescentar `accessibilityLabel={`Remover pergunta ${index + 1}`}` e
  `accessibilityLabel={`Adicionar opção à pergunta ${index + 1}`}`.
- **Evidência:** notas de leitura dos botões "Remover".

### Tela 9 — Perfil (`/profile`)

Arquivos: `app/profile.tsx` → `src/features/profile/ProfileScreen.tsx`; foto: `src/components/media/ImagePickerField.tsx`; testes:
`src/features/profile/__tests__/ProfileScreen.test.tsx`, `ProfileLogout.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` "Perfil"; foto: `Image` com `accessibilityLabel={educator.name}` ou `Avatar` (nome); `ImagePickerField`: **"Escolher imagem da galeria"**,
  **"Tirar foto"**, "Remover imagem", "Abrir configurações" (quando há erro de permissão); `Field` "Nome", "E-mail" (somente leitura), "Contato", "Profissão";
  **"Salvar"**, **"Sair"**; diálogo `Modal`: "Sair da conta?", "Você precisará entrar novamente para acessar seus dados.", "Cancelar", "Confirmar saída"; `Toast`
  ("Perfil atualizado", "Foto atualizada"); erro com `alert`.
- **B. Sem rótulo / ambíguo:** o campo "E-mail" é somente leitura: confirme que o TalkBack o lê como **não editável**; o título do diálogo é `Text` (sem `header`);
  o `Modal` sem `accessibilityViewIsModal`.
- **C. TalkBack (A11Y-PRF-TB):** foto → nome → botões da foto → campos → "Salvar" → "Sair". **Esperado:** "Sair" abre o diálogo e o foco vai a ele;
  "Cancelar" não desloga; "Confirmar saída" leva ao Login com o foco no primeiro elemento do Login.
- **D. Fonte grande (A11Y-PRF-FG):** `photoRow` (avatar 64 + nome/profissão) pode quebrar; botões da foto lado a lado; o diálogo (duas ações).
- **E. Contraste (A11Y-PRF-CT):** `styles.error` `danger` (**G1**); `secondary` `textSecondary` OK.
- **F. Alvos (A11Y-PRF-AL):** campos 48 pt; botões 44–50 pt.
- **Se falhar:** `ProfileScreen.tsx` (`Modal`), `ImagePickerField.tsx` (rótulos), `Field.tsx` (campo somente leitura: `editable={false}` + `accessibilityState`).
- **Evidência:** notas do diálogo "Sair".

### Tela 10 — Recursos (`/(tabs)/resources`)

Arquivos: `app/(tabs)/resources.tsx` → `src/features/resources/ResourcesScreen.tsx`; testes: `src/features/resources/__tests__/ResourcesScreen.test.tsx`.

- **A. Rótulos e papéis:** banner do educador (`StaticPressable`, **"Perfil"**, com `Avatar`/foto rotulado com o nome); `FeatureRow` por recurso ("Planos com IA", "Modelos de anamnese",
  "Evolução da sessão"…; rótulo = título).
- **B. Sem rótulo / ambíguo:** o banner tem rótulo fixo "Perfil" (o nome e a profissão **se perdem**; G7); as linhas lêem só o título (o subtítulo
  "Crie planos personalizados com inteligência artificial" se perde); itens "Em breve" **não** dizem que são "Em breve" até abrir.
- **C. TalkBack (A11Y-REC-TB):** banner → grupos (títulos "Planejamento personalizado"…, **sem `header`**, G6) → linhas. **Esperado:** cada linha anuncia botão e leva ao destino certo.
- **D. Fonte grande (A11Y-REC-FG):** subtítulos de 11 px quebram; `FeatureRow` com ícone de 40 pt.
- **E. Contraste (A11Y-REC-CT):** subtítulos `ink-600` OK; chevron `ink-500` (decorativo).
- **F. Alvos (A11Y-REC-AL):** linhas ≥ 48 pt.
- **Se falhar:** `FeatureRow.tsx`, `ResourcesScreen.tsx` (rótulo do banner: nome + profissão).
- **Evidência:** notas de leitura do banner.

### Tela 11 — Detalhe da atividade (visual novo)

Arquivos: `app/content/task/[id].tsx`, `app/activities/[id].tsx` → `src/features/content-detail/task/TaskDetailScreen.tsx`; testes:
`src/features/content-detail/task/__tests__/TaskDetailScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` com voltar (sem "Abrir menu"); selos `Badge` (categoria e tipo); alternativas com selo "Correta"; **"Imagem da atividade"** (`Image`);
  `AudioPlayer`; **"Jogar"**, **"Editar Atividade"**, **"Excluir Atividade"** (`DsButton`); diálogo ("Cancelar"/"Excluir"); estados com `accessibilityLabel`
  ("Carregando atividade") e `alert`.
- **B. Sem rótulo / ambíguo:** controles do `AudioPlayer` (`src/components/media/AudioPlayer.tsx`) — **confirme** rótulos de play/pausa e posição; o `Image` tem o mesmo rótulo
  genérico para qualquer atividade ("Imagem da atividade").
- **C. TalkBack (A11Y-ATV-TB):** voltar → selos → enunciado → alternativas ("Correta" anunciada) → mídia → ações. **Esperado:** áudio controlável sem visão.
- **D. Fonte grande (A11Y-ATV-FG):** alternativas longas e botões "Editar Atividade"/"Excluir Atividade" com `numberOfLines={1}` (**G5**).
- **E. Contraste (A11Y-ATV-CT):** `Badge` OK; erro `color.pink`/`danger` (**G1**).
- **F. Alvos (A11Y-ATV-AL):** botões 44–50 pt; controles do player — medir.
- **Se falhar:** `AudioPlayer.tsx` (rótulos), `TaskDetailScreen.tsx` (rótulo da imagem com o enunciado).
- **Evidência:** notas do player.

### Tela 12 — Detalhe do grupo e do caderno

Arquivos: `app/content/group/[id].tsx` → `src/features/content-detail/group/GroupDetailScreen.tsx`; `app/content/notebook/[id].tsx` →
`.../notebook/NotebookDetailScreen.tsx`; testes: `src/features/content-detail/**/__tests__/`.

- **A. Rótulos e papéis:** `AppHeader`; `Badge` (categoria); lista de itens (`ContentCard`, `button`); "Editar Grupo"/"Excluir Grupo" e "Editar Caderno"/"Excluir Caderno";
  diálogo (`Modal`) "Cancelar"/"Excluir"; estados "Carregando grupo", "Grupo indisponível" (`alert`), "Não encontrado" e "Voltar".
- **B. Sem rótulo / ambíguo:** `ContentCard` — confirmar que o rótulo traz título **e** categoria; o diálogo sem `accessibilityViewIsModal`.
- **C. TalkBack (A11Y-GRP-TB):** cabeçalho → selo → itens → ações. **Esperado:** cada item abre o detalhe certo (FEC-04); "Grupo indisponível" é anunciado como alerta.
- **D. Fonte grande (A11Y-GRP-FG):** `ContentCard` com `numberOfLines={2}` (corta título longo, **verificar**).
- **E. Contraste (A11Y-GRP-CT):** `styles.error` `danger` (**G1**).
- **F. Alvos (A11Y-GRP-AL):** botões 44–50 pt.
- **Se falhar:** `src/features/content/ContentCard.tsx`.
- **Evidência:** notas.

### Tela 13 — Planos: lista (`/plans`)

Arquivos: `app/plans/index.tsx` → `src/features/plans/hub/PlansHubScreen.tsx`; testes:
`src/features/plans/hub/__tests__/PlansHubScreen.test.tsx`. Detalhe de uso: [04-planos.md](04-planos.md).

- **A. Rótulos e papéis:** `AppHeader` ("Planos com IA", "PDI e planejamento educacional"); `AIHero` (botão **"Criar novo plano"**, papel `button`); `FilterRow`
  ("Todos", "PDI", "PE": papel `button`, `selected`); cada plano (`InfoCard`): rótulo **`"{paciente}, {tipo · título[ · Concluído|Cancelado]}, {N}% concluído"`**; `ProgressBar`
  `"Progresso de {paciente}: N%"`; aviso offline; estados "Carregando planos...", "Não foi possível carregar os planos." + "Tentar de novo", "Nenhum plano ainda", "Nenhum plano deste tipo ainda".
- **B. Sem rótulo / ambíguo:** a `ProgressBar` repete o percentual já presente no rótulo do cartão (**lido duas vezes**); "Próxima revisão: dd/mm" **não** está no rótulo do cartão
  (fica como texto à parte, mas é um foco separado — confirme a ordem); os `SectionTitle` "Em andamento"/"Encerrados" sem `header` (**G6**); o filtro não anuncia o **grupo**
  (sem `accessibilityLabel` no `FilterRow`).
- **C. TalkBack (A11Y-PLN-TB):** título → "Criar novo plano" → filtro → "Em andamento" → plano 1 (cartão, barra, revisão) → … **Esperado:** o filtro selecionado é anunciado "selecionado";
  mudar o filtro anuncia a lista nova (hoje sem live region — **verificar**).
- **D. Fonte grande (A11Y-PLN-FG):** `AIHero` (título e descrição longos); `InfoCard` com título + descrição "PDI · {título longo}" quebra; `FilterChip` (11 px).
- **E. Contraste (A11Y-PLN-CT):** `percent`/`review` `textSecondary` OK; chip inativo `ink-600` sobre branco OK (5,03:1).
- **F. Alvos (A11Y-PLN-AL):** `FilterChip` ≈ 31 pt (**G4**); `InfoCard` ≥ 56 pt OK; "Criar novo plano" (botão do `AIHero`) — medir.
- **Se falhar:** `FilterChip.tsx` (`minHeight` 44), `AIHero.tsx`, `PlansHubScreen.tsx` (rótulo do cartão com "Próxima revisão").
- **Evidência:** notas do filtro; captura em fonte máxima.

### Tela 14 — Planos: gerar e rascunho (`/plans/new`)

Arquivos: `app/plans/new.tsx` → `src/features/plans/generate/GeneratePlanScreen.tsx`, `DraftPreview.tsx`, `src/features/plans/draft/PlanForm.tsx`; testes:
`src/features/plans/generate/__tests__/GeneratePlanScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` ("Novo planejamento" + nome do paciente); `SelectField` "Paciente"; `SegmentedControl` com `accessibilityLabel="Tipo de plano"`
  (`radio`: "PDI", "PE da sessão"); `Field` "Foco do planejamento"; `AIContext` (aviso); `CheckList` (dificuldades: `checkbox`); `SegmentedControl` da duração ("3 meses"/"6 meses", **sem
  rótulo do grupo**); `DateField` "Data da sessão"; `SelectField` "Incluir anamnese"; **"Gerar planejamento com IA"**; espera "Gerando o planejamento…" (`accessibilityLiveRegion="polite"`);
  erros (`alert`) e **"Tentar de novo"**; no rascunho: selos "Rascunho não salvo" e "Editável", `Field` "Título", "Objetivo geral", **"Descrição da meta N"**, **"Critério de sucesso da meta N"**,
  **"Subir meta N"/"Descer meta N"/"Remover meta N"** (com índice), "Adicionar meta", "Ajustes do profissional", "Compartilhar", "Salvar PDI"/"Salvar PE"; aviso do `409` ("Este paciente já tem um PDI ativo.") com **"Ver PDI ativo"**.
- **B. Sem rótulo / ambíguo:** o `SegmentedControl` de **duração** não tem `accessibilityLabel` (o TalkBack lê "3 meses, botão de opção" sem dizer do que); `AIContext` — confirmar se é lido; os selos
  "Rascunho não salvo"/"Editável" (`Badge`) **não** são anunciados como estado da tela; o `Alert` "Descartar o rascunho?" é nativo (foco preso).
- **C. TalkBack (A11Y-GER-TB):** seguir o formulário de cima a baixo; gerar; ouvir o aviso de espera (live region); percorrer o rascunho. **Esperado:** "Gerando o planejamento…" é anunciado **uma vez**; ao terminar, o
  rascunho é alcançável sem o foco ficar no botão; erros anunciados; "Compartilhar" abre a folha do sistema.
- **D. Fonte grande (A11Y-GER-FG):** `SegmentedControl` (`height: 39`, "PE da sessão" quebra, **G10**); botão "Gerar planejamento com IA" (`numberOfLines={1}`, **G5**); botões **Subir/Descer** lado a lado por meta; campos multilinha.
- **E. Contraste (A11Y-GER-CT):** `styles.error` `danger` (**G1**); `body` `ink-950` OK.
- **F. Alvos (A11Y-GER-AL):** `SegmentedControl` 39 pt e `Checkbox` 43 pt (**G4**); `DsButton` 44–50 pt.
- **Se falhar:** `GeneratePlanScreen.tsx` (acrescentar `accessibilityLabel="Duração de referência"` ao segundo `SegmentedControl`), `SegmentedControl.tsx`, `PlanForm.tsx`.
- **Evidência:** notas do aviso de espera; captura em fonte máxima do formulário e do rascunho.

### Tela 15 — Planos: detalhe (metas, revisão, encerrar) (`/plans/[id]`)

Arquivos: `app/plans/[id].tsx` → `src/features/plans/detail/PlanDetailScreen.tsx`; testes: `src/features/plans/detail/__tests__/PlanDetailScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` (título = **título do plano**); selos `Badge` (tipo e "Ativo"/"Concluído"/"Cancelado"); botões "Editar plano", "Registrar revisão", "Encerrar plano", "Cancelar edição",
  "Cancelar revisão", "Salvar revisão", "Concluído", "Cancelado", "Voltar ao plano"; **"Pedir sugestões da IA"** / "Gerando sugestões…", "Ver sugestões"; `ProgressBar` **"Progresso do plano: N%"**;
  por meta: `SelectField` **"Alterar status da meta N"** (`button`; folha com as opções e "Fechar"); `Field` "Nota da revisão", "Próxima revisão (AAAA-MM-DD)", "Fim da vigência (AAAA-MM-DD)"; mensagens (`alert`);
  `SuggestionCard`: **"Aceitar sugestão: {mudança}"** e **"Descartar sugestão: {mudança}"**; `Alert` "Encerrar plano?".
- **B. Sem rótulo / ambíguo:** os botões **"Concluído"** e **"Cancelado"** (motivo do encerramento) são **iguais** aos selos de status e sem contexto (G8: "Encerrar plano com motivo Concluído"); o selo de status
  da meta (`Badge`) e o seletor "Alterar status da meta N" repetem o estado (o seletor lê só o rótulo, **não o valor atual** — verificar se o TalkBack anuncia "Atingida"); `SectionTitle` ("Metas", "Revisões",
  "Sugestões da IA") sem `header` (**G6**); o toast "N sugestões novas" é anunciado (`alert`); a mensagem "Sem sugestões novas para este plano" **não** tem papel/live region (só `accessibilityRole="alert"` em erro).
- **C. TalkBack (A11Y-DET-TB):** cartão do plano → botões → "Sugestões da IA" → "Metas" (progresso, cada meta com o seletor) → "Revisões". **Esperado:** mudar o status de uma meta anuncia o novo status e o progresso novo (verificar);
  no `Alert` de encerramento o foco fica preso; "Registrar revisão" abre os campos sem perder o contexto.
- **D. Fonte grande (A11Y-DET-FG):** o título do plano no cabeçalho (`numberOfLines={1}`, **G5**) é **truncado**; três botões em linha ("Editar plano", "Registrar revisão", "Encerrar plano") quebram em várias linhas
  (`row` com `flexWrap`); textos de meta longos; `SelectField` com rótulo longo.
- **E. Contraste (A11Y-DET-CT):** `error` `danger` (**G1**); `Badge` "warning" 5,05:1 OK; `meta` `textSecondary` OK.
- **F. Alvos (A11Y-DET-AL):** botões 44 pt; `SelectField` 48 pt; `ProgressBar` (decorativa); ações da folha de opções — medir.
- **Se falhar:** `PlanDetailScreen.tsx` (rótulos de "Concluído"/"Cancelado"; live region na mensagem de "Sem sugestões novas"), `SelectField.tsx` (`accessibilityValue` com a opção atual), `AppHeader.tsx` (título longo).
- **Evidência:** notas do seletor de status; captura em fonte máxima.

### Tela 16 — Planos: sugestões da IA (`/plans/suggestions`)

Arquivos: `app/plans/suggestions.tsx` → `src/features/plans/suggestions/PlanSuggestionsScreen.tsx`, `SuggestionCard.tsx`; testes:
`src/features/plans/suggestions/__tests__/PlanSuggestionsScreen.test.tsx`.

- **A. Rótulos e papéis:** `AppHeader` "Sugestões da IA"; por cartão: paciente, título do plano, texto, mudança proposta, **"Aceitar sugestão: {mudança}"** e **"Descartar sugestão: {mudança}"**
  (`DsButton` com rótulo específico, `disabled` enquanto ocupado); mensagem de resultado (`alert`): "Sugestão aceita", "Sugestão descartada", "Esta sugestão não se aplica mais", "Esta sugestão já foi resolvida",
  "Não foi possível concluir. Tente novamente."; estados "Carregando sugestões...", erro com "Tentar de novo", "Nenhuma sugestão para revisar".
- **B. Sem rótulo / ambíguo:** o texto visível dos botões é só "Aceitar"/"Descartar" (o rótulo acessível é maior — **correto**; confirme que o **comando de voz** por texto visível funciona, "Aceitar"); o cartão em si não é
  um grupo (cada texto é um foco separado: paciente → plano → texto → mudança → botões — verificar se é cansativo).
- **C. TalkBack (A11Y-SUG-TB):** percorrer um cartão. **Esperado:** ao aceitar/descartar, a mensagem é anunciada e o cartão sai sem o foco se perder (verificar para onde o foco vai).
- **D. Fonte grande (A11Y-SUG-FG):** os botões "Aceitar"/"Descartar" lado a lado (`actions` com `flexWrap`) quebram; texto da sugestão (até 500 caracteres) longo.
- **E. Contraste (A11Y-SUG-CT):** `body` `textSecondary` OK; `heading` `ink-950` OK; mensagem de resultado `textSecondary`.
- **F. Alvos (A11Y-SUG-AL):** `DsButton` 44 pt.
- **Se falhar:** `SuggestionCard.tsx` (agrupar com `accessible`), `PlanSuggestionsScreen.tsx` (foco após a ação).
- **Evidência:** notas do foco após aceitar.

---

## 3. Resultado da rodada (QA-03)

Marque **OK**, **FALHA** (com o ID do item, ex.: `A11Y-AGE-CT`, e a captura `E3-A11Y-<NN>.png`) ou **N/A**. Falhas viram tarefas no BACKLOG com o **componente** indicado em "Se falhar"; os achados
globais **G1 a G10** devem virar **uma** tarefa no design system (corrigir o componente corrige todas as telas).

| Tela                                                         | TalkBack | Fonte grande | Contraste | Alvo 44 pt | Observações |
| ------------------------------------------------------------ | -------- | ------------ | --------- | ---------- | ----------- |
| Agenda (faixa da semana, lista, estados)                     |          |              |           |            |             |
| Novo atendimento / Editar / Remarcar / Reativar              |          |              |           |            |             |
| Detalhe do atendimento (ações e confirmações)                |          |              |           |            |             |
| Início (lembrete, cartão de sugestões)                       |          |              |           |            |             |
| Novo paciente / Editar paciente (seção "Responsável")        |          |              |           |            |             |
| Ficha do paciente (abas Visão geral e Planos, "PDI vigente") |          |              |           |            |             |
| Anamnese do paciente (lista, nova, editar)                   |          |              |           |            |             |
| Modelos de anamnese (lista e formulário)                     |          |              |           |            |             |
| Perfil (foto, campos, Sair e confirmação)                    |          |              |           |            |             |
| Recursos (banner, "Modelos de anamnese", "Planos com IA")    |          |              |           |            |             |
| Detalhe da atividade (visual novo)                           |          |              |           |            |             |
| Detalhe do grupo e do caderno                                |          |              |           |            |             |
| Planos: lista                                                |          |              |           |            |             |
| Planos: gerar e rascunho                                     |          |              |           |            |             |
| Planos: detalhe (metas, revisão, encerrar)                   |          |              |           |            |             |
| Planos: sugestões da IA                                      |          |              |           |            |             |

Evidência da rodada: aparelho/emulador e versão do Android, versão do TalkBack, tamanho de fonte e de exibição usados, commit testado.
