import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";

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
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (target === "idle") {
      return;
    }

    const destination = target === "auth" ? AUTH_DESTINATION : APP_DESTINATION;

    if (pathname !== destination) {
      router.replace(destination);
    }
  }, [target, pathname, router]);
}
