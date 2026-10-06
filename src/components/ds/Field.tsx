import { useId, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { color, fontFamilies, shape } from "@/theme";

export interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: TextInputProps["autoCorrect"];
}

// Valores do `.field` do Figma Make (src/index.css, ficha DS-04): coluna gap
// 7, rótulo 11/800 ink-800, input radius 13, foco com borda brand-500 e anel
// 3 brand-100 (simulado com uma borda externa, já que RN não tem box-shadow).
const styles = StyleSheet.create({
  container: { gap: 7 },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold,
    color: color.ink[800],
  },
  inputWrapper: {
    borderRadius: shape.radius.button + 3,
    borderWidth: 3,
    borderColor: "transparent",
  },
  inputWrapperFocused: {
    borderColor: color.brand[100],
  },
  input: {
    width: "100%",
    minHeight: shape.minTouchTarget,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.button,
    backgroundColor: color.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.semiBold,
    color: color.ink[950],
  },
  inputFocused: {
    borderColor: color.brand[500],
  },
  inputDisabled: {
    opacity: 0.5,
  },
  multiline: {
    minHeight: 110,
    lineHeight: 19.5,
    textAlignVertical: "top",
  },
  error: { color: color.danger, fontSize: 12, lineHeight: 16 },
  hint: { color: color.ink[600], fontSize: 12, lineHeight: 16 },
});

export function Field({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
  multiline,
  placeholder,
  maxLength,
  disabled,
  accessibilityLabel,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const errorId = useId();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          multiline={multiline}
          placeholder={placeholder}
          maxLength={maxLength}
          editable={!disabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error}
          nativeID={errorId}
          style={[
            styles.input,
            focused && styles.inputFocused,
            multiline && styles.multiline,
            disabled && styles.inputDisabled,
          ]}
        />
      </View>
      {error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
