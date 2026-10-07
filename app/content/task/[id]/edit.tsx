import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { NewTaskScreen } from "@/features/content-create/task/NewTaskScreen";

export default function EditTaskRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <NewTaskScreen taskId={id} />;
}
