import type { ReactElement } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import {
  generateAiTasks,
  type GenerateAiTasksInput,
  type GenerateAiTasksResponse,
} from "@/api/endpoints/ai-task";
import { createTasksBatch } from "@/api/endpoints/task-batch";
import { withOfflineGuard } from "@/api/query-client";
import type { TaskCategory, TaskInput } from "@/api/types";
import {
  AIContext,
  AppHeader,
  Badge,
  Checkbox,
  DsButton,
  Field,
  SelectField,
  Toast,
  useToast,
} from "@/components/ds";
import { color, fontFamilies } from "@/theme";

const categoryOptions = [
  { value: "reading", label: "Leitura" },
  { value: "writing", label: "Escrita" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "comprehension", label: "Compreensão" },
];

// POST /ai-task/generate aceita 1–15 (docs/PROJECT.md); a lista só oferece
// esses valores, então o próprio seletor já impede escolher fora da faixa.
const quantityOptions = Array.from({ length: 15 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

const schema = z.object({
  targetAudience: z.string().trim().min(1, "Informe o público-alvo"),
  instructions: z.string().trim().min(1, "Informe as instruções"),
  quantity: z
    .number()
    .int()
    .min(1, "Escolha de 1 a 15 atividades")
    .max(15, "Escolha de 1 a 15 atividades"),
  category: z.enum(["reading", "writing", "vocabulary", "comprehension"]),
});

type FormValues = z.infer<typeof schema>;

interface DraftAlternative {
  text: string;
  isCorrect: boolean;
}

interface DraftTask {
  key: string;
  category: TaskCategory;
  prompt: string;
  alternatives: DraftAlternative[];
}

let nextDraftId = 1;

function toDrafts(tasks: TaskInput[]): DraftTask[] {
  return tasks.map((task) => ({
    key: `draft-${nextDraftId++}`,
    category: task.category,
    prompt: task.prompt,
    alternatives: task.alternatives.map((alternative) => ({
      text: alternative.text,
      isCorrect: alternative.isCorrect,
    })),
  }));
}

export function NewAiTaskScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [drafts, setDrafts] = useState<DraftTask[] | null>(null);
  const [lastInput, setLastInput] = useState<FormValues | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      targetAudience: "",
      instructions: "",
      quantity: undefined,
      category: undefined,
    },
  });

  const generateMutation = useMutation<
    GenerateAiTasksResponse,
    Error,
    GenerateAiTasksInput
  >({
    mutationFn: withOfflineGuard(generateAiTasks),
    retry: false,
    onSuccess: (response, variables) => {
      setDrafts(toDrafts(response.tasks));
      setLastInput(variables);
    },
  });

  const saveMutation = useMutation({
    mutationFn: withOfflineGuard(createTasksBatch),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task"] });
      toast.show("Atividades salvas com sucesso");
      router.replace("/activities");
    },
  });

  function generate(values: FormValues) {
    generateMutation.mutate({
      targetAudience: values.targetAudience,
      instructions: values.instructions,
      quantity: values.quantity,
      category: values.category,
    });
  }

  function discard(key: string) {
    setDrafts((current) =>
      current ? current.filter((draft) => draft.key !== key) : current,
    );
  }

  function updatePrompt(key: string, prompt: string) {
    setDrafts(
      (current) =>
        current?.map((draft) =>
          draft.key === key ? { ...draft, prompt } : draft,
        ) ?? current,
    );
  }

  function updateAlternativeText(key: string, index: number, text: string) {
    setDrafts(
      (current) =>
        current?.map((draft) =>
          draft.key === key
            ? {
                ...draft,
                alternatives: draft.alternatives.map((alternative, i) =>
                  i === index ? { ...alternative, text } : alternative,
                ),
              }
            : draft,
        ) ?? current,
    );
  }

  function markCorrect(key: string, index: number) {
    setDrafts(
      (current) =>
        current?.map((draft) =>
          draft.key === key
            ? {
                ...draft,
                alternatives: draft.alternatives.map((alternative, i) => ({
                  ...alternative,
                  isCorrect: i === index,
                })),
              }
            : draft,
        ) ?? current,
    );
  }

  function save() {
    if (!drafts || !lastInput) {
      return;
    }
    const tasks: TaskInput[] = drafts.map((draft) => ({
      category: draft.category,
      type: "multipleChoice",
      prompt: draft.prompt,
      alternatives: draft.alternatives,
    }));
    saveMutation.mutate({
      name: `Atividades com IA — ${lastInput.targetAudience}`,
      category: lastInput.category,
      tasks,
    });
  }

  const selectedCount = drafts?.length ?? 0;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Gerar com IA"
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <AIContext text="A IA gera rascunhos de atividades de múltipla escolha a partir do público-alvo e das instruções informadas. Nada é salvo antes da revisão." />
        <Controller
          control={control}
          name="targetAudience"
          render={({ field }) => (
            <Field
              label="Público-alvo"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ex: Crianças de 7 anos com dificuldade em consciência fonológica"
              error={errors.targetAudience?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="instructions"
          render={({ field }) => (
            <Field
              label="Instruções"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              multiline
              placeholder="Ex: Trabalhe sílabas iniciais com palavras do cotidiano"
              error={errors.instructions?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <SelectField
              label="Quantidade"
              value={field.value ? String(field.value) : null}
              onChange={(value) => field.onChange(Number(value))}
              options={quantityOptions}
              error={errors.quantity?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectField
              label="Categoria"
              value={field.value ?? null}
              onChange={(value) => field.onChange(value as TaskCategory)}
              options={categoryOptions}
              error={errors.category?.message}
            />
          )}
        />
        {generateMutation.error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error} accessibilityRole="alert">
              {generateMutation.error.message}
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={handleSubmit(generate)}
            />
          </View>
        ) : null}
        <DsButton
          label="Gerar atividades com IA"
          icon="sparkles"
          fullWidth
          onPress={handleSubmit(generate)}
          disabled={!isValid}
          loading={generateMutation.isPending}
        />
        {drafts ? (
          <View style={styles.generatedSheet}>
            <View style={styles.generatedHeader}>
              <Text style={styles.generatedTitle}>Rascunho gerado</Text>
              <Badge label="Editável" />
            </View>
            {drafts.map((draft, draftIndex) => (
              <View key={draft.key} style={styles.draftCard}>
                <Field
                  label={`Enunciado da atividade ${draftIndex + 1}`}
                  value={draft.prompt}
                  onChangeText={(text) => updatePrompt(draft.key, text)}
                  multiline
                />
                {draft.alternatives.map((alternative, altIndex) => (
                  <View key={altIndex} style={styles.alternativeRow}>
                    <View style={styles.alternativeInput}>
                      <Field
                        label={`Alternativa ${altIndex + 1} da atividade ${draftIndex + 1}`}
                        value={alternative.text}
                        onChangeText={(text) =>
                          updateAlternativeText(draft.key, altIndex, text)
                        }
                      />
                    </View>
                    <Checkbox
                      label="Correta"
                      checked={alternative.isCorrect}
                      onChange={() => markCorrect(draft.key, altIndex)}
                    />
                  </View>
                ))}
                <DsButton
                  label={`Descartar atividade ${draftIndex + 1}`}
                  variant="secondary"
                  onPress={() => discard(draft.key)}
                />
              </View>
            ))}
            <Text style={styles.counter}>
              {selectedCount} atividade{selectedCount === 1 ? "" : "s"}{" "}
              selecionada{selectedCount === 1 ? "" : "s"}
            </Text>
            {saveMutation.error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {saveMutation.error.message}
              </Text>
            ) : null}
            <DsButton
              label={`Salvar ${selectedCount} atividade${selectedCount === 1 ? "" : "s"}`}
              fullWidth
              onPress={save}
              disabled={selectedCount === 0}
              loading={saveMutation.isPending}
            />
          </View>
        ) : null}
      </ScrollView>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16 },
  errorBox: { gap: 8 },
  error: { color: color.danger, fontSize: 12 },
  generatedSheet: { gap: 16, marginTop: 8 },
  generatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  generatedTitle: {
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 22,
    color: color.ink[950],
  },
  draftCard: {
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  alternativeRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  alternativeInput: { flex: 1 },
  counter: {
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: color.ink[800],
  },
});
