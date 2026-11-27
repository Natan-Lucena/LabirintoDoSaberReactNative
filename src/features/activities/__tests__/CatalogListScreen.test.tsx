import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import type { TaskSummary } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const routerPush = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn() }),
}));

function summary(id: string, title: string): TaskSummary {
  return {
    id,
    type: "wordBuilder",
    format: "INTERACTIVE",
    source: "LIBRARY",
    category: "writing",
    title,
    skills: [],
    tone: "peach",
  };
}

const { CatalogListScreen } =
  await import("@/features/activities/CatalogListScreen");

describe("CatalogListScreen (ATV-09)", () => {
  let urls: string[];

  beforeEach(() => {
    routerPush.mockClear();
    urls = [];
    vi.spyOn(apiClient, "get").mockImplementation(((url: string) => {
      if (url === "/task/skills") return Promise.resolve({ data: [] });
      urls.push(url);
      const cursor = new URLSearchParams(url.split("?")[1]).get("cursor");
      return Promise.resolve({
        data: cursor
          ? { items: [summary("p2", "Segunda página")] }
          : { items: [summary("p1", "Primeira página")], nextCursor: "1" },
      });
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-ATV-09-04: Carregar mais pede o nextCursor e some no fim", async () => {
    await render(<CatalogListScreen source="LIBRARY" />, {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    });

    expect(await screen.findByText("Primeira página")).toBeTruthy();
    await fireEvent.press(screen.getByText("Carregar mais"));

    expect(await screen.findByText("Segunda página")).toBeTruthy();
    expect(urls.some((url) => url.includes("cursor=1"))).toBe(true);
    await waitFor(() => expect(screen.queryByText("Carregar mais")).toBeNull());
  });

  it("usa o título da origem e os filtros recebidos", async () => {
    await render(
      <CatalogListScreen source="LIBRARY" initialFormat="PRINTABLE" />,
      {
        queryClient: new QueryClient({
          defaultOptions: { queries: { retry: false } },
        }),
      },
    );

    await screen.findByText("Primeira página");
    expect(
      screen.getAllByRole("header", { name: "Atividades prontas" }).length,
    ).toBeGreaterThan(0);
    expect(urls[0]).toContain("format=PRINTABLE");
    expect(urls[0]).toContain("source=LIBRARY");
  });
});
