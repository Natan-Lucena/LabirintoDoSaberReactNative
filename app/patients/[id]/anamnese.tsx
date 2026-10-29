import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AnamneseResponsesScreen } from "@/features/anamnese/responses/AnamneseResponsesScreen";

export default function PatientAnamneseRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <AnamneseResponsesScreen patientId={id ?? ""} />;
}
