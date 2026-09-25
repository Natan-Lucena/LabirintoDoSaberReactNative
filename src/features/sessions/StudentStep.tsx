import type { ReactElement } from "react";
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FooterActions } from "@/components/FooterActions";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { StepIndicator } from "@/components/StepIndicator";
import { StudentRow } from "@/features/students/StudentRow";
import { useStudents } from "@/features/students/useStudents";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, typography } from "@/theme";
import type { Student } from "@/api/types";

export function normalizeForSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function StudentStep(): ReactElement {
  const router = useRouter();
  const { selectStudent, cancel } = useSessionFlowStore();
  const { data, isLoading, isError, refetch } = useStudents();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  const students = data ?? [];
  const normalizedQuery = normalizeForSearch(query);
  const filtered = normalizedQuery
    ? students.filter((student) =>
        normalizeForSearch(student.name).includes(normalizedQuery),
      )
    : students;

  async function handleBack() {
    await cancel();
    router.back();
  }

  async function handleNext() {
    if (!selected) {
      return;
    }
    await selectStudent(selected);
    router.push("/session/content");
  }

  return (
    <Screen>
      <View
        accessible
        accessibilityLabel="Passo 1"
        style={styles.stepIndicator}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <StepIndicator totalSteps={1} currentStep={1} />
        </View>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Escolha o aluno que participará desta sessão
      </Text>
      <SearchField
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        placeholder="Buscar Aluno..."
      />
      {isLoading ? (
        <LoadingState label="Carregando alunos" />
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar os alunos."
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          message={
            students.length === 0
              ? "Nenhum aluno cadastrado."
              : "Nenhum aluno corresponde à busca."
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(student) => student.id}
          renderItem={({ item }) => (
            <StudentRow
              student={item}
              selected={selected?.id === item.id}
              onPress={setSelected}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      <FooterActions
        onBack={handleBack}
        onPrimary={handleNext}
        primaryLabel="Próximo Passo"
        primaryDisabled={!selected}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepIndicator: { marginBottom: 12 },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    marginBottom: 12,
  },
  separator: { height: 8 },
});
