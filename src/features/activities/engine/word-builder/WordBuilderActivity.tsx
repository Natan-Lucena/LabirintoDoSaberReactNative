import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { WordBuilderContent } from "@/api/types";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { hitSlopToMinTarget } from "@/components/ds/touchTarget";
import { color, fontFamilies, shape } from "@/theme";
import { GameFeedback } from "../game/GameFeedback";
import { GameHint } from "../game/GameHint";
import { clampGameResult, createGameTimer } from "../game/gameResult";
import type { ActivityComponentProps } from "../types";
import {
  buildTiles,
  check,
  clearSlots,
  createState,
  isFull,
  letterOf,
  placeTile,
  toGameResult,
  toLetters,
  undoFrom,
} from "./wordBuilder";

// Fundo de sucesso do SuccessPanel (Make `src/index.css`).
const SUCCESS_BACKGROUND = "#e8f7f1";

const SLOT = { width: 48, height: 56 };
const TILE = { width: 48, height: 48 };

function readContent(
  content: ActivityComponentProps["task"]["content"],
): WordBuilderContent | null {
  if (!content || content.kind !== "wordBuilder") {
    return null;
  }
  return toLetters(content.word ?? "").length > 0 ? content : null;
}

/**
 * Jogo "Forme a palavra" (ATV-04a): a criança monta a palavra tocando nas
 * letras do banco. Reporta `GameResult` uma vez, antes de `onSolved`.
 */
export function WordBuilderActivity(
  props: ActivityComponentProps,
): ReactElement {
  const content = readContent(props.task.content);
  if (!content) {
    return <InvalidContent onSolved={props.onSolved} />;
  }
  return <WordBuilderBoard {...props} content={content} />;
}

function InvalidContent({ onSolved }: { onSolved: () => void }): ReactElement {
  const released = useRef(false);
  useEffect(() => {
    if (!released.current) {
      released.current = true;
      onSolved();
    }
  }, [onSolved]);

  return (
    <Text style={styles.invalid} accessibilityRole="alert" accessible>
      Esta atividade está incompleta.
    </Text>
  );
}

function WordBuilderBoard({
  task,
  content,
  onSolved,
  onGameResult,
}: ActivityComponentProps & { content: WordBuilderContent }): ReactElement {
  const [state, setState] = useState(() =>
    createState(buildTiles(content), toLetters(content.word).length),
  );
  const [status, setStatus] = useState<"playing" | "wrong" | "right">(
    "playing",
  );
  const [timer] = useState(() => createGameTimer());
  const reported = useRef(false);

  useEffect(() => {
    timer.start();
  }, [timer]);

  const locked = status !== "playing";
  const total = state.slots.length;

  function pickTile(tileId: string) {
    if (locked) {
      return;
    }
    const placed = placeTile(state, tileId);
    if (!isFull(placed)) {
      setState(placed);
      return;
    }
    const { state: checked, correct } = check(placed, content.word);
    setState(checked);
    if (!correct) {
      setStatus("wrong");
      return;
    }
    setStatus("right");
    if (!reported.current) {
      reported.current = true;
      onGameResult?.(clampGameResult(toGameResult(checked, timer.elapsed())));
    }
    onSolved();
  }

  function undo(index: number) {
    if (locked) {
      return;
    }
    setState(undoFrom(state, index));
  }

  function retry() {
    setState(clearSlots(state));
    setStatus("playing");
  }

  return (
    <View style={styles.container}>
      <GameHint
        prompt={task.prompt}
        imageUrl={content.hintImageUrl}
        audioUrl={content.hintAudioUrl}
      />

      <View style={styles.row}>
        {state.slots.map((tileId, index) => {
          const letter = letterOf(state, tileId);
          return (
            <StaticPressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Espaço ${index + 1} de ${total}, ${
                tileId ? `letra ${letter}` : "vazio"
              }`}
              accessibilityHint="Toque para devolver esta letra e as seguintes"
              accessibilityState={{ disabled: locked || !tileId }}
              hitSlop={hitSlopToMinTarget(SLOT.width, SLOT.height)}
              onPress={() => undo(index)}
              style={[
                styles.slot,
                status === "right" ? styles.slotRight : null,
              ]}
            >
              <Text style={styles.letter}>{letter}</Text>
            </StaticPressable>
          );
        })}
      </View>

      <View style={styles.row}>
        {state.tiles.map((tile) =>
          state.slots.includes(tile.id) ? (
            <View key={tile.id} style={styles.tilePlaceholder} />
          ) : (
            <StaticPressable
              key={tile.id}
              accessibilityRole="button"
              accessibilityLabel={`Letra ${tile.letter}`}
              accessibilityState={{ disabled: locked }}
              hitSlop={hitSlopToMinTarget(TILE.width, TILE.height)}
              onPress={() => pickTile(tile.id)}
              style={styles.tile}
            >
              <Text style={styles.letter}>{tile.letter}</Text>
            </StaticPressable>
          ),
        )}
      </View>

      {status === "right" ? (
        <GameFeedback status="success" onRetry={retry} />
      ) : null}
      {status === "wrong" ? (
        <GameFeedback status="error" onRetry={retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  slot: {
    ...SLOT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: color.brand[200],
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
  },
  slotRight: {
    borderColor: color.success,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  tile: {
    ...TILE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: shape.radius.md,
    backgroundColor: color.brand[50],
    borderWidth: 1,
    borderColor: color.brand[200],
  },
  tilePlaceholder: { ...TILE },
  letter: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 22,
    lineHeight: 28,
  },
  invalid: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
