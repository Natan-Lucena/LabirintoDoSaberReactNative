import type { ReactElement } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { AudioPickerField } from "@/components/media/AudioPickerField";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { ImagePickerField } from "@/components/media/ImagePickerField";
import { color, fontFamilies, shape } from "@/theme";

import type { MediaValue } from "./schema";

interface SlotProps {
  label: string;
  media: MediaValue;
  onChange: (media: MediaValue) => void;
  disabled?: boolean;
  error?: string;
}

/** Imagem de um item: mostra a atual (edição) e deixa trocar ou remover. */
export function ImageSlot({
  label,
  media,
  onChange,
  disabled = false,
  error,
}: SlotProps): ReactElement {
  return (
    <View style={styles.slot}>
      <Text style={styles.label}>{label}</Text>
      {media.url && !media.file ? (
        <View style={styles.current}>
          <Image
            source={{ uri: media.url }}
            style={styles.preview}
            accessibilityLabel={`${label} atual`}
          />
          <DsButton
            label={`Remover ${label.toLocaleLowerCase("pt-BR")} atual`}
            variant="ghost"
            onPress={() => onChange({ file: null })}
            disabled={disabled}
          />
        </View>
      ) : null}
      <ImagePickerField
        value={media.file}
        onChange={(file) => onChange({ url: media.url, file })}
        loading={disabled}
        error={error}
      />
    </View>
  );
}

export function AudioSlot({
  label,
  media,
  onChange,
  disabled = false,
  error,
}: SlotProps): ReactElement {
  return (
    <View style={styles.slot}>
      <Text style={styles.label}>{label}</Text>
      {media.url && !media.file ? (
        <View style={styles.current}>
          <AudioPlayer url={media.url} />
          <DsButton
            label={`Remover ${label.toLocaleLowerCase("pt-BR")} atual`}
            variant="ghost"
            onPress={() => onChange({ file: null })}
            disabled={disabled}
          />
        </View>
      ) : null}
      <AudioPickerField
        value={media.file}
        onChange={(file) => onChange({ url: media.url, file })}
        loading={disabled}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { gap: 8 },
  current: { gap: 4 },
  label: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 11,
    lineHeight: 14,
  },
  preview: { width: "100%", height: 140, borderRadius: shape.cardRadius },
});
