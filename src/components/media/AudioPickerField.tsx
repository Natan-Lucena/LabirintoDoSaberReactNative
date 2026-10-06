import * as DocumentPicker from "expo-document-picker";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TaskMediaFile } from "@/api/endpoints/task-upload-media";
import { color, shape, typography } from "@/theme";

export interface AudioPickerFieldProps {
  value: (TaskMediaFile & { duration?: number }) | null;
  onChange: (value: (TaskMediaFile & { duration?: number }) | null) => void;
  loading?: boolean;
  error?: string;
}

function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function AudioPickerField({
  value,
  onChange,
  loading = false,
  error,
}: AudioPickerFieldProps) {
  async function selectAudio() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    onChange({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? "audio/*",
      size: asset.size ?? undefined,
    });
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher arquivo de áudio"
        disabled={loading}
        onPress={() => void selectAudio()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Escolher áudio</Text>
      </Pressable>
      {value ? (
        <View style={styles.selected}>
          <Text style={styles.fileName}>{value.name}</Text>
          {value.duration !== undefined ? (
            <Text style={styles.duration}>
              {formatDuration(value.duration)}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover áudio"
            disabled={loading}
            onPress={() => onChange(null)}
          >
            <Text style={styles.remove}>Remover áudio</Text>
          </Pressable>
        </View>
      ) : null}
      {loading ? <Text style={styles.status}>Enviando áudio...</Text> : null}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  button: {
    minHeight: shape.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: shape.buttonRadius,
    backgroundColor: color.primary,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: color.surface,
    fontFamily: typography.button.fontFamily,
  },
  selected: { gap: 4 },
  fileName: { color: color.text, fontFamily: typography.body.fontFamily },
  duration: {
    color: color.textSecondary,
    fontFamily: typography.body.fontFamily,
  },
  remove: { color: color.pink, fontFamily: typography.body.fontFamily },
  status: { color: color.text, fontFamily: typography.body.fontFamily },
  error: { color: color.pink, fontFamily: typography.body.fontFamily },
});
