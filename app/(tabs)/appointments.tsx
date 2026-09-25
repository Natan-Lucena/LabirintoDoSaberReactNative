import type { ReactElement } from "react";
import { Text } from "react-native";

import { Screen } from "@/components/Screen";

// Placeholder mínimo (T-501); conteúdo real da Agenda é da T-903.
export default function AppointmentsTab(): ReactElement {
  return (
    <Screen>
      <Text>Agenda</Text>
    </Screen>
  );
}
