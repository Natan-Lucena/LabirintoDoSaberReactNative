import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { PatientRecordsScreen } from "@/features/evolution/records/PatientRecordsScreen";

export default function PatientRecordsRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <PatientRecordsScreen patientId={id ?? ""} />;
}
