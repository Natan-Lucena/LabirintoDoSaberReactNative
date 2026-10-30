import type { ReactElement } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";

import { getTaskById } from "@/api/endpoints/content";
import { deleteTask } from "@/api/endpoints/task-delete";
import { ApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type { Task } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import {
  AppHeader,
  Badge,
  DsButton,
  InfoCard,
  SectionTitle,
} from "@/components/ds";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { isActivityTypePlayable } from "@/features/activities/engine/registry";
import {
  getCategoryLabel,
  getTypeLabel,
} from "@/features/reports/session/sessionReport";
import { color, shape, typography, semanticColor } from "@/theme";

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

  function goToPlay() {
    router.push({ pathname: "/activities/[id]", params: { id: taskId } });
  }
  function goToEdit() {
    router.push({
      pathname: "/content/task/[id]/edit",
      params: { id: taskId },
    });
  }

  const isNotFound =
    query.isError &&
    query.error instanceof ApiError &&
    query.error.code === "TASK_NOT_FOUND";

  let content: ReactElement;
  if (query.isPending && !query.data) {
    content = (
      <Text style={styles.statusText} accessibilityLabel="Carregando atividade">
        Carregando atividade
      </Text>
    );
  } else if (isNotFound || (!query.data && !query.isError)) {
    content = (
      <View style={styles.state}>
        <Text style={styles.statusText} accessible accessibilityRole="alert">
          Não encontrado
        </Text>
        <DsButton label="Voltar" onPress={router.back} variant="secondary" />
      </View>
    );
  } else if (query.isError && !query.data) {
    content = (
      <View style={styles.state}>
        <Text style={styles.statusText} accessible accessibilityRole="alert">
          Não foi possível carregar a atividade.
        </Text>
        <DsButton
          label="Tentar novamente"
          onPress={() => void query.refetch()}
          variant="secondary"
        />
      </View>
    );
  } else {
    const task: Task = query.data!;
    content = (
      <View style={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title}>
            Atividade de {getCategoryLabel(task.category)}
          </Text>
          <View style={styles.badges}>
            <Badge label={getCategoryLabel(task.category)} />
            <Badge label={getTypeLabel(task.type)} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle title="Enunciado" />
          <InfoCard icon="file" title="Enunciado" description={task.prompt} />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Alternativas" />
          {task.alternatives.map((alternative) => (
            <View key={alternative.id} style={styles.alternative}>
              <View style={styles.alternativeIcon}>
                <FigmaIcon
                  name={alternative.isCorrect ? "check" : "chevron"}
                  size={17}
                  color={color.brand[700]}
                />
              </View>
              <Text style={styles.alternativeText}>{alternative.text}</Text>
              {alternative.isCorrect ? <Badge label="Correta" /> : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle title="Material de apoio" />
          {task.audioFile || task.imageFile ? (
            <>
              {task.audioFile ? (
                <View style={styles.mediaCard}>
                  <InfoCard
                    icon="play"
                    title="Áudio da atividade"
                    description={fileName(task.audioFile)}
                  />
                  <AudioPlayer url={task.audioFile} />
                </View>
              ) : null}
              {task.imageFile ? (
                <View style={styles.mediaCard}>
                  <InfoCard
                    icon="file"
                    title="Imagem da atividade"
                    description={fileName(task.imageFile)}
                  />
                  <Image
                    source={{ uri: task.imageFile }}
                    accessibilityLabel="Imagem da atividade"
                    style={styles.imagePreview}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.mutedText}>Sem material de apoio</Text>
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
        <View style={styles.actions}>
          {isActivityTypePlayable(task.type) ? (
            <DsButton label="Jogar" icon="play" onPress={goToPlay} fullWidth />
          ) : null}
          <DsButton
            label="Editar Atividade"
            onPress={goToEdit}
            variant="secondary"
            fullWidth
          />
          <DsButton
            label="Excluir Atividade"
            onPress={() => setConfirmOpen(true)}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Atividade" onBack={router.back} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
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
                <DsButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setConfirmOpen(false)}
                />
              </View>
              <View style={styles.modalActionButton}>
                <DsButton
                  label="Excluir"
                  onPress={() => deleteMutation.mutate()}
                  loading={deleteMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  scrollContent: { flexGrow: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  intro: { gap: 10 },
  title: { ...typography.section, color: color.text },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { gap: 10 },
  alternative: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  alternativeIcon: { width: 28, alignItems: "center" },
  alternativeText: { ...typography.body, color: color.text, flex: 1 },
  mediaCard: { gap: 10 },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: shape.radius.md,
    backgroundColor: color.brand[50],
  },
  mutedText: { ...typography.body, color: color.textSecondary },
  statusText: {
    ...typography.body,
    color: color.text,
    textAlign: "center",
    margin: 24,
  },
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  deleteError: { ...typography.body, color: semanticColor.dangerTextOnSurface },
  actions: { gap: 10 },
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
  modalTitle: { ...typography.section, color: color.text, textAlign: "center" },
  modalActions: { flexDirection: "row", gap: 8 },
  modalActionButton: { flex: 1 },
});
