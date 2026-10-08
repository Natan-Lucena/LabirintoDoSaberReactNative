import type { ReactElement } from "react";

import { StudentReportsScreen } from "@/features/reports/student/StudentReportsScreen";

// REL-05: relatórios do paciente. Aba fora da barra, acessada pelo Recursos.
export default function ReportsTab(): ReactElement {
  return <StudentReportsScreen />;
}
