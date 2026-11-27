import { normalizeApiError } from "@/api/errors";
import { OfflineError } from "@/api/query-client";

export const INVITE_CODE_FORMAT_MESSAGE =
  "O código tem 8 letras e números (sem 0, O, 1 e I).";
export const INVITE_INVALID_MESSAGE =
  "Convite inválido ou vencido. Peça um novo código para quem convidou você.";
export const INVITE_RATE_LIMIT_MESSAGE =
  "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
export const EDUCATOR_EXISTS_MESSAGE =
  "Já existe uma conta com este e-mail. Entre com ela e use 'Entrar numa equipe' no perfil.";
export const ALREADY_IN_CLINIC_MESSAGE =
  "Você já faz parte de uma equipe. Saia dela antes de entrar em outra.";
export const NETWORK_MESSAGE =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";

/**
 * Mapeia pelo `code` (e pelo 429) as frases da EQP-03, sem mexer em
 * `src/api/errors.ts`: a mensagem global de `TOO_MANY_REQUESTS` fala do código
 * de senha. Nunca inclui senha nem código.
 */
export function inviteErrorMessage(error: unknown): string {
  if (error instanceof OfflineError) return NETWORK_MESSAGE;
  const apiError = normalizeApiError(error);
  if (apiError.isNetworkError || apiError.isTimeout) return NETWORK_MESSAGE;
  if (apiError.code === "INVITE_INVALID" || apiError.status === 404) {
    return INVITE_INVALID_MESSAGE;
  }
  if (apiError.code === "TOO_MANY_REQUESTS" || apiError.status === 429) {
    return INVITE_RATE_LIMIT_MESSAGE;
  }
  if (apiError.code === "EDUCATOR_ALREADY_EXISTS") {
    return EDUCATOR_EXISTS_MESSAGE;
  }
  if (apiError.code === "ALREADY_IN_CLINIC") return ALREADY_IN_CLINIC_MESSAGE;
  return apiError.message;
}
