import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ScaleResultScreen } from "@/features/assessments/result/ScaleResultScreen";

export default function ScaleResultRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ScaleResultScreen applicationId={id} />;
}
