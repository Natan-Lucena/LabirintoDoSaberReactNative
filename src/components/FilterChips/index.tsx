import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, semanticColor, typography } from "../../theme";

export interface FilterChipOption {
  key: string;
  label: string;
}

export interface FilterChipsProps {
  options: FilterChipOption[];
  selected: string[];
  onToggle: (key: string) => void;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: color.tagNeutral,
  },
  chipSelected: { backgroundColor: color.selection },
  label: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.textSecondary,
  },
  labelSelected: { color: semanticColor.textOnSelection },
});

export function FilterChips({ options, selected, onToggle }: FilterChipsProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected.includes(option.key);
        return (
          <Pressable
            key={option.key}
            onPress={() => onToggle(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            hitSlop={12}
            style={[styles.chip, isSelected ? styles.chipSelected : null]}
          >
            <Text
              style={[styles.label, isSelected ? styles.labelSelected : null]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
