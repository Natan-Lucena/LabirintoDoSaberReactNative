import type { ReactElement } from "react";

import { ReportHistoryScreen } from "@/features/reports/history/ReportHistoryScreen";

// REL-03: histórico de relatórios (geral, ou do paciente com `studentId`).
export default function ReportHistoryRoute(): ReactElement {
  return <ReportHistoryScreen />;
}
