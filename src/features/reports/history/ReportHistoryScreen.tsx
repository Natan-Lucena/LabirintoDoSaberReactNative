import type { ReactElement } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  deleteReport,
  listReports,
  reportQueryKeys,
} from "@/api/endpoints/reports";
import { normalizeApiError } from "@/api/errors";
import type { ReportAudience, ReportSummary, ReportType } from "@/api/types";
import { AppHeader, DsButton } from "@/components/ds";
import { LoadingState } from "@/components/LoadingState";
import { color, fontFamilies, shape } from "@/theme";

const TYPE_LABELS: Record<ReportType, string> = {
  PROGRESS: "Evolução",
  ASSESSMENT: "Avaliação",
  PDI_PROGRESS: "Progresso do plano",
};

const AUDIENCE_LABELS: Record<ReportAudience, string> = {
  FAMILY: "Família",
  SCHOOL: "Escola",
  PROFESSIONAL: "Profissional",
};

function formatDay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function lastShareText(item: ReportSummary): string {
  if (!item.lastShare) return "Nunca enviado";
  const verb = item.lastShare.channel === "PRINT" ? "Impresso" : "Enviado";
  return `${verb} em ${formatDay(item.lastShare.at)}`;
}

/** REL-03: histórico de relatórios, com reabrir (e reenviar na prévia) e excluir. */
export function ReportHistoryScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const filters = studentId ? { studentId } : {};

  const query = useQuery({
    queryKey: reportQueryKeys.list(filters),
    queryFn: () => listReports(filters),
  });

  const remove = useMutation({
    mutationFn: deleteReport,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.all }),
  });

  function confirmDelete(item: ReportSummary) {
    Alert.alert(
      "Excluir relatório?",
      `O relatório de ${item.studentName} será removido do histórico.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => remove.mutate(item.id),
        },
      ],
    );
  }

  const items = query.data ?? [];

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Histórico"
        subtitle="Relatórios gerados"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {query.isPending ? <LoadingState label="Carregando histórico" /> : null}
        {query.isError ? (
          <View style={styles.block}>
            <Text style={styles.body} accessibilityRole="alert" accessible>
              {normalizeApiError(query.error).message}
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          </View>
        ) : null}
        {remove.isError ? (
          <Text style={styles.body} accessibilityRole="alert" accessible>
            {normalizeApiError(remove.error).message}
          </Text>
        ) : null}
        {query.isSuccess && items.length === 0 ? (
          <Text style={styles.body}>Nenhum relatório gerado ainda.</Text>
        ) : null}

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>
              {TYPE_LABELS[item.type]} · {item.studentName}
            </Text>
            <Text style={styles.body}>
              {AUDIENCE_LABELS[item.audience]} · {formatDay(item.period.from)} a{" "}
              {formatDay(item.period.to)}
            </Text>
            <Text style={styles.body}>
              Criado em {formatDay(item.createdAt)} · {lastShareText(item)}
            </Text>
            <View style={styles.actions}>
              <DsButton
                label="Abrir"
                variant="secondary"
                accessibilityLabel={`Abrir relatório de ${item.studentName}`}
                onPress={() => router.push(`/reports/${item.id}` as never)}
              />
              <DsButton
                label="Excluir"
                variant="secondary"
                accessibilityLabel={`Excluir relatório de ${item.studentName}`}
                onPress={() => confirmDelete(item)}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  block: { gap: 12 },
  card: {
    gap: 6,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.text,
  },
});
