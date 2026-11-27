import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DsButton, Field, SegmentedControl } from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";

import { ImageSlot } from "./MediaSlots";
import { emptyItem, type PrintableLayout } from "./schema";
import type { FieldsProps } from "./types";

const MAX_ITEMS = 20;

const layoutOptions = [
  { key: "LIST", label: "Lista" },
  { key: "GRID", label: "Grade" },
  { key: "SEQUENCE", label: "Sequência" },
];

export function PrintableFields({
  values,
  update,
  errorFor,
  disabled,
}: FieldsProps): ReactElement {
  const { items } = values;

  function patchItem(index: number, patch: Partial<(typeof items)[number]>) {
    update({
      items: items.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <View style={styles.list}>
      <Field
        label="Título *"
        value={values.title}
        onChangeText={(title) => update({ title })}
        error={errorFor("title")}
        maxLength={80}
        disabled={disabled}
      />
      <Field
        label="Instruções *"
        value={values.instructions}
        onChangeText={(instructions) => update({ instructions })}
        error={errorFor("instructions")}
        multiline
        maxLength={500}
        disabled={disabled}
      />
      <View style={styles.row}>
        <Text style={styles.label}>Disposição</Text>
        <SegmentedControl
          options={layoutOptions}
          value={values.layout}
          onChange={(layout) => update({ layout: layout as PrintableLayout })}
          disabled={disabled}
          accessibilityLabel="Disposição"
        />
      </View>
      <Field
        label="Linhas para resposta"
        value={values.answerLines}
        onChangeText={(answerLines) => update({ answerLines })}
        error={errorFor("answerLines")}
        hint="De 0 a 5 linhas em cada item."
        keyboardType="number-pad"
        maxLength={1}
        disabled={disabled}
      />
      <Text style={styles.heading}>Itens</Text>
      {errorFor("items") ? (
        <Text style={styles.error} accessibilityRole="alert">
          {errorFor("items")}
        </Text>
      ) : null}
      {items.map((item, index) => {
        const number = index + 1;
        return (
          <View key={item.key} style={styles.row}>
            <Field
              label={`Texto do item ${number}`}
              value={item.text}
              onChangeText={(text) => patchItem(index, { text })}
              error={errorFor(`items.${index}.text`)}
              multiline
              maxLength={200}
              disabled={disabled}
            />
            <ImageSlot
              label={`Imagem do item ${number}`}
              media={item.image}
              onChange={(image) => patchItem(index, { image })}
              disabled={disabled}
              error={errorFor(`items.${index}.image`)}
            />
            {items.length > 1 ? (
              <DsButton
                label={`Remover item ${number}`}
                variant="ghost"
                onPress={() =>
                  update({
                    items: items.filter((_, current) => current !== index),
                  })
                }
                disabled={disabled}
              />
            ) : null}
          </View>
        );
      })}
      {items.length < MAX_ITEMS ? (
        <DsButton
          label="Adicionar item"
          variant="soft"
          icon="plus"
          onPress={() => update({ items: [...items, emptyItem()] })}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  row: { gap: 8 },
  label: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 11,
    lineHeight: 14,
  },
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
