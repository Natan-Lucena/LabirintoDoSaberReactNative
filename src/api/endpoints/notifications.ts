// Notificações no app: leitura (API-05, leva 3). Contrato PROVISÓRIO copiado de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §7, a conferir em API-04. Sem push (G-59).
// Marcar como lida e "marcar todas" ficam com a NOT-01. Mocks em
// src/mocks/handlers/notifications.ts.
import { apiClient } from "@/api/client";
import type { ListNotificationsFilters, NotificationsPage } from "@/api/types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: (filters: ListNotificationsFilters = {}) =>
    [...notificationQueryKeys.all, "list", filters] as const,
  unreadCount: () => [...notificationQueryKeys.all, "unread-count"] as const,
};

/** GET /notification/ — `{ items, nextCursor? }`; `400` em limite ou cursor inválido. */
export async function listNotifications(
  filters: ListNotificationsFilters = {},
): Promise<NotificationsPage> {
  // Query na própria URL: o adaptador de mocks lê `searchParams`.
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  const response = await apiClient.get<NotificationsPage>(
    query ? `/notification/?${query}` : "/notification/",
  );

  return response.data;
}

/** GET /notification/unread-count — contador do sino. */
export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>(
    "/notification/unread-count",
  );

  return response.data.count;
}
