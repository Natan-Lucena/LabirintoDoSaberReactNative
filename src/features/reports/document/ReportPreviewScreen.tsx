import type { ReactElement } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import {
  getReport,
  reportQueryKeys,
  shareReport,
} from "@/api/endpoints/reports";
import { normalizeApiError } from "@/api/errors";
import type { Report, ReportShare } from "@/api/types";
import {
  AppHeader,
  DsButton,
  InfoCard,
  SectionTitle,
  SuccessPanel,
} from "@/components/ds";
import { LoadingState } from "@/components/LoadingState";
import {
  accuracyToPercent,
  formatMetric,
  getCategoryLabel,
} from "@/features/reports/session/sessionReport";
import { color, fontFamilies, getContentPadding, semanticColor } from "@/theme";

import { EMPTY_TEXTS, formatReportDate, goalStatusLabel } from "./reportLabels";
import { printReport, shareReportPdf } from "./pdf";

function Paragraph({ text }: { text: string }): ReactElement {
  return <Text style={styles.body}>{text}</Text>;
}

/** REL-02: prévia do relatório gerado, com impressão e envio do PDF. */
export function ReportPreviewScreen({
  reportId,
}: {
  reportId: string;
}): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [exportError, setExportError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: reportQueryKeys.detail(reportId),
    queryFn: () => getReport(reportId),
    enabled: Boolean(reportId),
  });

  const register = useMutation({
    mutationFn: (channel: ReportShare["channel"]) =>
      shareReport(reportId, { channel }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.all }),
  });

  async function run(
    channel: ReportShare["channel"],
    action: (report: Report) => Promise<void>,
  ) {
    const report = query.data;
    if (!report) return;
    setExportError(null);
    try {
      // Plataforma: no Android a folha de compartilhamento não informa se o
      // usuário cancelou; `shareAsync` resolve igual. Por isso o registro só
      // ocorre depois que a ação resolve sem erro (melhor esforço).
      await action(report);
    } catch {
      setExportError("Não foi possível gerar o PDF.");
      return;
    }
    // O registro não bloqueia nem esconde o PDF já entregue.
    register.mutate(channel);
  }

  const report = query.data;
  const content = report?.content;

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <AppHeader
        title="Relatório"
        subtitle={report?.studentName}
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {query.isPending ? <LoadingState label="Carregando relatório" /> : null}
        {query.isError ? (
          <View style={styles.block}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              {normalizeApiError(query.error).message}
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          </View>
        ) : null}

        {report && content ? (
          <>
            <SuccessPanel
              title="Relatório pronto"
              description={`${content.title} · PDF`}
            />
            {report.synthesisFailed ? (
              <Text style={styles.warning} accessibilityRole="alert" accessible>
                Síntese da IA indisponível. O relatório foi criado sem ela.
              </Text>
            ) : null}

            <View style={styles.paper}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.caption}>
                {report.studentName} · {formatReportDate(report.period.from)} a{" "}
                {formatReportDate(report.period.to)}
              </Text>

              {content.patient ? (
                <>
                  <SectionTitle title="Dados do paciente" />
                  <Paragraph
                    text={`${content.patient.displayName} · ${content.patient.ageYears} anos${content.patient.schoolGrade ? ` · ${content.patient.schoolGrade}` : ""}`}
                  />
                </>
              ) : null}

              {content.sessionMetrics ? (
                <>
                  <SectionTitle title="Desempenho nas sessões" />
                  <Paragraph
                    text={`${content.sessionMetrics.sessions} sessões · ${content.sessionMetrics.answered} respostas · acerto geral ${formatMetric(accuracyToPercent(content.sessionMetrics.accuracy))}`}
                  />
                  {content.sessionMetrics.byCategory.map((item) => (
                    <Paragraph
                      key={item.category}
                      text={`${getCategoryLabel(item.category)}: ${formatMetric(accuracyToPercent(item.accuracy))}`}
                    />
                  ))}
                </>
              ) : null}

              {content.evolutions ? (
                <>
                  <SectionTitle title="Evolução das sessões" />
                  {content.evolutions.length === 0 ? (
                    <Paragraph text={EMPTY_TEXTS.evolutions} />
                  ) : null}
                  {content.evolutions.map((item, index) => (
                    <InfoCard
                      key={`${index}-${item.sessionDate}`}
                      icon="clipboard"
                      title={`${formatReportDate(item.sessionDate)} · ${item.achieved} de ${item.total} metas`}
                      description={item.record}
                    />
                  ))}
                </>
              ) : null}

              {content.planProgress ? (
                <>
                  <SectionTitle title="Progresso dos planos" />
                  {content.planProgress.length === 0 ? (
                    <Paragraph text={EMPTY_TEXTS.planProgress} />
                  ) : null}
                  {content.planProgress.map((plan, index) => (
                    <InfoCard
                      key={`${index}-${plan.title}`}
                      icon="file"
                      title={`${plan.title} · ${plan.percent}%`}
                      description={plan.goals
                        .map(
                          (goal) =>
                            `• ${goal.description} · ${goalStatusLabel(goal.status)}`,
                        )
                        .join("\n")}
                    />
                  ))}
                </>
              ) : null}

              {content.assessments ? (
                <>
                  <SectionTitle title="Avaliações" />
                  {content.assessments.length === 0 ? (
                    <Paragraph text={EMPTY_TEXTS.assessments} />
                  ) : null}
                  {content.assessments.map((item, index) => (
                    <InfoCard
                      key={`${index}-${item.templateName}-${item.completedAt}`}
                      icon="chart"
                      title={`${item.templateName} · ${formatReportDate(item.completedAt)}`}
                      description={`${item.value} de ${item.max}${item.band ? ` · ${item.band}` : ""}`}
                    />
                  ))}
                </>
              ) : null}

              {content.anamnesisSummary ? (
                <>
                  <SectionTitle title="Resumo da anamnese" />
                  <Paragraph text={content.anamnesisSummary} />
                </>
              ) : null}

              {content.synthesis ? (
                <>
                  <SectionTitle title="Síntese" />
                  <Paragraph text={content.synthesis} />
                </>
              ) : null}
            </View>

            {exportError ? (
              <Text style={styles.error} accessibilityRole="alert" accessible>
                {exportError}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <DsButton
                label="Imprimir"
                icon="print"
                variant="secondary"
                onPress={() => void run("PRINT", printReport)}
              />
              <DsButton
                label="Enviar"
                icon="share"
                onPress={() => void run("SHARE", shareReportPdf)}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 16, padding: getContentPadding(390), paddingBottom: 40 },
  block: { gap: 12 },
  paper: {
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  title: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 18,
  },
  caption: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
  },
  body: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: { flexDirection: "row", gap: 10 },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  warning: {
    color: semanticColor.warningTextOnYellow,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
