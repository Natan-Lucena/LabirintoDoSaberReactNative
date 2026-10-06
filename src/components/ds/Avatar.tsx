// `.avatar` / `.avatar--*` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";

export type AvatarTone = "mint" | "peach" | "lavender";

export interface AvatarProps {
  name: string;
  tone?: AvatarTone;
  size?: number;
}

const toneStyles: Record<
  AvatarTone,
  { backgroundColor: string; color: string }
> = {
  mint: { backgroundColor: color.brand[100], color: color.brand[700] },
  peach: { backgroundColor: color.peach, color: color.peachStrong },
  lavender: { backgroundColor: color.lavender, color: color.lavenderStrong },
};

const TONE_ORDER: AvatarTone[] = ["mint", "peach", "lavender"];

/** Mesmo nome sempre escolhe o mesmo tom, sem precisar guardar estado. */
function toneForName(name: string): AvatarTone {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0;
  }
  const position = Math.abs(hash) % TONE_ORDER.length;
  return TONE_ORDER[position];
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

const styles = StyleSheet.create({
  base: {
    width: 46,
    height: 46,
    borderRadius: shape.radius.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
  },
});

export function Avatar({ name, tone, size }: AvatarProps): ReactElement {
  const resolvedTone = toneStyles[tone ?? toneForName(name)];
  const dimension = size ?? 46;

  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[
        styles.base,
        { backgroundColor: resolvedTone.backgroundColor },
        size
          ? { width: dimension, height: dimension, borderRadius: dimension / 2 }
          : null,
      ]}
    >
      <Text style={[styles.initials, { color: resolvedTone.color }]}>
        {initialsForName(name)}
      </Text>
    </View>
  );
}
