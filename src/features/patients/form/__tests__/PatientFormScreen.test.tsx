import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { PatientFormScreen } from "../PatientFormScreen";

const routerBack = vi.fn();
const createStudent = vi.fn();
const updateStudent = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack }),
}));

vi.mock("@/api/endpoints/student-create", () => ({
  createStudent: (...args: unknown[]) => createStudent(...args),
}));
vi.mock("@/api/endpoints/student-update", () => ({
  updateStudent: (...args: unknown[]) => updateStudent(...args),
}));

const patient = {
  id: "student-1",
  name: "Beatriz Costa",
  age: 9,
  gender: "female" as const,
  zipcode: "12345-000",
  road: "Rua das Flores",
  housenumber: "42",
  phonenumber: "11988887777",
  learningTopics: ["Linguagem"],
  createdAt: "2026-01-01T00:00:00.000Z",
  educatorId: "educator-1",
  photoUrl: null,
  documents: [],
  guardianName: "Ana Costa",
  guardianPhone: "11977776666",
  guardianRelationship: "Mãe",
};

describe("PatientFormScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    createStudent.mockReset();
    updateStudent.mockReset();
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
      screen.getByLabelText("Telefone de contato"),
      "(11) 98888-7777",
    );
    await fireEvent.changeText(screen.getByLabelText("CEP"), "12345-000");
    await fireEvent.changeText(screen.getByLabelText("Rua"), "Rua das Flores");
    await fireEvent.changeText(screen.getByLabelText("Número"), "42");
    await fireEvent.changeText(
      screen.getByLabelText("Nome do responsável"),
      "Ana Costa",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Telefone do responsável"),
      "(11) 97777-6666",
    );
    await fireEvent.changeText(screen.getByLabelText("Parentesco"), "Mãe");
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
        guardianName: "Ana Costa",
        guardianPhone: "11977776666",
        guardianRelationship: "Mãe",
      }),
    );
    await waitFor(() => expect(routerBack).toHaveBeenCalledOnce());
  });

  it("preenche a edição, desabilita sem mudanças e envia apenas o telefone alterado", async () => {
    updateStudent.mockResolvedValue(patient);
    await render(<PatientFormScreen patient={patient} />);
    expect(screen.getByText("Editar paciente")).toBeTruthy();
    expect(screen.getByLabelText("Nome completo").props.value).toBe(
      patient.name,
    );
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }).props
        .accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.changeText(
      screen.getByLabelText("Telefone do responsável"),
      "(11) 96666-5555",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(updateStudent).toHaveBeenCalledWith(patient.id, {
        guardianPhone: "11966665555",
      }),
    );
  });

  it("mantém os dados e mostra a mensagem da API se a edição falhar", async () => {
    updateStudent.mockRejectedValue(new Error("Falha ao atualizar"));
    await render(<PatientFormScreen patient={patient} />);
    await fireEvent.changeText(
      screen.getByLabelText("Nome completo"),
      "Beatriz Nova",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Falha ao atualizar")).toBeTruthy(),
    );
    expect(screen.getByLabelText("Nome completo").props.value).toBe(
      "Beatriz Nova",
    );
    expect(routerBack).not.toHaveBeenCalled();
  });

  it("envia somente as dificuldades modificadas na edição", async () => {
    updateStudent.mockResolvedValue(patient);
    await render(<PatientFormScreen patient={patient} />);
    await fireEvent.press(screen.getByLabelText("Atenção"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(updateStudent).toHaveBeenCalledWith(patient.id, {
        learningTopics: ["Linguagem", "Atenção"],
      }),
    );
  });
});
