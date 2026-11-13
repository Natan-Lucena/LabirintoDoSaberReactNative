import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import {
  createReport,
  getReport,
  getReportOptions,
  shareReport,
} from "@/api/endpoints/reports";
import { normalizeApiError } from "@/api/errors";
import {
  allowedSectionsFor,
  defaultSectionsFor,
} from "@/features/reports/configure/reportConfig";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_REPORT_EMPTY_STUDENT_ID,
  MOCK_REPORT_ID,
  resetMockReportState,
} from "@/mocks/handlers/reports";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("escrita dos relatórios (REL-01, REL-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockReportState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockReportState();
  });

  it("AC-REL-01-02: as seções permitidas mudam com o tipo e as sensíveis saem para família", async () => {
    const options = await getReportOptions();
    const types = options.types.map((item) => item.type);
    const sets = types.map((type) => allowedSectionsFor(options, type));

    expect(new Set(sets.map((s) => s.join())).size).toBeGreaterThan(1);

    const sensitive = options.sections
      .filter((item) => item.sensitive)
      .map((item) => item.section);
    const family = defaultSectionsFor(options, types[0]!, "FAMILY");
    const professional = defaultSectionsFor(options, types[0]!, "PROFESSIONAL");

    for (const section of sensitive) {
      expect(family).not.toContain(section);
    }
    expect(professional.length).toBeGreaterThanOrEqual(family.length);
  });

  it("AC-REL-01-03: período sem dados e seção fora do tipo viram mensagens", async () => {
    const options = await getReportOptions();
    const progress = options.types[0]!;
    const base = {
      studentId: MOCK_REPORT_EMPTY_STUDENT_ID,
      type: progress.type,
      audience: "PROFESSIONAL" as const,
      period: { from: "2026-10-01", to: "2026-10-31" },
      sections: progress.allowedSections,
    };

    const notAllowed = options.sections
      .map((item) => item.section)
      .find((section) => !progress.allowedSections.includes(section));
    if (notAllowed) {
      const error = await createReport({
        ...base,
        sections: [notAllowed],
      }).then(
        () => null,
        (cause: unknown) => normalizeApiError(cause),
      );
      expect(error?.message).toMatch(/seções escolhidas/);
    }

    const spy = vi.spyOn(apiClient, "post");
    const empty = await createReport(base).then(
      () => null,
      (cause: unknown) => normalizeApiError(cause),
    );
    expect(empty?.message).toMatch(/Não há dados/);
    expect(spy).toHaveBeenCalledWith("/report/", base, {
      timeout: AI_TIMEOUT_MS,
    });
  });

  it("shareReport registra o canal no relatório", async () => {
    const report = await shareReport(MOCK_REPORT_ID, { channel: "PRINT" });

    expect(report.shares.at(-1)?.channel).toBe("PRINT");
    expect((await getReport(MOCK_REPORT_ID)).shares.length).toBe(
      report.shares.length,
    );
  });
});
