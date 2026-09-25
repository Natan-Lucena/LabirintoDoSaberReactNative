import { apiClient } from "@/api/client";
import type { TaskNotebookSession } from "@/api/types";

/** POST /task-notebook-session/start */
export interface StartSessionInput {
  studentId: string;
  name: string;
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
