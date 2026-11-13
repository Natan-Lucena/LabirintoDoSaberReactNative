import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  generateAnamneseSummary,
  type AnamneseResponse,
} from "@/api/endpoints/anamnese-responses";
import { AppHeader, DsButton } from "@/components/ds";
import { formatResponseDate } from "@/features/anamnese/responses/answers";
import {
  anamneseResponsesKey,
  useAnamneseResponses,
} from "@/features/anamnese/responses/useAnamneseResponses";
import { color, getContentPadding, typography } from "@/theme";

export interface AnamneseSummaryScreenProps {
  patientId: string;
  /** Sem ele, usa a anamnese mais recente do paciente. */
  responseId?: string;
}

export function AnamneseSummaryScreen({
  patientId,
  responseId,
}: AnamneseSummaryScreenProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const responsesQuery = useAnamneseResponses(patientId);
  const response: AnamneseResponse | undefined = responseId
    ? responsesQuery.data?.find((item) => item.id === responseId)
    : [...(responsesQuery.data ?? [])].sort((a, b) =>
        b.answeredAt.localeCompare(a.answeredAt),
      )[0];

  // Geração por IA: até 90 s, sem reenvio automático (retry: false).
  const generate = useMutation({
    mutationFn: (id: string) => generateAnamneseSummary(id),
    retry: false,
    onSuccess: (updated) => {
      queryClient.setQueryData<AnamneseResponse[]>(
        anamneseResponsesKey(patientId),
        (current) =>
          current?.map((item) => (item.id === updated.id ? updated : item)),
      );
    },
  });

  const summary = response?.summary;

  return (
    <View style={styles.screen}>
      <AppHeader title="Síntese da anamnese" onBack={router.back} />
      <ScrollView contentContainerStyle={styles.content}>
        {responsesQuery.isPending ? (
          <Text style={styles.body}>Carregando a anamnese</Text>
        ) : responsesQuery.isError && !responsesQuery.data ? (
          <View style={styles.state}>
            <Text style={styles.body}>
              Não foi possível carregar a anamnese
            </Text>
            <DsButton
              label="Tentar novamente"
              onPress={() => void responsesQuery.refetch()}
            />
          </View>
        ) : !response ? (
          <Text style={styles.body}>Nenhuma anamnese registrada</Text>
        ) : (
          <>
            {summary && response.summaryOutdated ? (
              <View style={styles.warning} accessibilityRole="alert">
                <Text style={styles.warningText}>
                  A anamnese mudou depois desta síntese
                </Text>
              </View>
            ) : null}
            {summary ? (
              <View style={styles.card}>
                <Text style={styles.meta}>
                  {`Gerada em ${formatResponseDate(summary.generatedAt)}`}
                </Text>
                <Text style={styles.body}>{summary.text}</Text>
              </View>
            ) : (
              <Text style={styles.body}>
                Esta anamnese ainda não tem síntese.
              </Text>
            )}
            {generate.isPending ? (
              <Text style={styles.body}>
                Gerando a síntese. Isso pode levar até 90 segundos.
              </Text>
            ) : null}
            {generate.isError ? (
              <Text style={styles.body} accessibilityRole="alert">
                Não foi possível gerar a síntese. Tente novamente.
              </Text>
            ) : null}
            <DsButton
              label={summary ? "Gerar de novo" : "Gerar síntese"}
              fullWidth
              disabled={generate.isPending}
              onPress={() => generate.mutate(response.id)}
            />
            <Text style={styles.meta}>
              Sugestão da IA, sem diagnóstico. O profissional revisa.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 16, padding: getContentPadding(390), paddingBottom: 40 },
  card: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  warning: {
    backgroundColor: color.yellow,
    borderRadius: 12,
    padding: 12,
  },
  warningText: { ...typography.cardTitle, color: color.ink[950] },
  body: { ...typography.body, color: color.ink[950] },
  meta: { ...typography.small, color: color.ink[600] },
  state: { alignItems: "center", gap: 12, padding: 20 },
});
