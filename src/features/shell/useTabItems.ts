import { useRouter, useSegments } from "expo-router";

import type { IconName } from "@/components/Icon";
import type { TabBarItem } from "@/components/TabBar";

export interface TabDefinition {
  key: string;
  label: string;
  headerTitle?: string;
  icon: IconName;
  segment: string;
}

// UX2 (Figma "Home sem agenda"): 4 abas — Agenda fica para depois (decisão do
// usuário). Rota /appointments continua existindo mas some da tab bar
// (app/(tabs)/_layout.tsx, href: null).
export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    key: "home",
    label: "Início",
    headerTitle: "Tela Inicial",
    icon: "home",
    segment: "index",
  },
  {
    key: "activities",
    label: "Atividades",
    icon: "activities",
    segment: "activities",
  },
  { key: "students", label: "Alunos", icon: "students", segment: "students" },
  {
    key: "reports",
    label: "Relatórios",
    icon: "reports",
    segment: "reports",
  },
];

export interface UseTabItemsResult {
  items: TabBarItem[];
  activeKey: string;
}

export function useTabItems(): UseTabItemsResult {
  const router = useRouter();
  const segments = useSegments();
  const lastSegment = segments[segments.length - 1];
  const activeDefinition =
    TAB_DEFINITIONS.find((tab) => tab.segment === lastSegment) ??
    TAB_DEFINITIONS[0];

  const items: TabBarItem[] = TAB_DEFINITIONS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    onPress: () =>
      router.push(
        tab.segment === "index"
          ? "/"
          : (`/${tab.segment}` as Parameters<typeof router.push>[0]),
      ),
  }));

  return { items, activeKey: activeDefinition.key };
}
