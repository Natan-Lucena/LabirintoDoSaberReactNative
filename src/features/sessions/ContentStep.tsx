import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FilterChips } from "@/components/FilterChips";
import type { FilterChipOption } from "@/components/FilterChips";
import { FooterActions } from "@/components/FooterActions";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { StepIndicator } from "@/components/StepIndicator";
import { TextField } from "@/components/TextField";
import { ContentCard } from "@/features/content/ContentCard";
import {
  useContentCatalog,
  type ContentCatalogItem,
} from "@/features/sessions/useContentCatalog";
import { useSessionFlowStore } from "@/stores/session-flow";
import type { SessionFlowContentKind } from "@/stores/session-flow";
import { color, typography } from "@/theme";

export function normalizeForSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const CHIP_OPTIONS: FilterChipOption[] = [
  { key: "notebook", label: "Cadernos" },
  { key: "group", label: "Grupos" },
  { key: "task", label: "Atividades" },
];

const NAME_MAX_LENGTH = 100;

function isNameValid(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= NAME_MAX_LENGTH;
}

export function ContentStep(): ReactElement {
  const router = useRouter();
  const { configure, sessionName, content } = useSessionFlowStore();
  const [nameInput, setNameInput] = useState(sessionName ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [activeChip, setActiveChip] = useState<SessionFlowContentKind>(
    content?.kind ?? "notebook",
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ContentCatalogItem | null>(
    content
      ? { kind: content.kind, id: content.id, name: content.name, tags: [] }
      : null,
  );

  const { items, isLoading, isError, refetch } = useContentCatalog(activeChip);

  const normalizedQuery = normalizeForSearch(query);
  const filtered = useMemo(
    () =>
      normalizedQuery
        ? items.filter((item) =>
            normalizeForSearch(item.name).includes(normalizedQuery),
          )
        : items,
    [items, normalizedQuery],
  );

  const nameValid = isNameValid(nameInput);
  const nameError =
    nameTouched && !nameValid
      ? "Informe um nome com até 100 caracteres."
      : undefined;

  function handleChipToggle(key: string) {
    setActiveChip(key as SessionFlowContentKind);
  }

  function handleSeeAll() {
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: "Conteúdo" },
    });
  }

  function handleBack() {
    router.back();
  }

  async function handleNext() {
    setNameTouched(true);
    if (!nameValid || !selected) {
      return;
    }
    await configure({
      name: nameInput.trim(),
      content: { kind: selected.kind, id: selected.id, name: selected.name },
    });
    router.push("/session/player");
  }

  return (
    <Screen>
      <View
        accessible
        accessibilityLabel="Passo 2"
        style={styles.stepIndicator}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <StepIndicator totalSteps={2} currentStep={2} />
        </View>
      </View>

      <TextField
        label="Dê um nome à sessão"
        value={nameInput}
        onChangeText={(value) => {
          setNameInput(value);
        }}
        onBlur={() => setNameTouched(true)}
        error={nameError}
        accessibilityLabel="Nome da sessão"
        placeholder="Ex: Sessão de Alfabetização - 08/04/2026"
      />

      <Text style={styles.title} accessibilityRole="header">
        Como gostaria de começar?
      </Text>

      <SearchField
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        placeholder="Buscar caderno por nome..."
      />

      <View style={styles.chipsRow}>
        <FilterChips
          options={CHIP_OPTIONS}
          selected={[activeChip]}
          onToggle={handleChipToggle}
        />
        <Pressable onPress={handleSeeAll} accessibilityRole="link" hitSlop={12}>
          <Text style={styles.seeAll}>Ver Tudo</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label="Carregando conteúdo" />
      ) : isError ? (
        <ErrorState
          message="Não foi possível carregar o conteúdo."
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo encontrado"
          message={
            items.length === 0
              ? "Nenhum item disponível para este chip."
              : "Nenhum item corresponde à busca."
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          renderItem={({ item }) => (
            <ContentCard
              description={item.name}
              tags={item.tags}
              selected={
                selected?.kind === item.kind && selected?.id === item.id
              }
              onPress={() => setSelected(item)}
              accessibilityLabel={item.name}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <FooterActions
        onBack={handleBack}
        onPrimary={handleNext}
        primaryLabel="Iniciar Sessão Agora"
        primaryDisabled={!nameValid || !selected}
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
    marginTop: 16,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    color: color.primary,
  },
  separator: { height: 8 },
});
