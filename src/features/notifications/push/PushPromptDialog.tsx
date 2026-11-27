import type { ReactElement } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { DsButton, Toast } from "@/components/ds";
import { color, typography } from "@/theme";
import type { PushRegistration } from "./usePushRegistration";

/** Explicação antes do pedido de permissão do sistema (NOT-02). */
export function PushPromptDialog({
  push,
}: {
  push: PushRegistration;
}): ReactElement {
  return (
    <>
      <Modal
        transparent
        visible={push.promptVisible}
        onRequestClose={push.dismiss}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Receber lembretes no celular?</Text>
            <Text style={styles.body}>
              Avisamos uma vez por dia sobre atendimentos e pendências. O aviso
              não mostra nomes de pacientes.
            </Text>
            <View style={styles.actions}>
              <DsButton
                label="Agora não"
                variant="secondary"
                onPress={push.dismiss}
              />
              <DsButton label="Ativar" onPress={push.accept} />
            </View>
          </View>
        </View>
      </Modal>
      <Toast message={push.message} onHide={push.hideMessage} />
    </>
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
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { ...typography.cardTitle, color: color.text },
  body: { ...typography.body, color: color.textSecondary },
  actions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
});
