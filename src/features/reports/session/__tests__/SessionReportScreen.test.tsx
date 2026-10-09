import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionReport } from "@/api/endpoints/session-report";
import type { ApiError } from "@/api/errors";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerBack = vi.fn();
const printAsync = vi.fn();
const printToFileAsync = vi.fn(async () => ({ uri: "file://report.pdf" }));
const shareAsync = vi.fn();
let query: QueryState;

interface QueryState {
  data?: SessionReport;
  error?: ApiError;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack }),
}));
vi.mock("expo-print", () => ({ printAsync, printToFileAsync }));
vi.mock("expo-sharing", () => ({ shareAsync }));
vi.mock("@/features/reports/session/useSessionReport", () => ({
  useSessionReport: () => query,
}));

const { SessionReportScreen } =
  await import("@/features/reports/session/SessionReportScreen");

const report: SessionReport = {
  sessionName: "Leitura inicial",
  totalTimeSession: 125,
  totalQuestions: 4,
  averageTimePerQuestion: 31,
  averageCorrectTime: null,
  averageIncorrectTime: null,
  percentageByCategory: { reading: 75, writing: null },
  percentageByType: { multipleChoice: 75 },
  observation: null,
};

describe("SessionReportScreen (REL-04)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    printAsync.mockClear();
    printToFileAsync.mockClear();
    shareAsync.mockClear();
    query = {
      data: report,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    };
  });

  it("mostra métricas, nulos e observação conforme o contrato", async () => {
    await render(<SessionReportScreen sessionId="mock-session-1" />);

    expect(screen.getByText("4 questões respondidas")).toBeTruthy();
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getByText("Sem registro")).toBeTruthy();
    expect(screen.getByLabelText("Leitura: 75%")).toBeTruthy();
  });

  it("imprime e compartilha o PDF a partir do mesmo relatório", async () => {
    await render(<SessionReportScreen sessionId="mock-session-1" />);

    await fireEvent.press(screen.getByRole("button", { name: "Imprimir" }));
    await fireEvent.press(screen.getByRole("button", { name: "Enviar" }));

    expect(printAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Leitura inicial"),
      }),
    );
    expect(printToFileAsync).toHaveBeenCalledTimes(1);
    expect(shareAsync).toHaveBeenCalledWith("file://report.pdf", {
      mimeType: "application/pdf",
    });
  });

  it("mostra erro recuperável e o estado de sessão ausente", async () => {
    const refetch = vi.fn();
    query = { isPending: false, isError: true, refetch };
    const error = await render(
      <SessionReportScreen sessionId="mock-session-1" />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
    error.unmount();

    query = {
      isPending: false,
      isError: true,
      error: { status: 404, code: "SESSION_NOT_FOUND" } as ApiError,
      refetch: vi.fn(),
    };
    await render(<SessionReportScreen sessionId="session-not-found" />);
    expect(screen.getByText("Sessão não encontrada")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledTimes(1);
  });
});
