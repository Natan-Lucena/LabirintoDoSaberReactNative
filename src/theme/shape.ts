// Tokens de forma da T-202 (DESIGN §4, coluna "Proposta", G-17). Lacuna da
// T-201 corrigida aqui: fonte única em `palette.js`, mesmo padrão de
// `tokens.ts`. `hairlineWidth` usa `StyleSheet.hairlineWidth` (não vem de
// `palette.js`, que é CommonJS puro sem RN).
import { StyleSheet } from "react-native";

import palette from "./palette.js";

export const shape = {
  ...palette.shape,
  hairlineWidth: StyleSheet.hairlineWidth,
} as const;

export type ShapeToken = keyof typeof shape;
