// Tokens de cor da T-201. Os valores brutos vêm de `palette.js` (fonte
// única, também lida pelo `tailwind.config.js`); aqui só tipamos e montamos
// os tokens semânticos aprovados (G-17).
import palette from "./palette.js";

export type ColorToken =
  | "primary"
  | "selection"
  | "accent"
  | "pink"
  | "success"
  | "background"
  | "surface"
  | "border"
  | "tagNeutral"
  | "text"
  | "textSecondary"
  | "textTertiary";

/** Valores exatos da fonte (DESIGN §4, coluna "Fonte"). */
export const color: Record<ColorToken, string> = palette.color;

/**
 * Tokens semânticos: pares texto/fundo aprovados (G-17) para uso pelos
 * componentes. Não incluir aqui nenhum par documentado como falho em
 * DESIGN §4 (ex.: branco sobre `primary`, `textTertiary` como texto,
 * `border`/`success` como texto) — os componentes não devem ler esses
 * pares através deste objeto.
 */
export const semanticColor = {
  /** Texto/ícone sobre `color.primary` (botão primário, banner). */
  textOnPrimary: color.accent,
  /** Texto principal sobre `surface`/`background`. */
  textOnSurface: color.text,
  textOnBackground: color.text,
  /** Texto secundário sobre `surface`/`background`. */
  textSecondaryOnSurface: color.textSecondary,
  textSecondaryOnBackground: color.textSecondary,
  /** Texto de destaque/links sobre `surface` (ou fundo claro). */
  textAccentOnSurface: color.accent,
  /** Texto sobre o fundo de seleção (`color.selection`). */
  textOnSelection: color.accent,
  /** Texto sobre tag neutra (`color.tagNeutral`). */
  textOnTagNeutral: color.textSecondary,
  /**
   * `color.pink` só é permitido como acento/borda ou texto grande (≥18,66px
   * bold ou ≥24px regular) — não atinge 4,5:1 para texto normal (DESIGN §4).
   */
  pinkAccentLargeTextOnly: color.pink,
} as const;

/**
 * Largura máxima de conteúdo em tablet (R4). Provisório (DESIGN §6 não
 * fixa o valor); 720dp aprovado pelo orquestrador em 2026-09-24, sujeito
 * ao aceite visual do usuário (G-18).
 */
export const maxContentWidthTablet: number = palette.maxContentWidthTablet;
