import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getTaskGroupById } from "@/api/endpoints/content";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import "@/mocks/handlers/content";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("GET /task-group/:id pelo apiClient (FEC-04)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("retorna grupo próprio e grupo alheio presente em caderno", async () => {
    await expect(getTaskGroupById("group-1")).resolves.toMatchObject({
      id: "group-1",
      educatorId: MOCK_EDUCATOR.id,
    });
    await expect(getTaskGroupById("group-shared")).resolves.toMatchObject({
      id: "group-shared",
      educatorId: "mock-educator-2",
    });
  });

  it("distingue 403 de 404", async () => {
    await expect(getTaskGroupById("group-private")).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });
    await expect(getTaskGroupById("missing-group")).rejects.toMatchObject({
      status: 404,
      code: "TASK_GROUP_NOT_FOUND",
    });
  });
});
