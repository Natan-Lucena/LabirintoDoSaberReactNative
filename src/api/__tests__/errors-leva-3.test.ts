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

// API-05, leva 3: códigos novos de relatórios (§6) e notificações (§7), provisório.
const NEW_CODES: [number, string, RegExp][] = [
  [400, "SECTION_NOT_ALLOWED", /não está disponível/i],
  [400, "INVALID_PERIOD", /período é inválido/i],
  [400, "INVALID_CURSOR", /atualize a lista/i],
  [400, "REPORT_EMPTY_PERIOD", /não há dados/i],
  [404, "REPORT_NOT_FOUND", /relatório não encontrado/i],
  [404, "NOTIFICATION_NOT_FOUND", /notificação não encontrada/i],
];

describe("normalizeApiError: códigos de relatórios e notificações (API-05, leva 3)", () => {
  it.each(NEW_CODES)(
    "%i %s vira mensagem em português e mantém o código",
    (status, code, pattern) => {
      const normalized = normalizeApiError(failure(status, code));

      expect(normalized.message).toMatch(pattern);
      expect(normalized.code).toBe(code);
      expect(normalized.status).toBe(status);
    },
  );
});
