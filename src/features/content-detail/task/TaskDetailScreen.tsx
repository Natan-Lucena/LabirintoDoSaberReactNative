import type { ReactElement } from "react";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getTaskById } from "@/api/endpoints/content";
import { deleteTask } from "@/api/endpoints/task-delete";
import { ApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type { Task, TaskCategory } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { color, shape, typography } from "@/theme";

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};

export const taskQueryKeys = {
  detail: (id: string) => ["task", id] as const,
  list: ["task"] as const,
};

export interface TaskDetailScreenProps {
  taskId: string;
}

function fileName(url: string): string {
  const segments = url.split("/");
  return segments[segments.length - 1] || url;
}

export function TaskDetailScreen({
  taskId,
}: TaskDetailScreenProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useQuery({
    queryKey: taskQueryKeys.detail(taskId),
    queryFn: () => getTaskById(taskId),
  });

  const deleteMutation = useMutation({
    mutationFn: withOfflineGuard(() => deleteTask(taskId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.list });
      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(taskId) });
      setConfirmOpen(false);
      router.back();
    },
  });

  function goToEdit() {
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: "Editar Atividade" },
    });
  }

  const isNotFound =
    query.isError &&
    query.error instanceof ApiError &&
    query.error.code === "TASK_NOT_FOUND";

  const content = (() => {
    if (query.isPending) {
      return (
        <View style={styles.state}>
          <LoadingState label="Carregando atividade" />
        </View>
      );
    }

    if (isNotFound) {
      return (
        <View style={styles.state}>
          <Text style={styles.notFoundMessage} accessibilityRole="alert">
            Não encontrado
          </Text>
          <Button label="Voltar" onPress={router.back} variant="secondary" />
        </View>
      );
    }

    if (query.isError || !query.data) {
      return (
        <View style={styles.state}>
          <ErrorState
            message="Não foi possível carregar a atividade."
            onRetry={query.refetch}
          />
        </View>
      );
    }

    const task: Task = query.data;

    return (
      <View style={styles.content}>
        <Text style={styles.title}>
          Atividade de {CATEGORY_LABEL[task.category]}
        </Text>

        <View style={styles.promptCard}>
          <View style={styles.promptCardHeader}>
            <Text style={styles.promptLabel}>Enunciado</Text>
            <Ionicons name="pencil-outline" size={18} color={color.accent} />
          </View>
          <Text style={styles.promptText}>{task.prompt}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Alternativas</Text>
          {task.alternatives.map((alternative) => (
            <View key={alternative.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons
                  name={alternative.isCorrect ? "checkmark" : "ellipse-outline"}
                  size={18}
                  color={color.accent}
                />
              </View>
              <Text style={styles.itemText}>{alternative.text}</Text>
              {alternative.isCorrect ? (
                <Text style={styles.correctLabel}>Correta</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Material de Apoio</Text>
          {task.audioFile || task.imageFile ? (
            <>
              {task.audioFile ? (
                <View style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    <Ionicons
                      name="headset-outline"
                      size={18}
                      color={color.accent}
                    />
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text style={styles.itemText}>Áudio da Atividade</Text>
                    <Text style={styles.itemFileName}>
                      {fileName(task.audioFile)}
                    </Text>
                  </View>
                </View>
              ) : null}
              {task.imageFile ? (
                <View style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    <Ionicons
                      name="image-outline"
                      size={18}
                      color={color.accent}
                    />
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text style={styles.itemText}>Imagem da Atividade</Text>
                    <Text style={styles.itemFileName}>
                      {fileName(task.imageFile)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyMaterial}>Sem material de apoio</Text>
          )}
        </View>

        {deleteMutation.isError ? (
          <Text
            style={styles.deleteError}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            Não foi possível excluir a atividade.
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            onPress={() => setConfirmOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Excluir Atividade"
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color={color.pink} />
            <Text style={styles.deleteButtonLabel}>Excluir Atividade</Text>
          </Pressable>
          <View style={styles.editButtonWrapper}>
            <Button label="Editar Atividade" onPress={goToEdit} />
          </View>
        </View>
      </View>
    );
  })();

  return (
    <Screen scroll>
      <AppHeader
        title="Atividade"
        onMenuPress={router.back}
        onAvatarPress={() => undefined}
      />
      {content}

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Excluir Atividade?</Text>
            <View style={styles.modalActions}>
              <View style={styles.modalActionButton}>
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setConfirmOpen(false)}
                />
              </View>
              <View style={styles.modalActionButton}>
                <Button
                  label="Excluir"
                  onPress={() => deleteMutation.mutate()}
                  loading={deleteMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
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
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  promptCard: {
    backgroundColor: color.selection,
    borderWidth: shape.hairlineWidth,
    borderColor: color.primary,
    borderRadius: shape.cardRadius,
    padding: 16,
    gap: 8,
  },
  promptCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promptLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.accent,
  },
  promptText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: color.surface,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    borderRadius: shape.cardRadius,
    padding: 14,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.selection,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  itemTextGroup: { flex: 1, gap: 2 },
  itemFileName: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.textSecondary,
  },
  correctLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.accent,
  },
  emptyMaterial: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
  deleteError: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.pink,
  },
  footer: { flexDirection: "row", gap: 8, marginTop: 4 },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: shape.minTouchTarget,
    borderRadius: shape.buttonRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.pink,
    backgroundColor: color.surface,
    paddingHorizontal: 14,
  },
  deleteButtonLabel: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
    color: color.pink,
  },
  editButtonWrapper: { flex: 1.4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  modalActions: { flexDirection: "row", gap: 8 },
  modalActionButton: { flex: 1 },
});
