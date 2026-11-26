import type { ReactElement } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { getTaskById } from "@/api/endpoints/content";
import { isMultipleChoice } from "@/api/endpoints/task-catalog";
import { AppHeader, DsButton } from "@/components/ds";
import { ActivityTypeForm } from "@/features/content-create/activity-types/ActivityTypeForm";
import { isActivityType } from "@/features/content-create/activity-types/schema";
import { NewTaskScreen } from "@/features/content-create/task/NewTaskScreen";
import { color, fontFamilies, semanticColor } from "@/theme";

export default function EditTaskRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Mesma chave do detalhe e do `NewTaskScreen`: um único carregamento.
  const query = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTaskById(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });

  if (query.data && isMultipleChoice(query.data.type)) {
    return <NewTaskScreen taskId={id} />;
  }
  if (query.data && isActivityType(query.data.type)) {
    return <ActivityTypeForm type={query.data.type} task={query.data} />;
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Editar atividade"
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      {query.isPending ? (
        <Text style={styles.status}>Carregando atividade...</Text>
      ) : (
        <View style={styles.state}>
          <Text style={styles.error} accessibilityRole="alert">
            Não foi possível carregar a atividade.
          </Text>
          <DsButton
            label="Tentar novamente"
            variant="secondary"
            onPress={() => void query.refetch()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  state: { padding: 20, gap: 12 },
  status: {
    color: color.ink[600],
    padding: 20,
    fontFamily: fontFamilies.nunito.regular,
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.regular,
  },
});
