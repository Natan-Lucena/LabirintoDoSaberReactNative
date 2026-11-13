// EVO-02 — detalhe de uma evolução: critérios, registro, sugestão e metas
// atualizadas. "Editar" reabre o formulário da EVO-01 preenchido (modo de
// edição) sem sair da tela. Contrato PROVISÓRIO (ESPECIFICACAO-BACKEND §3).
import { useState, type ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { normalizeApiError } from "@/api/errors";
import type { EvolutionCriterion, SessionEvolution } from "@/api/types";
import { AppHeader, DsButton, SectionTitle } from "@/components/ds";
import { EvolutionEditForm } from "@/features/evolution/register/EvolutionEditForm";
import {
  criterionResultLabels,
  goalStatusLabels,
} from "@/features/evolution/register/schema";
import { color, fontFamilies, semanticColor, shape, typography } from "@/theme";
import { criteriaSummary, achievedCount, formatSessionDate } from "./format";
import { useEvolutionDetail } from "./useEvolutionRecords";

export interface EvolutionDetailScreenProps {
  evolutionId: string;
}

function attemptsText(criterion: EvolutionCriterion): string | null {
  const { attempts, successes } = criterion;
  if (attempts === undefined) return null;
  if (successes === undefined) {
    return `${attempts} ${attempts === 1 ? "tentativa" : "tentativas"}`;
  }
  return `${successes} de ${attempts} ${attempts === 1 ? "tentativa" : "tentativas"}`;
}

function loadErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.status === 404) return "Evolução não encontrada.";
  if (normalized.status === 403) return "Você não tem acesso a esta evolução.";
  return "Não foi possível carregar a evolução.";
}

export function EvolutionDetailScreen({
  evolutionId,
}: EvolutionDetailScreenProps): ReactElement {
  const router = useRouter();
  const query = useEvolutionDetail(evolutionId);
  const [editing, setEditing] = useState(false);
  const evolution = query.data;

  if (evolution && editing) {
    return (
      <EvolutionEditForm
        evolution={evolution}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Evolução da sessão"
        subtitle={
          evolution ? formatSessionDate(evolution.sessionDate) : undefined
        }
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {evolution ? (
          <EvolutionBody
            evolution={evolution}
            onEdit={() => setEditing(true)}
          />
        ) : query.isError ? (
          <View style={styles.block}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              {loadErrorMessage(query.error)}
            </Text>
            {normalizeApiError(query.error).status === undefined ||
            (normalizeApiError(query.error).status ?? 0) >= 500 ? (
              <DsButton
                label="Tentar novamente"
                variant="secondary"
                fullWidth
                onPress={() => void query.refetch()}
              />
            ) : null}
          </View>
        ) : (
          <Text style={styles.hint} accessibilityRole="progressbar">
            Carregando a evolução...
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EvolutionBody({
  evolution,
  onEdit,
}: {
  evolution: SessionEvolution;
  onEdit: () => void;
}): ReactElement {
  const goalName = (goalId: string): string =>
    evolution.criteria.find((criterion) => criterion.goalId === goalId)
      ?.description ?? "Meta do plano";

  return (
    <>
      <View style={styles.block}>
        <Text style={styles.title}>
          {evolution.planTitle
            ? evolution.planType
              ? `${evolution.planType} · ${evolution.planTitle}`
              : evolution.planTitle
            : "Sessão sem plano"}
        </Text>
        <Text style={styles.summary}>
          {criteriaSummary(
            achievedCount(evolution.criteria),
            evolution.criteria.length,
          )}
        </Text>
      </View>

      {evolution.criteria.length > 0 ? (
        <View style={styles.block}>
          <SectionTitle title="Critérios" />
          {evolution.criteria.map((criterion) => {
            const detail = attemptsText(criterion);
            return (
              <View key={criterion.id} style={styles.card}>
                <Text style={styles.cardTitle}>{criterion.description}</Text>
                {criterion.successCriterion ? (
                  <Text style={styles.caption}>
                    Critério de sucesso: {criterion.successCriterion}
                  </Text>
                ) : null}
                <Text style={styles.result}>
                  {criterionResultLabels[criterion.result]}
                </Text>
                {detail ? <Text style={styles.caption}>{detail}</Text> : null}
                {criterion.note ? (
                  <Text style={styles.body}>{criterion.note}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.block}>
        <SectionTitle title="Registro descritivo" />
        <Text style={styles.body}>{evolution.descriptiveRecord}</Text>
      </View>

      {evolution.nextSessionSuggestion ? (
        <View style={styles.block}>
          <SectionTitle title="Sugestão para a próxima sessão" />
          <Text style={styles.body}>{evolution.nextSessionSuggestion}</Text>
        </View>
      ) : null}

      {evolution.goalUpdates.length > 0 ? (
        <View style={styles.block}>
          <SectionTitle title="Metas atualizadas" />
          {evolution.goalUpdates.map((update) => (
            <View key={update.goalId} style={styles.card}>
              <Text style={styles.cardTitle}>{goalName(update.goalId)}</Text>
              <Text style={styles.result}>
                {goalStatusLabels[update.status]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <DsButton label="Editar" fullWidth onPress={onEdit} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16 },
  block: { gap: 12 },
  title: { ...typography.cardTitle, color: color.text },
  summary: {
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
    color: color.brand[700],
  },
  card: {
    gap: 6,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  cardTitle: { ...typography.cardTitle, color: color.text },
  result: {
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
    color: color.brand[700],
  },
  caption: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
    color: color.ink[600],
  },
  body: {
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    color: color.text,
  },
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
