import { useEffect, useRef, useState, type ReactElement } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { listAnamneseResponsesByStudent } from "@/api/endpoints/anamnese-responses";
import { listAnamneseTemplates } from "@/api/endpoints/anamnese";
import {
  generatePlanDraft,
  listPlans,
  type GeneratePlanDraftInput,
} from "@/api/endpoints/plans";
import type { PlanDraft, PlanType } from "@/api/types";
import {
  AIContext,
  AppHeader,
  CheckList,
  DateField,
  DsButton,
  Field,
  SectionTitle,
  SegmentedControl,
  SelectField,
} from "@/components/ds";
import { useStudents } from "@/features/students/useStudents";
import { color, typography, semanticColor } from "@/theme";
import { dayKey } from "@/utils/date";
import { DraftPreview } from "./DraftPreview";

const typeOptions = [
  { key: "PDI", label: "PDI" },
  { key: "PE", label: "PE da sessão" },
];
const durationOptions = [
  { key: "3", label: "3 meses" },
  { key: "6", label: "6 meses" },
];

export function GeneratePlanScreen(): ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const saved = useRef(false);
  const discarded = useRef(false);
  const params = useLocalSearchParams<{ studentId?: string }>();
  const routeStudentId =
    typeof params.studentId === "string" ? params.studentId : undefined;
  const [studentId, setStudentId] = useState(routeStudentId ?? "");
  const [type, setType] = useState<PlanType>("PDI");
  const [focus, setFocus] = useState("");
  const [difficultySelection, setDifficultySelection] = useState<{
    studentId: string;
    values: string[];
  } | null>(null);
  const [duration, setDuration] = useState<3 | 6>(3);
  const [sessionDate, setSessionDate] = useState(new Date());
  const [templateId, setTemplateId] = useState("");
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (!draft || saved.current || discarded.current) return;
      event.preventDefault();
      Alert.alert(
        "Descartar o rascunho?",
        "As alterações não salvas serão perdidas.",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              discarded.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });
  }, [draft, navigation]);
  const [lastInput, setLastInput] = useState<GeneratePlanDraftInput | null>(
    null,
  );
  const studentsQuery = useStudents();
  const student = studentsQuery.data?.find((item) => item.id === studentId);
  const difficulties =
    difficultySelection?.studentId === studentId
      ? difficultySelection.values
      : (student?.learningTopics ?? []).slice(0, 20);
  const parentQuery = useQuery({
    queryKey: ["plans", "active-pdi", studentId],
    queryFn: () => listPlans({ studentId, type: "PDI", status: "ACTIVE" }),
    enabled: !!studentId,
    retry: false,
  });
  const responsesQuery = useQuery({
    queryKey: ["anamnese-responses", studentId],
    queryFn: () => listAnamneseResponsesByStudent(studentId),
    enabled: !!studentId,
    retry: false,
  });
  const templatesQuery = useQuery({
    queryKey: ["anamnese-templates"],
    queryFn: listAnamneseTemplates,
    enabled: !!studentId,
    retry: false,
  });
  const generation = useMutation({
    mutationFn: generatePlanDraft,
    retry: false,
    onSuccess: setDraft,
  });

  const parent = parentQuery.data?.[0];
  const answeredTemplateIds = new Set(
    responsesQuery.data?.map((item) => item.templateId) ?? [],
  );
  const templateOptions = (templatesQuery.data ?? [])
    .filter((item) => answeredTemplateIds.has(item.id))
    .map((item) => ({ value: item.id, label: item.title }));
  const canGenerate =
    !!student &&
    focus.trim().length >= 1 &&
    focus.trim().length <= 1000 &&
    difficulties.length >= 1 &&
    difficulties.length <= 20 &&
    !generation.isPending &&
    (type !== "PE" || (!parentQuery.isPending && !parentQuery.isError));

  function submit(): void {
    if (!canGenerate) return;
    const input: GeneratePlanDraftInput = {
      studentId,
      type,
      focus: focus.trim(),
      consideredDifficulties: difficulties,
      ...(type === "PDI"
        ? { durationMonths: duration }
        : {
            sessionDate: dayKey(sessionDate),
            ...(parent ? { parentPlanId: parent.id } : {}),
          }),
      ...(templateId ? { includeAnamnesisTemplateId: templateId } : {}),
    };
    setDraft(null);
    setLastInput(input);
    generation.mutate(input);
  }

  const error = generation.error as {
    code?: string;
    isTimeout?: boolean;
    message?: string;
  } | null;
  const errorMessage = error?.isTimeout
    ? "A geração demorou mais que o esperado. Tente de novo."
    : error?.code === "AI_GENERATION_FAILED" ||
        error?.code === "AI_INVALID_OUTPUT"
      ? "Não foi possível gerar agora. Tente de novo em instantes."
      : error
        ? "Não foi possível gerar o planejamento. Verifique os dados e tente de novo."
        : "";

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Novo planejamento"
        subtitle={student?.name ?? "Planos com IA"}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!studentId ? (
          <>
            <Text style={styles.body}>Escolha o paciente para começar.</Text>
            <SelectField
              label="Paciente"
              value={null}
              onChange={(value) => {
                setStudentId(value);
                setTemplateId("");
                setDraft(null);
              }}
              options={(studentsQuery.data ?? []).map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </>
        ) : !student ? (
          <Text style={styles.error} accessibilityRole="alert">
            {studentsQuery.isError
              ? "Não foi possível carregar os pacientes."
              : studentsQuery.data
                ? "Paciente não encontrado."
                : "Carregando paciente…"}
          </Text>
        ) : (
          <>
            <SegmentedControl
              options={typeOptions}
              value={type}
              onChange={(value) => {
                setType(value as PlanType);
                setDraft(null);
              }}
              accessibilityLabel="Tipo de plano"
            />
            <Field
              label="Foco do planejamento"
              value={focus}
              onChangeText={(value) => {
                setFocus(value);
                setDraft(null);
              }}
              multiline
              maxLength={1000}
              placeholder="O que você deseja trabalhar?"
            />
            <AIContext text="Contexto conectado: dificuldades do paciente, PDI ativo e anamnese selecionada ajudam a gerar as metas. O rascunho não é salvo automaticamente." />
            <View style={styles.section}>
              <SectionTitle title="Dificuldades consideradas" />
              <CheckList
                options={student.learningTopics
                  .slice(0, 20)
                  .map((item) => ({ key: item, label: item }))}
                selected={difficulties}
                onChange={(value) => {
                  setDifficultySelection({ studentId, values: value });
                  setDraft(null);
                }}
              />
              {difficulties.length === 0 ? (
                <Text style={styles.error}>
                  Selecione pelo menos uma dificuldade.
                </Text>
              ) : null}
            </View>
            {type === "PDI" ? (
              <View style={styles.section}>
                <SectionTitle title="Duração de referência" />
                <SegmentedControl
                  options={durationOptions}
                  value={String(duration)}
                  onChange={(value) => {
                    setDuration(Number(value) as 3 | 6);
                    setDraft(null);
                  }}
                />
              </View>
            ) : (
              <>
                <DateField
                  label="Data da sessão"
                  value={sessionDate}
                  onChange={(value) => {
                    setSessionDate(value);
                    setDraft(null);
                  }}
                />
                {parent ? (
                  <Text style={styles.body}>
                    Baseado no PDI: {parent.title}
                  </Text>
                ) : null}
                {parentQuery.isError ? (
                  <Text style={styles.error}>
                    Não foi possível consultar o PDI ativo.
                  </Text>
                ) : null}
              </>
            )}
            {templateOptions.length > 0 ? (
              <SelectField
                label="Incluir anamnese"
                value={templateId || null}
                onChange={(value) => {
                  setTemplateId(value);
                  setDraft(null);
                }}
                options={[
                  { value: "", label: "Não incluir" },
                  ...templateOptions,
                ]}
              />
            ) : null}
            {generation.isPending ? (
              <Text style={styles.body} accessibilityLiveRegion="polite">
                Gerando o planejamento…
              </Text>
            ) : null}
            {error ? (
              <View style={styles.section}>
                <Text style={styles.error} accessibilityRole="alert">
                  {errorMessage}
                </Text>
                <DsButton
                  label="Tentar de novo"
                  variant="secondary"
                  onPress={() => {
                    if (lastInput) generation.mutate(lastInput);
                  }}
                />
              </View>
            ) : null}
            <DsButton
              label="Gerar planejamento com IA"
              icon="sparkles"
              fullWidth
              onPress={submit}
              disabled={!canGenerate}
              loading={generation.isPending}
            />
            {draft && lastInput ? (
              <DraftPreview
                key={draft.title + draft.suggestedStartDate}
                draft={draft}
                input={lastInput}
                onSaved={() => {
                  saved.current = true;
                }}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 40, gap: 18 },
  section: { gap: 10 },
  body: { ...typography.body, color: color.ink[950] },
  error: { ...typography.body, color: semanticColor.dangerTextOnSurface },
});
