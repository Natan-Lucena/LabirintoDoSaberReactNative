export interface PaletteColor {
  name: string;
  hex: string;
}

/** Paleta fixa em português; a ATV-11 (editor) reaproveita a mesma lista. */
export const COLOR_PALETTE: readonly PaletteColor[] = [
  { name: "vermelho", hex: "#DC2626" },
  { name: "laranja", hex: "#F97316" },
  { name: "amarelo", hex: "#FACC15" },
  { name: "verde", hex: "#16A34A" },
  { name: "azul", hex: "#2563EB" },
  { name: "roxo", hex: "#9333EA" },
  { name: "rosa", hex: "#EC4899" },
  { name: "marrom", hex: "#92400E" },
  { name: "preto", hex: "#000000" },
  { name: "branco", hex: "#FFFFFF" },
  { name: "cinza", hex: "#808080" },
];

const FALLBACK = "cinza";

function toRgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) {
    return null;
  }
  return [
    parseInt(match[1]!, 16),
    parseInt(match[2]!, 16),
    parseInt(match[3]!, 16),
  ];
}

/** Nome em português da cor da paleta mais próxima (distância RGB). */
export function colorName(hex: string): string {
  const rgb = toRgb(hex);
  if (!rgb) {
    return FALLBACK;
  }
  let best = FALLBACK;
  let bestDistance = Infinity;
  for (const entry of COLOR_PALETTE) {
    const ref = toRgb(entry.hex)!;
    const distance =
      (rgb[0] - ref[0]) ** 2 + (rgb[1] - ref[1]) ** 2 + (rgb[2] - ref[2]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry.name;
    }
  }
  return best;
}
