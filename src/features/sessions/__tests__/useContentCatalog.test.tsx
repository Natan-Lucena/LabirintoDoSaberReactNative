import { Text } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listTasks } from "@/api/endpoints/content";
import { createQueryClient } from "@/api/query-client";
import type { Task } from "@/api/types";
import { render, screen, waitFor } from "@/test-utils/render";
import { useContentCatalog } from "../useContentCatalog";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: vi.fn(),
  listTaskGroupsByEducator: vi.fn(),
  listTasks: vi.fn(),
}));

function task(overrides: Partial<Task> & Pick<Task, "id" | "type">): Task {
  return {
    category: "reading",
    prompt: `Atividade ${overrides.id}`,
    alternatives: [],
    createdAt: "2026-11-25T12:00:00.000Z",
    ...overrides,
  };
}

function CatalogNames({ kind }: { kind: "task" | "group" | "notebook" }) {
  const { items, isLoading } = useContentCatalog(kind);
  return (
    <Text>{isLoading ? "carregando" : items.map((i) => i.id).join("|")}</Text>
  );
}

async function renderCatalog() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  await render(<CatalogNames kind="task" />, { queryClient });
}

describe("useContentCatalog: atividades avulsas (EVO-03, AT-10)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não lista imprimíveis (por tipo nem por formato) e mantém quiz e jogos", async () => {
    vi.mocked(listTasks).mockResolvedValue([
      task({ id: "quiz", type: "multipleChoice" }),
      task({ id: "media", type: "multipleChoiceWithMedia" }),
      task({ id: "word", type: "wordBuilder" }),
      task({ id: "color", type: "colorMatch" }),
      task({ id: "memory", type: "memoryGame" }),
      task({ id: "print", type: "printable", format: "PRINTABLE" }),
      task({ id: "print-by-type", type: "printable" }),
      task({ id: "print-by-format", type: "wordBuilder", format: "PRINTABLE" }),
    ]);

    await renderCatalog();

    await waitFor(() =>
      expect(screen.getByText("quiz|media|word|color|memory")).toBeTruthy(),
    );
  });

  it("mantém todas as atividades antigas, sem `type` ou `format`", async () => {
    vi.mocked(listTasks).mockResolvedValue([
      { ...task({ id: "old", type: "multipleChoice" }), format: undefined },
    ]);

    await renderCatalog();

    await waitFor(() => expect(screen.getByText("old")).toBeTruthy());
  });
});
