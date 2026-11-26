import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppHeader, DsButton } from "@/components/ds";
import { TutorialVideo } from "@/features/help/components/TutorialVideo";
import {
  formatTutorialDuration,
  playableVideoUrl,
} from "@/features/help/format";
import { useHelpTutorials } from "@/features/help/useHelpTutorials";
import { color, fontFamilies } from "@/theme";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
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
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
  steps: { gap: 10 },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  step: { flexDirection: "row", gap: 10 },
  stepNumber: {
    width: 24,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[950],
  },
});

export function HelpTutorialScreen(): ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useHelpTutorials();
  const tutorial = query.data?.find((item) => item.id === id);

  let body: ReactElement;
  if (!tutorial) {
    body = (
      <View style={styles.state}>
        <Text style={styles.stateText}>
          {query.isPending ? "Carregando tutorial" : "Tutorial não encontrado"}
        </Text>
        {query.isPending ? null : (
          <DsButton label="Voltar" variant="secondary" onPress={router.back} />
        )}
      </View>
    );
  } else {
    const videoUrl = playableVideoUrl(tutorial);
    const steps = tutorial.steps ?? [];
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {videoUrl ? (
          <TutorialVideo url={videoUrl} title={tutorial.title} />
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {tutorial.title}
        </Text>
        <Text style={styles.meta}>
          {formatTutorialDuration(tutorial.durationSeconds)}
        </Text>
        <Text style={styles.description}>{tutorial.description}</Text>
        {steps.length > 0 ? (
          <View style={styles.steps}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Passo a passo
            </Text>
            {steps.map((step, position) => (
              <View key={`${position}-${step}`} style={styles.step}>
                <Text style={styles.stepNumber}>{`${position + 1}.`}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
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
