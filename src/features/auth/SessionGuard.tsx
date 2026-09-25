import type { PropsWithChildren, ReactElement } from "react";

import { useSessionGuard } from "@/features/auth/useSessionGuard";

export function SessionGuard({ children }: PropsWithChildren): ReactElement {
  useSessionGuard();

  return <>{children}</>;
}
