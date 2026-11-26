import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AppointmentFormScreen } from "@/features/agenda/form/AppointmentFormScreen";

export default function EditAppointmentRoute(): ReactElement {
  const { id, mode, scope } = useLocalSearchParams<{
    id?: string;
    mode?: string;
    scope?: string;
  }>();
  return (
    <AppointmentFormScreen appointmentId={id ?? ""} mode={mode} scope={scope} />
  );
}
