import { describe, expect, it } from "vitest";

import { getContrastRatio } from "../contrast";
import { color, maxContentWidthTablet, semanticColor } from "../tokens";
import { typography } from "../typography";

// AC-201-01: cada cor da fonte (DESIGN §4) com valor idêntico.
describe("AC-201-01 cores da fonte", () => {
  it("usa os valores exatos de DESIGN §4", () => {
    expect(color.primary).toBe("rgb(114,222,212)");
    expect(color.selection).toBe("rgb(216,245,243)");
    expect(color.accent).toBe("rgb(26,90,82)");
    expect(color.pink).toBe("rgb(233,75,143)");
    expect(color.success).toBe("rgb(80,200,120)");
    expect(color.background).toBe("rgb(246,248,248)");
    expect(color.surface).toBe("#fff");
    expect(color.border).toBe("rgb(224,224,224)");
    expect(color.tagNeutral).toBe("rgb(243,244,246)");
    expect(color.text).toBe("rgb(0,0,0)");
    expect(color.textSecondary).toBe("rgb(63,74,73)");
    expect(color.textTertiary).toBe("rgb(158,151,151)");
  });
});

// AC-201-02: pares texto/fundo usados pelos componentes com contraste
// WCAG >= 4,5:1 (>= 3:1 para texto grande e UI).
describe("AC-201-02 contraste dos pares semânticos aprovados", () => {
  it("texto principal e secundário sobre surface/background >= 4,5:1", () => {
    expect(
      getContrastRatio(semanticColor.textOnSurface, color.surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(semanticColor.textOnBackground, color.background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(semanticColor.textSecondaryOnSurface, color.surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(
        semanticColor.textSecondaryOnBackground,
        color.background,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("texto de destaque (accent) sobre surface e sobre selection >= 4,5:1", () => {
    expect(
      getContrastRatio(semanticColor.textAccentOnSurface, color.surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      getContrastRatio(semanticColor.textOnSelection, color.selection),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("texto sobre primary usa a adaptação aprovada (accent) >= 4,5:1", () => {
    expect(
      getContrastRatio(semanticColor.textOnPrimary, color.primary),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("texto secundário sobre tag neutra >= 4,5:1", () => {
    expect(
      getContrastRatio(semanticColor.textOnTagNeutral, color.tagNeutral),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("pink é permitido só como acento/texto grande: entre 3:1 e 4,5:1 sobre surface", () => {
    const ratio = getContrastRatio(
      semanticColor.pinkAccentLargeTextOnly,
      color.surface,
    );
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });
});

// Pares que DEVEM falhar (documentados em DESIGN §4): os tokens semânticos
// não podem usá-los. Garante que ninguém "conserte" isso elevando o valor.
describe("AC-201-02 pares que devem falhar (não usados pelos tokens semânticos)", () => {
  it("branco sobre primary falha para texto normal e para UI (< 3:1)", () => {
    expect(getContrastRatio("#fff", color.primary)).toBeLessThan(3);
  });

  it("textTertiary como texto falha (< 4,5:1) sobre surface e background", () => {
    expect(getContrastRatio(color.textTertiary, color.surface)).toBeLessThan(
      4.5,
    );
    expect(getContrastRatio(color.textTertiary, color.background)).toBeLessThan(
      4.5,
    );
  });

  it("border é só decorativo: falha até para componentes de UI (< 3:1)", () => {
    expect(getContrastRatio(color.border, color.surface)).toBeLessThan(3);
  });

  it("success é só decorativo (borda de acento), não serve como texto (< 4,5:1)", () => {
    expect(getContrastRatio(color.success, color.surface)).toBeLessThan(4.5);
  });
});

describe("Tipografia (DESIGN §4, proposta mobile) e largura máxima de conteúdo", () => {
  it("respeita os tamanhos mínimos aprovados (12 metadado, 14 corpo)", () => {
    expect(typography.tag.fontSize).toBeGreaterThanOrEqual(12);
    expect(typography.body.fontSize).toBeGreaterThanOrEqual(14);
  });

  it("usa os tamanhos/entrelinhas propostos para os papéis principais", () => {
    expect(typography.header).toMatchObject({ fontSize: 22, lineHeight: 28 });
    expect(typography.screenTitle).toMatchObject({
      fontSize: 20,
      lineHeight: 26,
    });
    expect(typography.sectionTitle).toMatchObject({
      fontSize: 16,
      lineHeight: 22,
    });
    expect(typography.cardTitle).toMatchObject({
      fontSize: 15,
      lineHeight: 20,
    });
    expect(typography.body).toMatchObject({ fontSize: 14, lineHeight: 20 });
    expect(typography.button).toMatchObject({ fontSize: 16, lineHeight: 20 });
    expect(typography.tabLabel).toMatchObject({ fontSize: 12, lineHeight: 16 });
  });

  it("tem uma largura máxima de conteúdo para tablet (R4)", () => {
    expect(maxContentWidthTablet).toBeGreaterThan(0);
  });
});
