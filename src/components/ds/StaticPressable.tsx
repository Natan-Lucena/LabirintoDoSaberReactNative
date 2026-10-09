// `Pressable` que aceita `style` em função, mas entrega um estilo estático ao
// componente nativo: no Expo Go o NativeWind descarta o estilo em função do
// `Pressable` (o botão perdia fundo, largura e alinhamento).
import { useState, type ReactElement, type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface StaticPressableProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  style?:
    | StyleProp<ViewStyle>
    | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children?: ReactNode;
}

export function StaticPressable({
  style,
  children,
  onPressIn,
  onPressOut,
  ...props
}: StaticPressableProps): ReactElement {
  const [pressed, setPressed] = useState(false);
  const resolved = typeof style === "function" ? style({ pressed }) : style;

  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={resolved}
    >
      {children}
    </Pressable>
  );
}
