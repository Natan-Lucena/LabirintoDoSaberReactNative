// `.timeline-item` do Figma Make, com marcadores `--done` e `--active`. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";

export type TimelineItemStatus = "default" | "done" | "active";

export interface TimelineItemData {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  status?: TimelineItemStatus;
  actionLabel?: string;
  onActionPress?: () => void;
}

export interface TimelineProps {
  items: TimelineItemData[];
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  time: {
    width: 44,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  markerColumn: { alignItems: "center" },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surface,
    borderWidth: 2,
    borderColor: color.border,
  },
  markerDone: {
    backgroundColor: color.brand[500],
    borderColor: color.brand[500],
  },
  markerActive: {
    backgroundColor: color.peach,
    borderColor: color.peachStrong,
    // Halo do item ativo.
    shadowColor: color.peachStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: color.border,
    marginVertical: 4,
  },
  content: { flex: 1, paddingBottom: 16, gap: 2 },
  title: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  actionLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
    marginTop: 4,
  },
});

function TimelineItemRow({
  item,
  isLast,
}: {
  item: TimelineItemData;
  isLast: boolean;
}): ReactElement {
  const reduceMotion = useReduceMotion();
  const status = item.status ?? "default";

  return (
    <View style={styles.row}>
      <Text style={styles.time}>{item.time}</Text>
      <View style={styles.markerColumn}>
        <View
          testID={`timeline-marker-${item.id}`}
          style={[
            styles.marker,
            status === "done" ? styles.markerDone : null,
            status === "active" ? styles.markerActive : null,
          ]}
        >
          {status === "done" ? (
            <FigmaIcon name="check" size={12} color={color.surface} />
          ) : null}
        </View>
        {isLast ? null : <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        ) : null}
        {item.actionLabel && item.onActionPress ? (
          <StaticPressable
            onPress={item.onActionPress}
            accessibilityRole="button"
            accessibilityLabel={item.actionLabel}
            hitSlop={8}
            style={({ pressed }) => getPressScaleStyle(pressed, reduceMotion)}
          >
            <Text style={styles.actionLabel}>{item.actionLabel}</Text>
          </StaticPressable>
        ) : null}
      </View>
    </View>
  );
}

export function Timeline({ items }: TimelineProps): ReactElement {
  return (
    <View>
      {items.map((item, index) => (
        <TimelineItemRow
          key={item.id}
          item={item}
          isLast={index === items.length - 1}
        />
      ))}
    </View>
  );
}
