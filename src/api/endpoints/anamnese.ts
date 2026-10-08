import { apiClient } from "@/api/client";
import type { AnamneseTemplate } from "@/api/types";

/** GET /anamnese/templates/ */
export async function listAnamneseTemplates(): Promise<AnamneseTemplate[]> {
  const response = await apiClient.get<AnamneseTemplate[]>(
    "/anamnese/templates/",
  );

  return response.data;
}
