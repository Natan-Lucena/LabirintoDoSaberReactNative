// EVO-02 — hub "Evolução da sessão" (destino de Recursos): sessões sem
// evolução e evoluções recentes de todos os pacientes. Contrato PROVISÓRIO
// (ESPECIFICACAO-BACKEND §3).
import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppHeader, DsButton, InfoCard, SectionTitle } from "@/components/ds";
import { EvolutionSummaryCard } from "@/features/evolution/records/EvolutionSummaryCard";
import {
  evolutionRecordRoute,
  evolutionRoute,
} from "@/features/evolution/register/routes";
import { color, fontFamilies, semanticColor } from "@/theme";
import { usePendingEvolutions, useRecentEvolutions } from "./useEvolutionHub";

const FINISHED_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function Hint({ children }: { children: string }): ReactElement {
  return <Text style={styles.hint}>{children}</Text>;
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <View style={styles.block}>
      <Text style={styles.error} accessibilityRole="alert" accessible>
        {message}
      </Text>
      <DsButton
        label="Tentar novamente"
        variant="secondary"
        fullWidth
        onPress={onRetry}
      />
    </View>
  );
}

export function EvolutionHubScreen(): ReactElement {
  const router = useRouter();
  const pendingQuery = usePendingEvolutions();
  const recentQuery = useRecentEvolutions();
  const pending = pendingQuery.data;
  const recent = recentQuery.data;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Evolução da sessão" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.block}>
          <SectionTitle title="Sessões sem evolução" />
          {pendingQuery.isError && !pending ? (
            <ErrorState
              message="Não foi possível carregar as sessões sem evolução."
              onRetry={() => void pendingQuery.refetch()}
            />
          ) : !pending ? (
            <Hint>Carregando as sessões...</Hint>
          ) : pending.length === 0 ? (
            <Hint>Nenhuma sessão aguardando evolução.</Hint>
          ) : (
            pending.map((item) => (
              <InfoCard
                key={item.sessionId}
                icon="clipboard"
                title={item.studentName}
                description={`${item.sessionName} · ${FINISHED_FORMATTER.format(new Date(item.finishedAt))}`}
                accessibilityLabel={`Registrar evolução de ${item.studentName}, ${item.sessionName}`}
                onPress={() => router.push(evolutionRoute(item.sessionId))}
              />
            ))
          )}
        </View>

        <View style={styles.block}>
          <SectionTitle title="Evoluções recentes" />
          {recentQuery.isError && !recent ? (
            <ErrorState
              message="Não foi possível carregar as evoluções recentes."
              onRetry={() => void recentQuery.refetch()}
            />
          ) : !recent ? (
            <Hint>Carregando as evoluções...</Hint>
          ) : recent.length === 0 ? (
            <Hint>Nenhuma evolução registrada ainda.</Hint>
          ) : (
            recent.map((evolution) => (
              <EvolutionSummaryCard
                key={evolution.id}
                evolution={evolution}
                showStudent
                onPress={() => router.push(evolutionRecordRoute(evolution.id))}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 24 },
  block: { gap: 12 },
  hint: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
