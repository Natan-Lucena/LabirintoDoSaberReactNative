import type { ReactElement } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { DsButton } from "@/components/ds";
import { useStudents } from "@/features/students/useStudents";
import { PatientFormScreen } from "@/features/patients/form/PatientFormScreen";
import { color, typography } from "@/theme";

export default function EditPatientRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const students = useStudents();
  const patient = students.data?.find((student) => student.id === id);
  if (students.isPending && !students.data)
    return (
      <View style={styles.state}>
        <Text style={styles.text}>Carregando paciente</Text>
      </View>
    );
  if (students.isError && !students.data)
    return (
      <View style={styles.state}>
        <Text style={styles.text}>Não foi possível carregar o paciente</Text>
        <DsButton
          label="Tentar novamente"
          onPress={() => void students.refetch()}
        />
      </View>
    );
  if (!patient)
    return (
      <View style={styles.state}>
        <Text style={styles.text}>Paciente não encontrado</Text>
        <DsButton label="Voltar" onPress={router.back} />
      </View>
    );
  return <PatientFormScreen patient={patient} />;
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: color.surfaceSoft,
  },
  text: { ...typography.body, color: color.ink[600], textAlign: "center" },
});
