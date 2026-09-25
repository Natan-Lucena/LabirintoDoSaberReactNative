import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "../Button";

export interface FooterActionsProps {
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  backLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
}

export function FooterActions({
  onBack,
  onPrimary,
  primaryLabel,
  backLabel = "Voltar",
  primaryDisabled = false,
  primaryLoading = false,
}: FooterActionsProps): ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.back}>
        <Button label={backLabel} onPress={onBack} variant="secondary" />
      </View>
      <View style={styles.primary}>
        <Button
          label={primaryLabel}
          onPress={onPrimary}
          variant="primary"
          disabled={primaryDisabled}
          loading={primaryLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  back: { flex: 1 },
  primary: { flex: 1.4 },
});
