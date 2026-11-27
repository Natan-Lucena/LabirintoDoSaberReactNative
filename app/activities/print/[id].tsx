import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { PrintableScreen } from "@/features/activities/printable/PrintableScreen";

export default function PrintableRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PrintableScreen taskId={id ?? ""} />;
}
