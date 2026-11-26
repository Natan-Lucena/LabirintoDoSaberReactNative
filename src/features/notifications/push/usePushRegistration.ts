// Registro e escuta do push nas abas (NOT-02). No Expo Go não faz nada.
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { notificationQueryKeys } from "@/api/endpoints/notifications";
import { openPushData } from "./openPush";
import { getPushPermission, registerForPush } from "./registerForPush";
import { loadNotifications } from "./support";
import { markPrompted, wasPrompted } from "./tokenStore";

export const PUSH_DENIED_MESSAGE =
  "Você pode ativar depois em Perfil → Notificações";

/** Pede a permissão (explicação já mostrada) e registra o token. */
export async function activatePush() {
  await markPrompted();
  return registerForPush({ ask: true });
}

export interface PushRegistration {
  promptVisible: boolean;
  message: string | null;
  accept: () => void;
  dismiss: () => void;
  hideMessage: () => void;
}

export function usePushRegistration(): PushRegistration {
  const router = useRouter();
  const client = useQueryClient();
  const [promptVisible, setPromptVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const Notifications = loadNotifications();
    if (!Notifications) return;
    let active = true;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const onResponse = (
      response: Awaited<
        ReturnType<typeof Notifications.getLastNotificationResponseAsync>
      >,
    ) => {
      if (!response) return Promise.resolve();
      return openPushData(
        router,
        client,
        response.notification.request.content.data,
      );
    };

    void (async () => {
      try {
        const permission = await getPushPermission();
        if (!active) return;
        if (permission === "granted") {
          // Registra de novo a cada login (upsert no servidor, PU-01).
          void registerForPush({ ask: false });
        } else if (permission === "undetermined" && !(await wasPrompted())) {
          if (active) setPromptVisible(true);
        }
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last && active) {
          await onResponse(last);
          await Notifications.clearLastNotificationResponseAsync();
        }
      } catch {
        // falhas de push nunca aparecem na tela
      }
    })();

    const received = Notifications.addNotificationReceivedListener(() => {
      void client.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount(),
      });
    });
    const responded = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void onResponse(response).catch(() => undefined);
      },
    );
    const tokenChanged = Notifications.addPushTokenListener(() => {
      // O token nativo mudou: obtém o token Expo de novo e reenvia.
      void registerForPush({ ask: false });
    });

    return () => {
      active = false;
      received.remove();
      responded.remove();
      tokenChanged.remove();
    };
  }, [client, router]);

  const accept = useCallback(() => {
    setPromptVisible(false);
    void activatePush().then((result) => {
      if (result === "denied") setMessage(PUSH_DENIED_MESSAGE);
    });
  }, []);

  const dismiss = useCallback(() => {
    setPromptVisible(false);
    void markPrompted();
  }, []);

  const hideMessage = useCallback(() => setMessage(null), []);

  return { promptVisible, message, accept, dismiss, hideMessage };
}
