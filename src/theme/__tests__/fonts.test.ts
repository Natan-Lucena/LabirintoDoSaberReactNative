import { describe, expect, it } from "vitest";

import { fontFamilies, useAppFonts } from "../fonts";
import { typography } from "../typography";

describe("AC-DS-01-03 fontes e tipografia", () => {
  it("expõe todos os pesos Nunito usados no Make", () => {
    expect(fontFamilies.nunito).toMatchObject({
      regular: "Nunito_400Regular",
      medium: "Nunito_500Medium",
      semiBold: "Nunito_600SemiBold",
      bold: "Nunito_700Bold",
      extraBold: "Nunito_800ExtraBold",
    });
  });

  it("usa a família do peso, sem fontWeight junto de fonte customizada", () => {
    for (const style of Object.values(typography)) {
      expect(style).not.toHaveProperty("fontWeight");
    }
  });

  it("define title, eyebrow, section, body e small", () => {
    expect(typography.title).toMatchObject({
      fontSize: 24,
      fontFamily: fontFamilies.nunito.extraBold,
      letterSpacing: -0.6,
    });
    expect(typography.eyebrow).toMatchObject({
      fontSize: 12,
      fontFamily: fontFamilies.nunito.bold,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    });
    expect(typography.section).toMatchObject({
      fontSize: 17,
      fontFamily: fontFamilies.nunito.extraBold,
    });
    expect(typography.body.fontFamily).toBe(fontFamilies.nunito.regular);
    expect(typography.small.fontFamily).toBe(fontFamilies.nunito.regular);
  });

  it("mantém o hook de carregamento disponível", () => {
    expect(typeof useAppFonts).toBe("function");
  });
});
