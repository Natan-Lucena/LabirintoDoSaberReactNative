import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { NewStudentScreen } from "../NewStudentScreen";

const routerBack = vi.fn();
const routerReplace = vi.fn();
const createStudent = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, replace: routerReplace }),
}));

vi.mock("@/api/endpoints/student-create", () => ({
  createStudent: (...args: unknown[]) => createStudent(...args),
}));

describe("NewStudentScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerReplace.mockClear();
    createStudent.mockReset();
  });

  it("bloqueia o cadastro até preencher os campos obrigatórios e um objetivo", async () => {
    await render(<NewStudentScreen />);

    expect(
      screen.getByRole("button", { name: "Cadastrar Aluno" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("mostra o botão de adicionar foto desabilitado com o selo Em breve", async () => {
    await render(<NewStudentScreen />);

    expect(screen.getByText("Adicionar foto")).toBeTruthy();
    expect(screen.getByText("Em breve")).toBeTruthy();
    expect(
      screen.getByText("Opcional - pode ser adicionada depois"),
    ).toBeTruthy();
  });

  it("adiciona e remove objetivos de aprendizado como chip", async () => {
    await render(<NewStudentScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Novo objetivo de aprendizado"),
      "leitura",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByText("leitura")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Remover objetivo leitura" }),
    );

    expect(screen.queryByText("leitura")).toBeNull();
  });

  it("envia os campos preenchidos e navega para a lista de alunos", async () => {
    createStudent.mockResolvedValue({ id: "mock-student-99" });
    await render(<NewStudentScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Nome Completo *"),
      "Beatriz Costa",
    );
    await fireEvent.changeText(screen.getByLabelText("Idade *"), "9");
    await fireEvent.press(screen.getByRole("button", { name: "Feminino" }));
    await fireEvent.changeText(
      screen.getByLabelText("Contato do Responsável *"),
      "11988887777",
    );
    await fireEvent.changeText(screen.getByLabelText("CEP *"), "12345-000");
    await fireEvent.changeText(
      screen.getByLabelText("Rua *"),
      "Rua das Flores",
    );
    await fireEvent.changeText(screen.getByLabelText("Número *"), "42");
    await fireEvent.changeText(
      screen.getByLabelText("Novo objetivo de aprendizado"),
      "leitura",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Adicionar" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Cadastrar Aluno" }),
    );

    await waitFor(() =>
      expect(createStudent).toHaveBeenCalledWith({
        name: "Beatriz Costa",
        age: 9,
        gender: "female",
        zipcode: "12345-000",
        road: "Rua das Flores",
        housenumber: "42",
        phonenumber: "11988887777",
        learningTopics: ["leitura"],
      }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/(tabs)/students");
  });

  it("cancela sem salvar", async () => {
    await render(<NewStudentScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(routerBack).toHaveBeenCalledOnce();
    expect(createStudent).not.toHaveBeenCalled();
  });
});
