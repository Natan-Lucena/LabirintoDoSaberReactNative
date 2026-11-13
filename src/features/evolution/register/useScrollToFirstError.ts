import { useCallback, useRef, type RefObject } from "react";
import type { ScrollView } from "react-native";
import type { FieldErrors } from "react-hook-form";

import type { EvolutionFormValues } from "./schema";

export type ErrorAnchor = `criteria.${number}` | "criteria" | "record" | "next";

export interface ScrollToFirstError {
  scrollRef: RefObject<ScrollView | null>;
  /** Registra a posição (no conteúdo do scroll) de um bloco do formulário. */
  setAnchor: (anchor: ErrorAnchor, y: number) => void;
  /** Rola até o primeiro campo inválido, a cada tentativa de salvar. */
  onInvalid: (errors: FieldErrors<EvolutionFormValues>) => void;
}

/** EVO-01.4: o primeiro campo com erro volta à tela em toda tentativa de salvar. */
export function useScrollToFirstError(): ScrollToFirstError {
  const scrollRef = useRef<ScrollView | null>(null);
  const anchors = useRef(new Map<string, number>());

  const setAnchor = useCallback((anchor: ErrorAnchor, y: number) => {
    anchors.current.set(anchor, y);
  }, []);

  const onInvalid = useCallback((errors: FieldErrors<EvolutionFormValues>) => {
    let target: ErrorAnchor | null = null;
    const list = errors.criteria;
    if (Array.isArray(list)) {
      const index = list.findIndex((entry) => Boolean(entry));
      if (index !== -1) target = `criteria.${index}`;
    }
    if (!target && errors.criteria?.message) target = "criteria";
    if (!target && errors.descriptiveRecord) target = "record";
    if (!target && errors.nextSessionSuggestion) target = "next";
    const y = target ? anchors.current.get(target) : undefined;
    if (y === undefined) return;
    scrollRef.current?.scrollTo?.({ y: Math.max(0, y - 12), animated: true });
  }, []);

  return { scrollRef, setAnchor, onInvalid };
}
