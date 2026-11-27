import type { ReactElement } from "react";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { onlineManager } from "@tanstack/react-query";

import type { TaskSummary } from "@/api/types";
import { DsButton, SectionTitle } from "@/components/ds";
import { CatalogTaskCard } from "@/features/activities/components/CatalogTaskCard";
import type { UseTaskCatalogResult } from "@/features/activities/useCatalog";
import { color, fontFamilies } from "@/theme";

export interface CatalogSectionProps {
  title: string;
  catalog: UseTaskCatalogResult;
  onItemPress: (item: TaskSummary) => void;
  actionLabel?: string;
  onActionPress?: () => void;
  /** Há busca ou filtro ativo (muda o texto do vazio). */
  hasFilters: boolean;
  /** Texto do vazio sem filtro. */
  emptyTitle: string;
  emptyMessage?: string;
  /** Mostra "Carregar mais" quando houver `nextCursor`. */
  paginated?: boolean;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  state: { alignItems: "center", gap: 10, paddingVertical: 12 },
  stateTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
    textAlign: "center",
  },
  stateMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
    textAlign: "center",
  },
});

export function CatalogSection({
  title,
  catalog,
  onItemPress,
  actionLabel,
  onActionPress,
  hasFilters,
  emptyTitle,
  emptyMessage,
  paginated = false,
}: CatalogSectionProps): ReactElement {
  const [offlineNotice, setOfflineNotice] = useState(false);

  function handleLoadMore() {
    if (!onlineManager.isOnline()) {
      setOfflineNotice(true);
      return;
    }
    setOfflineNotice(false);
    catalog.loadMore();
  }

  let body: ReactElement;
  if (catalog.isPending) {
    body = (
      <View style={styles.state}>
        <ActivityIndicator color={color.brand[700]} />
        <Text style={styles.stateMessage}>Carregando atividades</Text>
      </View>
    );
  } else if (catalog.isError) {
    body = (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>
          Não foi possível carregar as atividades.
        </Text>
        <DsButton
          label="Tentar novamente"
          variant="secondary"
          onPress={catalog.refetch}
        />
      </View>
    );
  } else if (catalog.items.length === 0) {
    body = (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>
          {hasFilters ? "Nenhuma atividade encontrada" : emptyTitle}
        </Text>
        <Text style={styles.stateMessage}>
          {hasFilters
            ? "Ajuste a busca ou os filtros selecionados."
            : emptyMessage}
        </Text>
      </View>
    );
  } else {
    body = (
      <>
        <View style={styles.grid}>
          {catalog.items.map((item) => (
            <CatalogTaskCard
              key={item.id}
              item={item}
              onPress={() => onItemPress(item)}
            />
          ))}
        </View>
        {catalog.loadMoreError ? (
          <View style={styles.state}>
            <Text style={styles.stateMessage} accessibilityRole="alert">
              {catalog.loadMoreError instanceof Error
                ? catalog.loadMoreError.message
                : "Não foi possível carregar mais itens."}
            </Text>
            <DsButton
              label="Atualizar lista"
              variant="secondary"
              onPress={catalog.refetch}
            />
          </View>
        ) : null}
        {offlineNotice ? (
          <Text style={styles.stateMessage} accessibilityRole="alert">
            Sem conexão
          </Text>
        ) : null}
        {paginated && catalog.hasNextPage && !catalog.loadMoreError ? (
          <DsButton
            label="Carregar mais"
            variant="secondary"
            fullWidth
            loading={catalog.isFetchingNextPage}
            onPress={handleLoadMore}
          />
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.section}>
      <SectionTitle
        title={title}
        actionLabel={actionLabel}
        onActionPress={onActionPress}
      />
      {body}
    </View>
  );
}
