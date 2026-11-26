import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ActivityTypeChooser } from "@/features/content-create/activity-types/ActivityTypeChooser";
import { NewTaskScreen } from "@/features/content-create/task/NewTaskScreen";

export default function NewTaskRoute(): ReactElement {
  const { type } = useLocalSearchParams<{ type?: string }>();

  // Sem `type`: escolha do tipo (ATV-11). Com `multipleChoice`: formulário de sempre.
  return type === "multipleChoice" ? (
    <NewTaskScreen />
  ) : (
    <ActivityTypeChooser />
  );
}
