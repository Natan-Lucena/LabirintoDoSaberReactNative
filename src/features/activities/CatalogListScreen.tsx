// "Ver todas" do banco de atividades (ATV-09): grade completa de uma origem
// (biblioteca ou do educador) com os mesmos filtros e "Carregar mais".
import type { ReactElement } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import type { ListTaskCatalogParams } from "@/api/endpoints/task-catalog";
import type { TaskCategory, TaskSource } from "@/api/types";
import { AppHeader } from "@/components/ds";
import {
  CatalogFilters,
  useDebouncedValue,
  type CatalogFilterState,
} from "@/features/activities/components/CatalogFilters";
import { CatalogSection } from "@/features/activities/components/CatalogSection";
import { taskDestination } from "@/features/activities/navigation";
import {
  effectiveSearch,
  useTaskCatalog,
} from "@/features/activities/useCatalog";
import { color } from "@/theme";

const KIND_OPTIONS = [
  { key: "all", label: "Todas" },
  { key: "interactive", label: "Interativas" },
  { key: "printable", label: "Imprimíveis" },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 16, padding: 20, paddingBottom: 40 },
});

export interface CatalogListScreenProps {
  source: TaskSource;
  initialSearch?: string;
  initialFormat?: string;
  initialSkill?: string;
  initialCategory?: string;
}

export function CatalogListScreen({
  source,
  initialSearch,
  initialFormat,
  initialSkill,
  initialCategory,
}: CatalogListScreenProps): ReactElement {
  const router = useRouter();
  const [filters, setFilters] = useState<CatalogFilterState>({
    search: initialSearch ?? "",
    kind:
      initialFormat === "INTERACTIVE"
        ? "interactive"
        : initialFormat === "PRINTABLE"
          ? "printable"
          : "all",
    skill: initialSkill ?? "all",
    category: initialCategory ?? "all",
  });
  const search = effectiveSearch(useDebouncedValue(filters.search));

  const params: ListTaskCatalogParams = {
    source,
    limit: 20,
    ...(search ? { search } : {}),
    ...(filters.kind === "interactive" ? { format: "INTERACTIVE" } : {}),
    ...(filters.kind === "printable" ? { format: "PRINTABLE" } : {}),
    ...(filters.skill !== "all" ? { skill: filters.skill } : {}),
    ...(filters.category !== "all"
      ? { category: filters.category as TaskCategory }
      : {}),
  };
  const catalog = useTaskCatalog(params);
  const title =
    source === "LIBRARY" ? "Atividades prontas" : "Minhas atividades";

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <AppHeader
        title={title}
        subtitle="Banco pedagógico"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <CatalogFilters
          value={filters}
          onChange={setFilters}
          kindOptions={KIND_OPTIONS}
        />
        <CatalogSection
          title={title}
          catalog={catalog}
          hasFilters={Object.keys(params).length > 2}
          emptyTitle={
            source === "LIBRARY"
              ? "Ainda não há atividades prontas."
              : "Você ainda não criou atividades."
          }
          onItemPress={(item) => router.push(taskDestination(item))}
          paginated
        />
      </ScrollView>
    </SafeAreaView>
  );
}
