import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { listAnamneseTemplates } from "@/api/endpoints/anamnese";
import { getStudentAiAnalysis } from "@/api/endpoints/session-analysis";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/anamnese";
import { setMockAiAnalysisScenario } from "@/mocks/handlers/session-analysis";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

const SECTIONS = [
  "Visão Geral",
  "Maiores Acertos e Pontos Fortes",
  "Principais Fraquezas e Dificuldades",
  "Observações de Padrões",
  "Pontos de Melhoria",
  "Guia de Intervenção",
  "Considerações Finais",
];

describe("análise psicopedagógica com IA (mock)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockAiAnalysisScenario("success");
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    setMockAiAnalysisScenario("success");
  });

  it("devolve a análise em Markdown com as sete seções do contrato", async () => {
    const result = await getStudentAiAnalysis("student-1", { limit: 6 });

    for (const section of SECTIONS) {
      expect(result.analysis).toContain(`## ${section}`);
    }
  });

  it("aceita templateId para incluir a anamnese", async () => {
    const without = await getStudentAiAnalysis("student-1");
    const withTemplate = await getStudentAiAnalysis("student-1", undefined, {
      templateId: "template-1",
    });

    expect(withTemplate.analysis).not.toBe(without.analysis);
    expect(withTemplate.analysis).toContain("anamnese");
  });

  it("rejeita limit combinado com datas", async () => {
    await expect(
      getStudentAiAnalysis("student-1", {
        limit: 6,
        startDate: "2026-10-01T00:00:00-03:00",
        endDate: "2026-10-02T00:00:00-03:00",
      } as never),
    ).rejects.toThrow("Bad Request");
  });

  it("paciente inexistente devolve STUDENT_NOT_FOUND", async () => {
    await expect(getStudentAiAnalysis("inexistente")).rejects.toThrow(
      "STUDENT_NOT_FOUND",
    );
  });

  it("cenário de falha devolve AI_ANALYSIS_FAILED", async () => {
    setMockAiAnalysisScenario("failure");

    await expect(getStudentAiAnalysis("student-1")).rejects.toThrow(
      "AI_ANALYSIS_FAILED",
    );
  });
});

describe("modelos de anamnese (mock)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("lista os modelos do educador", async () => {
    const templates = await listAnamneseTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        questions: expect.any(Array),
      }),
    );
  });
});
