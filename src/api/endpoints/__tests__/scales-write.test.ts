import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  completeScaleApplication,
  createScaleApplication,
  deleteScaleApplication,
  generateScaleInsight,
  ScaleIncompleteError,
  getScaleApplication,
  getScaleTemplate,
  saveScaleAnswers,
  ScaleApiError,
} from "@/api/endpoints/scales";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_SCALE_APPLICATION_COMPLETED_ID,
  MOCK_SCALE_APPLICATION_DRAFT_ID,
  MOCK_SCALE_INACTIVE_TEMPLATE_ID,
  MOCK_SCALE_TEMPLATE_ID,
  resetMockScaleState,
} from "@/mocks/handlers/scales";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("escrita das escalas pelo apiClient (AVA-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockScaleState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockScaleState();
  });

  it("cria o rascunho vazio de uma escala para o paciente", async () => {
    const application = await createScaleApplication({
      studentId: "student-1",
      templateId: MOCK_SCALE_TEMPLATE_ID,
    });

    expect(application).toMatchObject({
      templateId: MOCK_SCALE_TEMPLATE_ID,
      studentId: "student-1",
      status: "DRAFT",
      answers: [],
    });
    expect(application.score).toMatchObject({ partial: true, answered: 0 });
  });

  it("DRAFT_ALREADY_EXISTS (resposta 409) vira ScaleApiError com o applicationId", async () => {
    const error = await createScaleApplication({
      studentId: "student-2",
      templateId: MOCK_SCALE_TEMPLATE_ID,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ScaleApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "DRAFT_ALREADY_EXISTS",
      applicationId: MOCK_SCALE_APPLICATION_DRAFT_ID,
      message:
        "Já existe um rascunho desta escala para este paciente. Retome o rascunho.",
    });
  });

  it("outro 409 recebido como resposta segue normalizeApiError, com a mensagem traduzida", async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: { message: "SCALE_INACTIVE" },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config,
    });

    const error = await createScaleApplication({
      studentId: "student-1",
      templateId: MOCK_SCALE_INACTIVE_TEMPLATE_ID,
    }).catch((caught: unknown) => caught);

    expect(error).not.toBeInstanceOf(ScaleApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "SCALE_INACTIVE",
      message: "Esta escala não está mais disponível para novas aplicações.",
    });
  });

  it("propaga erros de negócio lançados pelo adaptador, com mensagem traduzida", async () => {
    await expect(
      createScaleApplication({
        studentId: "student-1",
        templateId: MOCK_SCALE_INACTIVE_TEMPLATE_ID,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "SCALE_INACTIVE",
      message: "Esta escala não está mais disponível para novas aplicações.",
    });
    await expect(
      createScaleApplication({
        studentId: "nao-existe",
        templateId: MOCK_SCALE_TEMPLATE_ID,
      }),
    ).rejects.toMatchObject({ status: 404, code: "STUDENT_NOT_FOUND" });
  });

  it("grava respostas e devolve a aplicação com o escore recalculado pelo servidor", async () => {
    const template = await getScaleTemplate(MOCK_SCALE_TEMPLATE_ID);
    const application = await createScaleApplication({
      studentId: "student-1",
      templateId: MOCK_SCALE_TEMPLATE_ID,
    });

    const saved = await saveScaleAnswers(application.id, [
      { itemId: template.items[0]!.id, value: 2 },
    ]);

    expect(saved.answers).toEqual([
      { itemId: template.items[0]!.id, value: 2 },
    ]);
    expect(saved.score).toMatchObject({ partial: true, answered: 1, value: 2 });
    const reloaded = await getScaleApplication(application.id);
    expect(reloaded.answers).toEqual(saved.answers);
  });

  it("regravar o mesmo item troca o valor (upsert por itemId)", async () => {
    const template = await getScaleTemplate(MOCK_SCALE_TEMPLATE_ID);
    const itemId = template.items[0]!.id;

    const saved = await saveScaleAnswers(MOCK_SCALE_APPLICATION_DRAFT_ID, [
      { itemId, value: 0 },
    ]);

    expect(saved.answers.filter((a) => a.itemId === itemId)).toEqual([
      { itemId, value: 0 },
    ]);
    expect(saved.score.answered).toBe(3);
  });

  it("traduz os erros de gravação pelo code", async () => {
    await expect(
      saveScaleAnswers(MOCK_SCALE_APPLICATION_DRAFT_ID, [
        { itemId: "fora", value: 1 },
      ]),
    ).rejects.toMatchObject({
      status: 400,
      code: "ITEM_NOT_IN_SCALE",
      message: "Uma das respostas não pertence a esta escala.",
    });
    const template = await getScaleTemplate(MOCK_SCALE_TEMPLATE_ID);
    await expect(
      saveScaleAnswers(MOCK_SCALE_APPLICATION_DRAFT_ID, [
        { itemId: template.items[0]!.id, value: 99 },
      ]),
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_ANSWER_VALUE",
      message: "Uma das respostas tem um valor que a escala não aceita.",
    });
    await expect(
      saveScaleAnswers(MOCK_SCALE_APPLICATION_COMPLETED_ID, [
        { itemId: template.items[0]!.id, value: 1 },
      ]),
    ).rejects.toMatchObject({
      status: 409,
      code: "APPLICATION_NOT_EDITABLE",
      message: "Esta aplicação já foi concluída e não pode ser alterada.",
    });
  });

  it("não repete a requisição sozinha quando falha", async () => {
    const adapter = vi.fn(async () => {
      throw new Error("falha de rede");
    });
    apiClient.defaults.adapter = adapter;

    await expect(
      saveScaleAnswers(MOCK_SCALE_APPLICATION_DRAFT_ID, [
        { itemId: "mock-scale-1-item-1", value: 1 },
      ]),
    ).rejects.toThrow();
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("concluir com itens faltando lança ScaleIncompleteError com os ids", async () => {
    const error = await completeScaleApplication(
      MOCK_SCALE_APPLICATION_DRAFT_ID,
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ScaleIncompleteError);
    expect(
      (error as ScaleIncompleteError).missingItemIds.length,
    ).toBeGreaterThan(0);
  });

  it("gera o insight e descarta um rascunho", async () => {
    const withInsight = await generateScaleInsight(
      MOCK_SCALE_APPLICATION_DRAFT_ID,
    );
    expect(withInsight.insight?.text).toBeTruthy();

    await deleteScaleApplication(MOCK_SCALE_APPLICATION_DRAFT_ID);
    await expect(
      getScaleApplication(MOCK_SCALE_APPLICATION_DRAFT_ID),
    ).rejects.toBeTruthy();
  });
});
