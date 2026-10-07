import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AppHeader,
  Fab,
  FilterRow,
  SearchField,
  SectionTitle,
} from "@/components/ds";
import { ActivityCard } from "@/features/activities/components/ActivityCard";
import { CreateContentSheet } from "@/features/activities/components/CreateContentSheet";
import { Pagination } from "@/features/activities/components/Pagination";
import {
  CATEGORY_LABELS,
  filterByKind,
  filterBySearch,
  paginate,
  type ActivityFilterKey,
} from "@/features/activities/selectors";
import type { ActivityListItem } from "@/features/activities/types";
import { useActivitiesQuery } from "@/features/activities/useActivitiesData";
import { color, fontFamilies, shape } from "@/theme";

const KIND_OPTIONS = [
  { key: "all", label: "Todas" },
  { key: "task", label: "Atividades" },
  { key: "group", label: "Grupos" },
  { key: "notebook", label: "Cadernos" },
];

const CATEGORY_OPTIONS = [
  { key: "all", label: "Todas as categorias" },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 16, padding: 20, paddingBottom: 100 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  stateTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
    textAlign: "center",
  },
  stateMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
    textAlign: "center",
  },
  retry: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: shape.radius.button,
    backgroundColor: color.brand[50],
  },
  retryLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
  fab: { position: "absolute", right: 20, bottom: 24 },
});

export function ActivitiesScreen(): ReactElement {
  const router = useRouter();
  const { items, isPending, isError, refetch } = useActivitiesQuery();
  const [kindFilter, setKindFilter] = useState<ActivityFilterKey>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateVisible, setCreateVisible] = useState(false);

  const filteredItems = useMemo(() => {
    const kindItems = filterByKind(items ?? [], kindFilter);
    const categoryItems =
      categoryFilter === "all"
        ? kindItems
        : kindItems.filter((item) => item.category === categoryFilter);
    return filterBySearch(categoryItems, search);
  }, [items, kindFilter, categoryFilter, search]);
  const { pageItems, totalPages } = paginate(filteredItems, page);

  function handleKindFilterChange(key: string) {
    setKindFilter(key as ActivityFilterKey);
    setPage(1);
  }

  function handleCategoryFilterChange(key: string) {
    setCategoryFilter(key);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function goToDetail(item: ActivityListItem) {
    router.push(
      `/content/${item.kind}/${item.id}` as Parameters<typeof router.push>[0],
    );
  }

  function goToCreate(pathname: string) {
    setCreateVisible(false);
    router.push(pathname as Parameters<typeof router.push>[0]);
  }

  if (isPending && !items) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={color.brand[700]} />
        <Text style={styles.stateTitle}>Carregando Atividades</Text>
      </View>
    );
  }

  if (isError && !items) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>
          Não foi possível carregar as atividades.
        </Text>
        <Text style={styles.stateMessage}>
          Verifique sua conexão e tente novamente.
        </Text>
        <Pressable
          onPress={() => void refetch()}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          style={styles.retry}
        >
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Atividades"
        subtitle="Banco pedagógico"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SearchField
          value={search}
          onChangeText={handleSearchChange}
          onClear={() => handleSearchChange("")}
          placeholder="Buscar por habilidade ou tema"
        />
        <FilterRow
          options={KIND_OPTIONS}
          value={kindFilter}
          onChange={handleKindFilterChange}
        />
        <FilterRow
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={handleCategoryFilterChange}
        />
        <SectionTitle
          title="Atividades prontas"
          actionLabel="Ver todas"
          onActionPress={() => {
            setKindFilter("all");
            setCategoryFilter("all");
            setPage(1);
          }}
        />
        {pageItems.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Nenhum conteúdo encontrado</Text>
            <Text style={styles.stateMessage}>
              Ajuste a busca ou os filtros selecionados.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {pageItems.map((item) => (
              <ActivityCard
                key={`${item.kind}-${item.id}`}
                item={item}
                onPress={() => goToDetail(item)}
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
      </ScrollView>
      <View style={styles.fab}>
        <Fab
          onPress={() => setCreateVisible(true)}
          accessibilityLabel="Criar"
        />
      </View>
      <CreateContentSheet
        visible={isCreateVisible}
        onClose={() => setCreateVisible(false)}
        options={[
          {
            key: "task",
            label: "Atividade",
            onPress: () => goToCreate("/content/new-task"),
          },
          {
            key: "ai",
            label: "Atividade com IA",
            onPress: () => goToCreate("/content/new-task-ai"),
          },
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
        ]}
      />
    </View>
  );
}
