import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

let params: { id?: string } = {};

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const { default: GroupDetailRoute } =
  await import("../../../../../app/content/group/[id]");

describe("app/content/group/[id] (AC-02)", () => {
  it("passa o id da rota para a GroupDetailScreen", async () => {
    params = { id: "group-1" };
    await render(<GroupDetailRoute />);
    expect(await screen.findByRole("header", { name: "Grupo" })).toBeTruthy();
  });
});
