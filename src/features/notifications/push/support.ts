// Suporte a push (NOT-02). No Expo Go o push remoto não existe: nada é importado
// nem chamado. O `expo-notifications` só é carregado, com `require`, no caminho
// suportado (development build), para não disparar o aviso do Expo Go.
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export type NotificationsModule = typeof import("expo-notifications");

export const PUSH_CHANNEL_ID = "lembretes";

/** Push remoto só no app instalado (development build) e no Android (iOS: QA-04). */
export function isPushSupported(): boolean {
  return (
    Platform.OS === "android" &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

/** Carrega o módulo nativo; `null` se não houver suporte ou o carregamento falhar. */
export function loadNotifications(): NotificationsModule | null {
  if (!isPushSupported()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications") as NotificationsModule;
  } catch {
    return null;
  }
}

export function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}
