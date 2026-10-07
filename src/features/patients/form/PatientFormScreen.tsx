import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import { createStudent } from "@/api/endpoints/student-create";
import { withOfflineGuard } from "@/api/query-client";
import type { Gender } from "@/api/types";
import {
  AppHeader,
  CheckList,
  DsButton,
  Field,
  FieldGrid,
  SegmentedControl,
  Toast,
  useToast,
} from "@/components/ds";
import { color, fontFamilies } from "@/theme";

const difficultyOptions = [
  { key: "Linguagem", label: "Linguagem" },
  { key: "Consciência fonológica", label: "Consciência fonológica" },
  { key: "Leitura e escrita", label: "Leitura e escrita" },
  { key: "Atenção", label: "Atenção" },
  { key: "Comportamento adaptativo", label: "Comportamento adaptativo" },
];

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
    .regex(/^\d+$/, "Informe uma idade válida")
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 50,
      "A idade deve ser entre 1 e 50",
    ),
  gender: z.enum(["female", "male"], { message: "Selecione o gênero" }),
  phonenumber: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Informe um telefone válido"),
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
  learningTopics: z
    .array(z.string().trim().min(1))
    .min(1, "Selecione uma dificuldade"),
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

export function PatientFormScreen(): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [customDifficulty, setCustomDifficulty] = useState("");
  const [customDifficulties, setCustomDifficulties] = useState<string[]>([]);
  const {
    control,
    getValues,
    handleSubmit,
    setValue,
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
      learningTopics: [],
    },
  });

  const mutation = useMutation({
    mutationFn: withOfflineGuard(createStudent),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student"] });
      toast.show("Paciente salvo com sucesso");
    },
  });

  useEffect(() => {
    if (!toast.message) {
      return;
    }
    const timer = setTimeout(() => router.back(), 700);
    return () => clearTimeout(timer);
  }, [router, toast.message]);

  function addCustomDifficulty() {
    const difficulty = customDifficulty.trim();
    const topics = getValues("learningTopics");
    if (!difficulty || topics.includes(difficulty)) {
      return;
    }
    setCustomDifficulties((current) => [...current, difficulty]);
    setValue("learningTopics", [...topics, difficulty], {
      shouldValidate: true,
    });
    setCustomDifficulty("");
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
      learningTopics: values.learningTopics,
    });
  }

  const options = [
    ...difficultyOptions,
    ...customDifficulties.map((key) => ({ key, label: key })),
  ];
  const canSubmit = isValid && !mutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader
        title="Novo paciente"
        subtitle="Informações iniciais"
        onBack={router.back}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onBlur, onChange } }) => (
            <Field
              label="Nome completo"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              accessibilityLabel="Nome completo"
              autoCapitalize="words"
            />
          )}
        />

        <FieldGrid>
          <Controller
            control={control}
            name="age"
            render={({ field: { value, onBlur, onChange } }) => (
              <Field
                label="Idade"
                value={value}
                onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                onBlur={onBlur}
                error={errors.age?.message}
                accessibilityLabel="Idade"
                keyboardType="number-pad"
              />
            )}
          />
          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <View style={styles.selectionField}>
                <Text style={styles.label}>Gênero</Text>
                <SegmentedControl
                  options={genderOptions}
                  value={value ?? ""}
                  onChange={onChange}
                  accessibilityLabel="Gênero"
                />
                {errors.gender ? (
                  <Text style={styles.error} accessibilityRole="alert">
                    {errors.gender.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
        </FieldGrid>

        <Controller
          control={control}
          name="phonenumber"
          render={({ field: { value, onBlur, onChange } }) => (
            <Field
              label="Telefone do responsável"
              value={value}
              onChangeText={(text) => onChange(maskPhone(text))}
              onBlur={onBlur}
              error={errors.phonenumber?.message}
              accessibilityLabel="Telefone do responsável"
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />
          )}
        />

        <Text style={styles.sectionTitle}>Endereço</Text>
        <FieldGrid>
          <Controller
            control={control}
            name="zipcode"
            render={({ field: { value, onBlur, onChange } }) => (
              <Field
                label="CEP"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.zipcode?.message}
                accessibilityLabel="CEP"
                keyboardType="number-pad"
              />
            )}
          />
          <Controller
            control={control}
            name="road"
            render={({ field: { value, onBlur, onChange } }) => (
              <Field
                label="Rua"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.road?.message}
                accessibilityLabel="Rua"
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name="housenumber"
            render={({ field: { value, onBlur, onChange } }) => (
              <Field
                label="Número"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.housenumber?.message}
                accessibilityLabel="Número"
              />
            )}
          />
        </FieldGrid>

        <Controller
          control={control}
          name="learningTopics"
          render={({ field: { value, onChange } }) => (
            <View style={styles.selectionField}>
              <Text style={styles.sectionTitle}>
                Dificuldades identificadas
              </Text>
              <CheckList
                options={options}
                selected={value}
                onChange={onChange}
                disabled={mutation.isPending}
              />
              {errors.learningTopics ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {errors.learningTopics.message}
                </Text>
              ) : null}
            </View>
          )}
        />
        <View style={styles.customDifficulty}>
          <Field
            label="Outra dificuldade"
            value={customDifficulty}
            onChangeText={setCustomDifficulty}
            accessibilityLabel="Outra dificuldade"
          />
          <DsButton
            label="Adicionar dificuldade"
            variant="secondary"
            onPress={addCustomDifficulty}
            disabled={mutation.isPending}
          />
        </View>

        {mutation.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Não foi possível salvar o paciente"}
          </Text>
        ) : null}
        <DsButton
          label="Salvar paciente"
          icon="arrow"
          fullWidth
          onPress={handleSubmit(submit)}
          disabled={!canSubmit}
          loading={mutation.isPending}
        />
      </ScrollView>
      <Toast message={toast.message} onHide={toast.hide} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 18, padding: 20, paddingBottom: 36 },
  selectionField: { gap: 7 },
  sectionTitle: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 21,
  },
  label: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 11,
    lineHeight: 14,
  },
  error: { color: color.danger, fontSize: 12, lineHeight: 16 },
  customDifficulty: { gap: 10 },
});
