import { AxiosError, isAxiosError } from "axios";

export interface ApiFieldError {
  path: string;
  message: string;
}

interface ApiErrorResponse {
  message?: unknown;
  errors?: unknown;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly errors: readonly ApiFieldError[];
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;

  constructor({
    message,
    status,
    code,
    errors = [],
    isNetworkError = false,
    isTimeout = false,
  }: {
    message: string;
    status?: number;
    code?: string;
    errors?: readonly ApiFieldError[];
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

function getFieldErrors(value: unknown): readonly ApiFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (error): error is ApiFieldError =>
      typeof error === "object" &&
      error !== null &&
      typeof error.path === "string" &&
      typeof error.message === "string",
  );
}

// Códigos de erro de regra de negócio com mensagem em português. Contrato
// PROVISÓRIO da Entrega 4, leva 1 (senha §2 e evolução §3 da
// ESPECIFICACAO-BACKEND); conferir em API-04. O `code` continua sendo o
// código do servidor; só a `message` é traduzida.
// TODO(API-04): SESSION_NOT_FOUND e SESSION_NOT_FINISHED ficam SEM tradução de
// propósito: já existem no contrato da observação/relatório e as telas as
// mapeiam pelo `code` (testes leem a mensagem crua). Reavaliar na API-04.
const API_ERROR_MESSAGES: Record<string, string> = {
  TOO_MANY_REQUESTS:
    "Muitas solicitações de código. Aguarde alguns minutos e tente de novo.",
  INVALID_TOKEN: "Código inválido. Confira os 6 dígitos e tente novamente.",
  EXPIRED_TOKEN: "Código vencido. Solicite um novo código.",
  PASSWORD_SAME_AS_OLD: "A nova senha não pode ser igual à anterior.",
  TOO_MANY_ATTEMPTS:
    "Muitas tentativas incorretas. Solicite um novo código para continuar.",
  INVALID_CURRENT_PASSWORD: "A senha atual está incorreta.",
  EVOLUTION_ALREADY_EXISTS: "Esta sessão já tem evolução registrada.",
  INVALID_ATTEMPTS:
    "O número de acertos não pode passar do número de tentativas.",
  INVALID_PLAN: "Este plano não pode ser usado para a evolução da sessão.",
  GOAL_NOT_IN_PLAN: "Uma das metas não pertence ao plano escolhido.",
  PLAN_NOT_EDITABLE: "O plano já foi encerrado e não pode ser alterado.",
  EVOLUTION_NOT_FOUND: "Evolução não encontrada.",
  AI_GENERATION_FAILED:
    "Não foi possível gerar a sugestão agora. Tente novamente em instantes.",
  AI_INVALID_OUTPUT:
    "A resposta da IA veio inválida. Tente gerar a sugestão novamente.",
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!isAxiosError(error)) {
    return new ApiError({
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }

  const response = error.response;
  const payload = (response?.data ?? {}) as ApiErrorResponse;
  const serverMessage =
    typeof payload.message === "string" ? payload.message : undefined;
  const isTimeout =
    error.code === AxiosError.ETIMEDOUT || error.code === "ECONNABORTED";
  const isNetworkError = !response && !isTimeout;

  const message =
    (serverMessage === undefined
      ? undefined
      : Object.hasOwn(API_ERROR_MESSAGES, serverMessage)
        ? API_ERROR_MESSAGES[serverMessage]
        : serverMessage) ??
    (isTimeout
      ? "O servidor demorou para responder. Tente novamente."
      : isNetworkError
        ? "Sem conexão com a internet. Verifique a rede e tente novamente."
        : error.message);

  return new ApiError({
    message,
    status: response?.status,
    code: serverMessage,
    errors: getFieldErrors(payload.errors),
    isNetworkError,
    isTimeout,
  });
}
