import type { ReactElement } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { SessionPlayerScreen } from "@/features/sessions/player/SessionPlayerScreen";
import { color } from "@/theme";

// FEC-05.4: o player não tem cabeçalho; a área segura mantém "Atividade N de M"
// longe da barra de status.
export default function PlayerRoute(): ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.surface }}>
      <SessionPlayerScreen />
    </SafeAreaView>
  );
}
