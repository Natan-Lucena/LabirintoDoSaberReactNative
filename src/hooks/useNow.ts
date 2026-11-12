import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

const ONE_MINUTE_MS = 60_000;

/**
 * Relógio para telas que destacam o "atendimento atual/próximo": recalcula
 * quando a tela volta ao foco e a cada minuto enquanto está aberta. O
 * intervalo é limpo ao perder o foco ou desmontar.
 */
export function useNow(intervalMs: number = ONE_MINUTE_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      const timer = setInterval(() => setNow(new Date()), intervalMs);
      return () => clearInterval(timer);
    }, [intervalMs]),
  );

  return now;
}
