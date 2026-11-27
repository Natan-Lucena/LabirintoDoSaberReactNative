import { useState, type ReactElement } from "react";
import { Share, StyleSheet, Text, View } from "react-native";

import type { ClinicInvite, TeamRole } from "@/api/types";
import { DsButton, SegmentedControl } from "@/components/ds";
import { teamErrorMessage } from "@/features/team/messages";
import { TEAM_ROLE_LABEL } from "@/features/team/roles";
import { useCreateInvite } from "@/features/team/useClinic";
import { color, fontFamilies, shape } from "@/theme";
import { TIME_ZONE } from "@/utils/date";

export interface InviteCardProps {
  onMessage: (message: string) => void;
}

const roleOptions = [
  { key: "PROFESSIONAL", label: TEAM_ROLE_LABEL.PROFESSIONAL },
  { key: "ADMIN", label: TEAM_ROLE_LABEL.ADMIN },
];

const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    backgroundColor: color.surface,
    borderRadius: shape.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
  code: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 4,
    textAlign: "center",
    fontFamily: fontFamilies.robotoMono.bold ?? fontFamilies.robotoMono.regular,
    color: color.ink[950],
  },
  validity: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function InviteCard({ onMessage }: InviteCardProps): ReactElement {
  const create = useCreateInvite();
  const [role, setRole] = useState<TeamRole>("PROFESSIONAL");
  const [invite, setInvite] = useState<ClinicInvite | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function share(target: ClinicInvite) {
    try {
      await Share.share({ message: target.shareMessage });
    } catch {
      onMessage("Não foi possível abrir o compartilhamento.");
    }
  }

  function createAndShare() {
    setError(null);
    create.mutate(
      { role },
      {
        onSuccess: (created) => {
          setInvite(created);
          void share(created);
        },
        onError: (failure) => setError(teamErrorMessage(failure)),
      },
    );
  }

  if (invite) {
    const code = invite.code;
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Convite criado</Text>
        <Text
          style={styles.code}
          selectable
          accessibilityLabel={`Código do convite: ${code.split("").join(" ")}`}
        >
          {code}
        </Text>
        <Text style={styles.validity}>
          {`Vale até ${DAY_MONTH.format(new Date(invite.expiresAt))}`}
        </Text>
        <DsButton
          label="Compartilhar de novo"
          onPress={() => void share(invite)}
          fullWidth
        />
        <DsButton
          label="Novo convite"
          variant="secondary"
          onPress={() => {
            setInvite(null);
            setError(null);
          }}
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Convide um profissional</Text>
      <SegmentedControl
        options={roleOptions}
        value={role}
        onChange={(key) => setRole(key as TeamRole)}
        accessibilityLabel="Papel do convidado"
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <DsButton
        label="Compartilhar convite"
        onPress={createAndShare}
        loading={create.isPending}
        fullWidth
      />
    </View>
  );
}
