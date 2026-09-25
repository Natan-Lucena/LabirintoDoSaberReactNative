import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Student } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
const routerBack = vi.fn();

interface StudentsQueryState {
  data: Student[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

let studentsQuery: StudentsQueryState;

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => studentsQuery,
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
}));

const { StudentDetailScreen, formatContactPhone, formatStudentAddress } =
  await import("@/features/student-detail/StudentDetailScreen");

const student: Student = {
  id: "student-1",
  name: "Lia Monteiro",
  age: 8,
  gender: "female",
  zipcode: "01000-000",
  road: "Rua Ficticia",
  housenumber: "123",
  phonenumber: "11999990000",
  learningTopics: ["leitura", "escrita"],
  createdAt: "2026-01-01T12:00:00.000Z",
  educatorId: "educator-1",
  photoUrl: null,
  documents: [],
  educators: ["educator-1"],
};

function setStudentsQuery(overrides: Partial<StudentsQueryState> = {}): void {
  studentsQuery = {
    data: [student],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe("StudentDetailScreen (AC-D-01, AC-X-01)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerBack.mockClear();
  });

  it("formata endereço e telefone (D-03)", () => {
    expect(formatStudentAddress(student)).toBe(
      "Rua Ficticia, 123 - CEP 01000-000",
    );
    expect(formatContactPhone("11999990000")).toBe("(11) 99999-0000");
    expect(formatContactPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("mostra os campos do aluno encontrado e navega para editar", async () => {
    setStudentsQuery();
    await render(<StudentDetailScreen studentId="student-1" />);

    expect(screen.getByText("Lia Monteiro")).toBeTruthy();
    expect(screen.getByText("8 anos • Feminino")).toBeTruthy();
    expect(screen.getByText("Rua Ficticia, 123 - CEP 01000-000")).toBeTruthy();
    expect(screen.getByText("(11) 99999-0000")).toBeTruthy();
    expect(screen.getByText("leitura")).toBeTruthy();
    expect(screen.getByText("escrita")).toBeTruthy();
    // D-01: sem data de nascimento nem progresso por categoria.
    expect(screen.queryByText(/Progresso/)).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Editar aluno" }));
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Editar aluno" },
    });
  });

  it("mostra carregamento", async () => {
    setStudentsQuery({ data: undefined, isPending: true });
    await render(<StudentDetailScreen studentId="student-1" />);
    expect(screen.getByLabelText("Carregando aluno")).toBeTruthy();
  });

  it("mostra erro recuperável com nova tentativa", async () => {
    const refetch = vi.fn();
    setStudentsQuery({ data: undefined, isError: true, refetch });
    await render(<StudentDetailScreen studentId="student-1" />);

    await screen.findByRole("alert");
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("mostra 'Aluno não encontrado' para id inexistente e volta", async () => {
    setStudentsQuery();
    await render(<StudentDetailScreen studentId="student-inexistente" />);

    expect(screen.getByText("Aluno não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledTimes(1);
  });
});
