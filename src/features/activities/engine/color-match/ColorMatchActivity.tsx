import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ColorMatchContent } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { hitSlopToMinTarget } from "@/components/ds/touchTarget";
import { color, fontFamilies, semanticColor, shape } from "@/theme";
import { GameFeedback } from "../game/GameFeedback";
import { GameHint } from "../game/GameHint";
import { clampGameResult, createGameTimer } from "../game/gameResult";
import type { ActivityComponentProps } from "../types";
import { colorName } from "./colorNames";
import {
  createState,
  isComplete,
  selectWord,
  toGameResult,
  tryPair,
} from "./colorMatch";

// Fundo de sucesso do SuccessPanel (Make `src/index.css`).
const SUCCESS_BACKGROUND = "#e8f7f1";
const WORD = { width: 120, height: 48 };
const SWATCH = { width: 56, height: 56 };
const WRONG_NOTICE_MS = 1500;

function readContent(
  content: ActivityComponentProps["task"]["content"],
): ColorMatchContent | null {
  if (!content || content.kind !== "colorMatch") {
    return null;
  }
  return Array.isArray(content.pairs) && content.pairs.length >= 2
    ? content
    : null;
}

/**
 * Jogo "Associe as cores" (ATV-04b): liga cada palavra à sua amostra de cor.
 * Reporta `GameResult` uma vez, antes de `onSolved`.
 */
export function ColorMatchActivity(
  props: ActivityComponentProps,
): ReactElement {
  const content = readContent(props.task.content);
  if (!content) {
    return <InvalidContent onSolved={props.onSolved} />;
  }
  return <ColorMatchBoard {...props} content={content} />;
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

function ColorMatchBoard({
  task,
  content,
  onSolved,
  onGameResult,
}: ActivityComponentProps & { content: ColorMatchContent }): ReactElement {
  const [state, setState] = useState(() => createState(content.pairs));
  const [wrong, setWrong] = useState(false);
  const [timer] = useState(() => createGameTimer());
  const reported = useRef(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.start();
    return () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, [timer]);

  const done = isComplete(state);

  function pickWord(id: string) {
    if (done) {
      return;
    }
    setState(selectWord(state, id));
  }

  function pickSwatch(id: string) {
    if (done) {
      return;
    }
    const { state: next, outcome } = tryPair(state, id);
    if (outcome === "none") {
      return;
    }
    setState(next);
    if (outcome === "wrong") {
      setWrong(true);
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
      noticeTimer.current = setTimeout(() => {
        noticeTimer.current = null;
        setWrong(false);
      }, WRONG_NOTICE_MS);
      return;
    }
    setWrong(false);
    if (isComplete(next) && !reported.current) {
      reported.current = true;
      onGameResult?.(clampGameResult(toGameResult(next, timer.elapsed())));
      onSolved();
    }
  }

  return (
    <View style={styles.container}>
      <GameHint prompt={task.prompt} />

      <View style={styles.columns}>
        <View style={styles.column}>
          {content.pairs.map((pair) => {
            const matched = state.matched.includes(pair.id);
            const selected = state.selectedId === pair.id;
            return (
              <StaticPressable
                key={pair.id}
                accessibilityRole="button"
                accessibilityLabel={`Palavra ${pair.word}${
                  matched ? ", par certo" : ""
                }`}
                accessibilityState={{ selected, disabled: matched || done }}
                hitSlop={hitSlopToMinTarget(WORD.width, WORD.height)}
                onPress={() => pickWord(pair.id)}
                style={[
                  styles.word,
                  selected ? styles.selected : null,
                  matched ? styles.matched : null,
                ]}
              >
                <Text style={styles.wordText}>{pair.word}</Text>
                {matched ? (
                  <FigmaIcon name="check" size={18} color={color.success} />
                ) : null}
              </StaticPressable>
            );
          })}
        </View>

        <View style={styles.column}>
          {state.swatchIds.map((id) => {
            const pair = content.pairs.find((p) => p.id === id)!;
            const matched = state.matched.includes(id);
            return (
              <StaticPressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${colorName(pair.colorHex)}${
                  matched ? ", par certo" : ""
                }`}
                accessibilityState={{
                  selected: false,
                  disabled: matched || done,
                }}
                hitSlop={hitSlopToMinTarget(SWATCH.width, SWATCH.height)}
                onPress={() => pickSwatch(id)}
                style={[
                  styles.swatch,
                  { backgroundColor: pair.colorHex },
                  matched ? styles.swatchMatched : null,
                ]}
              >
                {matched ? (
                  <FigmaIcon name="check" size={24} color="#ffffff" />
                ) : null}
              </StaticPressable>
            );
          })}
        </View>
      </View>

      {wrong ? (
        <Text style={styles.wrong} accessibilityRole="alert" accessible>
          Não é essa cor.
        </Text>
      ) : null}
      {done ? (
        <GameFeedback status="success" onRetry={() => undefined} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  columns: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  column: { flex: 1, gap: 12, alignItems: "center" },
  word: {
    minWidth: WORD.width,
    minHeight: WORD.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
  },
  wordText: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 18,
    lineHeight: 24,
  },
  selected: { borderColor: semanticColor.primaryFill },
  matched: { borderColor: color.success, backgroundColor: SUCCESS_BACKGROUND },
  swatch: {
    minWidth: SWATCH.width,
    minHeight: SWATCH.height,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  swatchMatched: { borderColor: color.success },
  wrong: {
    color: color.warning,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  invalid: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
