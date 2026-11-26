// Central de ajuda: leitura (API-07, leva 4). Contrato PROPOSTO em
// docs/entrega-5/CONTRATOS-BACKEND.md §2.7 e §6.7 (mock-first).
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type { HelpTutorial } from "@/api/types";

export const helpQueryKeys = {
  tutorials: ["help", "tutorials"] as const,
};

/** GET /help/tutorials — por `order`; lista vazia é válida. */
export async function listHelpTutorials(): Promise<HelpTutorial[]> {
  try {
    const response = await apiClient.get<HelpTutorial[]>("/help/tutorials");
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
