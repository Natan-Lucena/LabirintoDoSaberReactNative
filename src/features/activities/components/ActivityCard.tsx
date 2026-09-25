import { Ionicons } from "@expo/vector-icons";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Tag } from "@/components/Tag";
import { CATEGORY_LABELS } from "@/features/activities/selectors";
import type { ActivityListItem } from "@/features/activities/types";
import { color, shape, typography } from "@/theme";

// Faixas/ícones do Figma (nós 1:25032/1:25165/1:25266/1:25365, D-09): cores
// fora do tema porque são só decorativas (faixa + fundo do ícone), sem texto.
const KIND_STYLE: Record<
  ActivityListItem["kind"],
  { accent: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  notebook: { accent: "#D8F5F3", icon: "book-outline" },
  group: { accent: "#E3F0FF", icon: "folder-open-outline" },
  task: { accent: "#FFE8F0", icon: "document-text-outline" },
};

export interface ActivityCardProps {
  item: ActivityListItem;
  onPress: () => void;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    overflow: "hidden",
  },
  stripe: { width: 6 },
  body: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    alignItems: "flex-start",
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1, gap: 6 },
  title: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    fontWeight: typography.cardTitle.fontWeight,
    color: color.text,
  },
  secondary: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
});

export function ActivityCard({
  item,
  onPress,
}: ActivityCardProps): ReactElement {
  const kindStyle = KIND_STYLE[item.kind];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={styles.card}
    >
      <View style={[styles.stripe, { backgroundColor: kindStyle.accent }]} />
      <View style={styles.body}>
        <View
          style={[styles.iconSquare, { backgroundColor: kindStyle.accent }]}
        >
          <Ionicons name={kindStyle.icon} size={20} color={color.text} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={styles.secondary}>{item.secondary}</Text>
          <Tag label={CATEGORY_LABELS[item.category]} variant="neutral" />
        </View>
      </View>
    </Pressable>
  );
}
