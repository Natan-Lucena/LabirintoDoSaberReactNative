import type { ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";

import { color, shape, typography } from "@/theme";

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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: shape.cardRadius,
    borderTopRightRadius: shape.cardRadius,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    marginBottom: 8,
  },
  option: {
    minHeight: shape.minTouchTarget,
    borderRadius: shape.buttonRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  optionLabel: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
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
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.title}>Criar novo conteúdo</Text>
          {options.map((option) => (
            <Pressable
              key={option.key}
              onPress={option.onPress}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              style={styles.option}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
