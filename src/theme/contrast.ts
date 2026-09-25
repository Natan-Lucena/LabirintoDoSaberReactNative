// Cálculo de contraste WCAG 2.x (luminância relativa).

function parseColor(value: string): [number, number, number] {
  const rgbMatch = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const int = Number.parseInt(full, 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }

  throw new Error(
    `Cor não suportada: "${value}" (use "rgb(r,g,b)" ou hex "#rgb"/"#rrggbb")`,
  );
}

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Razão de contraste WCAG entre duas cores (`"rgb(r,g,b)"` ou hex `#rgb`/`#rrggbb`).
 * Retorna um número entre 1 e 21 (1 = sem contraste, 21 = preto sobre branco).
 */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const l1 = relativeLuminance(parseColor(foreground));
  const l2 = relativeLuminance(parseColor(background));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
