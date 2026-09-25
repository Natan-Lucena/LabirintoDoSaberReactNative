import { Stack } from "expo-router";

// Layout mínimo do grupo (auth); T-401 adiciona a rota de Login em série.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
