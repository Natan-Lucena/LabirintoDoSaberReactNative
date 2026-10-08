import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { TaskAlternative } from "@/api/types";
import { DsButton, SuccessPanel } from "@/components/ds";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { color, fontFamilies, semanticColor, shape } from "@/theme";
import type { ActivityComponentProps } from "./types";

function now(): number {
  return Date.now();
}

/**
 * Tipo jogável da V1 (ATV-04c, "Leia e responda"): múltipla escolha com
 * imagem e áudio opcionais. Diferente do player da sessão, aqui o feedback de
 * acerto aparece, porque a atividade é usada para treinar e não gera registro.
 */
export function QuizActivity({
  task,
  onAttempt,
  onSolved,
}: ActivityComponentProps): ReactElement {
  const [selected, setSelected] = useState<TaskAlternative | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = now();
  }, []);

  const solved = selected?.isCorrect === true;
  const wrong = selected !== null && !selected.isCorrect;

  function choose(alternative: TaskAlternative) {
    if (selected) {
      return;
    }
    setSelected(alternative);
    onAttempt({
      alternativeId: alternative.id,
      correct: alternative.isCorrect,
      elapsedMs: Math.max(0, now() - startedAtRef.current),
    });
    if (alternative.isCorrect) {
      onSolved();
    }
  }

  function retry() {
    setSelected(null);
    startedAtRef.current = now();
  }

  return (
    <View style={styles.container}>
      {task.imageFile ? (
        <Image
          source={{ uri: task.imageFile }}
          accessibilityLabel="Imagem da atividade"
          resizeMode="contain"
          style={styles.illustration}
        />
      ) : null}
      {task.audioFile ? <AudioPlayer url={task.audioFile} /> : null}

      <Text style={styles.prompt} accessibilityRole="header">
        {task.prompt}
      </Text>

      <View style={styles.alternatives}>
        {task.alternatives.map((alternative) => {
          const isSelected = selected?.id === alternative.id;
          return (
            <Pressable
              key={alternative.id}
              accessibilityRole="button"
              accessibilityLabel={alternative.text}
              accessibilityState={{
                disabled: selected !== null,
                selected: isSelected,
              }}
              disabled={selected !== null}
              onPress={() => choose(alternative)}
              style={[
                styles.option,
                isSelected && alternative.isCorrect ? styles.optionRight : null,
                isSelected && !alternative.isCorrect
                  ? styles.optionWrong
                  : null,
              ]}
            >
              <Text style={styles.optionText}>{alternative.text}</Text>
            </Pressable>
          );
        })}
      </View>

      {solved ? <SuccessPanel title="Muito bem!" /> : null}
      {wrong ? (
        <View style={styles.retry}>
          <Text style={styles.wrong} accessibilityRole="alert" accessible>
            Quase lá! Tente de novo.
          </Text>
          <DsButton
            label="Tentar novamente"
            variant="secondary"
            fullWidth
            onPress={retry}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  illustration: { width: "100%", height: 220, borderRadius: shape.radius.lg },
  prompt: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
  alternatives: { gap: 12 },
  option: {
    minHeight: 60,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: color.brand[200],
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
  },
  optionRight: {
    borderColor: semanticColor.primaryFill,
    backgroundColor: color.brand[50],
  },
  optionWrong: {
    borderColor: color.warning,
    backgroundColor: color.surfaceSoft,
  },
  optionText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  retry: { gap: 10 },
  wrong: {
    color: color.warning,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
});
