import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/content";
import { useAuthStore } from "@/stores/auth";
import { render, screen } from "@/test-utils/render";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

const { GroupDetailScreen } = await import("../GroupDetailScreen");
const originalAdapter = apiClient.defaults.adapter;

describe("Grupo por id com handler real (FEC-04)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    useAuthStore.setState({ educatorId: "mock-educator-1" });
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it.each(["group-private", "missing-group"])(
    "mostra grupo indisponível para %s (AC-FEC-04-02)",
    async (groupId) => {
      await render(<GroupDetailScreen groupId={groupId} />, {
        queryClient: new QueryClient({
          defaultOptions: { queries: { retry: false } },
        }),
      });
      expect(await screen.findByText("Grupo indisponível")).toBeTruthy();
      expect(screen.queryByText("Tentar de novo")).toBeNull();
    },
  );
});
