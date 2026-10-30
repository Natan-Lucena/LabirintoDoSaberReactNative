import { useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  createAnamneseTemplate,
  deleteAnamneseTemplate,
  getAnamneseTemplate,
  updateAnamneseTemplate,
} from "@/api/endpoints/anamnese";
import {
  AppHeader,
  Checkbox,
  DsButton,
  Field,
  IconButton,
  SelectField,
} from "@/components/ds";
import { color, fontFamilies, shape, semanticColor } from "@/theme";
import {
  templateSchema,
  toTemplateInput,
  type TemplateFormValues,
} from "./templateSchema";

const typeOptions = [
  { label: "Descritiva", value: "Descriptive" },
  { label: "Múltipla escolha", value: "MultipleChoice" },
  { label: "Caixas de seleção", value: "Checkbox" },
  { label: "Arquivo", value: "FileUpload" },
];
const blockedMessage = "Este modelo já tem respostas e não pode ser alterado.";
function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "TEMPLATE_HAS_RESPONSES") return blockedMessage;
  if (code === "TEMPLATE_NOT_FOUND") return "Modelo não encontrado.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function TemplateFormScreen({
  templateId,
}: {
  templateId?: string;
}): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["anamnese", "templates", templateId],
    queryFn: () => getAnamneseTemplate(templateId!),
    enabled: !!templateId,
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { title: "", description: "", questions: [] },
  });
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "questions",
  });
  const watchedQuestions = useWatch({ control, name: "questions" });
  useEffect(() => {
    if (query.data)
      reset({
        title: query.data.title,
        description: query.data.description ?? "",
        questions: [...query.data.questions]
          .sort((a, b) => a.order - b.order)
          .map((question) => ({
            text: question.text,
            type: question.type,
            required: question.required,
            options: question.options.map((option) => option.text),
          })),
      });
  }, [query.data, reset]);
  const save = useMutation({
    mutationFn: (values: TemplateFormValues) =>
      templateId
        ? updateAnamneseTemplate(templateId, toTemplateInput(values))
        : createAnamneseTemplate(toTemplateInput(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["anamnese", "templates"],
      });
      router.back();
    },
    onError: (error) => setApiError(errorMessage(error)),
  });
  const deletion = useMutation({
    mutationFn: () => deleteAnamneseTemplate(templateId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["anamnese", "templates"],
      });
      setConfirmOpen(false);
      router.back();
    },
    onError: (error) => {
      setConfirmOpen(false);
      setApiError(errorMessage(error));
    },
  });
  return (
    <View style={styles.screen}>
      <AppHeader
        title={templateId ? "Editar modelo" : "Novo modelo"}
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {query.isPending && templateId ? (
          <ActivityIndicator accessibilityLabel="Carregando modelo" />
        ) : null}
        {query.isError ? (
          <>
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage(query.error)}
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          </>
        ) : null}
        {!templateId || query.isSuccess ? (
          <>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <Field
                  label="Título *"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.title?.message}
                  maxLength={200}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Field
                  label="Descrição"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.description?.message}
                  multiline
                  maxLength={1000}
                />
              )}
            />
            <Text style={styles.heading}>Perguntas</Text>
            {fields.map((item, index) => (
              <View key={item.id} style={styles.question}>
                <View style={styles.row}>
                  <Text style={styles.questionTitle}>Pergunta {index + 1}</Text>
                  <DsButton
                    label="Remover"
                    accessibilityLabel={`Remover pergunta ${index + 1}`}
                    variant="ghost"
                    onPress={() => remove(index)}
                  />
                </View>
                <View style={styles.row}>
                  <DsButton
                    label="Subir"
                    accessibilityLabel={`Subir pergunta ${index + 1}`}
                    variant="secondary"
                    disabled={index === 0}
                    onPress={() => swap(index, index - 1)}
                  />
                  <DsButton
                    label="Descer"
                    accessibilityLabel={`Descer pergunta ${index + 1}`}
                    variant="secondary"
                    disabled={index === fields.length - 1}
                    onPress={() => swap(index, index + 1)}
                  />
                </View>
                <Controller
                  control={control}
                  name={`questions.${index}.text`}
                  render={({ field }) => (
                    <Field
                      label="Texto da pergunta *"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.questions?.[index]?.text?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`questions.${index}.type`}
                  render={({ field }) => (
                    <SelectField
                      label="Tipo *"
                      value={field.value}
                      options={typeOptions}
                      onChange={(value) => field.onChange(value)}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`questions.${index}.required`}
                  render={({ field }) => (
                    <Checkbox
                      label="Obrigatória"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`questions.${index}.options`}
                  render={({ field }) => {
                    const isChoice =
                      watchedQuestions[index]?.type === "MultipleChoice" ||
                      watchedQuestions[index]?.type === "Checkbox";
                    return isChoice ? (
                      <View style={styles.options}>
                        <Text style={styles.questionTitle}>Opções</Text>
                        {field.value.map((option, optionIndex) => (
                          <View key={optionIndex} style={styles.row}>
                            <View style={styles.optionField}>
                              <Field
                                label={`Opção ${optionIndex + 1}`}
                                value={option}
                                onChangeText={(text) =>
                                  field.onChange(
                                    field.value.map((current, currentIndex) =>
                                      currentIndex === optionIndex
                                        ? text
                                        : current,
                                    ),
                                  )
                                }
                              />
                            </View>
                            <IconButton
                              icon="close"
                              accessibilityLabel={`Remover opção ${optionIndex + 1} da pergunta ${index + 1}`}
                              onPress={() =>
                                field.onChange(
                                  field.value.filter(
                                    (_, currentIndex) =>
                                      currentIndex !== optionIndex,
                                  ),
                                )
                              }
                            />
                          </View>
                        ))}
                        <DsButton
                          label="Adicionar opção"
                          variant="secondary"
                          onPress={() => field.onChange([...field.value, ""])}
                        />
                        {errors.questions?.[index]?.options ? (
                          <Text style={styles.error} accessibilityRole="alert">
                            Informe pelo menos duas opções
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <></>
                    );
                  }}
                />
              </View>
            ))}
            {errors.questions?.root?.message || errors.questions?.message ? (
              <Text style={styles.error} accessibilityRole="alert">
                {errors.questions?.root?.message ?? errors.questions?.message}
              </Text>
            ) : null}
            <DsButton
              label="Adicionar pergunta"
              variant="soft"
              onPress={() =>
                append({
                  text: "",
                  type: "Descriptive",
                  required: false,
                  options: [],
                })
              }
            />
            {apiError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {apiError}
              </Text>
            ) : null}
            <DsButton
              label="Salvar modelo"
              fullWidth
              loading={save.isPending}
              onPress={handleSubmit((values) => {
                setApiError(null);
                save.mutate(values);
              })}
            />
            {templateId ? (
              <DsButton
                label="Excluir modelo"
                variant="secondary"
                onPress={() => setConfirmOpen(true)}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.heading}>Excluir modelo?</Text>
            <Text>Esta ação não pode ser desfeita.</Text>
            <View style={styles.row}>
              <DsButton
                label="Cancelar"
                variant="secondary"
                onPress={() => setConfirmOpen(false)}
              />
              <DsButton
                label="Excluir"
                loading={deletion.isPending}
                onPress={() => deletion.mutate()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[950],
  },
  question: {
    padding: 16,
    gap: 12,
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  questionTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.bold,
    color: color.ink[950],
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  options: { gap: 8 },
  optionField: { flex: 1 },
  error: { color: semanticColor.dangerTextOnSurface },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modal: {
    padding: 20,
    gap: 16,
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
  },
});
