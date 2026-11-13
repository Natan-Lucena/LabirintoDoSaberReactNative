import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PendingEvolution } from "@/api/types";

const listPending = vi.fn();

vi.mock("@/api/endpoints/evolution", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/evolution")>()),
  listPendingEvolutions: (...args: unknown[]) => listPending(...args),
}));

const { evolutionQueryKeys } = await import("@/api/endpoints/evolution");
const { findPendingForAppointment, pendingForStudent, usePendingEvolutions } =
  await import("@/features/evolution/pending/usePendingEvolutions");

function item(overrides: Partial<PendingEvolution>): PendingEvolution {
  return {
    sessionId: "s-1",
    studentId: "st-1",
    studentName: "Lia",
    sessionName: "Leitura",
    finishedAt: "2026-10-01T10:00:00Z",
    appointmentId: "a-1",
    ...overrides,
  };
}

describe("usePendingEvolutions (EVO-05)", () => {
  beforeEach(() => listPending.mockReset());

  it("AC-EVO-05-01 refaz a lista quando evolutionQueryKeys.all é invalidada", async () => {
    listPending.mockResolvedValueOnce([item({})]).mockResolvedValueOnce([]);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => usePendingEvolutions(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    await client.invalidateQueries({ queryKey: evolutionQueryKeys.all });

    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it("findPendingForAppointment casa só pelo appointmentId", () => {
    const list = [item({}), item({ sessionId: "s-2", appointmentId: "a-2" })];
    expect(findPendingForAppointment(list, "a-2")?.sessionId).toBe("s-2");
    expect(findPendingForAppointment(list, "a-9")).toBeUndefined();
    expect(findPendingForAppointment(undefined, "a-1")).toBeUndefined();
  });

  it("pendingForStudent filtra o paciente e ordena da mais recente", () => {
    const list = [
      item({ sessionId: "old", finishedAt: "2026-09-01T10:00:00Z" }),
      item({ sessionId: "other", studentId: "st-2" }),
      item({ sessionId: "new", finishedAt: "2026-10-05T10:00:00Z" }),
    ];
    expect(pendingForStudent(list, "st-1").map((p) => p.sessionId)).toEqual([
      "new",
      "old",
    ]);
  });
});
