import { useId, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FigmaIcon } from "@/components/FigmaIcon";
import { color, fontFamilies, shape } from "@/theme";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: shape.radius.lg,
    borderTopRightRadius: shape.radius.lg,
    paddingVertical: 12,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[950],
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  option: {
    minHeight: shape.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  optionSelected: { backgroundColor: color.brand[50] },
  optionLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.semiBold,
    color: color.ink[950],
  },
});

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  disabled,
  accessibilityLabel,
}: SelectFieldProps) {
  const errorId = useId();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

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
        nativeID={errorId}
        style={[styles.field, disabled && styles.fieldDisabled]}
      >
        <Text style={selected ? styles.value : styles.placeholder}>
          {selected?.label ?? placeholder ?? "Selecionar"}
        </Text>
        <FigmaIcon name="chevron" size={18} color={color.ink[500]} />
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
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <FlatList
                data={options}
                keyExtractor={(option) => option.value}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: item.value === value }}
                    style={[
                      styles.option,
                      item.value === value && styles.optionSelected,
                    ]}
                  >
                    <Text style={styles.optionLabel}>{item.label}</Text>
                  </Pressable>
                )}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
