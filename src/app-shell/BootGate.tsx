// T-502: mantém o splash até fontes (T-201) e reidratação (T-302) terminarem.
// Não controla a montagem do navegador: o Stack fica sempre presente (senão
// o SessionGuard tentaria navegar antes do Root Layout montar).
import { useEffect, type PropsWithChildren, type ReactElement } from "react";
import * as SplashScreen from "expo-splash-screen";

import { useAppFonts } from "@/theme/fonts";
import { useAuthStore } from "@/stores/auth";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function useBootReady(): boolean {
  const { fontsLoaded, fontError } = useAppFonts();
  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    if (fontError) {
      console.warn(
        "[BootGate] falha ao carregar fontes, usando fallback",
        fontError,
      );
    }
  }, [fontError]);

  return (fontsLoaded || !!fontError) && authStatus !== "idle";
}

export function BootGate({ children }: PropsWithChildren): ReactElement {
  const ready = useBootReady();

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  return <>{children}</>;
}
