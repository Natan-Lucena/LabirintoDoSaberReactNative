import { useState, type ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { listAnamneseTemplates } from "@/api/endpoints/anamnese";
import type { AnamneseResponse } from "@/api/endpoints/anamnese-responses";
import type { AnamneseTemplate } from "@/api/types";
import { AppHeader, DsButton, FeatureRow } from "@/components/ds";
import { color, typography } from "@/theme";

import { AnamneseForm } from "./AnamneseForm";
import { describeAnswer, formatResponseDate, sortedQuestions } from "./answers";
import { useAnamneseResponses } from "./useAnamneseResponses";

type Mode =
  | { kind: "list" }
  | { kind: "pick" }
  | { kind: "view"; responseId: string }
  | { kind: "form"; templateId: string; responseId?: string };

export interface AnamneseResponsesScreenProps {
  patientId: string;
}

function responseSubtitle(response: AnamneseResponse): string {
  const answered = `Respondida em ${formatResponseDate(response.answeredAt)}`;
  return response.updatedAt
    ? `${answered} · Editada em ${formatResponseDate(response.updatedAt)}`
    : answered;
}

export function AnamneseResponsesScreen({
  patientId,
}: AnamneseResponsesScreenProps): ReactElement {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const responses = useAnamneseResponses(patientId);
  const templates = useQuery({
    queryKey: ["anamnese", "templates"],
    queryFn: listAnamneseTemplates,
  });

  const templateById = (id: string): AnamneseTemplate | undefined =>
    templates.data?.find((item) => item.id === id);
  const toList = (): void => setMode({ kind: "list" });
  const createTemplate = (): void => router.push("/anamnese/templates/new");

  const noTemplates = templates.isSuccess && templates.data.length === 0;
  const viewed =
    mode.kind === "view"
      ? responses.data?.find((item) => item.id === mode.responseId)
      : undefined;
  const editing =
    mode.kind === "form" && mode.responseId
      ? responses.data?.find((item) => item.id === mode.responseId)
      : undefined;

  if (mode.kind === "form") {
    const template = templateById(mode.templateId);
    return (
      <View style={styles.screen}>
        <AppHeader
          title={mode.responseId ? "Editar anamnese" : "Nova anamnese"}
          onBack={toList}
        />
        {template && (!mode.responseId || editing) ? (
          <AnamneseForm
            key={`${template.id}:${mode.responseId ?? "new"}`}
            patientId={patientId}
            template={template}
            response={editing}
            onSaved={toList}
          />
        ) : (
          <Text style={styles.state}>Modelo não encontrado</Text>
        )}
      </View>
    );
  }

  if (mode.kind === "view") {
    const template = viewed ? templateById(viewed.templateId) : undefined;
    return (
      <View style={styles.screen}>
        <AppHeader title="Anamnese" onBack={toList} />
        <ScrollView contentContainerStyle={styles.content}>
          {viewed ? (
            <>
              <Text style={styles.title}>{template?.title ?? "Anamnese"}</Text>
              <Text style={styles.meta}>{responseSubtitle(viewed)}</Text>
              {template ? (
                sortedQuestions(template).map((question) => (
                  <View key={question.id} style={styles.answer}>
                    <Text style={styles.question}>{question.text}</Text>
                    <Text style={styles.answerText}>
                      {describeAnswer(
                        question,
                        viewed.answers.find(
                          (item) => item.questionId === question.id,
                        ),
                      )}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.state}>Modelo não encontrado</Text>
              )}
              {template ? (
                <DsButton
                  label="Editar"
                  fullWidth
                  onPress={() =>
                    setMode({
                      kind: "form",
                      templateId: viewed.templateId,
                      responseId: viewed.id,
                    })
                  }
                />
              ) : null}
            </>
          ) : (
            <Text style={styles.state}>Anamnese não encontrada</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  if (mode.kind === "pick") {
    return (
      <View style={styles.screen}>
        <AppHeader title="Escolher modelo" onBack={toList} />
        <ScrollView contentContainerStyle={styles.content}>
          {templates.isPending ? (
            <ActivityIndicator accessibilityLabel="Carregando modelos" />
          ) : null}
          {templates.isError ? (
            <>
              <Text style={styles.error} accessibilityRole="alert">
                Não foi possível carregar os modelos.
              </Text>
              <DsButton
                label="Tentar novamente"
                variant="secondary"
                onPress={() => void templates.refetch()}
              />
            </>
          ) : null}
          {noTemplates ? (
            <>
              <Text style={styles.state}>Nenhum modelo de anamnese</Text>
              <DsButton label="Criar modelo" onPress={createTemplate} />
            </>
          ) : null}
          {templates.data?.map((template) => (
            <FeatureRow
              key={template.id}
              icon="clipboard"
              title={template.title}
              subtitle={`${template.questions.length} pergunta${template.questions.length === 1 ? "" : "s"}`}
              onPress={() => setMode({ kind: "form", templateId: template.id })}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Anamnese" onBack={router.back} />
      <ScrollView contentContainerStyle={styles.content}>
        <DsButton
          label="Nova anamnese"
          icon="plus"
          onPress={() => setMode({ kind: "pick" })}
        />
        {responses.isPending ? (
          <ActivityIndicator accessibilityLabel="Carregando anamneses" />
        ) : null}
        {responses.isError ? (
          <>
            <Text style={styles.error} accessibilityRole="alert">
              Não foi possível carregar as anamneses.
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void responses.refetch()}
            />
          </>
        ) : null}
        {responses.data?.length === 0 ? (
          <>
            <Text style={styles.state}>Nenhuma anamnese registrada</Text>
            {noTemplates ? (
              <DsButton
                label="Criar modelo"
                variant="secondary"
                onPress={createTemplate}
              />
            ) : null}
          </>
        ) : null}
        {responses.data?.map((response) => (
          <FeatureRow
            key={response.id}
            icon="clipboard"
            title={templateById(response.templateId)?.title ?? "Anamnese"}
            subtitle={responseSubtitle(response)}
            onPress={() => setMode({ kind: "view", responseId: response.id })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { ...typography.section, color: color.ink[950] },
  meta: { ...typography.small, color: color.ink[600] },
  answer: { gap: 4 },
  question: { ...typography.cardTitle, color: color.ink[950] },
  answerText: { ...typography.body, color: color.ink[800] },
  state: { ...typography.body, color: color.ink[600], textAlign: "center" },
  error: { ...typography.small, color: color.danger },
});
