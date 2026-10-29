import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AppointmentDetailScreen } from "@/features/agenda/detail/AppointmentDetailScreen";

export default function AppointmentDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <AppointmentDetailScreen appointmentId={id ?? ""} />;
}
