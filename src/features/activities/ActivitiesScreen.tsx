import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FilterChips } from "@/components/FilterChips";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { ActivityCard } from "@/features/activities/components/ActivityCard";
import { CreateContentSheet } from "@/features/activities/components/CreateContentSheet";
import { Pagination } from "@/features/activities/components/Pagination";
import {
  KIND_LABELS,
  filterByKind,
  filterBySearch,
  paginate,
  type ActivityFilterKey,
} from "@/features/activities/selectors";
import { useActivitiesQuery } from "@/features/activities/useActivitiesData";
import { color, typography } from "@/theme";

const FILTER_OPTIONS: { key: ActivityFilterKey; label: string }[] = [
  { key: "all", label: "Ver Tudo" },
  { key: "notebook", label: "Cadernos" },
  { key: "group", label: "Grupos" },
  { key: "task", label: "Atividades" },
];

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
  list: { gap: 12 },
});

export function ActivitiesScreen(): ReactElement {
  const router = useRouter();
  const { items, isPending, isError, refetch } = useActivitiesQuery();
  const [filter, setFilter] = useState<ActivityFilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateVisible, setCreateVisible] = useState(false);

  const filteredItems = useMemo(() => {
    if (!items) {
      return [];
    }
    return filterBySearch(filterByKind(items, filter), search);
  }, [items, filter, search]);

  const { pageItems, totalPages } = useMemo(
    () => paginate(filteredItems, page),
    [filteredItems, page],
  );

  function handleFilterChange(key: string) {
    setFilter(key as ActivityFilterKey);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openComingSoon(kind: keyof typeof KIND_LABELS) {
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: KIND_LABELS[kind] },
    });
  }

  function goToCreate(pathname: string) {
    setCreateVisible(false);
    router.push(pathname as Parameters<typeof router.push>[0]);
  }

  if (isPending && !items) {
    return (
      <Screen style={styles.state}>
        <LoadingState label="Carregando Atividades" />
      </Screen>
    );
  }

  if (isError && !items) {
    return (
      <Screen style={styles.state}>
        <ErrorState
          message="Não foi possível carregar as atividades."
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.content}>
      <View style={styles.createRow}>
        <Pressable
          onPress={() => setCreateVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Criar novo conteúdo"
        >
          <Text style={styles.createLabel}>+ Criar novo conteúdo</Text>
        </Pressable>
      </View>
      <SearchField
        value={search}
        onChangeText={handleSearchChange}
        onClear={() => handleSearchChange("")}
        placeholder="Buscar por nome..."
      />
      <FilterChips
        options={FILTER_OPTIONS}
        selected={[filter]}
        onToggle={handleFilterChange}
      />
      {pageItems.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo encontrado"
          message="Ajuste a busca ou o filtro selecionado."
        />
      ) : (
        <View style={styles.list}>
          {pageItems.map((item) => (
            <ActivityCard
              key={`${item.kind}-${item.id}`}
              item={item}
              onPress={() => openComingSoon(item.kind)}
            />
          ))}
        </View>
      )}
      {filteredItems.length > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      ) : null}
      <CreateContentSheet
        visible={isCreateVisible}
        onClose={() => setCreateVisible(false)}
        options={[
          {
            key: "notebook",
            label: "Caderno",
            onPress: () => goToCreate("/content/new-notebook"),
          },
          {
            key: "group",
            label: "Grupo",
            onPress: () => goToCreate("/content/new-group"),
          },
          {
            key: "task",
            label: "Atividade",
            onPress: () => goToCreate("/content/new-task"),
          },
        ]}
      />
    </Screen>
  );
}
