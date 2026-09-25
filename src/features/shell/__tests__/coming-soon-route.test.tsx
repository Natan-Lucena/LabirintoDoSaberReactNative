import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils/render";

let params: { title?: string } = {};

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
}));

const { default: ComingSoonRoute } =
  await import("../../../../app/shell/coming-soon");

describe("app/shell/coming-soon (AC-501-02)", () => {
  it("renders the ComingSoonScreen with the title from search params", async () => {
    params = { title: "Menu" };
    await render(<ComingSoonRoute />);
    expect(screen.getByRole("header", { name: "Menu" })).toBeTruthy();
  });

  it("falls back to a default title when none is provided", async () => {
    params = {};
    await render(<ComingSoonRoute />);
    expect(screen.getByRole("header", { name: "Em breve" })).toBeTruthy();
  });
});
