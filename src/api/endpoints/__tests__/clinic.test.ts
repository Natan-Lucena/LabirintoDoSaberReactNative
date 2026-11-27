import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  clinicQueryKeys,
  getClinic,
  getInvitePreview,
  listClinicInvites,
  listStudentShares,
  normalizeInviteCode,
} from "@/api/endpoints/clinic";
import { listStudentsByStatus } from "@/api/endpoints/student-status";
import { MOCK_EDUCATOR, MOCK_TOKEN } from "@/mocks/fixtures";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import {
  MOCK_INVITE_CODE,
  MOCK_INVITE_RATE_LIMITED_CODE,
  MOCK_SHARED_STUDENT_ID,
} from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("equipe pelo apiClient (API-07, leva 2)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockTeamScenario();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockTeamScenario();
  });

  it("monta chaves de query e normaliza o código do convite (EQ-16)", () => {
    expect(normalizeInviteCode("ab3k-7mpq ")).toBe("AB3K7MPQ");
    expect(clinicQueryKeys.view).toEqual(["clinic", "view"]);
    expect(clinicQueryKeys.invitePreview("ab3k-7mpq")).toEqual([
      "clinic",
      "invite-preview",
      "AB3K7MPQ",
    ]);
    expect(clinicQueryKeys.studentShares("s1")).toEqual([
      "student",
      "shares",
      "s1",
    ]);
  });

  describe("GET /clinic/", () => {
    it("sem clínica responde 404 NOT_IN_CLINIC com mensagem em português", async () => {
      await expect(getClinic()).rejects.toMatchObject({
        status: 404,
        code: "NOT_IN_CLINIC",
        message: "Você ainda não faz parte de uma equipe.",
      });
    });

    it("ADMIN: ClinicView com ADMIN primeiro e o próprio educador entre os membros", async () => {
      setMockTeamScenario("admin");

      const view = await getClinic();

      expect(view.myRole).toBe("ADMIN");
      expect(view.clinic.name).toBe("Clínica Teste");
      expect(view.members[0].role).toBe("ADMIN");
      expect(view.members[0].educatorId).toBe(MOCK_EDUCATOR.id);
      expect(view.members.map((member) => member.role)).toEqual([
        "ADMIN",
        "PROFESSIONAL",
        "PROFESSIONAL",
      ]);
    });

    it("PROFESSIONAL: o ADMIN da lista é a colega", async () => {
      setMockTeamScenario("professional");

      const view = await getClinic();

      expect(view.myRole).toBe("PROFESSIONAL");
      expect(view.members[0]).toMatchObject({
        role: "ADMIN",
        name: "Profissional Teste Dois",
      });
    });
  });

  describe("GET /educator/me", () => {
    it("traz clinic só com o cenário de equipe ligado", async () => {
      setMockSession(MOCK_TOKEN);
      const before = await apiClient.get("/educator/me");
      expect(before.data).toEqual(MOCK_EDUCATOR);

      setMockTeamScenario("professional");
      const after = await apiClient.get("/educator/me");
      expect(after.data.clinic).toEqual({
        id: "mock-clinic-1",
        name: "Clínica Teste",
        role: "PROFESSIONAL",
      });
      clearMockSession();
    });
  });

  describe("GET /clinic/invites", () => {
    it("ADMIN lista os convites ativos, o mais novo primeiro, com shareMessage (EQ-17)", async () => {
      setMockTeamScenario("admin");

      const invites = await listClinicInvites();

      expect(invites).toHaveLength(2);
      const created = invites.map((invite) => invite.createdAt);
      expect([...created].sort().reverse()).toEqual(created);
      for (const invite of invites) {
        expect(invite.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
        expect(invite.shareMessage).toMatch(
          new RegExp(
            `^Use o código ${invite.code} para entrar na equipe Clínica Teste no app Labirinto do Saber\\. Vale até \\d{2}/\\d{2}\\.$`,
          ),
        );
      }
    });

    it("PROFESSIONAL recebe 403 FORBIDDEN_ROLE; sem clínica, 404 NOT_IN_CLINIC", async () => {
      await expect(listClinicInvites()).rejects.toMatchObject({
        status: 404,
        code: "NOT_IN_CLINIC",
      });

      setMockTeamScenario("professional");
      await expect(listClinicInvites()).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN_ROLE",
        message: "Apenas administradores da equipe podem fazer isso.",
      });
    });
  });

  describe("GET /clinic/invites/preview/:code (pública)", () => {
    it("devolve só clinicName, role e expiresAt, aceitando código com hífen e minúsculas", async () => {
      const preview = await getInvitePreview("ab3k-7mpq");

      expect(Object.keys(preview).sort()).toEqual([
        "clinicName",
        "expiresAt",
        "role",
      ]);
      expect(preview).toMatchObject({
        clinicName: "Clínica Teste",
        role: "PROFESSIONAL",
      });
    });

    it("código desconhecido responde 404 INVITE_INVALID", async () => {
      await expect(getInvitePreview("ZZZZZZZZ")).rejects.toMatchObject({
        status: 404,
        code: "INVITE_INVALID",
      });
      await expect(getInvitePreview(MOCK_INVITE_CODE)).resolves.toBeDefined();
    });

    it("limite de consultas responde 429 TOO_MANY_REQUESTS", async () => {
      await expect(
        getInvitePreview(MOCK_INVITE_RATE_LIMITED_CODE),
      ).rejects.toMatchObject({ status: 429, code: "TOO_MANY_REQUESTS" });
    });
  });

  describe("GET /student/:id/shares", () => {
    it("lista os compartilhamentos do paciente, sem o dono", async () => {
      const shares = await listStudentShares("student-1");

      expect(shares).toEqual([
        expect.objectContaining({
          educatorId: "mock-educator-2",
          name: "Profissional Teste Dois",
          role: "PROFESSIONAL",
        }),
      ]);
    });

    it("paciente sem compartilhamento devolve lista vazia", async () => {
      await expect(listStudentShares("student-2")).resolves.toEqual([]);
    });

    it("404 STUDENT_NOT_FOUND e 403 UNAUTHORIZED", async () => {
      await expect(listStudentShares("nao-existe")).rejects.toMatchObject({
        status: 404,
        code: "STUDENT_NOT_FOUND",
      });
      await expect(
        listStudentShares("mock-student-foreign"),
      ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    });
  });

  describe("GET /student/ com compartilhado (EQ-13)", () => {
    it("só inclui o paciente compartilhado, com access e ownerName, no cenário de equipe", async () => {
      const without = await listStudentsByStatus();
      expect(without.map((student) => student.id)).not.toContain(
        MOCK_SHARED_STUDENT_ID,
      );

      setMockTeamScenario("professional");
      const withTeam = await listStudentsByStatus();
      const shared = withTeam.find(
        (student) => student.id === MOCK_SHARED_STUDENT_ID,
      );
      expect(shared).toMatchObject({
        access: "SHARED",
        ownerName: "Profissional Teste Dois",
      });
      expect(withTeam.filter((s) => s.access === "OWNER").length).toBe(5);
    });
  });
});
