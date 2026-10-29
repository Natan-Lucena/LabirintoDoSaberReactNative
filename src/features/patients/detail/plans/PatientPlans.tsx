import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { PlanStatus, PlanSummary } from "@/api/types";
import { DsButton, InfoCard, ProgressBar, SectionTitle } from "@/components/ds";
import { NEW_PLAN_ROUTE, planDetailRoute } from "@/features/plans/routes";
import { formatReviewDate } from "@/features/plans/hub/selectors";
import { color, typography } from "@/theme";

import { useActivePdi, usePatientPlans } from "./usePatientPlans";

const statusLabels: Record<PlanStatus, string> = {
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function planCreationRoute(studentId: string) {
  return { pathname: NEW_PLAN_ROUTE, params: { studentId } } as const;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  item: { gap: 8 },
  meta: { gap: 6, paddingHorizontal: 4 },
  barRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  bar: { flex: 1 },
  copy: { ...typography.body, color: color.ink[600] },
  small: { ...typography.tag, color: color.ink[600] },
  state: { alignItems: "center", gap: 12, padding: 20 },
});

function PlanItem({ plan }: { plan: PlanSummary }): ReactElement {
  const router = useRouter();
  const percent = plan.progress.percent;
  return (
    <View style={styles.item}>
      <InfoCard
        icon="clipboard"
        title={plan.title}
        description={`${plan.type} · ${statusLabels[plan.status]}`}
        accessibilityLabel={`Abrir plano ${plan.title}, ${plan.type}, ${statusLabels[plan.status]}, ${percent}%`}
        onPress={() => router.push(planDetailRoute(plan.id))}
      />
      <View style={styles.meta}>
        <View style={styles.barRow}>
          <View style={styles.bar}>
            <ProgressBar
              value={percent}
              accessibilityLabel={`Progresso de ${plan.title}: ${percent}%`}
            />
          </View>
          <Text style={styles.small}>{percent}%</Text>
        </View>
        {plan.nextReviewDate ? (
          <Text style={styles.small}>
            Próxima revisão: {formatReviewDate(plan.nextReviewDate)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function PatientPlans({
  patientId,
}: {
  patientId: string;
}): ReactElement {
  const router = useRouter();
  const query = usePatientPlans(patientId);
  const plans = query.data;
  const ordered = plans
    ? [
        ...plans.filter((plan) => plan.status === "ACTIVE"),
        ...plans.filter((plan) => plan.status !== "ACTIVE"),
      ]
    : [];

  return (
    <View style={styles.section}>
      {!plans ? (
        <View style={styles.state}>
          <Text style={styles.copy}>
            {query.isError
              ? "Não foi possível carregar os planos."
              : "Carregando planos..."}
          </Text>
          {query.isError ? (
            <DsButton
              label="Tentar de novo"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          ) : null}
        </View>
      ) : ordered.length ? (
        ordered.map((plan) => <PlanItem key={plan.id} plan={plan} />)
      ) : (
        <Text style={styles.copy}>Nenhum plano para este paciente</Text>
      )}
      <DsButton
        label="Criar novo plano"
        fullWidth
        onPress={() => router.push(planCreationRoute(patientId))}
      />
    </View>
  );
}

export function ActivePdi({ patientId }: { patientId: string }): ReactElement {
  const router = useRouter();
  const query = useActivePdi(patientId);
  const plan = query.data?.[0];

  return (
    <View style={styles.section}>
      <SectionTitle title="PDI vigente" />
      {!query.data ? (
        <View style={styles.state}>
          <Text style={styles.copy}>
            {query.isError
              ? "Não foi possível carregar o PDI vigente."
              : "Carregando PDI..."}
          </Text>
          {query.isError ? (
            <DsButton
              label="Tentar de novo"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          ) : null}
        </View>
      ) : plan ? (
        <View style={styles.section}>
          <InfoCard
            icon="clipboard"
            title={plan.title}
            description={`${formatCalendarDate(plan.startDate)} a ${formatCalendarDate(plan.endDate)}`}
          />
          <ProgressBar
            value={plan.progress.percent}
            accessibilityLabel={`Progresso do PDI: ${plan.progress.percent}%`}
          />
          <Text style={styles.copy}>
            {plan.progress.percent}% das metas atingidas
          </Text>
          <DsButton
            label="Ver plano completo"
            variant="secondary"
            onPress={() => router.push(planDetailRoute(plan.id))}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.copy}>Nenhum PDI ativo</Text>
          <DsButton
            label="Criar PDI"
            variant="secondary"
            onPress={() => router.push(planCreationRoute(patientId))}
          />
        </View>
      )}
    </View>
  );
}
