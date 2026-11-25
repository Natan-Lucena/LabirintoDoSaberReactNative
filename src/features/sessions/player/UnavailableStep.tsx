import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { color, fontFamilies } from "@/theme";

export interface UnavailableStepProps {
  onSkip: () => void | Promise<void>;
}

/**
 * Tipo que a sessão não joga (imprimível, AT-10, ou desconhecido): avança sem
 * registrar nada.
 */
export function UnavailableStep({
  onSkip,
}: UnavailableStepProps): ReactElement {
  return (
    <View style={styles.state}>
      <Text style={styles.stateText} accessibilityRole="alert" accessible>
        Tipo de atividade indisponível
      </Text>
      <DsButton
        label="Pular"
        variant="secondary"
        fullWidth
        onPress={() => void onSkip()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: "center", gap: 16, padding: 20 },
  stateText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
