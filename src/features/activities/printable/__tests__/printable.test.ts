import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrintableContent } from "@/api/types";
import { taskDestination } from "@/features/activities/navigation";

import { sharePrintablePdf } from "../pdf";
import { buildPrintableHtml } from "../printableHtml";

const { printAsync, printToFileAsync, sharePdfFromBase64 } = vi.hoisted(() => ({
  printAsync: vi.fn(),
  printToFileAsync: vi.fn(),
  sharePdfFromBase64: vi.fn(),
}));

vi.mock("expo-print", () => ({ printAsync, printToFileAsync }));
vi.mock("@/features/reports/sharePdf", () => ({ sharePdfFromBase64 }));

const content: PrintableContent = {
  kind: "printable",
  title: "Complete <b>a</b> sequência",
  instructions: "Escreva a letra & pronto",
  layout: "LIST",
  items: [
    { id: "1", text: "A, B, __, D", answerLines: 2 },
    { id: "2", imageUrl: "https://x.test/a.png?a=1&b=2" },
    { id: "3" },
  ],
};

describe("imprimível (ATV-05)", () => {
  beforeEach(() => {
    printToFileAsync.mockReset();
    sharePdfFromBase64.mockReset();
  });

  it("AC-ATV-05-01: título, instruções e itens, com texto escapado", () => {
    const html = buildPrintableHtml(content);
    expect(html).toContain("Complete &lt;b&gt;a&lt;/b&gt; sequência");
    expect(html).toContain("Escreva a letra &amp; pronto");
    expect(html).toContain("<ol>");
    expect(html).toContain("A, B, __, D");
    expect(html).toContain("a=1&amp;b=2");
    expect(html.match(/<li>/g)).toHaveLength(2);
    expect(html.match(/class="line"/g)).toHaveLength(2);
  });

  it("respeita os layouts GRID e SEQUENCE", () => {
    expect(buildPrintableHtml({ ...content, layout: "GRID" })).toContain(
      'class="grid"',
    );
    const seq = buildPrintableHtml({ ...content, layout: "SEQUENCE" });
    expect(seq).toContain("&rarr;");
  });

  it("AC-ATV-05-03: nome escapado no HTML e fora do nome do arquivo", async () => {
    expect(buildPrintableHtml(content, { childName: "<i>Ana</i>" })).toContain(
      "Nome: &lt;i&gt;Ana&lt;/i&gt;",
    );
    printToFileAsync.mockResolvedValue({ base64: "QUJD" });
    await sharePrintablePdf(content, "Criança Teste");
    expect(printToFileAsync.mock.calls[0]![0].html).toContain("Criança Teste");
    expect(sharePdfFromBase64).toHaveBeenCalledWith(
      "QUJD",
      "atividade-imprimivel.pdf",
      { deleteAfterShare: true },
    );
  });

  it("AC-ATV-05-04: o imprimível abre a prévia; o resto, o detalhe", () => {
    expect(taskDestination({ id: "t1", format: "PRINTABLE" })).toEqual({
      pathname: "/activities/print/[id]",
      params: { id: "t1" },
    });
    expect(taskDestination({ id: "t2", format: "INTERACTIVE" })).toEqual({
      pathname: "/content/task/[id]",
      params: { id: "t2" },
    });
  });
});
