import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { createActivity } from "@/api/endpoints/task-create";
import {
  taskCatalogQueryKeys,
  listTaskSkills,
} from "@/api/endpoints/task-catalog";
import { updateTask } from "@/api/endpoints/task-update";
import { uploadTaskMedia } from "@/api/endpoints/task-upload-media";
import { ApiError, normalizeApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type { Task, TaskCategory, TaskTone } from "@/api/types";
import {
  AppHeader,
  CheckList,
  DsButton,
  Field,
  SegmentedControl,
  SelectField,
} from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";

import { ColorMatchFields } from "./ColorMatchFields";
import { CONTENT_ERROR_KEY, fieldFromApiPath } from "./fieldFromApiPath";
import { MemoryGameFields } from "./MemoryGameFields";
import { PrintableFields } from "./PrintableFields";
import {
  ACTIVITY_TYPE_LABELS,
  buildContent,
  buildUpdateInput,
  contentToFormValues,
  defaultValues,
  hasPendingUploads,
  hasUpdateChanges,
  MAX_PROMPT,
  resolveMedia,
  validateActivity,
  type ActivityFormValues,
  type ActivityType,
} from "./schema";
import { WordBuilderFields } from "./WordBuilderFields";

const categoryOptions = [
  { value: "reading", label: "Leitura" },
  { value: "writing", label: "Escrita" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "comprehension", label: "Compreensão" },
];

const toneOptions = [
  { key: "", label: "Auto" },
  { key: "mint", label: "Menta" },
  { key: "peach", label: "Pêssego" },
  { key: "lavender", label: "Lavanda" },
  { key: "yellow", label: "Amarelo" },
];

const MAX_SKILLS = 5;

export interface ActivityTypeFormProps {
  type: ActivityType;
  /** Edição: a atividade carregada (o tipo não muda). */
  task?: Task;
}

type Stage = "idle" | "uploading" | "saving";

export function ActivityTypeForm({
  type,
  task,
}: ActivityTypeFormProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(task);
  const [values, setValues] = useState<ActivityFormValues>(() =>
    task ? contentToFormValues(task) : defaultValues(),
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<Stage>("idle");

  const skillsQuery = useQuery({
    queryKey: taskCatalogQueryKeys.skills,
    queryFn: listTaskSkills,
    retry: false,
  });

  const localErrors = useMemo(
    () => validateActivity(type, values),
    [type, values],
  );
  const isValid = Object.keys(localErrors).length === 0;

  function update(patch: Partial<ActivityFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
    setTouched((current) => new Set([...current, ...Object.keys(patch)]));
    setServerErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        if (Object.keys(patch).includes(key.split(".")[0]!)) delete next[key];
      }
      delete next[CONTENT_ERROR_KEY];
      delete next.form;
      return next;
    });
  }

  function errorFor(path: string): string | undefined {
    if (serverErrors[path]) return serverErrors[path];
    const root = path.split(".")[0]!;
    return touched.has(root) ? localErrors[path] : undefined;
  }

  const mutation = useMutation({
    mutationFn: async (): Promise<Task | null | "unchanged"> => {
      setStage(hasPendingUploads(values) ? "uploading" : "saving");
      const resolved = await resolveMedia(values, (file) =>
        withOfflineGuard(uploadTaskMedia)(file),
      );
      setStage("saving");
      if (task) {
        const input = buildUpdateInput(task, type, resolved);
        if (!hasUpdateChanges(input)) return "unchanged";
        await withOfflineGuard(updateTask)(input);
        return task;
      }
      return withOfflineGuard(createActivity)({
        category: resolved.category as TaskCategory,
        type,
        prompt: resolved.prompt.trim(),
        content: buildContent(type, resolved),
        ...(resolved.skills.length > 0 ? { skills: resolved.skills } : {}),
        ...(resolved.theme.trim() ? { theme: resolved.theme.trim() } : {}),
        ...(resolved.tone ? { tone: resolved.tone as TaskTone } : {}),
      });
    },
    retry: false,
    onSuccess: async (result) => {
      setStage("idle");
      await queryClient.invalidateQueries({ queryKey: ["task"] });
      if (task) {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace(`/content/task/${task.id}`);
        return;
      }
      if (result && result !== "unchanged") {
        router.replace(`/content/task/${result.id}`);
        return;
      }
      router.replace("/(tabs)/activities");
    },
    onError: (error) => {
      setStage("idle");
      const apiError =
        error instanceof ApiError ? error : normalizeApiError(error);
      const next: Record<string, string> = {};
      let marked = false;
      for (const entry of apiError.errors) {
        const path = fieldFromApiPath(entry.path);
        if (path === null) continue;
        next[path] ??= entry.message;
        if (path !== CONTENT_ERROR_KEY) marked = true;
      }
      if (marked) {
        next.form = "Revise os campos marcados.";
      } else if (
        next[CONTENT_ERROR_KEY] !== undefined ||
        apiError.code === "INVALID_CONTENT"
      ) {
        next[CONTENT_ERROR_KEY] = "Revise o conteúdo da atividade.";
      } else {
        next.form =
          apiError.message ||
          "Não foi possível salvar a atividade. Tente novamente.";
      }
      setServerErrors(next);
    },
  });

  const pending = mutation.isPending;
  const formError = serverErrors.form ?? serverErrors[CONTENT_ERROR_KEY];
  const canSubmit = isValid && !pending;
  const fieldsProps = { values, update, errorFor, disabled: pending };

  function toggleSkills(selected: string[]) {
    if (selected.length > MAX_SKILLS) return;
    update({ skills: selected });
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={editing ? "Editar atividade" : "Nova atividade"}
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.typeName}>{ACTIVITY_TYPE_LABELS[type]}</Text>
        <Field
          label="Instrução para a criança *"
          value={values.prompt}
          onChangeText={(prompt) => update({ prompt })}
          error={errorFor("prompt")}
          multiline
          maxLength={MAX_PROMPT}
          placeholder="Ex.: Forme a palavra da figura"
          disabled={pending}
        />
        <SelectField
          label="Categoria *"
          value={values.category || null}
          onChange={(category) =>
            update({ category: category as TaskCategory })
          }
          options={categoryOptions}
          error={errorFor("category")}
          disabled={pending}
        />
        {type === "wordBuilder" ? <WordBuilderFields {...fieldsProps} /> : null}
        {type === "colorMatch" ? <ColorMatchFields {...fieldsProps} /> : null}
        {type === "memoryGame" ? <MemoryGameFields {...fieldsProps} /> : null}
        {type === "printable" ? <PrintableFields {...fieldsProps} /> : null}
        <View style={styles.section}>
          <Text style={styles.heading}>Habilidades</Text>
          {skillsQuery.isPending ? (
            <Text style={styles.hint}>Carregando habilidades...</Text>
          ) : skillsQuery.isError ? (
            <View style={styles.section}>
              <Text style={styles.error} accessibilityRole="alert">
                Não foi possível carregar as habilidades.
              </Text>
              <DsButton
                label="Tentar novamente"
                variant="secondary"
                onPress={() => void skillsQuery.refetch()}
              />
            </View>
          ) : (
            <>
              <CheckList
                options={skillsQuery.data.map((skill) => ({
                  key: skill.code,
                  label: skill.label,
                }))}
                selected={values.skills}
                onChange={toggleSkills}
                disabled={pending}
              />
              <Text style={styles.hint}>Até {MAX_SKILLS} habilidades.</Text>
            </>
          )}
        </View>
        <Field
          label="Tema"
          value={values.theme}
          onChangeText={(theme) => update({ theme })}
          error={errorFor("theme")}
          maxLength={60}
          placeholder="Ex.: Animais"
          disabled={pending}
        />
        <View style={styles.section}>
          <Text style={styles.heading}>Cor da miniatura</Text>
          <SegmentedControl
            options={toneOptions}
            value={values.tone}
            onChange={(tone) => update({ tone: tone as TaskTone | "" })}
            disabled={pending}
            accessibilityLabel="Cor da miniatura"
          />
        </View>
        {stage === "uploading" ? (
          <Text style={styles.hint}>Enviando imagens...</Text>
        ) : null}
        {formError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {formError}
          </Text>
        ) : null}
        <DsButton
          label="Salvar atividade"
          fullWidth
          onPress={() => mutation.mutate()}
          disabled={!canSubmit}
          loading={pending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 20 },
  section: { gap: 12 },
  typeName: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 20,
    lineHeight: 26,
  },
  heading: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 22,
  },
  hint: { color: color.ink[600], fontFamily: fontFamilies.nunito.regular },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.regular,
  },
});
