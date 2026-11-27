import type { ReactElement } from "react";
import { Modal, Text, View } from "react-native";

import type { ClinicMember, TeamRole } from "@/api/types";
import { DsButton } from "@/components/ds";
import { dialogStyles } from "@/features/team/components/ConfirmDialog";

export interface ManageMemberDialogProps {
  member: ClinicMember | null;
  onChangeRole: (member: ClinicMember, role: TeamRole) => void;
  onRemove: (member: ClinicMember) => void;
  onClose: () => void;
}

/** Menu do membro (só ADMIN, nunca o próprio): troca de papel e remoção. */
export function ManageMemberDialog({
  member,
  onChangeRole,
  onRemove,
  onClose,
}: ManageMemberDialogProps): ReactElement {
  const otherRole: TeamRole =
    member?.role === "ADMIN" ? "PROFESSIONAL" : "ADMIN";
  return (
    <Modal transparent visible={member !== null} onRequestClose={onClose}>
      <View style={dialogStyles.backdrop}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.title}>{member?.name ?? ""}</Text>
          {member ? (
            <>
              <DsButton
                label={
                  otherRole === "ADMIN"
                    ? "Tornar administrador(a)"
                    : "Tornar profissional"
                }
                variant="secondary"
                onPress={() => onChangeRole(member, otherRole)}
                fullWidth
              />
              <DsButton
                label="Remover da equipe"
                variant="secondary"
                onPress={() => onRemove(member)}
                fullWidth
              />
            </>
          ) : null}
          <DsButton
            label="Fechar"
            variant="ghost"
            onPress={onClose}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}
