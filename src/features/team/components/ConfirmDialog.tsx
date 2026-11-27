import type { ReactElement, ReactNode } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { color, fontFamilies } from "@/theme";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  loading?: boolean;
  /** Mensagem do servidor depois de uma tentativa que falhou. */
  error?: string | null;
  /** Conteúdo extra entre o texto e os botões (ex.: campo de nome). */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const dialogStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
  actions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
});

/** Confirmação em `Modal`, no mesmo visual do perfil e da agenda. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  loading = false,
  error,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  return (
    <Modal transparent visible={visible} onRequestClose={onCancel}>
      <View style={dialogStyles.backdrop}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={dialogStyles.message}>{message}</Text> : null}
          {children}
          {error ? (
            <Text style={dialogStyles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <View style={dialogStyles.actions}>
            <DsButton
              label="Cancelar"
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
            />
            <DsButton
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
