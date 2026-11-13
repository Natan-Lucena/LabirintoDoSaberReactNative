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

/**
 * Erros de campo. O backend publicado manda
 * `{ message: "Bad Request", errors: [{ message, field }] }` (`field` é o
 * primeiro nível do caminho); `path` é o formato antigo, ainda aceito.
 */
function getFieldErrors(value: unknown): readonly ApiFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((error: unknown): ApiFieldError[] => {
    if (typeof error !== "object" || error === null) return [];
    const { path, field, message } = error as Record<string, unknown>;
    const fieldPath =
      typeof path === "string"
        ? path
        : typeof field === "string"
          ? field
          : undefined;
    return fieldPath !== undefined && typeof message === "string"
      ? [{ path: fieldPath, message }]
      : [];
  });
}

// Códigos de erro de regra de negócio com mensagem em português. Leva 1
// conferida na INT-1 contra o contrato publicado (BACKEND-ENTREGUE §3.1 e
// §3.2). O `code` continua sendo o código do servidor; só a `message` é
// traduzida.
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
  // Leva 2 (escalas e síntese da anamnese), conferida na INT-2 (BACKEND-ENTREGUE §3.3 a §3.5).
  // RESPONSE_NOT_FOUND e STUDENT_NOT_FOUND ficam SEM tradução de propósito: já
  // existem no contrato da anamnese e testes leem o código/mensagem crua.
  SCALE_NOT_FOUND: "Escala não encontrada.",
  SCALE_INACTIVE: "Esta escala não está mais disponível para novas aplicações.",
  DRAFT_ALREADY_EXISTS:
    "Já existe um rascunho desta escala para este paciente. Retome o rascunho.",
  ITEM_NOT_IN_SCALE: "Uma das respostas não pertence a esta escala.",
  INVALID_ANSWER_VALUE:
    "Uma das respostas tem um valor que a escala não aceita.",
  SCALE_INCOMPLETE: "Responda todos os itens para concluir a escala.",
  APPLICATION_NOT_EDITABLE:
    "Esta aplicação já foi concluída e não pode ser alterada.",
  APPLICATION_NOT_FOUND: "Aplicação não encontrada.",
  INVALID_APPOINTMENT:
    "O atendimento escolhido não pertence a este paciente. Escolha outro.",
  NO_ANSWERS_YET: "Responda ao menos um item antes de gerar a interpretação.",
  NO_ANSWERS_TO_SUMMARIZE:
    "A anamnese ainda não tem respostas para resumir. Preencha-a antes.",
  TEMPLATE_NOT_FOUND: "O modelo desta anamnese não foi encontrado.",
  // Leva 3 (relatórios §6 e notificações §7), contrato PROVISÓRIO.
  // STUDENT_NOT_FOUND segue SEM tradução (ver leva 2).
  SECTION_NOT_ALLOWED:
    "Uma das seções escolhidas não está disponível para este tipo de relatório.",
  INVALID_PERIOD:
    "O período é inválido: a data inicial deve ser anterior à final e o intervalo, de até 365 dias.",
  REPORT_EMPTY_PERIOD:
    "Não há dados do paciente neste período. Escolha outro período.",
  REPORT_NOT_FOUND: "Relatório não encontrado.",
  NOTIFICATION_NOT_FOUND: "Notificação não encontrada.",
  INVALID_CURSOR:
    "Não foi possível carregar mais notificações. Atualize a lista.",
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
