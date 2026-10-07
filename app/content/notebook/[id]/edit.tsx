import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { NewNotebookScreen } from "@/features/content-create/notebook/NewNotebookScreen";

export default function EditNotebookRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewNotebookScreen notebookId={id} />;
}
