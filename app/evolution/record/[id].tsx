import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { EvolutionDetailScreen } from "@/features/evolution/records/EvolutionDetailScreen";

export default function EvolutionRecordRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EvolutionDetailScreen evolutionId={String(id)} />;
}
