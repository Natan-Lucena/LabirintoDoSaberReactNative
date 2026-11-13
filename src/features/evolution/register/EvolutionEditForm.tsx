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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Alert, BackHandler, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { z } from "zod";

import {
  evolutionQueryKeys,
  updateSessionEvolution,
} from "@/api/endpoints/evolution";
import { normalizeApiError, type ApiError } from "@/api/errors";
import { getPlan } from "@/api/endpoints/plans";
import type { GoalStatus, SessionEvolution } from "@/api/types";
import { AppHeader, DsButton } from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";
import { planQueryKeys } from "@/features/plans/hub/usePlans";
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

/**
 * Carrega o estado atual das metas do PE (para o seletor "Atualizar
 * prontuário") e abre o formulário. Se o plano não carregar, a edição segue
 * sem o seletor de metas.
 */
export function EvolutionEditForm(props: EvolutionEditFormProps): ReactElement {
  const { evolution } = props;
  const planId = evolution.planId;
  const planQuery = useQuery({
    queryKey: [...planQueryKeys.all, "detail", planId],
    queryFn: () => getPlan(planId!),
    enabled: Boolean(planId),
    retry: false,
  });

  if (planId && planQuery.isPending) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader title="Editar evolução" onBack={props.onCancel} />
        <Text style={styles.hint} accessibilityRole="progressbar">
          Carregando o plano...
        </Text>
      </SafeAreaView>
    );
  }

  const goalStatuses: Record<string, GoalStatus> | undefined = planQuery.data
    ? Object.fromEntries(
        planQuery.data.goals.map((goal) => [goal.id, goal.status]),
      )
    : undefined;

  return <EvolutionEditFormBody {...props} goalStatuses={goalStatuses} />;
}

function EvolutionEditFormBody({
  evolution,
  goalStatuses,
  onCancel,
  onSaved,
}: EvolutionEditFormProps & {
  goalStatuses: Record<string, GoalStatus> | undefined;
}): ReactElement {
  const navigation = useNavigation();
  const leavingRef = useRef(false);
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EvolutionFormValues, unknown, EvolutionFormOutput>({
    resolver: zodResolver(evolutionFormSchema),
    defaultValues: evolutionToFormValues(evolution, goalStatuses),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria",
  });
  const criteria = useWatch({ control, name: "criteria" }) ?? [];

  const mutation = useMutation({
    mutationFn: (values: EvolutionFormOutput) =>
      updateSessionEvolution(
        evolution.id,
        toUpdatePayload(values, Boolean(evolution.nextSessionSuggestion)),
      ),
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

  // Gestos e outras saídas da pilha passam pela mesma confirmação do botão voltar.
  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (leavingRef.current || !isDirty) return;
      event.preventDefault();
      Alert.alert(
        "Descartar as alterações?",
        "As alterações não salvas serão perdidas.",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              leavingRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });
  }, [isDirty, navigation]);

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
      // `goalUpdates` muda as metas do PE.
      void queryClient.invalidateQueries({ queryKey: planQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["task-notebook-session"],
      });
      leavingRef.current = true;
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
          sessionId={evolution.sessionId}
          showGoalStatus={Boolean(goalStatuses)}
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
  hint: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    padding: 20,
    textAlign: "center",
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
