import type { ReactElement } from "react";
import { Tabs, useRouter } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { TAB_DEFINITIONS, useTabItems } from "@/features/shell/useTabItems";

// T-501: TabBar/AppHeader customizados (T-203) em vez do header/tab bar
// nativos do Expo Router. UX2: 4 abas do Figma "Home sem agenda" — Agenda
// fica para depois e some da tab bar (continua acessível via /appointments).
function TabBarAdapter(): ReactElement {
  const { items, activeKey } = useTabItems();

  return <TabBar tabs={items} activeKey={activeKey} />;
}

export default function TabsLayout(): ReactElement {
  const router = useRouter();

  const openComingSoon = (title: string) =>
    router.push({ pathname: "/shell/coming-soon", params: { title } });

  return (
    <Tabs
      tabBar={() => <TabBarAdapter />}
      screenOptions={{
        headerShown: true,
        header: ({ options }) => (
          <AppHeader
            title={options.title ?? ""}
            onMenuPress={() => openComingSoon("Menu")}
            onAvatarPress={() => openComingSoon("Perfil")}
          />
        ),
      }}
    >
      {TAB_DEFINITIONS.map((tab) => (
        <Tabs.Screen
          key={tab.key}
          name={tab.segment}
          options={{ title: tab.headerTitle ?? tab.label }}
        />
      ))}
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}
