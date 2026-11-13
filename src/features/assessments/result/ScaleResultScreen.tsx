import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { ScaleApplication, ScaleTemplate } from "@/api/types";
import {
  AIInsight,
  AppHeader,
  DsButton,
  PrivacyNote,
  SectionTitle,
} from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import {
  formatApplicationDate,
  toneForSeverity,
} from "@/features/assessments/hub/selectors";
import { color, fontFamilies, semanticColor, shape, typography } from "@/theme";
import {
  useGenerateInsight,
  useResultTemplate,
  useScaleApplication,
} from "./useScaleResult";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 36, gap: 18 },
  card: {
    gap: 8,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  title: { ...typography.body, color: color.text },
  meta: { ...typography.tag, color: color.textSecondary },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  badgeLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
  },
  section: { gap: 10 },
  answerValue: { ...typography.tag, color: color.textSecondary },
  state: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    ...typography.body,
    color: color.textSecondary,
    textAlign: "center",
  },
});

function Badge({
  label,
  severity,
}: {
  label: string;
  severity: string;
}): ReactElement {
  const tone = toneForSeverity(severity);

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.badgeLabel, { color: tone.color }]}>{label}</Text>
    </View>
  );
}

function formatValue(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function Answers({
  application,
  template,
}: {
  application: ScaleApplication;
  template: ScaleTemplate | undefined;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const items = template
    ? [...template.items].sort((a, b) => a.order - b.order)
    : [];
  const byItem = new Map(application.answers.map((a) => [a.itemId, a.value]));
  const toggleLabel = open
    ? "Ocultar respostas"
    : `Ver respostas (${byItem.size})`;

  return (
    <View style={styles.section}>
      <StaticPressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={toggleLabel}
        style={styles.card}
      >
        <Text style={styles.title}>{toggleLabel}</Text>
      </StaticPressable>
      {open
        ? items.map((item, index) => {
            const value = byItem.get(item.id);
            const label = template?.options.find(
              (option) => option.value === value,
            )?.label;

            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.title}>{`${index + 1}. ${item.text}`}</Text>
                <Text style={styles.answerValue}>
                  {value === undefined
                    ? "Sem resposta"
                    : (label ?? formatValue(value))}
                </Text>
              </View>
            );
          })
        : null}
      {open && !template ? (
        <Text style={styles.stateText}>
          Não foi possível carregar o texto das perguntas.
        </Text>
      ) : null}
    </View>
  );
}

export interface ScaleResultScreenProps {
  applicationId: string;
}

export function ScaleResultScreen({
  applicationId,
}: ScaleResultScreenProps): ReactElement {
  const router = useRouter();
  const query = useScaleApplication(applicationId);
  const application = query.data;
  const templateQuery = useResultTemplate(application?.templateId);
  const insightMutation = useGenerateInsight(applicationId);

  const header = (
    <AppHeader
      title="Resultado"
      subtitle="Aplicação da escala"
      onBack={() => router.back()}
    />
  );

  if (!application) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.state}>
          {query.isError ? null : (
            <ActivityIndicator color={semanticColor.primaryFill} />
          )}
          <Text style={styles.stateText}>
            {query.isError
              ? "Não foi possível carregar o resultado."
              : "Carregando resultado..."}
          </Text>
          {query.isError ? (
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          ) : null}
        </View>
      </View>
    );
  }

  const { score } = application;
  const date = formatApplicationDate(
    application.completedAt ?? application.updatedAt,
  );

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{application.templateName}</Text>
          <Text style={styles.meta}>
            {`${application.studentName} · ${date}${score.partial ? " · Rascunho" : ""}`}
          </Text>
          <Text style={styles.title}>
            {`Escore total: ${formatValue(score.value)} de ${formatValue(score.max)}`}
          </Text>
          {score.band ? (
            <Badge
              label={
                score.partial
                  ? `${score.band.label} (parcial)`
                  : score.band.label
              }
              severity={score.band.severity}
            />
          ) : null}
        </View>
        {score.subscales.length > 0 ? (
          <View style={styles.section}>
            <SectionTitle title="Subescalas" />
            {score.subscales.map((subscale) => (
              <View key={subscale.code} style={styles.card}>
                <Text style={styles.title}>{subscale.name}</Text>
                <Text style={styles.meta}>
                  {`${formatValue(subscale.value)} de ${formatValue(subscale.max)}`}
                </Text>
                {subscale.band ? (
                  <Badge
                    label={subscale.band.label}
                    severity={subscale.band.severity}
                  />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.section}>
          <SectionTitle title="Insight" />
          {application.insight ? (
            <AIInsight text={application.insight.text} />
          ) : (
            <>
              {insightMutation.isError ? (
                <Text style={styles.stateText}>
                  Não foi possível gerar o insight. Tente novamente.
                </Text>
              ) : null}
              {insightMutation.isPending ? (
                <Text style={styles.stateText}>Gerando insight...</Text>
              ) : null}
              <DsButton
                label={
                  insightMutation.isError ? "Tentar novamente" : "Gerar insight"
                }
                variant="secondary"
                disabled={insightMutation.isPending}
                onPress={() => insightMutation.mutate()}
              />
            </>
          )}
        </View>
        <PrivacyNote text={application.disclaimer} />
        <Answers application={application} template={templateQuery.data} />
      </ScrollView>
    </View>
  );
}
