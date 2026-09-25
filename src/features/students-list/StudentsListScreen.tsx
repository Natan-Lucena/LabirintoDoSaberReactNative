import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Student } from "@/api/types";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { useStudents } from "@/features/students/useStudents";
import { Pagination } from "@/features/students-list/components/Pagination";
import { StudentCard } from "@/features/students-list/components/StudentCard";
import {
  filterBySearch,
  paginate,
  sortByNameAsc,
} from "@/features/students-list/selectors";
import { color, typography } from "@/theme";

function navigate(router: ReturnType<typeof useRouter>, pathname: string) {
  router.push(pathname as Parameters<typeof router.push>[0]);
}

export function StudentsListScreen(): ReactElement {
  const router = useRouter();
  const { data: students, isPending, isError, refetch } = useStudents();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sortedStudents = useMemo(
    () => (students ? sortByNameAsc(students) : []),
    [students],
  );

  const filteredStudents = useMemo(
    () => filterBySearch(sortedStudents, search),
    [sortedStudents, search],
  );

  const { pageItems, totalPages } = useMemo(
    () => paginate(filteredStudents, page),
    [filteredStudents, page],
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function goToStudent(student: Student) {
    navigate(router, `/students/${student.id}`);
  }

  if (isPending && !students) {
    return (
      <Screen style={styles.state}>
        <LoadingState label="Carregando Alunos" />
      </Screen>
    );
  }

  if (isError && !students) {
    return (
      <Screen style={styles.state}>
        <ErrorState
          message="Não foi possível carregar os alunos."
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.content}>
      <View style={styles.createRow}>
        <Pressable
          onPress={() => navigate(router, "/students/new")}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar Aluno"
        >
          <Text style={styles.createLabel}>+ Cadastrar Aluno</Text>
        </Pressable>
      </View>
      <SearchField
        value={search}
        onChangeText={handleSearchChange}
        onClear={() => handleSearchChange("")}
        placeholder="Buscar aluno por nome..."
      />
      <Text style={styles.count}>
        Alunos organizados em ordem alfabética ({filteredStudents.length}{" "}
        alunos)
      </Text>
      {pageItems.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          message="Ajuste a busca ou cadastre um novo aluno."
        />
      ) : (
        <View style={styles.list}>
          {pageItems.map((student, index) => (
            <StudentCard
              key={student.id}
              student={student}
              index={index}
              onPress={goToStudent}
            />
          ))}
        </View>
      )}
      {filteredStudents.length > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  state: { flex: 1, justifyContent: "center" },
  createRow: { flexDirection: "row", justifyContent: "flex-end" },
  createLabel: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
    color: color.accent,
  },
  count: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
  list: { gap: 12 },
});
