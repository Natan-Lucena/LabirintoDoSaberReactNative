import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  StudentAnalysis,
  StudentAnalysisReport,
} from "@/api/endpoints/session-analysis";
import {
  createStudentSnapshot,
  getStudentAnalysis,
  listStudentSnapshots,
} from "@/api/endpoints/session-analysis";
import { listStudents } from "@/api/endpoints/student";
import type { Student } from "@/api/types";
import { createQueryClient } from "@/api/query-client";
import { render } from "@/test-utils/render";
import { StudentReportsScreen } from "../StudentReportsScreen";
import { printStudentReport, shareStudentReport } from "../pdf";

vi.mock("expo-router", () => ({ useRouter: () => ({ back: vi.fn() }) }));
vi.mock("@/api/endpoints/student", () => ({ listStudents: vi.fn() }));
vi.mock("@/api/endpoints/session-analysis", () => ({
  getStudentAnalysis: vi.fn(),
  createStudentSnapshot: vi.fn(),
  listStudentSnapshots: vi.fn(),
}));
vi.mock("../pdf", () => ({
  printStudentReport: vi.fn(),
  shareStudentReport: vi.fn(),
}));

const ANA = {
  id: "student-1",
  name: "Ana Souza",
  age: 8,
  gender: "female",
} as Student;

const ANALYSIS: StudentAnalysis = {
  categories: {
    reading: { category: "reading", total: 3, correct: 2, accuracy: 0.666 },
  },
  total: { total: 3, correct: 2, accuracy: 0.666 },
  sessions: [
    {
      id: "session-1",
      studentId: "student-1",
      educatorId: "educator-1",
      name: "Leitura inicial",
      startedAt: "2026-10-01T10:00:00-03:00",
      finishedAt: "2026-10-01T10:25:00-03:00",
      answers: [],
    },
  ],
};

const SNAPSHOT: StudentAnalysisReport = {
  studentId: "student-1",
  limit: 6,
  sessionIds: ["session-1"],
  categories: [],
  totalQuestions: 3,
  totalCorrect: 2,
  accuracy: 0.666,
};

function renderScreen() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });
  return render(<StudentReportsScreen />, { queryClient });
}

async function chooseStudent() {
  await waitFor(() => expect(screen.getByLabelText("Paciente")).toBeTruthy());
  await fireEvent.press(screen.getByLabelText("Paciente"));
  await fireEvent.press(screen.getByLabelText("Ana Souza"));
}

async function generate() {
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: "Gerar síntese" })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listStudents).mockResolvedValue([ANA]);
  vi.mocked(getStudentAnalysis).mockResolvedValue(ANALYSIS);
  vi.mocked(listStudentSnapshots).mockResolvedValue([]);
  vi.mocked(createStudentSnapshot).mockResolvedValue(SNAPSHOT);
});

describe("StudentReportsScreen", () => {
  it("mostra o aviso de privacidade e exige escolher o paciente", async () => {
    await renderScreen();

    expect(screen.getByText(/Relatórios seguros por padrão/)).toBeTruthy();
    await generate();

    expect(screen.getByText("Escolha o paciente.")).toBeTruthy();
    expect(getStudentAnalysis).not.toHaveBeenCalled();
  });

  it("gera a síntese das últimas sessões e mostra acerto geral, por categoria e sessões", async () => {
    await renderScreen();
    await chooseStudent();

    await generate();

    await waitFor(() => expect(screen.getByText("Acerto geral")).toBeTruthy());
    expect(getStudentAnalysis).toHaveBeenCalledWith("student-1", { limit: 6 });
    expect(screen.getByText("67% · 2 de 3 questões")).toBeTruthy();
    expect(screen.getByText("Leitura")).toBeTruthy();
    expect(screen.getByText("Leitura inicial")).toBeTruthy();
  });

  it("AC-REL-05-01: no modo datas não mostra o campo de limite e exige as datas", async () => {
    await renderScreen();
    await chooseStudent();

    await fireEvent.press(screen.getByRole("radio", { name: "Por datas" }));

    expect(screen.queryByLabelText("Quantidade de sessões")).toBeNull();
    expect(screen.getByLabelText("Data inicial")).toBeTruthy();
    expect(screen.getByLabelText("Data final")).toBeTruthy();

    await generate();

    expect(
      screen.getByText("Escolha a data inicial e a data final."),
    ).toBeTruthy();
    expect(getStudentAnalysis).not.toHaveBeenCalled();
  });

  it("valida o número de sessões antes de consultar", async () => {
    await renderScreen();
    await chooseStudent();

    await fireEvent.changeText(
      screen.getByLabelText("Quantidade de sessões"),
      "0",
    );
    await generate();

    expect(
      screen.getByText("Informe um número inteiro de sessões maior que zero."),
    ).toBeTruthy();
    expect(getStudentAnalysis).not.toHaveBeenCalled();
  });

  it("período sem sessões mostra o estado vazio e não oferece exportar", async () => {
    vi.mocked(getStudentAnalysis).mockResolvedValue({
      categories: {},
      total: { total: 0, correct: 0, accuracy: 0 },
      sessions: [],
    });
    await renderScreen();
    await chooseStudent();
    await generate();

    await waitFor(() =>
      expect(screen.getByText("Nenhuma sessão no período.")).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Imprimir" })).toBeNull();
  });

  it("erro na consulta permite tentar novamente", async () => {
    vi.mocked(getStudentAnalysis).mockRejectedValueOnce(new Error("rede"));
    await renderScreen();
    await chooseStudent();
    await generate();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" })),
    );
    await waitFor(() => expect(screen.getByText("Acerto geral")).toBeTruthy());
    expect(getStudentAnalysis).toHaveBeenCalledTimes(2);
  });

  it("AC-REL-05-02: salvar snapshot envia o mesmo filtro e o histórico é atualizado", async () => {
    vi.mocked(listStudentSnapshots)
      .mockResolvedValueOnce([])
      .mockResolvedValue([SNAPSHOT]);
    await renderScreen();
    await chooseStudent();
    await generate();
    await waitFor(() => expect(screen.getByText("Acerto geral")).toBeTruthy());

    expect(screen.getByText("Nenhum snapshot salvo.")).toBeTruthy();

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Salvar snapshot" })),
    );

    await waitFor(() =>
      expect(createStudentSnapshot).toHaveBeenCalledWith("student-1", {
        limit: 6,
      }),
    );
    await waitFor(() =>
      expect(screen.getByText("Últimas 6 sessões")).toBeTruthy(),
    );
    expect(screen.getByText("3 questões · 67% de acerto")).toBeTruthy();
    expect(screen.queryByText("Nenhum snapshot salvo.")).toBeNull();
  });

  it("falha ao salvar o snapshot mostra o erro, sem reenviar sozinho", async () => {
    vi.mocked(createStudentSnapshot).mockRejectedValue(new Error("falha"));
    await renderScreen();
    await chooseStudent();
    await generate();
    await waitFor(() => expect(screen.getByText("Acerto geral")).toBeTruthy());

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Salvar snapshot" })),
    );

    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível salvar o snapshot."),
      ).toBeTruthy(),
    );
    expect(createStudentSnapshot).toHaveBeenCalledTimes(1);
  });

  it("imprime e envia o PDF com paciente, período e análise", async () => {
    await renderScreen();
    await chooseStudent();
    await generate();
    await waitFor(() => expect(screen.getByText("Acerto geral")).toBeTruthy());

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Imprimir" })),
    );
    expect(printStudentReport).toHaveBeenCalledWith({
      studentName: "Ana Souza",
      periodLabel: "Últimas 6 sessões",
      analysis: ANALYSIS,
    });

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Enviar" })),
    );
    expect(shareStudentReport).toHaveBeenCalledWith({
      studentName: "Ana Souza",
      periodLabel: "Últimas 6 sessões",
      analysis: ANALYSIS,
    });
  });
});
