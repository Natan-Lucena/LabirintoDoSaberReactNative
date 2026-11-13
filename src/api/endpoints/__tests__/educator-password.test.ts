import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  generateToken,
  updatePassword,
  verifyToken,
} from "@/api/endpoints/educator";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import {
  MOCK_PASSWORD_VALID_CODE,
  resetMockPasswordState,
} from "@/mocks/handlers/password";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
const EMAIL = MOCK_EDUCATOR.email;

describe("endpoints de senha pelo apiClient real (AUT-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockPasswordState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("generateToken envia { email } e resolve sem corpo", async () => {
    await expect(generateToken({ email: EMAIL })).resolves.toBeUndefined();
  });

  it("verifyToken devolve { valid: true } para o código certo", async () => {
    await generateToken({ email: EMAIL });
    await expect(
      verifyToken({ email: EMAIL, token: MOCK_PASSWORD_VALID_CODE }),
    ).resolves.toEqual({ valid: true });
  });

  it("verifyToken rejeita INVALID_TOKEN com mensagem em português", async () => {
    await generateToken({ email: EMAIL });
    await expect(
      verifyToken({ email: EMAIL, token: "000000" }),
    ).rejects.toMatchObject({
      code: "INVALID_TOKEN",
      status: 400,
      message: expect.stringContaining("Código inválido"),
    });
  });

  it("updatePassword troca a senha com o código", async () => {
    await generateToken({ email: EMAIL });
    await expect(
      updatePassword({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "novaSenha1",
      }),
    ).resolves.toBeUndefined();
  });

  it("updatePassword rejeita PASSWORD_SAME_AS_OLD e INVALID_TOKEN", async () => {
    await generateToken({ email: EMAIL });
    await expect(
      updatePassword({
        email: EMAIL,
        token: MOCK_PASSWORD_VALID_CODE,
        newPassword: "senha123",
      }),
    ).rejects.toMatchObject({ code: "PASSWORD_SAME_AS_OLD" });
    await expect(
      updatePassword({ email: EMAIL, token: "999999", newPassword: "abcdef" }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  });
});
