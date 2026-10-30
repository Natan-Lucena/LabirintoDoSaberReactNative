import type { ReactElement } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";

import { getPlan } from "@/api/endpoints/plans";
import { AppHeader, DsButton } from "@/components/ds";
import { planQueryKeys, usePlans } from "@/features/plans/hub/usePlans";
import { color, typography } from "@/theme";
import { SuggestionCard } from "./SuggestionCard";
import {
  usePendingSuggestions,
  useSuggestionActions,
} from "./usePlanSuggestions";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 36, gap: 16 },
  state: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  body: { ...typography.body, color: color.textSecondary },
});

export function PlanSuggestionsScreen(): ReactElement {
  const router = useRouter();
  const suggestions = usePendingSuggestions();
  const plans = usePlans();
  const actions = useSuggestionActions();
  const items = suggestions.data ?? [];
  // A lista de planos não traz as metas: busca o detalhe dos planos com
  // sugestão (mesma chave do detalhe do plano) para dizer qual meta muda.
  const planIds = [...new Set(items.map((item) => item.planId))];
  const planDetails = useQueries({
    queries: planIds.map((planId) => ({
      queryKey: [...planQueryKeys.all, "detail", planId],
      queryFn: () => getPlan(planId),
    })),
  });
  function goalDescription(planId: string, goalId?: string) {
    if (!goalId) return undefined;
    const plan = planDetails[planIds.indexOf(planId)]?.data;
    return plan?.goals.find((goal) => goal.id === goalId)?.description;
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Sugestões da IA" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {actions.message ? (
          <Text style={styles.body} accessibilityRole="alert">
            {actions.message}
          </Text>
        ) : null}
        {suggestions.isPending ? (
          <View style={styles.state}>
            <ActivityIndicator color={color.brand[500]} />
            <Text style={styles.body}>Carregando sugestões...</Text>
          </View>
        ) : suggestions.isError ? (
          <View style={styles.state}>
            <Text style={styles.body}>
              Não foi possível carregar as sugestões.
            </Text>
            <DsButton
              label="Tentar de novo"
              onPress={() => void suggestions.refetch()}
            />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.body}>Nenhuma sugestão para revisar</Text>
          </View>
        ) : (
          items.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              showContext
              goalDescription={goalDescription(
                suggestion.planId,
                suggestion.goalId,
              )}
              planTitle={
                plans.data?.find((plan) => plan.id === suggestion.planId)?.title
              }
              busy={actions.busyId !== null}
              onAccept={() => void actions.accept(suggestion.id)}
              onDismiss={() => void actions.dismiss(suggestion.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
