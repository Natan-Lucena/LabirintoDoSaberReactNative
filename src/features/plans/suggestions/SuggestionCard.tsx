import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { PlanSuggestion } from "@/api/types";
import { DsButton } from "@/components/ds";
import { color, typography } from "@/theme";
import { describeSuggestionChange } from "./usePlanSuggestions";

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
    gap: 8,
  },
  heading: { ...typography.body, color: color.ink[950] },
  body: { ...typography.body, color: color.textSecondary },
  meta: { ...typography.tag, color: color.textSecondary },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

export interface SuggestionCardProps {
  suggestion: PlanSuggestion;
  /** Título do plano, quando conhecido. */
  planTitle?: string;
  /** Descrição da meta afetada, quando conhecida (diz qual meta muda). */
  goalDescription?: string;
  /** Mostra paciente e plano (tela geral); o detalhe do plano já os tem. */
  showContext?: boolean;
  busy?: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export function SuggestionCard({
  suggestion,
  planTitle,
  goalDescription,
  showContext = false,
  busy = false,
  onAccept,
  onDismiss,
}: SuggestionCardProps): ReactElement {
  const change = describeSuggestionChange(suggestion, goalDescription);

  return (
    <View style={styles.card}>
      {showContext ? (
        <>
          <Text style={styles.heading}>{suggestion.studentName}</Text>
          {planTitle ? <Text style={styles.meta}>{planTitle}</Text> : null}
        </>
      ) : null}
      <Text style={styles.body}>{suggestion.text}</Text>
      <Text style={styles.heading}>{change}</Text>
      <View style={styles.actions}>
        <DsButton
          label="Aceitar"
          accessibilityLabel={`Aceitar sugestão: ${change}`}
          disabled={busy}
          onPress={onAccept}
        />
        <DsButton
          label="Descartar"
          variant="secondary"
          accessibilityLabel={`Descartar sugestão: ${change}`}
          disabled={busy}
          onPress={onDismiss}
        />
      </View>
    </View>
  );
}
