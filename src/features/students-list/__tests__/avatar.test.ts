import { describe, expect, it } from "vitest";

import { avatarBackgroundColorForStudentId } from "@/features/students-list/avatar";

describe("avatarBackgroundColorForStudentId", () => {
  it("é determinística para o mesmo id", () => {
    expect(avatarBackgroundColorForStudentId("student-2")).toBe(
      avatarBackgroundColorForStudentId("student-2"),
    );
  });

  it("usa a paleta de cores acessível definida", () => {
    const palette = ["#E94B8F", "#9B6DD6", "#4A90E2", "#50C878"];
    const ids = [
      "student-1",
      "student-2",
      "student-3",
      "student-4",
      "student-5",
    ];
    for (const id of ids) {
      expect(palette).toContain(avatarBackgroundColorForStudentId(id));
    }
  });

  it("distribui ids diferentes por mais de uma cor", () => {
    const ids = [
      "student-1",
      "student-2",
      "student-3",
      "student-4",
      "student-5",
    ];
    const colors = new Set(ids.map(avatarBackgroundColorForStudentId));
    expect(colors.size).toBeGreaterThan(1);
  });
});
