import type { ReactElement } from "react";

import { StudentsListScreen } from "@/features/students-list/StudentsListScreen";

// NAV-01: reaproveita a listagem de alunos atual; o redesign é da PAC-01.
export default function PatientsTab(): ReactElement {
  return <StudentsListScreen />;
}
