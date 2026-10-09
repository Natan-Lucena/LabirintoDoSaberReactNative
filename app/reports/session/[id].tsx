import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { SessionReportScreen } from "@/features/reports/session/SessionReportScreen";

export default function SessionReportRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <SessionReportScreen sessionId={id ?? ""} />;
}
