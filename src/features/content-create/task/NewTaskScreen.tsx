import type { ReactElement } from "react";
import { startTransition, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { getTaskById } from "@/api/endpoints/content";
import {
  createTask,
  type CreateTaskAlternativeInput,
} from "@/api/endpoints/task-create";
import { updateTask } from "@/api/endpoints/task-update";
import {
  uploadTaskMedia,
  type TaskMediaFile,
} from "@/api/endpoints/task-upload-media";
import { ApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type { Task, TaskCategory } from "@/api/types";
import {
  AppHeader,
  Checkbox,
  DsButton,
  Field,
  SelectField,
} from "@/components/ds";
import { AudioPickerField } from "@/components/media/AudioPickerField";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { ImagePickerField } from "@/components/media/ImagePickerField";
import { color, fontFamilies, shape } from "@/theme";

const categoryOptions = [
  { value: "reading", label: "Leitura" },
  { value: "writing", label: "Escrita" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "comprehension", label: "Compreensão" },
];
const alternativeLetters = ["A", "B", "C", "D"] as const;

const schema = z.object({
  prompt: z.string().trim().min(1, "Informe o enunciado").max(500),
  category: z.enum(["reading", "writing", "vocabulary", "comprehension"]),
});
type FormValues = z.infer<typeof schema>;

function alternativesFrom(
  values: string[],
  correctIndex: number | null,
): CreateTaskAlternativeInput[] {
  return values
    .map((text, index) => ({
      text: text.trim(),
      isCorrect: index === correctIndex,
    }))
    .filter((alternative) => alternative.text.length > 0);
}

function sameAlternatives(
  left: CreateTaskAlternativeInput[],
  right: Task["alternatives"],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (alternative, index) =>
        alternative.text === right[index]?.text &&
        alternative.isCorrect === right[index]?.isCorrect,
    )
  );
}

function readableTaskError(error: unknown): string {
  const code = error instanceof ApiError ? error.code : undefined;
  const messages: Record<string, string> = {
    TEXT_TASK_CANNOT_HAVE_MEDIA:
      "Uma atividade de texto não pode conter imagem ou áudio.",
    MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO:
      "Adicione uma imagem ou um áudio para a atividade com mídia.",
    AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT:
      "Marque pelo menos uma alternativa correta.",
    INVALID_ALTERNATIVES_FORMAT: "Revise as alternativas antes de salvar.",
  };
  return code && messages[code]
    ? messages[code]
    : "Não foi possível salvar a atividade. Tente novamente.";
}

export function NewTaskScreen({ taskId }: { taskId?: string }): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(taskId);
  const [alternatives, setAlternatives] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<TaskMediaFile | null>(null);
  const [audioFile, setAudioFile] = useState<TaskMediaFile | null>(null);
  const [initialTask, setInitialTask] = useState<Task | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { prompt: "", category: undefined },
  });
  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId ?? ""),
    enabled: editing,
    retry: false,
  });

  useEffect(() => {
    if (!taskQuery.data || !editing) return;
    const task = taskQuery.data;
    startTransition(() => {
      reset({ prompt: task.prompt, category: task.category });
      setAlternatives(task.alternatives.map((alternative) => alternative.text));
      setCorrectIndex(
        task.alternatives.findIndex((alternative) => alternative.isCorrect),
      );
      setInitialTask(task);
    });
  }, [editing, reset, taskQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const submittedAlternatives = alternativesFrom(
        alternatives,
        correctIndex,
      );
      if (!editing) {
        return withOfflineGuard(createTask)({
          ...values,
          alternatives: submittedAlternatives,
          ...(imageFile ? { imageFile } : {}),
          ...(audioFile ? { audioFile } : {}),
        });
      }
      if (!taskId || !initialTask) throw new Error("Atividade não carregada");

      const imageUrl = imageFile
        ? await withOfflineGuard(uploadTaskMedia)(imageFile)
        : undefined;
      const audioUrl = audioFile
        ? await withOfflineGuard(uploadTaskMedia)(audioFile)
        : undefined;
      const input = { id: taskId } as Parameters<typeof updateTask>[0];
      if (values.prompt !== initialTask.prompt) input.prompt = values.prompt;
      if (values.category !== initialTask.category)
        input.category = values.category;
      if (!sameAlternatives(submittedAlternatives, initialTask.alternatives)) {
        input.alternatives = submittedAlternatives;
      }
      if (imageUrl) input.imageFile = imageUrl;
      if (audioUrl) input.audioFile = audioUrl;
      if (imageUrl || audioUrl) input.type = "multipleChoiceWithMedia";
      return withOfflineGuard(updateTask)(input);
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task"] });
      if (editing && taskId) {
        router.replace(`/content/task/${taskId}`);
        return;
      }
      router.replace("/(tabs)/activities");
    },
  });

  const filledAlternatives = alternativesFrom(alternatives, correctIndex);
  const alternativesValid =
    filledAlternatives.length >= 2 &&
    correctIndex !== null &&
    alternatives[correctIndex]?.trim().length > 0;
  const canSubmit = isValid && alternativesValid && !mutation.isPending;

  function updateAlternative(index: number, text: string) {
    setAlternatives((current) =>
      current.map((value, currentIndex) =>
        currentIndex === index ? text : value,
      ),
    );
  }

  function addAlternative() {
    setAlternatives((current) => [...current, ""]);
  }

  function removeAlternative(index: number) {
    setAlternatives((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setCorrectIndex((current) => {
      if (current === null || current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  function submit(values: FormValues) {
    mutation.mutate(values);
  }

  if (editing && taskQuery.isPending) {
    return (
      <View style={styles.screen}>
        <AppHeader
          title="Editar atividade"
          subtitle="Banco de atividades"
          onBack={router.back}
        />
        <Text style={styles.status}>Carregando atividade...</Text>
      </View>
    );
  }

  if (editing && (taskQuery.isError || !initialTask)) {
    return (
      <View style={styles.screen}>
        <AppHeader
          title="Editar atividade"
          subtitle="Banco de atividades"
          onBack={router.back}
        />
        <Text style={styles.error} accessibilityRole="alert">
          Não foi possível carregar a atividade.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={editing ? "Editar atividade" : "Nova atividade"}
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Controller
          control={control}
          name="prompt"
          render={({ field }) => (
            <Field
              label="Enunciado *"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.prompt?.message}
              multiline
              placeholder="Digite o enunciado da atividade"
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectField
              label="Categoria *"
              value={field.value ?? null}
              onChange={(value) => field.onChange(value as TaskCategory)}
              options={categoryOptions}
              error={errors.category?.message}
            />
          )}
        />
        <View style={styles.section}>
          <Text style={styles.heading}>Alternativas</Text>
          {alternatives.map((alternative, index) => {
            const letter = alternativeLetters[index];
            return (
              <View key={letter} style={styles.alternative}>
                <Field
                  label={`Alternativa ${letter}`}
                  value={alternative}
                  onChangeText={(text) => updateAlternative(index, text)}
                  accessibilityLabel={`Alternativa ${letter}`}
                />
                <Checkbox
                  label={`Marcar alternativa ${letter} como correta`}
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                  disabled={mutation.isPending}
                />
                {alternatives.length > 2 ? (
                  <DsButton
                    label={`Remover alternativa ${letter}`}
                    variant="ghost"
                    onPress={() => removeAlternative(index)}
                    disabled={mutation.isPending}
                  />
                ) : null}
              </View>
            );
          })}
          {alternatives.length < 4 ? (
            <DsButton
              label="Adicionar alternativa"
              variant="soft"
              icon="plus"
              onPress={addAlternative}
              disabled={mutation.isPending}
            />
          ) : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Mídia de apoio</Text>
          {initialTask?.imageFile ? (
            <Image
              source={{ uri: initialTask.imageFile }}
              style={styles.imagePreview}
              accessibilityLabel="Imagem atual"
            />
          ) : null}
          <ImagePickerField
            value={imageFile}
            onChange={setImageFile}
            loading={mutation.isPending}
          />
          {initialTask?.audioFile ? (
            <AudioPlayer url={initialTask.audioFile} />
          ) : null}
          <AudioPickerField
            value={audioFile}
            onChange={setAudioFile}
            loading={mutation.isPending}
          />
          {audioFile ? <AudioPlayer url={audioFile.uri} /> : null}
        </View>
        {mutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {readableTaskError(mutation.error)}
          </Text>
        ) : null}
        <DsButton
          label="Salvar atividade"
          fullWidth
          onPress={handleSubmit(submit)}
          disabled={!canSubmit}
          loading={mutation.isPending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 20 },
  section: { gap: 12 },
  alternative: { gap: 8 },
  heading: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 22,
  },
  hint: { color: color.ink[600], fontFamily: fontFamilies.nunito.regular },
  imagePreview: { width: "100%", height: 180, borderRadius: shape.cardRadius },
  status: {
    color: color.ink[600],
    padding: 20,
    fontFamily: fontFamilies.nunito.regular,
  },
  error: {
    color: color.danger,
    padding: 20,
    fontFamily: fontFamilies.nunito.regular,
  },
});
