# Contrato T-901 - Dados da agenda mockados

## Objetivo e escopo

Fornecer a consulta, os seletores e as mutações de agendamentos para as telas
T-903 e T-904, usando os módulos de API da T-305 e os mocks da G-29.

Não inclui componentes, tela, formulário, integração com backend real ou
notificação visual. A UI recebe o erro da mutação para informar a pessoa usuária.

## Comportamento e aceite

- **AC-901-01:** `selectAppointmentDayKeys` devolve as chaves de dias do mês
  visível que têm agendamento. `selectAppointmentsForDay` agrupa pelo dia em
  `America/Sao_Paulo`, ordena por `scheduledAt` e mantém cancelados na lista.
  `selectDaySummary` exclui `CANCELLED` do total, primeira e última sessão.
- **AC-901-02:** criar, editar, remarcar e excluir usam `withOfflineGuard`, não
  fazem retry e invalidam a chave compartilhada `['appointment']`, consumida
  tanto pela Agenda quanto pela Home.
- **AC-901-03:** editar/remarcar chamam `updateAppointment` somente com
  `scheduledAt` e/ou `observation`; `observation: null` limpa o valor.
- **AC-901-04:** erro `ApiError` 400 com código `NOT_FOUND` em editar ou excluir
  recarrega `['appointment']` antes de deixar o erro disponível para a UI. Não
  há reenvio automático após timeout ou erro de rede (G-08).

## Interfaces

```ts
export const appointmentQueryKeys: { all: readonly ['appointment'] };
export function useAppointments(): UseQueryResult<Appointment[]>;
export function selectAppointmentDayKeys(
  appointments: Appointment[], year: number, month: number,
): string[];
export function selectAppointmentsForDay(
  appointments: Appointment[], key: string,
): Appointment[];
export function selectDaySummary(appointments: Appointment[]): DaySummary;
export function createAppointmentMutationOptions(client: QueryClient): ...;
export function updateAppointmentMutationOptions(client: QueryClient): ...;
export function rescheduleAppointmentMutationOptions(client: QueryClient): ...;
export function deleteAppointmentMutationOptions(client: QueryClient): ...;
export function useCreateAppointmentMutation(): UseMutationResult<...>;
export function useUpdateAppointmentMutation(): UseMutationResult<...>;
export function useRescheduleAppointmentMutation(): UseMutationResult<...>;
export function useDeleteAppointmentMutation(): UseMutationResult<...>;
```

Os handlers mockados mantêm estado em memória na sessão: `POST /appointment/`,
`PUT /appointment/:id` e `DELETE /appointment/:id`. Um id inexistente em PUT ou
DELETE devolve `400 NOT_FOUND`; ids criados são fictícios.

## Plano de testes

| Arquivo                                                 | Cobertura                                |
| ------------------------------------------------------- | ---------------------------------------- |
| `src/features/appointments/__tests__/selectors.test.ts` | AC-901-01 e G-13                         |
| `src/features/appointments/__tests__/mutations.test.ts` | AC-901-02, AC-901-03 e AC-901-04         |
| `src/mocks/__tests__/appointment-handlers.test.ts`      | POST, PUT, DELETE e `NOT_FOUND` mockados |

## Limites e validação

Na fase 1, módulos e handlers novos lançam `Error("not implemented")`; os
testes devem falhar somente pela ausência do comportamento. Validação final:
`pnpm exec vitest run src/features/appointments/__tests__ src/mocks/__tests__/appointment-handlers.test.ts`,
`pnpm run test`, `pnpm run typecheck`, `pnpm run lint`, `npx prettier --check`

## Pendências

- O suporte a rotas parametrizadas foi autorizado pelo orquestrador na aprovação
  do vermelho. O adaptador preserva prioridade de rotas exatas, extrai
  `params.id` e mantém `404 MOCK_ROUTE_NOT_FOUND` para rota ausente.

## Histórico

- 2026-09-25: contrato da fase vermelha criado para T-901.
- 2026-09-25: vermelho aprovado; autorizado ajustar o adaptador/registry somente
  para segmentos `:param`, com teste de prioridade da rota exata.
