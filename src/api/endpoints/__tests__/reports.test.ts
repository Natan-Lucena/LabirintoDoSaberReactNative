import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  getReport,
  getReportOptions,
  listReports,
  reportQueryKeys,
} from "@/api/endpoints/reports";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_REPORT_FOREIGN_ID,
  MOCK_REPORT_ID,
  resetMockReportState,
} from "@/mocks/handlers/reports";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("leitura dos relatórios pelo apiClient (API-05, leva 3)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockReportState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockReportState();
  });

  it("monta chaves de query estáveis e distintas", () => {
    expect(reportQueryKeys.options()).toEqual(["reports", "options"]);
    expect(reportQueryKeys.list()).toEqual(["reports", "list", {}]);
    expect(reportQueryKeys.detail("r1")).toEqual(["reports", "detail", "r1"]);
    expect(reportQueryKeys.list({ studentId: "a" })).not.toEqual(
      reportQueryKeys.list({ studentId: "b" }),
    );
  });

  it("traz tipos, seções sensíveis fora dos padrões e períodos", async () => {
    const options = await getReportOptions();

    expect(options.types.map((t) => t.type)).toEqual([
      "PROGRESS",
      "ASSESSMENT",
      "PDI_PROGRESS",
    ]);
    const sensitive = options.sections
      .filter((s) => s.sensitive)
      .map((s) => s.section);
    expect(sensitive).toEqual(["ASSESSMENTS", "ANAMNESIS_SUMMARY"]);
    for (const type of options.types) {
      expect(type.defaultSections.some((s) => sensitive.includes(s))).toBe(
        false,
      );
      expect(
        type.defaultSections.every((s) => type.allowedSections.includes(s)),
      ).toBe(true);
    }
    expect(options.periods.length).toBeGreaterThan(0);
    expect(options.maxPeriodDays).toBe(365);
  });

  it("lista só os relatórios próprios, sem content", async () => {
    const list = await listReports();

    expect(list.map((r) => r.id)).toEqual([MOCK_REPORT_ID]);
    expect(list[0]).not.toHaveProperty("content");
  });

  it("filtra por paciente e rejeita limite inválido e paciente alheio", async () => {
    expect(await listReports({ studentId: "student-2" })).toEqual([]);
    await expect(listReports({ limit: 0 })).rejects.toMatchObject({
      status: 400,
    });
    await expect(listReports({ studentId: "student-x" })).rejects.toMatchObject(
      { status: 404, code: "STUDENT_NOT_FOUND" },
    );
  });

  it("reabre o relatório com o conteúdo gravado", async () => {
    const report = await getReport(MOCK_REPORT_ID);

    expect(report.id).toBe(MOCK_REPORT_ID);
    expect(report.content.patient?.displayName).toBe(report.studentName);
    expect(report.content.synthesis).toBeTruthy();
  });

  it("devolve 404 e 403 traduzidos", async () => {
    await expect(getReport("nao-existe")).rejects.toMatchObject({
      status: 404,
      code: "REPORT_NOT_FOUND",
      message: "Relatório não encontrado.",
    });
    await expect(getReport(MOCK_REPORT_FOREIGN_ID)).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });
  });
});
