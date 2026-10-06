import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { FigmaIcon } from "@/components/FigmaIcon";
import { color, fontFamilies, shape } from "@/theme";
import { dayKey, formatTime, toBrasiliaISOString } from "@/utils/date";

export interface TimeFieldProps {
  label: string;
  /** Instante com o horário selecionado, no dia de `referenceDate`. */
  value: Date | null;
  /** Dia (fuso America/Sao_Paulo) ao qual o horário escolhido é ancorado. */
  referenceDate?: Date;
  onChange: (value: Date) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[800],
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: shape.minTouchTarget,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.button,
    backgroundColor: color.surface,
    paddingHorizontal: 12,
  },
  fieldDisabled: { opacity: 0.5 },
  value: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.semiBold,
    color: color.ink[950],
  },
  placeholder: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.semiBold,
    color: color.ink[500],
  },
  error: { color: color.danger, fontSize: 12, lineHeight: 16 },
});

export function TimeField({
  label,
  value,
  referenceDate,
  onChange,
  placeholder,
  error,
  disabled,
  accessibilityLabel,
}: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const baseDate = referenceDate ?? value ?? new Date();

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    setOpen(false);
    if (event.type !== "set" || !picked) {
      return;
    }
    const [year, month, day] = dayKey(baseDate).split("-").map(Number);
    onChange(
      new Date(
        toBrasiliaISOString({
          year,
          month,
          day,
          hour: picked.getHours(),
          minute: picked.getMinutes(),
        }),
      ),
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={error}
        accessibilityState={{ disabled: !!disabled }}
        style={[styles.field, disabled && styles.fieldDisabled]}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatTime(value) : (placeholder ?? "Selecionar horário")}
        </Text>
        <FigmaIcon name="clock" size={18} color={color.ink[500]} />
      </Pressable>
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      {open ? (
        <DateTimePicker
          value={value ?? baseDate}
          mode="time"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
