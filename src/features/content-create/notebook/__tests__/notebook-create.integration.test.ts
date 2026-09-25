import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { createTaskNotebook } from "@/api/endpoints/task-notebook-create";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/notebook-create";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("createTaskNotebook com mockAdapter", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria um caderno tipado a partir do corpo do endpoint", async () => {
    await expect(
      createTaskNotebook({
        description: "Caderno de leitura",
        category: "reading",
        tasks: ["task-1"],
        taskGroupsIds: ["group-1"],
      }),
    ).resolves.toMatchObject({
      notebook: { description: "Caderno de leitura", category: "reading" },
      taskGroups: [{ id: "group-1" }],
    });
  });

  it("rejeita corpo inválido com erro 400", async () => {
    await expect(
      createTaskNotebook({
        description: "",
        category: "reading",
        tasks: [],
        taskGroupsIds: [],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
