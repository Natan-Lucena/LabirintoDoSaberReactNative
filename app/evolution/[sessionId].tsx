import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { EvolutionScreen } from "@/features/evolution/register/EvolutionScreen";

export default function EvolutionRoute(): ReactElement {
  const { sessionId, from } = useLocalSearchParams<{
    sessionId: string;
    from?: string;
  }>();

  return (
    <EvolutionScreen
      sessionId={String(sessionId)}
      from={from === "hub" || from === "entry" ? from : undefined}
    />
  );
}
