import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import type { AnamneseQuestionType, AnamneseSummaryFields } from "@/api/types";

export const MAX_ANAMNESE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface AnamneseAnswer {
  questionId: string;
  questionType: AnamneseQuestionType;
  textValue?: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  fileUrl?: string;
}

export interface AnamneseResponse extends AnamneseSummaryFields {
  id: string;
  templateId: string;
  educatorId: string;
  studentId: string;
  answers: AnamneseAnswer[];
  answeredAt: string;
  /** Gravado pelo `PUT /anamnese/responses/:responseId` (2026-10-29). */
  updatedAt?: string;
}

/** Resposta enviada: só o campo do tipo da pergunta. */
export type AnamneseAnswerInput = AnamneseAnswer;

export interface CreateAnamneseResponseInput {
  studentId: string;
  answers: AnamneseAnswerInput[];
}

export interface UpdateAnamneseResponseInput {
  answers: AnamneseAnswerInput[];
}

export interface AnamneseUploadFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

/** GET /anamnese/responses/student/:studentId (respostas completas). */
export async function listAnamneseResponsesByStudent(
  studentId: string,
): Promise<AnamneseResponse[]> {
  const response = await apiClient.get<AnamneseResponse[]>(
    `/anamnese/responses/student/${studentId}`,
  );
  return response.data;
}

/** POST /anamnese/templates/:templateId/responses */
export async function createAnamneseResponse(
  templateId: string,
  input: CreateAnamneseResponseInput,
): Promise<AnamneseResponse> {
  const response = await apiClient.post<AnamneseResponse>(
    `/anamnese/templates/${templateId}/responses`,
    input,
  );
  return response.data;
}

/** PUT /anamnese/responses/:responseId — mesma lista `answers` da criação. */
export async function updateAnamneseResponse(
  responseId: string,
  input: UpdateAnamneseResponseInput,
): Promise<AnamneseResponse> {
  const response = await apiClient.put<AnamneseResponse>(
    `/anamnese/responses/${responseId}`,
    input,
  );
  return response.data;
}

/** POST /anamnese/responses/upload-file (multipart `file`, até 10 MB). */
export async function uploadAnamneseFile(
  file: AnamneseUploadFile,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  const response = await apiClient.post<{ url: string }>(
    "/anamnese/responses/upload-file",
    formData,
  );
  return response.data.url;
}

/**
 * POST /anamnese/responses/:responseId/summary — síntese por IA (AS-01).
 * Timeout de 90 s e sem reenvio automático; devolve a resposta com `summary`.
 */
export async function generateAnamneseSummary(
  responseId: string,
): Promise<AnamneseResponse> {
  const response = await apiClient.post<AnamneseResponse>(
    `/anamnese/responses/${responseId}/summary`,
    undefined,
    { timeout: AI_TIMEOUT_MS },
  );
  return response.data;
}
