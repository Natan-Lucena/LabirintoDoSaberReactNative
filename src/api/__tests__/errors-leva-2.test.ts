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

// API-05, leva 2: códigos novos das escalas (§4), contrato provisório.
const NEW_CODES: [number, string, RegExp][] = [
  [404, "SCALE_NOT_FOUND", /escala não encontrada/i],
  [409, "SCALE_INACTIVE", /não está mais disponível/i],
  [409, "DRAFT_ALREADY_EXISTS", /já existe um rascunho/i],
  [400, "ITEM_NOT_IN_SCALE", /não pertence/i],
  [400, "INVALID_ANSWER_VALUE", /valor que a escala não aceita/i],
  [400, "SCALE_INCOMPLETE", /todos os itens/i],
  [409, "APPLICATION_NOT_EDITABLE", /já foi concluída/i],
  [404, "APPLICATION_NOT_FOUND", /aplicação não encontrada/i],
];

describe("normalizeApiError: códigos das escalas (API-05, leva 2)", () => {
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

  it("os erros de IA da síntese e do insight reaproveitam a tradução da leva 1", () => {
    for (const code of ["AI_GENERATION_FAILED", "AI_INVALID_OUTPUT"]) {
      const normalized = normalizeApiError(failure(500, code));

      expect(normalized.code).toBe(code);
      expect(normalized.message).not.toBe(code);
    }
  });

  it("mantém sem tradução os códigos que as telas leem pelo texto cru", () => {
    expect(normalizeApiError(failure(404, "RESPONSE_NOT_FOUND")).message).toBe(
      "RESPONSE_NOT_FOUND",
    );
    expect(normalizeApiError(failure(403, "UNAUTHORIZED")).message).toBe(
      "UNAUTHORIZED",
    );
  });
});
