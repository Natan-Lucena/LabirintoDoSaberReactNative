// Cartão de uma evolução na lista (`.evolution-card` do Figma Make): data, PE,
// "N de M critérios atingidos" e o trecho do registro.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { SessionEvolutionSummary } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { color, fontFamilies, shape, typography } from "@/theme";
import { criteriaSummary, formatSessionDate } from "./format";

export interface EvolutionSummaryCardProps {
  evolution: SessionEvolutionSummary;
  /** Mostra o nome do paciente (hub, que lista todos). */
  showStudent?: boolean;
  onPress: () => void;
}

export function EvolutionSummaryCard({
  evolution,
  showStudent = false,
  onPress,
}: EvolutionSummaryCardProps): ReactElement {
  const date = formatSessionDate(evolution.sessionDate);
  const title = showStudent ? `${evolution.studentName} · ${date}` : date;
  const summary = criteriaSummary(
    evolution.achievedCount,
    evolution.criteriaCount,
  );

  return (
    <StaticPressable
      accessibilityRole="button"
      accessibilityLabel={`Evolução de ${title}`}
      accessibilityHint="Abre o detalhe da evolução"
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {evolution.planTitle ? (
          <Text style={styles.meta}>{evolution.planTitle}</Text>
        ) : null}
        <Text style={styles.summary}>{summary}</Text>
        {evolution.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={3}>
            {evolution.excerpt}
          </Text>
        ) : null}
      </View>
      <FigmaIcon name="chevron" color={color.ink[600]} />
    </StaticPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  body: { flex: 1, gap: 3 },
  title: { ...typography.cardTitle, color: color.text },
  meta: { ...typography.small, color: color.ink[600] },
  summary: {
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
    color: color.brand[700],
  },
  excerpt: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
    color: color.ink[600],
  },
});
