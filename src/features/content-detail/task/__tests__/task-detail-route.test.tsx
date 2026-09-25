import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { render, screen } from "@/test-utils/render";
import "@/mocks/handlers/content";
import "@/mocks/handlers/task-delete";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

let params: { id?: string } = {};

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const { default: TaskDetailRoute } =
  await import("../../../../../app/content/task/[id]");

const originalAdapter = apiClient.defaults.adapter;

describe("app/content/task/[id] (UX5-A)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("passa o id da rota para a TaskDetailScreen", async () => {
    params = { id: "task-1" };
    await render(<TaskDetailRoute />);
    expect(
      await screen.findByRole("header", { name: "Atividade" }),
    ).toBeTruthy();
  });
});
