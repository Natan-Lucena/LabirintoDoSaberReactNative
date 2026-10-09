import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ActivityPlayScreen } from "@/features/activities/engine/ActivityPlayScreen";

export default function ActivityPlayRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ActivityPlayScreen taskId={id ?? ""} />;
}
