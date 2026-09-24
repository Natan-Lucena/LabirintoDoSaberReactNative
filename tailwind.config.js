/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tokens do design entram na T-201 (src/theme); aqui só o wiring do NativeWind.
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
