import type { ReactElement } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { PrintableContent } from "@/api/types";
import { color, shape, typography } from "@/theme";

export interface PrintablePreviewProps {
  content: PrintableContent;
  childName?: string;
}

type Item = PrintableContent["items"][number];

function ItemView({
  item,
  index,
  layout,
}: {
  item: Item;
  index: number;
  layout: PrintableContent["layout"];
}): ReactElement | null {
  if (!item.text?.trim() && !item.imageUrl?.trim()) return null;
  const lines = Math.min(5, Math.max(0, Math.trunc(item.answerLines ?? 0)));
  const sequence = layout === "SEQUENCE";
  return (
    <View
      testID={`printable-item-${index}`}
      style={
        layout === "GRID"
          ? styles.gridItem
          : sequence
            ? styles.seqItem
            : styles.item
      }
    >
      {layout === "LIST" ? <Text style={styles.text}>{index + 1}.</Text> : null}
      <View
        testID={`printable-item-body-${index}`}
        style={sequence ? styles.seqBody : styles.itemBody}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            accessibilityLabel={`Imagem do item ${index + 1}`}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {item.text ? <Text style={styles.text}>{item.text}</Text> : null}
        {Array.from({ length: lines }, (_, i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>
    </View>
  );
}

export function PrintablePreview({
  content,
  childName,
}: PrintablePreviewProps): ReactElement {
  const name = childName?.trim();
  return (
    <View style={styles.sheet} testID="printable-preview">
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.text}>Nome: {name || "______________________"}</Text>
      <Text style={styles.text}>Data: ____/____/________</Text>
      <Text style={styles.instructions}>{content.instructions}</Text>
      <View style={content.layout === "LIST" ? styles.list : styles.wrap}>
        {content.items.map((item, index) => {
          const view = (
            <ItemView
              key={item.id}
              item={item}
              index={index}
              layout={content.layout}
            />
          );
          if (content.layout !== "SEQUENCE" || index === 0) return view;
          return [
            <Text key={`${item.id}-arrow`} style={styles.arrow}>
              →
            </Text>,
            view,
          ];
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: shape.radius.md,
    padding: 20,
    gap: 8,
    ...shape.shadow.sm,
  },
  title: { ...typography.section, color: color.text },
  instructions: { ...typography.body, color: color.text, marginVertical: 8 },
  text: { ...typography.body, color: color.text },
  list: { gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  item: { flexDirection: "row", gap: 8 },
  gridItem: {
    width: "47%",
    borderWidth: 1,
    borderColor: color.border,
    padding: 8,
  },
  seqItem: { alignItems: "center" },
  seqBody: { gap: 4, minWidth: 96 },
  arrow: { ...typography.body, color: color.text, alignSelf: "center" },
  itemBody: { flex: 1, gap: 4 },
  image: { width: 120, height: 120, resizeMode: "contain" },
  line: { height: 24, borderBottomWidth: 1, borderBottomColor: color.text },
});
