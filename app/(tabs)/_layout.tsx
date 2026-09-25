import type { ReactElement } from "react";
import { Tabs, useRouter } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { TabBar } from "@/components/TabBar";
import { TAB_DEFINITIONS, useTabItems } from "@/features/shell/useTabItems";

// T-501: TabBar/AppHeader customizados (T-203) em vez do header/tab bar
// nativos do Expo Router. G-10: 5 abas do design.
export default function TabsLayout(): ReactElement {
  const router = useRouter();

  const openComingSoon = (title: string) =>
    router.push({ pathname: "/shell/coming-soon", params: { title } });

  return (
    <Tabs
      tabBar={() => {
        const { items, activeKey } = useTabItems();
        return <TabBar tabs={items} activeKey={activeKey} />;
      }}
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
          options={{ title: tab.label }}
        />
      ))}
    </Tabs>
  );
}
