import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ClinicMember } from "@/api/types";
import { Avatar, Badge, DsButton } from "@/components/ds";
import { teamRoleLabel } from "@/features/team/roles";
import { color, fontFamilies } from "@/theme";

export interface MemberRowProps {
  member: ClinicMember;
  isMe: boolean;
  /** Só para quem pode gerir a equipe, e nunca no próprio item. */
  onManage?: () => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
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

export function MemberRow({
  member,
  isMe,
  onManage,
}: MemberRowProps): ReactElement {
  const role = teamRoleLabel(member.role);
  const detail = member.profession ? `${member.profession} · ${role}` : role;
  return (
    <View style={styles.row}>
      <Avatar name={member.name} photoUrl={member.photoUrl} />
      <View style={styles.copy}>
        <Text style={styles.name}>
          {isMe ? `${member.name} (você)` : member.name}
        </Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {onManage ? (
        <DsButton
          label="Gerenciar"
          variant="ghost"
          accessibilityLabel={`Gerenciar ${member.name}`}
          onPress={onManage}
        />
      ) : (
        <Badge label="Ativo" />
      )}
    </View>
  );
}
