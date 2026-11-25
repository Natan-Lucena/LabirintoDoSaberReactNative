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

// API-07, leva 1: códigos do banco de atividades (§2 e §3 da especificação).
const NEW_CODES: [number, string, string][] = [
  [
    400,
    "INVALID_CONTENT",
    "O conteúdo da atividade é inválido. Revise os campos marcados.",
  ],
  [
    400,
    "ALTERNATIVES_NOT_ALLOWED",
    "Este tipo de atividade não usa alternativas.",
  ],
  [
    400,
    "INVALID_MEDIA_URL",
    "Uma imagem ou um áudio não foi enviado pelo app. Escolha o arquivo de novo.",
  ],
  [
    400,
    "INVALID_SKILL",
    "Uma das habilidades escolhidas não existe mais. Atualize a lista.",
  ],
  [
    403,
    "LIBRARY_TASK_READ_ONLY",
    'Atividades prontas não podem ser alteradas. Use "Duplicar para editar".',
  ],
  [
    400,
    "TYPE_CHANGE_NOT_ALLOWED",
    "O tipo da atividade não pode ser alterado.",
  ],
  [
    400,
    "PRINTABLE_NOT_PLAYABLE",
    "Atividades imprimíveis não entram em cadernos, grupos ou sessões.",
  ],
  [
    400,
    "USE_ANSWER_ROUTE",
    "Esta atividade não pode ser registrada como jogo.",
  ],
  [
    409,
    "RESULT_ALREADY_EXISTS",
    "O resultado desta atividade já foi registrado.",
  ],
  [
    409,
    "SESSION_ALREADY_FINISHED",
    "A sessão já foi encerrada; o resultado não foi registrado.",
  ],
  [
    400,
    "INVALID_CURSOR",
    "Não foi possível carregar mais itens. Atualize a lista.",
  ],
];

describe("normalizeApiError: códigos do banco de atividades (API-07, leva 1)", () => {
  it.each(NEW_CODES)(
    "%i %s vira mensagem em português e mantém o código",
    (status, code, message) => {
      const normalized = normalizeApiError(failure(status, code));

      expect(normalized.message).toBe(message);
      expect(normalized.code).toBe(code);
      expect(normalized.status).toBe(status);
    },
  );

  it.each(["TASK_NOT_FOUND", "STUDENT_NOT_FOUND", "SESSION_NOT_FOUND"])(
    "%s continua sem tradução (as telas tratam pelo code)",
    (code) => {
      expect(normalizeApiError(failure(404, code)).message).toBe(code);
    },
  );
});
