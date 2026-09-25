import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { createStudent } from "@/api/endpoints/student-create";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import "@/mocks/handlers/student-create";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("createStudent com mockAdapter", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria um aluno a partir do formData e devolve 201 com o Student", async () => {
    const countBeforeCreate = MOCK_STUDENTS.length;

    const student = await createStudent({
      name: "Beatriz Costa",
      age: 9,
      gender: "female",
      zipcode: "12345-000",
      road: "Rua das Flores",
      housenumber: "42",
      phonenumber: "11988887777",
      learningTopics: ["leitura", "matemática"],
    });

    expect(MOCK_STUDENTS).toHaveLength(countBeforeCreate + 1);
    expect(student).toMatchObject({
      name: "Beatriz Costa",
      age: 9,
      gender: "female",
      zipcode: "12345-000",
      road: "Rua das Flores",
      housenumber: "42",
      phonenumber: "11988887777",
      learningTopics: ["leitura", "matemática"],
      photoUrl: null,
      documents: [],
    });
  });

  it("rejeita idade fora da faixa 1-50 com 400 INVALID_STUDENT_FORMAT", async () => {
    await expect(
      createStudent({
        name: "Fulano",
        age: 51,
        gender: "male",
        zipcode: "12345-000",
        road: "Rua X",
        housenumber: "1",
        phonenumber: "11988887777",
        learningTopics: ["leitura"],
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_STUDENT_FORMAT" });
  });

  it("rejeita sem nenhum objetivo de aprendizado com 400 INVALID_STUDENT_FORMAT", async () => {
    await expect(
      createStudent({
        name: "Fulano",
        age: 10,
        gender: "male",
        zipcode: "12345-000",
        road: "Rua X",
        housenumber: "1",
        phonenumber: "11988887777",
        learningTopics: [],
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_STUDENT_FORMAT" });
  });
});
