import { useState, type ReactElement } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { getScaleTemplate, scaleQueryKeys } from "@/api/endpoints/scales";
import { AppHeader, DsButton } from "@/components/ds";
import { ASSESSMENTS_ROUTE } from "@/features/assessments/routes";
import { color, semanticColor } from "@/theme";
import { PatientPicker } from "./PatientPicker";
import { QuestionFlow } from "./QuestionFlow";
import { useScaleDraft } from "./useScaleDraft";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  state: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: { color: color.ink[600], fontSize: 14, textAlign: "center" },
});

export interface ApplyScaleScreenProps {
  templateId: string;
  /** Paciente já escolhido (ficha ou hub com paciente). */
  studentId?: string;
  /** Rascunho a retomar. */
  applicationId?: string;
}

function ApplyFlow({
  templateId,
  studentId,
  applicationId,
}: ApplyScaleScreenProps): ReactElement {
  const router = useRouter();
  const templateQuery = useQuery({
    queryKey: scaleQueryKeys.template(templateId),
    queryFn: () => getScaleTemplate(templateId),
  });
  const { state, retry } = useScaleDraft({
    templateId,
    studentId,
    applicationId,
  });
  const template = templateQuery.data;

  if (template && state.status === "ready") {
    return (
      <QuestionFlow
        template={template}
        initialApplication={state.application}
        onExit={() => router.back()}
        onFinishLater={() =>
          router.replace({
            pathname: ASSESSMENTS_ROUTE,
            params: studentId ? { studentId } : {},
          })
        }
      />
    );
  }

  const isError = templateQuery.isError || state.status === "error";

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Aplicar escala"
        subtitle="Avaliações"
        onBack={() => router.back()}
      />
      <View style={styles.state}>
        {isError ? null : (
          <ActivityIndicator color={semanticColor.primaryFill} />
        )}
        <Text style={styles.stateText}>
          {isError ? "Não foi possível abrir a escala." : "Abrindo a escala..."}
        </Text>
        {isError ? (
          <DsButton
            label="Tentar novamente"
            variant="secondary"
            onPress={() => {
              if (templateQuery.isError) void templateQuery.refetch();
              if (state.status === "error") retry();
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export function ApplyScaleScreen({
  templateId,
  studentId,
  applicationId,
}: ApplyScaleScreenProps): ReactElement {
  const router = useRouter();
  const [chosenStudentId, setChosenStudentId] = useState(studentId);

  // Sem paciente (e sem rascunho para retomar), pergunta antes de criar (AC-AVA-02-03).
  if (!chosenStudentId && !applicationId) {
    return (
      <PatientPicker
        onBack={() => router.back()}
        onConfirm={setChosenStudentId}
      />
    );
  }

  return (
    <ApplyFlow
      templateId={templateId}
      studentId={chosenStudentId}
      applicationId={applicationId}
    />
  );
}
