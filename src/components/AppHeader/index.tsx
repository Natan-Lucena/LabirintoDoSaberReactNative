import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../Avatar";
import { Icon } from "../Icon";
import { color, shape, typography } from "../../theme";

export interface AppHeaderProps {
  title: string;
  onMenuPress: () => void;
  onAvatarPress: () => void;
  avatarUri?: string;
  avatarInitials?: string;
}

export function AppHeader({
  title,
  onMenuPress,
  onAvatarPress,
  avatarUri,
  avatarInitials,
}: AppHeaderProps): ReactElement {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        style={styles.iconButton}
      >
        <Icon name="menu" />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header" accessible>
        {title}
      </Text>
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        style={styles.iconButton}
      >
        {avatarUri || avatarInitials ? (
          <Avatar
            uri={avatarUri}
            name={avatarInitials ?? ""}
            decorative
            size={24}
          />
        ) : (
          <Icon name="account" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.background,
    paddingHorizontal: 4,
  },
  iconButton: {
    width: shape.minTouchTarget,
    height: shape.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.header.fontSize,
    lineHeight: typography.header.lineHeight,
    fontFamily: typography.header.fontFamily,
    color: color.text,
  },
});
