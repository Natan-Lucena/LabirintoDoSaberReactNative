import type { ReactElement } from "react";
import { Tabs, useRouter } from "expo-router";

import { AppHeader } from "@/components/ds/AppHeader";
import { BottomNav } from "@/components/ds/BottomNav";
import { useUnreadNotificationCount } from "@/features/notifications/useNotifications";
import { TAB_DEFINITIONS, useTabItems } from "@/features/shell/useTabItems";

// NAV-01/NAV-02: casca nova do Figma Make (BottomNav + AppHeader) em vez do
// TabBar/AppHeader da Entrega 1. Atividades e Relatórios continuam como
// rotas escondidas (href: null) porque são telas da V1.
function BottomNavAdapter(): ReactElement {
  const { items, activeKey } = useTabItems();

  return <BottomNav items={items} activeKey={activeKey} />;
}

// Rotas da V1 fora da tab bar.
const HIDDEN_TAB_TITLES: Record<string, string> = {
  activities: "Atividades",
  reports: "Relatórios",
};

// Cabeçalho das abas: sino com o contador de notificações não lidas (NOT-01).
function TabsHeader({ title }: { title: string }): ReactElement {
  const router = useRouter();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <AppHeader
      title={title}
      unreadCount={unreadCount ?? 0}
      onBellPress={() => router.push("/notifications")}
    />
  );
}

export default function TabsLayout(): ReactElement {
  return (
    <Tabs
      tabBar={() => <BottomNavAdapter />}
      screenOptions={{
        headerShown: true,
        header: ({ options }) => <TabsHeader title={options.title ?? ""} />,
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
