import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn() }),
}));
vi.mock("expo-print", () => ({
  printAsync: vi.fn(),
  printToFileAsync: vi.fn(),
}));
vi.mock("@/features/reports/sharePdf", () => ({
  sharePdfFromBase64: vi.fn(),
}));

const printableTask = {
  id: "imprimivel-1",
  category: "writing",
  type: "printable",
  format: "PRINTABLE",
  source: "EDUCATOR",
  prompt: "Complete a folha",
  alternatives: [],
  createdAt: "2026-01-01T12:00:00.000Z",
  content: {
    kind: "printable",
    title: "Folha Teste",
    instructions: "Complete a sequência",
    layout: "LIST",
    items: [{ id: "i1", text: "A, B, __" }],
  },
} as Task;

vi.mock("@/api/endpoints/content", () => ({
  getTaskById: () => Promise.resolve(printableTask),
}));

const { PrintableScreen } =
  await import("@/features/activities/printable/PrintableScreen");

function noRetryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("PrintableScreen (revisão da ATV-05)", () => {
  beforeEach(() => routerPush.mockClear());

  it("vindo do banco, leva ao detalhe (editar, excluir ou duplicar)", async () => {
    await render(<PrintableScreen taskId="imprimivel-1" />, {
      queryClient: noRetryClient(),
    });

    await fireEvent.press(
      await screen.findByRole("button", { name: "Detalhes da atividade" }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/content/task/[id]",
      params: { id: "imprimivel-1" },
    });
  });

  it("vindo do detalhe, não oferece voltar a ele de novo", async () => {
    await render(<PrintableScreen taskId="imprimivel-1" fromDetail />, {
      queryClient: noRetryClient(),
    });

    expect(await screen.findByText("Complete a sequência")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Detalhes da atividade" }),
    ).toBeNull();
  });
});
