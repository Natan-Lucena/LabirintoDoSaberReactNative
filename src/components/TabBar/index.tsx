import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, type IconName } from "../Icon";
import { color, semanticColor, shape, typography } from "../../theme";

export interface TabBarItem {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
}

export interface TabBarProps {
  tabs: TabBarItem[];
  activeKey: string;
}

export function TabBar({ tabs, activeKey }: TabBarProps): ReactElement {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const tintColor = isActive
          ? semanticColor.textAccentOnSurface
          : color.textTertiary;

        return (
          <Pressable
            key={tab.key}
            onPress={tab.onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive ? styles.iconWrapperActive : null,
              ]}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={tintColor}
                active={isActive}
              />
            </View>
            <Text
              style={[styles.label, { color: tintColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: shape.minTouchTarget,
  },
  iconWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 999,
  },
  iconWrapperActive: {
    backgroundColor: color.selection,
  },
  label: {
    fontSize: typography.tabLabel.fontSize,
    lineHeight: typography.tabLabel.lineHeight,
    fontFamily: typography.tabLabel.fontFamily,
    textAlign: "center",
  },
});
