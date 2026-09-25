import type { ReactElement } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";

import {
  createTask,
  type CreateTaskAlternativeInput,
} from "@/api/endpoints/task-create";
import { withOfflineGuard } from "@/api/query-client";
import type { TaskCategory } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FilterChips } from "@/components/FilterChips";
import { FooterActions } from "@/components/FooterActions";
import { Screen } from "@/components/Screen";
import { Tag } from "@/components/Tag";
import { color, semanticColor, shape, typography } from "@/theme";

const categoryOptions = [
  { key: "reading", label: "Leitura" },
  { key: "writing", label: "Escrita" },
  { key: "vocabulary", label: "Vocabulário" },
  { key: "comprehension", label: "Compreensão" },
];

const alternativeLetters = ["A", "B", "C", "D"] as const;

const schema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Informe o enunciado")
    .max(500, "O enunciado deve ter até 500 caracteres"),
  category: z.enum(["reading", "writing", "vocabulary", "comprehension"]),
});

type FormValues = z.infer<typeof schema>;

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  section: { gap: 10 },
  label: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  fieldLabel: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  promptInput: {
    minHeight: 96,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    borderRadius: shape.inputRadius,
    backgroundColor: color.surface,
    paddingHorizontal: 10,
    paddingVertical: 13,
    fontSize: typography.body.fontSize,
    color: color.text,
    textAlignVertical: "top",
  },
  mediaRow: { flexDirection: "row", gap: 12 },
  mediaCard: { flex: 1, opacity: 0.6 },
  mediaCardContent: { gap: 8, alignItems: "flex-start" },
  mediaLabel: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  alternativeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  letterCircle: {
    width: shape.minTouchTarget,
    height: shape.minTouchTarget,
    borderRadius: shape.minTouchTarget / 2,
    backgroundColor: color.tagNeutral,
    justifyContent: "center",
    alignItems: "center",
  },
  letterCircleMarked: { backgroundColor: color.primary },
  letterText: {
    fontFamily: typography.sectionTitle.fontFamily,
    color: semanticColor.textOnTagNeutral,
  },
  letterTextMarked: { color: semanticColor.textOnPrimary },
  alternativeInput: {
    flex: 1,
    minHeight: shape.minTouchTarget,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    borderRadius: shape.inputRadius,
    backgroundColor: color.surface,
    paddingHorizontal: 10,
    fontSize: typography.body.fontSize,
    color: color.text,
  },
  markButton: { width: 92 },
  hint: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.pink,
  },
});

export function NewTaskScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [alternatives, setAlternatives] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { prompt: "", category: undefined },
  });

  const filledAlternatives = alternatives
    .map((text, index) => ({
      text: text.trim(),
      isCorrect: index === correctIndex,
    }))
    .filter((alternative) => alternative.text.length > 0);
  const alternativesValid =
    filledAlternatives.length >= 2 &&
    correctIndex !== null &&
    alternatives[correctIndex].trim().length > 0;

  const mutation = useMutation({
    mutationFn: withOfflineGuard(createTask),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task"] });
      router.replace("/(tabs)/activities");
    },
  });
  const canSubmit = isValid && alternativesValid && !mutation.isPending;

  function updateAlternative(index: number, text: string) {
    setAlternatives((current) =>
      current.map((value, i) => (i === index ? text : value)),
    );
  }

  function toggleCorrect(index: number) {
    setCorrectIndex((current) => (current === index ? null : index));
  }

  function submit(values: FormValues) {
    const input: CreateTaskAlternativeInput[] = filledAlternatives;
    mutation.mutate({
      category: values.category,
      prompt: values.prompt,
      alternatives: input,
    });
  }

  return (
    <Screen scroll>
      <AppHeader
        title="Criar Atividade"
        onMenuPress={router.back}
        onAvatarPress={() => undefined}
      />
      <View style={styles.content}>
        <View style={styles.mediaRow}>
          <View style={styles.mediaCard}>
            <Card accessibilityLabel="Imagem da Atividade, em breve">
              <View style={styles.mediaCardContent}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={24}
                  color={color.textSecondary}
                />
                <Text style={styles.mediaLabel}>Imagem da Atividade</Text>
                <Tag label="Em breve" />
              </View>
            </Card>
          </View>
          <View style={styles.mediaCard}>
            <Card accessibilityLabel="Áudio da Atividade, em breve">
              <View style={styles.mediaCardContent}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={24}
                  color={color.textSecondary}
                />
                <Text style={styles.mediaLabel}>Áudio da Atividade</Text>
                <Tag label="Em breve" />
              </View>
            </Card>
          </View>
        </View>
        <Controller
          control={control}
          name="prompt"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Enunciado *</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                placeholder="Ex: Identifique a sílaba inicial da palavra mostrada na imagem"
                accessibilityLabel="Enunciado *"
                style={styles.promptInput}
              />
              {errors.prompt ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {errors.prompt.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field: { value, onChange } }) => (
            <View style={styles.section}>
              <Text style={styles.label}>Categoria *</Text>
              <FilterChips
                options={categoryOptions}
                selected={value ? [value] : []}
                onToggle={(key) => onChange(key as TaskCategory)}
              />
              {errors.category ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {errors.category.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        <View style={styles.section}>
          <Text style={styles.label}>Alternativas de Resposta *</Text>
          {alternativeLetters.map((letter, index) => {
            const isMarked = correctIndex === index;
            return (
              <View key={letter} style={styles.alternativeRow}>
                <View
                  style={[
                    styles.letterCircle,
                    isMarked ? styles.letterCircleMarked : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.letterText,
                      isMarked ? styles.letterTextMarked : null,
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
                <TextInput
                  value={alternatives[index]}
                  onChangeText={(text) => updateAlternative(index, text)}
                  accessibilityLabel={`Alternativa ${letter}`}
                  placeholder={`Alternativa ${letter}`}
                  style={styles.alternativeInput}
                />
                <View style={styles.markButton}>
                  <Button
                    label="Marcar"
                    onPress={() => toggleCorrect(index)}
                    variant={isMarked ? "primary" : "secondary"}
                    accessibilityLabel={`Marcar alternativa ${letter} como correta`}
                  />
                </View>
              </View>
            );
          })}
          <Text style={styles.hint}>
            Preencha as alternativas e marque qual é a correta
          </Text>
        </View>
        {mutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {mutation.error.message}
          </Text>
        ) : null}
        <FooterActions
          onBack={router.back}
          backLabel="Cancelar"
          onPrimary={handleSubmit(submit)}
          primaryLabel="Criar Atividade"
          primaryDisabled={!canSubmit}
          primaryLoading={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
