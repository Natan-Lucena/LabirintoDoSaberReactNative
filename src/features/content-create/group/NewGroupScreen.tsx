import type { ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { createTaskGroup } from "@/api/endpoints/task-group-create";
import { withOfflineGuard } from "@/api/query-client";
import type { TaskCategory } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { FooterActions } from "@/components/FooterActions";
import { FilterChips } from "@/components/FilterChips";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { color, typography } from "@/theme";

const categoryOptions = [
  { key: "reading", label: "Leitura" },
  { key: "writing", label: "Escrita" },
  { key: "vocabulary", label: "Vocabulário" },
  { key: "comprehension", label: "Compreensão" },
];

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome do grupo").max(100),
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
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.pink,
  },
});

export function NewGroupScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", category: undefined },
  });
  const mutation = useMutation({
    mutationFn: withOfflineGuard(createTaskGroup),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task-group"] });
      router.back();
    },
  });
  const canSubmit = isValid && !mutation.isPending;

  function submit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <Screen scroll>
      <AppHeader
        title="Criar Grupo"
        onMenuPress={router.back}
        onAvatarPress={() => undefined}
      />
      <View style={styles.content}>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Nome do Grupo *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              accessibilityLabel="Nome do Grupo *"
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
                <Text style={styles.error} accessibilityRole="alert">
                  {errors.category.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        {mutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {mutation.error.message}
          </Text>
        ) : null}
        <FooterActions
          onBack={router.back}
          backLabel="Cancelar"
          onPrimary={handleSubmit(submit)}
          primaryLabel="Criar Grupo"
          primaryDisabled={!canSubmit}
          primaryLoading={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
