import { useState, type ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getPlan,
  listPlanReviews,
  updateGoalStatus,
  updatePlan,
  createPlanReview,
  generatePlanSuggestions,
  updatePlanStatus,
} from "@/api/endpoints/plans";
import { ApiError } from "@/api/errors";
import type { GoalStatus, Plan, PlanReview } from "@/api/types";
import {
  AppHeader,
  Badge,
  DsButton,
  Field,
  ProgressBar,
  SectionTitle,
  SelectField,
  Toast,
  useToast,
} from "@/components/ds";
import {
  PlanForm,
  toPlanFormGoals,
  type PlanFormValues,
} from "@/features/plans/draft/PlanForm";
import { planQueryKeys } from "@/features/plans/hub/usePlans";
import { PLAN_SUGGESTIONS_ROUTE } from "@/features/plans/routes";
import { SuggestionCard } from "@/features/plans/suggestions/SuggestionCard";
import {
  usePendingSuggestions,
  useSuggestionActions,
} from "@/features/plans/suggestions/usePlanSuggestions";
import { useStudents } from "@/features/students/useStudents";
import { color, typography } from "@/theme";

const goalLabels: Record<GoalStatus, string> = {
  NOT_STARTED: "Não iniciada",
  IN_PROGRESS: "Em andamento",
  ACHIEVED: "Atingida",
  DISCONTINUED: "Descontinuada",
};
const goalOptions = Object.entries(goalLabels).map(([value, label]) => ({
  value,
  label,
}));
const statusLabels = {
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
} as const;
const conflictMessages: Record<string, string> = {
  PLAN_NOT_EDITABLE: "Este plano já foi encerrado.",
  GOAL_ACHIEVED_CANNOT_BE_REMOVED: "Uma meta atingida não pode ser removida.",
  DUPLICATE_GOAL_ID:
    "Há uma meta duplicada. Reabra a edição e tente novamente.",
  GOAL_NOT_FOUND: "Uma meta não foi encontrada. Atualize o plano.",
  INVALID_DATES: "A próxima revisão deve ficar dentro da vigência do plano.",
  PLAN_WITHOUT_GOALS: "Inclua pelo menos uma meta.",
  TOO_MANY_GOALS: "O plano aceita no máximo 10 metas.",
};
function displayDate(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}
function validDate(day: string, start: string, end: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === day &&
    day >= start &&
    day <= end
  );
}
const GENERATE_FAILURE_MESSAGE =
  "Não foi possível gerar agora. Tente de novo em instantes.";
function errorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  return code && conflictMessages[code]
    ? conflictMessages[code]
    : "Não foi possível salvar. Tente novamente.";
}

export function PlanDetailScreen(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const students = useStudents();
  const [mode, setMode] = useState<"view" | "edit" | "review" | "close">(
    "view",
  );
  const [note, setNote] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [localError, setLocalError] = useState("");
  const detailKey = [...planQueryKeys.all, "detail", id] as const;
  const reviewsKey = [...planQueryKeys.all, "reviews", id] as const;
  const planQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => getPlan(id),
    enabled: !!id,
  });
  const reviewsQuery = useQuery({
    queryKey: reviewsKey,
    queryFn: () => listPlanReviews(id),
    enabled: !!id && !!planQuery.data,
  });

  function acceptPlan(plan: Plan): void {
    queryClient.setQueryData(detailKey, plan);
    void queryClient.invalidateQueries({
      queryKey: planQueryKeys.all,
      refetchType: "none",
    });
    setLocalError("");
  }
  const goalMutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: GoalStatus }) =>
      updateGoalStatus(id, goalId, status),
    retry: false,
    onSuccess: acceptPlan,
  });
  const editMutation = useMutation({
    mutationFn: (input: Parameters<typeof updatePlan>[1]) =>
      updatePlan(id, input),
    retry: false,
    onSuccess: (plan) => {
      acceptPlan(plan);
      setMode("view");
    },
  });
  const reviewMutation = useMutation({
    mutationFn: (input: { note: string; nextReviewDate?: string }) =>
      createPlanReview(id, input),
    retry: false,
    onSuccess: (review: PlanReview) => {
      queryClient.setQueryData<PlanReview[]>(reviewsKey, (old = []) => [
        review,
        ...old,
      ]);
      void queryClient.invalidateQueries({
        queryKey: planQueryKeys.all,
        refetchType: "none",
      });
      if (review.nextReviewDate)
        queryClient.setQueryData<Plan>(detailKey, (old) =>
          old ? { ...old, nextReviewDate: review.nextReviewDate } : old,
        );
      setMode("view");
      setNote("");
      setReviewDate("");
      setLocalError("");
    },
  });
  const closeMutation = useMutation({
    mutationFn: (status: "COMPLETED" | "CANCELLED") =>
      updatePlanStatus(id, status),
    retry: false,
    onSuccess: (plan) => {
      acceptPlan(plan);
      setMode("view");
    },
  });

  const toast = useToast();
  const suggestionsQuery = usePendingSuggestions();
  const suggestionActions = useSuggestionActions();
  const [generateNotice, setGenerateNotice] = useState("");
  const [generateFailed, setGenerateFailed] = useState(false);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const generateMutation = useMutation({
    mutationFn: () => generatePlanSuggestions(id),
    retry: false,
    onMutate: () => {
      setGenerateNotice("");
      setGenerateFailed(false);
      setHasNewSuggestions(false);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: planQueryKeys.all });
      if (created.length === 0) {
        setGenerateNotice("Sem sugestões novas para este plano");
        return;
      }
      setHasNewSuggestions(true);
      toast.show(
        created.length === 1
          ? "1 sugestão nova"
          : `${created.length} sugestões novas`,
      );
    },
    onError: (generateError) => {
      setGenerateFailed(true);
      setGenerateNotice(
        (generateError as { code?: string }).code === "PLAN_NOT_EDITABLE"
          ? conflictMessages.PLAN_NOT_EDITABLE
          : GENERATE_FAILURE_MESSAGE,
      );
    },
  });

  const plan = planQuery.data;
  const planSuggestions =
    suggestionsQuery.data?.filter((item) => item.planId === id) ?? [];
  const error = planQuery.error as ApiError | null;
  if (!plan)
    return (
      <View style={styles.screen}>
        <AppHeader title="Detalhe do plano" onBack={() => router.back()} />
        <View style={styles.state}>
          {!planQuery.isError ? (
            <ActivityIndicator color={color.brand[500]} />
          ) : null}
          <Text style={styles.body}>
            {!planQuery.isError
              ? "Carregando plano..."
              : error?.status === 404
                ? "Plano não encontrado"
                : error?.status === 403
                  ? "Sem acesso a este plano"
                  : "Não foi possível carregar o plano."}
          </Text>
          {planQuery.isError ? (
            <DsButton
              label={
                error?.status === 404 || error?.status === 403
                  ? "Voltar"
                  : "Tentar de novo"
              }
              onPress={() =>
                error?.status === 404 || error?.status === 403
                  ? router.back()
                  : void planQuery.refetch()
              }
            />
          ) : null}
        </View>
      </View>
    );

  const active = plan.status === "ACTIVE";
  const patientName =
    students.data?.find((student) => student.id === plan.studentId)?.name ??
    "Paciente";
  const mutationError =
    goalMutation.error ??
    editMutation.error ??
    reviewMutation.error ??
    closeMutation.error;
  const shownError =
    localError || (mutationError ? errorMessage(mutationError) : "");
  // O erro aparece dentro do formulário aberto (edição ou revisão); fora dele
  // ficaria abaixo das sugestões, longe do botão e fora da tela.
  const errorText = shownError ? (
    <Text style={styles.error} accessibilityRole="alert">
      {shownError}
    </Text>
  ) : null;
  const formOpen = active && (mode === "edit" || mode === "review");
  const initial: PlanFormValues = {
    title: plan.title,
    generalObjective: plan.generalObjective,
    professionalNotes: plan.professionalNotes ?? "",
    goals: plan.goals.map((goal) => ({
      id: goal.id,
      description: goal.description,
      successCriterion: goal.successCriterion ?? "",
    })),
  };
  function submitEdit(values: PlanFormValues): void {
    if (!plan) return;
    if (plan.professionalNotes && !values.professionalNotes.trim()) {
      setLocalError("Informe as notas já registradas.");
      return;
    }
    const endDate = plan.type === "PDI" ? formEndDate : plan.endDate;
    if (
      plan.type === "PDI" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate <= plan.startDate)
    ) {
      setLocalError("A data final deve ser posterior ao início.");
      return;
    }
    if (formDate && !validDate(formDate, plan.startDate, endDate)) {
      setLocalError(
        "A próxima revisão deve ficar dentro da vigência do plano.",
      );
      return;
    }
    if (plan.nextReviewDate && !formDate) {
      setLocalError("Informe a próxima revisão já definida.");
      return;
    }
    editMutation.mutate({
      title: values.title.trim(),
      generalObjective: values.generalObjective.trim(),
      ...(values.professionalNotes.trim()
        ? { professionalNotes: values.professionalNotes.trim() }
        : {}),
      ...(plan.type === "PDI" ? { endDate } : {}),
      ...(formDate ? { nextReviewDate: formDate } : {}),
      goals: toPlanFormGoals(values.goals),
    });
  }
  function submitReview(): void {
    if (!plan) return;
    if (!note.trim() || note.length > 2000) {
      setLocalError("A nota deve ter entre 1 e 2000 caracteres.");
      return;
    }
    if (reviewDate && !validDate(reviewDate, plan.startDate, plan.endDate)) {
      setLocalError(
        "A próxima revisão deve ficar dentro da vigência do plano.",
      );
      return;
    }
    reviewMutation.mutate({
      note: note.trim(),
      ...(reviewDate ? { nextReviewDate: reviewDate } : {}),
    });
  }
  function confirmClose(status: "COMPLETED" | "CANCELLED"): void {
    Alert.alert("Encerrar plano?", "Não é possível reabrir o plano.", [
      { text: "Voltar", style: "cancel" },
      {
        text: "Confirmar",
        style: "destructive",
        onPress: () => closeMutation.mutate(status),
      },
    ]);
  }
  return (
    <View style={styles.screen}>
      <AppHeader title={plan.title} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>{patientName}</Text>
          <View style={styles.row}>
            <Badge label={plan.type} />
            <Badge
              label={statusLabels[plan.status]}
              variant={active ? "default" : "warning"}
            />
          </View>
          <Text style={styles.body}>
            Vigência: {displayDate(plan.startDate)} a{" "}
            {displayDate(plan.endDate)}
          </Text>
          {plan.nextReviewDate ? (
            <Text style={styles.body}>
              Próxima revisão: {displayDate(plan.nextReviewDate)}
            </Text>
          ) : null}
          <SectionTitle title="Objetivo geral" />
          <Text style={styles.body}>{plan.generalObjective}</Text>
          {plan.professionalNotes ? (
            <>
              <SectionTitle title="Notas do profissional" />
              <Text style={styles.body}>{plan.professionalNotes}</Text>
            </>
          ) : null}
        </View>
        {active && mode === "view" ? (
          <View style={styles.row}>
            <DsButton
              label="Editar plano"
              variant="secondary"
              onPress={() => {
                setFormDate(plan.nextReviewDate ?? "");
                setFormEndDate(plan.endDate);
                setLocalError("");
                setMode("edit");
              }}
            />
            <DsButton
              label="Registrar revisão"
              variant="secondary"
              onPress={() => {
                setLocalError("");
                setMode("review");
              }}
            />
            <DsButton
              label="Encerrar plano"
              variant="ghost"
              onPress={() => {
                setLocalError("");
                setMode("close");
              }}
            />
          </View>
        ) : null}
        {mode === "edit" && active ? (
          <View style={styles.card}>
            <SectionTitle title="Editar plano" />
            <PlanForm
              initial={initial}
              protectedGoalIds={plan.goals
                .filter((goal) => goal.status === "ACHIEVED")
                .map((goal) => goal.id)}
              submitLabel="Salvar alterações"
              submitting={editMutation.isPending}
              onSubmit={submitEdit}
            >
              {plan.type === "PDI" ? (
                <Field
                  label="Fim da vigência (AAAA-MM-DD)"
                  value={formEndDate}
                  onChangeText={setFormEndDate}
                  maxLength={10}
                />
              ) : null}
              <Field
                label="Próxima revisão (AAAA-MM-DD)"
                value={formDate}
                onChangeText={setFormDate}
                maxLength={10}
              />
            </PlanForm>
            {errorText}
            <DsButton
              label="Cancelar edição"
              variant="ghost"
              onPress={() => setMode("view")}
            />
          </View>
        ) : null}
        {mode === "review" && active ? (
          <View style={styles.card}>
            <SectionTitle title="Registrar revisão" />
            <Field
              label="Nota da revisão"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={2000}
            />
            <Field
              label="Próxima revisão (AAAA-MM-DD)"
              value={reviewDate}
              onChangeText={setReviewDate}
              maxLength={10}
            />
            {errorText}
            <DsButton
              label="Salvar revisão"
              loading={reviewMutation.isPending}
              onPress={submitReview}
            />
            <DsButton
              label="Cancelar revisão"
              variant="ghost"
              onPress={() => setMode("view")}
            />
          </View>
        ) : null}
        {mode === "close" && active ? (
          <View style={styles.card}>
            <SectionTitle title="Encerrar plano" />
            <Text style={styles.body}>
              Escolha o motivo de encerramento. Não é possível reabrir o plano.
            </Text>
            <DsButton
              label="Concluído"
              variant="secondary"
              onPress={() => confirmClose("COMPLETED")}
            />
            <DsButton
              label="Cancelado"
              variant="secondary"
              onPress={() => confirmClose("CANCELLED")}
            />
            <DsButton
              label="Voltar ao plano"
              variant="ghost"
              onPress={() => setMode("view")}
            />
          </View>
        ) : null}
        {active && mode === "view" ? (
          <View style={styles.card}>
            <SectionTitle title="Sugestões da IA" />
            <DsButton
              label={
                generateMutation.isPending
                  ? "Gerando sugestões…"
                  : "Pedir sugestões da IA"
              }
              variant="secondary"
              icon="sparkles"
              loading={generateMutation.isPending}
              disabled={generateMutation.isPending}
              onPress={() => generateMutation.mutate()}
            />
            {generateNotice ? (
              <Text
                style={generateFailed ? styles.error : styles.body}
                accessibilityRole={generateFailed ? "alert" : undefined}
              >
                {generateNotice}
              </Text>
            ) : null}
            {hasNewSuggestions ? (
              <DsButton
                label="Ver sugestões"
                variant="ghost"
                onPress={() => router.push(PLAN_SUGGESTIONS_ROUTE)}
              />
            ) : null}
            {suggestionActions.message ? (
              <Text style={styles.body} accessibilityRole="alert">
                {suggestionActions.message}
              </Text>
            ) : null}
            {planSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                busy={suggestionActions.busyId !== null}
                onAccept={() => void suggestionActions.accept(suggestion.id)}
                onDismiss={() => void suggestionActions.dismiss(suggestion.id)}
              />
            ))}
          </View>
        ) : null}
        {formOpen ? null : errorText}
        <View style={styles.card}>
          <SectionTitle title="Metas" />
          <Text style={styles.body}>
            {plan.progress.achievedGoals} de {plan.progress.totalGoals} metas
            atingidas
          </Text>
          <ProgressBar
            value={plan.progress.percent}
            accessibilityLabel={`Progresso do plano: ${plan.progress.percent}%`}
          />
          {plan.goals.map((goal, index) => (
            <View key={goal.id} style={styles.goal}>
              <Text style={styles.heading}>{goal.description}</Text>
              {goal.successCriterion ? (
                <Text style={styles.body}>
                  Critério de sucesso: {goal.successCriterion}
                </Text>
              ) : null}
              <Badge label={goalLabels[goal.status]} />
              {active ? (
                <SelectField
                  label={`Alterar status da meta ${index + 1}`}
                  value={goal.status}
                  options={goalOptions}
                  onChange={(status) =>
                    goalMutation.mutate({
                      goalId: goal.id,
                      status: status as GoalStatus,
                    })
                  }
                  disabled={goalMutation.isPending}
                />
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.card}>
          <SectionTitle title="Revisões" />
          {reviewsQuery.isError ? (
            <>
              <Text style={styles.error}>
                Não foi possível carregar as revisões.
              </Text>
              <DsButton
                label="Tentar de novo"
                onPress={() => {
                  void reviewsQuery.refetch();
                }}
              />
            </>
          ) : reviewsQuery.isPending ? (
            <ActivityIndicator color={color.brand[500]} />
          ) : reviewsQuery.data?.length ? (
            reviewsQuery.data.map((review) => (
              <View key={review.id} style={styles.goal}>
                <Text style={styles.heading}>
                  {displayDate(review.reviewedAt.slice(0, 10))}
                </Text>
                <Text style={styles.body}>{review.note}</Text>
                {review.nextReviewDate ? (
                  <Text style={styles.body}>
                    Próxima revisão: {displayDate(review.nextReviewDate)}
                  </Text>
                ) : null}
                {review.goalStatuses.map((snapshot) => (
                  <Text key={snapshot.goalId} style={styles.meta}>
                    {plan.goals.find((goal) => goal.id === snapshot.goalId)
                      ?.description ?? "Meta removida"}
                    : {goalLabels[snapshot.status]}
                  </Text>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.body}>Nenhuma revisão registrada.</Text>
          )}
        </View>
      </ScrollView>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 36, gap: 16 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
    gap: 12,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goal: {
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: 12,
    gap: 8,
  },
  heading: { ...typography.body, color: color.ink[950] },
  body: { ...typography.body, color: color.textSecondary },
  meta: { ...typography.tag, color: color.textSecondary },
  error: { ...typography.body, color: color.danger },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
});
