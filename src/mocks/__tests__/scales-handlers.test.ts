import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_FOREIGN_STUDENT_ID } from "@/mocks/handlers/plans";
import {
  MOCK_SCALE_APPLICATION_COMPLETED_ID,
  MOCK_SCALE_APPLICATION_DRAFT_ID,
  MOCK_SCALE_APPLICATION_FOREIGN_ID,
  MOCK_SCALE_INACTIVE_TEMPLATE_ID,
  MOCK_SCALE_TEMPLATE_ID,
  resetMockScaleState,
  setMockScaleAiFailure,
} from "@/mocks/handlers/scales";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

interface Reply {
  status: number;
  data: any;
}

/** Normaliza resposta e erro numa só forma: `{ status, data }`. */
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

const item = (order: number): string =>
  `${MOCK_SCALE_TEMPLATE_ID}-item-${order}`;
const answersFor = (values: number[]) =>
  values.map((value, index) => ({ itemId: item(index + 1), value }));

async function startDraft(studentId = "student-3"): Promise<string> {
  const created = await send("post", "/scale-application/", {
    studentId,
    templateId: MOCK_SCALE_TEMPLATE_ID,
  });
  expect(created.status).toBe(201);
  return created.data.id;
}

describe("mocks das escalas (API-05, leva 2)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockScaleState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockScaleState();
  });

  it("resetMockScaleState restaura as aplicações semente e desliga a falha de IA", async () => {
    const id = await startDraft();
    setMockScaleAiFailure("AI_GENERATION_FAILED");

    resetMockScaleState();

    expect((await send("get", `/scale-application/${id}`)).status).toBe(404);
    expect(
      (
        await send(
          "post",
          `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}/insight`,
        )
      ).status,
    ).toBe(200);
  });

  describe("iniciar (AV-02, AV-03)", () => {
    it("cria um rascunho vazio com escore parcial, aviso e versão da escala", async () => {
      const created = await send("post", "/scale-application/", {
        studentId: "student-3",
        templateId: MOCK_SCALE_TEMPLATE_ID,
        appointmentId: "appointment-1",
      });

      expect(created.status).toBe(201);
      expect(created.data).toMatchObject({
        status: "DRAFT",
        templateVersion: 2,
        studentId: "student-3",
        educatorId: "mock-educator-1",
        appointmentId: "appointment-1",
        answers: [],
        score: { partial: true, answered: 0, total: 6, value: 0, max: 18 },
      });
      expect(created.data.score).not.toHaveProperty("band");
      expect(created.data.disclaimer).toMatch(/não substitui/i);
      expect(created.data).not.toHaveProperty("completedAt");
    });

    it("segundo início para o mesmo paciente e escala devolve 409 com o id do rascunho", async () => {
      const first = await startDraft();

      const second = await send("post", "/scale-application/", {
        studentId: "student-3",
        templateId: MOCK_SCALE_TEMPLATE_ID,
      });

      expect(second.status).toBe(409);
      expect(second.data).toEqual({
        message: "DRAFT_ALREADY_EXISTS",
        applicationId: first,
      });
      const seeded = await send("post", "/scale-application/", {
        studentId: "student-2",
        templateId: MOCK_SCALE_TEMPLATE_ID,
      });
      expect(seeded.data.applicationId).toBe(MOCK_SCALE_APPLICATION_DRAFT_ID);
    });

    it("depois de concluir, outro rascunho pode ser iniciado", async () => {
      const first = await startDraft();
      await send("put", `/scale-application/${first}/answers`, {
        answers: answersFor([0, 0, 0, 0, 0, 0]),
      });
      await send("post", `/scale-application/${first}/complete`);

      const again = await send("post", "/scale-application/", {
        studentId: "student-3",
        templateId: MOCK_SCALE_TEMPLATE_ID,
      });

      expect(again.status).toBe(201);
    });

    it.each([
      [{ templateId: MOCK_SCALE_TEMPLATE_ID }, 400, "Validation error"],
      [{ studentId: "student-3" }, 400, "Validation error"],
      [
        {
          studentId: "student-3",
          templateId: MOCK_SCALE_TEMPLATE_ID,
          appointmentId: 5,
        },
        400,
        "Validation error",
      ],
      [
        {
          studentId: MOCK_FOREIGN_STUDENT_ID,
          templateId: MOCK_SCALE_TEMPLATE_ID,
        },
        403,
        "UNAUTHORIZED",
      ],
      [
        { studentId: "nao-existe", templateId: MOCK_SCALE_TEMPLATE_ID },
        404,
        "STUDENT_NOT_FOUND",
      ],
      [
        { studentId: "student-3", templateId: "nao-existe" },
        404,
        "SCALE_NOT_FOUND",
      ],
      [
        { studentId: "student-3", templateId: MOCK_SCALE_INACTIVE_TEMPLATE_ID },
        409,
        "SCALE_INACTIVE",
      ],
    ])("%j responde %i %s", async (body, status, code) => {
      const reply = await send("post", "/scale-application/", body);

      expect(reply.status).toBe(status);
      expect(reply.data.message).toBe(code);
    });
  });

  describe("respostas e escore no servidor (AV-04 a AV-06)", () => {
    it("conserva a versão antiga da escala: mesmo conjunto cai em outra faixa (AV-02)", async () => {
      // Soma 12: a v1 (aplicação semente) diz "moderado"; a v2 diria "alto".
      const old = await send(
        "get",
        `/scale-application/${MOCK_SCALE_APPLICATION_COMPLETED_ID}`,
      );
      expect(old.data).toMatchObject({
        templateVersion: 1,
        status: "COMPLETED",
        score: {
          partial: false,
          value: 12,
          band: { label: "Indicativo moderado", severity: "MODERATE" },
        },
      });

      const id = await startDraft();
      const fresh = await send("put", `/scale-application/${id}/answers`, {
        answers: answersFor([2, 2, 2, 2, 2, 2]),
      });
      expect(fresh.data.score.value).toBe(12);
      expect(fresh.data.score.band).toEqual({
        label: "Indicativo alto",
        severity: "HIGH",
      });
    });

    it("grava parcialmente, calcula a faixa parcial e as subescalas", async () => {
      const id = await startDraft();

      const reply = await send("put", `/scale-application/${id}/answers`, {
        answers: answersFor([3, 3, 3]),
      });

      expect(reply.status).toBe(200);
      expect(reply.data.score).toMatchObject({
        partial: true,
        answered: 3,
        total: 6,
        value: 9,
        max: 18,
        band: { label: "Indicativo moderado", severity: "MODERATE" },
      });
      expect(reply.data.score.subscales).toEqual([
        {
          code: "ATEN",
          name: "Subescala A (exemplo)",
          answered: 3,
          total: 3,
          value: 9,
          max: 9,
          band: { label: "Alto", severity: "HIGH" },
        },
        {
          code: "COMP",
          name: "Subescala B (exemplo)",
          answered: 0,
          total: 3,
          value: 0,
          max: 9,
        },
      ]);
    });

    it("é idempotente e faz upsert por itemId", async () => {
      const id = await startDraft();
      await send("put", `/scale-application/${id}/answers`, {
        answers: answersFor([1, 1]),
      });

      const reply = await send("put", `/scale-application/${id}/answers`, {
        answers: [
          { itemId: item(2), value: 3 },
          { itemId: item(2), value: 3 },
          { itemId: item(3), value: 0 },
        ],
      });

      expect(reply.data.answers).toEqual([
        { itemId: item(1), value: 1 },
        { itemId: item(2), value: 3 },
        { itemId: item(3), value: 0 },
      ]);
      expect(reply.data.score).toMatchObject({ answered: 3, value: 4 });
    });

    it("confere mínimo, máximo e um intermediário concluídos (BE-AV-05)", async () => {
      const cases: [number[], string][] = [
        [[0, 0, 0, 0, 0, 0], "LOW"],
        [[1, 1, 1, 1, 1, 1], "MODERATE"],
        [[3, 3, 3, 3, 3, 3], "HIGH"],
      ];
      for (const [values, severity] of cases) {
        const id = await startDraft();
        await send("put", `/scale-application/${id}/answers`, {
          answers: answersFor(values),
        });
        const done = await send("post", `/scale-application/${id}/complete`);

        expect(done.status).toBe(200);
        expect(done.data.score.band.severity).toBe(severity);
        expect(done.data.score.partial).toBe(false);
        await send("get", `/scale-application/${id}`);
        // Libera o rascunho seguinte do mesmo paciente: a aplicação já está concluída.
      }
    });

    it("rejeita itemId fora da escala e valor fora das opções sem gravar nada", async () => {
      const id = await startDraft();

      const foreignItem = await send(
        "put",
        `/scale-application/${id}/answers`,
        {
          answers: [
            { itemId: item(1), value: 1 },
            { itemId: "item-de-outra-escala", value: 1 },
          ],
        },
      );
      const badValue = await send("put", `/scale-application/${id}/answers`, {
        answers: [{ itemId: item(1), value: 9 }],
      });

      expect(foreignItem).toMatchObject({
        status: 400,
        data: { message: "ITEM_NOT_IN_SCALE" },
      });
      expect(badValue).toMatchObject({
        status: 400,
        data: { message: "INVALID_ANSWER_VALUE" },
      });
      const read = await send("get", `/scale-application/${id}`);
      expect(read.data.answers).toEqual([]);
    });

    it.each([
      [undefined],
      [{ answers: [] }],
      [{ answers: [{ itemId: 1, value: 1 }] }],
      [{ answers: [{ itemId: "x", value: 1.5 }] }],
    ])("corpo %j inválido responde 400 Validation error", async (body) => {
      const id = await startDraft();

      const reply = await send("put", `/scale-application/${id}/answers`, body);

      expect(reply).toMatchObject({
        status: 400,
        data: { message: "Validation error" },
      });
    });
  });

  describe("concluir (AV-07)", () => {
    it("com itens faltando devolve 400 SCALE_INCOMPLETE e os ids que faltam", async () => {
      const id = await startDraft();
      await send("put", `/scale-application/${id}/answers`, {
        answers: answersFor([1, 1, 1, 1]),
      });

      const reply = await send("post", `/scale-application/${id}/complete`);

      expect(reply.status).toBe(400);
      expect(reply.data).toEqual({
        message: "SCALE_INCOMPLETE",
        missingItemIds: [item(5), item(6)],
      });
      expect((await send("get", `/scale-application/${id}`)).data.status).toBe(
        "DRAFT",
      );
    });

    it("completo vira COMPLETED, com faixa definitiva e somente leitura", async () => {
      const id = await startDraft();
      await send("put", `/scale-application/${id}/answers`, {
        answers: answersFor([3, 3, 3, 3, 3, 3]),
      });

      const done = await send("post", `/scale-application/${id}/complete`);

      expect(done.status).toBe(200);
      expect(done.data).toMatchObject({
        status: "COMPLETED",
        score: { partial: false, answered: 6, value: 18 },
      });
      expect(done.data.completedAt).toBeTruthy();

      const edit = await send("put", `/scale-application/${id}/answers`, {
        answers: answersFor([0]),
      });
      const again = await send("post", `/scale-application/${id}/complete`);
      expect(edit).toMatchObject({
        status: 409,
        data: { message: "APPLICATION_NOT_EDITABLE" },
      });
      expect(again).toMatchObject({
        status: 409,
        data: { message: "APPLICATION_NOT_EDITABLE" },
      });
    });
  });

  describe("excluir (AV-08)", () => {
    it("exclui rascunho (204) e a leitura seguinte responde 404", async () => {
      const id = await startDraft();

      const removed = await send("delete", `/scale-application/${id}`);

      expect(removed.status).toBe(204);
      expect((await send("get", `/scale-application/${id}`)).status).toBe(404);
      expect(
        (
          await send("post", "/scale-application/", {
            studentId: "student-3",
            templateId: MOCK_SCALE_TEMPLATE_ID,
          })
        ).status,
      ).toBe(201);
    });

    it("não exclui aplicação concluída", async () => {
      const reply = await send(
        "delete",
        `/scale-application/${MOCK_SCALE_APPLICATION_COMPLETED_ID}`,
      );

      expect(reply).toMatchObject({
        status: 409,
        data: { message: "APPLICATION_NOT_EDITABLE" },
      });
    });
  });

  describe("propriedade e 404 (AV-01)", () => {
    it.each([
      ["get", "", undefined],
      ["put", "/answers", { answers: [{ itemId: "x", value: 1 }] }],
      ["post", "/complete", undefined],
      ["post", "/insight", undefined],
      ["delete", "", undefined],
    ] as const)(
      "%s %s numa aplicação de outro educador responde 403 UNAUTHORIZED",
      async (method, suffix, body) => {
        const reply = await send(
          method,
          `/scale-application/${MOCK_SCALE_APPLICATION_FOREIGN_ID}${suffix}`,
          body,
        );

        expect(reply).toMatchObject({
          status: 403,
          data: { message: "UNAUTHORIZED" },
        });
      },
    );

    it.each([
      ["get", ""],
      ["put", "/answers"],
      ["post", "/complete"],
      ["post", "/insight"],
      ["delete", ""],
    ] as const)(
      "%s %s num id inexistente responde 404 APPLICATION_NOT_FOUND",
      async (method, suffix) => {
        const reply = await send(
          method,
          `/scale-application/nao-existe${suffix}`,
          method === "put"
            ? { answers: [{ itemId: "x", value: 1 }] }
            : undefined,
        );

        expect(reply).toMatchObject({
          status: 404,
          data: { message: "APPLICATION_NOT_FOUND" },
        });
      },
    );
  });

  describe("insight da escala (IN-01 a IN-04)", () => {
    it("em rascunho gera texto preliminar, em português e sem diagnóstico", async () => {
      const reply = await send(
        "post",
        `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}/insight`,
      );

      expect(reply.status).toBe(200);
      expect(reply.data.insight.preliminary).toBe(true);
      expect(reply.data.insight.generatedAt).toBeTruthy();
      expect(reply.data.insight.text.length).toBeLessThanOrEqual(800);
      expect(reply.data.insight.text).toMatch(/sem diagnóstico/i);
      expect(reply.data.answers).toHaveLength(3);
    });

    it("em aplicação concluída vem como definitivo e gerar de novo substitui", async () => {
      const path = `/scale-application/${MOCK_SCALE_APPLICATION_COMPLETED_ID}/insight`;
      const first = await send("post", path);
      expect(first.data.insight.preliminary).toBe(false);

      const second = await send("post", path);

      expect(second.data.insight.text).toBe(first.data.insight.text);
      expect(
        second.data.insight.generatedAt >= first.data.insight.generatedAt,
      ).toBe(true);
    });

    it("persiste e aparece na leitura seguinte", async () => {
      await send(
        "post",
        `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}/insight`,
      );

      const read = await send(
        "get",
        `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}`,
      );

      expect(read.data.insight).toBeDefined();
    });

    it.each(["AI_GENERATION_FAILED", "AI_INVALID_OUTPUT"] as const)(
      "simula a falha %s com 500",
      async (code) => {
        setMockScaleAiFailure(code);

        const reply = await send(
          "post",
          `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}/insight`,
        );

        expect(reply).toMatchObject({ status: 500, data: { message: code } });
        const read = await send(
          "get",
          `/scale-application/${MOCK_SCALE_APPLICATION_DRAFT_ID}`,
        );
        expect(read.data.insight).toBeUndefined();
      },
    );
  });
});
