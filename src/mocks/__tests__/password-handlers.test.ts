import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_EDUCATOR, MOCK_TOKEN } from "@/mocks/fixtures";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import {
  MOCK_PASSWORD_VALID_CODE,
  expireMockPasswordToken,
  resetMockPasswordState,
} from "@/mocks/handlers/password";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
const EMAIL = MOCK_EDUCATOR.email;

interface Reply {
  status: number;
  data: any;
}

async function send(
  method: "get" | "post" | "put",
  url: string,
  body?: unknown,
): Promise<Reply> {
  try {
    const response = await apiClient.request({ method, url, data: body });
    return { status: response.status, data: response.data };
  } catch (error) {
    const apiError = error as { status?: number; code?: string };
    return { status: apiError.status ?? 0, data: { message: apiError.code } };
  }
}

const generate = (email: string) =>
  send("put", "/educator/generate-token", { email });
const verify = (token: string, email = EMAIL) =>
  send("post", "/educator/verify-token", { email, token });
const update = (body: Record<string, unknown>) =>
  send("post", "/educator/update-password", body);

describe("mocks da senha (API-05, leva 1)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockPasswordState();
    setMockSession(MOCK_TOKEN);
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    clearMockSession();
  });

  it("SN-02: a resposta é a mesma exista ou não o e-mail", async () => {
    const known = await generate(EMAIL);
    const unknown = await generate("ninguem.mock@labirinto.test");

    expect(known).toEqual({ status: 200, data: { message: "TOKEN_SENT" } });
    expect(unknown).toEqual(known);
  });

  it("SN-02: o quarto envio em 15 min dá 429, também para e-mail inexistente", async () => {
    for (const email of [EMAIL, "ninguem.mock@labirinto.test"]) {
      await generate(email);
      await generate(email);
      await generate(email);
      expect(await generate(email)).toMatchObject({
        status: 429,
        data: { message: "TOO_MANY_REQUESTS" },
      });
    }
  });

  it("SN-03: verify-token confere sem consumir; errado dá INVALID_TOKEN", async () => {
    await generate(EMAIL);

    expect(await verify(MOCK_PASSWORD_VALID_CODE)).toEqual({
      status: 200,
      data: { valid: true },
    });
    expect((await verify(MOCK_PASSWORD_VALID_CODE)).status).toBe(200);
    expect(await verify("000000")).toMatchObject({
      status: 400,
      data: { message: "INVALID_TOKEN" },
    });
  });

  it("e-mail inexistente também responde INVALID_TOKEN (sem revelar contas)", async () => {
    await generate("ninguem.mock@labirinto.test");

    expect(
      await verify(MOCK_PASSWORD_VALID_CODE, "ninguem.mock@labirinto.test"),
    ).toMatchObject({ status: 400, data: { message: "INVALID_TOKEN" } });
  });

  it("código vencido dá EXPIRED_TOKEN em verify e em update", async () => {
    await generate(EMAIL);
    expireMockPasswordToken(EMAIL);

    expect(await verify(MOCK_PASSWORD_VALID_CODE)).toMatchObject({
      status: 400,
      data: { message: "EXPIRED_TOKEN" },
    });
    expect(
      await update({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "novaSenha1",
      }),
    ).toMatchObject({ status: 400, data: { message: "EXPIRED_TOKEN" } });
  });

  it("SN-05/SN-06: sem token ou com senha curta dá 400 de validação", async () => {
    await generate(EMAIL);

    expect(
      await update({ email: EMAIL, newPassword: "novaSenha1" }),
    ).toMatchObject({
      status: 400,
      data: { message: "Validation error" },
    });
    expect(
      await update({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "123",
      }),
    ).toMatchObject({ status: 400, data: { message: "Validation error" } });
    expect(
      await update({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "a".repeat(101),
      }),
    ).toMatchObject({ status: 400 });
  });

  it("SN-04: troca consome o código; reuso dá INVALID_TOKEN; senha igual à anterior é recusada", async () => {
    await generate(EMAIL);

    expect(
      await update({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "senha123",
      }),
    ).toMatchObject({ status: 400, data: { message: "PASSWORD_SAME_AS_OLD" } });

    expect(
      (
        await update({
          email: EMAIL,
          token: MOCK_PASSWORD_VALID_CODE,
          newPassword: "novaSenha1",
        })
      ).status,
    ).toBe(200);
    expect(await verify(MOCK_PASSWORD_VALID_CODE)).toMatchObject({
      status: 400,
      data: { message: "INVALID_TOKEN" },
    });
  });

  it("SN-04: 5 tentativas erradas invalidam o código (429 TOO_MANY_ATTEMPTS)", async () => {
    await generate(EMAIL);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await update({
        email: EMAIL,
        token: "000000",
        newPassword: "novaSenha1",
      });
    }

    expect(
      await update({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "novaSenha1",
      }),
    ).toMatchObject({ status: 429, data: { message: "TOO_MANY_ATTEMPTS" } });
  });

  it("um código novo invalida o anterior (SN-01)", async () => {
    await generate(EMAIL);
    expireMockPasswordToken(EMAIL);
    await generate(EMAIL);

    expect((await verify(MOCK_PASSWORD_VALID_CODE)).status).toBe(200);
  });

  describe("change-password (SN-07, SN-08)", () => {
    it("troca com a senha atual e devolve um token", async () => {
      const reply = await send("put", "/educator/change-password", {
        currentPassword: "senha123",
        newPassword: "outraSenha1",
      });

      expect(reply.status).toBe(200);
      expect(typeof reply.data.token).toBe("string");
      expect(reply.data.token.length).toBeGreaterThan(0);

      const again = await send("put", "/educator/change-password", {
        currentPassword: "senha123",
        newPassword: "maisUma123",
      });
      expect(again).toMatchObject({
        status: 400,
        data: { message: "INVALID_CURRENT_PASSWORD" },
      });
    });

    it("senha atual errada e senha igual à atual", async () => {
      expect(
        await send("put", "/educator/change-password", {
          currentPassword: "errada",
          newPassword: "outraSenha1",
        }),
      ).toMatchObject({
        status: 400,
        data: { message: "INVALID_CURRENT_PASSWORD" },
      });
      expect(
        await send("put", "/educator/change-password", {
          currentPassword: "senha123",
          newPassword: "senha123",
        }),
      ).toMatchObject({
        status: 400,
        data: { message: "PASSWORD_SAME_AS_OLD" },
      });
    });

    it("exige login (401) e valida a nova senha (400)", async () => {
      expect(
        await send("put", "/educator/change-password", {
          currentPassword: "senha123",
          newPassword: "short",
        }),
      ).toMatchObject({ status: 400 });

      clearMockSession();
      expect(
        await send("put", "/educator/change-password", {
          currentPassword: "senha123",
          newPassword: "outraSenha1",
        }),
      ).toMatchObject({ status: 401 });
    });
  });
});
