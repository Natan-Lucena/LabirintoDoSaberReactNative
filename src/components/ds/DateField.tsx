import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { FigmaIcon } from "@/components/FigmaIcon";
import { color, fontFamilies, shape } from "@/theme";
import { formatLongDate, toBrasiliaISOString } from "@/utils/date";

export interface DateFieldProps {
  label: string;
  /** Instante (meia-noite no fuso America/Sao_Paulo) do dia selecionado. */
  value: Date | null;
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

/**
 * O picker nativo entrega a data escolhida nos componentes locais do
 * dispositivo (o que o usuário viu na UI). `toBrasiliaISOString` ancora esse
 * dia como meia-noite no fuso America/Sao_Paulo (G-13), independente do fuso
 * do aparelho.
 */
function toSaoPauloMidnight(picked: Date): Date {
  return new Date(
    toBrasiliaISOString({
      year: picked.getFullYear(),
      month: picked.getMonth() + 1,
      day: picked.getDate(),
      hour: 0,
      minute: 0,
    }),
  );
}

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  accessibilityLabel,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    setOpen(false);
    if (event.type !== "set" || !picked) {
      return;
    }
    onChange(toSaoPauloMidnight(picked));
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
          {value ? formatLongDate(value) : (placeholder ?? "Selecionar data")}
        </Text>
        <FigmaIcon name="calendar" size={18} color={color.ink[500]} />
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
          value={value ?? new Date()}
          mode="date"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
