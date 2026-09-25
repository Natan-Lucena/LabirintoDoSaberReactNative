import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ComingSoonScreen } from "@/features/shell/ComingSoonScreen";

export default function ComingSoonRoute(): ReactElement {
  const { title } = useLocalSearchParams<{ title?: string }>();

  return <ComingSoonScreen title={title ?? "Em breve"} />;
}
