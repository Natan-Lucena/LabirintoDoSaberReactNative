import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, semanticColor, typography } from "../../theme";

export interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  labels?: string[];
}

export function StepIndicator({
  totalSteps,
  currentStep,
  labels,
}: StepIndicatorProps): ReactElement {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Etapa ${currentStep} de ${totalSteps}`}
    >
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        const circleStyle = isActive
          ? styles.circleActive
          : isDone
            ? styles.circleDone
            : styles.circlePending;
        const textStyle = isActive
          ? styles.circleTextActive
          : isDone
            ? styles.circleTextDone
            : styles.circleTextPending;

        return (
          <View
            key={step}
            testID={`step-indicator-step-${step}`}
            accessibilityState={{ selected: isActive }}
            style={styles.step}
          >
            <View style={[styles.circle, circleStyle]}>
              <Text style={textStyle}>{step}</Text>
            </View>
            {labels?.[step - 1] ? (
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
              >
                {labels[step - 1]}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  step: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: color.primary },
  circleDone: { backgroundColor: color.selection },
  circlePending: { backgroundColor: color.tagNeutral },
  circleTextActive: { color: color.surface, fontWeight: "700", fontSize: 9 },
  circleTextDone: {
    color: semanticColor.textOnSelection,
    fontWeight: "700",
    fontSize: 9,
  },
  circleTextPending: {
    color: color.textTertiary,
    fontWeight: "700",
    fontSize: 9,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
  },
  labelActive: { color: semanticColor.textAccentOnSurface, fontWeight: "700" },
  labelInactive: { color: color.textTertiary },
});
