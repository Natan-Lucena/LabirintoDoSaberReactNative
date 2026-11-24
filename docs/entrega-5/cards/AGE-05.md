# AGE-05 — Visão mensal da agenda

| Campo             | Valor                                                     |
| ----------------- | --------------------------------------------------------- |
| Bloco / onda      | D — Pacientes e agenda · **E5-0** (começa já)             |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço baixo-médio          |
| Estimativa        | P · 2–4 h de worker                                       |
| Dependências      | Nenhuma de backend nem de gate                            |
| Estado do backend | **Pronto**: usa `GET /appointment/`, que o app já carrega |
| História          | US5-02 (ver o mês)                                        |

## 1. Objetivo e valor

A Agenda mostra uma semana por vez. Para planejar, a profissional quer ver o mês e saber em que
dias já tem atendimento. O `MiniCalendar` mensal existe desde a Entrega 1, testado, mas não é
usado.

## 2. Referência de design

Tela 07 do protótipo ([07-agenda.html](../../design/telas/07-agenda.html)): "Mini calendário
mensal com ‹ ›, grade de 7 colunas, ponto nos dias com agendamento, dia selecionado destacado"
([DESIGN da Entrega 1](../../entrega-1/DESIGN.md)). O `AgendaScreen` do Make só tem a faixa da
semana; a alternância usa o `SegmentedControl` do design system.

## 3. Fluxo do usuário

1. Aba Agenda: abaixo do título, `SegmentedControl` **"Semana" / "Mês"** (padrão "Semana", como
   hoje). A escolha vive só no estado da tela.
2. "Mês": no lugar da navegação da semana e da faixa de dias, o `MiniCalendar` do mês do dia
   selecionado. Abaixo dele, a mesma lista do dia selecionado ("N atendimentos" e os cartões) e
   o botão "Novo atendimento" (com o dia selecionado, como hoje).
3. Tocar num dia: vira o dia selecionado; a lista abaixo muda (sem trocar de modo).
4. ‹ ›: troca o mês. O dia selecionado vai para o dia 1 do mês novo, ou para hoje se o mês novo
   for o atual.
5. Voltar para "Semana": mostra a semana do dia selecionado.

## 4. Estados da tela

Os da `AgendaScreen` não mudam: carregando ("Carregando agenda..."), erro ("Não foi possível
carregar a agenda." + "Tentar de novo"), offline (`PendingBanner` "Sem conexão - mostrando dados
salvos"), dia vazio ("Nenhum atendimento neste dia"). O mês sem atendimentos mostra o calendário
sem pontos.

## 5. Contrato de dados

- **Nenhuma rota nova.** A visão mensal usa o `useAppointments()` existente (`GET /appointment/`,
  chave `["appointment"]`), que já traz todos os atendimentos, é persistido e é invalidado por
  todas as mutações de atendimento.
- **Ajuste frente ao backlog:** a ficha dizia "pede só o intervalo visível" (`?from&to`). Como a
  lista completa já está em cache e é a fonte da faixa da semana, da lista de pacientes e da
  ficha, uma segunda query por mês criaria outra chave para invalidar sem ganho visível. O filtro
  por intervalo fica no seletor, no aparelho. Se a lista crescer a ponto de pesar, uma tarefa
  futura passa a Agenda inteira para `from`/`to`.
- **Seletor novo** em `src/features/appointments/selectors.ts`:
  `selectAppointmentCountsByDay(appointments, from, to): Record<dayKey, number>`, que conta só
  `PENDING` e `COMPLETED` (exclui `CANCELLED`) com o dia de `America/Sao_Paulo` (`dayKey`).

## 6. Regras de negócio e casos de borda

1. **Ponto só em dia com atendimento não cancelado** (AC-AGE-05-02). Hoje a faixa da semana usa
   `selectAppointmentDayKeys`, que conta cancelados: a faixa passa a usar o seletor novo também
   (mesma regra nas duas visões).
2. **Intervalo visível:** a grade do `react-native-calendars` mostra dias do mês anterior e do
   seguinte. As contagens cobrem da primeira à última célula visível (do primeiro dia da semana
   que contém o dia 1 até o último dia da semana que contém o último dia), calculadas por uma
   função pura `visibleGridRange(year, month)` em `src/features/agenda/month/range.ts`.
3. **Semana começa na segunda** (como a faixa "seg … dom"): o `MiniCalendar` passa `firstDay={1}`
   ao `Calendar`.
4. **Fuso:** chaves de dia sempre por `dayKey` (São Paulo). Um atendimento às 23:30 de São Paulo
   conta no dia de São Paulo, não no UTC.
5. O cabeçalho do `MiniCalendar` já tem ‹ › com rótulos "Mês anterior" / "Próximo mês" e alvos de
   44; não duplicar a navegação no topo.
6. O eyebrow "mês de ano" continua seguindo o dia selecionado.

## 7. Plano de implementação

1. `src/features/appointments/selectors.ts`: `selectAppointmentCountsByDay`.
2. `src/features/agenda/month/range.ts` (`visibleGridRange`) e `MonthView.tsx` (envolve o
   `MiniCalendar`, recebe `selectedDay`, `appointments` e `onSelectDay`).
3. `src/features/appointments/components/MiniCalendar.tsx`: `firstDay={1}`; nada mais.
4. `src/features/agenda/AgendaScreen.tsx`: `SegmentedControl`, estado `view: "week" | "month"`,
   renderização condicional e a faixa da semana com o seletor novo.
5. Testes: `range.ts` e o seletor (UT); `AgendaScreen` alterna e mostra o ponto (CT). Os testes
   atuais do `MiniCalendar` continuam passando.

## 8. Arquivos

- **Permitidos:** `src/features/agenda/AgendaScreen.tsx`, `src/features/agenda/month/**` (novo),
  `src/features/appointments/components/MiniCalendar.tsx`,
  `src/features/appointments/selectors.ts` e os testes dessas pastas.
- **Proibidos:** `src/api/**`, `src/features/agenda/form/**`, `src/features/agenda/detail/**`.

## 9. Critérios de aceite

| ID           | Critério                                                                                                              | Verificação |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-AGE-05-01 | `visibleGridRange` devolve da segunda-feira da 1ª semana ao domingo da última, e as contagens usam o dia de São Paulo | `UT`        |
| AC-AGE-05-02 | O ponto só aparece em dias com atendimento `PENDING` ou `COMPLETED`, no mês e na semana                               | `CT`        |
| AC-AGE-05-03 | Tocar num dia do mês muda a lista abaixo para aquele dia                                                              | `CT`        |

## 10. Como testar manualmente (Victor)

1. Agenda → "Mês": aparece o mês atual com pontos nos dias com atendimento; hoje destacado.
2. Toque num dia com ponto: a lista abaixo mostra os atendimentos daquele dia.
3. Cancele um atendimento que é o único do dia: o ponto some no mês e na semana.
4. ‹ e ›: o mês troca e a lista mostra o dia 1 (ou hoje, no mês atual).
5. Volte para "Semana": aparece a semana do dia selecionado.

## 11. Riscos e perguntas em aberto

- O `react-native-calendars` no Expo Go já é usado nos testes, mas o `MiniCalendar` nunca foi
  aberto no app: conferir o visual no emulador (QA-08). Se algo quebrar no Android, registrar e
  ajustar só o `MiniCalendar`.
- A visão escolhida não é lembrada entre aberturas. Se o usuário quiser, uma tarefa futura guarda
  a preferência no armazenamento do educador.

## 12. Fora do escopo

Recorrência e selo da série (AGE-06); `?from&to`; visão de dia em grade de horários; arrastar
atendimento.
