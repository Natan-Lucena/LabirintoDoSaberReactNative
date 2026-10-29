import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { PlanStatus, PlanSummary } from "@/api/types";
import { PendingBanner } from "@/components/PendingBanner";
import {
  AIHero,
  AppHeader,
  DsButton,
  FilterRow,
  InfoCard,
  ProgressBar,
  SectionTitle,
} from "@/components/ds";
import { NEW_PLAN_ROUTE, planDetailRoute } from "@/features/plans/routes";
import { useOnline } from "@/hooks/useOnline";
import { color, semanticColor, typography } from "@/theme";
import { usePlans } from "./usePlans";
import {
  formatReviewDate,
  planTypeLabel,
  selectPlanSections,
  type PlanTypeFilter,
} from "./selectors";

const filterOptions: { key: PlanTypeFilter; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "PDI", label: "PDI" },
  { key: "PE", label: "PE" },
];

const closedStatusLabel: Partial<Record<PlanStatus, string>> = {
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 36, gap: 22 },
  section: { gap: 10 },
  item: { gap: 8 },
  meta: { gap: 6, paddingHorizontal: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bar: { flex: 1 },
  percent: { ...typography.tag, color: color.textSecondary },
  review: { ...typography.tag, color: color.textSecondary },
  state: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    ...typography.body,
    color: color.textSecondary,
    textAlign: "center",
  },
});

function PlanItem({
  plan,
  onPress,
}: {
  plan: PlanSummary;
  onPress: () => void;
}): ReactElement {
  const { percent } = plan.progress;
  const closedLabel = closedStatusLabel[plan.status];
  const description = [planTypeLabel[plan.type], plan.title, closedLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.item}>
      <InfoCard
        icon="clipboard"
        title={plan.studentName}
        description={description}
        onPress={onPress}
        accessibilityLabel={`${plan.studentName}, ${description}, ${percent}% concluído`}
      />
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <View style={styles.bar}>
            <ProgressBar
              value={percent}
              accessibilityLabel={`Progresso de ${plan.studentName}: ${percent}%`}
            />
          </View>
          <Text style={styles.percent}>{`${percent}%`}</Text>
        </View>
        {plan.nextReviewDate ? (
          <Text style={styles.review}>
            {`Próxima revisão: ${formatReviewDate(plan.nextReviewDate)}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function PlansHubScreen(): ReactElement {
  const router = useRouter();
  const isOnline = useOnline();
  const [filter, setFilter] = useState<PlanTypeFilter>("ALL");
  const plansQuery = usePlans();
  const plans = plansQuery.data;

  if (!plans) {
    const isError = plansQuery.isError;

    return (
      <View style={styles.screen}>
        <AppHeader
          title="Planos com IA"
          subtitle="PDI e planejamento educacional"
          onBack={() => router.back()}
        />
        <View style={styles.state}>
          {isError ? null : (
            <ActivityIndicator color={semanticColor.primaryFill} />
          )}
          <Text style={styles.stateText}>
            {isError
              ? "Não foi possível carregar os planos."
              : "Carregando planos..."}
          </Text>
          {isError ? (
            <>
              <Text style={styles.stateText}>
                Verifique sua conexão e tente novamente.
              </Text>
              <DsButton
                label="Tentar de novo"
                variant="secondary"
                onPress={() => {
                  void plansQuery.refetch();
                }}
              />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  const { active, closed } = selectPlanSections(plans, filter);
  const isEmpty = plans.length === 0;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Planos com IA"
        subtitle="PDI e planejamento educacional"
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isOnline ? (
          <PendingBanner message="Sem conexão - mostrando dados salvos" />
        ) : null}
        <AIHero
          title="Planejamento conectado à evolução real"
          description="Crie PDIs e planos de sessão a partir do histórico do paciente, com metas que acompanham a evolução."
          action={{
            label: "Criar novo plano",
            onPress: () => router.push(NEW_PLAN_ROUTE),
          }}
        />
        {isEmpty ? (
          <View style={styles.state}>
            <Text style={styles.stateText}>Nenhum plano ainda</Text>
          </View>
        ) : (
          <>
            <FilterRow
              options={filterOptions}
              value={filter}
              onChange={(key) => setFilter(key as PlanTypeFilter)}
            />
            {active.length === 0 && closed.length === 0 ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>
                  Nenhum plano deste tipo ainda
                </Text>
              </View>
            ) : null}
            {active.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Em andamento" />
                {active.map((plan) => (
                  <PlanItem
                    key={plan.id}
                    plan={plan}
                    onPress={() => router.push(planDetailRoute(plan.id))}
                  />
                ))}
              </View>
            ) : null}
            {closed.length > 0 ? (
              <View style={styles.section}>
                <SectionTitle title="Encerrados" />
                {closed.map((plan) => (
                  <PlanItem
                    key={plan.id}
                    plan={plan}
                    onPress={() => router.push(planDetailRoute(plan.id))}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
