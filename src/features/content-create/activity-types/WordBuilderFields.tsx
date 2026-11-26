import type { ReactElement } from "react";
import { View } from "react-native";

import { Field } from "@/components/ds";

import { AudioSlot, ImageSlot } from "./MediaSlots";
import type { FieldsProps } from "./types";

export function WordBuilderFields({
  values,
  update,
  errorFor,
  disabled,
}: FieldsProps): ReactElement {
  return (
    <View style={{ gap: 16 }}>
      <Field
        label="Palavra *"
        value={values.word}
        onChangeText={(word) =>
          update({ word: word.toLocaleUpperCase("pt-BR") })
        }
        error={errorFor("word")}
        hint="De 2 a 12 letras. Pode ter acento."
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
        disabled={disabled}
      />
      <Field
        label="Letras extras"
        value={values.distractors}
        onChangeText={(distractors) =>
          update({ distractors: distractors.toLocaleUpperCase("pt-BR") })
        }
        error={errorFor("distractors")}
        hint="Até 6 letras, separadas por espaço."
        autoCapitalize="characters"
        autoCorrect={false}
        disabled={disabled}
      />
      <ImageSlot
        label="Imagem de dica"
        media={values.hintImage}
        onChange={(hintImage) => update({ hintImage })}
        disabled={disabled}
        error={errorFor("hintImage")}
      />
      <AudioSlot
        label="Áudio de dica"
        media={values.hintAudio}
        onChange={(hintAudio) => update({ hintAudio })}
        disabled={disabled}
        error={errorFor("hintAudio")}
      />
    </View>
  );
}
