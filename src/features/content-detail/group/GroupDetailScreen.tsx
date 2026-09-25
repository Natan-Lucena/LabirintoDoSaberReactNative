import type { ReactElement } from "react";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { deleteTaskGroup } from "@/api/endpoints/task-group-delete";
import { withOfflineGuard } from "@/api/query-client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FooterActions } from "@/components/FooterActions";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { CATEGORY_LABELS } from "@/features/activities/selectors";
import { useGroupDetailData } from "@/features/content-detail/group/useGroupDetailData";
import { color, shape, typography } from "@/theme";

export interface GroupDetailScreenProps {
  groupId: string;
}

export function GroupDetailScreen({
  groupId,
}: GroupDetailScreenProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { group, tasks, isPending, isError, isNotFound, refetch } =
    useGroupDetailData(groupId);
  const [isConfirmVisible, setConfirmVisible] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: withOfflineGuard(deleteTaskGroup),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-group"] });
      setConfirmVisible(false);
      router.back();
    },
  });

  function goToEdit() {
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: "Editar Grupo" },
    });
  }

  function goToTask(taskId: string) {
    router.push(`/content/task/${taskId}` as never);
  }

  function confirmDelete() {
    if (!group) {
      return;
    }
    deleteMutation.mutate(group.id);
  }

  const content = (() => {
    if (isPending) {
      return (
        <View style={styles.state}>
          <LoadingState label="Carregando grupo" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.state}>
          <ErrorState
            message="Não foi possível carregar o grupo."
            onRetry={refetch}
          />
        </View>
      );
    }

    if (isNotFound || !group) {
      return (
        <View style={styles.state}>
          <Text style={styles.notFoundMessage} accessibilityRole="alert">
            Não encontrado
          </Text>
          <Button label="Voltar" onPress={router.back} variant="secondary" />
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <Text style={styles.title}>{group.name}</Text>

        <View style={styles.categoryCard}>
          <Text style={styles.categoryLabel}>
            {CATEGORY_LABELS[group.category]}
          </Text>
          <Ionicons
            name="pencil-outline"
            size={18}
            color={color.primary}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades do Grupo</Text>
          {tasks.length === 0 ? (
            <EmptyState
              title="Sem atividades"
              message="Este grupo ainda não tem atividades."
            />
          ) : (
            <View style={styles.list}>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => goToTask(task.id)}
                  accessibilityRole="button"
                  accessibilityLabel={task.prompt}
                  style={styles.taskItem}
                >
                  <View style={styles.taskIcon}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={color.primary}
                    />
                  </View>
                  <View style={styles.taskText}>
                    <Text style={styles.taskPrompt} numberOfLines={2}>
                      {task.prompt}
                    </Text>
                    <Text style={styles.taskSecondary}>
                      {task.alternatives.length} alternativas
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {deleteMutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {deleteMutation.error.message}
          </Text>
        ) : null}

        <FooterActions
          onBack={() => setConfirmVisible(true)}
          backLabel="Excluir Grupo"
          onPrimary={goToEdit}
          primaryLabel="Editar Grupo"
        />

        {isConfirmVisible ? (
          <Modal
            transparent
            animationType="fade"
            visible
            onRequestClose={() => setConfirmVisible(false)}
          >
            <View style={styles.backdrop}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Excluir {group.name}?</Text>
                <View style={styles.confirmActions}>
                  <Button
                    label="Cancelar"
                    variant="secondary"
                    onPress={() => setConfirmVisible(false)}
                  />
                  <Button
                    label="Excluir"
                    onPress={confirmDelete}
                    loading={deleteMutation.isPending}
                  />
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    );
  })();

  return (
    <Screen scroll>
      <AppHeader
        title="Grupo"
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
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: color.selection,
    borderWidth: shape.hairlineWidth,
    borderColor: color.primary,
    borderRadius: shape.cardRadius,
    padding: 16,
  },
  categoryLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.primary,
  },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  list: { gap: 10 },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: color.surface,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    borderRadius: shape.cardRadius,
    padding: 14,
  },
  taskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.selection,
    alignItems: "center",
    justifyContent: "center",
  },
  taskText: { flex: 1, gap: 2 },
  taskPrompt: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  taskSecondary: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.textSecondary,
  },
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.pink,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    padding: 20,
    gap: 16,
    width: "100%",
  },
  confirmTitle: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  confirmActions: { flexDirection: "row", gap: 8 },
});
