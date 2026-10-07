import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { NewGroupScreen } from "@/features/content-create/group/NewGroupScreen";

export default function EditGroupRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewGroupScreen groupId={id} />;
}
