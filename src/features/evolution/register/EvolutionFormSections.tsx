// Seções do formulário da Evolução da sessão (EVO-01), compartilhadas entre o
// registro e a edição do prontuário (EVO-02): critérios, estado das metas e
// registro descritivo.
import { useRef, type ReactElement } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import type { z } from "zod";

import { DsButton, Field, SectionTitle, SelectField } from "@/components/ds";
import { color, fontFamilies, semanticColor, shape, typography } from "@/theme";
import {
  attemptsLabel,
  CRITERION_RESULTS,
  criterionResultLabels,
  emptyCriterion,
  evolutionFormSchema,
  GOAL_STATUSES,
  goalStatusLabels,
  MAX_COUNT,
  MAX_CRITERIA,
  MAX_RECORD,
  MAX_TEXT,
  type EvolutionCriterionValues,
  type EvolutionFormValues,
} from "./schema";
import { NextSessionSuggestionBlock } from "./NextSessionSuggestionBlock";
import type { ErrorAnchor } from "./useScrollToFirstError";

const resultOptions = CRITERION_RESULTS.map((value) => ({
  value,
  label: criterionResultLabels[value],
}));
const goalStatusOptions = GOAL_STATUSES.map((value) => ({
  value,
  label: goalStatusLabels[value],
}));

export interface EvolutionFormSectionsProps {
  control: Control<
    EvolutionFormValues,
    unknown,
    z.output<typeof evolutionFormSchema>
  >;
  fields: FieldArrayWithId<EvolutionFormValues, "criteria">[];
  criteria: EvolutionCriterionValues[];
  errors: FieldErrors<EvolutionFormValues>;
  append: UseFieldArrayAppend<EvolutionFormValues, "criteria">;
  remove: UseFieldArrayRemove;
  saving: boolean;
  /** Sem PE (G-57) não há critérios, só o registro descritivo. */
  showCriteria: boolean;
  /** "Atualizar prontuário": estado das metas, só no registro (EVO-01). */
  showGoalStatus: boolean;
  /** Sessão da evolução, usada na sugestão da IA (EVO-04). */
  sessionId: string;
  /** Posição dos blocos no scroll, para rolar até o primeiro erro (EVO-01.4). */
  onAnchor?: (anchor: ErrorAnchor, y: number) => void;
}

export function EvolutionFormSections({
  control,
  fields,
  criteria,
  errors,
  append,
  remove,
  saving,
  showCriteria,
  showGoalStatus,
  sessionId,
  onAnchor,
}: EvolutionFormSectionsProps): ReactElement {
  const goalCriteria = fields
    .map((field, index) => ({ field, index }))
    .filter(({ index }) => Boolean(criteria[index]?.goalId));

  const criteriaBlockY = useRef(0);

  const descriptiveRecord = useWatch({ control, name: "descriptiveRecord" });

  return (
    <>
      {showCriteria ? (
        <View
          style={styles.block}
          onLayout={(event) => {
            criteriaBlockY.current = event.nativeEvent.layout.y;
            onAnchor?.("criteria", event.nativeEvent.layout.y);
          }}
        >
          <SectionTitle title="Critérios da sessão" />
          {fields.length === 0 ? (
            <Text style={styles.hint}>
              Nenhum critério nesta evolução. Inclua um critério livre, se
              quiser.
            </Text>
          ) : null}
          {fields.map((field, index) => {
            const number = index + 1;
            const current = criteria[index];
            const fieldErrors = errors.criteria?.[index];
            const detail = current
              ? attemptsLabel(current.attempts, current.successes)
              : null;
            return (
              <View
                key={field.id}
                style={styles.card}
                onLayout={(event) =>
                  onAnchor?.(
                    `criteria.${index}`,
                    criteriaBlockY.current + event.nativeEvent.layout.y,
                  )
                }
              >
                {current?.goalId ? (
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{current.description}</Text>
                    {current.successCriterion ? (
                      <Text style={styles.caption}>
                        Critério de sucesso: {current.successCriterion}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Controller
                    control={control}
                    name={`criteria.${index}.description`}
                    render={({ field: input }) => (
                      <Field
                        label={`Critério ${number}`}
                        accessibilityLabel={`Descrição do critério ${number}`}
                        placeholder="Descreva o critério observado"
                        value={input.value}
                        onChangeText={input.onChange}
                        onBlur={input.onBlur}
                        maxLength={MAX_TEXT}
                        error={fieldErrors?.description?.message}
                      />
                    )}
                  />
                )}
                <Controller
                  control={control}
                  name={`criteria.${index}.result`}
                  render={({ field: input }) => (
                    <SelectField
                      label="Resultado"
                      accessibilityLabel={`Resultado do critério ${number}`}
                      value={input.value}
                      options={resultOptions}
                      onChange={input.onChange}
                      error={fieldErrors?.result?.message}
                    />
                  )}
                />
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Controller
                      control={control}
                      name={`criteria.${index}.attempts`}
                      render={({ field: input }) => (
                        <Field
                          label="Tentativas"
                          accessibilityLabel={`Tentativas do critério ${number}`}
                          placeholder="Opcional"
                          keyboardType="number-pad"
                          value={input.value}
                          onChangeText={input.onChange}
                          onBlur={input.onBlur}
                          maxLength={String(MAX_COUNT).length}
                          error={fieldErrors?.attempts?.message}
                        />
                      )}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <Controller
                      control={control}
                      name={`criteria.${index}.successes`}
                      render={({ field: input }) => (
                        <Field
                          label="Acertos"
                          accessibilityLabel={`Acertos do critério ${number}`}
                          placeholder="Opcional"
                          keyboardType="number-pad"
                          value={input.value}
                          onChangeText={input.onChange}
                          onBlur={input.onBlur}
                          maxLength={String(MAX_COUNT).length}
                          error={fieldErrors?.successes?.message}
                        />
                      )}
                    />
                  </View>
                </View>
                {detail ? <Text style={styles.detail}>{detail}</Text> : null}
                <Controller
                  control={control}
                  name={`criteria.${index}.note`}
                  render={({ field: input }) => (
                    <Field
                      label="Nota"
                      accessibilityLabel={`Nota do critério ${number}`}
                      placeholder="Opcional"
                      value={input.value}
                      onChangeText={input.onChange}
                      onBlur={input.onBlur}
                      maxLength={MAX_TEXT}
                      error={fieldErrors?.note?.message}
                    />
                  )}
                />
                <DsButton
                  label={`Remover critério ${number}`}
                  variant="ghost"
                  disabled={saving}
                  onPress={() => remove(index)}
                />
              </View>
            );
          })}
          {errors.criteria?.message ? (
            <Text style={styles.error} accessibilityRole="alert">
              {errors.criteria.message}
            </Text>
          ) : null}
          <DsButton
            label="Incluir critério livre"
            variant="soft"
            icon="plus"
            disabled={saving || fields.length >= MAX_CRITERIA}
            onPress={() => append(emptyCriterion())}
          />
        </View>
      ) : null}

      {showGoalStatus && goalCriteria.length > 0 ? (
        <View style={styles.block}>
          <SectionTitle title="Atualizar prontuário" />
          <Text style={styles.caption}>
            Ao salvar, o estado das metas do PE muda junto com a evolução.
          </Text>
          {goalCriteria.map(({ field, index }) => {
            const description = criteria[index]?.description ?? "";
            return (
              <Controller
                key={field.id}
                control={control}
                name={`criteria.${index}.goalStatus`}
                render={({ field: input }) => (
                  <SelectField
                    label={description}
                    accessibilityLabel={`Estado da meta: ${description}`}
                    value={input.value ?? null}
                    options={goalStatusOptions}
                    onChange={input.onChange}
                  />
                )}
              />
            );
          })}
        </View>
      ) : null}

      <View
        style={styles.block}
        onLayout={(event) => onAnchor?.("record", event.nativeEvent.layout.y)}
      >
        <SectionTitle title="Registro descritivo" />
        <Controller
          control={control}
          name="descriptiveRecord"
          render={({ field: input }) => (
            <Field
              label="Registro descritivo"
              placeholder="Como foi a sessão? Observações importantes para o prontuário."
              value={input.value}
              onChangeText={input.onChange}
              onBlur={input.onBlur}
              multiline
              maxLength={MAX_RECORD}
              error={errors.descriptiveRecord?.message}
            />
          )}
        />
      </View>

      <View
        onLayout={(event) => onAnchor?.("next", event.nativeEvent.layout.y)}
      >
        <Controller
          control={control}
          name="nextSessionSuggestion"
          render={({ field: input }) => (
            <NextSessionSuggestionBlock
              sessionId={sessionId}
              value={input.value ?? ""}
              onChange={input.onChange}
              descriptiveRecord={descriptiveRecord ?? ""}
              disabled={saving}
              error={errors.nextSessionSuggestion?.message}
            />
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
  card: {
    gap: 12,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  cardHeader: { gap: 4 },
  cardTitle: {
    ...typography.cardTitle,
    color: color.text,
  },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  detail: {
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
    color: color.brand[700],
  },
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
    textAlign: "center",
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
