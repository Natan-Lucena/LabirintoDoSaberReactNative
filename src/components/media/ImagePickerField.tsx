import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { TaskMediaFile } from "@/api/endpoints/task-upload-media";
import { color, shape, typography } from "@/theme";

export interface ImagePickerFieldProps {
  value: TaskMediaFile | null;
  onChange: (value: TaskMediaFile | null) => void;
  loading?: boolean;
  error?: string;
}

export function ImagePickerField({
  value,
  onChange,
  loading = false,
  error,
}: ImagePickerFieldProps) {
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function selectImage(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPermissionDenied(true);
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] });
    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    setPermissionDenied(false);
    onChange({
      uri: asset.uri,
      name: asset.fileName ?? "imagem.jpg",
      mimeType: asset.mimeType ?? "image/jpeg",
      size: asset.fileSize ?? undefined,
    });
  }

  return (
    <View style={styles.container}>
      {value ? (
        <Image source={{ uri: value.uri }} style={styles.preview} />
      ) : null}
      <View style={styles.actions}>
        <PickerButton
          label="Escolher imagem"
          accessibilityLabel="Escolher imagem da galeria"
          onPress={() => selectImage("library")}
          disabled={loading}
        />
        <PickerButton
          label="Tirar foto"
          accessibilityLabel="Tirar foto"
          onPress={() => selectImage("camera")}
          disabled={loading}
        />
        {value ? (
          <PickerButton
            label="Remover imagem"
            onPress={() => onChange(null)}
            disabled={loading}
          />
        ) : null}
      </View>
      {loading ? <Text style={styles.status}>Enviando imagem...</Text> : null}
      {permissionDenied ? (
        <View>
          <Text style={styles.error} accessibilityRole="alert">
            Permita o acesso às fotos nas configurações para escolher uma
            imagem.
          </Text>
          <PickerButton
            label="Abrir configurações"
            onPress={() => void Linking.openSettings()}
          />
        </View>
      ) : null}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function PickerButton({
  label,
  accessibilityLabel,
  onPress,
  disabled = false,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  actions: { gap: 8 },
  preview: { width: "100%", height: 180, borderRadius: shape.cardRadius },
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
  status: { color: color.text, fontFamily: typography.body.fontFamily },
  error: { color: color.pink, fontFamily: typography.body.fontFamily },
});
