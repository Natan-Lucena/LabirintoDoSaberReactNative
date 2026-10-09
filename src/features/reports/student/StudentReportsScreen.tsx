import type { ReactElement } from "react";
import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { listAnamneseTemplates } from "@/api/endpoints/anamnese";
import {
  createStudentSnapshot,
  getStudentAiAnalysis,
  getStudentAnalysis,
  listStudentSnapshots,
  type StudentAnalysisFilter,
} from "@/api/endpoints/session-analysis";
import { withOfflineGuard } from "@/api/query-client";
import {
  AppHeader,
  DateField,
  DsButton,
  Field,
  InfoCard,
  MiniBars,
  PrivacyNote,
  SectionTitle,
  SegmentedControl,
  SelectField,
  SuccessPanel,
  Switch,
} from "@/components/ds";
import { LoadingState } from "@/components/LoadingState";
import {
  accuracyToPercent,
  formatMetric,
  getCategoryLabel,
} from "@/features/reports/session/sessionReport";
import { useStudents } from "@/features/students/useStudents";
import { color, fontFamilies, getContentPadding, shape } from "@/theme";
import { formatLongDate } from "@/utils/date";

import {
  buildAnalysisFilter,
  describePeriod,
  describeSnapshotPeriod,
  type PeriodMode,
} from "./analysisFilter";
import { AnalysisMarkdown } from "./AnalysisMarkdown";
import { printStudentReport, shareStudentReport } from "./pdf";

const PERIOD_OPTIONS = [
  { key: "last", label: "Últimas sessões" },
  { key: "dates", label: "Por datas" },
];

interface AnalysisRequest {
  studentId: string;
  filter: StudentAnalysisFilter;
  periodLabel: string;
}

function questionsLabel(total: number): string {
  return total === 1 ? "1 questão" : `${total} questões`;
}

/**
 * REL-05: análise numérica do paciente por período, com snapshot salvo no
 * histórico e exportação em PDF gerado no aparelho. O `accuracy` vem como
 * fração de 0 a 1 (G-43, confirmado no backend) e é convertido por `accuracyToPercent`.
 */
export function StudentReportsScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const students = useStudents();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [mode, setMode] = useState<PeriodMode>("last");
  const [limit, setLimit] = useState("6");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [request, setRequest] = useState<AnalysisRequest | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [includeAiInPdf, setIncludeAiInPdf] = useState(true);

  const analysis = useQuery({
    queryKey: ["student-analysis", request?.studentId, request?.filter],
    queryFn: () => getStudentAnalysis(request!.studentId, request!.filter),
    enabled: request !== null,
    retry: false,
  });

  const historyKey = ["student-analysis-history", request?.studentId];
  const history = useQuery({
    queryKey: historyKey,
    queryFn: () => listStudentSnapshots(request!.studentId),
    enabled: request !== null,
  });

  const snapshot = useMutation({
    mutationFn: withOfflineGuard(() =>
      createStudentSnapshot(request!.studentId, request!.filter),
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKey }),
  });

  const templates = useQuery({
    queryKey: ["anamnese-templates"],
    queryFn: listAnamneseTemplates,
    enabled: request !== null,
  });

  // REL-06: mutação (e não query) para o texto da análise ficar só em memória,
  // fora do cache persistido do TanStack Query (AC-REL-06-03).
  const aiAnalysis = useMutation({
    mutationFn: withOfflineGuard(() =>
      getStudentAiAnalysis(
        request!.studentId,
        request!.filter,
        templateId ? { templateId } : undefined,
      ),
    ),
  });

  const studentName =
    students.data?.find((item) => item.id === request?.studentId)?.name ??
    "Paciente";

  function generate() {
    if (!studentId) {
      setStudentError("Escolha o paciente.");
      return;
    }
    const result = buildAnalysisFilter({ mode, limit, startDate, endDate });
    if ("error" in result) {
      setStudentError(null);
      setPeriodError(result.error);
      return;
    }
    setStudentError(null);
    setPeriodError(null);
    setExportError(null);
    snapshot.reset();
    aiAnalysis.reset();
    setRequest({
      studentId,
      filter: result.filter,
      periodLabel: describePeriod(result.filter),
    });
  }

  async function exportReport(action: typeof printStudentReport) {
    if (!request || !analysis.data) {
      return;
    }
    setExportError(null);
    const aiText = includeAiInPdf ? aiAnalysis.data?.analysis : undefined;
    try {
      await action({
        studentName,
        periodLabel: request.periodLabel,
        analysis: analysis.data,
        ...(aiText ? { aiAnalysis: aiText } : {}),
      });
    } catch {
      setExportError("Não foi possível gerar o PDF.");
    }
  }

  const data = analysis.data;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Relatórios"
        subtitle="Análise do paciente"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <PrivacyNote text="Relatórios seguros por padrão: o documento traz apenas sínteses, sem as respostas brutas." />

        <SelectField
          label="Paciente"
          value={studentId}
          options={(students.data ?? []).map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          onChange={setStudentId}
          placeholder="Selecione o paciente"
          error={studentError ?? undefined}
        />

        <SegmentedControl
          options={PERIOD_OPTIONS}
          value={mode}
          onChange={(key) => {
            setMode(key as PeriodMode);
            setPeriodError(null);
          }}
          accessibilityLabel="Período da análise"
        />

        {mode === "last" ? (
          <Field
            label="Quantidade de sessões"
            accessibilityLabel="Quantidade de sessões"
            value={limit}
            onChangeText={setLimit}
            keyboardType="number-pad"
            error={periodError ?? undefined}
          />
        ) : (
          <View style={styles.dates}>
            <DateField
              label="Data inicial"
              value={startDate}
              onChange={setStartDate}
              placeholder="Escolha a data"
            />
            <DateField
              label="Data final"
              value={endDate}
              onChange={setEndDate}
              placeholder="Escolha a data"
            />
            {periodError ? (
              <Text style={styles.error} accessibilityRole="alert" accessible>
                {periodError}
              </Text>
            ) : null}
          </View>
        )}

        <DsButton
          label="Gerar síntese"
          icon="sparkles"
          fullWidth
          loading={analysis.isFetching}
          onPress={generate}
        />

        {request && analysis.isPending ? (
          <LoadingState label="Gerando síntese" />
        ) : null}

        {request && analysis.isError ? (
          <View style={styles.block}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              Não foi possível gerar a síntese.
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void analysis.refetch()}
            />
          </View>
        ) : null}

        {request && data ? (
          <View style={styles.block}>
            <SectionTitle title="Síntese" />
            <Text style={styles.caption}>
              {studentName} · {request.periodLabel}
            </Text>

            {data.sessions.length === 0 ? (
              <Text style={styles.empty}>Nenhuma sessão no período.</Text>
            ) : (
              <>
                <InfoCard
                  icon="chart"
                  title="Acerto geral"
                  description={`${formatMetric(accuracyToPercent(data.total.accuracy))} · ${data.total.correct} de ${questionsLabel(data.total.total)}`}
                />

                <View style={styles.card}>
                  <MiniBars
                    values={Object.values(data.categories).map((item) =>
                      accuracyToPercent(item.accuracy),
                    )}
                    accessibilityLabel="Acerto por categoria"
                  />
                  {Object.values(data.categories).map((item) => (
                    <View key={item.category} style={styles.row}>
                      <Text style={styles.rowLabel}>
                        {getCategoryLabel(item.category)}
                      </Text>
                      <Text style={styles.rowValue}>
                        {formatMetric(accuracyToPercent(item.accuracy))}
                      </Text>
                    </View>
                  ))}
                </View>

                <SectionTitle title="Sessões do período" />
                {data.sessions.map((session) => (
                  <InfoCard
                    key={session.id}
                    icon="clipboard"
                    title={session.name}
                    description={`${formatLongDate(new Date(session.startedAt))} · ${questionsLabel(session.answers.length)}`}
                  />
                ))}

                <SectionTitle title="Análise com IA" />
                <PrivacyNote text="A análise é gerada por IA com os dados do paciente. O texto fica só nesta tela: não é salvo no aparelho." />
                <SelectField
                  label="Modelo de anamnese"
                  value={templateId || null}
                  options={[
                    { label: "Não incluir anamnese", value: "" },
                    ...(templates.data ?? []).map((item) => ({
                      label: item.title,
                      value: item.id,
                    })),
                  ]}
                  onChange={setTemplateId}
                  placeholder="Não incluir anamnese"
                />
                <DsButton
                  label="Gerar análise com IA"
                  icon="sparkles"
                  variant="secondary"
                  fullWidth
                  loading={aiAnalysis.isPending}
                  onPress={() => aiAnalysis.mutate()}
                />
                {aiAnalysis.isError ? (
                  <View style={styles.block}>
                    <Text
                      style={styles.error}
                      accessibilityRole="alert"
                      accessible
                    >
                      Não foi possível gerar a análise.
                    </Text>
                    <DsButton
                      label="Tentar novamente"
                      variant="secondary"
                      onPress={() => aiAnalysis.mutate()}
                    />
                  </View>
                ) : null}
                {aiAnalysis.data ? (
                  <View style={styles.card}>
                    <AnalysisMarkdown text={aiAnalysis.data.analysis} />
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>
                        Incluir análise com IA no PDF
                      </Text>
                      <Switch
                        value={includeAiInPdf}
                        onValueChange={setIncludeAiInPdf}
                        accessibilityLabel="Incluir análise com IA no PDF"
                      />
                    </View>
                  </View>
                ) : null}

                {snapshot.isSuccess ? (
                  <SuccessPanel title="Snapshot salvo" />
                ) : null}
                {snapshot.isError ? (
                  <Text
                    style={styles.error}
                    accessibilityRole="alert"
                    accessible
                  >
                    Não foi possível salvar o snapshot.
                  </Text>
                ) : null}
                {exportError ? (
                  <Text
                    style={styles.error}
                    accessibilityRole="alert"
                    accessible
                  >
                    {exportError}
                  </Text>
                ) : null}

                <DsButton
                  label="Salvar snapshot"
                  variant="secondary"
                  fullWidth
                  loading={snapshot.isPending}
                  onPress={() => snapshot.mutate()}
                />
                <View style={styles.actions}>
                  <DsButton
                    label="Imprimir"
                    icon="print"
                    variant="secondary"
                    onPress={() => void exportReport(printStudentReport)}
                  />
                  <DsButton
                    label="Enviar"
                    icon="share"
                    onPress={() => void exportReport(shareStudentReport)}
                  />
                </View>
              </>
            )}

            <SectionTitle title="Histórico de snapshots" />
            {history.isPending ? (
              <LoadingState label="Carregando histórico" />
            ) : history.isError ? (
              <Text style={styles.error} accessibilityRole="alert" accessible>
                Não foi possível carregar o histórico.
              </Text>
            ) : history.data && history.data.length > 0 ? (
              history.data.map((item, index) => (
                <InfoCard
                  key={`${item.studentId}-${index}`}
                  icon="file"
                  title={describeSnapshotPeriod(item)}
                  description={`${questionsLabel(item.totalQuestions)} · ${formatMetric(accuracyToPercent(item.accuracy))} de acerto`}
                />
              ))
            ) : (
              <Text style={styles.empty}>Nenhum snapshot salvo.</Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 16, padding: getContentPadding(390), paddingBottom: 40 },
  dates: { gap: 12 },
  block: { gap: 12 },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: shape.radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
  },
  rowValue: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 14,
  },
  actions: { flexDirection: "row", gap: 10 },
  caption: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
  },
  empty: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: color.danger,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
