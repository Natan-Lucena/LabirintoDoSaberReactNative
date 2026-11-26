import type { PrintableContent } from "@/api/types";
import { escapeHtml } from "@/features/reports/session/sessionReport";

type PrintableItem = PrintableContent["items"][number];

export interface PrintableHtmlOptions {
  /** Só vai para o PDF; nunca é salvo nem enviado. */
  childName?: string;
}

const MAX_ANSWER_LINES = 5;

function itemBody(item: PrintableItem): string {
  const text = item.text?.trim();
  const image = item.imageUrl?.trim();
  const parts: string[] = [];
  if (image) {
    parts.push(`<img src="${escapeHtml(image)}" alt="" />`);
  }
  if (text) {
    parts.push(`<span>${escapeHtml(text)}</span>`);
  }
  return parts.join("");
}

function answerLines(item: PrintableItem): string {
  const count = Math.min(
    MAX_ANSWER_LINES,
    Math.max(0, Math.trunc(item.answerLines ?? 0)),
  );
  return '<div class="line"></div>'.repeat(count);
}

function renderItem(item: PrintableItem): string | null {
  const body = itemBody(item);
  if (!body) return null;
  return `${body}${answerLines(item)}`;
}

function renderItems(content: PrintableContent): string {
  const rendered = content.items
    .map(renderItem)
    .filter((html): html is string => html !== null);
  if (content.layout === "GRID") {
    const cells = rendered.map((html, index) =>
      index > 0 && index % 2 === 0
        ? `</tr><tr><td>${html}</td>`
        : `<td>${html}</td>`,
    );
    return `<table class="grid"><tr>${cells.join("")}</tr></table>`;
  }
  if (content.layout === "SEQUENCE") {
    const cells = rendered.map((html) => `<div class="seq-item">${html}</div>`);
    return `<div class="sequence">${cells.join('<span class="arrow">&rarr;</span>')}</div>`;
  }
  return `<ol>${rendered.map((html) => `<li>${html}</li>`).join("")}</ol>`;
}

/** HTML do imprimível: A4, texto escapado, nome da criança opcional. */
export function buildPrintableHtml(
  content: PrintableContent,
  options: PrintableHtmlOptions = {},
): string {
  const name = options.childName?.trim() ?? "";
  const nameHtml = name ? escapeHtml(name) : "______________________________";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
@page { size: A4; margin: 16mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 14pt; color: #111; }
h1 { font-size: 20pt; margin: 0 0 12px; }
.meta { display: flex; justify-content: space-between; margin-bottom: 16px; }
.instructions { margin-bottom: 20px; }
ol { padding-left: 24px; }
li { margin-bottom: 16px; }
img { max-width: 160px; display: block; margin-bottom: 6px; }
.line { height: 28px; border-bottom: 1px solid #111; }
.grid { width: 100%; border-collapse: collapse; }
.grid td { width: 50%; vertical-align: top; padding: 8px; border: 1px solid #999; }
.sequence { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 12px; }
.seq-item { min-width: 80px; }
.arrow { align-self: center; }
</style>
</head>
<body>
<h1>${escapeHtml(content.title)}</h1>
<div class="meta"><span>Nome: ${nameHtml}</span><span>Data: ____/____/________</span></div>
<p class="instructions">${escapeHtml(content.instructions)}</p>
${renderItems(content)}
</body>
</html>`;
}
