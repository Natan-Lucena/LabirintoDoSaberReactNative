import { describe, expect, it, vi } from "vitest";

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { createQueryClient } from "@/api/query-client";
import { listStudents } from "@/api/endpoints/student";
import type { Student } from "@/api/types";
import { StudentStep, normalizeForSearch } from "../StudentStep";

const push = vi.fn();
const back = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ push, back }),
}));

vi.mock("@/api/endpoints/student", () => ({
  listStudents: vi.fn(),
}));

const selectStudent = vi.fn().mockResolvedValue(undefined);
const cancel = vi.fn().mockResolvedValue(undefined);
vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({ selectStudent, cancel }),
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
  it("AC-702-05: mostra LoadingState enquanto busca", async () => {
    vi.mocked(listStudents).mockReturnValue(new Promise(() => {}));

    await render(<StudentStep />);

    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("AC-702-05: mostra EmptyState sem alunos", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByRole("header")).toBeTruthy());
  });

  it("AC-702-05: mostra ErrorState com retry", async () => {
    vi.mocked(listStudents).mockRejectedValue(new Error("network"));
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false } });

    await render(<StudentStep />, { queryClient });

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByText("Tentar novamente")).toBeTruthy();
  });

  it("AC-702-01: filtra por nome sem diferenciar acento/maiúscula", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar Aluno..."),
      "joao",
    );

    await waitFor(() => expect(screen.queryByText("Ana Souza")).toBeNull());
    expect(screen.getByText("João Pedro")).toBeTruthy();
  });

  it("AC-702-03: Próximo Passo desabilitado sem seleção", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    const nextButton = screen.getByRole("button", { name: "Próximo Passo" });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("AC-702-02/03: seleção habilita e navega gravando no store", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: "Ana Souza" }));

    const nextButton = screen.getByRole("button", { name: "Próximo Passo" });
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

    await waitFor(() => expect(screen.getByRole("header")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("mostra marcador de passo único com rótulo acessível 'Passo 1'", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByLabelText("Passo 1")).toBeTruthy());
  });
});
