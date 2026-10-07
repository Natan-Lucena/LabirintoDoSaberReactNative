import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { PatientFormScreen } from "../PatientFormScreen";

const routerBack = vi.fn();
const createStudent = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack }),
}));

vi.mock("@/api/endpoints/student-create", () => ({
  createStudent: (...args: unknown[]) => createStudent(...args),
}));

describe("PatientFormScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    createStudent.mockReset();
  });

  it("bloqueia o salvamento sem todos os dados exigidos pela API", async () => {
    await render(<PatientFormScreen />);

    expect(
      screen.getByRole("button", { name: "Salvar paciente" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("envia o telefone só com dígitos e as dificuldades selecionadas", async () => {
    createStudent.mockResolvedValue({ id: "mock-student-99" });
    await render(<PatientFormScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Nome completo"),
      "Beatriz Costa",
    );
    await fireEvent.changeText(screen.getByLabelText("Idade"), "9");
    await fireEvent.press(screen.getByRole("radio", { name: "Feminino" }));
    await fireEvent.changeText(
      screen.getByLabelText("Telefone do responsável"),
      "(11) 98888-7777",
    );
    await fireEvent.changeText(screen.getByLabelText("CEP"), "12345-000");
    await fireEvent.changeText(screen.getByLabelText("Rua"), "Rua das Flores");
    await fireEvent.changeText(screen.getByLabelText("Número"), "42");
    await fireEvent.press(screen.getByLabelText("Linguagem"));
    await fireEvent.changeText(
      screen.getByLabelText("Outra dificuldade"),
      "Coordenação motora",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar dificuldade" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar paciente" }),
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
        learningTopics: ["Linguagem", "Coordenação motora"],
      }),
    );
    await waitFor(() => expect(routerBack).toHaveBeenCalledOnce());
  });
});
