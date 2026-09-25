// Fonte única dos valores brutos de cor e forma (DESIGN §4), em JavaScript
// puro (CommonJS) para que o tailwind.config.js (Node, fora do bundler) e o
// tokens.ts (TypeScript, `allowJs`) leiam exatamente os mesmos valores sem
// depender de strip de tipos do Node nem de duplicar dados.

/** @type {Record<string, string>} Valores exatos da fonte (DESIGN §4). */
const color = {
  primary: "rgb(114,222,212)",
  selection: "rgb(216,245,243)",
  accent: "rgb(26,90,82)",
  pink: "rgb(233,75,143)",
  success: "rgb(80,200,120)",
  background: "rgb(246,248,248)",
  surface: "#fff",
  border: "rgb(224,224,224)",
  tagNeutral: "rgb(243,244,246)",
  text: "rgb(0,0,0)",
  textSecondary: "rgb(63,74,73)",
  textTertiary: "rgb(158,151,151)",
};

/**
 * Largura máxima de conteúdo em tablet (R4), em dp. Provisório (DESIGN §6 não
 * fixa o valor); sujeito ao aceite visual do usuário (G-18).
 */
const maxContentWidthTablet = 720;

module.exports = { color, maxContentWidthTablet };
