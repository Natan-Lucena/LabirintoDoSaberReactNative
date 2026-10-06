// `.segmented` do Figma Make: grupo de 2+ opções, uma ativa. Ver ficha DS-03.
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";

export interface SegmentedOption {
  key: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#e8f0ef",
    gap: 4,
  },
  disabled: { opacity: 0.5 },
  segment: {
    flex: 1,
    height: 39,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: color.surface,
    ...shape.shadow.sm,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  labelActive: { color: color.brand[700] },
});

export function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: SegmentedControlProps): ReactElement {
  return (
    <View
      style={[styles.track, disabled ? styles.disabled : null]}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => !disabled && onChange(option.key)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive, disabled }}
            style={[styles.segment, isActive ? styles.segmentActive : null]}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
