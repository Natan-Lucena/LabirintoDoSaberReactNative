// Registro do token de push (NOT-02). Falhas são silenciosas: nada de erro na tela
// e nada de dado pessoal no log.
import { registerPushToken } from "@/api/endpoints/push";
import { ApiError } from "@/api/errors";
import { getEasProjectId, loadNotifications, PUSH_CHANNEL_ID } from "./support";
import { savePushToken } from "./tokenStore";

export type PushPermission = "granted" | "denied" | "undetermined";

export type RegisterResult =
  "registered" | "denied" | "unsupported" | "invalid-token" | "error";

export async function getPushPermission(): Promise<PushPermission> {
  const Notifications = loadNotifications();
  if (!Notifications) return "undetermined";
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    return current.canAskAgain ? "undetermined" : "denied";
  } catch {
    return "undetermined";
  }
}

/**
 * Cria o canal, garante a permissão e registra o token. Com `ask: false` não
 * abre o pedido do sistema: só registra se a permissão já foi concedida.
 * Nenhuma chamada a `push-token` antes da permissão (AC-NOT-02-01).
 */
export async function registerForPush(options: {
  ask: boolean;
}): Promise<RegisterResult> {
  const Notifications = loadNotifications();
  if (!Notifications) return "unsupported";
  try {
    await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
      name: "Lembretes",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    let granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) {
      if (!options.ask) return "denied";
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return "denied";
    const projectId = getEasProjectId();
    if (!projectId) {
      if (__DEV__) console.warn("[push] projectId do EAS ausente.");
      return "error";
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return await sendToken(token);
  } catch {
    if (__DEV__) console.warn("[push] não foi possível registrar o token.");
    return "error";
  }
}

/** Envia um token já obtido (também usado quando o token muda). */
export async function sendToken(token: string): Promise<RegisterResult> {
  try {
    await registerPushToken({ token, platform: "android" });
    await savePushToken(token);
    return "registered";
  } catch (error) {
    if (error instanceof ApiError && error.code === "INVALID_PUSH_TOKEN")
      return "invalid-token";
    return "error";
  }
}
