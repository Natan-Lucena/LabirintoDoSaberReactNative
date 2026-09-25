import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { GroupDetailScreen } from "@/features/content-detail/group/GroupDetailScreen";

export default function GroupDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <GroupDetailScreen groupId={id ?? ""} />;
}
