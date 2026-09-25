import type { QueryClient } from "@tanstack/react-query";

import { subscribeSessionExpired } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

let sessionExpiredNotice = false;

export function wasSessionExpired(): boolean {
  return sessionExpiredNotice;
}

export function acknowledgeSessionExpired(): void {
  sessionExpiredNotice = false;
}

export function connectSessionExpiry(queryClient: QueryClient): () => void {
  return subscribeSessionExpired(() => {
    sessionExpiredNotice = true;
    queryClient.clear();
    void useAuthStore
      .getState()
      .expireSession()
      .catch(() => undefined);
  });
}
