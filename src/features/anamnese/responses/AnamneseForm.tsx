import { useRef, useState, type ReactElement } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  MAX_ANAMNESE_FILE_SIZE_BYTES,
  createAnamneseResponse,
  updateAnamneseResponse,
  uploadAnamneseFile,
  type AnamneseResponse,
} from "@/api/endpoints/anamnese-responses";
import type { AnamneseTemplate } from "@/api/types";
import { CheckList, DsButton, Field, SelectField } from "@/components/ds";
import { color, fontFamilies, typography } from "@/theme";

import {
  buildAnswers,
  draftsFromResponse,
  sortedQuestions,
  validateDrafts,
  type AnswerDraft,
  type Drafts,
} from "./answers";
import { anamneseResponsesKey } from "./useAnamneseResponses";

const FILE_TOO_LARGE = "O arquivo excede o limite de 10 MB.";
const GENERIC_ERROR = "Não foi possível salvar a anamnese. Tente novamente.";

const codeMessages: Record<string, string> = {
  MISSING_REQUIRED_ANSWER: "Resposta obrigatória",
  MISSING_TEXT_VALUE: "Informe o texto da resposta",
  MISSING_SELECTED_OPTION: "Escolha uma opção",
  MISSING_SELECTED_OPTIONS: "Escolha ao menos uma opção",
  MISSING_FILE_URL: "Envie o arquivo",
  INVALID_QUESTION_ID: "Pergunta inválida para este modelo",
  INVALID_OPTION_ID: "Opção inválida",
};

interface FormError {
  /** Mensagem por pergunta, quando a API aponta o índice da resposta. */
  byQuestion: Record<string, string>;
  general: string | null;
}

function toFormError(error: unknown, questionIds: string[]): FormError {
  const code = (error as { code?: string } | null)?.code;
  const message = code ? codeMessages[code] : undefined;
  if (!message) return { byQuestion: {}, general: GENERIC_ERROR };
  const fields =
    (error as { errors?: readonly { path?: string }[] } | null)?.errors ?? [];
  const byQuestion: Record<string, string> = {};
  for (const field of fields) {
    const index = /answers\.(\d+)/.exec(field.path ?? "")?.[1];
    const questionId = index === undefined ? undefined : questionIds[+index];
    if (questionId) byQuestion[questionId] = message;
  }
  return Object.keys(byQuestion).length
    ? { byQuestion, general: null }
    : { byQuestion: {}, general: message };
}

export interface AnamneseFormProps {
  patientId: string;
  template: AnamneseTemplate;
  /** Quando informada, o formulário edita essa resposta (PUT). */
  response?: AnamneseResponse;
  onSaved: () => void;
}

export function AnamneseForm({
  patientId,
  template,
  response,
  onSaved,
}: AnamneseFormProps): ReactElement {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Drafts>(() =>
    draftsFromResponse(template, response),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const sentQuestionIds = useRef<string[]>([]);

  const save = useMutation({
    mutationFn: async () => {
      // Upload antes do envio da resposta; o `fileUrl` devolvido vai nela.
      const resolved: Drafts = { ...drafts };
      for (const question of template.questions) {
        const draft = resolved[question.id];
        if (question.type === "FileUpload" && draft?.file) {
          const fileUrl = await uploadAnamneseFile(draft.file);
          resolved[question.id] = { ...draft, file: null, fileUrl };
        }
      }
      const answers = buildAnswers(template, resolved);
      sentQuestionIds.current = answers.map((answer) => answer.questionId);
      const saved = response
        ? await updateAnamneseResponse(response.id, { answers })
        : await createAnamneseResponse(template.id, {
            studentId: patientId,
            answers,
          });
      return { saved, answers };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: anamneseResponsesKey(patientId),
      });
      onSaved();
    },
    onError: (error) => {
      const result = toFormError(error, sentQuestionIds.current);
      setErrors(result.byQuestion);
      setGeneral(result.general);
    },
  });

  function patch(questionId: string, change: Partial<AnswerDraft>): void {
    setDrafts((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...change },
    }));
    setErrors((current) => {
      if (!current[questionId]) return current;
      const { [questionId]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function pickFile(questionId: string): Promise<void> {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    if (asset.size !== undefined && asset.size > MAX_ANAMNESE_FILE_SIZE_BYTES) {
      setErrors((current) => ({ ...current, [questionId]: FILE_TOO_LARGE }));
      return;
    }
    patch(questionId, {
      file: {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        size: asset.size ?? undefined,
      },
    });
  }

  function submit(): void {
    setGeneral(null);
    const found = validateDrafts(template, drafts);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate();
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{template.title}</Text>
      {sortedQuestions(template).map((question) => {
        const draft = drafts[question.id];
        const label = `${question.text}${question.required ? " *" : ""}`;
        const error = errors[question.id];
        if (question.type === "Descriptive")
          return (
            <Field
              key={question.id}
              label={label}
              value={draft.text}
              multiline
              error={error}
              onChangeText={(text) => patch(question.id, { text })}
            />
          );
        if (question.type === "MultipleChoice")
          return (
            <SelectField
              key={question.id}
              label={label}
              value={draft.optionId}
              error={error}
              options={question.options.map((option) => ({
                label: option.text,
                value: option.id,
              }))}
              onChange={(optionId) => patch(question.id, { optionId })}
            />
          );
        return (
          <View key={question.id} style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            {question.type === "Checkbox" ? (
              <CheckList
                options={question.options.map((option) => ({
                  key: option.id,
                  label: option.text,
                }))}
                selected={draft.optionIds}
                onChange={(optionIds) => patch(question.id, { optionIds })}
              />
            ) : (
              <>
                <DsButton
                  label="Escolher arquivo"
                  variant="secondary"
                  onPress={() => void pickFile(question.id)}
                />
                {draft.file ? (
                  <Text style={styles.file}>{draft.file.name}</Text>
                ) : draft.fileUrl ? (
                  <Text style={styles.file}>Arquivo já enviado</Text>
                ) : null}
              </>
            )}
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </View>
        );
      })}
      {general ? (
        <Text style={styles.error} accessibilityRole="alert">
          {general}
        </Text>
      ) : null}
      <DsButton
        label="Salvar anamnese"
        fullWidth
        loading={save.isPending}
        onPress={submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { ...typography.section, color: color.ink[950] },
  group: { gap: 8 },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[800],
  },
  file: { ...typography.small, color: color.ink[600] },
  error: { ...typography.small, color: color.danger },
});
