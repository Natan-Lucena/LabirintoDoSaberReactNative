import type { ReactElement } from "react";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const SIZE = 48;

export interface StudentAvatarProps {
  photoUrl: string | null;
  backgroundColor: string;
}

export function StudentAvatar({
  photoUrl,
  backgroundColor,
}: StudentAvatarProps): ReactElement {
  const [hasError, setHasError] = useState(false);
  const useFallback = !photoUrl || hasError;

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {useFallback ? (
        <Image
          testID="student-avatar-fallback-image"
          source={require("../../../../assets/images/avatar-crianca.png")}
          style={styles.image}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Image
          testID="student-avatar-photo-image"
          source={{ uri: photoUrl as string }}
          style={styles.image}
          accessibilityIgnoresInvertColors
          onError={() => setHasError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SIZE,
    height: SIZE,
  },
});
