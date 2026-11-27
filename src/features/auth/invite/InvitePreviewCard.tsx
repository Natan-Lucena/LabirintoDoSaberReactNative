import type { ReactElement, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { InvitePreview } from "@/api/types";
import { formatInviteExpiry } from "@/features/auth/invite/format";
import { teamRoleLabel } from "@/features/team/roles";
import { color, typography } from "@/theme";

const styles = StyleSheet.create({
  container: { gap: 16 },
  text: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.ink[950],
  },
  bold: { fontWeight: "700" },
  actions: { gap: 12 },
});

export interface InvitePreviewCardProps {
  preview: InvitePreview;
  /** Botões de ação (variam entre o cadastro e o perfil). */
  children: ReactNode;
}

/** "Você foi convidada(o) para a equipe X como Y. Vale até dd/mm." */
export function InvitePreviewCard({
  preview,
  children,
}: InvitePreviewCardProps): ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Você foi convidada(o) para a equipe{" "}
        <Text style={styles.bold}>{preview.clinicName}</Text> como{" "}
        <Text style={styles.bold}>{teamRoleLabel(preview.role)}</Text>. Vale até{" "}
        {formatInviteExpiry(preview.expiresAt)}.
      </Text>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}
