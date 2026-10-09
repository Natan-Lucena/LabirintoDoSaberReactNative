import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  addSessionObservation,
  finishSession,
  listSessionsByStudent,
  startSession,
} from "@/api/endpoints/session";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/session-analysis";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("handlers de encerramento e observação da sessão", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("rejeita a observação de uma sessão ainda não finalizada", async () => {
    const session = await startSession({
      studentId: "student-1",
      name: "Sessão de teste",
    });

    await expect(
      addSessionObservation({ sessionId: session.id, observation: "Texto" }),
    ).rejects.toThrow("SESSION_NOT_FINISHED");
  });

  it("finaliza e registra a observação, visível na listagem do paciente", async () => {
    const session = await startSession({
      studentId: "student-1",
      name: "Sessão com registro",
    });

    const finished = await finishSession({ sessionId: session.id });
    expect(finished.finishedAt).toBeTruthy();

    const withObservation = await addSessionObservation({
      sessionId: session.id,
      observation: "Boa participação.",
    });
    expect(withObservation.observation).toBe("Boa participação.");

    const listed = (await listSessionsByStudent("student-1")).find(
      (item) => item.id === session.id,
    );
    expect(listed?.observation).toBe("Boa participação.");
  });

  it("devolve SESSION_ALREADY_FINISHED ao encerrar duas vezes", async () => {
    const session = await startSession({
      studentId: "student-1",
      name: "Sessão duplicada",
    });
    await finishSession({ sessionId: session.id });

    await expect(finishSession({ sessionId: session.id })).rejects.toThrow(
      "SESSION_ALREADY_FINISHED",
    );
  });

  it("valida o corpo da observação e a sessão inexistente", async () => {
    await expect(
      addSessionObservation({ sessionId: "inexistente", observation: "x" }),
    ).rejects.toThrow("SESSION_NOT_FOUND");
    await expect(
      addSessionObservation({ sessionId: "inexistente", observation: "" }),
    ).rejects.toThrow("Validation error");
  });
});
