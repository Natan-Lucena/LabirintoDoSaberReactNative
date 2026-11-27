import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getClinic } from "@/api/endpoints/clinic";
import { listStudents } from "@/api/endpoints/student";
import { listStudentShares } from "@/api/endpoints/student-shares";
import { listStudentsByStatus } from "@/api/endpoints/student-status";
import { ApiError } from "@/api/errors";
import { createQueryClient } from "@/api/query-client";
import type { Student } from "@/api/types";
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

const STUDENT = { id: "s1", name: "Paciente Teste" } as Student;

// Backend de hoje: sem /clinic/*, /student/:id/shares, PUT status nem ?status.
describe("compatibilidade com o backend atual", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /student/:id/shares 404 sem STUDENT_NOT_FOUND vira lista vazia", async () => {
    vi.mocked(listStudentShares).mockRejectedValue(
      new ApiError({ message: "Not Found", status: 404 }),
    );
    const { result } = await renderHook(() => useStudentShares("s1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("GET /clinic/ 404 sem code vira sem equipe (null)", async () => {
    vi.mocked(getClinic).mockRejectedValue(
      new ApiError({ message: "Not Found", status: 404 }),
    );
    const { result } = await renderHook(() => useClinic(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("?status=ALL rejeitado com 400 cai para a lista sem query", async () => {
    get.mockRejectedValue({
      isAxiosError: true,
      message: "Bad Request",
      response: { status: 400, data: { message: "invalid" } },
    });
    vi.mocked(listStudents).mockResolvedValue([STUDENT]);
    await expect(listStudentsByStatus("ALL")).resolves.toEqual([STUDENT]);
    await expect(listStudentsByStatus("ARCHIVED")).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("arquivar com 404 sem code mostra mensagem amigável", () => {
    expect(
      archiveErrorMessage(new ApiError({ message: "Not Found", status: 404 })),
    ).toBe("Não foi possível arquivar agora.");
  });
});
