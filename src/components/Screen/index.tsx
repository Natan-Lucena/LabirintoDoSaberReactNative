import type { PropsWithChildren, ReactElement } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { color, maxContentWidthTablet } from "../../theme";

export interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = false,
  style,
}: ScreenProps): ReactElement {
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Container testID="screen-content" style={[styles.content, style]}>
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: color.background,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: maxContentWidthTablet,
    alignSelf: "center",
  },
});
