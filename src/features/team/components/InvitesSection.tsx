import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ClinicInvite } from "@/api/types";
import { DsButton, SectionTitle } from "@/components/ds";
import { ConfirmDialog } from "@/features/team/components/ConfirmDialog";
import { teamErrorMessage } from "@/features/team/messages";
import { teamRoleLabel } from "@/features/team/roles";
import { useClinicInvites, useRevokeInvite } from "@/features/team/useClinic";
import { color, fontFamilies } from "@/theme";
import { TIME_ZONE } from "@/utils/date";

export interface InvitesSectionProps {
  onMessage: (message: string) => void;
}

const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});

const styles = StyleSheet.create({
  group: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  copy: { flex: 1, gap: 2 },
  code: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 2,
    fontFamily: fontFamilies.robotoMono.bold ?? fontFamilies.robotoMono.regular,
    color: color.ink[950],
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  state: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

/** Convites ativos da clínica, com "Revogar" (só ADMIN; EQP-02 §3). */
export function InvitesSection({
  onMessage,
}: InvitesSectionProps): ReactElement {
  const query = useClinicInvites(true);
  const revoke = useRevokeInvite();
  const [target, setTarget] = useState<ClinicInvite | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setTarget(null);
    setError(null);
  }

  function confirm() {
    if (!target) return;
    setError(null);
    revoke.mutate(target.id, {
      onSuccess: () => {
        close();
        onMessage("Convite revogado");
      },
      onError: (failure) => setError(teamErrorMessage(failure)),
    });
  }

  let content: ReactElement;
  if (query.isPending) {
    content = <Text style={styles.state}>Carregando convites</Text>;
  } else if (query.isError && query.data === undefined) {
    content = (
      <View style={styles.group}>
        <Text style={styles.state}>Não foi possível carregar os convites.</Text>
        <DsButton
          label="Tentar de novo"
          variant="secondary"
          onPress={() => void query.refetch()}
        />
      </View>
    );
  } else if (!query.data || query.data.length === 0) {
    content = <Text style={styles.state}>Nenhum convite ativo</Text>;
  } else {
    content = (
      <View>
        {query.data.map((invite) => (
          <View key={invite.id} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.code} selectable>
                {invite.code}
              </Text>
              <Text style={styles.detail}>
                {`${teamRoleLabel(invite.role)} · Vale até ${DAY_MONTH.format(new Date(invite.expiresAt))}`}
              </Text>
            </View>
            <DsButton
              label="Revogar"
              variant="ghost"
              accessibilityLabel={`Revogar o convite ${invite.code}`}
              onPress={() => setTarget(invite)}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.group}>
      <SectionTitle title="Convites ativos" />
      {content}
      <ConfirmDialog
        visible={target !== null}
        title={`Revogar o convite ${target?.code ?? ""}?`}
        message="Quem recebeu não conseguirá mais usá-lo."
        confirmLabel="Revogar"
        loading={revoke.isPending}
        error={error}
        onConfirm={confirm}
        onCancel={close}
      />
    </View>
  );
}
