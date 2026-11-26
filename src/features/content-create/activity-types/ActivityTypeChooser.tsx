import type { ReactElement } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader, DsButton } from "@/components/ds";
import { color, fontFamilies } from "@/theme";

import { ACTIVITY_TYPE_LABELS, type ActivityType } from "./schema";

const DESCRIPTIONS: Record<ActivityType, string> = {
  wordBuilder: "A criança monta a palavra com as letras",
  colorMatch: "Ligue cada palavra à sua cor",
  memoryGame: "Jogo da memória com texto ou figuras",
  printable: "Folha para imprimir, com itens e linhas de resposta",
};

const ORDER: ActivityType[] = [
  "wordBuilder",
  "colorMatch",
  "memoryGame",
  "printable",
];

export function ActivityTypeChooser(): ReactElement {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Nova atividade"
        subtitle="Banco de atividades"
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Que tipo de atividade?</Text>
        <View style={styles.option}>
          <DsButton
            label="Múltipla escolha"
            variant="secondary"
            fullWidth
            onPress={() =>
              router.replace({
                pathname: "/content/new-task",
                params: { type: "multipleChoice" },
              })
            }
          />
          <Text style={styles.description}>
            Leia e responda, com imagem ou áudio opcionais
          </Text>
        </View>
        {ORDER.map((type) => (
          <View key={type} style={styles.option}>
            <DsButton
              label={ACTIVITY_TYPE_LABELS[type]}
              variant="secondary"
              fullWidth
              onPress={() =>
                router.replace({
                  pathname: "/content/new-activity",
                  params: { type },
                })
              }
            />
            <Text style={styles.description}>{DESCRIPTIONS[type]}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16 },
  option: { gap: 6 },
  heading: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
  },
});
