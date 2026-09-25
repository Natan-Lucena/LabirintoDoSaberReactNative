import { useId, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { color, semanticColor, shape, typography } from "../../theme";

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  accessibilityLabel?: string;
  placeholder?: string;
  onBlur?: () => void;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: TextInputProps["autoCorrect"];
  keyboardType?: TextInputProps["keyboardType"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    minHeight: shape.minTouchTarget,
    borderRadius: shape.inputRadius,
    backgroundColor: color.background,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: typography.body.fontSize,
    color: color.text,
  },
  hint: {
    color: semanticColor.textSecondaryOnSurface,
    fontSize: typography.body.fontSize,
  },
  error: { color: color.pink, fontSize: typography.body.fontSize },
});

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  secureTextEntry,
  accessibilityLabel,
  placeholder,
  onBlur,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  autoComplete,
  textContentType,
}: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = useId();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry ? !visible : false}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error}
          nativeID={errorId}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          style={styles.input}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            hitSlop={12}
          >
            <Text>{visible ? "Ocultar" : "Mostrar"}</Text>
          </Pressable>
        ) : null}
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
