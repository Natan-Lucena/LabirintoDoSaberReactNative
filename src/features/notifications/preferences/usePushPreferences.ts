// Preferências de push (NOT-02): leitura e escrita otimista; erro restaura o valor.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationPreferences,
  pushQueryKeys,
  updateNotificationPreferences,
  type NotificationPreferencesUpdate,
} from "@/api/endpoints/push";
import type { NotificationPreferences } from "@/api/types";

export function usePushPreferences() {
  return useQuery({
    queryKey: pushQueryKeys.preferences,
    queryFn: getNotificationPreferences,
  });
}

export function applyUpdate(
  current: NotificationPreferences,
  update: NotificationPreferencesUpdate,
): NotificationPreferences {
  return {
    pushEnabled: update.pushEnabled ?? current.pushEnabled,
    kinds: {
      ...current.kinds,
      ...update.kinds,
    } as NotificationPreferences["kinds"],
  };
}

export function useUpdatePushPreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (update) => {
      await client.cancelQueries({ queryKey: pushQueryKeys.preferences });
      const previous = client.getQueryData<NotificationPreferences>(
        pushQueryKeys.preferences,
      );
      if (previous)
        client.setQueryData(
          pushQueryKeys.preferences,
          applyUpdate(previous, update),
        );
      return { previous };
    },
    onError: (_error, _update, context) => {
      if (context?.previous)
        client.setQueryData(pushQueryKeys.preferences, context.previous);
    },
    onSuccess: (saved) => {
      client.setQueryData(pushQueryKeys.preferences, saved);
    },
  });
}
