import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { apiClient } = await import("@/api/client");
const { listStudents } = await import("@/api/endpoints/student");
const { mockAdapter } = await import("@/mocks/adapter");
await import("@/mocks/handlers/student");

const originalAdapter = apiClient.defaults.adapter;

describe("GET /student/ via mockAdapter — campos usados nos detalhes (D-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("devolve endereço, contato e objetivos de aprendizado do aluno mockado", async () => {
    const students = await listStudents();
    const lia = students.find((student) => student.id === "student-1");

    expect(lia).toMatchObject({
      name: "Lia Monteiro",
      age: 8,
      gender: "female",
      zipcode: "01000-000",
      road: "Rua Ficticia",
      housenumber: "123",
      phonenumber: "11999990000",
      learningTopics: ["leitura"],
    });
  });

  it("id inexistente não é encontrado na lista (estado 'não encontrado')", async () => {
    const students = await listStudents();
    expect(
      students.find((student) => student.id === "student-inexistente"),
    ).toBeUndefined();
  });
});
