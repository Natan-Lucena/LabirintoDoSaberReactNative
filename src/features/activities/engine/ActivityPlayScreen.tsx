import type { ReactElement } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { getTaskById } from "@/api/endpoints/content";
import { ApiError } from "@/api/errors";
import { AppHeader, DsButton } from "@/components/ds";
import { LoadingState } from "@/components/LoadingState";
import { color, fontFamilies } from "@/theme";
import { ActivityEngine } from "./ActivityEngine";

export interface ActivityPlayScreenProps {
  taskId: string;
}

/**
 * ATV-03: joga uma atividade do banco. G-35: a API só registra resultados
 * dentro de uma sessão, então esta tela roda sem registro e avisa isso.
 */
export function ActivityPlayScreen({
  taskId,
}: ActivityPlayScreenProps): ReactElement {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.code === "TASK_NOT_FOUND";

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Jogar" subtitle="Atividade" onBack={router.back} />
      {query.isPending ? (
        <LoadingState label="Carregando atividade" />
      ) : isNotFound ? (
        <View style={styles.state}>
          <Text style={styles.stateText} accessibilityRole="alert" accessible>
            Não encontrado
          </Text>
          <DsButton label="Voltar" variant="secondary" onPress={router.back} />
        </View>
      ) : query.isError || !query.data ? (
        <View style={styles.state}>
          <Text style={styles.stateText} accessibilityRole="alert" accessible>
            Não foi possível carregar a atividade.
          </Text>
          <DsButton
            label="Tentar novamente"
            variant="secondary"
            onPress={() => void query.refetch()}
          />
        </View>
      ) : (
        <>
          <Text style={styles.notice}>
            Esta atividade não registra resultado.
          </Text>
          <ActivityEngine tasks={[query.data]} onFinish={router.back} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface },
  state: { alignItems: "center", gap: 16, padding: 24 },
  stateText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  notice: {
    paddingHorizontal: 20,
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
