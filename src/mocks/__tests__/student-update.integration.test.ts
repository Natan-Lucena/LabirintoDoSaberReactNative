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
