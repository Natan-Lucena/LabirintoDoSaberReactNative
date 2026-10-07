import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FigmaIcon, type FigmaIconName } from "@/components/FigmaIcon";
import { CATEGORY_LABELS } from "@/features/activities/selectors";
import type { ActivityListItem } from "@/features/activities/types";
import { color, fontFamilies, shape } from "@/theme";

const CATEGORY_STYLE: Record<
  ActivityListItem["category"],
  { backgroundColor: string; icon: FigmaIconName; iconColor: string }
> = {
  reading: {
    backgroundColor: color.brand[100],
    icon: "grid",
    iconColor: color.brand[700],
  },
  writing: {
    backgroundColor: color.peach,
    icon: "book",
    iconColor: color.peachStrong,
  },
  vocabulary: {
    backgroundColor: color.lavender,
    icon: "print",
    iconColor: color.lavenderStrong,
  },
  comprehension: {
    backgroundColor: color.yellow,
    icon: "brain",
    iconColor: color.warning,
  },
};

export interface ActivityCardProps {
  item: ActivityListItem;
  onPress: () => void;
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
  thumbnail: {
    height: 88,
    borderRadius: shape.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
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

export function ActivityCard({
  item,
  onPress,
}: ActivityCardProps): ReactElement {
  const categoryStyle = CATEGORY_STYLE[item.category];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={styles.card}
    >
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: categoryStyle.backgroundColor },
        ]}
      >
        <FigmaIcon
          name={categoryStyle.icon}
          size={30}
          color={categoryStyle.iconColor}
        />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.metadata} numberOfLines={1}>
        {CATEGORY_LABELS[item.category]} · {item.secondary}
      </Text>
    </Pressable>
  );
}
