import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ApplyScaleScreen } from "@/features/assessments/apply/ApplyScaleScreen";

export default function ApplyScaleRoute(): ReactElement {
  const { templateId, studentId, applicationId } = useLocalSearchParams<{
    templateId: string;
    studentId?: string;
    applicationId?: string;
  }>();

  return (
    <ApplyScaleScreen
      templateId={templateId}
      studentId={studentId || undefined}
      applicationId={applicationId || undefined}
    />
  );
}
