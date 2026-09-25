import { describe, expect, it } from "vitest";

import type { Student } from "@/api/types";
import {
  avatarBackgroundColorForIndex,
  filterBySearch,
  paginate,
  sortByNameAsc,
} from "@/features/students-list/selectors";

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
    learningTopics: [],
    createdAt: "2026-01-01T12:00:00.000Z",
    educatorId: "educator-1",
    photoUrl: null,
    documents: [],
    educators: [],
    ...overrides,
  };
}

describe("sortByNameAsc", () => {
  it("ordena alfabeticamente sem distinção de acento", () => {
    const students = [
      makeStudent({ id: "1", name: "Zeca" }),
      makeStudent({ id: "2", name: "Ágata" }),
      makeStudent({ id: "3", name: "Bruno" }),
    ];

    expect(sortByNameAsc(students).map((s) => s.id)).toEqual(["2", "3", "1"]);
  });
});

describe("filterBySearch", () => {
  it("filtra sem distinção de acento ou maiúscula", () => {
    const students = [
      makeStudent({ id: "1", name: "Ágata Souza" }),
      makeStudent({ id: "2", name: "Bruno Lima" }),
    ];

    expect(filterBySearch(students, "agata").map((s) => s.id)).toEqual(["1"]);
    expect(filterBySearch(students, "SOUZA").map((s) => s.id)).toEqual(["1"]);
  });

  it("sem query retorna todos", () => {
    const students = [makeStudent({ id: "1" })];
    expect(filterBySearch(students, "")).toHaveLength(1);
  });
});

describe("paginate", () => {
  it("pagina de 10 em 10", () => {
    const students = Array.from({ length: 25 }, (_, index) =>
      makeStudent({ id: `student-${index}` }),
    );

    const page1 = paginate(students, 1);
    expect(page1.pageItems).toHaveLength(10);
    expect(page1.totalPages).toBe(3);

    const page3 = paginate(students, 3);
    expect(page3.pageItems).toHaveLength(5);
  });

  it("limita a página a um intervalo válido", () => {
    const students = [makeStudent({ id: "1" })];
    expect(paginate(students, 5).pageItems).toHaveLength(1);
    expect(paginate(students, 0).pageItems).toHaveLength(1);
  });
});

describe("avatarBackgroundColorForIndex", () => {
  it("alterna entre 4 cores por índice", () => {
    const colors = [0, 1, 2, 3, 4].map(avatarBackgroundColorForIndex);
    expect(colors[4]).toBe(colors[0]);
    expect(new Set(colors.slice(0, 4)).size).toBe(4);
  });
});
