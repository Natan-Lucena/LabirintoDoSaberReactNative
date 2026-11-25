import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DsButton, SuccessPanel } from "@/components/ds";
import { color, fontFamilies } from "@/theme";

export interface GameFeedbackProps {
  status: "success" | "error";
  onRetry: () => void;
}

/** Retorno do jogo: "Muito bem!" ou o aviso de erro com "Tentar novamente". */
export function GameFeedback({
  status,
  onRetry,
}: GameFeedbackProps): ReactElement {
  if (status === "success") {
    return <SuccessPanel title="Muito bem!" />;
  }
  return (
    <View style={styles.retry}>
      <Text style={styles.wrong} accessibilityRole="alert" accessible>
        Ainda não. Tente de novo.
      </Text>
      <DsButton
        label="Tentar novamente"
        variant="secondary"
        fullWidth
        onPress={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  retry: { gap: 10 },
  wrong: {
    color: color.warning,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
});
