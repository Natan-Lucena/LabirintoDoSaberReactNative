import { Ionicons } from "@expo/vector-icons";
import type { ReactElement } from "react";

import { color as colorTokens } from "../../theme";

export type IconName =
  | "menu"
  | "account"
  | "home"
  | "activities"
  | "students"
  | "agenda"
  | "reports";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

const IONICON_NAME: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  menu: "menu-outline",
  account: "person-circle",
  home: "home-outline",
  activities: "book-outline",
  students: "people-outline",
  agenda: "calendar-outline",
  reports: "stats-chart-outline",
};

export function Icon({
  name,
  size = 24,
  color = colorTokens.text,
  accessibilityLabel,
}: IconProps): ReactElement {
  const isDecorative = accessibilityLabel === undefined;

  return (
    <Ionicons
      name={IONICON_NAME[name]}
      size={size}
      color={color}
      testID={`icon-${name}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? "no-hide-descendants" : "yes"}
    />
  );
}
