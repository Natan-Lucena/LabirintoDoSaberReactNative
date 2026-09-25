import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Student } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let queryState: {
  data: Student[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => queryState,
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: routerPush }) }));

const { StudentsListScreen } =
  await import("@/features/students-list/StudentsListScreen");

function makeStudent(overrides: Partial<Student>): Student {
  return {
    id: "student-x",
    name: "Nome",
    age: 8,
    gender: "female",
    zipcode: "01000-000",
    road: "Rua",
    housenumber: "1",
    phonenumber: "11999990000",
    learningTopics: ["leitura"],
    createdAt: "2026-01-01T12:00:00.000Z",
    educatorId: "educator-1",
    photoUrl: null,
    documents: [],
    educators: [],
    ...overrides,
  };
}

const students = [
  makeStudent({ id: "1", name: "Zeca Alves", age: 9, gender: "male" }),
  makeStudent({ id: "2", name: "Ágata Souza", age: 7, gender: "female" }),
];

function setQueryState(overrides: Partial<typeof queryState> = {}): void {
  queryState = {
    data: students,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe("StudentsListScreen (AC-L-01, AC-L-02, AC-X-01)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    setQueryState();
  });

  it("lista os alunos em ordem alfabética com a contagem", async () => {
    await render(<StudentsListScreen />);

    expect(
      screen.getByText("Alunos organizados em ordem alfabética (2 alunos)"),
    ).toBeTruthy();
    expect(screen.getByText("Ágata Souza")).toBeTruthy();
    expect(screen.getByText("Zeca Alves")).toBeTruthy();
  });

  it("busca sem distinção de acento filtra a lista", async () => {
    await render(<StudentsListScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Buscar aluno por nome..."),
      "agata",
    );

    expect(screen.getByText("Ágata Souza")).toBeTruthy();
    expect(screen.queryByText("Zeca Alves")).toBeNull();
  });

  it("toca num aluno e navega para /students/{id}", async () => {
    await render(<StudentsListScreen />);

    await fireEvent.press(screen.getByLabelText(/Ágata Souza/));

    expect(routerPush).toHaveBeenCalledWith("/students/2");
  });

  it("toca em Cadastrar Aluno e navega para /students/new", async () => {
    await render(<StudentsListScreen />);

    await fireEvent.press(screen.getByLabelText("Cadastrar Aluno"));

    expect(routerPush).toHaveBeenCalledWith("/students/new");
  });

  it("mostra carregando enquanto os dados chegam", async () => {
    setQueryState({ data: undefined, isPending: true });
    await render(<StudentsListScreen />);

    expect(screen.getByText("Carregando Alunos")).toBeTruthy();
  });

  it("mostra erro com nova tentativa", async () => {
    setQueryState({ data: undefined, isError: true });
    await render(<StudentsListScreen />);

    expect(
      screen.getByText("Não foi possível carregar os alunos."),
    ).toBeTruthy();
  });

  it("busca sem resultado mostra estado vazio", async () => {
    await render(<StudentsListScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Buscar aluno por nome..."),
      "não existe",
    );

    expect(screen.getByText("Nenhum aluno encontrado")).toBeTruthy();
  });
});
