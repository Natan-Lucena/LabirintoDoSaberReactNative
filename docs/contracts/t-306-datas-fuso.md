# T-306 - Datas, fuso e calendário

## Objetivo

Definir funções puras de data/hora/fuso usadas pela Agenda e pela Home,
fixando `America/Sao_Paulo` (G-13) como fuso de exibição/agrupamento
independentemente do fuso do aparelho, sem implementar comportamento real
nesta fase (fase vermelha).

## Critérios

| ID        | Resultado                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-306-01 | Formata "quinta-feira, 02 de abril de 2026" e "hh:mm" em pt-BR. — `UT`                                                                                                               |
| AC-306-02 | Agrupa `scheduledAt` por dia no fuso fixo `America/Sao_Paulo`, independentemente do fuso do aparelho, incluindo horários perto da meia-noite e offsets diferentes na entrada. — `UT` |
| AC-306-03 | Calcula o intervalo local do mês visível e a chave de dia `AAAA-MM-DD` usada nas marcações do calendário. — `UT`                                                                     |
| AC-306-04 | Serializa data/hora escolhida (em horário de Brasília) para ISO 8601 com offset. — `UT`                                                                                              |
| AC-306-05 | "hoje" é calculado em `America/Sao_Paulo`; teste com aparelho simulado em outro fuso. — `UT`                                                                                         |

## Interfaces

Funções puras em `src/utils/date.ts`, todas recebendo `Date` (instante UTC,
como as datas do JS) e nenhuma dependência nova (G-03: `Intl` do Hermes
ainda não verificado em runtime — ver Apêndice A de
docs/bootstrap/COMPATIBILIDADE.md e R4/AC-108-03; se falhar no aparelho, a
lib autorizada substitui `Intl` sem mudar estas assinaturas).

Fuso fixo: `export const TIME_ZONE = "America/Sao_Paulo";` — nunca "-03:00"
fixo no código; o offset é derivado do `Intl` (`timeZoneName: "longOffset"`
ou `formatToParts`) para sobreviver a uma eventual volta do horário de
verão no Brasil.

| Função                 | Assinatura                                                                                      | Comportamento                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatLongDate`       | `(d: Date) => string`                                                                           | pt-BR, `America/Sao_Paulo`, `"quinta-feira, 02 de abril de 2026"`. AC-306-01.                                                                                                                   |
| `formatTime`           | `(d: Date) => string`                                                                           | pt-BR, `America/Sao_Paulo`, `"hh:mm"` (ex.: `"23:30"`). AC-306-01.                                                                                                                              |
| `dayKey`               | `(d: Date) => string`                                                                           | Chave `AAAA-MM-DD` no fuso fixo (ex.: `"2026-04-02"`). AC-306-02/03.                                                                                                                            |
| `groupByDayKey`        | `<T>(items: T[], getDate: (item: T) => string) => Map<string, T[]>`                             | Agrupa itens genéricos (ex.: `Appointment[]` via `scheduledAt`) por `dayKey`, no fuso fixo. AC-306-02.                                                                                          |
| `getVisibleMonthRange` | `(year: number, month: number) => { start: Date; end: Date }`                                   | `month` 0-indexado (como `Date`). Retorna o instante de início (00:00 do dia 1, fuso fixo) e o instante de fim exclusivo (00:00 do dia 1 do mês seguinte, fuso fixo) do mês visível. AC-306-03. |
| `isToday`              | `(d: Date) => boolean`                                                                          | Compara `dayKey(d)` com `dayKey(now)`, `now` real (`new Date()`), sempre no fuso fixo. AC-306-05.                                                                                               |
| `getTodayKey`          | `() => string`                                                                                  | `dayKey(new Date())` no fuso fixo. AC-306-05.                                                                                                                                                   |
| `toBrasiliaISOString`  | `(parts: { year: number; month: number; day: number; hour: number; minute: number }) => string` | Interpreta os campos como horário de Brasília (não do aparelho) e serializa em ISO 8601 com o offset vigente em Brasília naquele instante (derivado do `Intl`, não fixo). AC-306-04.            |

`month` em `getVisibleMonthRange` segue a convenção 0-indexada do próprio
`Date` (0 = janeiro), para não exigir conversão extra nos consumidores.

## Limites

Fase 1 (contrato + testes + vermelho): todas as funções acima lançam
`Error("not implemented")` em `src/utils/date.ts`. Executor pode editar
apenas `src/utils/date.ts`, `src/utils/__tests__/date.test.ts`, este
contrato e `docs/entrega-1/TRACKING.md`. Proibido: alterar
`src/api/types.ts` ou qualquer outro arquivo fora de `src/utils/**` e
`docs/contracts/t-306-datas-fuso.md`; instalar dependências; commit/push
antes da aprovação da fase 1; fixar offset "-03:00" no código.

Testes cobrem: cada função com pelo menos um caso feliz; horários perto da
meia-noite em UTC que cruzam o dia em `America/Sao_Paulo` (ex.:
`2026-04-03T02:30:00Z` = 02/04/2026 23:30 em SP, conforme Apêndice A de
COMPATIBILIDADE.md); instantes com offsets de entrada diferentes
(ex.: `"2026-04-02T23:00:00-03:00"` vs. equivalente em `Z`); e um cenário
com `process.env.TZ` alterado para simular aparelho em outro fuso (ex.:
`"America/Los_Angeles"` ou `"UTC"`), restaurando o valor original no
`afterEach`/`finally` do próprio teste.

Validação: `pnpm exec vitest run src/utils/__tests__/date.test.ts`,
`pnpm run typecheck`, `pnpm run lint`, `pnpm exec prettier --check` nos
arquivos tocados.

## Pendências

- `Intl` no Hermes em runtime real é verificado pelo AC-108-03 (T-108), não
  por esta tarefa; testes aqui rodam sob Node/Vitest. Se o AC-108-03 falhar
  no aparelho, a implementação (fase 2) passa a usar a lib de datas
  autorizada em G-03, sem alterar as assinaturas deste contrato.
- Fase 2 (implementação real) depende de aprovação do vermelho pelo
  orquestrador antes de prosseguir.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato,
  testes e vermelho) da T-306, após leitura de BACKLOG, GATES (G-13, G-03),
  COMPATIBILIDADE (Apêndice A) e do contrato t-305 (tipo `Appointment`).
- 2026-09-25: vermelho aprovado pelo orquestrador claude-opus-5-5 (11 falhas,
  todas "not implemented", sem erro de import/ambiente). Fase 2 implementada
  pelo executor Sonnet em `src/utils/date.ts` usando `Intl.DateTimeFormat`
  (`timeZoneName: "longOffset"`) para derivar o offset de `America/Sao_Paulo`
  sem fixar "-03:00" no código, conforme condições da aprovação. `pnpm exec
vitest run src/utils/__tests__` (11/11), `pnpm run test` (206/206),
  `pnpm run typecheck` e `pnpm run lint` sem erros.
