import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@/api/query-client";
import { listStudents } from "@/api/endpoints/student";
import type { Student } from "@/api/types";
import { useStudents } from "../useStudents";

vi.mock("@/api/endpoints/student", () => ({
  listStudents: vi.fn(),
}));

const STUDENT: Student = {
  id: "s1",
  name: "Ana",
  age: 8,
  gender: "female",
  zipcode: "00000-000",
  road: "Rua A",
  housenumber: "1",
  phonenumber: "0000-0000",
  learningTopics: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  educatorId: "e1",
  photoUrl: null,
  documents: [],
  educators: ["e1"],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// AC-702-01 (parte de dados): useStudents busca a lista via listStudents.
describe("useStudents", () => {
  it("usa listStudents e a chave de query ['student']", async () => {
    vi.mocked(listStudents).mockResolvedValue([STUDENT]);

    const { result } = await renderHook(() => useStudents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([STUDENT]);
    expect(listStudents).toHaveBeenCalledTimes(1);
  });

  it("propaga erro quando listStudents rejeita", async () => {
    vi.mocked(listStudents).mockRejectedValue(new Error("network"));

    const { result } = await renderHook(() => useStudents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
