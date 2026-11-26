// Push: preferências (API-07, leva 4). Contrato PROPOSTO em
// docs/entrega-5/CONTRATOS-BACKEND.md §2.6 e §6.4 (mock-first). Registro e remoção
// do token e `PUT /notification/preferences` entram com a tela NOT-02.
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type { NotificationKind, NotificationPreferences } from "@/api/types";

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
