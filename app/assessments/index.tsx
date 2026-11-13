import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AssessmentsHubScreen } from "@/features/assessments/hub/AssessmentsHubScreen";

export default function AssessmentsRoute(): ReactElement {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();

  return <AssessmentsHubScreen studentId={studentId || undefined} />;
}
