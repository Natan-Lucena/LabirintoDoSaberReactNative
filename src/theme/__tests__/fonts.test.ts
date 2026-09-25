import { describe, expect, it } from "vitest";

import { fontFamilies, useAppFonts } from "../fonts";
import { typography } from "../typography";

// AC-201-03 (fontes carregam sem flash) é MAN — depende de build autorizado.
// Aqui só o que é testável sem nativo: os identificadores de fonte e a
// ligação com a tipografia.
describe("AC-201-03 (parcial, sem nativo) identificadores de fonte", () => {
  it("expõe os pesos usados pelo design (Nunito, Roboto, Roboto Mono)", () => {
    expect(fontFamilies.nunito.regular).toBe("Nunito_400Regular");
    expect(fontFamilies.nunito.bold).toBe("Nunito_700Bold");
    expect(fontFamilies.roboto.regular).toBe("Roboto_400Regular");
    expect(fontFamilies.roboto.semiBold).toBe("Roboto_600SemiBold");
    expect(fontFamilies.robotoMono.regular).toBe("RobotoMono_400Regular");
  });

  it("a tipografia referencia os identificadores de fontFamilies (sem string solta)", () => {
    expect(typography.header.fontFamily).toBe(fontFamilies.roboto.regular);
    expect(typography.tabLabel.fontFamily).toBe(fontFamilies.roboto.semiBold);
    expect(typography.body.fontFamily).toBe(fontFamilies.nunito.regular);
    expect(typography.time.fontFamily).toBe(fontFamilies.robotoMono.regular);
  });

  it("useAppFonts existe como função (o carregamento em si exige nativo)", () => {
    expect(typeof useAppFonts).toBe("function");
  });
});
