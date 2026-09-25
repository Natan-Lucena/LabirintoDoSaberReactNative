import { renderHook } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));
vi.mock("@/api/endpoints/appointment", () => ({ listAppointments: vi.fn() }));
vi.mock("@/api/endpoints/student", () => ({ listStudents: vi.fn() }));
vi.mock("@/api/endpoints/content", () => ({ listTaskNotebooks: vi.fn() }));
vi.mock("@/api/endpoints/educator", () => ({
  getMe: vi.fn(),
  getLastSessions: vi.fn(),
}));

const { useHomeQuery } = await import("@/features/home/useHomeData");

describe("useHomeQuery", () => {
  it("expõe erro se uma query falha", async () => {
    useQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });

    const { result } = await renderHook(() => useHomeQuery());

    expect(result.current.isError).toBe(true);
  });

  it("refaz as cinco queries de recurso", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    useQueryMock.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch,
    });

    const { result } = await renderHook(() => useHomeQuery());
    await result.current.refetch();

    expect(refetch).toHaveBeenCalledTimes(5);
  });
});
