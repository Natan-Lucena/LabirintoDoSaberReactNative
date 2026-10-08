import { describe, expect, it } from "vitest";

import { markdownToHtml } from "../markdownToHtml";

describe("markdownToHtml", () => {
  it("converte títulos, parágrafos, listas e ênfase", () => {
    const html = markdownToHtml(
      [
        "## Visão Geral",
        "",
        "Texto com **negrito** e *itálico*.",
        "",
        "- primeiro",
        "- segundo",
        "",
        "1. passo um",
        "2. passo dois",
      ].join("\n"),
    );

    expect(html).toContain("<h2>Visão Geral</h2>");
    expect(html).toContain(
      "<p>Texto com <strong>negrito</strong> e <em>itálico</em>.</p>",
    );
    expect(html).toContain("<ul><li>primeiro</li><li>segundo</li></ul>");
    expect(html).toContain("<ol><li>passo um</li><li>passo dois</li></ol>");
  });

  it("escapa HTML vindo da IA antes de converter", () => {
    const html = markdownToHtml(
      '## <script>alert(1)</script>\n\nTexto <img src=x onerror="x()">',
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("junta linhas seguidas no mesmo parágrafo e ignora texto vazio", () => {
    expect(markdownToHtml("linha um\nlinha dois")).toBe(
      "<p>linha um linha dois</p>",
    );
    expect(markdownToHtml("   \n\n")).toBe("");
  });

  it("limita os níveis de título a h2–h4 para não competir com o documento", () => {
    const html = markdownToHtml("# Título\n\n#### Detalhe");

    expect(html).toContain("<h2>Título</h2>");
    expect(html).toContain("<h4>Detalhe</h4>");
  });
});
