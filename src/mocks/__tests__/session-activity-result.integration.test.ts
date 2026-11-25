import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getStudentAnalysis } from "@/api/endpoints/session-analysis";
import {
  finishSession,
  listSessionsByStudent,
  startSession,
  submitActivityResult,
  type SubmitActivityResultInput,
} from "@/api/endpoints/session";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import {
  setMockActivityResultScenario,
  setMockSessionAnswerScenario,
} from "@/mocks/handlers/session-analysis";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

function body(
  sessionId: string,
  overrides: Partial<SubmitActivityResultInput> = {},
): SubmitActivityResultInput {
  return {
    sessionId,
    taskId: "task-word-1",
    completed: true,
    correct: false,
    attempts: 3,
    errors: 2,
    durationMs: 8000,
    ...overrides,
  };
}

async function newSession(taskNotebookId?: string) {
  return startSession({
    studentId: "student-1",
    name: "Sessão com jogo",
    ...(taskNotebookId ? { taskNotebookId } : {}),
  });
}

describe("POST /task-notebook-session/activity-result (mock, EVO-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockActivityResultScenario("success");
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    setMockActivityResultScenario("success");
  });

  it("registra o resultado (201) e o devolve na listagem de sessões do paciente", async () => {
    const session = await newSession();

    const result = await submitActivityResult(body(session.id));

    expect(result).toMatchObject({
      sessionId: session.id,
      taskId: "task-word-1",
      taskType: "wordBuilder",
      completed: true,
      correct: false,
      attempts: 3,
      errors: 2,
      durationMs: 8000,
    });
    expect(result.id).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(result.recordedAt))).toBe(false);

    const listed = (await listSessionsByStudent("student-1")).find(
      (item) => item.id === session.id,
    );
    expect(listed?.activityResults).toEqual([result]);
  });

  it("aceita o jogo de um caderno que o contém (RS-02)", async () => {
    const notebook = MOCK_TASK_NOTEBOOKS[0]!;
    notebook.notebook.tasks.push("task-word-1");
    try {
      const session = await newSession(notebook.notebook.id);
      await expect(
        submitActivityResult(body(session.id)),
      ).resolves.toMatchObject({ taskId: "task-word-1" });
    } finally {
      notebook.notebook.tasks.pop();
    }
  });

  it("RS-04: o segundo envio devolve 409 RESULT_ALREADY_EXISTS e não duplica", async () => {
    const session = await newSession();
    await submitActivityResult(body(session.id));

    await expect(submitActivityResult(body(session.id))).rejects.toMatchObject({
      status: 409,
      code: "RESULT_ALREADY_EXISTS",
    });

    const listed = (await listSessionsByStudent("student-1")).find(
      (item) => item.id === session.id,
    );
    expect(listed?.activityResults).toHaveLength(1);
  });

  it("RS-01: depois do encerramento devolve 409 SESSION_ALREADY_FINISHED", async () => {
    const session = await newSession();
    await finishSession({ sessionId: session.id });

    await expect(submitActivityResult(body(session.id))).rejects.toMatchObject({
      status: 409,
      code: "SESSION_ALREADY_FINISHED",
    });
  });

  it("RS-01: sessão inexistente devolve 404 SESSION_NOT_FOUND", async () => {
    await expect(
      submitActivityResult(body("nao-existe")),
    ).rejects.toMatchObject({ status: 404, code: "SESSION_NOT_FOUND" });
  });

  it("RS-02: tarefa fora do caderno da sessão devolve 400 TASK_NOT_IN_NOTEBOOK", async () => {
    const session = await newSession("notebook-1");

    await expect(submitActivityResult(body(session.id))).rejects.toMatchObject({
      status: 400,
      code: "TASK_NOT_IN_NOTEBOOK",
    });
  });

  it("RS-03: múltipla escolha vai para a rota de resposta (USE_ANSWER_ROUTE)", async () => {
    const session = await newSession();

    await expect(
      submitActivityResult(body(session.id, { taskId: "task-1" })),
    ).rejects.toMatchObject({ status: 400, code: "USE_ANSWER_ROUTE" });
  });

  it("RS-03: imprimível não é jogável (PRINTABLE_NOT_PLAYABLE)", async () => {
    const session = await newSession();

    await expect(
      submitActivityResult(body(session.id, { taskId: "task-print-1" })),
    ).rejects.toMatchObject({ status: 400, code: "PRINTABLE_NOT_PLAYABLE" });
  });

  it("valida o corpo: tentativas de 1 a 50, erros de 0 a 50, duração até 3 600 000", async () => {
    const session = await newSession();

    for (const invalid of [
      { attempts: 0 },
      { attempts: 51 },
      { errors: -1 },
      { errors: 51 },
      { durationMs: 3_600_001 },
      { durationMs: -1 },
    ]) {
      await expect(
        submitActivityResult(body(session.id, invalid)),
      ).rejects.toMatchObject({ status: 400 });
    }
  });

  it("simula falha de rede pelo cenário manual", async () => {
    const session = await newSession();
    setMockActivityResultScenario("network-error");

    await expect(submitActivityResult(body(session.id))).rejects.toMatchObject({
      isNetworkError: true,
    });

    setMockActivityResultScenario("success");
    await expect(submitActivityResult(body(session.id))).resolves.toBeTruthy();
  });

  it("G-65 / RS-05: o resultado não entra no acerto da análise do paciente", async () => {
    setMockSessionAnswerScenario("success");
    const before = await getStudentAnalysis("student-1");
    const session = await newSession();
    await submitActivityResult(body(session.id, { correct: true, errors: 0 }));

    const after = await getStudentAnalysis("student-1");

    expect(after.total).toEqual(before.total);
    expect(after.categories).toEqual(before.categories);
  });
});
