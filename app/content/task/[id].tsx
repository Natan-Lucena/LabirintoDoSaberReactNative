import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { TaskDetailScreen } from "@/features/content-detail/task/TaskDetailScreen";

export default function TaskDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <TaskDetailScreen taskId={id ?? ""} />;
}
