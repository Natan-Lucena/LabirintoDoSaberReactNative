import { describe, expect, it } from "vitest";
import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Text } from "react-native";

import { ApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import { render, screen, waitFor } from "@/test-utils/render";

describe("test render with QueryClient (T-304)", () => {
  it("AC-304-04: provides a fresh QueryClient per render with retry disabled", async () => {
    let attempts = 0;
    function Probe() {
      const query = useQuery({
        queryKey: ["probe"],
        queryFn: () => {
          attempts += 1;
          return Promise.reject(
            new ApiError({ message: "client error", status: 400 }),
          );
        },
      });
      return <Text>{query.status}</Text>;
    }

    await render(<Probe />);
    await waitFor(() => {
      expect(screen.getByText("error")).toBeTruthy();
    });
    expect(attempts).toBe(1);
  });

  it("AC-304-04: does not leak cache between renders", async () => {
    function Reader() {
      const client = useQueryClient();
      const cached = client.getQueryData(["shared-key"]);
      return <Text>{cached ? "has-data" : "no-data"}</Text>;
    }

    const firstClient = new (
      await import("@tanstack/react-query")
    ).QueryClient();
    firstClient.setQueryData(["shared-key"], "leftover");
    await render(<Reader />, { queryClient: firstClient });
    expect(screen.getByText("has-data")).toBeTruthy();

    await render(<Reader />);
    expect(screen.getByText("no-data")).toBeTruthy();
  });

  it("AC-304-03: offline reads show cached data without refetch", async () => {
    onlineManager.setOnline(false);
    try {
      let fetches = 0;
      function Probe() {
        const query = useQuery({
          queryKey: ["offline-read"],
          queryFn: () => {
            fetches += 1;
            return Promise.resolve("fresh");
          },
          initialData: "cached",
          staleTime: Infinity,
        });
        return <Text>{query.data}</Text>;
      }

      await render(<Probe />);
      expect(screen.getByText("cached")).toBeTruthy();
      expect(fetches).toBe(0);
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it("AC-304-03: offline mutations are blocked and surface an explicit error, without auto-retry on reconnect", async () => {
    onlineManager.setOnline(false);
    try {
      let calls = 0;
      function Probe() {
        const mutation = useMutation({
          mutationFn: withOfflineGuard(() => {
            calls += 1;
            return Promise.resolve("ok");
          }),
        });
        if (mutation.status === "idle") {
          mutation.mutate();
        }
        return <Text>{mutation.status}</Text>;
      }

      await render(<Probe />);
      await waitFor(() => {
        expect(screen.getByText("error")).toBeTruthy();
      });
      expect(calls).toBe(0);

      onlineManager.setOnline(true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(calls).toBe(0);
    } finally {
      onlineManager.setOnline(true);
    }
  });
});
