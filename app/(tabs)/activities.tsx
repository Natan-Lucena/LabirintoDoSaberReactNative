import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ActivitiesScreen } from "@/features/activities/ActivitiesScreen";

export default function ActivitiesTab(): ReactElement {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();

  return <ActivitiesScreen studentId={studentId} />;
}
