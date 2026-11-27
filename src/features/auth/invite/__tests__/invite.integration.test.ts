import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  acceptClinicInvite,
  getClinic,
  getInvitePreview,
} from "@/api/endpoints/clinic";
import { register, signIn } from "@/api/endpoints/educator";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockClinicState } from "@/mocks/handlers/clinic";
import { resetMockRegisteredEducators } from "@/mocks/handlers/educator";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
const NEW_ACCOUNT = {
  name: "Profissional Teste Nova",
  email: "nova.conta@example.test",
  password: "senha-ficticia-1",
};

function reset() {
  resetMockClinicState();
  resetMockRegisteredEducators();
  resetMockTeamScenario();
}

describe("cadastro e entrada pelo convite via apiClient (EQP-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    reset();
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    reset();
  });

  it("register com código válido cria a conta, que entra no sign-in e na equipe", async () => {
    await expect(
      register({ ...NEW_ACCOUNT, inviteCode: "AB3K7MPQ" }),
    ).resolves.toMatchObject({ name: NEW_ACCOUNT.name });

    await expect(
      signIn({ email: NEW_ACCOUNT.email, password: NEW_ACCOUNT.password }),
    ).resolves.toHaveProperty("token");
    await expect(getClinic()).resolves.toMatchObject({
      myRole: "PROFESSIONAL",
    });
  });

  it("código inválido ou já usado dá 404 INVITE_INVALID e não cria a conta", async () => {
    await expect(
      register({ ...NEW_ACCOUNT, inviteCode: "ZZZZ2222" }),
    ).rejects.toMatchObject({ status: 404, code: "INVITE_INVALID" });
    await expect(
      signIn({ email: NEW_ACCOUNT.email, password: NEW_ACCOUNT.password }),
    ).rejects.toMatchObject({ status: 401 });

    await register({ ...NEW_ACCOUNT, inviteCode: "AB3K7MPQ" });
    await expect(
      register({
        ...NEW_ACCOUNT,
        email: "outra.conta@example.test",
        inviteCode: "AB3K7MPQ",
      }),
    ).rejects.toMatchObject({ status: 404, code: "INVITE_INVALID" });
  });

  it("e-mail já cadastrado dá 400 EDUCATOR_ALREADY_EXISTS", async () => {
    await expect(
      register({
        ...NEW_ACCOUNT,
        email: "educadora.mock@labirinto.test",
        inviteCode: "KM4W9RTD",
      }),
    ).rejects.toMatchObject({ status: 400, code: "EDUCATOR_ALREADY_EXISTS" });
  });

  it("a prévia não consome o convite; aceitar consome e liga a equipe", async () => {
    await expect(getInvitePreview("ab3k-7mpq")).resolves.toMatchObject({
      role: "PROFESSIONAL",
    });
    await expect(getInvitePreview("AB3K7MPQ")).resolves.toBeDefined();

    const view = await acceptClinicInvite({ code: "ab3k-7mpq" });
    expect(view.myRole).toBe("PROFESSIONAL");
    await expect(getClinic()).resolves.toMatchObject({
      myRole: "PROFESSIONAL",
    });

    await expect(getInvitePreview("AB3K7MPQ")).rejects.toMatchObject({
      code: "INVITE_INVALID",
    });
  });

  it("aceitar com equipe dá 409 ALREADY_IN_CLINIC; código ruim dá 404", async () => {
    await expect(
      acceptClinicInvite({ code: "ZZZZ2222" }),
    ).rejects.toMatchObject({ status: 404, code: "INVITE_INVALID" });
    setMockTeamScenario("admin");
    await expect(
      acceptClinicInvite({ code: "KM4W9RTD" }),
    ).rejects.toMatchObject({ status: 409, code: "ALREADY_IN_CLINIC" });
  });
});
