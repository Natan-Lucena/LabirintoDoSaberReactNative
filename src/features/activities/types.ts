import type { TaskCategory } from "@/api/types";

export type ActivityKind = "notebook" | "group" | "task";

export interface ActivityListItem {
  id: string;
  kind: ActivityKind;
  title: string;
  secondary: string;
  category: TaskCategory;
}
