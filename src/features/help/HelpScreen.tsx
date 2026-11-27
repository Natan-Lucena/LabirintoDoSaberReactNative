import type { ReactElement } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { PendingBanner } from "@/components/PendingBanner";
import { AppHeader, DsButton, SectionTitle } from "@/components/ds";
import { FeaturedTutorial } from "@/features/help/components/FeaturedTutorial";
import { TutorialRow } from "@/features/help/components/TutorialRow";
import { splitTutorials } from "@/features/help/format";
import { useHelpTutorials } from "@/features/help/useHelpTutorials";
import { useOnline } from "@/hooks/useOnline";
import { color, fontFamilies, shape } from "@/theme";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 20, paddingBottom: 36 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
  group: { gap: 10 },
  list: {
    overflow: "hidden",
    backgroundColor: color.surface,
    borderRadius: shape.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
});

export function HelpScreen(): ReactElement {
  const router = useRouter();
  const online = useOnline();
  const query = useHelpTutorials();
  const open = (id: string) =>
    router.push({ pathname: "/help/[id]", params: { id } });

  let body: ReactElement;
  if (query.isPending && !online) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        <PendingBanner message="Sem conexão" />
        <Text style={styles.stateText}>
          Sem conexão e sem tutoriais salvos. Conecte-se para carregar.
        </Text>
      </ScrollView>
    );
  } else if (query.isPending) {
    body = (
      <View style={styles.state}>
        <ActivityIndicator accessibilityLabel="Carregando tutoriais" />
        <Text style={styles.stateText}>Carregando tutoriais</Text>
      </View>
    );
  } else if (query.isError && query.data === undefined) {
    body = (
      <View style={styles.state}>
        <Text style={styles.stateText}>
          Não foi possível carregar a central de ajuda.
        </Text>
        <DsButton
          label="Tentar de novo"
          variant="secondary"
          onPress={() => void query.refetch()}
        />
      </View>
    );
  } else {
    const tutorials = query.data ?? [];
    const { featured, rest } = splitTutorials(tutorials);
    const offline = !online ? (
      <PendingBanner message="Sem conexão - mostrando dados salvos" />
    ) : null;
    body =
      tutorials.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          {offline}
          <Text style={styles.stateText}>
            Os tutoriais ainda não foram publicados.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {offline}
          {featured ? (
            <FeaturedTutorial
              tutorial={featured}
              onPress={() => open(featured.id)}
            />
          ) : null}
          {rest.length > 0 ? (
            <View style={styles.group}>
              <SectionTitle title="Tutoriais essenciais" />
              <View style={styles.list}>
                {rest.map((tutorial, position) => (
                  <TutorialRow
                    key={tutorial.id}
                    tutorial={tutorial}
                    index={position + 1}
                    onPress={() => open(tutorial.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <AppHeader
        title="Central de ajuda"
        subtitle="Aprenda no seu ritmo"
        onBack={router.back}
      />
      {body}
    </SafeAreaView>
  );
}
