import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { MemoryGameContent } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { hitSlopToMinTarget } from "@/components/ds/touchTarget";
import { color, fontFamilies, shape } from "@/theme";
import { GameFeedback } from "../game/GameFeedback";
import { GameHint } from "../game/GameHint";
import { clampGameResult, createGameTimer } from "../game/gameResult";
import type { ActivityComponentProps } from "../types";
import {
  createState,
  flip,
  isComplete,
  isPendingMatch,
  resolve,
  toGameResult,
  type DeckCard,
} from "./memoryGame";

// Fundo de sucesso do SuccessPanel (Make `src/index.css`).
const SUCCESS_BACKGROUND = "#e8f7f1";
const MIN_CARD = 64;
const MISMATCH_DELAY_MS = 900;

function readContent(
  content: ActivityComponentProps["task"]["content"],
): MemoryGameContent | null {
  if (!content || content.kind !== "memoryGame") {
    return null;
  }
  return Array.isArray(content.cards) && content.cards.length >= 2
    ? content
    : null;
}

function columnsFor(cardCount: number): number {
  if (cardCount <= 4) {
    return 2;
  }
  return cardCount <= 6 ? 3 : 4;
}

/**
 * Jogo "Memória visual" (ATV-04b): vire as cartas e ache os pares. Reporta
 * `GameResult` uma vez, antes de `onSolved`.
 */
export function MemoryGameActivity(
  props: ActivityComponentProps,
): ReactElement {
  const content = readContent(props.task.content);
  if (!content) {
    return <InvalidContent onSolved={props.onSolved} />;
  }
  return <MemoryBoard {...props} content={content} />;
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

function MemoryBoard({
  task,
  content,
  onSolved,
  onGameResult,
}: ActivityComponentProps & { content: MemoryGameContent }): ReactElement {
  const [state, setState] = useState(() => createState(content.cards));
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [timer] = useState(() => createGameTimer());
  const reported = useRef(false);
  const mismatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.start();
    return () => {
      if (mismatchTimer.current) {
        clearTimeout(mismatchTimer.current);
      }
    };
  }, [timer]);

  const done = isComplete(state);
  const columns = columnsFor(state.deck.length);

  function finish(next: typeof state) {
    if (isComplete(next) && !reported.current) {
      reported.current = true;
      onGameResult?.(clampGameResult(toGameResult(next, timer.elapsed())));
      onSolved();
    }
  }

  function pick(card: DeckCard) {
    if (done) {
      return;
    }
    const flipped = flip(state, card.deckId);
    if (flipped === state) {
      return;
    }
    if (flipped.open.length < 2) {
      setState(flipped);
      return;
    }
    if (isPendingMatch(flipped)) {
      const resolved = resolve(flipped);
      setState(resolved);
      finish(resolved);
      return;
    }
    setState(flipped);
    mismatchTimer.current = setTimeout(() => {
      mismatchTimer.current = null;
      setState((current) => resolve(current));
    }, MISMATCH_DELAY_MS);
  }

  return (
    <View style={styles.container}>
      <GameHint prompt={task.prompt} />

      <View style={styles.grid}>
        {state.deck.map((card, index) => {
          const position = index + 1;
          const found = state.found.includes(card.pairId);
          const faceUp = found || state.open.includes(card.deckId);
          const fallback = `Figura ${card.contentIndex + 1}`;
          const text = card.label ?? fallback;
          const showImage =
            !!card.imageUrl && !failedImages.includes(card.deckId);
          const label = !faceUp
            ? `Carta ${position}, virada para baixo`
            : `Carta ${position}: ${text}${found ? ", par encontrado" : ""}`;
          return (
            <View
              key={card.deckId}
              style={[styles.cell, { width: `${100 / columns}%` }]}
            >
              <StaticPressable
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled: found || done }}
                hitSlop={hitSlopToMinTarget(MIN_CARD, MIN_CARD)}
                onPress={() => pick(card)}
                style={[
                  styles.card,
                  faceUp ? styles.cardUp : styles.cardDown,
                  found ? styles.cardFound : null,
                ]}
              >
                {!faceUp ? (
                  <FigmaIcon name="grid" size={28} color={color.brand[700]} />
                ) : showImage ? (
                  <Image
                    source={{ uri: card.imageUrl }}
                    accessibilityLabel={`Imagem da carta ${position}`}
                    resizeMode="contain"
                    onError={() =>
                      setFailedImages((list) => [...list, card.deckId])
                    }
                    style={styles.image}
                  />
                ) : (
                  <Text style={styles.cardText} numberOfLines={2}>
                    {text}
                  </Text>
                )}
              </StaticPressable>
            </View>
          );
        })}
      </View>

      {done ? (
        <GameFeedback status="success" onRetry={() => undefined} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { padding: 4 },
  card: {
    width: "100%",
    aspectRatio: 1,
    minWidth: MIN_CARD,
    minHeight: MIN_CARD,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    borderWidth: 2,
    borderRadius: shape.radius.md,
  },
  cardDown: {
    backgroundColor: color.brand[100],
    borderColor: color.brand[200],
  },
  cardUp: { backgroundColor: color.surface, borderColor: color.border },
  cardFound: {
    borderColor: color.success,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  image: { width: "100%", height: "100%" },
  cardText: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 18,
    lineHeight: 24,
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
