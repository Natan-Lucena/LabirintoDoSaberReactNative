import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DsButton, Field } from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";

import { ImageSlot } from "./MediaSlots";
import { emptyCard } from "./schema";
import type { FieldsProps } from "./types";

const MAX_CARDS = 8;
const MIN_CARDS = 2;

export function MemoryGameFields({
  values,
  update,
  errorFor,
  disabled,
}: FieldsProps): ReactElement {
  const { cards } = values;

  function patchCard(index: number, patch: Partial<(typeof cards)[number]>) {
    update({
      cards: cards.map((card, current) =>
        current === index ? { ...card, ...patch } : card,
      ),
    });
  }

  return (
    <View style={styles.list}>
      <Text style={styles.heading}>Cartas</Text>
      {errorFor("cards") ? (
        <Text style={styles.error} accessibilityRole="alert">
          {errorFor("cards")}
        </Text>
      ) : null}
      {cards.map((card, index) => {
        const number = index + 1;
        return (
          <View key={card.key} style={styles.row}>
            <Field
              label={`Texto da carta ${number}`}
              value={card.label}
              onChangeText={(label) => patchCard(index, { label })}
              error={errorFor(`cards.${index}.label`)}
              maxLength={20}
              disabled={disabled}
            />
            <ImageSlot
              label={`Imagem da carta ${number}`}
              media={card.image}
              onChange={(image) => patchCard(index, { image })}
              disabled={disabled}
              error={errorFor(`cards.${index}.image`)}
            />
            {cards.length > MIN_CARDS ? (
              <DsButton
                label={`Remover carta ${number}`}
                variant="ghost"
                onPress={() =>
                  update({
                    cards: cards.filter((_, current) => current !== index),
                  })
                }
                disabled={disabled}
              />
            ) : null}
          </View>
        );
      })}
      {cards.length < MAX_CARDS ? (
        <DsButton
          label="Adicionar carta"
          variant="soft"
          icon="plus"
          onPress={() => update({ cards: [...cards, emptyCard()] })}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { gap: 8 },
  heading: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.regular,
  },
});
