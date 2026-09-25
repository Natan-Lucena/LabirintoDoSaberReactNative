import type { ReactElement } from "react";
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
  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={
          photoUrl
            ? { uri: photoUrl }
            : require("../../../../assets/images/avatar-crianca.png")
        }
        style={styles.image}
        accessibilityIgnoresInvertColors
      />
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
