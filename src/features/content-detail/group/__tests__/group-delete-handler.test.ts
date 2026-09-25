import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { deleteTaskGroup } from "@/api/endpoints/task-group-delete";
import { listTaskGroupsByEducator } from "@/api/endpoints/content";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/content";
import "@/mocks/handlers/group-delete";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("DELETE /task-group/delete/:taskGroupId (D-05)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("remove o grupo existente da lista", async () => {
    const before = await listTaskGroupsByEducator();
    expect(before.some((group) => group.id === "group-2")).toBe(true);

    await deleteTaskGroup("group-2");

    const after = await listTaskGroupsByEducator();
    expect(after.some((group) => group.id === "group-2")).toBe(false);
  });

  it("devolve 500 TASK_GROUP_NOT_FOUND para id inexistente", async () => {
    await expect(deleteTaskGroup("grupo-inexistente")).rejects.toMatchObject({
      status: 500,
      code: "TASK_GROUP_NOT_FOUND",
    });
  });
});
