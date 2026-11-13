import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { EvolutionScreen } from "@/features/evolution/register/EvolutionScreen";

export default function EvolutionRoute(): ReactElement {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  return <EvolutionScreen sessionId={String(sessionId)} />;
}
