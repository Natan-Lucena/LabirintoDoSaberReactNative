import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionReport } from "@/api/endpoints/session-report";
import type { ApiError } from "@/api/errors";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerBack = vi.fn();
const printAsync = vi.fn();
const printToFileAsync = vi.fn(async () => ({
  uri: "file://print/report.pdf",
  base64: "JVBERi0=",
}));
const shareAsync = vi.fn();
const fileCreate = vi.fn();
const fileWrite = vi.fn();
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
// O arquivo do expo-print não é legível no Expo Go: o PDF é regravado no cache do app.
vi.mock("expo-file-system", () => ({
  Paths: { cache: "file://cache/" },
  File: class {
    uri: string;
    constructor(directory: string, name: string) {
      this.uri = `${directory}${name}`;
    }
    create = fileCreate;
    write = fileWrite;
  },
}));
vi.mock("@/features/reports/session/useSessionReport", () => ({
  useSessionReport: () => query,
}));

const { SessionReportScreen } =
  await import("@/features/reports/session/SessionReportScreen");

const report: SessionReport = {
  sessionName: "Leitura inicial",
  totalTimeSession: 125,
  totalQuestions: 4,
  averageTimePerQuestion: 31000,
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
    expect(screen.getByText("2 min 5 s")).toBeTruthy();
    expect(screen.getByText("31,0 s")).toBeTruthy();
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
    expect(printToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({ base64: true }),
    );
    expect(fileCreate).toHaveBeenCalledWith({ overwrite: true });
    expect(fileWrite).toHaveBeenCalledWith("JVBERi0=", { encoding: "base64" });
    expect(shareAsync).toHaveBeenCalledWith(
      "file://cache/relatorio-sessao.pdf",
      {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      },
    );
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
