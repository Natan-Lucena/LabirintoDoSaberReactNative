import { ApiError } from "@/api/errors";
import { OfflineError } from "@/api/query-client";

const OFFLINE_MESSAGE =
  "Sem conexão com a internet. Verifique a rede e tente novamente.";

/** Mensagem de uma escrita da equipe (EQP-01 §4). */
export function teamErrorMessage(error: unknown): string {
  if (error instanceof OfflineError) {
    return OFFLINE_MESSAGE;
  }
  if (error instanceof ApiError) {
    if (error.code === "FORBIDDEN_ROLE") {
      return "Só a administração da equipe pode convidar.";
    }
    if (error.code === "TOO_MANY_INVITES") {
      return "A equipe já tem 20 convites ativos. Revogue algum antes de criar outro.";
    }
    return error.message;
  }
  return "Não foi possível concluir. Tente novamente.";
}
