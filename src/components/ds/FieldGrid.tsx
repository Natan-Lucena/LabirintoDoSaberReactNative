import { Children, type ReactNode, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";

export interface FieldGridProps {
  children: ReactNode;
}

const NARROW_BREAKPOINT = 360;

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stacked: { flexDirection: "column", gap: 10 },
  itemHalf: { flexGrow: 1, flexBasis: "45%" },
  itemFull: { width: "100%" },
});

/**
 * `.field-grid` do Figma Make: 2 colunas com gap 10, empilhando em telas
 * estreitas (abaixo de ~360dp, AC-DS-04-01 do Figma). Mede a própria largura
 * via `onLayout` em vez de `useWindowDimensions`, já que o grid pode estar
 * dentro de um container com padding.
 */
export function FieldGrid({ children }: FieldGridProps) {
  const [width, setWidth] = useState(0);
  const isNarrow = width > 0 && width < NARROW_BREAKPOINT;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      onLayout={handleLayout}
      style={isNarrow ? styles.stacked : styles.grid}
    >
      {Children.map(children, (child) => (
        <View style={isNarrow ? styles.itemFull : styles.itemHalf}>
          {child}
        </View>
      ))}
    </View>
  );
}
