import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  answerSession,
  listSessionsByStudent,
  startSession,
} from "@/api/endpoints/session";
import { MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/session-analysis";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
const NOTEBOOK = MOCK_TASK_NOTEBOOKS[0];

function answerInput(sessionId: string, taskId: string) {
  return {
    sessionId,
    taskId,
    selectedAlternativeId: "alternative-1",
    timeToAnswer: 5,
  };
}

describe("sessão ligada ao caderno nos mocks (SES-05)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("guarda taskNotebookId e appointmentId e os devolve nas listagens", async () => {
    const session = await startSession({
      studentId: "student-2",
      name: "Sessão com caderno",
      taskNotebookId: NOTEBOOK.notebook.id,
      appointmentId: "appointment-1",
    });

    expect(session.taskNotebookId).toBe(NOTEBOOK.notebook.id);
    expect(session.appointmentId).toBe("appointment-1");

    const listed = (await listSessionsByStudent("student-2")).find(
      (item) => item.id === session.id,
    );
    expect(listed?.taskNotebookId).toBe(NOTEBOOK.notebook.id);
    expect(listed?.appointmentId).toBe("appointment-1");
  });

  it("sessão sem caderno continua válida e aceita qualquer tarefa", async () => {
    const session = await startSession({
      studentId: "student-2",
      name: "Sessão sem caderno",
    });
    expect(session.taskNotebookId).toBeNull();

    await expect(
      answerSession(answerInput(session.id, "task-999")),
    ).resolves.toBeDefined();
  });

  it("answer aceita tarefa do caderno e de um grupo dele", async () => {
    const session = await startSession({
      studentId: "student-2",
      name: "Sessão com caderno",
      taskNotebookId: NOTEBOOK.notebook.id,
    });
    const groupTask = NOTEBOOK.taskGroups[0].tasksIds[0];

    await expect(
      answerSession(answerInput(session.id, NOTEBOOK.notebook.tasks[0])),
    ).resolves.toBeDefined();
    await expect(
      answerSession(answerInput(session.id, groupTask)),
    ).resolves.toBeDefined();
  });

  it("answer devolve TASK_NOT_IN_NOTEBOOK para tarefa fora do caderno", async () => {
    const session = await startSession({
      studentId: "student-2",
      name: "Sessão com caderno",
      taskNotebookId: NOTEBOOK.notebook.id,
    });

    await expect(
      answerSession(answerInput(session.id, "task-fora-do-caderno")),
    ).rejects.toThrow("TASK_NOT_IN_NOTEBOOK");
  });
});
