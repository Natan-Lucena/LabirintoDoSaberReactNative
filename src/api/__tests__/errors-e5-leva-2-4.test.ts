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

// API-07, levas 2 a 4: CONTRATOS-BACKEND §2.9.
const NEW_CODES: [number, string, string][] = [
  [400, "NOT_IN_SAME_CLINIC", "Esta pessoa não faz parte da sua equipe."],
  [403, "FORBIDDEN_ROLE", "Apenas administradores da equipe podem fazer isso."],
  [404, "NOT_IN_CLINIC", "Você ainda não faz parte de uma equipe."],
  [404, "INVITE_NOT_FOUND", "Convite não encontrado. Atualize a lista."],
  [
    404,
    "INVITE_INVALID",
    "Código de convite inválido, vencido ou já usado. Peça um novo à equipe.",
  ],
  [404, "MEMBER_NOT_FOUND", "Esta pessoa não faz parte da equipe."],
  [404, "SHARE_NOT_FOUND", "Este compartilhamento não existe mais."],
  [409, "ALREADY_IN_CLINIC", "Você já faz parte de uma equipe."],
  [
    409,
    "TOO_MANY_INVITES",
    "Há convites demais ativos. Revogue algum antes de criar outro.",
  ],
  [
    409,
    "LAST_ADMIN",
    "A equipe precisa de ao menos um administrador. Promova outra pessoa antes.",
  ],
  [
    409,
    "HAS_FUTURE_APPOINTMENTS",
    "Este paciente tem atendimentos futuros. Cancele-os ou escolha cancelar ao arquivar.",
  ],
  [
    409,
    "STUDENT_ARCHIVED",
    "Este paciente está arquivado. Reative-o para criar novos registros.",
  ],
  [404, "SERIES_NOT_FOUND", "Série de atendimentos não encontrada."],
  [
    400,
    "INVALID_PUSH_TOKEN",
    "Não foi possível ativar os avisos neste aparelho.",
  ],
];

// Backend publicado em 2026-11-26 (BACKEND-ENTREGUE-E5): D-13.
const PUBLISHED_CODES: [number, string, string][] = [
  [403, "UNAUTHORIZED", "Você não tem acesso a este item."],
  [
    400,
    "SERIES_TOO_LONG",
    "A série passa de 6 meses. Reduza o número de atendimentos ou a frequência.",
  ],
  [
    400,
    "APPOINTMENT_NOT_IN_SERIES",
    "Este atendimento não faz parte desta série.",
  ],
  [
    400,
    "USE_ACTIVITY_RESULT_ROUTE",
    "Este jogo registra o resultado da atividade, não uma resposta.",
  ],
  [
    400,
    "STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR",
    "Este paciente não está sob os seus cuidados.",
  ],
  [404, "NEW_EDUCATOR_NOT_FOUND", "O novo responsável não foi encontrado."],
  [
    400,
    "TASK_NOT_IN_NOTEBOOK",
    "Esta atividade não faz parte do caderno da sessão.",
  ],
];

describe("mensagens dos erros do backend publicado (D-13)", () => {
  it.each(PUBLISHED_CODES)(
    "%i %s tem mensagem em português",
    (status, code, text) => {
      const error = normalizeApiError(failure(status, code));

      expect(error.message).toBe(text);
      expect(error.code).toBe(code);
    },
  );
});

describe("mensagens dos erros da Entrega 5, levas 2 a 4", () => {
  it.each(NEW_CODES)(
    "%i %s tem mensagem em português",
    (status, code, text) => {
      const error = normalizeApiError(failure(status, code));

      expect(error.message).toBe(text);
      expect(error.code).toBe(code);
      expect(error.status).toBe(status);
    },
  );

  it("os códigos tratados pelo code nas telas seguem sem tradução", () => {
    for (const code of [
      "STUDENT_NOT_FOUND",
      "APPOINTMENT_NOT_FOUND",
      "APPOINTMENT_CONFLICT",
      "APPOINTMENT_NOT_EDITABLE",
    ]) {
      expect(normalizeApiError(failure(409, code)).message).toBe(code);
    }
  });
});
