import { Stack } from "expo-router";

// Fluxo de sessão (telas 04-07), fora do grupo (tabs): cada tela desenha seu
// próprio AppHeader (T-702).
export default function SessionLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
