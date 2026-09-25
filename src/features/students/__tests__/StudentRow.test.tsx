import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils/render";
import type { Student } from "@/api/types";
import { formatStudentSubtitle, StudentRow } from "../StudentRow";

const STUDENT: Student = {
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

// AC-702-06: nunca exibe nível, só idade e gênero em pt-BR.
describe("formatStudentSubtitle", () => {
  it("formata idade e gênero feminino em pt-BR", () => {
    expect(formatStudentSubtitle(STUDENT)).toBe("8 anos • Feminino");
  });

  it("formata gênero masculino em pt-BR", () => {
    expect(formatStudentSubtitle({ ...STUDENT, gender: "male" })).toBe(
      "8 anos • Masculino",
    );
  });
});

describe("StudentRow", () => {
  it("expõe accessibilityState.selected quando selected=true", async () => {
    await render(<StudentRow student={STUDENT} selected onPress={vi.fn()} />);

    expect(screen.getByRole("button").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("não exibe nível na linha do aluno", async () => {
    await render(
      <StudentRow student={STUDENT} selected={false} onPress={vi.fn()} />,
    );

    expect(screen.queryByText(/n[ií]vel/i)).toBeNull();
  });
});
