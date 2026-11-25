import { apiClient } from "@/api/client";
import type { ActivityResult, TaskNotebookSession } from "@/api/types";

/** POST /task-notebook-session/start */
export interface StartSessionInput {
  studentId: string;
  name: string;
  taskNotebookId?: string;
  appointmentId?: string;
}

export async function startSession(
  input: StartSessionInput,
): Promise<TaskNotebookSession> {
  const response = await apiClient.post<TaskNotebookSession>(
    "/task-notebook-session/start",
    input,
  );

  return response.data;
}

/** POST /task-notebook-session/answer */
export interface AnswerSessionInput {
  sessionId: string;
  taskId: string;
  selectedAlternativeId: string;
  timeToAnswer: number;
}

export async function answerSession(
  input: AnswerSessionInput,
): Promise<TaskNotebookSession> {
  const response = await apiClient.post<TaskNotebookSession>(
    "/task-notebook-session/answer",
    input,
  );

  return response.data;
}

/**
 * POST /task-notebook-session/activity-result (RS-04, API-06 propõe; mock-first).
 * Um resultado por atividade e sessão: o segundo envio devolve
 * `409 RESULT_ALREADY_EXISTS`. Nunca é repetido sozinho (G-08).
 */
export interface SubmitActivityResultInput {
  sessionId: string;
  taskId: string;
  completed: boolean;
  correct: boolean;
  /** 1–50 */
  attempts: number;
  /** 0–50 */
  errors: number;
  /** 0–3 600 000 */
  durationMs: number;
}

export async function submitActivityResult(
  input: SubmitActivityResultInput,
): Promise<ActivityResult> {
  const response = await apiClient.post<ActivityResult>(
    "/task-notebook-session/activity-result",
    input,
  );

  return response.data;
}

/** POST /task-notebook-session/finish */
export interface FinishSessionInput {
  sessionId: string;
}

export async function finishSession(
  input: FinishSessionInput,
): Promise<TaskNotebookSession> {
  const response = await apiClient.post<TaskNotebookSession>(
    "/task-notebook-session/finish",
    input,
  );

  return response.data;
}

/** POST /task-notebook-session/observation */
export interface AddSessionObservationInput {
  sessionId: string;
  observation: string;
}

export async function addSessionObservation(
  input: AddSessionObservationInput,
): Promise<TaskNotebookSession> {
  const response = await apiClient.post<TaskNotebookSession>(
    "/task-notebook-session/observation",
    input,
  );

  return response.data;
}

/** GET /task-notebook-session/student/:studentId */
export async function listSessionsByStudent(
  studentId: string,
): Promise<TaskNotebookSession[]> {
  const response = await apiClient.get<TaskNotebookSession[]>(
    `/task-notebook-session/student/${studentId}`,
  );

  return response.data;
}
