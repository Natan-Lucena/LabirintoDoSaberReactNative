import type { ReactElement } from "react";

import { ConfigureReportScreen } from "@/features/reports/configure/ConfigureReportScreen";

// REL-01: configurar e gerar o relatório (o /reports continua sendo a aba REL-05).
export default function NewReportRoute(): ReactElement {
  return <ConfigureReportScreen />;
}
