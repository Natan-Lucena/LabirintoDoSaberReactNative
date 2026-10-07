// `.bottom-nav` do Figma Make: 4 abas, ativo com fundo `brand-50`, ícone e
// rótulo em `brand-700`, radius 14. Ver ficha NAV-01 do backlog. Substitui
// `@/components/TabBar` (Entrega 1) na nova casca; o componente antigo
// permanece até a limpeza da NAV-03.
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { color, fontFamilies, shape } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: FigmaIconName;
  onPress: () => void;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeKey: string;
}

export function BottomNav({ items, activeKey }: BottomNavProps): ReactElement {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  return (
    <View style={[styles.container, { paddingBottom: 7 + insets.bottom }]}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const tint = isActive ? color.brand[700] : color.ink[500];

        return (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.item,
              getPressScaleStyle(pressed, reduceMotion),
            ]}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive ? styles.iconWrapperActive : null,
              ]}
            >
              <FigmaIcon name={item.icon} size={20} color={tint} />
            </View>
            <Text
              style={[styles.label, { color: tint }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: 7,
    paddingHorizontal: 9,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: shape.minTouchTarget,
  },
  iconWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: color.brand[50],
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    textAlign: "center",
  },
});
