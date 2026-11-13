// EVO-02 — edição de uma evolução já registrada: reabre o formulário da EVO-01
// preenchido (mesmas seções) e salva com `PUT /session-evolution/:id`, que leva
// a lista COMPLETA de critérios (EV-09). Não mexe no fluxo de sessão.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Alert, BackHandler, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { z } from "zod";

import {
  evolutionQueryKeys,
  updateSessionEvolution,
} from "@/api/endpoints/evolution";
import { normalizeApiError, type ApiError } from "@/api/errors";
import type { SessionEvolution } from "@/api/types";
import { AppHeader, DsButton } from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";
import { EvolutionFormSections } from "./EvolutionFormSections";
import {
  evolutionFormSchema,
  evolutionToFormValues,
  toUpdatePayload,
  type EvolutionFormValues,
} from "./schema";

type EvolutionFormOutput = z.output<typeof evolutionFormSchema>;

/** Códigos que a API traduz em `normalizeApiError` (mensagem já em português). */
const TRANSLATED_SAVE_CODES = new Set([
  "INVALID_ATTEMPTS",
  "GOAL_NOT_IN_PLAN",
  "PLAN_NOT_EDITABLE",
]);

function saveErrorMessage(error: ApiError): string {
  if (error.status === 404) {
    return "Evolução não encontrada. Ela pode ter sido removida.";
  }
  if (error.status === 403) {
    return "Você não tem acesso a esta evolução.";
  }
  if (error.code && TRANSLATED_SAVE_CODES.has(error.code)) {
    return error.message;
  }
  if (error.isNetworkError || error.isTimeout) {
    return "Não foi possível confirmar a alteração. Verifique a conexão e tente novamente.";
  }
  return "Não foi possível salvar a evolução. Tente novamente.";
}

export interface EvolutionEditFormProps {
  evolution: SessionEvolution;
  onCancel: () => void;
  onSaved: (updated: SessionEvolution) => void;
}

export function EvolutionEditForm({
  evolution,
  onCancel,
  onSaved,
}: EvolutionEditFormProps): ReactElement {
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EvolutionFormValues, unknown, EvolutionFormOutput>({
    resolver: zodResolver(evolutionFormSchema),
    defaultValues: evolutionToFormValues(evolution),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria",
  });
  const criteria = useWatch({ control, name: "criteria" }) ?? [];

  const mutation = useMutation({
    mutationFn: (values: EvolutionFormOutput) =>
      updateSessionEvolution(evolution.id, toUpdatePayload(values)),
    retry: false,
  });
  const saving = mutation.isPending;

  const requestCancel = useCallback((): void => {
    if (!isDirty) {
      onCancel();
      return;
    }
    Alert.alert(
      "Descartar as alterações?",
      "As alterações não salvas serão perdidas.",
      [
        { text: "Continuar editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: onCancel },
      ],
    );
  }, [isDirty, onCancel]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        requestCancel();
        return true;
      },
    );
    return () => subscription.remove();
  }, [requestCancel]);

  async function save(values: EvolutionFormOutput): Promise<void> {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveError(null);
    try {
      const updated = await mutation.mutateAsync(values);
      // Prontuário, hub, ficha do paciente e relatório da sessão (EV-08).
      queryClient.setQueryData(
        evolutionQueryKeys.detail(evolution.id),
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: evolutionQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["task-notebook-session"],
      });
      onSaved(updated);
    } catch (caught) {
      setSaveError(saveErrorMessage(normalizeApiError(caught)));
    } finally {
      savingRef.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Editar evolução"
        subtitle={evolution.planTitle}
        onBack={requestCancel}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <EvolutionFormSections
          control={control}
          fields={fields}
          criteria={criteria}
          errors={errors}
          append={append}
          remove={remove}
          saving={saving}
          showCriteria={Boolean(evolution.planId) || fields.length > 0}
          showGoalStatus={false}
        />
        {saveError ? (
          <Text style={styles.error} accessibilityRole="alert" accessible>
            {saveError}
          </Text>
        ) : null}
        <DsButton
          label="Salvar alterações"
          fullWidth
          loading={saving}
          disabled={saving}
          onPress={() => void handleSubmit(save)()}
        />
        <DsButton
          label="Cancelar"
          variant="ghost"
          fullWidth
          disabled={saving}
          onPress={requestCancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16 },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
