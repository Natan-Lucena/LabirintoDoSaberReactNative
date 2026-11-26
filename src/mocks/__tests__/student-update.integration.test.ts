import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import { updateStudent } from "@/api/endpoints/student-update";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import "@/mocks/handlers/student-update";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("PUT /student/update/:id pelo apiClient", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("apaga os dados do responsável com string vazia no multipart (FEC-06)", async () => {
    const student = MOCK_STUDENTS[0];
    const original = { ...student };
    try {
      Object.assign(student, {
        guardianName: "Responsável Teste",
        guardianPhone: "11988887777",
        guardianRelationship: "Mãe",
      });
      apiClient.defaults.adapter = (config) => {
        const data = config.data as FormData;
        expect(data.get("guardianName")).toBe("");
        expect(data.get("guardianPhone")).toBe("");
        expect(data.get("guardianRelationship")).toBe("");
        return mockAdapter(config);
      };
      const updated = await updateStudent(student.id, {
        guardianName: null,
        guardianPhone: null,
        guardianRelationship: null,
      });
      expect(updated).not.toHaveProperty("guardianName");
      expect(updated).not.toHaveProperty("guardianPhone");
      expect(updated).not.toHaveProperty("guardianRelationship");
    } finally {
      for (const key of [
        "guardianName",
        "guardianPhone",
        "guardianRelationship",
      ] as const)
        delete student[key];
      Object.assign(student, original);
    }
  });

  it("envia apenas os campos informados como multipart e atualiza a lista", async () => {
    const student = MOCK_STUDENTS[0];
    const original = { ...student };
    const responseStudent = student as unknown as { educators?: unknown[] };
    try {
      responseStudent.educators = [{ password: "mock-secret" }];
      apiClient.defaults.adapter = (config) => {
        expect(config.data).toBeInstanceOf(FormData);
        const data = config.data as FormData;
        expect([...data.keys()]).toEqual(["learningTopics", "guardianPhone"]);
        expect(data.get("learningTopics")).toBe('["Leitura","Atenção"]');
        expect(data.get("guardianPhone")).toBe("11988887777");
        return mockAdapter(config);
      };
      const updated = await updateStudent(student.id, {
        learningTopics: ["Leitura", "Atenção"],
        guardianPhone: "(11) 98888-7777",
      });
      expect(updated).toMatchObject({
        learningTopics: ["Leitura", "Atenção"],
        guardianPhone: "11988887777",
      });
      expect(MOCK_STUDENTS[0]).toMatchObject(updated);
      expect(updated).not.toHaveProperty("educators");
    } finally {
      Object.assign(student, original);
      delete responseStudent.educators;
    }
  });

  it("distingue aluno ausente de aluno não vinculado", async () => {
    await expect(
      updateStudent("missing-student", { name: "Novo" }),
    ).rejects.toMatchObject({ status: 404, code: "STUDENT_NOT_FOUND" });
    await expect(
      updateStudent("student-not-assigned", { name: "Novo" }),
    ).rejects.toMatchObject({
      status: 400,
      code: "STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR",
    });
  });
});
