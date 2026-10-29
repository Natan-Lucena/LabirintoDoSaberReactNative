import { useEffect, useState, type ReactElement } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Share, StyleSheet, Text, View } from "react-native";
import {
  createPlan,
  PlanApiError,
  type GeneratePlanDraftInput,
} from "@/api/endpoints/plans";
import type { PlanDraft } from "@/api/types";
import {
  Badge,
  DsButton,
  SectionTitle,
  Toast,
  useToast,
} from "@/components/ds";
import {
  PlanForm,
  toPlanFormGoals,
  type PlanFormValues,
} from "@/features/plans/draft/PlanForm";
import { afterSavePlanRoute, planDetailRoute } from "@/features/plans/routes";
import { planQueryKeys } from "@/features/plans/hub/usePlans";
import { color, typography } from "@/theme";

export function DraftPreview({
  draft,
  input,
  onSaved,
}: {
  draft: PlanDraft;
  input: GeneratePlanDraftInput;
  onSaved: () => void;
}): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [savedId, setSavedId] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (values: PlanFormValues) =>
      createPlan({
        studentId: input.studentId,
        type: draft.type,
        source: "AI",
        title: values.title.trim(),
        generalObjective: values.generalObjective.trim(),
        ...(values.professionalNotes.trim()
          ? { professionalNotes: values.professionalNotes.trim() }
          : {}),
        focus: input.focus,
        consideredDifficulties: input.consideredDifficulties,
        ...(draft.type === "PDI"
          ? {
              startDate: draft.suggestedStartDate,
              endDate: draft.suggestedEndDate,
              ...(draft.suggestedNextReviewDate
                ? { nextReviewDate: draft.suggestedNextReviewDate }
                : {}),
            }
          : {
              sessionDate: input.sessionDate ?? draft.suggestedStartDate,
              ...(input.parentPlanId
                ? { parentPlanId: input.parentPlanId }
                : {}),
            }),
        goals: toPlanFormGoals(values.goals).map(
          ({ description, successCriterion }) => ({
            description,
            ...(successCriterion ? { successCriterion } : {}),
          }),
        ),
      }),
    retry: false,
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({ queryKey: planQueryKeys.all });
      onSaved();
      setSavedId(plan.id);
      toast.show("Plano salvo");
    },
  });
  useEffect(() => {
    if (!savedId) return;
    const timer = setTimeout(
      () => router.replace(afterSavePlanRoute(savedId)),
      700,
    );
    return () => clearTimeout(timer);
  }, [router, savedId]);
  const conflict =
    save.error instanceof PlanApiError &&
    save.error.code === "ACTIVE_PDI_ALREADY_EXISTS"
      ? save.error
      : null;
  const code = (save.error as { code?: string } | null)?.code;
  const validation =
    code &&
    [
      "PLAN_WITHOUT_GOALS",
      "TOO_MANY_GOALS",
      "SESSION_DATE_REQUIRED",
      "INVALID_FIELDS_FOR_PDI",
      "INVALID_DATES",
      "INVALID_PARENT_PLAN",
      "INVALID_APPOINTMENT",
      "Bad Request",
    ].includes(code);
  const initial: PlanFormValues = {
    title: draft.title,
    generalObjective: draft.generalObjective,
    professionalNotes: "",
    goals: draft.goals.map((goal) => ({
      description: goal.description,
      successCriterion: goal.successCriterion ?? "",
    })),
  };
  return (
    <View style={styles.container}>
      <Badge label="Rascunho não salvo" />
      <Badge label="Editável" />
      <PlanForm
        initial={initial}
        submitLabel={`Salvar ${draft.type}`}
        submitting={save.isPending}
        onSubmit={(values) => save.mutate(values)}
        onShare={(values) => {
          void Share.share({
            message: [
              values.title,
              values.generalObjective,
              "Metas:",
              ...values.goals.map(
                (goal, index) => `${index + 1}. ${goal.description}`,
              ),
            ].join("\n"),
          });
        }}
      >
        <Text style={styles.meta}>
          Início sugerido: {draft.suggestedStartDate}
        </Text>
        <Text style={styles.meta}>Fim sugerido: {draft.suggestedEndDate}</Text>
        {draft.suggestedNextReviewDate ? (
          <Text style={styles.meta}>
            Próxima revisão sugerida: {draft.suggestedNextReviewDate}
          </Text>
        ) : null}
        {draft.rationale ? (
          <>
            <SectionTitle title="Por que essas metas" />
            <Text style={styles.body}>{draft.rationale}</Text>
          </>
        ) : null}
      </PlanForm>
      {conflict ? (
        <View style={styles.block}>
          <Text style={styles.error} accessibilityRole="alert">
            Este paciente já tem um PDI ativo.
          </Text>
          {conflict.activePlanId ? (
            <DsButton
              label="Ver PDI ativo"
              variant="secondary"
              onPress={() =>
                router.push(planDetailRoute(conflict.activePlanId!))
              }
            />
          ) : null}
        </View>
      ) : save.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {validation
            ? "Revise os campos e as datas do plano."
            : "Não foi possível salvar o plano. Tente novamente."}
        </Text>
      ) : null}
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
  },
  body: { ...typography.body, color: color.ink[950] },
  meta: { ...typography.tag, color: color.textSecondary },
  error: { ...typography.body, color: color.danger },
  block: { gap: 8 },
});
