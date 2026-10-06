// `.check-list label` do Figma Make: linha 43 com caixa 21×21 (raio 7). Ver ficha DS-03.
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 43,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  disabled: { opacity: 0.5 },
  box: {
    width: 21,
    height: 21,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: color.ink[300],
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    backgroundColor: color.brand[500],
    borderWidth: 0,
  },
  label: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.ink[950],
  },
});

export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxProps): ReactElement {
  function handlePress() {
    if (disabled) {
      return;
    }
    onChange(!checked);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      style={[styles.row, disabled ? styles.disabled : null]}
    >
      <View style={[styles.box, checked ? styles.boxChecked : null]}>
        {checked ? (
          <FigmaIcon name="check" size={14} color={color.surface} />
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
