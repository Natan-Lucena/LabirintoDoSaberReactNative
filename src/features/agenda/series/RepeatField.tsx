import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RecurrenceFrequency } from "@/api/types";
import { Field, SegmentedControl } from "@/components/ds";
import {
  maxOccurrences,
  occurrencesError,
} from "@/features/agenda/series/preview";
import { color, typography } from "@/theme";

export type RepeatValue = "NONE" | RecurrenceFrequency;

export interface RepeatFieldProps {
  repeat: RepeatValue;
  occurrences: string;
  /** Texto da prévia (vazio enquanto faltam data e horário). */
  previewText?: string;
  disabled?: boolean;
  onRepeatChange: (value: RepeatValue) => void;
  onOccurrencesChange: (value: string) => void;
}

const options = [
  { key: "NONE", label: "Não repete" },
  { key: "WEEKLY", label: "Semanal" },
  { key: "BIWEEKLY", label: "Quinzenal" },
];

/** Erro de "Quantas vezes" para a repetição escolhida. */
export function repeatOccurrencesError(
  repeat: RepeatValue,
  occurrences: string,
): string | undefined {
  return repeat === "NONE"
    ? undefined
    : occurrencesError(repeat, Number(occurrences));
}

export function RepeatField({
  repeat,
  occurrences,
  previewText,
  disabled,
  onRepeatChange,
  onOccurrencesChange,
}: RepeatFieldProps): ReactElement {
  const error = repeatOccurrencesError(repeat, occurrences);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>Repetir</Text>
      <SegmentedControl
        options={options}
        value={repeat}
        onChange={(key) => onRepeatChange(key as RepeatValue)}
        disabled={disabled}
        accessibilityLabel="Repetir"
      />
      {repeat === "NONE" ? null : (
        <>
          <Field
            label="Quantas vezes"
            value={occurrences}
            onChangeText={(text) =>
              onOccurrencesChange(text.replace(/\D/g, ""))
            }
            keyboardType="number-pad"
            error={error}
            hint={`De 2 a ${maxOccurrences(repeat)}`}
            disabled={disabled}
          />
          {!error && previewText ? (
            <Text style={styles.preview}>{previewText}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  label: { ...typography.tag, color: color.textSecondary },
  preview: { ...typography.body, color: color.brand[700] },
});
