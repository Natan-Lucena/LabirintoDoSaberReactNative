import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { color, shape } from "../../theme";

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    minHeight: shape.minTouchTarget,
    borderRadius: shape.inputRadius,
    backgroundColor: color.background,
    paddingHorizontal: 14,
  },
});

export function SearchField({
  value,
  onChangeText,
  onClear,
  placeholder,
}: SearchFieldProps) {
  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
      />
      {value ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          hitSlop={12}
        >
          <Text>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
