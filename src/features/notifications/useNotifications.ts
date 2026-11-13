// Dados das notificações no app (NOT-01): contador do sino, lista paginada por
// cursor e escritas de leitura. Sem push (G-59).
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationQueryKeys,
} from "@/api/endpoints/notifications";

/** Contador do sino: recarrega ao abrir o app/tela (mount) e ao voltar o foco. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useNotificationsList() {
  return useInfiniteQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: ({ pageParam }) =>
      listNotifications(pageParam ? { cursor: pageParam } : {}),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });
}
