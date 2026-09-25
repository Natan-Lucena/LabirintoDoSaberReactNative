import type { ReactElement } from "react";
import { Text } from "react-native";

import { Screen } from "@/components/Screen";

// Placeholder mínimo (T-501); conteúdo real da Home é da T-603.
export default function HomeTab(): ReactElement {
  return (
    <Screen>
      <Text>Início</Text>
    </Screen>
  );
}
