import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { createTaskGroup } from "@/api/endpoints/task-group-create";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TASK_GROUPS } from "@/mocks/handlers/content";
import "@/mocks/handlers/group-create";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("createTaskGroup com mockAdapter", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria um grupo tipado a partir do corpo do endpoint", async () => {
    const countBeforeCreate = MOCK_TASK_GROUPS.length;

    await expect(
      createTaskGroup({ name: "Grupo de leitura", category: "reading" }),
    ).resolves.toMatchObject({
      name: "Grupo de leitura",
      category: "reading",
      tasksIds: [],
    });
    expect(MOCK_TASK_GROUPS).toHaveLength(countBeforeCreate + 1);
    expect(MOCK_TASK_GROUPS.at(-1)).toMatchObject({
      name: "Grupo de leitura",
      educatorId: "mock-educator-1",
    });
  });

  it("rejeita corpo inválido com erro 400", async () => {
    await expect(
      createTaskGroup({ name: "", category: "reading" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
