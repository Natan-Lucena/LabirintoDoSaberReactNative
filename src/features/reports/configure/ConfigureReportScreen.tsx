import type { ReactElement } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  createReport,
  getReportOptions,
  reportQueryKeys,
} from "@/api/endpoints/reports";
import { normalizeApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type {
  CreateReportPayload,
  Report,
  ReportAudience,
  ReportSection,
  ReportType,
} from "@/api/types";
import {
  AppHeader,
  CheckList,
  DateField,
  DsButton,
  PrivacyNote,
  SectionTitle,
  SelectField,
} from "@/components/ds";
import { LoadingState } from "@/components/LoadingState";
import { useStudents } from "@/features/students/useStudents";
import { color, fontFamilies, getContentPadding, semanticColor } from "@/theme";
import { dayKey } from "@/utils/date";

import {
  allowedSectionsFor,
  defaultSectionsFor,
  presetPeriod,
  sensitiveSelected,
  validatePeriod,
} from "./reportConfig";

const CUSTOM = "custom";

/** REL-01: configura e gera o relatório (POST /report/, com IA, até 90 s). */
export function ConfigureReportScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const students = useStudents();
  const options = useQuery({
    queryKey: reportQueryKeys.options(),
    queryFn: getReportOptions,
  });

  const [studentId, setStudentId] = useState<string | null>(
    params.studentId ?? null,
  );
  const [type, setType] = useState<ReportType | null>(null);
  const [audience, setAudience] = useState<ReportAudience>("PROFESSIONAL");
  const [periodKey, setPeriodKey] = useState("30d");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [custom, setCustom] = useState<{
    key: string;
    value: ReportSection[];
  } | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);

  const data = options.data;
  const activeType = type ?? data?.types[0]?.type ?? null;

  // Seções padrão por tipo e destinatário; a escolha manual vale só para essa combinação.
  const selectionKey = `${activeType}|${audience}`;
  const sections: ReportSection[] =
    custom?.key === selectionKey
      ? custom.value
      : data && activeType
        ? defaultSectionsFor(data, activeType, audience)
        : [];

  const generation = useMutation<Report, Error, CreateReportPayload>({
    mutationFn: withOfflineGuard(createReport),
    retry: false,
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: reportQueryKeys.all });
      router.replace(`/reports/${report.id}` as never);
    },
  });

  function generate() {
    if (!data || !activeType || generation.isPending) return;
    if (!studentId) {
      setStudentError("Escolha o paciente.");
      return;
    }
    setStudentError(null);

    let period: { from: string; to: string };
    if (periodKey === CUSTOM) {
      period = {
        from: fromDate ? dayKey(fromDate) : "",
        to: toDate ? dayKey(toDate) : "",
      };
      const problem = validatePeriod(
        period.from,
        period.to,
        data.maxPeriodDays,
      );
      if (problem) {
        setPeriodError(problem);
        return;
      }
    } else {
      const days = data.periods.find((item) => item.key === periodKey)?.days;
      period = presetPeriod(days ?? 30);
    }
    setPeriodError(null);

    generation.mutate({
      studentId,
      type: activeType,
      audience,
      period,
      sections,
    });
  }

  const allowed =
    data && activeType ? allowedSectionsFor(data, activeType) : [];
  const sensitive = data ? sensitiveSelected(data, sections) : [];
  const warnSensitive =
    (audience === "FAMILY" || audience === "SCHOOL") && sensitive.length > 0;
  const typeInfo = data?.types.find((item) => item.type === activeType);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Novo relatório"
        subtitle="Configurar documento"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <DsButton
          label="Histórico"
          variant="secondary"
          icon="file"
          onPress={() =>
            router.push(
              (params.studentId
                ? `/reports/history?studentId=${params.studentId}`
                : "/reports/history") as never,
            )
          }
        />
        <PrivacyNote text="Relatórios seguros por padrão: o documento traz apenas sínteses, sem as respostas brutas." />

        {options.isPending ? <LoadingState label="Carregando opções" /> : null}
        {options.isError ? (
          <View style={styles.block}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              Não foi possível carregar as opções do relatório.
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void options.refetch()}
            />
          </View>
        ) : null}

        {data ? (
          <>
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

            <SelectField
              label="Tipo"
              value={activeType}
              options={data.types.map((item) => ({
                label: item.label,
                value: item.type,
              }))}
              onChange={(value) => setType(value as ReportType)}
            />
            {typeInfo ? (
              <Text style={styles.caption}>{typeInfo.description}</Text>
            ) : null}

            <SelectField
              label="Destinatário"
              value={audience}
              options={data.audiences.map((item) => ({
                label: item.label,
                value: item.audience,
              }))}
              onChange={(value) => setAudience(value as ReportAudience)}
            />

            <SelectField
              label="Período"
              value={periodKey}
              options={[
                ...data.periods.map((item) => ({
                  label: item.label,
                  value: item.key,
                })),
                { label: "Personalizado", value: CUSTOM },
              ]}
              onChange={(value) => {
                setPeriodKey(value);
                setPeriodError(null);
              }}
            />
            {periodKey === CUSTOM ? (
              <View style={styles.block}>
                <DateField
                  label="Data inicial"
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="Escolha a data"
                />
                <DateField
                  label="Data final"
                  value={toDate}
                  onChange={setToDate}
                  placeholder="Escolha a data"
                />
              </View>
            ) : null}
            {periodError ? (
              <Text style={styles.error} accessibilityRole="alert" accessible>
                {periodError}
              </Text>
            ) : null}

            <SectionTitle title="Incluir no documento" />
            <CheckList
              options={allowed.map((section) => ({
                key: section,
                label:
                  data.sections.find((item) => item.section === section)
                    ?.label ?? section,
              }))}
              selected={sections}
              onChange={(next) =>
                setCustom({ key: selectionKey, value: next as ReportSection[] })
              }
            />
            {warnSensitive ? (
              <Text style={styles.warning} accessibilityRole="alert" accessible>
                {`Atenção: ${sensitive.join(", ")} traz informação sensível e vai para ${audience === "FAMILY" ? "a família" : "a escola"}.`}
              </Text>
            ) : null}

            {generation.isPending ? (
              <LoadingState label="Gerando o relatório (pode levar até 90 segundos)" />
            ) : null}
            {generation.isError ? (
              <Text style={styles.error} accessibilityRole="alert" accessible>
                {normalizeApiError(generation.error).message}
              </Text>
            ) : null}

            <DsButton
              label="Gerar relatório"
              icon="sparkles"
              fullWidth
              loading={generation.isPending}
              disabled={sections.length === 0}
              onPress={generate}
            />
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
  caption: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
  },
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
