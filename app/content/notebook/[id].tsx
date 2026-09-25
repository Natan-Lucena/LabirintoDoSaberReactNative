import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { NotebookDetailScreen } from "@/features/content-detail/notebook/NotebookDetailScreen";

export default function NotebookDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <NotebookDetailScreen notebookId={id ?? ""} />;
}
