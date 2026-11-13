import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  getScaleApplication,
  getScaleTemplate,
  listScaleApplications,
  listScaleTemplates,
  scaleQueryKeys,
} from "@/api/endpoints/scales";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_SCALE_APPLICATION_COMPLETED_ID,
  MOCK_SCALE_APPLICATION_DRAFT_ID,
  MOCK_SCALE_APPLICATION_FOREIGN_ID,
  MOCK_SCALE_TEMPLATE_ID,
  resetMockScaleState,
} from "@/mocks/handlers/scales";
import { MOCK_FOREIGN_STUDENT_ID } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("leitura das escalas pelo apiClient (API-05, leva 2)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockScaleState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockScaleState();
  });

  it("monta chaves de query estáveis e distintas", () => {
    expect(scaleQueryKeys.all).toEqual(["scales"]);
    expect(scaleQueryKeys.templates()).toEqual(["scales", "templates"]);
    expect(scaleQueryKeys.template("t1")).toEqual(["scales", "template", "t1"]);
    expect(scaleQueryKeys.application("a1")).toEqual([
      "scales",
      "application",
      "a1",
    ]);
    expect(scaleQueryKeys.applications()).toEqual([
      "scales",
      "applications",
      {},
    ]);
    expect(scaleQueryKeys.applications({ status: "DRAFT" })).not.toEqual(
      scaleQueryKeys.applications({ status: "COMPLETED" }),
    );
  });

  it("lista o catálogo sem itens e com itemCount", async () => {
    const templates = await listScaleTemplates();

    expect(templates.length).toBeGreaterThanOrEqual(1);
    const scale = templates.find((item) => item.id === MOCK_SCALE_TEMPLATE_ID)!;
    expect(scale).toMatchObject({ itemCount: 6, version: 2 });
    expect(scale).not.toHaveProperty("items");
    // Só as ativas vêm no catálogo e o resumo não traz `active`.
    expect(scale).not.toHaveProperty("active");
    expect(templates.some((item) => item.id === "mock-scale-inactive")).toBe(
      false,
    );
  });

  it("lê uma escala com itens, opções, faixas, aviso e referência", async () => {
    const template = await getScaleTemplate(MOCK_SCALE_TEMPLATE_ID);

    expect(template.items).toHaveLength(6);
    expect(template.options.map((option) => option.label)).toEqual([
      "Nunca",
      "Às vezes",
      "Frequentemente",
      "Muito",
    ]);
    expect(template.scoring.bands.length).toBeGreaterThan(0);
    expect(template.disclaimer).toMatch(/não substitui/i);
    expect(template.reference).toBeTruthy();
  });

  it("escala inexistente responde 404 SCALE_NOT_FOUND", async () => {
    await expect(getScaleTemplate("nao-existe")).rejects.toMatchObject({
      status: 404,
      code: "SCALE_NOT_FOUND",
    });
  });

  it("lista as aplicações do educador, mais recente primeiro e sem answers", async () => {
    const list = await listScaleApplications();

    expect(list.map((item) => item.id)).toEqual([
      MOCK_SCALE_APPLICATION_DRAFT_ID,
      MOCK_SCALE_APPLICATION_COMPLETED_ID,
    ]);
    expect(list[0]).not.toHaveProperty("answers");
    expect(list.some((item) => item.educatorId !== "mock-educator-1")).toBe(
      false,
    );
  });

  it("filtra por paciente, por status e limita", async () => {
    expect(
      (await listScaleApplications({ studentId: "student-1" })).map(
        (item) => item.id,
      ),
    ).toEqual([MOCK_SCALE_APPLICATION_COMPLETED_ID]);
    expect(
      (await listScaleApplications({ status: "DRAFT" })).map((item) => item.id),
    ).toEqual([MOCK_SCALE_APPLICATION_DRAFT_ID]);
    expect(await listScaleApplications({ limit: 1 })).toHaveLength(1);
  });

  it("filtro inválido responde 400 e paciente alheio 403", async () => {
    await expect(listScaleApplications({ limit: 0 })).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      listScaleApplications({ status: "OUTRO" as "DRAFT" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      listScaleApplications({ studentId: MOCK_FOREIGN_STUDENT_ID }),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
  });

  it("lê uma aplicação com respostas, escore e aviso", async () => {
    const application = await getScaleApplication(
      MOCK_SCALE_APPLICATION_DRAFT_ID,
    );

    expect(application.answers).toHaveLength(3);
    expect(application.score).toMatchObject({
      partial: true,
      answered: 3,
      total: 6,
    });
    expect(application.disclaimer).toMatch(/não substitui/i);
  });

  it("aplicação inexistente responde 404 e a de outro educador 403", async () => {
    await expect(getScaleApplication("nao-existe")).rejects.toMatchObject({
      status: 404,
      code: "APPLICATION_NOT_FOUND",
    });
    await expect(
      getScaleApplication(MOCK_SCALE_APPLICATION_FOREIGN_ID),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
  });
});
