// Fonte única dos valores brutos de cor e forma (DESIGN §4), em JavaScript
// puro (CommonJS) para que o tailwind.config.js (Node, fora do bundler) e o
// tokens.ts (TypeScript, `allowJs`) leiam exatamente os mesmos valores sem
// depender de strip de tipos do Node nem de duplicar dados.

/** Valores exatos do `:root` do Figma Make (DS-01). */
const color = {
  brand: {
    50: "#eefaf8",
    100: "#d9f3ef",
    200: "#b6e7df",
    500: "#25a99d",
    600: "#168d84",
    700: "#116f69",
  },
  ink: {
    950: "#173331",
    800: "#294b48",
    600: "#5a7471",
    500: "#748b88",
    300: "#b8c9c6",
  },
  surface: "#ffffff",
  surfaceSoft: "#f6faf9",
  border: "#dfeae8",
  peach: "#fff1e7",
  peachStrong: "#e88a4f",
  lavender: "#f1ecff",
  lavenderStrong: "#7661b5",
  yellow: "#fff7d8",
  warning: "#a36414",
  success: "#16845e",
  danger: "#d44c4c",
  // Aliases preservados enquanto os componentes da Entrega 1 migram para DS-01.
  primary: "#168d84",
  selection: "#eefaf8",
  accent: "#116f69",
  pink: "#d44c4c",
  background: "#f6faf9",
  tagNeutral: "#eefaf8",
  text: "#173331",
  textSecondary: "#5a7471",
  textTertiary: "#748b88",
};

/**
 * Largura máxima de conteúdo em tablet (R4), em dp. Provisório (DESIGN §6 não
 * fixa o valor); sujeito ao aceite visual do usuário (G-18).
 */
const maxContentWidthTablet = 720;

/**
 * Valores de forma (DESIGN §4, coluna "Proposta", aprovados em G-17).
 * Lacuna da T-201 corrigida na T-202: nenhum componente pode usar raio,
 * padding de alvo mínimo ou altura literal fora desta fonte.
 */
const shape = {
  radius: { sm: 10, md: 16, lg: 24, button: 13, avatar: 15 },
  contentPadding: 20,
  contentPaddingCompact: 15,
  shadow: {
    sm: {
      shadowColor: "rgb(31,75,70)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    md: {
      shadowColor: "rgb(31,75,70)",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.13,
      shadowRadius: 36,
      elevation: 8,
    },
  },
  cardRadius: 16,
  buttonRadius: 13,
  inputRadius: 10,
  minTouchTarget: 48,
  tagPaddingVertical: 4,
  tagPaddingHorizontal: 10,
  accentBorderWidth: 3,
  avatarSize: 40,
};

module.exports = { color, maxContentWidthTablet, shape };
