// EVO-02 — Prontuário do paciente: evoluções em ordem cronológica, da mais
// recente para a mais antiga. Contrato PROVISÓRIO (ESPECIFICACAO-BACKEND §3).
import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppHeader, DsButton } from "@/components/ds";
import { useStudents } from "@/features/students/useStudents";
import { color, fontFamilies, semanticColor } from "@/theme";
import { evolutionRecordRoute } from "../register/routes";
import { EvolutionSummaryCard } from "./EvolutionSummaryCard";
import { usePatientEvolutions } from "./useEvolutionRecords";

export interface PatientRecordsScreenProps {
  patientId: string;
}

export function PatientRecordsScreen({
  patientId,
}: PatientRecordsScreenProps): ReactElement {
  const router = useRouter();
  const studentsQuery = useStudents();
  const evolutionsQuery = usePatientEvolutions(patientId);
  const patientName = studentsQuery.data?.find(
    (student) => student.id === patientId,
  )?.name;
  const evolutions = evolutionsQuery.data;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Prontuário"
        subtitle={patientName}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {evolutionsQuery.isError && !evolutions ? (
          <View style={styles.state}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              Não foi possível carregar o prontuário.
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              fullWidth
              onPress={() => void evolutionsQuery.refetch()}
            />
          </View>
        ) : !evolutions ? (
          <Text style={styles.hint} accessibilityRole="progressbar">
            Carregando o prontuário...
          </Text>
        ) : evolutions.length === 0 ? (
          <Text style={styles.hint}>
            Nenhuma evolução registrada para este paciente.
          </Text>
        ) : (
          evolutions.map((evolution) => (
            <EvolutionSummaryCard
              key={evolution.id}
              evolution={evolution}
              onPress={() => router.push(evolutionRecordRoute(evolution.id))}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 12 },
  state: { gap: 12 },
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
