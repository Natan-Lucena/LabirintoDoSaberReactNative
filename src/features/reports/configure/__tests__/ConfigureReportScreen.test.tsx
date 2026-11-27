import { describe, expect, it, vi } from "vitest";

import type { ReportOptions } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const OPTIONS: ReportOptions = {
  types: [
    {
      type: "PROGRESS",
      label: "Progresso",
      description: "Resumo do progresso.",
      allowedSections: ["EVOLUTIONS"],
      defaultSections: ["EVOLUTIONS"],
    },
  ],
  sections: [{ section: "EVOLUTIONS", label: "Evoluções", sensitive: false }],
  audiences: [
    { audience: "PROFESSIONAL", label: "Profissional" },
    { audience: "SCHOOL", label: "Escola" },
  ],
  periods: [{ key: "30d", label: "Últimos 30 dias", days: 30 }],
  maxPeriodDays: 365,
} as unknown as ReportOptions;

vi.mock("@/api/endpoints/reports", () => ({
  createReport: vi.fn(),
  getReportOptions: vi.fn().mockResolvedValue(OPTIONS),
  reportQueryKeys: {
    all: ["reports"],
    options: () => ["reports", "options"],
  },
}));
vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({ data: [] }),
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  useLocalSearchParams: () => ({}),
}));

const { ConfigureReportScreen } = await import("../ConfigureReportScreen");

const SCHOOL_NOTICE =
  "Textos livres (evoluções, observações) vão como foram escritos; revise antes de enviar.";

describe("ConfigureReportScreen: aviso para a escola (D-07)", () => {
  it("só aparece quando o destinatário é a escola", async () => {
    await render(<ConfigureReportScreen />);
    await waitFor(() =>
      expect(screen.getByLabelText("Destinatário")).toBeTruthy(),
    );
    expect(screen.queryByText(SCHOOL_NOTICE)).toBeNull();

    await fireEvent.press(screen.getByLabelText("Destinatário"));
    await fireEvent.press(screen.getByLabelText("Escola"));

    await waitFor(() => expect(screen.getByText(SCHOOL_NOTICE)).toBeTruthy());
  });
});
