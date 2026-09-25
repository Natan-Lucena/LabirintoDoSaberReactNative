import { useId, useState, type ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
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
  leftIcon?: ReactNode;
  rightAccessory?: ReactNode;
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: shape.minTouchTarget,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    borderRadius: shape.inputRadius,
    backgroundColor: color.surface,
  },
  input: {
    flex: 1,
    minHeight: shape.minTouchTarget,
    paddingHorizontal: 10,
    paddingVertical: 13,
    fontSize: typography.body.fontSize,
    color: color.text,
  },
  hint: {
    color: semanticColor.textSecondaryOnSurface,
    fontSize: typography.body.fontSize,
  },
  error: { color: color.pink, fontSize: typography.body.fontSize },
  icon: { marginLeft: 14 },
  accessory: { marginRight: 14 },
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
  leftIcon,
  rightAccessory,
}: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = useId();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
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
            style={styles.accessory}
            onPress={() => setVisible((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            hitSlop={12}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={color.textSecondary}
            />
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.accessory}>{rightAccessory}</View>
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
