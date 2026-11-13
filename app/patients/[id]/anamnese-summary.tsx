import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AnamneseSummaryScreen } from "@/features/anamnese/summary/AnamneseSummaryScreen";

export default function PatientAnamneseSummaryRoute(): ReactElement {
  const { id, responseId } = useLocalSearchParams<{
    id?: string;
    responseId?: string;
  }>();
  return (
    <AnamneseSummaryScreen
      patientId={id ?? ""}
      responseId={responseId || undefined}
    />
  );
}
