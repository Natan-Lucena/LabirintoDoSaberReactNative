// Senha (API-05, leva 1): recuperação com código e troca logada. Contrato
// PROVISÓRIO de docs/entrega-4/ESPECIFICACAO-BACKEND.md §2, a conferir em
// API-04. Estado só em memória; nenhum e-mail é enviado. Dados fictícios.
import type {
  ChangePasswordResponse,
  PasswordTokenSentResponse,
  VerifyPasswordTokenResponse,
} from "@/api/types";
import {
  MOCK_EDUCATOR,
  MOCK_TOKEN,
  MOCK_VALID_CREDENTIALS,
} from "@/mocks/fixtures";
import { getMockSession } from "@/mocks/mock-auth-state";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

/** Código de 6 dígitos que o mock "envia" para a conta fictícia (SN-01). */
export const MOCK_PASSWORD_VALID_CODE = "123456";

const TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_SENDS = 3;
const MAX_WRONG_ATTEMPTS = 5;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 100;

interface StoredToken {
  code: string;
  expiresAt: number;
  wrongAttempts: number;
}

const tokens = new Map<string, StoredToken>();
const sends = new Map<string, number[]>();
let currentPassword: string = MOCK_VALID_CREDENTIALS.password;

/** Zera o estado em memória (uso em testes). */
export function resetMockPasswordState(): void {
  tokens.clear();
  sends.clear();
  currentPassword = MOCK_VALID_CREDENTIALS.password;
}

/** Faz o código da conta vencer agora (uso em testes e cenários manuais). */
export function expireMockPasswordToken(email: string): void {
  const stored = tokens.get(normalizeEmail(email));
  if (stored) stored.expiresAt = Date.now() - 1;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validationError(): MockApiError {
  return new MockApiError(400, "Validation error");
}

function readEmail(value: unknown): string {
  if (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value.trim()))
    throw validationError();
  return normalizeEmail(value);
}

function readCode(value: unknown): string {
  if (typeof value !== "string" || !/^\d{6}$/.test(value))
    throw validationError();
  return value;
}

function readNewPassword(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < MIN_PASSWORD ||
    value.length > MAX_PASSWORD
  )
    throw validationError();
  return value;
}

/**
 * Confere o código sem consumi-lo. Conta inexistente e código inexistente dão o
 * mesmo `INVALID_TOKEN`, para não revelar quais e-mails têm conta.
 */
function checkCode(email: string, code: string): StoredToken {
  const stored = tokens.get(email);
  if (!stored) throw new MockApiError(400, "INVALID_TOKEN");
  if (stored.wrongAttempts >= MAX_WRONG_ATTEMPTS)
    throw new MockApiError(429, "TOO_MANY_ATTEMPTS");
  if (stored.code !== code) {
    stored.wrongAttempts += 1;
    throw new MockApiError(400, "INVALID_TOKEN");
  }
  if (stored.expiresAt <= Date.now())
    throw new MockApiError(400, "EXPIRED_TOKEN");
  return stored;
}

registerMockHandler(
  { method: "put", path: "/educator/generate-token" },
  ({ body }) => {
    const input = (body ?? {}) as { email?: unknown; educatorEmail?: unknown };
    // O contrato atual usa `educatorEmail`; a especificação nova usa `email`.
    const email = readEmail(input.email ?? input.educatorEmail);
    const now = Date.now();
    const recent = (sends.get(email) ?? []).filter(
      (sentAt) => now - sentAt < TOKEN_TTL_MS,
    );
    if (recent.length >= MAX_SENDS) {
      sends.set(email, recent);
      throw new MockApiError(429, "TOO_MANY_REQUESTS");
    }
    sends.set(email, [...recent, now]);
    if (email === normalizeEmail(MOCK_EDUCATOR.email)) {
      tokens.set(email, {
        code: MOCK_PASSWORD_VALID_CODE,
        expiresAt: now + TOKEN_TTL_MS,
        wrongAttempts: 0,
      });
    }

    const data: PasswordTokenSentResponse = { message: "TOKEN_SENT" };
    return { status: 200, data };
  },
);

registerMockHandler(
  { method: "post", path: "/educator/verify-token" },
  ({ body }) => {
    const input = (body ?? {}) as { email?: unknown; token?: unknown };
    checkCode(readEmail(input.email), readCode(input.token));

    const data: VerifyPasswordTokenResponse = { valid: true };
    return { status: 200, data };
  },
);

registerMockHandler(
  { method: "post", path: "/educator/update-password" },
  ({ body }) => {
    const input = (body ?? {}) as {
      email?: unknown;
      token?: unknown;
      newPassword?: unknown;
    };
    // SN-05: sem `token` a rota antiga deixa de funcionar (400 de validação).
    const email = readEmail(input.email);
    const code = readCode(input.token);
    const newPassword = readNewPassword(input.newPassword);
    checkCode(email, code);
    if (newPassword === currentPassword)
      throw new MockApiError(400, "PASSWORD_SAME_AS_OLD");
    tokens.delete(email);
    currentPassword = newPassword;

    return { status: 200, data: { message: "PASSWORD_UPDATED" } };
  },
);

registerMockHandler(
  { method: "put", path: "/educator/change-password" },
  ({ body }) => {
    if (getMockSession() !== MOCK_TOKEN)
      throw new MockApiError(401, "UNAUTHORIZED");
    const input = (body ?? {}) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    if (
      typeof input.currentPassword !== "string" ||
      input.currentPassword.length === 0
    )
      throw validationError();
    const newPassword = readNewPassword(input.newPassword);
    if (input.currentPassword !== currentPassword)
      throw new MockApiError(400, "INVALID_CURRENT_PASSWORD");
    if (newPassword === currentPassword)
      throw new MockApiError(400, "PASSWORD_SAME_AS_OLD");
    currentPassword = newPassword;

    // O mock de `GET /educator/me` só reconhece `MOCK_TOKEN`; por isso o token
    // "novo" devolvido é o mesmo (SN-08 não é simulado).
    const data: ChangePasswordResponse = { token: MOCK_TOKEN };
    return { status: 200, data };
  },
);
