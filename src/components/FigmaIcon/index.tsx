import type { ReactElement } from "react";
import { Circle, Path, Rect, Svg } from "react-native-svg";

import { color as colorTokens } from "../../theme";

export type FigmaIconName =
  | "home"
  | "calendar"
  | "users"
  | "grid"
  | "bell"
  | "search"
  | "chevron"
  | "clock"
  | "message"
  | "sparkles"
  | "clipboard"
  | "chart"
  | "book"
  | "file"
  | "play"
  | "plus"
  | "check"
  | "arrow"
  | "brain"
  | "print"
  | "share"
  | "close";

export interface FigmaIconProps {
  name: FigmaIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Elementos extraídos de `iconPaths` do Figma Make `src/App.tsx`
// (viewBox 0 0 24 24, fill none, stroke currentColor, stroke-width 1.8,
// linecap/linejoin round). Ver ficha DS-02 do backlog.
function renderIconElements(name: FigmaIconName): ReactElement {
  switch (name) {
    case "home":
      return (
        <>
          <Path d="M3 10.8 12 3l9 7.8" />
          <Path d="M5.5 9.7V21h13V9.7M9 21v-7h6v7" />
        </>
      );
    case "calendar":
      return (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} />
          <Path d="M8 3v4m8-4v4M3 10h18" />
        </>
      );
    case "users":
      return (
        <>
          <Circle cx={9} cy={8} r={3.5} />
          <Path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6" />
          <Path d="M16 6.2a3 3 0 0 1 0 5.7M17 15c2.3.6 3.6 2.2 4 5" />
        </>
      );
    case "grid":
      return (
        <>
          <Rect x={3} y={3} width={7} height={7} rx={2} />
          <Rect x={14} y={3} width={7} height={7} rx={2} />
          <Rect x={3} y={14} width={7} height={7} rx={2} />
          <Rect x={14} y={14} width={7} height={7} rx={2} />
        </>
      );
    case "bell":
      return (
        <>
          <Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8" />
          <Path d="M10 21h4" />
        </>
      );
    case "search":
      return (
        <>
          <Circle cx={10.5} cy={10.5} r={6.5} />
          <Path d="m16 16 5 5" />
        </>
      );
    case "chevron":
      return <Path d="m9 18 6-6-6-6" />;
    case "clock":
      return (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v5l3.5 2" />
        </>
      );
    case "message":
      return (
        <>
          <Path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
          <Path d="M8 12h.01M12 12h.01M16 12h.01" />
        </>
      );
    case "sparkles":
      return (
        <>
          <Path d="m12 3 1.5 4.2L18 9l-4.5 1.8L12 15l-1.5-4.2L6 9l4.5-1.8L12 3Z" />
          <Path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3Z" />
        </>
      );
    case "clipboard":
      return (
        <>
          <Rect x={5} y={4} width={14} height={17} rx={2} />
          <Path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h4" />
        </>
      );
    case "chart":
      return <Path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />;
    case "book":
      return (
        <>
          <Path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-4H4V4Z" />
          <Path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-4h3V4Z" />
        </>
      );
    case "file":
      return (
        <>
          <Path d="M6 2h8l4 4v16H6V2Z" />
          <Path d="M14 2v5h5M9 12h6m-6 4h6" />
        </>
      );
    case "play":
      return (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="m10 8 6 4-6 4V8Z" />
        </>
      );
    case "plus":
      return <Path d="M12 5v14M5 12h14" />;
    case "check":
      return <Path d="m5 12 4 4L19 6" />;
    case "arrow":
      return <Path d="M5 12h14m-5-5 5 5-5 5" />;
    case "brain":
      return (
        <>
          <Path d="M9.5 5A3.5 3.5 0 0 0 6 8.5v.3A3.5 3.5 0 0 0 4 12a3.5 3.5 0 0 0 2.5 3.4V17a3 3 0 0 0 5.5 1.7V5.5A3 3 0 0 0 9.5 5Z" />
          <Path d="M14.5 5A3.5 3.5 0 0 1 18 8.5v.3a3.5 3.5 0 0 1 2 3.2 3.5 3.5 0 0 1-2.5 3.4V17a3 3 0 0 1-5.5 1.7V5.5A3 3 0 0 1 14.5 5Z" />
          <Path d="M8 10h4m4-2v4m-4 4h4" />
        </>
      );
    case "print":
      return (
        <>
          <Path d="M7 8V3h10v5M7 17H4v-7h16v7h-3" />
          <Path d="M7 14h10v7H7z" />
        </>
      );
    case "share":
      return (
        <>
          <Circle cx={18} cy={5} r={2.5} />
          <Circle cx={6} cy={12} r={2.5} />
          <Circle cx={18} cy={19} r={2.5} />
          <Path d="m8.2 10.8 7.6-4.5m-7.6 6.9 7.6 4.5" />
        </>
      );
    case "close":
      return <Path d="m6 6 12 12M18 6 6 18" />;
  }
}

export function FigmaIcon({
  name,
  size = 20,
  color = colorTokens.ink[950],
  strokeWidth = 1.8,
}: FigmaIconProps): ReactElement {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      testID={`figma-icon-${name}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {renderIconElements(name)}
    </Svg>
  );
}
