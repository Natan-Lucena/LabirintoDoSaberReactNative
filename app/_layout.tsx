import "../global.css";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProviders } from "@/app-shell/AppProviders";
import { BootGate } from "@/app-shell/BootGate";
import { SessionGuard } from "@/features/auth/SessionGuard";

// Composição do root (T-502): safe area -> Gesture Handler -> QueryProvider
// (dentro de AppProviders) -> SessionGuard -> BootGate (segura o splash) ->
// navegação.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProviders>
          <SessionGuard>
            <BootGate>
              <Stack screenOptions={{ headerShown: false }} />
            </BootGate>
          </SessionGuard>
        </AppProviders>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
