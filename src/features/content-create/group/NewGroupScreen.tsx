import type { ReactElement } from "react";
import { startTransition, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { listTaskGroupsByEducator, listTasks } from "@/api/endpoints/content";
import { createTaskGroup } from "@/api/endpoints/task-group-create";
import { updateTaskGroup } from "@/api/endpoints/task-group-update";
import { withOfflineGuard } from "@/api/query-client";
import type { TaskCategory } from "@/api/types";
import {
  AppHeader,
  CheckList,
  DsButton,
  Field,
  SearchField,
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
  name: z.string().trim().min(1, "Informe o nome do grupo").max(100),
  category: z.enum(["reading", "writing", "vocabulary", "comprehension"]),
});
type FormValues = z.infer<typeof schema>;

export function NewGroupScreen({
  groupId,
}: {
  groupId?: string;
}): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(groupId);
  const [tasksIds, setTasksIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", category: undefined },
  });
  const groupsQuery = useQuery({
    queryKey: ["task-group"],
    queryFn: listTaskGroupsByEducator,
    enabled: editing,
  });
  const tasksQuery = useQuery({
    queryKey: ["task"],
    queryFn: () => listTasks(),
  });
  useEffect(() => {
    const group = groupsQuery.data?.find((item) => item.id === groupId);
    if (group)
      startTransition(() => {
        reset({ name: group.name, category: group.category });
        setTasksIds(group.tasksIds);
      });
  }, [groupId, groupsQuery.data, reset]);
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (groupId)
        return withOfflineGuard(updateTaskGroup)({
          id: groupId,
          ...values,
          tasksIds,
        });
      return withOfflineGuard(createTaskGroup)({ ...values, tasksIds });
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-group"] });
      router.back();
    },
  });
  const visibleTasks = (tasksQuery.data ?? []).filter((task) =>
    task.prompt.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  function submit(values: FormValues) {
    mutation.mutate(values);
  }
  return (
    <View style={styles.screen}>
      <AppHeader
        title={editing ? "Editar Grupo" : "Criar Grupo"}
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              label="Nome do Grupo *"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
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
          <Text style={styles.heading}>Atividades do grupo</Text>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar atividades"
          />
          <CheckList
            options={visibleTasks.map((task) => ({
              key: task.id,
              label: task.prompt,
            }))}
            selected={tasksIds}
            onChange={setTasksIds}
          />
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
            label={editing ? "Salvar" : "Criar Grupo"}
            onPress={handleSubmit(submit)}
            disabled={!isValid || mutation.isPending}
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
  error: { color: color.danger, fontSize: 12 },
  actions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
});
