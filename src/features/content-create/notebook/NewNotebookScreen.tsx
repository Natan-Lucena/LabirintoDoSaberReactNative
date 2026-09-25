import type { ReactElement } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { createTaskNotebook } from "@/api/endpoints/task-notebook-create";
import { listTaskGroupsByEducator } from "@/api/endpoints/content";
import { withOfflineGuard } from "@/api/query-client";
import type { TaskCategory } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { FooterActions } from "@/components/FooterActions";
import { FilterChips } from "@/components/FilterChips";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { color, shape, typography } from "@/theme";

const categoryOptions = [
  { key: "reading", label: "Leitura" },
  { key: "writing", label: "Escrita" },
  { key: "vocabulary", label: "Vocabulário" },
  { key: "comprehension", label: "Compreensão" },
];

const schema = z.object({
  description: z.string().trim().min(1, "Informe o nome do caderno").max(100),
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  groupCard: {
    width: "47%",
    minHeight: 112,
    borderRadius: shape.cardRadius,
    backgroundColor: color.surface,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  groupCardSelected: { borderWidth: 2, borderColor: color.primary },
  groupName: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
  },
  groupCount: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textTertiary,
  },
  createGroup: {
    minHeight: shape.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: shape.inputRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  createGroupText: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
    color: color.accent,
  },
  warning: {
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

export function NewNotebookScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const {
    control,
    handleSubmit,
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
  const selectedGroups = (groupsQuery.data ?? []).filter((group) =>
    selectedGroupIds.includes(group.id),
  );
  const tasks = [...new Set(selectedGroups.flatMap((group) => group.tasksIds))];
  const mutation = useMutation({
    mutationFn: withOfflineGuard(createTaskNotebook),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-notebook"] });
      router.replace("/(tabs)/activities");
    },
  });
  const canSubmit = isValid && tasks.length > 0 && !mutation.isPending;

  function toggleGroup(id: string) {
    setSelectedGroupIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function submit(values: FormValues) {
    mutation.mutate({
      description: values.description,
      category: values.category,
      tasks,
      taskGroupsIds: selectedGroupIds,
    });
  }

  return (
    <Screen scroll>
      <AppHeader
        title="Criar Caderno"
        onMenuPress={router.back}
        onAvatarPress={() => undefined}
      />
      <View style={styles.content}>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextField
              label="Nome do Caderno *"
              value={value}
              onChangeText={onChange}
              error={errors.description?.message}
              accessibilityLabel="Nome do Caderno *"
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field: { value, onChange } }) => (
            <View style={styles.section}>
              <Text style={styles.label}>Categorias *</Text>
              <FilterChips
                options={categoryOptions}
                selected={value ? [value] : []}
                onToggle={(key) => onChange(key as TaskCategory)}
              />
              {errors.category ? (
                <Text style={styles.error}>{errors.category.message}</Text>
              ) : null}
            </View>
          )}
        />
        <View style={styles.section}>
          <Text style={styles.label}>Grupos de Atividades</Text>
          {groupsQuery.isLoading ? (
            <LoadingState label="Carregando grupos" />
          ) : (
            <View style={styles.grid}>
              {(groupsQuery.data ?? []).map((group) => (
                <Pressable
                  key={group.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.name}, ${group.tasksIds.length} atividades`}
                  accessibilityState={{
                    selected: selectedGroupIds.includes(group.id),
                  }}
                  onPress={() => toggleGroup(group.id)}
                  style={[
                    styles.groupCard,
                    selectedGroupIds.includes(group.id)
                      ? styles.groupCardSelected
                      : null,
                  ]}
                >
                  <Ionicons
                    name="folder-outline"
                    size={24}
                    color={color.accent}
                  />
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupCount}>
                    {group.tasksIds.length} atividades
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            style={styles.createGroup}
            accessibilityRole="button"
            onPress={() => router.push("/content/new-group" as never)}
          >
            <Text style={styles.createGroupText}>+ Criar Grupo</Text>
          </Pressable>
        </View>
        {tasks.length === 0 ? (
          <Text style={styles.warning}>
            Selecione ao menos um grupo com atividades para criar o caderno.
          </Text>
        ) : null}
        {mutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {mutation.error.message}
          </Text>
        ) : null}
        <FooterActions
          onBack={router.back}
          backLabel="Cancelar"
          onPrimary={handleSubmit(submit)}
          primaryLabel="Criar Caderno"
          primaryDisabled={!canSubmit}
          primaryLoading={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
