// Efeito de toque comum aos controles do DS-03 (Make: `:active { scale(.98) }`),
// respeitando "reduzir movimento" (AC-DS-03-03).
import { useEffect, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { AccessibilityInfo } from "react-native";

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled: boolean) => setReduceMotion(enabled),
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/** `undefined` quando não há efeito a aplicar (solto ou reduzir movimento ligado). */
export function getPressScaleStyle(
  pressed: boolean,
  reduceMotion: boolean,
): StyleProp<ViewStyle> {
  if (!pressed || reduceMotion) {
    return undefined;
  }
  return { transform: [{ scale: 0.98 }] };
}
