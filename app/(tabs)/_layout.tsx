import type { ReactElement } from "react";
import { Tabs, useRouter } from "expo-router";

import { AppHeader } from "@/components/ds/AppHeader";
import { BottomNav } from "@/components/ds/BottomNav";
import { TAB_DEFINITIONS, useTabItems } from "@/features/shell/useTabItems";

// NAV-01/NAV-02: casca nova do Figma Make (BottomNav + AppHeader) em vez do
// TabBar/AppHeader da Entrega 1. Mantemos as abas antigas (Atividades,
// Alunos, Relatórios) e /appointments como rotas escondidas (href: null)
// para não quebrar links internos; a limpeza é da NAV-03.
function BottomNavAdapter(): ReactElement {
  const { items, activeKey } = useTabItems();

  return <BottomNav items={items} activeKey={activeKey} />;
}

// Rotas da Entrega 1 que saem da tab bar mas continuam existindo.
const HIDDEN_TAB_TITLES: Record<string, string> = {
  activities: "Atividades",
  reports: "Relatórios",
  students: "Alunos",
  appointments: "Agenda",
};

export default function TabsLayout(): ReactElement {
  const router = useRouter();

  const openNotifications = () =>
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: "Notificações" },
    });

  return (
    <Tabs
      tabBar={() => <BottomNavAdapter />}
      screenOptions={{
        headerShown: true,
        header: ({ options }) => (
          <AppHeader
            title={options.title ?? ""}
            onBellPress={openNotifications}
          />
        ),
      }}
    >
      {TAB_DEFINITIONS.map((tab) => (
        <Tabs.Screen
          key={tab.key}
          name={tab.segment}
          options={{ title: tab.label }}
        />
      ))}
      {Object.entries(HIDDEN_TAB_TITLES).map(([segment, title]) => (
        <Tabs.Screen
          key={segment}
          name={segment}
          options={{ title, href: null }}
        />
      ))}
    </Tabs>
  );
}
