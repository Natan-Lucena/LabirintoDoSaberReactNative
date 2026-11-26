import type { ReactElement } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { color, typography } from "@/theme";

export interface SeriesScopeDialogProps {
  visible: boolean;
  /** "edit" para editar/remarcar; "cancel" para cancelar. */
  action: "edit" | "cancel";
  /** Cancelar: "Os k atendimentos pendentes a partir de dd/mm serão cancelados e a série termina." */
  followingNote?: string;
  onThis: () => void;
  onFollowing: () => void;
  onBack: () => void;
}

/** Pergunta "só este" ou "este e os seguintes" (AGE-06, passos 7 e 8). */
export function SeriesScopeDialog({
  visible,
  action,
  followingNote,
  onThis,
  onFollowing,
  onBack,
}: SeriesScopeDialogProps): ReactElement {
  const edit = action === "edit";

  return (
    <Modal transparent visible={visible} onRequestClose={onBack}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            {edit
              ? "Alterar só este atendimento ou este e os seguintes?"
              : "Cancelar só este atendimento ou este e os seguintes?"}
          </Text>
          {!edit && followingNote ? (
            <Text style={styles.text}>{followingNote}</Text>
          ) : null}
          <View style={styles.actions}>
            <DsButton label="Só este" fullWidth onPress={onThis} />
            <DsButton
              label="Este e os seguintes"
              variant="secondary"
              fullWidth
              onPress={onFollowing}
            />
            <DsButton
              label="Voltar"
              variant="ghost"
              fullWidth
              onPress={onBack}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: color.surface,
  },
  title: { ...typography.cardTitle, color: color.text },
  text: { ...typography.body, color: color.textSecondary },
  actions: { gap: 10 },
});
