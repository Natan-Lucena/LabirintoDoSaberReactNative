import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { DsButton, InfoCard, SectionTitle } from "@/components/ds";
import { formatResponseDate } from "@/features/anamnese/responses/answers";
import { useAnamneseResponses } from "@/features/anamnese/responses/useAnamneseResponses";
import { useRecentApplications } from "@/features/assessments/hub/useAssessmentsHub";
import {
  applicationDate,
  selectBandBadge,
} from "@/features/assessments/hub/selectors";
import {
  ASSESSMENTS_ROUTE,
  applyRoute,
  resultRoute,
} from "@/features/assessments/routes";
import { color, typography } from "@/theme";

export function PatientAssessments({
  patientId,
}: {
  patientId: string;
}): ReactElement {
  const router = useRouter();
  const applicationsQuery = useRecentApplications(patientId);
  const anamneseQuery = useAnamneseResponses(patientId);
  const lastAnamnese = [...(anamneseQuery.data ?? [])].sort((a, b) =>
    b.answeredAt.localeCompare(a.answeredAt),
  )[0];
  const applications = applicationsQuery.data ?? [];

  return (
    <View style={styles.section}>
      <SectionTitle title="Escalas aplicadas" />
      {applicationsQuery.isError && !applicationsQuery.data ? (
        <View style={styles.state}>
          <Text style={styles.copy}>Não foi possível carregar as escalas</Text>
          <DsButton
            label="Tentar novamente"
            onPress={() => void applicationsQuery.refetch()}
          />
        </View>
      ) : applicationsQuery.isPending ? (
        <Text style={styles.copy}>Carregando as escalas</Text>
      ) : applications.length === 0 ? (
        <Text style={styles.copy}>Nenhuma escala aplicada</Text>
      ) : (
        applications.map((application) => {
          const badge = selectBandBadge(application);
          const isDraft = application.status === "DRAFT";
          const description = [
            applicationDate(application),
            isDraft ? "Rascunho" : null,
            badge?.label ?? null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <InfoCard
              key={application.id}
              icon="clipboard"
              title={application.templateName}
              description={description}
              action={
                isDraft
                  ? {
                      label: "Continuar",
                      onPress: () =>
                        router.push(
                          applyRoute(application.templateId, {
                            studentId: patientId,
                            applicationId: application.id,
                          }),
                        ),
                    }
                  : {
                      label: "Ver resultado",
                      onPress: () => router.push(resultRoute(application.id)),
                    }
              }
            />
          );
        })
      )}

      <SectionTitle title="Anamnese" />
      {anamneseQuery.isError && !anamneseQuery.data ? (
        <Text style={styles.copy}>Não foi possível carregar a anamnese</Text>
      ) : anamneseQuery.isPending ? (
        <Text style={styles.copy}>Carregando a anamnese</Text>
      ) : lastAnamnese ? (
        <InfoCard
          icon="clipboard"
          title="Anamnese"
          description={`Última em ${formatResponseDate(lastAnamnese.answeredAt)}`}
          action={{
            label: "Ver síntese",
            onPress: () =>
              router.push({
                pathname: "/patients/[id]/anamnese-summary",
                params: { id: patientId, responseId: lastAnamnese.id },
              }),
          }}
        />
      ) : (
        <Text style={styles.copy}>Nenhuma anamnese</Text>
      )}

      <DsButton
        label="Nova avaliação"
        fullWidth
        onPress={() =>
          router.push({
            pathname: ASSESSMENTS_ROUTE,
            params: { studentId: patientId },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  copy: { ...typography.body, color: color.ink[600] },
  state: { alignItems: "center", gap: 12, padding: 20 },
});
