import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { FigmaIcon } from "@/components/FigmaIcon";
import { color } from "@/theme";

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

// `.search-field` do Figma Make: altura 48, radius 14, borda 1 border, bg
// surface, padding 0 14, gap 10. 14 não tem token em shape.radius (sm 10/md
// 16/lg 24/button 13/avatar 15); valor literal do Figma Make preservado.
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 14,
    backgroundColor: color.surface,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: color.ink[950],
  },
});

export function SearchField({
  value,
  onChangeText,
  onClear,
  placeholder,
  accessibilityLabel,
}: SearchFieldProps) {
  return (
    <View style={styles.row}>
      <FigmaIcon name="search" size={18} color={color.ink[500]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Buscar"}
        accessibilityLabel={accessibilityLabel ?? placeholder ?? "Buscar"}
        style={styles.input}
      />
      {value ? (
        <Pressable
          onPress={() => (onClear ? onClear() : onChangeText(""))}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          hitSlop={12}
        >
          <FigmaIcon name="close" size={16} color={color.ink[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}
