// `.tabs` / `.tab--active` do Figma Make. Ver ficha DS-03.
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";

export interface TabOption {
  key: string;
  label: string;
}

export interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  disabled: { opacity: 0.5 },
  tab: {
    flex: 1,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: color.brand[500] },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.ink[500],
  },
  labelActive: { color: color.brand[700] },
});

export function Tabs({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: TabsProps): ReactElement {
  return (
    <View
      style={[styles.row, disabled ? styles.disabled : null]}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => !disabled && onChange(option.key)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive, disabled }}
            style={[styles.tab, isActive ? styles.tabActive : null]}
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
