// Lista marcável controlada (`.check-list`). Ver ficha DS-03.
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Checkbox } from "./Checkbox";

export interface CheckListOption {
  key: string;
  label: string;
}

export interface CheckListProps {
  options: CheckListOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  list: { gap: 8 },
});

export function CheckList({
  options,
  selected,
  onChange,
  disabled = false,
}: CheckListProps): ReactElement {
  function toggle(key: string, checked: boolean) {
    if (checked) {
      onChange([...selected, key]);
      return;
    }
    onChange(selected.filter((item) => item !== key));
  }

  return (
    <View style={styles.list}>
      {options.map((option) => (
        <Checkbox
          key={option.key}
          label={option.label}
          checked={selected.includes(option.key)}
          onChange={(checked) => toggle(option.key, checked)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}
