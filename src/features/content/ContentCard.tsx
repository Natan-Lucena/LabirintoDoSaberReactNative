import { StyleSheet, Text, View } from "react-native";

import { Card } from "../../components/Card";
import { Tag } from "../../components/Tag";
import { color, typography } from "../../theme";

export interface ContentCardProps {
  description: string;
  tags: string[];
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
    marginBottom: 8,
  },
  tagsRow: { flexDirection: "row", gap: 6 },
});

export function ContentCard({
  description,
  tags,
  selected,
  onPress,
  accessibilityLabel,
}: ContentCardProps) {
  return (
    <Card
      selected={selected}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        style={styles.title}
        numberOfLines={2}
        ellipsizeMode="tail"
        accessibilityLabel={description}
      >
        {description}
      </Text>
      <View style={styles.tagsRow}>
        {tags.map((tag, index) => (
          <Tag
            key={tag}
            label={tag}
            variant={index === 0 ? "primary" : "neutral"}
          />
        ))}
      </View>
    </Card>
  );
}
