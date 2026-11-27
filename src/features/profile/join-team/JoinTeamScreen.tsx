import { useState, type ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { acceptClinicInvite, clinicQueryKeys } from "@/api/endpoints/clinic";
import type { InvitePreview } from "@/api/types";
import { AppHeader, DsButton } from "@/components/ds";
import { InviteCodeStep } from "@/features/auth/invite/InviteCodeStep";
import { InvitePreviewCard } from "@/features/auth/invite/InvitePreviewCard";
import { inviteErrorMessage } from "@/features/auth/invite/messages";
import { homeQueryKeys } from "@/features/home/useHomeData";
import { setTeamNotice } from "@/features/team/notice";
import { color, semanticColor, typography } from "@/theme";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  hint: { ...typography.body, color: color.textSecondary },
  error: { ...typography.body, color: semanticColor.dangerTextOnSurface },
});

interface Confirmed {
  code: string;
  preview: InvitePreview;
}

/** Perfil -> "Entrar numa equipe": código, prévia e `POST /clinic/invites/accept`. */
export function JoinTeamScreen(): ReactElement {
  const router = useRouter();
  const client = useQueryClient();
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(item: Confirmed) {
    setJoining(true);
    setError(null);
    try {
      const view = await acceptClinicInvite({ code: item.code });
      client.setQueryData(clinicQueryKeys.view, view);
      await Promise.all([
        client.invalidateQueries({ queryKey: homeQueryKeys.educator }),
        client.invalidateQueries({ queryKey: ["student"] }),
      ]);
      setTeamNotice(`Você entrou na equipe ${view.clinic.name}`);
      router.replace("/team");
    } catch (caught) {
      setError(inviteErrorMessage(caught));
    } finally {
      setJoining(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <AppHeader title="Entrar numa equipe" onBack={router.back} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {confirmed ? (
          <InvitePreviewCard preview={confirmed.preview}>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            <DsButton
              label="Entrar na equipe"
              onPress={() => void join(confirmed)}
              loading={joining}
              disabled={joining}
              fullWidth
            />
            <DsButton
              label="Usar outro código"
              variant="secondary"
              onPress={() => {
                setConfirmed(null);
                setError(null);
              }}
              disabled={joining}
              fullWidth
            />
          </InvitePreviewCard>
        ) : (
          <View style={{ gap: 16 }}>
            <Text style={styles.hint}>
              Digite o código que você recebeu de quem administra a equipe.
            </Text>
            <InviteCodeStep
              onPreview={(code, preview) => setConfirmed({ code, preview })}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
