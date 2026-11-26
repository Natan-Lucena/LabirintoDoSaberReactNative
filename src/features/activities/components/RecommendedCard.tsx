import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { RecommendedTask } from "@/api/types";
import { DsButton } from "@/components/ds";
import { FigmaIcon } from "@/components/FigmaIcon";
import {
  CatalogTaskCard,
  taskIcon,
  toneStyle,
} from "@/features/activities/components/CatalogTaskCard";
import { color, fontFamilies, shape } from "@/theme";

export interface RecommendedCardProps {
  firstName: string;
  items: RecommendedTask[];
  onStart: (item: RecommendedTask) => void;
  onOpen: (item: RecommendedTask) => void;
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  feature: {
    gap: 10,
    padding: 16,
    backgroundColor: color.brand[50],
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  art: {
    width: 56,
    height: 56,
    borderRadius: shape.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  othersTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  others: { gap: 10 },
  empty: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function RecommendedCard({
  firstName,
  items,
  onStart,
  onOpen,
}: RecommendedCardProps): ReactElement {
  const [featured, ...others] = items;

  if (!featured) {
    return (
      <Text style={styles.empty}>
        {`Ainda não há recomendação para ${firstName}.`}
      </Text>
    );
  }

  const tone = toneStyle(featured.tone);

  return (
    <View style={styles.wrapper}>
      <View style={styles.feature}>
        <Text style={styles.eyebrow}>{`Recomendado para ${firstName}`}</Text>
        <View style={styles.row}>
          <View style={[styles.art, { backgroundColor: tone.background }]}>
            <FigmaIcon name={taskIcon(featured)} size={28} color={tone.icon} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{featured.title}</Text>
            <Text style={styles.reason}>{featured.reason}</Text>
          </View>
        </View>
        <DsButton
          label="Iniciar atividade"
          icon="play"
          fullWidth
          onPress={() => onStart(featured)}
        />
      </View>
      {others.length > 0 ? (
        <View style={styles.wrapper}>
          <Text style={styles.othersTitle}>{`Outras para ${firstName}`}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.others}
          >
            {others.slice(0, 5).map((item) => (
              <CatalogTaskCard
                key={item.id}
                item={item}
                compact
                onPress={() => onOpen(item)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
