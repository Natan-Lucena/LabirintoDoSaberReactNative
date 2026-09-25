import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/content";
import { buildActivityItems } from "@/features/activities/selectors";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("dados da aba Atividades via apiClient mockado (AC-L-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("usa listTaskNotebooks, listTaskGroupsByEducator e listTasks para montar os itens", async () => {
    const [notebooks, groups, tasks] = await Promise.all([
      listTaskNotebooks(),
      listTaskGroupsByEducator(),
      listTasks(),
    ]);

    const items = buildActivityItems(notebooks, groups, tasks);

    expect(items.some((item) => item.kind === "notebook")).toBe(true);
    expect(items.some((item) => item.kind === "group")).toBe(true);
    expect(items.some((item) => item.kind === "task")).toBe(true);
  });
});
