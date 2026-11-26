import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DsButton, Field } from "@/components/ds";
import { COLOR_PALETTE } from "@/features/activities/engine/color-match/colorNames";
import { color, fontFamilies, semanticColor } from "@/theme";

import { emptyPair } from "./schema";
import type { FieldsProps } from "./types";

const MAX_PAIRS = 6;
const MIN_PAIRS = 2;

export function ColorMatchFields({
  values,
  update,
  errorFor,
  disabled,
}: FieldsProps): ReactElement {
  const { pairs } = values;

  function patchPair(index: number, patch: Partial<(typeof pairs)[number]>) {
    update({
      pairs: pairs.map((pair, current) =>
        current === index ? { ...pair, ...patch } : pair,
      ),
    });
  }

  return (
    <View style={styles.list}>
      <Text style={styles.heading}>Pares de palavra e cor</Text>
      {errorFor("pairs") ? (
        <Text style={styles.error} accessibilityRole="alert">
          {errorFor("pairs")}
        </Text>
      ) : null}
      {pairs.map((pair, index) => {
        const number = index + 1;
        const colorError = errorFor(`pairs.${index}.colorHex`);
        return (
          <View key={pair.key} style={styles.row}>
            <Field
              label={`Palavra do par ${number}`}
              value={pair.word}
              onChangeText={(word) => patchPair(index, { word })}
              error={errorFor(`pairs.${index}.word`)}
              maxLength={20}
              disabled={disabled}
            />
            <View style={styles.swatches}>
              {COLOR_PALETTE.map((entry) => {
                const selected = pair.colorHex === entry.hex;
                return (
                  <Pressable
                    key={entry.hex}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${entry.name} do par ${number}`}
                    accessibilityState={{ selected, disabled }}
                    disabled={disabled}
                    onPress={() => patchPair(index, { colorHex: entry.hex })}
                    style={[
                      styles.swatch,
                      { backgroundColor: entry.hex },
                      selected ? styles.swatchSelected : null,
                    ]}
                  />
                );
              })}
            </View>
            {colorError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {colorError}
              </Text>
            ) : null}
            {pairs.length > MIN_PAIRS ? (
              <DsButton
                label={`Remover par ${number}`}
                variant="ghost"
                onPress={() =>
                  update({
                    pairs: pairs.filter((_, current) => current !== index),
                  })
                }
                disabled={disabled}
              />
            ) : null}
          </View>
        );
      })}
      {pairs.length < MAX_PAIRS ? (
        <DsButton
          label="Adicionar par"
          variant="soft"
          icon="plus"
          onPress={() => update({ pairs: [...pairs, emptyPair()] })}
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
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: color.ink[300],
  },
  swatchSelected: { borderColor: color.ink[950], borderWidth: 4 },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.regular,
  },
});
