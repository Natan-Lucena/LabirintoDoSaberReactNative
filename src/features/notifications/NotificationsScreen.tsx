import { useEffect, useRef, useState, type ReactElement } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ApiError } from "@/api/errors";
import type { AppNotification } from "@/api/types";
import { AppHeader } from "@/components/ds/AppHeader";
import { DsButton } from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { color, semanticColor, typography } from "@/theme";
import { openNotificationTarget } from "./openTarget";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "./useNotifications";

const UNAVAILABLE = "Este item não está mais disponível.";

export function NotificationsScreen(): ReactElement {
  const router = useRouter();
  const list = useNotificationsList();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [notice, setNotice] = useState<string | null>(null);

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const lastPage = list.data?.pages[list.data.pages.length - 1];
  const hasUnread = items.some((item) => !item.readAt);

  // Uma página pode vir vazia com `nextCursor`: continua carregando, uma
  // tentativa por cursor; em erro, para e oferece "Tentar novamente".
  const attemptedCursor = useRef<string | undefined>(undefined);
  const nextCursor = lastPage?.nextCursor;
  const lastPageEmpty = lastPage !== undefined && lastPage.items.length === 0;
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = list;
  useEffect(() => {
    if (
      lastPageEmpty &&
      nextCursor !== undefined &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError &&
      attemptedCursor.current !== nextCursor
    ) {
      attemptedCursor.current = nextCursor;
      void fetchNextPage();
    }
  }, [
    lastPageEmpty,
    nextCursor,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  async function open(notification: AppNotification) {
    setNotice(null);
    if (!notification.readAt) markRead.mutate(notification.id);
    const target = notification.target;
    if (!target) return;
    try {
      await openNotificationTarget(router, target);
    } catch (error) {
      setNotice(
        error instanceof ApiError && error.status === 404
          ? UNAVAILABLE
          : "Não foi possível abrir agora. Tente de novo.",
      );
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Notificações" onBack={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => void list.refetch()}
        onEndReached={() => {
          if (
            list.hasNextPage &&
            !list.isFetchingNextPage &&
            !list.isFetchNextPageError
          ) {
            void list.fetchNextPage();
          }
        }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.top}>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {isFetchNextPageError ? (
              <View style={styles.top}>
                <Text style={styles.notice}>
                  Não foi possível carregar mais notificações.
                </Text>
                <DsButton
                  label="Tentar novamente"
                  variant="secondary"
                  onPress={() => void fetchNextPage()}
                />
              </View>
            ) : null}
            {hasUnread ? (
              <DsButton
                label="Marcar todas como lidas"
                variant="secondary"
                onPress={() => markAll.mutate()}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          list.isPending || list.isFetchingNextPage ? (
            <Text style={styles.muted}>Carregando notificações...</Text>
          ) : list.isError ? (
            <Text style={styles.muted}>
              Não foi possível carregar as notificações.
            </Text>
          ) : (
            <Text style={styles.muted}>Nenhuma notificação por enquanto.</Text>
          )
        }
        renderItem={({ item }) => (
          <StaticPressable
            accessibilityRole="button"
            accessibilityLabel={`${item.readAt ? "" : "Não lida. "}${item.title}. ${item.body}`}
            onPress={() => void open(item)}
            style={[styles.card, item.readAt ? null : styles.unread]}
          >
            <Text style={[styles.title, item.readAt ? null : styles.bold]}>
              {item.title}
            </Text>
            <Text style={styles.body}>{item.body}</Text>
          </StaticPressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 12 },
  top: { gap: 12 },
  card: {
    gap: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  unread: { backgroundColor: color.brand[100], borderColor: color.brand[700] },
  title: { ...typography.cardTitle, color: color.text },
  bold: { fontWeight: "800" },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: semanticColor.textSecondaryOnSurface,
  },
  muted: { fontSize: 14, color: semanticColor.textSecondaryOnBackground },
  notice: { fontSize: 14, color: semanticColor.dangerTextOnSurface },
});
