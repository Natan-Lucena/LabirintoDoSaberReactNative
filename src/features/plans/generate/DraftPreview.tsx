import { useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Share, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import {
  createPlan,
  PlanApiError,
  type GeneratePlanDraftInput,
} from "@/api/endpoints/plans";
import type { PlanDraft } from "@/api/types";
import {
  Badge,
  DsButton,
  Field,
  SectionTitle,
  Toast,
  useToast,
} from "@/components/ds";
import { afterSavePlanRoute, planDetailRoute } from "@/features/plans/routes";
import { planQueryKeys } from "@/features/plans/hub/usePlans";
import { color, typography } from "@/theme";

const schema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(120),
  generalObjective: z.string().trim().min(1, "Informe o objetivo").max(2000),
  professionalNotes: z.string().max(2000),
  goals: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Informe a meta").max(500),
        successCriterion: z.string().max(500),
      }),
    )
    .min(1, "Inclua pelo menos uma meta")
    .max(10),
});
type Values = z.infer<typeof schema>;

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
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: draft.title,
      generalObjective: draft.generalObjective,
      professionalNotes: "",
      goals: draft.goals.map((goal) => ({
        description: goal.description,
        successCriterion: goal.successCriterion ?? "",
      })),
    },
  });
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "goals",
  });
  const save = useMutation({
    mutationFn: (values: Values) =>
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
        goals: values.goals.map((goal) => ({
          description: goal.description.trim(),
          ...(goal.successCriterion.trim()
            ? { successCriterion: goal.successCriterion.trim() }
            : {}),
        })),
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
  async function share(): Promise<void> {
    const values = getValues();
    await Share.share({
      message: [
        values.title,
        values.generalObjective,
        "Metas:",
        ...values.goals.map(
          (goal, index) => `${index + 1}. ${goal.description}`,
        ),
      ].join("\n"),
    });
  }
  return (
    <View style={styles.container}>
      <Badge label="Rascunho não salvo" />
      <Badge label="Editável" />
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <Field
            label="Título"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={120}
            error={errors.title?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="generalObjective"
        render={({ field }) => (
          <Field
            label="Objetivo geral"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
            maxLength={2000}
            error={errors.generalObjective?.message}
          />
        )}
      />
      <Text style={styles.meta}>
        Início sugerido: {draft.suggestedStartDate}
      </Text>
      <Text style={styles.meta}>Fim sugerido: {draft.suggestedEndDate}</Text>
      {draft.suggestedNextReviewDate ? (
        <Text style={styles.meta}>
          Próxima revisão sugerida: {draft.suggestedNextReviewDate}
        </Text>
      ) : null}
      <SectionTitle title="Metas prioritárias" />
      {fields.map((goal, index) => (
        <View style={styles.goal} key={goal.id}>
          <Text style={styles.body}>Meta {index + 1}</Text>
          <Controller
            control={control}
            name={`goals.${index}.description`}
            render={({ field }) => (
              <Field
                label={`Descrição da meta ${index + 1}`}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                maxLength={500}
                error={errors.goals?.[index]?.description?.message}
              />
            )}
          />
          <Controller
            control={control}
            name={`goals.${index}.successCriterion`}
            render={({ field }) => (
              <Field
                label={`Critério de sucesso da meta ${index + 1}`}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                maxLength={500}
                error={errors.goals?.[index]?.successCriterion?.message}
              />
            )}
          />
          <View style={styles.row}>
            <DsButton
              label={`Subir meta ${index + 1}`}
              variant="secondary"
              disabled={index === 0}
              onPress={() => swap(index, index - 1)}
            />
            <DsButton
              label={`Descer meta ${index + 1}`}
              variant="secondary"
              disabled={index === fields.length - 1}
              onPress={() => swap(index, index + 1)}
            />
          </View>
          <DsButton
            label={`Remover meta ${index + 1}`}
            variant="ghost"
            disabled={fields.length <= 1}
            onPress={() => remove(index)}
          />
        </View>
      ))}
      {errors.goals?.message ? (
        <Text style={styles.error} accessibilityRole="alert">
          {errors.goals.message}
        </Text>
      ) : null}
      <DsButton
        label="Adicionar meta"
        variant="soft"
        disabled={fields.length >= 10}
        onPress={() => append({ description: "", successCriterion: "" })}
      />
      <Controller
        control={control}
        name="professionalNotes"
        render={({ field }) => (
          <Field
            label="Ajustes do profissional"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
            maxLength={2000}
            error={errors.professionalNotes?.message}
          />
        )}
      />
      {draft.rationale ? (
        <>
          <SectionTitle title="Por que essas metas" />
          <Text style={styles.body}>{draft.rationale}</Text>
        </>
      ) : null}
      {conflict ? (
        <View style={styles.goal}>
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
      <DsButton
        label="Compartilhar"
        variant="secondary"
        onPress={() => {
          void share();
        }}
      />
      <DsButton
        label={`Salvar ${draft.type}`}
        fullWidth
        loading={save.isPending}
        onPress={handleSubmit((values) => save.mutate(values))}
      />
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
  goal: {
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
