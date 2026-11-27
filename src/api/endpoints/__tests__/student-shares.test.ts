import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  listStudentShares,
  shareStudent,
  unshareStudent,
} from "@/api/endpoints/student-shares";
import { listStudentsByStatus } from "@/api/endpoints/student-status";
import { MOCK_COLLEAGUE_ID, MOCK_SHARED_STUDENT_ID } from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockShareState } from "@/mocks/mock-share-state";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
const THIRD_MEMBER = "mock-educator-3";

describe("compartilhar paciente pelo apiClient (EQP-04)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockTeamScenario();
    resetMockShareState();
    setMockTeamScenario("admin");
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockTeamScenario();
    resetMockShareState();
  });

  it("compartilha, é idempotente e desfaz (dono)", async () => {
    const shared = await shareStudent({
      studentId: "student-2",
      educatorId: THIRD_MEMBER,
    });
    expect(shared).toEqual([
      expect.objectContaining({
        educatorId: THIRD_MEMBER,
        role: "PROFESSIONAL",
      }),
    ]);

    await expect(
      shareStudent({ studentId: "student-2", educatorId: THIRD_MEMBER }),
    ).resolves.toHaveLength(1);
    await expect(listStudentShares("student-2")).resolves.toHaveLength(1);

    await expect(
      unshareStudent({ studentId: "student-2", educatorId: THIRD_MEMBER }),
    ).resolves.toEqual([]);
  });

  it("400 NOT_IN_SAME_CLINIC para quem não é da equipe", async () => {
    await expect(
      shareStudent({ studentId: "student-2", educatorId: "mock-outsider" }),
    ).rejects.toMatchObject({ status: 400, code: "NOT_IN_SAME_CLINIC" });
  });

  it("403 UNAUTHORIZED: a colega não compartilha nem remove", async () => {
    await expect(
      shareStudent({
        studentId: MOCK_SHARED_STUDENT_ID,
        educatorId: THIRD_MEMBER,
      }),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    await expect(
      unshareStudent({
        studentId: MOCK_SHARED_STUDENT_ID,
        educatorId: THIRD_MEMBER,
      }),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
  });

  it("404 SHARE_NOT_FOUND na segunda remoção (Q15: a colega lê a lista)", async () => {
    await unshareStudent({
      studentId: "student-1",
      educatorId: MOCK_COLLEAGUE_ID,
    });
    await expect(
      unshareStudent({ studentId: "student-1", educatorId: MOCK_COLLEAGUE_ID }),
    ).rejects.toMatchObject({ status: 404, code: "SHARE_NOT_FOUND" });

    const forColleague = await listStudentShares(MOCK_SHARED_STUDENT_ID);
    expect(forColleague).toEqual([expect.objectContaining({ role: "ADMIN" })]);
  });

  it("remover o dono da equipe tira o paciente compartilhado da lista", async () => {
    const before = await listStudentsByStatus();
    expect(before.map((s) => s.id)).toContain(MOCK_SHARED_STUDENT_ID);

    await apiClient.delete(`/clinic/members/${MOCK_COLLEAGUE_ID}`);

    const after = await listStudentsByStatus();
    expect(after.map((s) => s.id)).not.toContain(MOCK_SHARED_STUDENT_ID);
  });
});
