import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { SessionReport } from "@/api/endpoints/session-report";
import {
  AppHeader,
  DsButton,
  InfoCard,
  MiniBars,
  PrivacyNote,
  ProgressBar,
  SectionTitle,
} from "@/components/ds";
import { color, getContentPadding, shape, typography } from "@/theme";

import { printSessionReport, shareSessionReport } from "./pdf";
import {
  formatMetric,
  formatSessionDuration,
  getCategoryLabel,
  getTypeLabel,
} from "./sessionReport";
import { useSessionReport } from "./useSessionReport";

export interface SessionReportScreenProps {
  sessionId: string;
}

function StatePanel({
  title,
  actionLabel,
  onPress,
}: {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
}): ReactElement {
  return (
    <View style={styles.state} accessibilityLabel={title}>
      <Text style={styles.stateText}>{title}</Text>
      {actionLabel && onPress ? (
        <DsButton label={actionLabel} onPress={onPress} />
      ) : null}
    </View>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return <InfoCard icon="clock" title={label} description={value} />;
}

function PercentageSection({
  title,
  values,
  labelFor,
}: {
  title: string;
  values: Record<string, number | null>;
  labelFor: (key: string) => string;
}): ReactElement {
  const entries = Object.entries(values);
  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      <View style={styles.card}>
        <MiniBars
          values={entries.map(([, value]) => value ?? 0)}
          accessibilityLabel={`${title}: ${entries.map(([key, value]) => `${labelFor(key)} ${formatMetric(value)}`).join(", ")}`}
        />
        {entries.map(([key, value]) => (
          <View key={key} style={styles.percentageRow}>
            <Text style={styles.label}>{labelFor(key)}</Text>
            <Text style={styles.value}>{formatMetric(value)}</Text>
            {value === null ? null : (
              <ProgressBar
                value={value}
                accessibilityLabel={`${labelFor(key)}: ${formatMetric(value)}`}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportContent({ report }: { report: SessionReport }): ReactElement {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <AppHeader
        title={report.sessionName}
        subtitle="Relatório da sessão"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Resumo da sessão</Text>
          <Text style={styles.previewText}>
            {report.totalQuestions} questões respondidas
          </Text>
        </View>
        <View style={styles.metrics}>
          <MetricCard
            label="Tempo total"
            value={formatSessionDuration(report.totalTimeSession)}
          />
          <MetricCard
            label="Tempo médio por questão"
            value={formatSessionDuration(report.averageTimePerQuestion)}
          />
          <MetricCard
            label="Média de acerto"
            value={formatSessionDuration(report.averageCorrectTime)}
          />
          <MetricCard
            label="Média de erro"
            value={formatSessionDuration(report.averageIncorrectTime)}
          />
        </View>
        <PercentageSection
          title="Percentual por categoria"
          values={report.percentageByCategory}
          labelFor={getCategoryLabel}
        />
        <PercentageSection
          title="Percentual por tipo"
          values={report.percentageByType}
          labelFor={getTypeLabel}
        />
        <View style={styles.section}>
          <SectionTitle title="Observação" />
          <View style={styles.card}>
            <Text style={styles.observation}>
              {report.observation ?? "Sem registro"}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <DsButton
            label="Imprimir"
            icon="print"
            variant="secondary"
            onPress={() => void printSessionReport(report)}
          />
          <DsButton
            label="Enviar"
            icon="share"
            onPress={() => void shareSessionReport(report)}
          />
        </View>
        <PrivacyNote text="O PDF é gerado neste dispositivo a partir dos dados da sessão." />
      </ScrollView>
    </View>
  );
}

export function SessionReportScreen({
  sessionId,
}: SessionReportScreenProps): ReactElement {
  const router = useRouter();
  const query = useSessionReport(sessionId);

  if (query.isPending && !query.data) {
    return <StatePanel title="Carregando relatório da sessão" />;
  }
  if (query.isError && !query.data) {
    if (
      query.error?.status === 404 ||
      query.error?.code === "SESSION_NOT_FOUND"
    ) {
      return (
        <StatePanel
          title="Sessão não encontrada"
          actionLabel="Voltar"
          onPress={router.back}
        />
      );
    }
    return (
      <StatePanel
        title="Não foi possível carregar o relatório"
        actionLabel="Tentar novamente"
        onPress={() => void query.refetch()}
      />
    );
  }
  if (!query.data) {
    return (
      <StatePanel
        title="Sessão não encontrada"
        actionLabel="Voltar"
        onPress={router.back}
      />
    );
  }

  return <ReportContent report={query.data} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 20, padding: getContentPadding(390), paddingBottom: 40 },
  preview: {
    backgroundColor: color.brand[50],
    borderColor: color.brand[100],
    borderRadius: shape.radius.lg,
    borderWidth: 1,
    gap: 4,
    padding: 18,
  },
  previewTitle: { ...typography.section, color: color.brand[700] },
  previewText: { ...typography.body, color: color.ink[600] },
  metrics: { gap: 10 },
  section: { gap: 10 },
  card: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  percentageRow: { gap: 6 },
  label: { ...typography.small, color: color.ink[600] },
  value: { ...typography.cardTitle, color: color.ink[950] },
  observation: { ...typography.body, color: color.ink[600] },
  actions: { flexDirection: "row", gap: 10 },
  state: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  stateText: { ...typography.body, color: color.ink[600], textAlign: "center" },
});
