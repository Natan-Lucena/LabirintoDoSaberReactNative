// `.toast` do Figma Make. Ver ficha DS-05 (AC-DS-05-02).
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";

const TOAST_DURATION_MS = 2200;

export interface ToastProps {
  message: string | null;
  onHide: () => void;
  duration?: number;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: color.ink[950],
  },
  label: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
  },
});

export function Toast({
  message,
  onHide,
  duration = TOAST_DURATION_MS,
}: ToastProps): ReactElement | null {
  useEffect(() => {
    if (!message) {
      return;
    }
    AccessibilityInfo.announceForAccessibility(message);
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onHide]);

  if (!message) {
    return null;
  }

  return (
    <View
      style={styles.toast}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <FigmaIcon name="check" size={16} color="#ffffff" />
      <Text style={styles.label}>{message}</Text>
    </View>
  );
}

export interface UseToastResult {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export function useToast(): UseToastResult {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((next: string) => {
    setMessage(next);
  }, []);

  const hide = useCallback(() => {
    setMessage(null);
  }, []);

  return { message, show, hide };
}
