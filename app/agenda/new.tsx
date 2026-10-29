import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { AppointmentFormScreen } from "@/features/agenda/form/AppointmentFormScreen";

export default function NewAppointmentRoute(): ReactElement {
  const { studentId, date } = useLocalSearchParams<{
    studentId?: string;
    date?: string;
  }>();
  return <AppointmentFormScreen studentId={studentId} date={date} />;
}
