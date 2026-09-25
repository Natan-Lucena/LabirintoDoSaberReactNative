# Contrato T-601 - Dados da Home mockados

## Objetivo e escopo

Fornecer `useHomeData` e seletores para a Home contra os módulos de API da T-305,
com os endpoints simulados pela camada de mocks da G-29. Inclui os dados
fictícios e handlers de `GET /appointment/`, `GET /student/`,
`GET /educator/get-last-sessions` e `GET /task-notebook/`.

Não inclui tela, componentes, navegação, integração com backend real ou cálculo
de taxa de acerto.

## Comportamento e aceite

- **AC-601-01:** `selectTodayAppointments` usa `isToday` (fuso fixo
  `America/Sao_Paulo`), mantém `CANCELLED` para exibição, exclui-o da contagem e
  ordena os itens por `scheduledAt` crescente.
- **AC-601-02:** `useHomeData` converte `ApiError` 404 com código
  `EDUCATOR_DOES_NOT_HAVE_SESSIONS` em `lastSessions: []`; outros erros seguem
  como erro da query.
- **AC-601-03:** `useHomeData` lê `listStudents` e associa cada agendamento pelo
  `studentId`; ausência de aluno devolve `student: null`, sem falhar a Home.
- **AC-601-04:** `EducatorLastSession` é exposto sem taxa de acerto calculada ou
  qualquer campo equivalente.
- **AC-601-05:** `selectRecentNotebooks` retorna os três primeiros itens na ordem
  recebida; uma lista vazia permite que a tela esconda a seção.

## Interfaces

```ts
export interface HomeAppointment {
  appointment: Appointment;
  student: Student | null;
}

export interface HomeData {
  educator: Educator | undefined;
  todayAppointments: HomeAppointment[];
  scheduledAppointmentsCount: number;
  lastSessions: EducatorLastSession[];
  recentNotebooks: TaskNotebookWithGroups[];
}

export function useHomeData(): HomeData;
export function loadHomeData(): Promise<HomeData>;
export function selectTodayAppointments(
  appointments: Appointment[],
): Appointment[];
export function countScheduledAppointments(appointments: Appointment[]): number;
export function selectRecentNotebooks(
  notebooks: TaskNotebookWithGroups[],
): TaskNotebookWithGroups[];
```

Chaves TanStack Query: `["educator", "me"]`, `["appointment"]`,
`["student"]`, `["educator", "last-sessions"]` e `["task-notebook"]`.

## Mocks

As fixtures são 100% fictícias e tipadas. A data dos agendamentos é calculada
no carregamento relativo a hoje em `America/Sao_Paulo`; há itens `PENDING`,
`COMPLETED` e `CANCELLED`, e cinco alunos. `setMockHomeScenario("no-sessions")`
faz o handler de últimas sessões devolver 404 com
`EDUCATOR_DOES_NOT_HAVE_SESSIONS`; `setMockHomeScenario("no-appointments")`
faz a agenda devolver `[]` para observar o estado 03.

## Plano de testes

| Arquivo                                           | Cobertura                                              |
| ------------------------------------------------- | ------------------------------------------------------ |
| `src/features/home/__tests__/selectors.test.ts`   | AC-601-01, AC-601-04 por revisão estrutural, AC-601-05 |
| `src/features/home/__tests__/useHomeData.test.ts` | AC-601-02 e AC-601-03                                  |
| `src/mocks/__tests__/home-handlers.test.ts`       | endpoints, dados de hoje e cenários mockados           |

## Limites e validação

Na fase 1, `useHomeData`, seletores e handlers lançam `Error("not implemented")`;
os testes devem falhar exclusivamente por esse comportamento ausente. Não alterar
testes após a aprovação do vermelho. Validação final: `pnpm exec vitest run
src/features/home/__tests__ src/mocks/__tests__/home-handlers.test.ts`, `pnpm run
test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm exec prettier --check` nos
tocadas, `python scripts/check-docs.py` e `git diff --check`.

## Histórico

- 2026-09-25: contrato criado para fase vermelha da T-601.
