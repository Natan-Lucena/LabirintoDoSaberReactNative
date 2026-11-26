// Push (API-07, leva 4; CONTRATOS-BACKEND §6.2 a §6.5). Contrato PROPOSTO, mock-first.
// Estado só em memória: tokens registrados e preferências.
import type {
  NotificationKind,
  NotificationPreferences,
  PushToken,
} from "@/api/types";
import { MOCK_DEFAULT_NOTIFICATION_PREFERENCES } from "@/mocks/fixtures-e5";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

let preferences: NotificationPreferences = structuredClone(
  MOCK_DEFAULT_NOTIFICATION_PREFERENCES,
);
const tokens = new Map<string, PushToken>();

/** Troca as preferências devolvidas (testes e uso manual). */
export function setMockNotificationPreferences(
  next: NotificationPreferences,
): void {
  preferences = structuredClone(next);
}

/** Tokens registrados no mock (testes). */
export function getMockPushTokens(): string[] {
  return [...tokens.keys()];
}

export function resetMockPushState(): void {
  preferences = structuredClone(MOCK_DEFAULT_NOTIFICATION_PREFERENCES);
  tokens.clear();
}

const TOKEN_FORMAT = /^Expo(nent)?PushToken\[.+\]$/;
const KINDS: readonly NotificationKind[] = [
  "APPOINTMENTS_TODAY",
  "EVOLUTION_PENDING",
  "PLAN_REVIEW_DUE",
  "SCALE_DRAFT_STALE",
];

registerMockHandler(
  { method: "get", path: "/notification/preferences" },
  () => ({
    status: 200,
    data: structuredClone(preferences),
  }),
);

registerMockHandler(
  { method: "put", path: "/notification/preferences" },
  ({ body }) => {
    const input = (body ?? {}) as {
      pushEnabled?: unknown;
      kinds?: Record<string, unknown>;
    };
    const hasPush = input.pushEnabled !== undefined;
    const hasKinds = input.kinds !== undefined;
    if (!hasPush && !hasKinds) throw new MockApiError(400, "VALIDATION_ERROR");
    if (hasPush && typeof input.pushEnabled !== "boolean")
      throw new MockApiError(400, "VALIDATION_ERROR");
    const next = structuredClone(preferences);
    if (hasPush) next.pushEnabled = input.pushEnabled as boolean;
    if (hasKinds) {
      for (const [kind, value] of Object.entries(input.kinds ?? {})) {
        if (
          !KINDS.includes(kind as NotificationKind) ||
          typeof value !== "boolean"
        )
          throw new MockApiError(400, "VALIDATION_ERROR");
        next.kinds[kind as NotificationKind] = value;
      }
    }
    preferences = next;
    return { status: 200, data: structuredClone(preferences) };
  },
);

registerMockHandler(
  { method: "post", path: "/notification/push-token" },
  ({ body }) => {
    const input = (body ?? {}) as { token?: unknown; platform?: unknown };
    if (
      typeof input.token !== "string" ||
      (input.platform !== "android" && input.platform !== "ios")
    )
      throw new MockApiError(400, "VALIDATION_ERROR");
    if (!TOKEN_FORMAT.test(input.token))
      throw new MockApiError(400, "INVALID_PUSH_TOKEN");
    const now = new Date().toISOString();
    const existing = tokens.get(input.token);
    const saved: PushToken = {
      token: input.token,
      platform: input.platform,
      createdAt: existing?.createdAt ?? now,
      lastSeenAt: now,
    };
    tokens.set(input.token, saved);
    return { status: 200, data: saved };
  },
);

registerMockHandler(
  { method: "delete", path: "/notification/push-token" },
  ({ body }) => {
    const input = (body ?? {}) as { token?: unknown };
    if (typeof input.token !== "string" || input.token === "")
      throw new MockApiError(400, "VALIDATION_ERROR");
    tokens.delete(input.token);
    return { status: 204, data: undefined };
  },
);

export const pushMockHandlersRegistered = true;
