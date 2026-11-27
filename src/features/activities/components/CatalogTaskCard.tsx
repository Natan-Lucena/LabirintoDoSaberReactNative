import type { ReactElement } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { TaskSummary, TaskTone } from "@/api/types";
import { FigmaIcon, type FigmaIconName } from "@/components/FigmaIcon";
import { color, fontFamilies, shape } from "@/theme";

const TONE_STYLE: Record<TaskTone, { background: string; icon: string }> = {
  mint: { background: color.brand[100], icon: color.brand[700] },
  peach: { background: color.peach, icon: color.peachStrong },
  lavender: { background: color.lavender, icon: color.lavenderStrong },
  yellow: { background: color.yellow, icon: color.warning },
};

export function toneStyle(tone: TaskTone) {
  return TONE_STYLE[tone];
}

export function taskIcon(
  item: Pick<TaskSummary, "type" | "format">,
): FigmaIconName {
  if (item.format === "PRINTABLE") return "print";
  return item.type === "multipleChoice" ||
    item.type === "multipleChoiceWithMedia"
    ? "book"
    : "play";
}

/** "{habilidade} · {Interativa|Imprimível}" */
export function taskMetadata(item: TaskSummary): string {
  const format = item.format === "PRINTABLE" ? "Imprimível" : "Interativa";
  const skill = item.skills[0]?.label;
  return skill ? `${skill} · ${format}` : format;
}

export interface CatalogTaskCardProps {
  item: TaskSummary;
  onPress: () => void;
  compact?: boolean;
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    gap: 10,
    padding: 10,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    ...shape.shadow.sm,
  },
  compact: { width: 150, flexBasis: undefined, flexGrow: 0 },
  thumbnail: {
    height: 88,
    borderRadius: shape.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  title: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  metadata: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function CatalogTaskCard({
  item,
  onPress,
  compact = false,
}: CatalogTaskCardProps): ReactElement {
  const tone = TONE_STYLE[item.tone] ?? TONE_STYLE.mint;

  return (
    <Pressable
      onPress={onPress}
      testID={`activity-card-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={taskMetadata(item)}
      style={[styles.card, compact ? styles.compact : null]}
    >
      <View style={[styles.thumbnail, { backgroundColor: tone.background }]}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.image}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <FigmaIcon name={taskIcon(item)} size={30} color={tone.icon} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.metadata} numberOfLines={1}>
        {taskMetadata(item)}
      </Text>
    </Pressable>
  );
}
