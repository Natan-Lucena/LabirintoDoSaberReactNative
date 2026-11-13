// Notificações no app (API-05, leva 3). Contrato PROVISÓRIO de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §7, a conferir em API-04. Estado só em
// memória; dados fictícios. Sem cron (NT-01): a lista já vem semeada. Sem push (G-59).
import type { AppNotification } from "@/api/types";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

export const MOCK_NOTIFICATION_IDS = {
  appointmentsToday: "mock-notification-1",
  evolutionPending: "mock-notification-2",
  planReviewDue: "mock-notification-3",
  scaleDraftStale: "mock-notification-4",
  /** Já vem lida. */
  read: "mock-notification-5",
} as const;

const seedNotifications: AppNotification[] = [
  {
    id: MOCK_NOTIFICATION_IDS.appointmentsToday,
    kind: "APPOINTMENTS_TODAY",
    title: "2 atendimentos hoje",
    body: "Você tem 2 atendimentos pendentes na agenda de hoje.",
    target: { type: "AGENDA_DAY", id: "2026-11-12" },
    createdAt: "2026-11-12T09:00:00.000Z",
  },
  {
    id: MOCK_NOTIFICATION_IDS.evolutionPending,
    kind: "EVOLUTION_PENDING",
    title: "Evolução pendente",
    body: "A sessão de Caio terminou há mais de 24 horas e ainda não tem evolução.",
    target: { type: "SESSION", id: "mock-session-pending" },
    createdAt: "2026-11-12T09:00:00.000Z",
  },
  {
    id: MOCK_NOTIFICATION_IDS.planReviewDue,
    kind: "PLAN_REVIEW_DUE",
    title: "Revisão de plano próxima",
    body: "A revisão do plano de Lia vence em 2 dias.",
    target: { type: "PLAN", id: "mock-plan-1" },
    createdAt: "2026-11-11T09:00:00.000Z",
  },
  {
    id: MOCK_NOTIFICATION_IDS.scaleDraftStale,
    kind: "SCALE_DRAFT_STALE",
    title: "Rascunho de escala parado",
    body: "O rascunho de escala de Caio está parado há 7 dias.",
    target: { type: "SCALE_APPLICATION", id: "mock-scale-app-draft" },
    createdAt: "2026-11-10T09:00:00.000Z",
  },
  {
    id: MOCK_NOTIFICATION_IDS.read,
    kind: "APPOINTMENTS_TODAY",
    title: "3 atendimentos hoje",
    body: "Você tinha 3 atendimentos pendentes na agenda.",
    target: { type: "AGENDA_DAY", id: "2026-11-09" },
    createdAt: "2026-11-09T09:00:00.000Z",
    readAt: "2026-11-09T12:00:00.000Z",
  },
];

const mockNotifications: AppNotification[] = structuredClone(seedNotifications);

/** Restaura as notificações semente (uso em testes e cenários manuais). */
export function resetMockNotificationState(): void {
  mockNotifications.splice(
    0,
    mockNotifications.length,
    ...structuredClone(seedNotifications),
  );
}

const byNewest = (a: AppNotification, b: AppNotification): number =>
  b.createdAt.localeCompare(a.createdAt);

registerMockHandler(
  { method: "get", path: "/notification/unread-count" },
  () => ({
    status: 200,
    data: { count: mockNotifications.filter((item) => !item.readAt).length },
  }),
);

registerMockHandler({ method: "get", path: "/notification/" }, ({ params }) => {
  const { unreadOnly, limit, cursor } = params;
  if (
    unreadOnly !== undefined &&
    unreadOnly !== "true" &&
    unreadOnly !== "false"
  )
    throw new MockApiError(400, "Validation error");
  if (
    limit !== undefined &&
    (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)
  )
    throw new MockApiError(400, "Validation error");
  if (cursor !== undefined && !/^\d+$/.test(cursor))
    throw new MockApiError(400, "Validation error");

  const size = limit === undefined ? 20 : Number(limit);
  const start = cursor === undefined ? 0 : Number(cursor);
  const filtered = mockNotifications
    .filter((item) => unreadOnly !== "true" || !item.readAt)
    .sort(byNewest);
  const items = filtered.slice(start, start + size);
  const nextCursor =
    start + size < filtered.length ? String(start + size) : undefined;

  return {
    status: 200,
    data: {
      items: structuredClone(items),
      ...(nextCursor === undefined ? {} : { nextCursor }),
    },
  };
});

// "/notification/read-all" é rota exata; vence "/notification/:id/read" (outro tamanho).
registerMockHandler({ method: "post", path: "/notification/read-all" }, () => {
  const now = new Date().toISOString();
  let updated = 0;
  for (const item of mockNotifications) {
    if (!item.readAt) {
      item.readAt = now;
      updated += 1;
    }
  }
  return { status: 200, data: { updated } };
});

registerMockHandler(
  { method: "post", path: "/notification/:id/read" },
  ({ params }) => {
    const notification = mockNotifications.find(
      (item) => item.id === params.id,
    );
    if (!notification) throw new MockApiError(404, "NOTIFICATION_NOT_FOUND");
    notification.readAt ??= new Date().toISOString();
    return { status: 200, data: structuredClone(notification) };
  },
);
