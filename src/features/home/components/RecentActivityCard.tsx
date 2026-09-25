import { Ionicons } from "@expo/vector-icons";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, typography } from "../../../theme";

export interface RecentActivityCardProps {
  title: string;
  tags: string[];
  index: number;
  onPress?: () => void;
}

// UX2 (Figma "Home sem agenda"): "Atividades Recentes" — fundo e ícone
// alternam por índice; não há token de tema para essas cores decorativas.
const BACKGROUND_COLORS = ["#D8F5F3", "#FFE8F0", "#FFF6D8"] as const;
const ICON_NAMES = [
  "book-outline",
  "calculator-outline",
  "pencil-outline",
] as const;

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: 13,
    padding: 12,
    gap: 8,
  },
  iconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: color.surface,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.textSecondary,
  },
});

export function RecentActivityCard({
  title,
  tags,
  index,
  onPress,
}: RecentActivityCardProps): ReactElement {
  const paletteIndex = index % BACKGROUND_COLORS.length;
  const iconName = ICON_NAMES[paletteIndex];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.card,
        { backgroundColor: BACKGROUND_COLORS[paletteIndex] },
      ]}
    >
      <View style={styles.iconSquare}>
        <Ionicons
          name={iconName}
          size={18}
          color={color.text}
          testID={`icon-${iconName}`}
        />
      </View>
      <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
        {title}
      </Text>
      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagLabel}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
