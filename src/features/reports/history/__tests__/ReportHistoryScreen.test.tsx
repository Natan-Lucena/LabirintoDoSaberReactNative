import { beforeEach, describe, expect, it, vi } from "vitest";
import { Alert } from "react-native";

import type { ReportSummary } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
const listReports = vi.fn();
const deleteReport = vi.fn();

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("../../document/pdf", () => ({ shareReportPdf: vi.fn() }));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn() }),
  useLocalSearchParams: () => ({}),
}));
vi.mock("@/api/endpoints/reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/reports")>()),
  listReports: (...args: unknown[]) => listReports(...args),
  deleteReport: (...args: unknown[]) => deleteReport(...args),
}));

const { ReportHistoryScreen } =
  await import("@/features/reports/history/ReportHistoryScreen");

const summary: ReportSummary = {
  id: "report-1",
  studentId: "student-1",
  studentName: "Maria Souza",
  educatorId: "educator-1",
  type: "PROGRESS",
  audience: "FAMILY",
  period: { from: "2026-10-01", to: "2026-10-31" },
  sections: ["PATIENT_DATA"],
  synthesisFailed: false,
  createdAt: "2026-11-02T10:00:00.000Z",
  lastShare: { channel: "SHARE", at: "2026-11-03T10:00:00.000Z" },
};

describe("ReportHistoryScreen (REL-03)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    listReports.mockReset().mockResolvedValue([summary]);
    deleteReport.mockReset().mockResolvedValue(undefined);
  });

  it("AC-REL-03-01: lista, reabre a prévia e exclui com confirmação", async () => {
    const alert = vi.spyOn(Alert, "alert").mockImplementation(() => {});
    await render(<ReportHistoryScreen />);

    expect(await screen.findByText(/Progresso · Maria Souza/)).toBeTruthy();
    expect(screen.getByText(/Enviado em 03\/11\/2026/)).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Abrir relatório de Maria Souza" }),
    );
    expect(routerPush).toHaveBeenCalledWith("/reports/report-1");

    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir relatório de Maria Souza" }),
    );
    expect(deleteReport).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]![2]!;
    buttons.find((button) => button.text === "Excluir")!.onPress!();

    await vi.waitFor(() =>
      expect(deleteReport.mock.calls[0]![0]).toBe("report-1"),
    );
    alert.mockRestore();
  });
});
