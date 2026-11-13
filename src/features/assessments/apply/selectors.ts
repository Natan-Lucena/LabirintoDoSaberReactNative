import type { ScaleApplication, ScaleItem, ScaleTemplate } from "@/api/types";

/** Itens na ordem do servidor (`order`); a ordem das opções não é alterada. */
export function sortedItems(template: ScaleTemplate): ScaleItem[] {
  return [...template.items].sort((a, b) => a.order - b.order);
}

/** Valor já salvo no servidor para o item, se houver. */
export function savedAnswer(
  application: ScaleApplication,
  itemId: string,
): number | undefined {
  return application.answers.find((answer) => answer.itemId === itemId)?.value;
}

/** Índice da primeira pergunta sem resposta salva, ou `-1` se todas têm. */
export function firstUnansweredIndex(
  items: ScaleItem[],
  application: ScaleApplication,
): number {
  return items.findIndex(
    (item) => savedAnswer(application, item.id) === undefined,
  );
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
