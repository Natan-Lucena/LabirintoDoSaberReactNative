# T-902 - Componentes da agenda

## Objetivo

Entregar os componentes de apresentação da Agenda (tela 07, DESIGN §2/§5):
`MiniCalendar`, `StatTile`, `AppointmentCard`. Só props tipadas e callbacks;
nenhuma busca de dado (isso é a T-901/T-903). Consumir exclusivamente
`src/theme` (cores, tipografia, forma) e os primitivos de T-202 (`Card`,
`Button`, `Tag`); nenhuma cor/medida literal fora de `src/theme`.

Escopo e não objetivos: sem wiring de navegação, sem `AgendaScreen`, sem
chamadas a `src/api` ou `src/utils/date.ts` dentro dos componentes — os
consumidores (T-903/T-904/T-905) formatam datas com `src/utils/date.ts`
(T-306, já implementado) e passam strings prontas.

Fluxo aplicado: fase 1 (contrato + testes + stubs sem comportamento) fica
pendente de revisão e aprovação do orquestrador (vermelho por comportamento
ausente); fase 2 (implementação mínima) só começa após aprovação.

## Decisões desta fase

- `AppointmentCard` não recebe `Appointment` bruto (tem só `studentId`,
  T-305): recebe `time`, `status`, `studentName`, `observation?` já
  resolvidos pelo consumidor, e os callbacks `onEdit`/`onReschedule`/
  `onDelete`/`onPlan` (BACKLOG AC-902-02).
- Badge de status usa texto sempre visível (G-12): `PENDING` → "Agendada"
  (acento `color.primary`, turquesa), `COMPLETED` → "Realizada" (acento
  `color.success`, só decorativo), `CANCELLED` → "Cancelada" via `Tag`
  `variant="neutral"` (T-202, já cobre "tag neutra"). `Tag` não tem variante
  para os acentos turquesa/success (só `primary`/`neutral`/`pink`) e está
  fora da lista de arquivos permitidos desta tarefa: `PENDING`/`COMPLETED`
  usam um rótulo de texto local com cor de acento por `color`/`semanticColor`,
  não o componente `Tag`, para não reabrir T-202.
- `MiniCalendar` envolve `react-native-calendars` (`Calendar`), conforme
  PROJECT/DESIGN §5 (não reaberto); decisão registrada por AC-902-03 (`REV`).
  Marca dias com agendamento por `appointmentCounts` (contagem por
  `dayKey`), fornecida pelo consumidor via `src/utils/date.ts`
  (`groupByDayKey`/`dayKey`, T-306) — o componente não agrupa nem formata
  datas, só recebe o mapa pronto.
- Rótulo acessível de cada dia segue o formato do BACKLOG: `"{dia} de
{mês}, {N} agendamento(s)"` (sem ano, conforme o exemplo "2 de abril, 3
  agendamentos"); dias sem agendamento omitem a contagem: `"{dia} de
{mês}"`. Nome do mês em pt-BR vem de `Intl.DateTimeFormat("pt-BR", {
month: "long" })` (sem fuso: `MiniCalendar` recebe só números de
  ano/mês/dia, não `Date`, então não há ambiguidade de fuso a resolver
  aqui).
- `StatTile` não tem AC própria no BACKLOG (só aparece na lista de arquivos
  da T-902 e no catálogo de componentes, DESIGN §5); recebe teste mínimo de
  render (rótulo + valor), no padrão dos componentes sem AC formal em T-202
  (`SearchField`/`SectionHeader` na fase 1 daquele contrato).

## Critérios

| ID        | Resultado                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-902-01 | `MiniCalendar`: navegação ‹ › chama `onChangeMonth`; seleção de dia chama `onSelectDate`; dias com agendamento têm marcador; cada dia expõe rótulo acessível com data e contagem. — `CT`                |
| AC-902-02 | `AppointmentCard`: mostra horário, status em texto (`PENDING`/`COMPLETED`/`CANCELLED`), aluno e observação; `onEdit`/`onReschedule`/`onDelete`/`onPlan` chamados ao tocar a ação correspondente. — `CT` |
| AC-902-03 | Uso de `react-native-calendars` no `MiniCalendar`, registrado e não reaberto sem escalonamento aprovado. — `REV`                                                                                        |

## Interfaces

### `src/features/appointments/components/MiniCalendar.tsx`

```ts
export interface MiniCalendarProps {
  year: number;
  month: number; // 0-indexado, como Date/T-306
  selectedDayKey: string; // "AAAA-MM-DD"
  appointmentCounts: Record<string, number>; // dayKey -> nº de agendamentos
  onSelectDate: (dayKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}
```

- Envolve `Calendar` de `react-native-calendars`; título do mês em pt-BR
  (`current` controlado por `year`/`month`); setas ‹ › via
  `renderArrow`/`onPressArrowLeft`/`onPressArrowRight` chamando
  `onChangeMonth` com o mês adjacente (ano ajustado nas bordas dez/jan).
- `markedDates` (ou `dayComponent` custom) marca com ponto os dias cuja
  chave existe em `appointmentCounts` com valor > 0; dia selecionado
  (`selectedDayKey`) destacado com os tokens de `color`/`shape` (nunca só
  ponto — cor + indicador, DESIGN §6 "nada só por cor").
- Cada célula de dia usa `accessibilityLabel` no formato descrito em
  "Decisões desta fase"; `onDayPress` chama `onSelectDate(dayKey)`.
- Dias do mês vizinho (antes do dia 1 / depois do último) ficam esmaecidos
  (`opacity`/cor secundária dos tokens), sem alterar a interação de troca de
  mês (só ‹ › muda o mês, conforme DESIGN §2/07; tocar em dia esmaecido não
  é uma navegação de mês nesta tarefa — não especificado no BACKLOG, T-903
  decide se habilita).

### `src/features/appointments/components/StatTile.tsx`

```ts
export interface StatTileProps {
  label: string;
  value: string;
}
```

- Apresentação simples: `label` (rótulo) e `value` (valor), tokens de
  tipografia/cor de `src/theme`. Usado para "Total de Sessões", "Primeira
  Sessão", "Última Sessão" (valores já formatados pelo consumidor via
  T-306).

### `src/features/appointments/components/AppointmentCard.tsx`

```ts
export type AppointmentCardStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface AppointmentCardProps {
  time: string; // "hh:mm", já formatado (T-306 formatTime)
  status: AppointmentCardStatus;
  studentName: string;
  observation?: string;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
  onPlan: () => void;
}
```

- Usa `Card` (T-202) como contêiner; badge de status conforme "Decisões
  desta fase" (texto sempre presente, nunca só cor).
- Ações renderizadas com `Button` (T-202, `variant="secondary"` ou
  equivalente definido na fase 2): rótulos "Editar", "Remarcar", "Excluir",
  "Montar Plano da Sessão"; cada botão chama exatamente o callback
  correspondente, sem lógica adicional (confirmação de exclusão é do
  consumidor, T-905).
- `observation` ausente não renderiza a linha (sem texto vazio/placeholder).

## Plano de testes (fase 1, vermelho esperado)

`src/features/appointments/components/__tests__/`, um arquivo por
componente, `await render(...)` (A-14), sem `className` (A-15):

- `MiniCalendar.test.tsx` (AC-902-01): pressionar ‹/› chama `onChangeMonth`
  com o par ano/mês adjacente correto (inclui virada dez→jan e jan→dez);
  tocar um dia chama `onSelectDate` com a `dayKey` certa; dia com
  `appointmentCounts[dayKey] > 0` expõe rótulo acessível citando a
  contagem ("... 3 agendamentos"); dia sem contagem expõe rótulo sem
  contagem; dia igual a `selectedDayKey` reflete estado selecionado
  (`accessibilityState.selected` ou equivalente, não só cor).
- `AppointmentCard.test.tsx` (AC-902-02): renderiza horário, aluno e
  observação (e omite a linha quando `observation` é `undefined`); um
  teste por status (`PENDING`→"Agendada", `COMPLETED`→"Realizada",
  `CANCELLED`→"Cancelada") verificando o texto visível (não só a cor);
  `onEdit`/`onReschedule`/`onDelete`/`onPlan` chamados ao pressionar cada
  ação, cada um isoladamente (os outros três não chamados).
- `StatTile.test.tsx`: stub mínimo (render sem crash, `label`/`value`
  visíveis) — sem AC formal, mesmo padrão dos componentes sem critério
  específico em T-202.

## Tabela de tarefas

| Arquivo                                                                                           | Dono                   | Modelo | Esforço |
| ------------------------------------------------------------------------------------------------- | ---------------------- | ------ | ------- |
| `src/features/appointments/components/{MiniCalendar,StatTile,AppointmentCard}.tsx` e `__tests__/` | Executor único (T-902) | Sonnet | Médio   |

## Comandos de validação

`pnpm exec vitest run src/features/appointments/components/__tests__/*.test.tsx`
(fase 1: vermelho por comportamento ausente); `pnpm run typecheck` (exit 0);
`pnpm run test` (regressão completa, fase 2); `pnpm run lint`;
`pnpm exec prettier --check` nos arquivos tocados; `python
scripts/check-docs.py`; `git diff --check`; `npx expo export --platform
android --output-dir dist-android` (apagar depois).

## Limites

Executor pode editar apenas:
`docs/contracts/t-902-componentes-agenda.md`,
`src/features/appointments/components/**`. Proibido: `docs/entrega-1/TRACKING.md`;
outros contratos; AGENTS/BACKLOG/GATES/DESIGN/PROJECT; `src/theme/**`;
`src/components/**` (T-202); `src/utils/date.ts` (T-306); `src/api/**`;
instalar dependências (`react-native-calendars` já está no `package.json`,
T-102); commit/push antes da aprovação da fase 1; editar `vitest.config.mts`
(o transform de A-12 já cobre `react-native-calendars`, confirmado no
discovery).

## Pendências

- AC-902-03 é `REV`: decisão registrada aqui para revisão do orquestrador,
  sem alternativa implementada (grade própria só com incompatibilidade
  comprovada e aprovada, DESIGN §5).
- Estilo visual fino do `MiniCalendar` (espaçamento exato do grid,
  `theme` do `Calendar`) fica sujeito ao aceite visual quando o app rodar
  (G-18 cobre só as telas listadas ali; aceite deste componente específico
  fica registrado como pendência de revisão visual geral da Agenda, T-903).
- Rótulo dos botões de ação (`Button` vs. ícone) e variante visual exata
  ficam a decidir na fase 2, dentro do primitivo `Button` já existente
  (sem nova variante).

## Histórico

- 2026-09-25: contrato criado pelo executor Sonnet para a fase 1 da T-902,
  após leitura de AGENTS §4/§6, BACKLOG (T-902, contexto T-903), GATES
  (G-12, G-13), DESIGN §2 (07) e §5, `docs/design/telas/07-agenda.html`,
  contratos T-202, T-201, T-305, T-306, COMPATIBILIDADE A-12 e
  `vitest.config.mts` (transform já cobre `react-native-calendars`, sem
  necessidade de alteração).
