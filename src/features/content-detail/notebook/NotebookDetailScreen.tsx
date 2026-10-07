import type { ReactElement } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";

import { listTaskNotebooks } from "@/api/endpoints/content";
import { deleteTaskNotebook } from "@/api/endpoints/task-notebook-delete";
import { withOfflineGuard } from "@/api/query-client";
import {
  AppHeader,
  Badge,
  DsButton,
  InfoCard,
  SectionTitle,
} from "@/components/ds";
import { color, fontFamilies } from "@/theme";

const categoryLabels = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};
const queryKey = ["task-notebook"] as const;
const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;
export interface NotebookDetailScreenProps {
  notebookId: string;
}

export function NotebookDetailScreen({
  notebookId,
}: NotebookDetailScreenProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const notebooks = useQuery({ queryKey, queryFn: () => listTaskNotebooks() });
  const deletion = useMutation({
    mutationFn: withOfflineGuard(deleteTaskNotebook),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      router.back();
    },
  });
  function edit() {
    router.push({
      pathname: "/content/notebook/[id]/edit",
      params: { id: notebookId },
    });
  }
  const entry = notebooks.data?.find(
    ({ notebook }) => notebook.id === notebookId,
  );
  let body: ReactElement;
  if (notebooks.isPending && !notebooks.data)
    body = (
      <Text accessibilityLabel="Carregando caderno" style={styles.status}>
        Carregando caderno
      </Text>
    );
  else if (notebooks.isError && !notebooks.data)
    body = (
      <View style={styles.status}>
        <Text accessibilityRole="alert">
          Não foi possível carregar o caderno.
        </Text>
        <DsButton
          label="Tentar novamente"
          variant="secondary"
          onPress={() => notebooks.refetch()}
        />
      </View>
    );
  else if (!entry)
    body = (
      <View style={styles.status}>
        <Text accessibilityRole="alert">Não encontrado</Text>
        <DsButton label="Voltar" variant="secondary" onPress={router.back} />
      </View>
    );
  else {
    const { notebook, taskGroups } = entry;
    body = (
      <View style={styles.content}>
        <Text style={styles.title}>{notebook.description}</Text>
        <Badge label={categoryLabels[notebook.category]} />
        <InfoCard
          icon="book"
          title="Atividades"
          description={pluralize(notebook.tasks.length, "tarefa", "tarefas")}
        />
        <View style={styles.section}>
          <SectionTitle title="Grupos do caderno" />
          {taskGroups.length ? (
            taskGroups.map((group) => (
              <InfoCard
                key={group.id}
                icon="file"
                title={group.name}
                description={pluralize(
                  group.tasksIds.length,
                  "atividade",
                  "atividades",
                )}
                onPress={() =>
                  router.push(`/content/group/${group.id}` as never)
                }
              />
            ))
          ) : (
            <InfoCard
              icon="file"
              title="Nenhum grupo neste caderno"
              description="Este caderno ainda não tem grupos vinculados."
            />
          )}
        </View>
        {deletion.isError ? (
          <Text style={styles.error} accessibilityRole="alert">
            Não foi possível excluir o caderno.
          </Text>
        ) : null}
        <View style={styles.actions}>
          <DsButton
            label="Excluir Caderno"
            variant="secondary"
            onPress={() => setConfirmVisible(true)}
          />
          <DsButton label="Editar Caderno" onPress={edit} />
        </View>
        <Modal
          transparent
          visible={confirmVisible}
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Excluir Caderno?</Text>
              <View style={styles.actions}>
                <DsButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setConfirmVisible(false)}
                />
                <DsButton
                  label="Excluir"
                  onPress={() => deletion.mutate(notebookId)}
                  loading={deletion.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
  return (
    <View style={styles.screen}>
      <AppHeader
        title="Caderno"
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  scroll: { flexGrow: 1 },
  content: { padding: 20, gap: 16 },
  status: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    color: color.ink[600],
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[950],
  },
  section: { gap: 10 },
  actions: { flexDirection: "row", gap: 12 },
  error: { color: color.danger, fontSize: 13 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  dialogTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[950],
    textAlign: "center",
  },
});
