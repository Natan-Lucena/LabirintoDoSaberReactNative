import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  createStudentSnapshot,
  listStudentSnapshots,
} from "@/api/endpoints/session-analysis";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/session-analysis";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("handlers de snapshot e histórico da análise do aluno", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("gera e persiste um snapshot que aparece no histórico (AC-REL-05-02)", async () => {
    const before = await listStudentSnapshots("student-1");

    const snapshot = await createStudentSnapshot("student-1", { limit: 6 });

    expect(snapshot.studentId).toBe("student-1");
    expect(snapshot.limit).toBe(6);
    expect(snapshot.sessionIds).toHaveLength(2);
    expect(snapshot.totalQuestions).toBe(3);
    expect(snapshot.totalCorrect).toBe(2);
    expect(snapshot.categories[0]?.category).toBe("reading");

    const after = await listStudentSnapshots("student-1");
    expect(after).toHaveLength(before.length + 1);
    expect(after.at(-1)).toEqual(snapshot);
  });

  it("guarda o intervalo de datas quando é o filtro usado", async () => {
    const snapshot = await createStudentSnapshot("student-1", {
      startDate: "2026-10-01T00:00:00-03:00",
      endDate: "2026-10-02T23:59:00-03:00",
    });

    expect(snapshot.startDate).toBe("2026-10-01T00:00:00-03:00");
    expect(snapshot.endDate).toBe("2026-10-02T23:59:00-03:00");
    expect(snapshot.limit).toBeUndefined();
    expect(snapshot.sessionIds).toEqual(["mock-session-1"]);
  });

  it("o histórico começa vazio para um paciente sem snapshots", async () => {
    expect(await listStudentSnapshots("student-2")).toEqual([]);
  });

  it("rejeita limit combinado com datas e paciente inexistente", async () => {
    await expect(
      createStudentSnapshot("student-1", {
        limit: 6,
        startDate: "2026-10-01T00:00:00-03:00",
        endDate: "2026-10-02T00:00:00-03:00",
      } as never),
    ).rejects.toThrow("INVALID_ANALYSIS_FILTER");
    await expect(
      createStudentSnapshot("inexistente", { limit: 1 }),
    ).rejects.toThrow("STUDENT_NOT_FOUND");
    await expect(listStudentSnapshots("inexistente")).rejects.toThrow(
      "INVALID_STUDENT_ID",
    );
  });
});
