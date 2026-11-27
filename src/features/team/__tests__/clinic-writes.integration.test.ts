import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  createClinic,
  createClinicInvite,
  getClinic,
  listClinicInvites,
} from "@/api/endpoints/clinic";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockClinicState } from "@/mocks/handlers/clinic";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("escritas da equipe pelo apiClient (EQP-01)", () => {
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

  it("createClinic cria a equipe com o criador como único ADMIN", async () => {
    const view = await createClinic({ name: "  Clínica Teste Nova  " });

    expect(view.clinic.name).toBe("Clínica Teste Nova");
    expect(view.myRole).toBe("ADMIN");
    expect(view.members).toHaveLength(1);
    expect(view.members[0].role).toBe("ADMIN");
    await expect(getClinic()).resolves.toMatchObject({
      clinic: { name: "Clínica Teste Nova" },
    });
  });

  it("createClinic recusa nome inválido (400) e quem já tem equipe (409)", async () => {
    await expect(createClinic({ name: "A" })).rejects.toMatchObject({
      status: 400,
    });
    setMockTeamScenario("admin");
    await expect(createClinic({ name: "Clínica Teste" })).rejects.toMatchObject(
      { status: 409, code: "ALREADY_IN_CLINIC" },
    );
  });

  it("createClinicInvite devolve código de 8 caracteres e shareMessage do servidor", async () => {
    await createClinic({ name: "Clínica Teste" });

    const invite = await createClinicInvite({ role: "PROFESSIONAL" });

    expect(invite.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(invite.role).toBe("PROFESSIONAL");
    expect(invite.shareMessage).toContain(invite.code);
    expect(invite.shareMessage).toContain("Clínica Teste");
    const active = await listClinicInvites();
    expect(active.some((item) => item.id === invite.id)).toBe(true);
  });

  it("createClinicInvite: 403 para PROFESSIONAL, 404 sem equipe e 409 no 21º convite", async () => {
    await expect(createClinicInvite({ role: "ADMIN" })).rejects.toMatchObject({
      status: 404,
      code: "NOT_IN_CLINIC",
    });
    setMockTeamScenario("professional");
    await expect(createClinicInvite({ role: "ADMIN" })).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN_ROLE",
    });

    setMockTeamScenario("admin");
    const codes = new Set<string>();
    for (let index = 0; index < 18; index += 1) {
      codes.add((await createClinicInvite({ role: "PROFESSIONAL" })).code);
    }
    expect(codes.size).toBe(18);
    await expect(
      createClinicInvite({ role: "PROFESSIONAL" }),
    ).rejects.toMatchObject({ status: 409, code: "TOO_MANY_INVITES" });
  });
});
