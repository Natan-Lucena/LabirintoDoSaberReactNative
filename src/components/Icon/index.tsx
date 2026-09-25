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
  /** Ícones de aba (T-501/UX2): variante preenchida quando a aba está ativa. */
  active?: boolean;
}

const IONICON_NAME: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  menu: "menu-outline",
  account: "person-circle",
  home: "home-outline",
  activities: "book-outline",
  students: "person-outline",
  agenda: "calendar-outline",
  reports: "clipboard-outline",
};

// UX2 (Figma "Home sem agenda"): só a aba "Tela Inicial" tem variante
// preenchida quando ativa; as demais mantêm o traço (outline) sempre.
const IONICON_NAME_ACTIVE: Partial<Record<IconName, keyof typeof Ionicons.glyphMap>> =
  {
    home: "home",
  };

export function resolveIconGlyph(
  name: IconName,
  active: boolean,
): keyof typeof Ionicons.glyphMap {
  return (active ? IONICON_NAME_ACTIVE[name] : undefined) ?? IONICON_NAME[name];
}

export function Icon({
  name,
  size = 24,
  color = colorTokens.text,
  accessibilityLabel,
  active = false,
}: IconProps): ReactElement {
  const isDecorative = accessibilityLabel === undefined;
  const glyphName = resolveIconGlyph(name, active);

  return (
    <Ionicons
      name={glyphName}
      size={size}
      color={color}
      testID={`icon-${name}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? "no-hide-descendants" : "yes"}
    />
  );
}
