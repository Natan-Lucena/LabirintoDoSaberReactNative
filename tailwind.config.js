// Lê os tokens de src/theme (T-201): nenhum valor de cor é duplicado aqui.
// `palette.js` é a fonte única em CommonJS puro, sem depender de strip de
// tipos do Node (que só existe sem flag a partir do Node 22.18) nem de
// ts-node/babel-register (nenhuma dependência nova). `tokens.ts` reexporta
// os mesmos valores, tipados, para o resto do app.
const { color, maxContentWidthTablet } = require("./src/theme/palette.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: color,
      maxWidth: { tablet: `${maxContentWidthTablet}px` },
    },
  },
  plugins: [],
};
