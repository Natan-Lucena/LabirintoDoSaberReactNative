// Push: preferências (API-07, leva 4) e escritas da NOT-02. Contrato PROPOSTO em
// docs/entrega-5/CONTRATOS-BACKEND.md §6.2 a §6.5 (mock-first).
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type {
  NotificationKind,
  NotificationPreferences,
  PushToken,
} from "@/api/types";

export const pushQueryKeys = {
  preferences: ["notifications", "preferences"] as const,
};

export const NOTIFICATION_KINDS: readonly NotificationKind[] = [
  "APPOINTMENTS_TODAY",
  "EVOLUTION_PENDING",
  "PLAN_REVIEW_DUE",
  "SCALE_DRAFT_STALE",
];

/** GET /notification/preferences — os padrões (tudo ligado) quando nunca salvou. */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await apiClient.get<NotificationPreferences>(
      "/notification/preferences",
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** POST /notification/push-token — upsert pelo token (PU-01, PU-08); `400 INVALID_PUSH_TOKEN`. */
export async function registerPushToken(input: {
  token: string;
  platform: PushToken["platform"];
}): Promise<PushToken> {
  try {
    const response = await apiClient.post<PushToken>(
      "/notification/push-token",
      input,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** DELETE /notification/push-token — corpo `{ token }`; idempotente (`204`). */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await apiClient.delete("/notification/push-token", { data: { token } });
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export interface NotificationPreferencesUpdate {
  pushEnabled?: boolean;
  kinds?: Partial<Record<NotificationKind, boolean>>;
}

/** PUT /notification/preferences — parcial; devolve o objeto completo. */
export async function updateNotificationPreferences(
  input: NotificationPreferencesUpdate,
): Promise<NotificationPreferences> {
  try {
    const response = await apiClient.put<NotificationPreferences>(
      "/notification/preferences",
      input,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
