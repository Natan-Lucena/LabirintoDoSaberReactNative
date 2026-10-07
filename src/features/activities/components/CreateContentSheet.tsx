import type { ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { color, fontFamilies, shape } from "@/theme";

export interface CreateContentOption {
  key: string;
  label: string;
  onPress: () => void;
}

export interface CreateContentSheetProps {
  visible: boolean;
  options: CreateContentOption[];
  onClose: () => void;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(23,51,49,0.35)",
  },
  sheet: {
    gap: 12,
    padding: 20,
    backgroundColor: color.surface,
    borderTopLeftRadius: shape.radius.lg,
    borderTopRightRadius: shape.radius.lg,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
});

export function CreateContentSheet({
  visible,
  options,
  onClose,
}: CreateContentSheetProps): ReactElement | null {
  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} visible>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Criar conteúdo</Text>
          {options.map((option) => (
            <DsButton
              key={option.key}
              label={option.label}
              variant="secondary"
              onPress={option.onPress}
            />
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
