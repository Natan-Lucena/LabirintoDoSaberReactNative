import { escapeHtml } from "@/features/reports/session/sessionReport";

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/**
 * Converte o Markdown da análise em HTML para o PDF. Cobre só o que a IA
 * devolve (títulos, parágrafos, listas, negrito e itálico). Todo o texto é
 * escapado antes de converter, então HTML vindo da IA nunca chega ao PDF.
 */
export function markdownToHtml(markdown: string): string {
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }
  function flushList() {
    if (list) {
      const items = list.items.map((item) => `<li>${item}</li>`).join("");
      blocks.push(`<${list.tag}>${items}</${list.tag}>`);
      list = null;
    }
  }

  for (const raw of escapeHtml(markdown).split("\n")) {
    const line = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);

    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(4, Math.max(2, heading[1]!.length));
      blocks.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
    } else if (bullet || ordered) {
      flushParagraph();
      const tag = bullet ? "ul" : "ol";
      if (list && list.tag !== tag) {
        flushList();
      }
      list ??= { tag, items: [] };
      list.items.push(inline((bullet ?? ordered)![1]!));
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks.join("");
}
