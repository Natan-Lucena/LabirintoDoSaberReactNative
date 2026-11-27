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
  INVALID_CURSOR: "Não foi possível carregar mais itens. Atualize a lista.",
  // Entrega 5, banco de atividades (API-07, leva 1), contrato publicado em 2026-11-26.
  // TASK_NOT_FOUND, STUDENT_NOT_FOUND e SESSION_NOT_FOUND seguem SEM tradução.
  INVALID_CONTENT:
    "O conteúdo da atividade é inválido. Revise os campos marcados.",
  ALTERNATIVES_NOT_ALLOWED: "Este tipo de atividade não usa alternativas.",
  INVALID_MEDIA_URL:
    "Uma imagem ou um áudio não foi enviado pelo app. Escolha o arquivo de novo.",
  INVALID_SKILL:
    "Uma das habilidades escolhidas não existe mais. Atualize a lista.",
  LIBRARY_TASK_READ_ONLY:
    'Atividades prontas não podem ser alteradas. Use "Duplicar para editar".',
  TYPE_CHANGE_NOT_ALLOWED: "O tipo da atividade não pode ser alterado.",
  PRINTABLE_NOT_PLAYABLE:
    "Atividades imprimíveis não entram em cadernos, grupos ou sessões.",
  USE_ANSWER_ROUTE: "Esta atividade não pode ser registrada como jogo.",
  RESULT_ALREADY_EXISTS: "O resultado desta atividade já foi registrado.",
  SESSION_ALREADY_FINISHED:
    "A sessão já foi encerrada; o resultado não foi registrado.",
  // Entrega 5, equipe, status e push (API-07, levas 2 a 4), contrato publicado em 2026-11-26.
  // STUDENT_NOT_FOUND, APPOINTMENT_NOT_FOUND, APPOINTMENT_CONFLICT e
  // APPOINTMENT_NOT_EDITABLE seguem SEM tradução: as telas os tratam pelo `code`.
  // TOO_MANY_REQUESTS (prévia do convite) reaproveita o texto do código de senha.
  NOT_IN_SAME_CLINIC: "Esta pessoa não faz parte da sua equipe.",
  FORBIDDEN_ROLE: "Apenas administradores da equipe podem fazer isso.",
  NOT_IN_CLINIC: "Você ainda não faz parte de uma equipe.",
  INVITE_NOT_FOUND: "Convite não encontrado. Atualize a lista.",
  INVITE_INVALID:
    "Código de convite inválido, vencido ou já usado. Peça um novo à equipe.",
  MEMBER_NOT_FOUND: "Esta pessoa não faz parte da equipe.",
  SHARE_NOT_FOUND: "Este compartilhamento não existe mais.",
  ALREADY_IN_CLINIC: "Você já faz parte de uma equipe.",
  TOO_MANY_INVITES:
    "Há convites demais ativos. Revogue algum antes de criar outro.",
  LAST_ADMIN:
    "A equipe precisa de ao menos um administrador. Promova outra pessoa antes.",
  HAS_FUTURE_APPOINTMENTS:
    "Este paciente tem atendimentos futuros. Cancele-os ou escolha cancelar ao arquivar.",
  STUDENT_ARCHIVED:
    "Este paciente está arquivado. Reative-o para criar novos registros.",
  SERIES_NOT_FOUND: "Série de atendimentos não encontrada.",
  // Backend publicado (BACKEND-ENTREGUE-E5 §2, §3.1, §3.2 e §3.5). `UNAUTHORIZED`
  // aqui é o 403 de acesso (a sessão expirada é 401, outro caminho).
  UNAUTHORIZED: "Você não tem acesso a este item.",
  SERIES_TOO_LONG:
    "A série passa de 6 meses. Reduza o número de atendimentos ou a frequência.",
  APPOINTMENT_NOT_IN_SERIES: "Este atendimento não faz parte desta série.",
  USE_ACTIVITY_RESULT_ROUTE:
    "Este jogo registra o resultado da atividade, não uma resposta.",
  STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR:
    "Este paciente não está sob os seus cuidados.",
  NEW_EDUCATOR_NOT_FOUND: "O novo responsável não foi encontrado.",
  TASK_NOT_IN_NOTEBOOK: "Esta atividade não faz parte do caderno da sessão.",
  INVALID_PUSH_TOKEN: "Não foi possível ativar os avisos neste aparelho.",
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
