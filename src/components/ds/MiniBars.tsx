// `.mini-bars` do Figma Make. Ver ficha DS-05.
//
// O Make usa um gradiente `brand-500` → `brand-100` em cada barra; sem lib
// nova, cada barra usa `brand-500` com opacidade proporcional ao seu valor
// (a mais alta fica opaca, as menores ficam mais claras), aproximando o
// efeito sem depender de `react-native-linear-gradient`.
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { color } from "../../theme";

export interface MiniBarsProps {
  /** Valores de 0 a 100; a altura e a opacidade de cada barra são proporcionais. */
  values: number[];
  accessibilityLabel?: string;
  height?: number;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: color.brand[500],
  },
});

export function MiniBars({
  values,
  accessibilityLabel,
  height = 32,
}: MiniBarsProps): ReactElement {
  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { height }]}
    >
      {values.map((value, index) => {
        const clamped = Math.min(100, Math.max(0, value));
        return (
          <View
            key={index}
            testID={`mini-bar-${index}`}
            style={[
              styles.bar,
              {
                height: `${Math.max(clamped, 6)}%`,
                opacity: Math.max(clamped / 100, 0.25),
              },
            ]}
          />
        );
      })}
    </View>
  );
}
