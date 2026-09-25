import type { ReactElement } from "react";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { deleteTaskNotebook } from "@/api/endpoints/task-notebook-delete";
import { listTaskNotebooks } from "@/api/endpoints/content";
import { withOfflineGuard } from "@/api/query-client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { CATEGORY_LABELS } from "@/features/activities/selectors";
import { color, shape, typography } from "@/theme";

const NOTEBOOK_QUERY_KEY = ["task-notebook"] as const;

export interface NotebookDetailScreenProps {
  notebookId: string;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

export function NotebookDetailScreen({
  notebookId,
}: NotebookDetailScreenProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConfirmVisible, setConfirmVisible] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: NOTEBOOK_QUERY_KEY,
    queryFn: () => listTaskNotebooks(),
  });

  const deleteMutation = useMutation({
    mutationFn: withOfflineGuard(deleteTaskNotebook),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTEBOOK_QUERY_KEY });
      router.back();
    },
  });

  function goToEdit() {
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: "Editar Caderno" },
    });
  }

  function goToGroup(groupId: string) {
    router.push(
      `/content/group/${groupId}` as Parameters<typeof router.push>[0],
    );
  }

  const content = (() => {
    if (isPending && !data) {
      return (
        <View style={styles.state}>
          <LoadingState label="Carregando caderno" />
        </View>
      );
    }

    if (isError && !data) {
      return (
        <View style={styles.state}>
          <ErrorState
            message="Não foi possível carregar o caderno."
            onRetry={refetch}
          />
        </View>
      );
    }

    const entry = data?.find(({ notebook }) => notebook.id === notebookId);

    if (!entry) {
      return (
        <View style={styles.state}>
          <Text style={styles.notFoundMessage} accessibilityRole="alert">
            Não encontrado
          </Text>
          <Button label="Voltar" onPress={router.back} variant="secondary" />
        </View>
      );
    }

    const { notebook, taskGroups } = entry;

    return (
      <View style={styles.content}>
        <Text style={styles.title}>{notebook.description}</Text>

        <View style={styles.card}>
          <Pressable
            onPress={goToEdit}
            accessibilityRole="button"
            accessibilityLabel="Editar Caderno (atalho)"
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={20} color={color.primary} />
          </Pressable>
          <Text style={styles.cardLabel}>
            {CATEGORY_LABELS[notebook.category]}
          </Text>
          <Text style={styles.cardValue}>
            {pluralize(notebook.tasks.length, "tarefa", "tarefas")}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Grupos do Caderno</Text>
          {taskGroups.length === 0 ? (
            <EmptyState
              title="Nenhum grupo neste caderno"
              message="Este caderno ainda não tem grupos vinculados."
            />
          ) : (
            <View style={styles.list}>
              {taskGroups.map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => goToGroup(group.id)}
                  accessibilityRole="button"
                  accessibilityLabel={group.name}
                  style={styles.itemRow}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons
                      name="folder-open-outline"
                      size={18}
                      color={color.primary}
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{group.name}</Text>
                    <Text style={styles.itemSecondary}>
                      {pluralize(
                        group.tasksIds.length,
                        "atividade",
                        "atividades",
                      )}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {deleteMutation.isError ? (
          <Text style={styles.errorMessage} accessibilityRole="alert">
            Não foi possível excluir o caderno.
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            onPress={() => setConfirmVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Excluir Caderno"
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color={color.pink} />
            <Text style={styles.deleteButtonLabel}>Excluir Caderno</Text>
          </Pressable>
          <View style={styles.editAction}>
            <Button
              label="Editar Caderno"
              onPress={goToEdit}
              variant="primary"
            />
          </View>
        </View>

        {isConfirmVisible ? (
          <Modal
            transparent
            animationType="fade"
            visible
            onRequestClose={() => setConfirmVisible(false)}
          >
            <Pressable
              style={styles.backdrop}
              onPress={() => setConfirmVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Pressable style={styles.dialog} onPress={() => undefined}>
                <Text style={styles.dialogTitle}>Excluir Caderno?</Text>
                <View style={styles.dialogActions}>
                  <View style={styles.dialogAction}>
                    <Button
                      label="Cancelar"
                      onPress={() => setConfirmVisible(false)}
                      variant="secondary"
                    />
                  </View>
                  <View style={styles.dialogAction}>
                    <Button
                      label="Excluir"
                      onPress={() => {
                        setConfirmVisible(false);
                        deleteMutation.mutate(notebookId);
                      }}
                      variant="primary"
                      loading={deleteMutation.isPending}
                    />
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        ) : null}
      </View>
    );
  })();

  return (
    <Screen scroll>
      <AppHeader
        title="Caderno"
        onMenuPress={router.back}
        onAvatarPress={() => undefined}
      />
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  notFoundMessage: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontFamily: typography.screenTitle.fontFamily,
    color: color.text,
  },
  card: {
    backgroundColor: "#E6F8F6",
    borderRadius: shape.cardRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.primary,
    padding: 16,
    gap: 4,
  },
  editButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: shape.minTouchTarget,
    height: shape.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.primary,
  },
  cardValue: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  block: { gap: 8 },
  blockLabel: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  list: { gap: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    padding: 12,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.selection,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: { flex: 1, gap: 2 },
  itemTitle: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
  },
  itemSecondary: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
  errorMessage: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  footer: { flexDirection: "row", gap: 8, alignItems: "center" },
  deleteButton: {
    flex: 1,
    minHeight: shape.minTouchTarget,
    borderRadius: shape.buttonRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.pink,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonLabel: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
    color: color.text,
  },
  editAction: { flex: 1.4 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    padding: 20,
    gap: 16,
  },
  dialogTitle: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  dialogActions: { flexDirection: "row", gap: 8 },
  dialogAction: { flex: 1 },
});
