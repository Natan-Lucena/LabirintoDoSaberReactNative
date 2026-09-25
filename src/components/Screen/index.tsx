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
  // ScrollView aplica `padding`/`gap` de `style` ao contêiner externo (que só
  // tem um filho, o viewport nativo), não ao conteúdo rolável — por isso o
  // espaçamento (ex.: gap entre AppHeader e o banner da Home) precisa ir em
  // `contentContainerStyle`, não em `style`.
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          testID="screen-content"
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, style]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View testID="screen-content" style={[styles.content, style]}>
        {children}
      </View>
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
  flex: { flex: 1 },
  scrollContent: {
    width: "100%",
    maxWidth: maxContentWidthTablet,
    alignSelf: "center",
  },
});
