import { describe, expect, it, vi } from "vitest";

import { loadHomeData } from "@/features/home/useHomeData";

const listAppointmentsMock = vi.fn();
const listStudentsMock = vi.fn();
const getMeMock = vi.fn();

vi.mock("@/api/endpoints/appointment", () => ({
  listAppointments: () => listAppointmentsMock(),
}));
vi.mock("@/api/endpoints/student", () => ({
  listStudents: () => listStudentsMock(),
}));
vi.mock("@/api/endpoints/educator", () => ({
  getMe: () => getMeMock(),
}));

describe("loadHomeData (AC-HOME-01-01)", () => {
  it("combina os três endpoints e mantém aluno ausente como fallback", async () => {
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

    await expect(loadHomeData()).resolves.toMatchObject({
      todayAppointments: [
        {
          appointment: { id: "appointment-1" },
          student: null,
        },
      ],
    });
  });

  it("usa o nome vindo de getMe", async () => {
    listAppointmentsMock.mockResolvedValue([]);
    listStudentsMock.mockResolvedValue([]);
    getMeMock.mockResolvedValue({
      id: "educator-1",
      name: "Educadora Ficticia",
      email: "educadora@example.test",
    });

    await expect(loadHomeData()).resolves.toSatisfy((data) => {
      return data.educator?.name === "Educadora Ficticia";
    });
  });
});
