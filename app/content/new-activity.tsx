import type { ReactElement } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

import { ActivityTypeForm } from "@/features/content-create/activity-types/ActivityTypeForm";
import { isActivityType } from "@/features/content-create/activity-types/schema";

export default function NewActivityRoute(): ReactElement {
  const { type } = useLocalSearchParams<{ type?: string }>();

  if (!isActivityType(type)) {
    return <Redirect href="/content/new-task" />;
  }
  return <ActivityTypeForm type={type} />;
}
