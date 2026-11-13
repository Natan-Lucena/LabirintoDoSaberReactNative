import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_NOTIFICATION_IDS,
  resetMockNotificationState,
} from "@/mocks/handlers/notifications";
import {
  MOCK_REPORT_EMPTY_STUDENT_ID,
  MOCK_REPORT_FOREIGN_ID,
  MOCK_REPORT_ID,
  resetMockReportState,
  setMockReportSynthesisFailure,
} from "@/mocks/handlers/reports";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

interface Reply {
  status: number;
  data: any;
}

async function send(
  method: "get" | "post" | "put" | "delete",
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

const payload = (overrides: Record<string, unknown> = {}) => ({
  studentId: "student-1",
  type: "PROGRESS",
  audience: "FAMILY",
  period: { from: "2026-10-01", to: "2026-10-31" },
  sections: ["PATIENT_DATA", "SESSION_METRICS", "AI_SYNTHESIS"],
  ...overrides,
});

describe("mocks dos relatórios (API-05, leva 3)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockReportState();
    resetMockNotificationState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("gera o relatório com retrato do conteúdo e sem dados sigilosos (RP-01, RP-03)", async () => {
    const created = await send("post", "/report/", payload());
    expect(created.status).toBe(201);
    expect(created.data.content.patient.displayName).toBe(
      created.data.studentName,
    );
    expect(created.data.content.synthesis).toBeTruthy();
    expect(created.data.content.evolutions).toBeUndefined();
    const text = JSON.stringify(created.data.content);
    expect(text).not.toMatch(/11999990000|Rua Ficticia|01000-000/);

    const reopened = await send("get", `/report/${created.data.id}`);
    expect(reopened.data.content).toEqual(created.data.content);
  });

  it("valida: seção fora do tipo, período vazio e período inválido (RP-04, RP-05)", async () => {
    const section = await send(
      "post",
      "/report/",
      payload({ sections: ["ASSESSMENTS"] }),
    );
    expect(section).toMatchObject({
      status: 400,
      data: { message: "SECTION_NOT_ALLOWED" },
    });

    const empty = await send(
      "post",
      "/report/",
      payload({ studentId: MOCK_REPORT_EMPTY_STUDENT_ID }),
    );
    expect(empty).toMatchObject({
      status: 400,
      data: { message: "REPORT_EMPTY_PERIOD" },
    });

    for (const period of [
      { from: "2026-10-31", to: "2026-10-01" },
      { from: "2025-01-01", to: "2026-10-01" },
    ])
      expect(
        (await send("post", "/report/", payload({ period }))).data.message,
      ).toBe("INVALID_PERIOD");

    // Só PATIENT_DATA e AI_SYNTHESIS não contam como dado (RP-05).
    const onlyFree = await send(
      "post",
      "/report/",
      payload({ sections: ["PATIENT_DATA", "AI_SYNTHESIS"] }),
    );
    expect(onlyFree.data.message).toBe("REPORT_EMPTY_PERIOD");
    // A anamnese vale independente do período.
    const anamnesis = await send(
      "post",
      "/report/",
      payload({
        type: "ASSESSMENT",
        period: { from: "2025-01-01", to: "2025-02-01" },
        sections: ["ANAMNESIS_SUMMARY"],
      }),
    );
    expect(anamnesis.status).toBe(201);
    expect(
      (await send("post", "/report/", payload({ sections: [] }))).status,
    ).toBe(400);
    expect(
      (await send("post", "/report/", payload({ studentId: "student-x" }))).data
        .message,
    ).toBe("STUDENT_NOT_FOUND");
  });

  it("cria sem síntese e com synthesisFailed quando a IA falha (RP-06)", async () => {
    setMockReportSynthesisFailure(true);
    const created = await send("post", "/report/", payload());

    expect(created.status).toBe(201);
    expect(created.data.synthesisFailed).toBe(true);
    expect(created.data.content.synthesis).toBeUndefined();
    const next = await send("post", "/report/", payload());
    expect(next.data.synthesisFailed).toBe(false);
  });

  it("registra envios e exclui (RP-07, RP-08)", async () => {
    const shared = await send("post", `/report/${MOCK_REPORT_ID}/share`, {
      channel: "PRINT",
    });
    expect(shared.data.shares).toHaveLength(1);
    expect(shared.data.shares[0].channel).toBe("PRINT");
    const history = await send("get", "/report/");
    expect(history.data[0].lastShare.channel).toBe("PRINT");
    expect(history.data[0].shares).toBeUndefined();
    expect(
      (await send("post", `/report/${MOCK_REPORT_ID}/share`, { channel: "X" }))
        .status,
    ).toBe(400);

    expect((await send("delete", `/report/${MOCK_REPORT_ID}`)).status).toBe(
      204,
    );
    expect((await send("get", `/report/${MOCK_REPORT_ID}`)).status).toBe(404);
  });

  it("nega acesso a relatório de outro educador (BE-RP-06)", async () => {
    for (const [method, url] of [
      ["get", `/report/${MOCK_REPORT_FOREIGN_ID}`],
      ["post", `/report/${MOCK_REPORT_FOREIGN_ID}/share`],
      ["delete", `/report/${MOCK_REPORT_FOREIGN_ID}`],
    ] as const)
      expect((await send(method, url, { channel: "SHARE" })).status).toBe(403);
  });
});

describe("mocks das notificações (API-05, leva 3)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockNotificationState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("marcar como lida reduz o contador e é idempotente (BE-NT-03)", async () => {
    const read = await send(
      "post",
      `/notification/${MOCK_NOTIFICATION_IDS.evolutionPending}/read`,
    );
    expect(read.data.readAt).toBeTruthy();
    await send(
      "post",
      `/notification/${MOCK_NOTIFICATION_IDS.evolutionPending}/read`,
    );
    expect((await send("get", "/notification/unread-count")).data.count).toBe(
      3,
    );
    expect(
      (await send("post", "/notification/nao-existe/read")).data.message,
    ).toBe("NOTIFICATION_NOT_FOUND");
  });

  it("marcar todas zera o contador e informa quantas mudaram", async () => {
    expect((await send("post", "/notification/read-all")).data).toEqual({
      updated: 4,
    });
    expect((await send("get", "/notification/unread-count")).data.count).toBe(
      0,
    );
    expect((await send("post", "/notification/read-all")).data.updated).toBe(0);
  });
});
