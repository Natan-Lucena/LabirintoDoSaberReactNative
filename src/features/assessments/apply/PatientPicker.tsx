import { useState, type ReactElement } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { AppHeader, Avatar, DsButton, SearchField } from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { useStudents } from "@/features/students/useStudents";
import { color, fontFamilies } from "@/theme";
import { normalizeForSearch } from "./selectors";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { flex: 1, padding: 20, gap: 14 },
  title: {
    color: color.text,
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 22,
    lineHeight: 28,
  },
  description: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  list: { flex: 1 },
  patient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 16,
    backgroundColor: color.surface,
  },
  patientSelected: {
    borderColor: color.brand[500],
    backgroundColor: color.brand[50],
  },
  patientCopy: { flex: 1 },
  patientName: {
    color: color.text,
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 15,
  },
  patientDetail: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
  },
});

export interface PatientPickerProps {
  onBack: () => void;
  onConfirm: (studentId: string) => void;
}

/** Escolha do paciente antes de iniciar a escala (AC-AVA-02-03). */
export function PatientPicker({
  onBack,
  onConfirm,
}: PatientPickerProps): ReactElement {
  const { data, isLoading, isError, refetch } = useStudents();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const normalizedQuery = normalizeForSearch(query);
  const students = (data ?? []).filter(
    (student) =>
      !normalizedQuery ||
      normalizeForSearch(student.name).includes(normalizedQuery),
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="Aplicar escala" subtitle="Avaliações" onBack={onBack} />
      <View style={styles.content}>
        <Text style={styles.title}>Escolha o paciente</Text>
        <Text style={styles.description}>
          Selecione quem vai responder a esta escala.
        </Text>
        <SearchField
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
          placeholder="Buscar paciente"
        />
        {isLoading ? (
          <Text style={styles.description}>Carregando pacientes...</Text>
        ) : null}
        {isError ? (
          <>
            <Text style={styles.description}>
              Não foi possível carregar os pacientes.
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void refetch()}
            />
          </>
        ) : null}
        {!isLoading && !isError ? (
          <FlatList
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            data={students}
            keyExtractor={(student) => student.id}
            ListEmptyComponent={
              <Text style={styles.description}>
                Nenhum paciente encontrado.
              </Text>
            }
            renderItem={({ item }) => (
              <StaticPressable
                onPress={() => setSelectedId(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                accessibilityState={{ selected: selectedId === item.id }}
                style={[
                  styles.patient,
                  selectedId === item.id && styles.patientSelected,
                ]}
              >
                <Avatar name={item.name} photoUrl={item.photoUrl} />
                <View style={styles.patientCopy}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientDetail}>{item.age} anos</Text>
                </View>
              </StaticPressable>
            )}
          />
        ) : null}
        <DsButton
          label="Começar escala"
          fullWidth
          disabled={!selectedId}
          onPress={() => {
            if (selectedId) onConfirm(selectedId);
          }}
        />
      </View>
    </View>
  );
}
