import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { createQueryClient } from "@/api/query-client";
import { listStudents } from "@/api/endpoints/student";
import { listSessionsByStudent, finishSession } from "@/api/endpoints/session";
import type { Student } from "@/api/types";
import { StudentStep, normalizeForSearch } from "../StudentStep";

const push = vi.fn();
const back = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ push, back }),
  useLocalSearchParams: () => ({}),
}));

vi.mock("@/api/endpoints/student", () => ({
  listStudents: vi.fn(),
}));

vi.mock("@/api/endpoints/session", () => ({
  listSessionsByStudent: vi.fn(),
  finishSession: vi.fn(),
}));

const selectStudent = vi.fn().mockResolvedValue(undefined);
const cancel = vi.fn().mockResolvedValue(undefined);
const finish = vi.fn().mockResolvedValue(undefined);
let flowState: { step: string; sessionId: string | null } = {
  step: "idle",
  sessionId: null,
};
vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({ selectStudent, cancel, finish, ...flowState }),
}));

const ANA: Student = {
  id: "s1",
  name: "Ana Souza",
  age: 8,
  gender: "female",
  zipcode: "00000-000",
  road: "Rua A",
  housenumber: "1",
  phonenumber: "0000-0000",
  learningTopics: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  educatorId: "e1",
  photoUrl: null,
  documents: [],
  educators: ["e1"],
};

const JOAO: Student = { ...ANA, id: "s2", name: "João Pedro", gender: "male" };

describe("normalizeForSearch", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizeForSearch("João")).toBe(normalizeForSearch("joao"));
  });
});

describe("StudentStep", () => {
  beforeEach(() => {
    flowState = { step: "idle", sessionId: null };
    vi.mocked(listSessionsByStudent).mockResolvedValue([]);
  });
  it("AC-702-05: mostra LoadingState enquanto busca", async () => {
    vi.mocked(listStudents).mockReturnValue(new Promise(() => {}));

    await render(<StudentStep />);

    expect(screen.getByText("Carregando pacientes")).toBeTruthy();
  });

  it("AC-702-05: mostra EmptyState sem alunos", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(screen.getByText("Escolha o paciente")).toBeTruthy(),
    );
  });

  it("AC-702-05: mostra ErrorState com retry", async () => {
    vi.mocked(listStudents).mockRejectedValue(new Error("network"));
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false } });

    await render(<StudentStep />, { queryClient });

    await waitFor(() =>
      expect(screen.getByText("Tentar novamente")).toBeTruthy(),
    );
    expect(screen.getByText("Tentar novamente")).toBeTruthy();
  });

  it("AC-702-01: filtra por nome sem diferenciar acento/maiúscula", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar paciente"),
      "joao",
    );

    await waitFor(() => expect(screen.queryByText("Ana Souza")).toBeNull());
    expect(screen.getByText("João Pedro")).toBeTruthy();
  });

  it("AC-702-03: Continuar desabilitado sem seleção", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    const nextButton = screen.getByRole("button", { name: "Continuar" });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("AC-702-02/03: seleção habilita e navega gravando no store", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: "Ana Souza" }));

    const nextButton = screen.getByRole("button", { name: "Continuar" });
    await waitFor(() =>
      expect(nextButton.props.accessibilityState).toMatchObject({
        disabled: false,
      }),
    );

    fireEvent.press(nextButton);

    await waitFor(() => expect(selectStudent).toHaveBeenCalledWith(ANA));
    expect(push).toHaveBeenCalledWith("/session/content");
  });

  it("Voltar cancela o fluxo no store (T-701) e sai", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(screen.getByText("Escolha o paciente")).toBeTruthy(),
    );

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(back).toHaveBeenCalledTimes(1);
  });

  const OPEN_SESSION = {
    id: "open-session",
    studentId: ANA.id,
    educatorId: "e1",
    name: "Sessão aberta",
    startedAt: "2026-10-07T10:00:00.000Z",
    answers: [],
  };

  async function chooseAnaWithOpenSession() {
    vi.mocked(listStudents).mockResolvedValue([ANA]);
    vi.mocked(listSessionsByStudent).mockResolvedValue([OPEN_SESSION]);
    await render(<StudentStep />);
    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: "Ana Souza" }));
    await waitFor(() =>
      expect(screen.getByText("Sessão em andamento")).toBeTruthy(),
    );
  }

  it("AC-SES-01-02: com o fluxo salvo neste aparelho, oferece Retomar e Encerrar agora", async () => {
    flowState = { step: "running", sessionId: "open-session" };
    await chooseAnaWithOpenSession();

    fireEvent.press(screen.getByRole("button", { name: "Retomar" }));

    expect(push).toHaveBeenCalledWith("/session/player");
    expect(selectStudent).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Encerrar agora" })).toBeTruthy();
  });

  it("Encerrar agora com o fluxo local passa pelo encerramento com registro", async () => {
    flowState = { step: "running", sessionId: "open-session" };
    await chooseAnaWithOpenSession();

    fireEvent.press(screen.getByRole("button", { name: "Encerrar agora" }));

    await waitFor(() => expect(finish).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/session/finish");
    expect(finishSession).not.toHaveBeenCalled();
  });

  it("sessão aberta em outro aparelho não oferece Retomar, só encerrar no servidor", async () => {
    flowState = { step: "idle", sessionId: null };
    vi.mocked(finishSession).mockResolvedValue({
      ...OPEN_SESSION,
      finishedAt: "2026-10-07T11:00:00.000Z",
    });
    await chooseAnaWithOpenSession();

    expect(screen.queryByRole("button", { name: "Retomar" })).toBeNull();
    expect(screen.getByText(/outro aparelho/)).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Encerrar agora" }));

    await waitFor(() =>
      expect(finishSession).toHaveBeenCalledWith({ sessionId: "open-session" }),
    );
    expect(finish).not.toHaveBeenCalled();
  });

  it("mostra cabeçalho novo com voltar", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy(),
    );
  });
});
