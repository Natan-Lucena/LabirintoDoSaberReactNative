import { apiClient } from "@/api/client";
import type { AnamneseTemplate, AnamneseQuestionType } from "@/api/types";

export interface CreateAnamneseTemplateInput {
  title: string;
  description?: string;
  questions: {
    text: string;
    type: AnamneseQuestionType;
    required: boolean;
    options?: { text: string }[];
  }[];
}
export type UpdateAnamneseTemplateInput = Partial<CreateAnamneseTemplateInput>;

/** GET /anamnese/templates/ */
export async function listAnamneseTemplates(): Promise<AnamneseTemplate[]> {
  const response = await apiClient.get<AnamneseTemplate[]>(
    "/anamnese/templates/",
  );

  return response.data;
}

export async function getAnamneseTemplate(
  templateId: string,
): Promise<AnamneseTemplate> {
  const response = await apiClient.get<AnamneseTemplate>(
    `/anamnese/templates/${templateId}`,
  );
  return response.data;
}

export async function createAnamneseTemplate(
  input: CreateAnamneseTemplateInput,
): Promise<AnamneseTemplate> {
  const response = await apiClient.post<AnamneseTemplate>(
    "/anamnese/templates/",
    input,
  );
  return response.data;
}

export async function updateAnamneseTemplate(
  templateId: string,
  input: UpdateAnamneseTemplateInput,
): Promise<AnamneseTemplate> {
  const response = await apiClient.put<AnamneseTemplate>(
    `/anamnese/templates/${templateId}`,
    input,
  );
  return response.data;
}

export async function deleteAnamneseTemplate(
  templateId: string,
): Promise<null> {
  const response = await apiClient.delete<null>(
    `/anamnese/templates/${templateId}`,
  );
  return response.data;
}
