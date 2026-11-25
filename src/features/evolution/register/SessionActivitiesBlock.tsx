// EVO-03 — "Atividades da sessão": os jogos registrados durante o atendimento
// (RS-06). Só leitura, para o profissional usar no registro descritivo (G-65):
// não vira critério, meta nem acerto automático.
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import type { EvolutionContext } from "@/api/types";
import { InfoCard, SectionTitle } from "@/components/ds";
import { getTypeLabel } from "@/features/reports/session/sessionReport";

export type SessionActivityResults = NonNullable<
  EvolutionContext["activityResults"]
>;

function plural(total: number, singular: string, pluralForm: string): string {
  return `${total} ${total === 1 ? singular : pluralForm}`;
}

function resultLine(result: SessionActivityResults[number]): string {
  return [
    getTypeLabel(result.taskType),
    result.completed ? "Concluída" : "Não concluída",
    plural(result.attempts, "tentativa", "tentativas"),
    plural(result.errors, "erro", "erros"),
  ].join(" · ");
}

export interface SessionActivitiesBlockProps {
  results?: SessionActivityResults;
}

export function SessionActivitiesBlock({
  results,
}: SessionActivitiesBlockProps): ReactElement | null {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <SectionTitle title="Atividades da sessão" />
      {results.map((result) => (
        <InfoCard
          key={result.taskId}
          icon="play"
          title={result.title}
          description={resultLine(result)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
});
