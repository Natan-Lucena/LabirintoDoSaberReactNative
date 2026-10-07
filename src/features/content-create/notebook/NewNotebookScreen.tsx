import type { ReactElement } from "react";
import { startTransition, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
} from "@/api/endpoints/content";
import { createTaskNotebook } from "@/api/endpoints/task-notebook-create";
import { updateTaskNotebook } from "@/api/endpoints/task-notebook-update";
import { withOfflineGuard } from "@/api/query-client";
import type { TaskCategory } from "@/api/types";
import {
  AppHeader,
  CheckList,
  DsButton,
  Field,
  SelectField,
} from "@/components/ds";
import { color, fontFamilies } from "@/theme";

const categoryOptions = [
  { value: "reading", label: "Leitura" },
  { value: "writing", label: "Escrita" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "comprehension", label: "Compreensão" },
];
const schema = z.object({
  description: z.string().trim().min(1, "Informe o nome do caderno").max(100),
  category: z.enum(["reading", "writing", "vocabulary", "comprehension"]),
});
type FormValues = z.infer<typeof schema>;

export function NewNotebookScreen({
  notebookId,
}: {
  notebookId?: string;
}): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(notebookId);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { description: "", category: undefined },
  });
  const groupsQuery = useQuery({
    queryKey: ["task-group"],
    queryFn: listTaskGroupsByEducator,
  });
  const notebooksQuery = useQuery({
    queryKey: ["task-notebook"],
    queryFn: () => listTaskNotebooks(),
    enabled: editing,
  });
  useEffect(() => {
    const notebook = notebooksQuery.data?.find(
      (entry) => entry.notebook.id === notebookId,
    )?.notebook;
    if (notebook)
      startTransition(() => {
        reset({
          description: notebook.description,
          category: notebook.category,
        });
        setSelectedGroupIds(notebook.taskGroupsIds);
      });
  }, [notebookId, notebooksQuery.data, reset]);
  const selectedGroups = (groupsQuery.data ?? []).filter((group) =>
    selectedGroupIds.includes(group.id),
  );
  const tasks = [...new Set(selectedGroups.flatMap((group) => group.tasksIds))];
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (notebookId)
        return withOfflineGuard(updateTaskNotebook)({
          taskNotebookId: notebookId,
          ...values,
          taskGroupsIds: selectedGroupIds,
        });
      return withOfflineGuard(createTaskNotebook)({
        ...values,
        tasks,
        taskGroupsIds: selectedGroupIds,
      });
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-notebook"] });
      if (editing) router.back();
      else router.replace("/(tabs)/activities");
    },
  });
  function submit(values: FormValues) {
    mutation.mutate(values);
  }
  return (
    <View style={styles.screen}>
      <AppHeader
        title={editing ? "Editar Caderno" : "Criar Caderno"}
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field
              label="Nome do Caderno *"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.description?.message}
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
          <Text style={styles.heading}>Grupos de atividades</Text>
          <CheckList
            options={(groupsQuery.data ?? []).map((group) => ({
              key: group.id,
              label: `${group.name} (${group.tasksIds.length} atividades)`,
            }))}
            selected={selectedGroupIds}
            onChange={setSelectedGroupIds}
          />
          {!editing && tasks.length === 0 ? (
            <Text style={styles.hint}>
              Selecione ao menos um grupo com atividades para criar o caderno.
            </Text>
          ) : null}
        </View>
        {mutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {mutation.error.message}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <DsButton
            label="Cancelar"
            variant="secondary"
            onPress={router.back}
          />
          <DsButton
            label={editing ? "Salvar" : "Criar Caderno"}
            onPress={handleSubmit(submit)}
            disabled={
              !isValid || (!editing && tasks.length === 0) || mutation.isPending
            }
            loading={mutation.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 20 },
  section: { gap: 12 },
  heading: {
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 22,
    color: color.ink[950],
  },
  hint: { color: color.ink[600], fontSize: 12 },
  error: { color: color.danger, fontSize: 12 },
  actions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
});
