import { useEffect, useState, type ReactElement, type ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/api/query-client";
import { persistQueryClient } from "@/api/query-persister";
import { connectOnlineManagerToNetInfo } from "@/hooks/useOnline";

export function QueryProvider({
  educatorId,
  children,
}: {
  educatorId: string | null;
  children: ReactNode;
}): ReactElement {
  const [client] = useState(() => createQueryClient());

  useEffect(() => connectOnlineManagerToNetInfo(), []);

  useEffect(() => {
    if (!educatorId) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void persistQueryClient(client, educatorId).then((unsub) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [client, educatorId]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
