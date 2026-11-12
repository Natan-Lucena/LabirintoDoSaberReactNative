import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it } from "vitest";

import { normalizeApiError } from "@/api/errors";

const axiosConfig = {
  headers: new AxiosHeaders(),
} as InternalAxiosRequestConfig;

function failure(status: number, message: string): AxiosError {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    config: axiosConfig,
    data: { message },
    headers: {},
    status,
    statusText: "Error",
  });
}

// API-05, leva 1: códigos novos da senha (§2) e da evolução (§3), contrato provisório.
const NEW_CODES: [number, string, RegExp][] = [
  [429, "TOO_MANY_REQUESTS", /muitas solicitações/i],
  [400, "INVALID_TOKEN", /código.*inválido/i],
  [400, "EXPIRED_TOKEN", /código.*venc/i],
  [400, "PASSWORD_SAME_AS_OLD", /igual à anterior/i],
  [429, "TOO_MANY_ATTEMPTS", /muitas tentativas/i],
  [400, "INVALID_CURRENT_PASSWORD", /senha atual.*incorreta/i],
  [409, "EVOLUTION_ALREADY_EXISTS", /já tem evolução/i],
  [400, "INVALID_ATTEMPTS", /acertos.*tentativas/i],
  [400, "INVALID_PLAN", /plano.*não pode ser usado/i],
  [400, "GOAL_NOT_IN_PLAN", /meta.*não pertence/i],
  [409, "PLAN_NOT_EDITABLE", /plano.*encerrado/i],
  [404, "EVOLUTION_NOT_FOUND", /evolução não encontrada/i],
  [500, "AI_GENERATION_FAILED", /não foi possível gerar a sugestão/i],
  [500, "AI_INVALID_OUTPUT", /resposta.*inválida/i],
];

describe("normalizeApiError: códigos da senha e da evolução (API-05, leva 1)", () => {
  it.each(NEW_CODES)(
    "%i %s vira mensagem em português e mantém o código",
    (status, code, pattern) => {
      const normalized = normalizeApiError(failure(status, code));

      expect(normalized.code).toBe(code);
      expect(normalized.status).toBe(status);
      expect(normalized.message).not.toBe(code);
      expect(normalized.message).toMatch(pattern);
    },
  );

  it("não traduz códigos desconhecidos nem os de erro de validação", () => {
    expect(normalizeApiError(failure(400, "Validation error")).message).toBe(
      "Validation error",
    );
    expect(normalizeApiError(failure(403, "UNAUTHORIZED")).message).toBe(
      "UNAUTHORIZED",
    );
    // Já existem no contrato da observação/relatório e telas/testes leem a mensagem crua.
    expect(normalizeApiError(failure(404, "SESSION_NOT_FOUND")).message).toBe(
      "SESSION_NOT_FOUND",
    );
    expect(
      normalizeApiError(failure(409, "SESSION_NOT_FINISHED")).message,
    ).toBe("SESSION_NOT_FINISHED");
  });
});
