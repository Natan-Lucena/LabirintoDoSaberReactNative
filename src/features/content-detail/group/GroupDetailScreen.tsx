import type { ReactElement } from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";

import { deleteTaskGroup } from "@/api/endpoints/task-group-delete";
import { withOfflineGuard } from "@/api/query-client";
import {
  AppHeader,
  Badge,
  DsButton,
  InfoCard,
  SectionTitle,
} from "@/components/ds";
import { useGroupDetailData } from "@/features/content-detail/group/useGroupDetailData";
import { color, fontFamilies } from "@/theme";

const categoryLabels = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};
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
  const [confirmVisible, setConfirmVisible] = useState(false);
  const deletion = useMutation({
    mutationFn: withOfflineGuard(deleteTaskGroup),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-group"] });
      router.back();
    },
  });
  function edit() {
    router.push({
      pathname: "/content/group/[id]/edit",
      params: { id: groupId },
    });
  }
  let body: ReactElement;
  if (isPending)
    body = (
      <Text accessibilityLabel="Carregando grupo" style={styles.status}>
        Carregando grupo
      </Text>
    );
  else if (isError)
    body = (
      <View style={styles.status}>
        <Text accessibilityRole="alert">
          Não foi possível carregar o grupo.
        </Text>
        <DsButton
          label="Tentar novamente"
          variant="secondary"
          onPress={refetch}
        />
      </View>
    );
  else if (isNotFound || !group)
    body = (
      <View style={styles.status}>
        <Text accessibilityRole="alert">Não encontrado</Text>
        <DsButton label="Voltar" variant="secondary" onPress={router.back} />
      </View>
    );
  else
    body = (
      <View style={styles.content}>
        <Text style={styles.title}>{group.name}</Text>
        <Badge label={categoryLabels[group.category]} />
        <View style={styles.section}>
          <SectionTitle title="Atividades do grupo" />
          {tasks.length ? (
            tasks.map((task) => (
              <InfoCard
                key={task.id}
                icon="file"
                title={task.prompt}
                description={`${task.alternatives.length} alternativas`}
                onPress={() => router.push(`/content/task/${task.id}` as never)}
              />
            ))
          ) : (
            <InfoCard
              icon="file"
              title="Sem atividades"
              description="Este grupo ainda não tem atividades."
            />
          )}
        </View>
        {deletion.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {deletion.error.message}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <DsButton
            label="Excluir Grupo"
            variant="secondary"
            onPress={() => setConfirmVisible(true)}
          />
          <DsButton label="Editar Grupo" onPress={edit} />
        </View>
        <Modal
          transparent
          visible={confirmVisible}
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Excluir {group.name}?</Text>
              <View style={styles.actions}>
                <DsButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setConfirmVisible(false)}
                />
                <DsButton
                  label="Excluir"
                  onPress={() => deletion.mutate(group.id)}
                  loading={deletion.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  return (
    <View style={styles.screen}>
      <AppHeader
        title="Grupo"
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
