// T-502: dono da integração. Liga uma vez, no boot, o tokenProvider (T-301),
// connectStorageToAuth (T-303) e connectSessionExpiry (T-402) à instância do
// QueryClient criada por QueryProvider (T-304), com cleanup no unmount.
import { useEffect, type PropsWithChildren, type ReactElement } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { QueryProvider } from "@/api/QueryProvider";
import { setTokenProvider } from "@/api/client";
import { connectStorageToAuth } from "@/storage/mmkv";
import { connectSessionExpiry } from "@/features/auth/session-expiry";
import { useAuthStore } from "@/stores/auth";

function AppShellWiring({ children }: PropsWithChildren): ReactElement {
  const queryClient = useQueryClient();

  useEffect(() => {
    setTokenProvider(() => useAuthStore.getState().token);
    const unsubscribeStorage = connectStorageToAuth();
    const unsubscribeSessionExpiry = connectSessionExpiry(queryClient);
    void useAuthStore.getState().hydrate();

    return () => {
      unsubscribeStorage();
      unsubscribeSessionExpiry();
    };
  }, [queryClient]);

  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren): ReactElement {
  return (
    <QueryProvider educatorId={null /* T-401 preenche o educatorId real */}>
      <AppShellWiring>{children}</AppShellWiring>
      {/* Ponto de extensão para T-803: montar <ResumeSessionPrompt /> aqui,
          dentro da árvore do QueryProvider (edição em série, sem tocar no
          restante da composição). */}
    </QueryProvider>
  );
}
