import { useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { ScaleApplicationSummary } from "@/api/types";
import { PendingBanner } from "@/components/PendingBanner";
import {
  AIHero,
  AppHeader,
  DsButton,
  InfoCard,
  SectionTitle,
} from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { applyRoute, resultRoute } from "@/features/assessments/routes";
import { useOnline } from "@/hooks/useOnline";
import { color, fontFamilies, semanticColor, shape, typography } from "@/theme";
import {
  applicationDate,
  selectActiveTemplates,
  selectBandBadge,
  templateDescription,
  toneForSeverity,
} from "./selectors";
import { useRecentApplications, useScaleTemplates } from "./useAssessmentsHub";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 36, gap: 22 },
  section: { gap: 10 },
  row: {
    gap: 8,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  rowTitle: { ...typography.body, color: color.text },
  rowMeta: { ...typography.tag, color: color.textSecondary },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  badgeLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
  },
  state: {
    minHeight: 120,
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

function ApplicationRow({
  application,
  onContinue,
  onOpen,
}: {
  application: ScaleApplicationSummary;
  onContinue: () => void;
  onOpen: () => void;
}): ReactElement {
  const badge = selectBandBadge(application);
  const isDraft = application.status === "DRAFT";
  const tone = badge ? toneForSeverity(badge.severity) : undefined;
  const meta = [
    application.templateName,
    applicationDate(application),
    isDraft ? "Rascunho" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const body = (
    <>
      <Text style={styles.rowTitle}>{application.studentName}</Text>
      <Text style={styles.rowMeta}>{meta}</Text>
      {badge && tone ? (
        <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
          <Text style={[styles.badgeLabel, { color: tone.color }]}>
            {badge.label}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (isDraft) {
    return (
      <View style={styles.row}>
        {body}
        <DsButton
          label="Continuar"
          variant="secondary"
          accessibilityLabel={`Continuar ${application.templateName} de ${application.studentName}`}
          onPress={onContinue}
        />
      </View>
    );
  }

  return (
    <StaticPressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${application.studentName}, ${meta}${badge ? `, ${badge.label}` : ""}`}
      style={styles.row}
    >
      {body}
    </StaticPressable>
  );
}

export interface AssessmentsHubScreenProps {
  /** Paciente já escolhido (ficha); segue para as telas de aplicar. */
  studentId?: string;
}

export function AssessmentsHubScreen({
  studentId,
}: AssessmentsHubScreenProps): ReactElement {
  const router = useRouter();
  const isOnline = useOnline();
  const scrollRef = useRef<ScrollView>(null);
  const [templatesY, setTemplatesY] = useState(0);
  const templatesQuery = useScaleTemplates();
  const applicationsQuery = useRecentApplications(studentId);
  const templates = templatesQuery.data;
  const applications = applicationsQuery.data;
  const isRefreshing =
    templatesQuery.isRefetching || applicationsQuery.isRefetching;

  const header = (
    <AppHeader
      title="Avaliações"
      subtitle="Escalas e aplicações"
      onBack={() => router.back()}
    />
  );

  const refetchAll = () => {
    void templatesQuery.refetch();
    void applicationsQuery.refetch();
  };

  if (!templates || !applications) {
    const isError = templatesQuery.isError || applicationsQuery.isError;

    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.state}>
          {isError ? null : (
            <ActivityIndicator color={semanticColor.primaryFill} />
          )}
          <Text style={styles.stateText}>
            {isError
              ? "Não foi possível carregar as avaliações."
              : "Carregando avaliações..."}
          </Text>
          {isError ? (
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={refetchAll}
            />
          ) : null}
        </View>
      </View>
    );
  }

  const activeTemplates = selectActiveTemplates(templates);
  // Atualização falhou, mas há dados antigos na tela; offline já tem o aviso próprio.
  const refreshFailed =
    isOnline && (templatesQuery.isError || applicationsQuery.isError);

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetchAll} />
        }
      >
        {!isOnline ? (
          <PendingBanner message="Sem conexão - mostrando dados salvos" />
        ) : null}
        {refreshFailed ? (
          <PendingBanner message="Não foi possível atualizar as avaliações. Mostrando dados salvos." />
        ) : null}
        <AIHero
          title="Nova aplicação"
          description="Aplique uma escala validada e acompanhe o resultado do paciente."
          action={{
            label: "Escolher escala",
            onPress: () =>
              scrollRef.current?.scrollTo?.({ y: templatesY, animated: true }),
          }}
        />
        <View
          style={styles.section}
          onLayout={(event) => setTemplatesY(event.nativeEvent.layout.y)}
        >
          <SectionTitle title="Modelos disponíveis" />
          {activeTemplates.length === 0 ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>
                Nenhuma escala disponível no momento
              </Text>
            </View>
          ) : (
            activeTemplates.map((template) => (
              <InfoCard
                key={template.id}
                icon="clipboard"
                title={template.name}
                description={templateDescription(template)}
                action={{
                  label: "Aplicar escala",
                  onPress: () =>
                    router.push(applyRoute(template.id, { studentId })),
                }}
              />
            ))
          )}
        </View>
        <View style={styles.section}>
          <SectionTitle title="Aplicações recentes" />
          {applications.length === 0 ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>Nenhuma aplicação ainda</Text>
            </View>
          ) : (
            applications.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                onContinue={() =>
                  router.push(
                    applyRoute(application.templateId, {
                      studentId: application.studentId,
                      applicationId: application.id,
                    }),
                  )
                }
                onOpen={() => router.push(resultRoute(application.id))}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
