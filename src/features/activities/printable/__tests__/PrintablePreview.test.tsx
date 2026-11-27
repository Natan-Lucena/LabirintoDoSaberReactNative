import { StyleSheet } from "react-native";
import { describe, expect, it } from "vitest";

import type { PrintableContent } from "@/api/types";
import { PrintablePreview } from "@/features/activities/printable/PrintablePreview";
import { render, screen } from "@/test-utils/render";

function content(layout: PrintableContent["layout"]): PrintableContent {
  return {
    kind: "printable",
    title: "Folha",
    instructions: "Observe",
    layout,
    items: [
      { id: "a", text: "Primeiro" },
      { id: "b", text: "Segundo", answerLines: 1 },
      { id: "c", text: "Terceiro" },
    ],
  } as PrintableContent;
}

describe("PrintablePreview (D1: layout SEQUENCE)", () => {
  it("SEQUENCE mostra os 3 itens e 2 setas entre eles", async () => {
    await render(<PrintablePreview content={content("SEQUENCE")} />);
    expect(screen.getByText("Primeiro")).toBeTruthy();
    expect(screen.getByText("Segundo")).toBeTruthy();
    expect(screen.getByText("Terceiro")).toBeTruthy();
    expect(screen.getAllByText("→")).toHaveLength(2);
  });

  it("SEQUENCE não usa flex:1 nos itens (evita colapsar a largura 0)", async () => {
    await render(<PrintablePreview content={content("SEQUENCE")} />);
    for (let i = 0; i < 3; i++) {
      const item = StyleSheet.flatten(
        screen.getByTestId(`printable-item-${i}`).props.style,
      );
      const body = StyleSheet.flatten(
        screen.getByTestId(`printable-item-body-${i}`).props.style,
      );
      expect(item?.flex).toBeUndefined();
      expect(item?.flexDirection).not.toBe("row");
      expect(body?.flex).toBeUndefined();
    }
  });

  it("LIST não mostra setas e mantém a numeração", async () => {
    await render(<PrintablePreview content={content("LIST")} />);
    expect(screen.queryByText("→")).toBeNull();
    expect(screen.getByText("1.")).toBeTruthy();
    expect(screen.getByText("Terceiro")).toBeTruthy();
  });
});
