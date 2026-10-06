// `.progress` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { color } from "../../theme";

export interface ProgressBarProps {
  /** 0 a 100; valores fora do intervalo são limitados. */
  value: number;
  accessibilityLabel: string;
}

const styles = StyleSheet.create({
  track: {
    height: 7,
    borderRadius: 10,
    backgroundColor: color.brand[100],
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: color.brand[500],
  },
});

export function ProgressBar({
  value,
  accessibilityLabel,
}: ProgressBarProps): ReactElement {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}
