import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import {
  resetMockAnamneseSummaryState,
  setMockAnamneseSummaryFailure,
} from "@/mocks/handlers/anamnese-summary";
import { MOCK_ANAMNESE_RESPONSES } from "@/mocks/handlers/anamnese-responses";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

interface Reply {
  status: number;
  data: any;
}

async function send(
  method: "get" | "post" | "put",
  url: string,
  body?: unknown,
): Promise<Reply> {
  try {
    const response = await apiClient.request({ method, url, data: body });
    return { status: response.status, data: response.data };
  } catch (error) {
    const apiError = error as { status?: number; code?: string };
    return { status: apiError.status ?? 0, data: { message: apiError.code } };
  }
}

const SUMMARY = "/anamnese/responses/response-1/summary";
const originalAnswers = structuredClone(MOCK_ANAMNESE_RESPONSES[0]!.answers);

describe("mocks da síntese da anamnese (API-05, leva 2)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockAnamneseSummaryState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    MOCK_ANAMNESE_RESPONSES[0]!.answers = structuredClone(originalAnswers);
    delete MOCK_ANAMNESE_RESPONSES[0]!.updatedAt;
    resetMockAnamneseSummaryState();
  });

  it("sem síntese gerada, a leitura não traz summary nem summaryOutdated", async () => {
    const one = await send("get", "/anamnese/responses/response-1");
    const list = await send("get", "/anamnese/responses/student/student-1");

    expect(one.status).toBe(200);
    expect(one.data).not.toHaveProperty("summary");
    expect(one.data).not.toHaveProperty("summaryOutdated");
    expect(list.data[0]).not.toHaveProperty("summary");
  });

  it("gera, persiste e passa a vir na leitura e na lista por aluno (AS-01, AS-02)", async () => {
    const generated = await send("post", SUMMARY);

    expect(generated.status).toBe(200);
    expect(generated.data.id).toBe("response-1");
    expect(generated.data.summaryOutdated).toBe(false);
    expect(generated.data.summary.text.length).toBeLessThanOrEqual(1500);
    expect(generated.data.summary.text).toMatch(/sem diagnóstico/i);
    expect(generated.data.summary.generatedAt).toBeTruthy();

    const one = await send("get", "/anamnese/responses/response-1");
    const list = await send("get", "/anamnese/responses/student/student-1");
    expect(one.data.summary).toEqual(generated.data.summary);
    expect(one.data.summaryOutdated).toBe(false);
    expect(list.data[0].summary).toEqual(generated.data.summary);
  });

  it("editar a resposta depois da síntese marca summaryOutdated; gerar de novo zera", async () => {
    await send("post", SUMMARY);

    const edited = await send("put", "/anamnese/responses/response-1", {
      answers: [
        {
          questionId: "question-1",
          questionType: "Descriptive",
          textValue: "Texto novo da resposta.",
        },
      ],
    });
    expect(edited.status).toBe(200);
    expect(edited.data.summaryOutdated).toBe(true);
    expect(
      (await send("get", "/anamnese/responses/response-1")).data
        .summaryOutdated,
    ).toBe(true);

    const regenerated = await send("post", SUMMARY);
    expect(regenerated.data.summaryOutdated).toBe(false);
  });

  it("a edição sem síntese continua igual à de antes (sem campos novos)", async () => {
    const edited = await send("put", "/anamnese/responses/response-1", {
      answers: [
        {
          questionId: "question-1",
          questionType: "Descriptive",
          textValue: "Outra resposta.",
        },
      ],
    });

    expect(edited.status).toBe(200);
    expect(edited.data).not.toHaveProperty("summary");
    expect(edited.data).not.toHaveProperty("summaryOutdated");
  });

  it("responde 404 RESPONSE_NOT_FOUND e 403 UNAUTHORIZED para resposta alheia", async () => {
    expect(
      await send("post", "/anamnese/responses/nao-existe/summary"),
    ).toMatchObject({ status: 404, data: { message: "RESPONSE_NOT_FOUND" } });
    expect(
      await send("post", "/anamnese/responses/response-other/summary"),
    ).toMatchObject({ status: 403, data: { message: "UNAUTHORIZED" } });
  });

  it.each(["AI_GENERATION_FAILED", "AI_INVALID_OUTPUT"] as const)(
    "simula a falha %s com 500 e não persiste síntese",
    async (code) => {
      setMockAnamneseSummaryFailure(code);

      const reply = await send("post", SUMMARY);

      expect(reply).toMatchObject({ status: 500, data: { message: code } });
      expect(
        (await send("get", "/anamnese/responses/response-1")).data,
      ).not.toHaveProperty("summary");
    },
  );
});
