// EVO-04 — Sugestão da IA para a próxima sessão. A geração não persiste: o
// texto vai para o campo editável e o que estiver nele é salvo em
// `nextSessionSuggestion`. Sem reenvio automático (G-46): só "Tentar novamente".
import type { ReactElement } from "react";
import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { generateNextSessionSuggestion } from "@/api/endpoints/evolution";
import { normalizeApiError } from "@/api/errors";
import { AIContext, DsButton, Field, SectionTitle } from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";
import { MAX_SUGGESTION } from "./schema";

function generationErrorMessage(caught: unknown): string {
  const error = normalizeApiError(caught);
  if (error.isNetworkError || error.isTimeout) {
    return "Sem resposta da IA. Verifique a conexão e tente novamente.";
  }
  return "Não foi possível gerar a sugestão. Tente novamente.";
}

export interface NextSessionSuggestionBlockProps {
  sessionId: string;
  /** Texto atual do campo (o que será salvo). */
  value: string;
  onChange: (value: string) => void;
  /** Registro descritivo já escrito, enviado como contexto à IA. */
  descriptiveRecord: string;
  disabled?: boolean;
  error?: string;
}

export function NextSessionSuggestionBlock({
  sessionId,
  value,
  onChange,
  descriptiveRecord,
  disabled = false,
  error,
}: NextSessionSuggestionBlockProps): ReactElement {
  const mutation = useMutation({
    mutationFn: generateNextSessionSuggestion,
    retry: false,
  });
  const generating = mutation.isPending;
  const record = descriptiveRecord.trim();

  function generate(): void {
    if (generating) return;
    mutation.mutate(
      { sessionId, ...(record ? { descriptiveRecord: record } : {}) },
      { onSuccess: (data) => onChange(data.suggestion) },
    );
  }

  return (
    <View style={styles.block}>
      <SectionTitle title="Sugestão para a próxima sessão" />
      <AIContext text="A IA sugere um foco para a próxima sessão com base nesta sessão e nas últimas evoluções. Revise e edite antes de salvar." />
      {generating ? (
        <Text style={styles.hint} accessibilityRole="progressbar">
          Gerando a sugestão... isso pode levar cerca de 30 segundos.
        </Text>
      ) : null}
      {mutation.isError ? (
        <Text style={styles.error} accessibilityRole="alert" accessible>
          {generationErrorMessage(mutation.error)}
        </Text>
      ) : null}
      {mutation.isSuccess && mutation.data.rationale ? (
        <Text style={styles.caption}>{mutation.data.rationale}</Text>
      ) : null}
      <Field
        label="Sugestão para a próxima sessão"
        accessibilityLabel="Texto da sugestão para a próxima sessão"
        placeholder="Escreva ou gere uma sugestão (opcional)."
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={MAX_SUGGESTION}
        error={error}
      />
      <DsButton
        label={mutation.isError ? "Tentar novamente" : "Gerar sugestão"}
        variant="soft"
        icon="sparkles"
        loading={generating}
        disabled={disabled || generating}
        onPress={generate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
  caption: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
    color: color.ink[600],
  },
  hint: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
