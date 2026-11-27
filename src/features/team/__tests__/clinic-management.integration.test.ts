import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  getClinic,
  listClinicInvites,
  removeClinicMember,
  renameClinic,
  revokeClinicInvite,
  updateClinicMemberRole,
} from "@/api/endpoints/clinic";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_COLLEAGUE_ID, MOCK_THIRD_MEMBER_ID } from "@/mocks/fixtures-e5";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { resetMockClinicState } from "@/mocks/handlers/clinic";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("gestão da equipe pelo apiClient (EQP-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockClinicState();
    resetMockTeamScenario();
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockClinicState();
    resetMockTeamScenario();
  });

  it("renameClinic troca o nome e recusa nome inválido (400) e PROFESSIONAL (403)", async () => {
    setMockTeamScenario("admin");
    const view = await renameClinic({ name: "  Clínica Teste 2 " });
    expect(view.clinic.name).toBe("Clínica Teste 2");
    await expect(getClinic()).resolves.toMatchObject({
      clinic: { name: "Clínica Teste 2" },
    });
    await expect(renameClinic({ name: "A" })).rejects.toMatchObject({
      status: 400,
    });

    setMockTeamScenario("professional");
    await expect(renameClinic({ name: "Outro nome" })).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN_ROLE",
    });
  });

  it("revokeClinicInvite tira o convite da lista; repetir dá 404 INVITE_NOT_FOUND", async () => {
    setMockTeamScenario("admin");
    const before = await listClinicInvites();
    await revokeClinicInvite(before[0].id);

    const after = await listClinicInvites();
    expect(after).toHaveLength(before.length - 1);
    await expect(revokeClinicInvite(before[0].id)).rejects.toMatchObject({
      status: 404,
      code: "INVITE_NOT_FOUND",
    });

    setMockTeamScenario("professional");
    await expect(revokeClinicInvite("mock-invite-1")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN_ROLE",
    });
  });

  it("updateClinicMemberRole muda o papel; membro inexistente dá 404", async () => {
    setMockTeamScenario("admin");
    const view = await updateClinicMemberRole({
      educatorId: MOCK_COLLEAGUE_ID,
      role: "ADMIN",
    });
    expect(
      view.members.find((member) => member.educatorId === MOCK_COLLEAGUE_ID)
        ?.role,
    ).toBe("ADMIN");

    await expect(
      updateClinicMemberRole({ educatorId: "mock-x", role: "ADMIN" }),
    ).rejects.toMatchObject({ status: 404, code: "MEMBER_NOT_FOUND" });

    setMockTeamScenario("professional");
    await expect(
      updateClinicMemberRole({
        educatorId: MOCK_THIRD_MEMBER_ID,
        role: "ADMIN",
      }),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN_ROLE" });
  });

  it("o último ADMIN não pode virar profissional nem ser removido (409 LAST_ADMIN)", async () => {
    setMockTeamScenario("admin");
    await expect(
      updateClinicMemberRole({
        educatorId: MOCK_EDUCATOR.id,
        role: "PROFESSIONAL",
      }),
    ).rejects.toMatchObject({ status: 409, code: "LAST_ADMIN" });
    await expect(removeClinicMember(MOCK_EDUCATOR.id)).rejects.toMatchObject({
      status: 409,
      code: "LAST_ADMIN",
    });
    const view = await getClinic();
    expect(view.members).toHaveLength(3);
    expect(view.myRole).toBe("ADMIN");
  });

  it("com outro ADMIN, um ADMIN pode remover o outro e depois ficar como último (Q12)", async () => {
    setMockTeamScenario("admin");
    await updateClinicMemberRole({
      educatorId: MOCK_COLLEAGUE_ID,
      role: "ADMIN",
    });
    await removeClinicMember(MOCK_COLLEAGUE_ID);

    const view = await getClinic();
    expect(view.members.map((member) => member.educatorId)).not.toContain(
      MOCK_COLLEAGUE_ID,
    );
    await expect(removeClinicMember(MOCK_COLLEAGUE_ID)).rejects.toMatchObject({
      status: 404,
      code: "MEMBER_NOT_FOUND",
    });
  });

  it("PROFESSIONAL não remove outro (403), mas sai da equipe com o próprio id", async () => {
    setMockTeamScenario("professional");
    await expect(removeClinicMember(MOCK_COLLEAGUE_ID)).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN_ROLE",
    });

    await removeClinicMember(MOCK_EDUCATOR.id);

    await expect(getClinic()).rejects.toMatchObject({
      status: 404,
      code: "NOT_IN_CLINIC",
    });
  });
});
