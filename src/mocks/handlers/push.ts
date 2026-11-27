// Push (API-07, leva 4; CONTRATOS-BACKEND §6.4): leitura das preferências.
// Contrato PROPOSTO, mock-first. Registro do token e `PUT` entram com a NOT-02.
import type { NotificationPreferences } from "@/api/types";
import { MOCK_DEFAULT_NOTIFICATION_PREFERENCES } from "@/mocks/fixtures-e5";
import { registerMockHandler } from "./registry";

let preferences: NotificationPreferences = structuredClone(
  MOCK_DEFAULT_NOTIFICATION_PREFERENCES,
);

/** Troca as preferências devolvidas (testes e uso manual). */
export function setMockNotificationPreferences(
  next: NotificationPreferences,
): void {
  preferences = structuredClone(next);
}

export function resetMockPushState(): void {
  preferences = structuredClone(MOCK_DEFAULT_NOTIFICATION_PREFERENCES);
}

registerMockHandler(
  { method: "get", path: "/notification/preferences" },
  () => ({
    status: 200,
    data: structuredClone(preferences),
  }),
);

export const pushMockHandlersRegistered = true;
