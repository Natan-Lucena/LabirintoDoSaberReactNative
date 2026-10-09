// `.filter-chip` / `.filter-row` do Figma Make. Ver ficha DS-03.
import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { color, fontFamilies } from "../../theme";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";

export interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  chipActive: {
    backgroundColor: color.brand[50],
    borderColor: color.brand[200],
  },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  labelActive: { color: color.brand[700] },
  row: { gap: 8 },
});

export function FilterChip({
  label,
  active = false,
  onPress,
  disabled = false,
}: FilterChipProps): ReactElement {
  const reduceMotion = useReduceMotion();

  function handlePress() {
    if (disabled) {
      return;
    }
    onPress();
  }

  return (
    <StaticPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : null,
        disabled ? styles.disabled : null,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <Text style={[styles.label, active ? styles.labelActive : null]}>
        {label}
      </Text>
    </StaticPressable>
  );
}

export interface FilterChipOption {
  key: string;
  label: string;
}

export interface FilterRowProps {
  options: FilterChipOption[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
}

export function FilterRow({
  options,
  value,
  onChange,
  disabled = false,
}: FilterRowProps): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          active={option.key === value}
          onPress={() => onChange(option.key)}
          disabled={disabled}
        />
      ))}
    </ScrollView>
  );
}
