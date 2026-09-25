import type { ReactElement } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { createStudent } from "@/api/endpoints/student-create";
import { withOfflineGuard } from "@/api/query-client";
import type { Gender } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { FilterChips } from "@/components/FilterChips";
import { FooterActions } from "@/components/FooterActions";
import { Screen } from "@/components/Screen";
import { Tag } from "@/components/Tag";
import { TextField } from "@/components/TextField";
import { color, semanticColor, shape, typography } from "@/theme";

const genderOptions = [
  { key: "female", label: "Feminino" },
  { key: "male", label: "Masculino" },
];

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome completo")
    .max(100, "O nome deve ter até 100 caracteres"),
  age: z
    .string()
    .trim()
    .min(1, "Informe a idade")
    .refine((value) => /^\d+$/.test(value), "Informe uma idade válida")
    .refine((value) => {
      const age = Number(value);
      return age >= 1 && age <= 50;
    }, "A idade deve ser entre 1 e 50"),
  gender: z.enum(["female", "male"], {
    message: "Selecione o gênero",
  }),
  phonenumber: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Informe um contato válido"),
  zipcode: z
    .string()
    .trim()
    .min(5, "O CEP deve ter entre 5 e 10 caracteres")
    .max(10, "O CEP deve ter entre 5 e 10 caracteres"),
  road: z
    .string()
    .trim()
    .min(1, "Informe a rua")
    .max(100, "A rua deve ter até 100 caracteres"),
  housenumber: z
    .string()
    .trim()
    .min(1, "Informe o número")
    .max(10, "O número deve ter até 10 caracteres"),
});

type FormValues = z.infer<typeof schema>;

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function NewStudentScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [learningTopics, setLearningTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      age: "",
      gender: undefined,
      phonenumber: "",
      zipcode: "",
      road: "",
      housenumber: "",
    },
  });

  const mutation = useMutation({
    mutationFn: withOfflineGuard(createStudent),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student"] });
      router.replace("/(tabs)/students");
    },
  });

  const canSubmit =
    isValid && learningTopics.length >= 1 && !mutation.isPending;

  function addTopic() {
    const trimmed = topicInput.trim();
    if (trimmed.length === 0 || learningTopics.includes(trimmed)) {
      return;
    }
    setLearningTopics((current) => [...current, trimmed]);
    setTopicInput("");
  }

  function removeTopic(topic: string) {
    setLearningTopics((current) => current.filter((item) => item !== topic));
  }

  function submit(values: FormValues) {
    mutation.mutate({
      name: values.name.trim(),
      age: Number(values.age),
      gender: values.gender as Gender,
      zipcode: values.zipcode.trim(),
      road: values.road.trim(),
      housenumber: values.housenumber.trim(),
      phonenumber: values.phonenumber.replace(/\D/g, ""),
      learningTopics,
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll>
        <AppHeader
          title="Alunos"
          onMenuPress={router.back}
          onAvatarPress={() => undefined}
        />
        <View style={styles.content}>
          <View style={styles.photoSection}>
            <View style={styles.photoCircle}>
              <Ionicons
                name="person"
                size={40}
                color={semanticColor.textOnPrimary}
              />
            </View>
            <View style={styles.photoButtonRow}>
              <Text style={styles.photoButtonLabel}>Adicionar foto</Text>
              <Tag label="Em breve" />
            </View>
            <Text style={styles.hint}>
              Opcional - pode ser adicionada depois
            </Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Nome Completo *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                accessibilityLabel="Nome Completo *"
              />
            )}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Controller
                control={control}
                name="age"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    label="Idade *"
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={errors.age?.message}
                    accessibilityLabel="Idade *"
                  />
                )}
              />
            </View>
            <View style={styles.rowItemWide}>
              <Controller
                control={control}
                name="gender"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.section}>
                    <Text style={styles.fieldLabel}>Gênero *</Text>
                    <FilterChips
                      options={genderOptions}
                      selected={value ? [value] : []}
                      onToggle={(key) => onChange(key as Gender)}
                    />
                    {errors.gender ? (
                      <Text style={styles.error} accessibilityRole="alert">
                        {errors.gender.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="phonenumber"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Contato do Responsável *"
                value={value}
                onChangeText={(text) => onChange(maskPhone(text))}
                onBlur={onBlur}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                error={errors.phonenumber?.message}
                accessibilityLabel="Contato do Responsável *"
              />
            )}
          />

          <View style={styles.divider} />

          <Text style={styles.label}>Endereço</Text>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Controller
                control={control}
                name="zipcode"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    label="CEP *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={errors.zipcode?.message}
                    accessibilityLabel="CEP *"
                  />
                )}
              />
            </View>
            <View style={styles.rowItemWide}>
              <Controller
                control={control}
                name="road"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    label="Rua *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.road?.message}
                    accessibilityLabel="Rua *"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="housenumber"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Número *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.housenumber?.message}
                accessibilityLabel="Número *"
              />
            )}
          />

          <View style={styles.section}>
            <Text style={styles.label}>Objetivos de Aprendizado *</Text>
            <View style={styles.row}>
              <View style={styles.rowItemWide}>
                <TextField
                  label=""
                  value={topicInput}
                  onChangeText={setTopicInput}
                  accessibilityLabel="Novo objetivo de aprendizado"
                />
              </View>
              <View style={styles.addTopicButton}>
                <Pressable
                  onPress={addTopic}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar"
                  style={styles.addTopicPressable}
                >
                  <Text style={styles.addTopicLabel}>Adicionar</Text>
                </Pressable>
              </View>
            </View>
            {learningTopics.length === 0 ? (
              <Text style={styles.error} accessibilityRole="alert">
                Adicione ao menos um objetivo de aprendizado
              </Text>
            ) : (
              <View style={styles.topicsRow}>
                {learningTopics.map((topic) => (
                  <Pressable
                    key={topic}
                    onPress={() => removeTopic(topic)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover objetivo ${topic}`}
                    style={styles.topicChip}
                  >
                    <Text style={styles.topicChipLabel}>{topic}</Text>
                    <Ionicons
                      name="close"
                      size={14}
                      color={semanticColor.textOnSelection}
                    />
                  </Pressable>
                ))}
              </View>
            )}
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
            primaryLabel="Cadastrar Aluno"
            primaryDisabled={!canSubmit}
            primaryLoading={mutation.isPending}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  rowItemWide: { flex: 2 },
  photoSection: { alignItems: "center", gap: 8, paddingVertical: 8 },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  photoButtonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  photoButtonLabel: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.textSecondary,
  },
  hint: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
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
  divider: {
    borderBottomWidth: shape.hairlineWidth,
    borderBottomColor: color.border,
  },
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.pink,
  },
  addTopicButton: { justifyContent: "flex-end" },
  addTopicPressable: {
    minHeight: shape.minTouchTarget,
    minWidth: 96,
    borderRadius: shape.buttonRadius,
    backgroundColor: color.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  addTopicLabel: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
    color: semanticColor.textOnPrimary,
  },
  topicsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: color.selection,
  },
  topicChipLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: semanticColor.textOnSelection,
  },
});
