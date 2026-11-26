import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { HelpTutorial } from "@/api/types";
import { StaticPressable } from "@/components/ds/StaticPressable";
import {
  formatTutorialDuration,
  tutorialMinutes,
} from "@/features/help/format";
import { color, fontFamilies } from "@/theme";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: color.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 14,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
  body: { flex: 1, gap: 2 },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  duration: {
    fontSize: 12,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function TutorialRow({
  tutorial,
  index,
  onPress,
}: {
  tutorial: HelpTutorial;
  index: number;
  onPress: () => void;
}): ReactElement {
  const count = tutorialMinutes(tutorial.durationSeconds);
  return (
    <StaticPressable
      accessibilityRole="button"
      accessibilityLabel={`Tutorial ${index}: ${tutorial.title}, ${count} ${count === 1 ? "minuto" : "minutos"}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.number}>
        <Text style={styles.numberText}>{String(index)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{tutorial.title}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {tutorial.description}
        </Text>
      </View>
      <Text style={styles.duration}>
        {formatTutorialDuration(tutorial.durationSeconds)}
      </Text>
    </StaticPressable>
  );
}
