import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import { loadHomeData } from "@/features/home/useHomeData";

const listAppointmentsMock = vi.fn();
const listStudentsMock = vi.fn();
const getMeMock = vi.fn();
const getLastSessionsMock = vi.fn();
const listTaskNotebooksMock = vi.fn();

vi.mock("@/api/endpoints/appointment", () => ({
  listAppointments: () => listAppointmentsMock(),
}));
vi.mock("@/api/endpoints/student", () => ({
  listStudents: () => listStudentsMock(),
}));
vi.mock("@/api/endpoints/educator", () => ({
  getMe: () => getMeMock(),
  getLastSessions: () => getLastSessionsMock(),
}));
vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: () => listTaskNotebooksMock(),
}));

describe("loadHomeData (AC-601-02, AC-601-03)", () => {
  it("trata a ausencia de ultimas sessoes como lista vazia e aluno ausente como fallback", async () => {
    listAppointmentsMock.mockResolvedValue([
      {
        id: "appointment-1",
        educatorId: "educator-1",
        studentId: "missing-student",
        scheduledAt: new Date().toISOString(),
        status: "PENDING",
        createdAt: new Date().toISOString(),
      },
    ]);
    listStudentsMock.mockResolvedValue([]);
    getMeMock.mockResolvedValue({
      id: "educator-1",
      name: "Aline",
      email: "aline@example.test",
    });
    getLastSessionsMock.mockRejectedValue(
      new ApiError({
        message: "EDUCATOR_DOES_NOT_HAVE_SESSIONS",
        status: 404,
        code: "EDUCATOR_DOES_NOT_HAVE_SESSIONS",
      }),
    );
    listTaskNotebooksMock.mockResolvedValue([]);

    await expect(loadHomeData()).resolves.toMatchObject({
      lastSessions: [],
      todayAppointments: [
        {
          appointment: { id: "appointment-1" },
          student: null,
        },
      ],
    });
  });

  it("usa o nome vindo de getMe e nao expoe taxa de acerto calculada", async () => {
    listAppointmentsMock.mockResolvedValue([]);
    listStudentsMock.mockResolvedValue([]);
    getMeMock.mockResolvedValue({
      id: "educator-1",
      name: "Educadora Ficticia",
      email: "educadora@example.test",
    });
    getLastSessionsMock.mockResolvedValue([
      { studentName: "Lia", sessionName: "Leitura" },
    ]);
    listTaskNotebooksMock.mockResolvedValue([]);

    await expect(loadHomeData()).resolves.toSatisfy((data) => {
      return (
        data.educator?.name === "Educadora Ficticia" &&
        !("accuracyRate" in data.lastSessions[0])
      );
    });
  });

  it.each([
    new ApiError({ message: "INTERNAL_ERROR", status: 500 }),
    new ApiError({ message: "Network Error", isNetworkError: true }),
  ])("mantem outros erros de ultimas sessoes como erro", async (error) => {
    listAppointmentsMock.mockResolvedValue([]);
    listStudentsMock.mockResolvedValue([]);
    getMeMock.mockResolvedValue({
      id: "educator-1",
      name: "Aline",
      email: "aline@example.test",
    });
    getLastSessionsMock.mockRejectedValue(error);
    listTaskNotebooksMock.mockResolvedValue([]);

    await expect(loadHomeData()).rejects.toBe(error);
  });
});
