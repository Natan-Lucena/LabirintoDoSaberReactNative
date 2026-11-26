import { useState, type ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { ClinicMember } from "@/api/types";
import { Avatar, DsButton } from "@/components/ds";
import { dialogStyles } from "@/features/team/components/ConfirmDialog";
import { teamRoleLabel } from "@/features/team/roles";
import { color, fontFamilies } from "@/theme";

export interface ShareWithDialogProps {
  visible: boolean;
  patientName: string;
  /** Membros que ainda não têm acesso (sem o próprio educador). */
  candidates: ClinicMember[];
  loading?: boolean;
  error?: string | null;
  onConfirm: (member: ClinicMember) => void;
  onCancel: () => void;
}

/** "Compartilhar com…": escolhe a colega e confirma no mesmo diálogo. */
export function ShareWithDialog({
  visible,
  patientName,
  candidates,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ShareWithDialogProps): ReactElement {
  const [selected, setSelected] = useState<ClinicMember | null>(null);

  function cancel(): void {
    setSelected(null);
    onCancel();
  }

  return (
    <Modal transparent visible={visible} onRequestClose={cancel}>
      <View style={dialogStyles.backdrop}>
        <View style={dialogStyles.dialog}>
          {selected ? (
            <>
              <Text style={dialogStyles.title} accessibilityRole="header">
                Compartilhar paciente
              </Text>
              <Text style={dialogStyles.message}>
                {`Compartilhar ${patientName} com ${selected.name}? Ela(e) poderá ver e registrar sessões, evoluções, planos, avaliações e relatórios.`}
              </Text>
              {error ? (
                <Text style={dialogStyles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}
              <View style={dialogStyles.actions}>
                <DsButton
                  label="Voltar"
                  variant="secondary"
                  onPress={() => setSelected(null)}
                  disabled={loading}
                />
                <DsButton
                  label="Compartilhar"
                  loading={loading}
                  onPress={() => onConfirm(selected)}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={dialogStyles.title} accessibilityRole="header">
                Compartilhar com…
              </Text>
              {candidates.length === 0 ? (
                <Text style={dialogStyles.message}>
                  Ninguém mais na equipe. Convide em Recursos → Equipe e
                  convites.
                </Text>
              ) : (
                candidates.map((member) => (
                  <Pressable
                    key={member.educatorId}
                    accessibilityRole="button"
                    accessibilityLabel={`Compartilhar com ${member.name}`}
                    onPress={() => setSelected(member)}
                    style={styles.row}
                  >
                    <Avatar name={member.name} photoUrl={member.photoUrl} />
                    <View style={styles.copy}>
                      <Text style={styles.name}>{member.name}</Text>
                      <Text style={styles.detail}>
                        {teamRoleLabel(member.role)}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
              <View style={dialogStyles.actions}>
                <DsButton
                  label="Cancelar"
                  variant="secondary"
                  onPress={cancel}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  copy: { flex: 1, gap: 2 },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});
