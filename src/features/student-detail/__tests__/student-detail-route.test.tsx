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

const { default: StudentDetailRoute } =
  await import("../../../../app/students/[id]");

describe("app/students/[id] (AC-D-01)", () => {
  it("passa o id da rota para a StudentDetailScreen", async () => {
    params = { id: "student-1" };
    await render(<StudentDetailRoute />);
    expect(await screen.findByRole("header", { name: "Alunos" })).toBeTruthy();
  });
});
