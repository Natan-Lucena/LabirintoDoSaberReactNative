import { useId, useState, type ReactNode } from "react";
import {
  Pressable,
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
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  /** Mascara o valor digitado (ex.: senha). DS-06. */
  secureTextEntry?: boolean;
  /** Ícone exibido dentro do campo, à direita (ex.: alternar senha). DS-06. */
  rightIcon?: ReactNode;
  /** Quando informado, `rightIcon` vira um alvo de toque acessível. DS-06. */
  onRightIconPress?: () => void;
  /** Rótulo acessível do botão do `rightIcon`, quando `onRightIconPress` é usado. DS-06. */
  rightIconAccessibilityLabel?: string;
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.button,
    backgroundColor: color.surface,
  },
  inputRowFocused: {
    borderColor: color.brand[500],
  },
  inputRowDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    minHeight: shape.minTouchTarget,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.semiBold,
    color: color.ink[950],
  },
  rightIcon: {
    paddingHorizontal: 12,
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
  autoComplete,
  textContentType,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const errorId = useId();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}
      >
        <View
          style={[
            styles.inputRow,
            focused && styles.inputRowFocused,
            disabled && styles.inputRowDisabled,
          ]}
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
            autoComplete={autoComplete}
            textContentType={textContentType}
            secureTextEntry={secureTextEntry}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={error}
            nativeID={errorId}
            style={[styles.input, multiline && styles.multiline]}
          />
          {rightIcon ? (
            onRightIconPress ? (
              <Pressable
                style={styles.rightIcon}
                onPress={onRightIconPress}
                accessibilityRole="button"
                accessibilityLabel={rightIconAccessibilityLabel}
                hitSlop={8}
              >
                {rightIcon}
              </Pressable>
            ) : (
              <View style={styles.rightIcon}>{rightIcon}</View>
            )
          ) : null}
        </View>
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
