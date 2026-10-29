import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AppointmentFormScreen } from "@/features/agenda/form/AppointmentFormScreen";

export default function EditAppointmentRoute(): ReactElement {
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  return <AppointmentFormScreen appointmentId={id ?? ""} mode={mode} />;
}
