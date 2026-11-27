// Toque num push (app aberto, em segundo plano ou fechado): marca como lidas e
// abre o destino pela mesma regra da lista. Sem `target` abre a lista.
import type { QueryClient } from "@tanstack/react-query";

import {
  markNotificationRead,
  notificationQueryKeys,
} from "@/api/endpoints/notifications";
import type { PushData } from "@/api/types";
import { openNotificationTarget, type NotificationRouter } from "../openTarget";

function readPushData(data: unknown): Partial<PushData> {
  if (!data || typeof data !== "object") return {};
  const { notificationIds, target } = data as Record<string, unknown>;
  return {
    notificationIds: Array.isArray(notificationIds)
      ? notificationIds.filter((id): id is string => typeof id === "string")
      : undefined,
    target:
      target && typeof target === "object"
        ? (target as PushData["target"])
        : undefined,
  };
}

export async function openPushData(
  router: NotificationRouter,
  client: QueryClient,
  data: unknown,
): Promise<void> {
  const { notificationIds = [], target } = readPushData(data);
  await Promise.allSettled(
    notificationIds.map((id) => markNotificationRead(id)),
  );
  void client.invalidateQueries({ queryKey: notificationQueryKeys.all });
  if (!target) {
    router.push("/notifications");
    return;
  }
  try {
    await openNotificationTarget(router, target);
  } catch {
    router.push("/notifications");
  }
}
