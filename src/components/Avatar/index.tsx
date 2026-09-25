import type { ReactElement } from "react";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { color, semanticColor, shape } from "../../theme";

export interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  decorative?: boolean;
  accessibilityLabel?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("");
}

export function Avatar({
  uri,
  name,
  size = shape.avatarSize,
  decorative = false,
  accessibilityLabel,
}: AvatarProps): ReactElement {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(uri) && !hasError;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
    >
      {showImage ? (
        <Image
          testID="avatar-image"
          source={{ uri }}
          style={[styles.image, containerStyle]}
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel ?? name}
          onError={() => setHasError(true)}
        />
      ) : (
        <Text style={styles.initials}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.selection,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    position: "absolute",
  },
  initials: {
    color: semanticColor.textOnSelection,
    fontWeight: "700",
  },
});
