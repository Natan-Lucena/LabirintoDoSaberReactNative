import type { ReactElement } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { HelpTutorial } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { formatTutorialDuration } from "@/features/help/format";
import { color, fontFamilies, shape } from "@/theme";

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: color.surface,
    borderRadius: shape.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  media: {
    height: 150,
    backgroundColor: color.brand[700],
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  body: { padding: 14, gap: 4 },
  eyebrow: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function FeaturedTutorial({
  tutorial,
  onPress,
}: {
  tutorial: HelpTutorial;
  onPress: () => void;
}): ReactElement {
  const minutes = formatTutorialDuration(tutorial.durationSeconds);
  return (
    <StaticPressable
      accessibilityRole="button"
      accessibilityLabel={`Comece por aqui: ${tutorial.title}, ${minutes}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.media}>
        {tutorial.thumbnailUrl ? (
          <Image
            source={{ uri: tutorial.thumbnailUrl }}
            style={styles.thumb}
            accessibilityElementsHidden
          />
        ) : null}
        {tutorial.videoUrl ? (
          <FigmaIcon name="play" size={36} color={color.surface} />
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>
          {`COMECE POR AQUI · ${minutes.toUpperCase()}`}
        </Text>
        <Text style={styles.title}>{tutorial.title}</Text>
        <Text style={styles.description}>{tutorial.description}</Text>
      </View>
    </StaticPressable>
  );
}
