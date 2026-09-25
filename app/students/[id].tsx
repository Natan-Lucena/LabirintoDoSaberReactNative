import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { StudentDetailScreen } from "@/features/student-detail/StudentDetailScreen";

export default function StudentDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StudentDetailScreen studentId={id ?? ""} />;
}
