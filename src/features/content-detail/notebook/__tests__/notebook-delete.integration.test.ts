import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { listTaskNotebooks } from "@/api/endpoints/content";
import { deleteTaskNotebook } from "@/api/endpoints/task-notebook-delete";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/content";
import "@/mocks/handlers/notebook-delete";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("deleteTaskNotebook com mockAdapter", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("remove o caderno da lista após excluir", async () => {
    const before = await listTaskNotebooks();
    const [{ notebook }] = before;

    await expect(deleteTaskNotebook(notebook.id)).resolves.toBeUndefined();

    const after = await listTaskNotebooks();
    expect(after.some((entry) => entry.notebook.id === notebook.id)).toBe(
      false,
    );
  });

  it("id inexistente devolve 500 com TASK_NOTEBOOK_NOT_FOUND", async () => {
    await expect(
      deleteTaskNotebook("notebook-inexistente"),
    ).rejects.toMatchObject({ status: 500, code: "TASK_NOTEBOOK_NOT_FOUND" });
  });
});
