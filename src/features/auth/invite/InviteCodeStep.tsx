import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getInvitePreview } from "@/api/endpoints/clinic";
import type { InvitePreview } from "@/api/types";
import { DsButton, Field } from "@/components/ds";
import {
  INVITE_CODE_LENGTH,
  isValidInviteCode,
  normalizeInviteCode,
} from "@/features/auth/invite/code";
import {
  INVITE_CODE_FORMAT_MESSAGE,
  inviteErrorMessage,
} from "@/features/auth/invite/messages";
import { semanticColor, typography } from "@/theme";

const styles = StyleSheet.create({
  container: { gap: 16 },
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: semanticColor.dangerTextOnSurface,
  },
});

export interface InviteCodeStepProps {
  /** Prévia `200`: o código já normalizado e a clínica/papel. */
  onPreview: (code: string, preview: InvitePreview) => void;
  /** Erro vindo de outra tela (ex.: convite recusado no cadastro). */
  initialError?: string | null;
}

/** Campo do código + prévia pública, compartilhado pelo cadastro e pelo perfil. */
export function InviteCodeStep({
  onPreview,
  initialError = null,
}: InviteCodeStepProps): ReactElement {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!isValidInviteCode(code)) {
      setError(INVITE_CODE_FORMAT_MESSAGE);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizeInviteCode(code);
      const preview = await getInvitePreview(normalized);
      onPreview(normalized, preview);
    } catch (caught) {
      setError(inviteErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Field
        label="Código do convite"
        value={code}
        onChangeText={(text) =>
          setCode(normalizeInviteCode(text).slice(0, INVITE_CODE_LENGTH))
        }
        accessibilityLabel="Código do convite"
        placeholder="Ex.: AB3K7MPQ"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      <DsButton
        label="Continuar"
        onPress={() => void submit()}
        loading={loading}
        disabled={loading || code.length !== INVITE_CODE_LENGTH}
        fullWidth
      />
    </View>
  );
}
