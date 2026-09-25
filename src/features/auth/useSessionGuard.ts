import { useEffect } from "react";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";

import { APP_DESTINATION, AUTH_DESTINATION } from "@/features/auth/routes";
import { useAuthStore } from "@/stores/auth";

export type SessionGuardTarget = "idle" | "auth" | "app";

export function useSessionGuardTarget(): SessionGuardTarget {
  const status = useAuthStore((state) => state.status);

  if (status === "idle") {
    return "idle";
  }

  return status === "authenticated" ? "app" : "auth";
}

export function useSessionGuard(): void {
  const target = useSessionGuardTarget();
  const segments = useSegments();
  const router = useRouter();
  // T-502: evita "Attempted to navigate before mounting the Root Layout" no
  // primeiro boot com sessão salva, quando o guard decide antes do navegador
  // (Root Layout do expo-router) terminar de montar.
  const navigationKey = useRootNavigationState()?.key;
  const isInAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (target === "idle" || !navigationKey) {
      return;
    }

    if (target === "app" && isInAuthGroup) {
      router.replace(APP_DESTINATION);
    }

    if (target === "auth" && !isInAuthGroup) {
      router.replace(AUTH_DESTINATION);
    }
  }, [target, router, navigationKey, isInAuthGroup]);
}
