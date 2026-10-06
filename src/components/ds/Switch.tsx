// `.switch` do Figma Make: 44×26, padding 3, bolinha 20 deslocada 18 quando ligado.
import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { color } from "../../theme";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 20,
    padding: 3,
    backgroundColor: color.ink[300],
    justifyContent: "center",
  },
  trackOn: { backgroundColor: color.brand[500] },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.surface,
  },
  thumbOn: { transform: [{ translateX: 18 }] },
  disabled: { opacity: 0.5 },
});

export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: SwitchProps): ReactElement {
  function handlePress() {
    if (disabled) {
      return;
    }
    onValueChange(!value);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.track,
        value ? styles.trackOn : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={[styles.thumb, value ? styles.thumbOn : null]} />
    </Pressable>
  );
}
