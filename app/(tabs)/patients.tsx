import type { ReactElement } from "react";
import { Tabs } from "expo-router";

import { PatientsListScreen } from "@/features/patients/list/PatientsListScreen";

export default function PatientsTab(): ReactElement {
  return (
    <>
      <Tabs.Screen options={{ headerShown: false }} />
      <PatientsListScreen />
    </>
  );
}
