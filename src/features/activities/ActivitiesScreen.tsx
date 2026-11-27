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

import type { ListTaskCatalogParams } from "@/api/endpoints/task-catalog";
import { ApiError } from "@/api/errors";
import type { TaskCategory, TaskSummary } from "@/api/types";
import { AppHeader, Fab } from "@/components/ds";
import { ActivityCard } from "@/features/activities/components/ActivityCard";
import {
  CatalogFilters,
  useDebouncedValue,
  type CatalogFilterState,
} from "@/features/activities/components/CatalogFilters";
import { CatalogSection } from "@/features/activities/components/CatalogSection";
import { CreateContentSheet } from "@/features/activities/components/CreateContentSheet";
import { Pagination } from "@/features/activities/components/Pagination";
import { RecommendedCard } from "@/features/activities/components/RecommendedCard";
import {
  playDestination,
  taskDestination,
} from "@/features/activities/navigation";
import {
  filterByKind,
  filterBySearch,
  paginate,
  type ActivityFilterKey,
} from "@/features/activities/selectors";
import type { ActivityListItem } from "@/features/activities/types";
import { useActivitiesQuery } from "@/features/activities/useActivitiesData";
import {
  effectiveSearch,
  useActivityContextStudent,
  useRecommendedTasks,
  useTaskCatalog,
} from "@/features/activities/useCatalog";
import { color, fontFamilies, shape } from "@/theme";

export const KIND_OPTIONS = [
  { key: "all", label: "Todas" },
  { key: "interactive", label: "Interativas" },
  { key: "printable", label: "Imprimíveis" },
  { key: "notebook", label: "Cadernos" },
  { key: "group", label: "Grupos" },
];

const PREVIEW_LIMIT = 4;
const PAGE_LIMIT = 20;

/** Formato do catálogo para o chip escolhido (`all` = sem filtro). */
export function formatForKind(
  kind: string,
): ListTaskCatalogParams["format"] | undefined {
  if (kind === "interactive") return "INTERACTIVE";
  if (kind === "printable") return "PRINTABLE";
  return undefined;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 16, padding: 20, paddingBottom: 100 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  state: {
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
  contextChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: shape.radius.button,
    backgroundColor: color.brand[50],
  },
  contextLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
  fab: { position: "absolute", right: 20, bottom: 24 },
});

interface LegacyListProps {
  kind: ActivityFilterKey;
  category: string;
  search: string;
  onOpen: (item: ActivityListItem) => void;
}

/** Cadernos e grupos: lista e paginação do cliente, como antes da ATV-09. */
function LegacyList({
  kind,
  category,
  search,
  onOpen,
}: LegacyListProps): ReactElement {
  const { items, isPending, isError, refetch } = useActivitiesQuery();
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const kindItems = filterByKind(items ?? [], kind);
    const categoryItems =
      category === "all"
        ? kindItems
        : kindItems.filter((item) => item.category === category);
    return filterBySearch(categoryItems, search);
  }, [items, kind, category, search]);
  const { pageItems, totalPages } = paginate(filteredItems, page);

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
    <>
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
              onPress={() => onOpen(item)}
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
    </>
  );
}

export interface ActivitiesScreenProps {
  /** Paciente de contexto vindo da rota (ficha do paciente). */
  studentId?: string;
}

export function ActivitiesScreen({
  studentId: studentIdParam,
}: ActivitiesScreenProps = {}): ReactElement {
  const router = useRouter();
  const [filters, setFilters] = useState<CatalogFilterState>({
    search: "",
    kind: "all",
    skill: "all",
    category: "all",
  });
  const [isCreateVisible, setCreateVisible] = useState(false);
  const [clearedStudentId, setClearedStudentId] = useState<string>();
  const debouncedSearch = useDebouncedValue(filters.search);

  const isLegacy = filters.kind === "notebook" || filters.kind === "group";
  const context = useActivityContextStudent(studentIdParam);
  const contextId =
    context.studentId && context.studentId !== clearedStudentId
      ? context.studentId
      : undefined;
  const recommended = useRecommendedTasks(isLegacy ? undefined : contextId);

  // 404 STUDENT_NOT_FOUND ou 403: o paciente não vale como contexto.
  const contextRejected =
    recommended.error instanceof ApiError &&
    (recommended.error.status === 404 || recommended.error.status === 403);

  const baseParams: ListTaskCatalogParams = {
    ...(effectiveSearch(debouncedSearch)
      ? { search: effectiveSearch(debouncedSearch) }
      : {}),
    ...(formatForKind(filters.kind)
      ? { format: formatForKind(filters.kind) }
      : {}),
    ...(filters.skill !== "all" ? { skill: filters.skill } : {}),
    ...(filters.category !== "all"
      ? { category: filters.category as TaskCategory }
      : {}),
  };
  const hasFilters = Object.keys(baseParams).length > 0;
  const library = useTaskCatalog(
    { ...baseParams, source: "LIBRARY", limit: PREVIEW_LIMIT },
    !isLegacy,
  );
  const mine = useTaskCatalog(
    { ...baseParams, source: "EDUCATOR", limit: PAGE_LIMIT },
    !isLegacy,
  );

  function goToCatalogItem(item: TaskSummary) {
    router.push(taskDestination(item));
  }

  function startRecommended(item: TaskSummary) {
    router.push(
      item.format === "PRINTABLE"
        ? taskDestination(item)
        : playDestination(item.id),
    );
  }

  function seeAllLibrary() {
    router.push({
      pathname: "/activities/catalog",
      params: {
        source: "LIBRARY",
        ...(baseParams.search ? { search: baseParams.search } : {}),
        ...(baseParams.format ? { format: baseParams.format } : {}),
        ...(baseParams.skill ? { skill: baseParams.skill } : {}),
        ...(baseParams.category ? { category: baseParams.category } : {}),
      },
    } as unknown as Parameters<typeof router.push>[0]);
  }

  function goToLegacyDetail(item: ActivityListItem) {
    router.push(
      `/content/${item.kind}/${item.id}` as Parameters<typeof router.push>[0],
    );
  }

  function goToCreate(pathname: string) {
    setCreateVisible(false);
    router.push(pathname as Parameters<typeof router.push>[0]);
  }

  function clearContext() {
    setClearedStudentId(context.studentId);
    router.setParams({ studentId: undefined });
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Atividades"
        subtitle="Banco pedagógico"
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <CatalogFilters
          value={filters}
          onChange={setFilters}
          kindOptions={KIND_OPTIONS}
          showSkill={!isLegacy}
        />
        {isLegacy ? (
          <LegacyList
            key={`${filters.kind}|${filters.category}|${filters.search}`}
            kind={filters.kind as ActivityFilterKey}
            category={filters.category}
            search={filters.search}
            onOpen={goToLegacyDetail}
          />
        ) : (
          <>
            {contextId && context.firstName && !contextRejected ? (
              <>
                <Pressable
                  onPress={clearContext}
                  accessibilityRole="button"
                  accessibilityLabel={`Para: ${context.firstName}. Remover paciente`}
                  style={styles.contextChip}
                >
                  <Text style={styles.contextLabel}>
                    {`Para: ${context.firstName} ✕`}
                  </Text>
                </Pressable>
                {recommended.data ? (
                  <RecommendedCard
                    firstName={context.firstName}
                    items={recommended.data}
                    onStart={startRecommended}
                    onOpen={goToCatalogItem}
                  />
                ) : null}
              </>
            ) : null}
            <CatalogSection
              title="Atividades prontas"
              catalog={library}
              hasFilters={hasFilters}
              emptyTitle="Ainda não há atividades prontas."
              actionLabel="Ver todas"
              onActionPress={seeAllLibrary}
              onItemPress={goToCatalogItem}
            />
            <CatalogSection
              title="Minhas atividades"
              catalog={mine}
              hasFilters={hasFilters}
              emptyTitle="Você ainda não criou atividades."
              emptyMessage="Toque em + para criar ou duplique uma atividade pronta."
              onItemPress={goToCatalogItem}
              paginated
            />
          </>
        )}
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
