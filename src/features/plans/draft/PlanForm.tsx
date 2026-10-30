import type { ReactElement, ReactNode } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { DsButton, Field, SectionTitle } from "@/components/ds";
import { color, typography, semanticColor } from "@/theme";

export const planFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(120),
  generalObjective: z.string().trim().min(1, "Informe o objetivo").max(2000),
  professionalNotes: z.string().max(2000),
  goals: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string().trim().min(1, "Informe a meta").max(500),
        successCriterion: z.string().max(500),
      }),
    )
    .min(1, "Inclua pelo menos uma meta")
    .max(10),
});
export type PlanFormValues = z.infer<typeof planFormSchema>;

export function toPlanFormGoals(
  goals: PlanFormValues["goals"],
): { id?: string; description: string; successCriterion?: string }[] {
  return goals.map((goal) => ({
    ...(goal.id ? { id: goal.id } : {}),
    description: goal.description.trim(),
    ...(goal.successCriterion.trim()
      ? { successCriterion: goal.successCriterion.trim() }
      : {}),
  }));
}

export function PlanForm({
  initial,
  onSubmit,
  submitLabel,
  submitting,
  children,
  onShare,
  protectedGoalIds = [],
}: {
  initial: PlanFormValues;
  onSubmit: (values: PlanFormValues) => void;
  submitLabel: string;
  submitting?: boolean;
  children?: ReactNode;
  onShare?: (values: PlanFormValues) => void;
  protectedGoalIds?: string[];
}): ReactElement {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: initial,
  });
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "goals",
  });
  return (
    <View style={styles.container}>
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
      {children}
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
            disabled={
              fields.length <= 1 ||
              protectedGoalIds.includes(getValues(`goals.${index}.id`) ?? "")
            }
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
      {onShare ? (
        <DsButton
          label="Compartilhar"
          variant="secondary"
          onPress={() => onShare(getValues())}
        />
      ) : null}
      <DsButton
        label={submitLabel}
        fullWidth
        loading={submitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  body: { ...typography.body, color: color.ink[950] },
  error: { ...typography.body, color: semanticColor.dangerTextOnSurface },
  goal: {
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
