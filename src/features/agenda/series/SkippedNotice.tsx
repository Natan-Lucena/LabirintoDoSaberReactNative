import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { SeriesResult } from "@/api/types";
import { DsButton, InfoCard } from "@/components/ds";
import { formatShortDate, weekdayName } from "@/features/agenda/series/preview";
import { color, typography } from "@/theme";
import { formatTime } from "@/utils/date";

export interface SkippedNoticeProps {
  /** Quantas ocorrências foram criadas ou alteradas. */
  doneCount: number;
  /** "agendados" na criação, "alterados" na edição da série. */
  doneLabel: "agendados" | "alterados";
  skipped: SeriesResult["skipped"];
  onOpen: (appointmentId: string) => void;
  onDone: () => void;
}

/** Aviso das ocorrências puladas por conflito (AC-AGE-06-02); a tela não fecha sozinha. */
export function SkippedNotice({
  doneCount,
  doneLabel,
  skipped,
  onOpen,
  onDone,
}: SkippedNoticeProps): ReactElement {
  const verb = doneLabel === "alterados" ? "alterados" : "criados";

  return (
    <View style={styles.container}>
      <InfoCard
        icon="calendar"
        title={`${doneCount} ${doneLabel}`}
        description={`${skipped.length} não foram ${verb} porque o horário já estava ocupado:`}
      />
      {skipped.map((item) => {
        const date = new Date(item.scheduledAt);
        const label = `${formatShortDate(date)} (${weekdayName(date)}) às ${formatTime(date)}`;

        return (
          <View key={item.scheduledAt} style={styles.row}>
            <Text style={styles.rowText}>{label}</Text>
            <DsButton
              label="Ver atendimento"
              accessibilityLabel={`Ver atendimento de ${label}`}
              variant="ghost"
              onPress={() => onOpen(item.conflictingAppointmentId)}
            />
          </View>
        );
      })}
      <DsButton label="Concluir" fullWidth onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  rowText: { ...typography.body, color: color.text, flexShrink: 1 },
});
