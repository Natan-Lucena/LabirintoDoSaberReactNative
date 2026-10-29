import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { PlanDraft } from "@/api/types";
import { Badge, SectionTitle } from "@/components/ds";
import { color, typography } from "@/theme";

/** Prévia de leitura; a PLN-03 pode reaproveitar o mesmo PlanDraft para edição. */
export function DraftPreview({ draft }: { draft: PlanDraft }): ReactElement {
  return (
    <View style={styles.container}>
      <Badge label="Rascunho não salvo" />
      <Text style={styles.title}>{draft.title}</Text>
      <Text style={styles.body}>{draft.generalObjective}</Text>
      <Text style={styles.meta}>
        Início sugerido: {draft.suggestedStartDate}
      </Text>
      <Text style={styles.meta}>Fim sugerido: {draft.suggestedEndDate}</Text>
      {draft.suggestedNextReviewDate ? (
        <Text style={styles.meta}>
          Próxima revisão sugerida: {draft.suggestedNextReviewDate}
        </Text>
      ) : null}
      <SectionTitle title="Metas sugeridas" />
      {draft.goals.map((goal, index) => (
        <View style={styles.goal} key={`${index}-${goal.description}`}>
          <Text style={styles.body}>
            {index + 1}. {goal.description}
          </Text>
          {goal.successCriterion ? (
            <Text style={styles.meta}>
              Critério de sucesso: {goal.successCriterion}
            </Text>
          ) : null}
        </View>
      ))}
      {draft.rationale ? (
        <>
          <SectionTitle title="Por que essas metas" />
          <Text style={styles.body}>{draft.rationale}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
  },
  title: { ...typography.sectionTitle, color: color.ink[950] },
  body: { ...typography.body, color: color.ink[950] },
  meta: { ...typography.tag, color: color.textSecondary },
  goal: {
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
});
