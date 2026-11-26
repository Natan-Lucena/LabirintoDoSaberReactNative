import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getClinic } from "@/api/endpoints/clinic";
import { listStudentShares } from "@/api/endpoints/student-shares";
import { listStudentsByStatus } from "@/api/endpoints/student-status";
import { ApiError } from "@/api/errors";
import { createQueryClient } from "@/api/query-client";
import { archiveErrorMessage } from "@/features/patients/archive/useArchivePatient";
import { useStudentShares } from "@/features/patients/shares/useStudentShares";
import { useClinic } from "@/features/team/useClinic";

const get = vi.hoisted(() => vi.fn());

vi.mock("@/api/client", () => ({ apiClient: { get } }));
vi.mock("@/api/endpoints/student", () => ({ listStudents: vi.fn() }));
vi.mock("@/api/endpoints/student-shares", () => ({
  listStudentShares: vi.fn(),
  shareStudent: vi.fn(),
  unshareStudent: vi.fn(),
}));
vi.mock("@/api/endpoints/clinic", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/clinic")>()),
  getClinic: vi.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Backend publicado em 2026-11-26 (BACKEND-ENTREGUE-E5): os fallbacks para a
// ausência das rotas novas foram removidos, então um 404 genérico é erro.
describe("sem fallback para rotas ainda não publicadas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /student/:id/shares 404 genérico é erro, 403 segue null", async () => {
    vi.mocked(listStudentShares).mockRejectedValue(
      new ApiError({ message: "Not Found", status: 404 }),
    );
    const failing = await renderHook(() => useStudentShares("s1"), { wrapper });
    await waitFor(() => expect(failing.result.current.isError).toBe(true));

    vi.mocked(listStudentShares).mockRejectedValue(
      new ApiError({ message: "UNAUTHORIZED", status: 403 }),
    );
    const forbidden = await renderHook(() => useStudentShares("s2"), {
      wrapper,
    });
    await waitFor(() => expect(forbidden.result.current.isSuccess).toBe(true));
    expect(forbidden.result.current.data).toBeNull();
  });

  it("GET /clinic/ 404 genérico é erro, NOT_IN_CLINIC vira sem equipe", async () => {
    vi.mocked(getClinic).mockRejectedValue(
      new ApiError({ message: "Not Found", status: 404 }),
    );
    const failing = await renderHook(() => useClinic(), { wrapper });
    await waitFor(() => expect(failing.result.current.isError).toBe(true));

    vi.mocked(getClinic).mockRejectedValue(
      new ApiError({ message: "x", status: 404, code: "NOT_IN_CLINIC" }),
    );
    const none = await renderHook(() => useClinic(), { wrapper });
    await waitFor(() => expect(none.result.current.isSuccess).toBe(true));
    expect(none.result.current.data).toBeNull();
  });

  it("?status= rejeitado com 400 não cai mais para a lista sem query", async () => {
    get.mockRejectedValue({
      isAxiosError: true,
      message: "Bad Request",
      response: { status: 400, data: { message: "invalid" } },
    });
    await expect(listStudentsByStatus("ALL")).rejects.toBeInstanceOf(ApiError);
  });

  it("arquivar com 404 genérico mostra a mensagem do servidor", () => {
    expect(
      archiveErrorMessage(new ApiError({ message: "Not Found", status: 404 })),
    ).toBe("Not Found");
  });
});
