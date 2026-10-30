import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { listAnamneseTemplates } from "@/api/endpoints/anamnese";
import { AppHeader, DsButton, FeatureRow } from "@/components/ds";
import { color, fontFamilies, semanticColor } from "@/theme";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 16 },
  empty: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    textAlign: "center",
    marginVertical: 36,
  },
  error: { color: semanticColor.dangerTextOnSurface },
});

export function TemplateListScreen(): ReactElement {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["anamnese", "templates"],
    queryFn: listAnamneseTemplates,
  });
  return (
    <View style={styles.screen}>
      <AppHeader title="Modelos de anamnese" onBack={router.back} />
      <ScrollView contentContainerStyle={styles.content}>
        <DsButton
          label="Novo modelo"
          icon="plus"
          onPress={() => router.push("/anamnese/templates/new")}
        />
        {query.isPending ? (
          <ActivityIndicator accessibilityLabel="Carregando modelos" />
        ) : null}
        {query.isError ? (
          <>
            <Text style={styles.error} accessibilityRole="alert">
              Não foi possível carregar os modelos.
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          </>
        ) : null}
        {query.data?.length === 0 ? (
          <Text style={styles.empty}>Nenhum modelo de anamnese</Text>
        ) : null}
        {query.data?.map((template) => (
          <FeatureRow
            key={template.id}
            icon="clipboard"
            title={template.title}
            subtitle={`${template.description ? `${template.description} · ` : ""}${template.questions.length} pergunta${template.questions.length === 1 ? "" : "s"}`}
            onPress={() =>
              router.push({
                pathname: "/anamnese/templates/[id]",
                params: { id: template.id },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}
