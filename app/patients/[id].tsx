import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { PatientDetailScreen } from "@/features/patients/detail/PatientDetailScreen";

export default function PatientDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <PatientDetailScreen patientId={id ?? ""} />;
}
