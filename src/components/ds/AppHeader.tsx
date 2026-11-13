// `AppHeader` novo do Figma Make (`.app-header`): eyebrow + título à
// esquerda; sino nas telas de aba ou botão voltar nas telas internas. Ver
// ficha NAV-02 do backlog. Não confundir com `@/components/AppHeader`
// (versão da Entrega 1), que continua em uso nas telas ainda não migradas.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, semanticColor, typography } from "../../theme";
import { BackButton } from "./BackButton";
import { IconButton } from "./IconButton";

export interface AppHeaderProps {
  title: string;
  /** Eyebrow (subtítulo pequeno) acima do título. */
  subtitle?: string;
  /** Telas internas: mostra o botão voltar em vez do sino. */
  onBack?: () => void;
  /** Telas de aba: mostra o sino de notificações (ignorado quando há onBack). */
  onBellPress?: () => void;
  /** Notificações não lidas: mostra o contador no sino (NOT-01). */
  unreadCount?: number;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  onBellPress,
  unreadCount = 0,
}: AppHeaderProps): ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack ? <BackButton onPress={onBack} /> : null}
        <View style={styles.titleGroup}>
          {subtitle ? (
            <Text style={styles.eyebrow} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessible
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>
      {!onBack && onBellPress ? (
        <View>
          <IconButton
            icon="bell"
            accessibilityLabel={
              unreadCount === 0
                ? "Notificações"
                : unreadCount === 1
                  ? "1 notificação não lida"
                  : `${unreadCount} notificações não lidas`
            }
            onPress={onBellPress}
          />
          {unreadCount > 0 ? (
            <View style={styles.badge} pointerEvents="none">
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semanticColor.primaryFill,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: semanticColor.textOnPrimary,
  },
  titleGroup: {
    flex: 1,
  },
  eyebrow: {
    fontSize: typography.eyebrow.fontSize,
    lineHeight: typography.eyebrow.lineHeight,
    fontFamily: typography.eyebrow.fontFamily,
    letterSpacing: typography.eyebrow.letterSpacing,
    textTransform: typography.eyebrow.textTransform,
    color: color.ink[600],
  },
  title: {
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    fontFamily: typography.title.fontFamily,
    letterSpacing: typography.title.letterSpacing,
    color: color.text,
  },
});
