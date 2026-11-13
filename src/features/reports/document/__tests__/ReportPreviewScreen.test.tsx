import { describe, expect, it, vi } from "vitest";

import type { Report } from "@/api/types";
import { render, screen, waitFor } from "@/test-utils/render";

const { getReport } = vi.hoisted(() => ({ getReport: vi.fn() }));

vi.mock("@/api/endpoints/reports", () => ({
  getReport,
  shareReport: vi.fn(),
  reportQueryKeys: {
    all: ["reports"],
    detail: (id: string) => ["reports", id],
  },
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("../pdf", () => ({
  printReport: vi.fn(),
  shareReportPdf: vi.fn(),
}));

const { ReportPreviewScreen } = await import("../ReportPreviewScreen");

const report = {
  id: "r1",
  studentId: "s1",
  studentName: "Ana",
  educatorId: "e1",
  type: "PROGRESS",
  audience: "FAMILY",
  period: { from: "2026-11-01", to: "2026-11-30" },
  sections: ["EVOLUTIONS"],
  content: {
    title: "Relatório de progresso",
    generatedAt: "2026-11-13T10:00:00Z",
    professional: { name: "Dra. Bia" },
    evolutions: [
      {
        sessionDate: "2026-11-13",
        achieved: 1,
        total: 2,
        record: "Primeira evolução do dia",
      },
      {
        sessionDate: "2026-11-13",
        achieved: 2,
        total: 2,
        record: "Segunda evolução do dia",
      },
    ],
  },
  synthesisFailed: false,
  createdAt: "2026-11-13T10:00:00Z",
  shares: [],
} as unknown as Report;

describe("ReportPreviewScreen", () => {
  it("mostra duas evoluções na mesma data e sem plano, sem chave duplicada", async () => {
    getReport.mockResolvedValue(report);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await render(<ReportPreviewScreen reportId="r1" />);

    await waitFor(() =>
      expect(screen.getByText("Primeira evolução do dia")).toBeTruthy(),
    );
    expect(screen.getByText("Segunda evolução do dia")).toBeTruthy();
    const duplicateKey = errorSpy.mock.calls.some((call) =>
      String(call[0]).includes("same key"),
    );
    expect(duplicateKey).toBe(false);
    errorSpy.mockRestore();
  });
});
