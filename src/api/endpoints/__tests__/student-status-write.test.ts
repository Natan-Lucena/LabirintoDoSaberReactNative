import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { createAppointment, getAppointment } from "@/api/endpoints/appointment";
import { listStudents } from "@/api/endpoints/student";
import {
  StudentStatusConflictError,
  getStudent,
  listStudentsByStatus,
  updateStudentStatus,
} from "@/api/endpoints/student-status";
import { MOCK_ARCHIVED_STUDENT_ID } from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockStudentStatusState } from "@/mocks/mock-student-status-state";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("PUT /student/:id/status pelo apiClient (PAC-11)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockStudentStatusState();
    resetMockTeamScenario();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockStudentStatusState();
    resetMockTeamScenario();
  });

  it("arquiva sem atendimentos futuros e o paciente muda de lista; reativar devolve", async () => {
    const archived = await updateStudentStatus("student-5", {
      status: "ARCHIVED",
    });

    expect(archived).toMatchObject({ id: "student-5", status: "ARCHIVED" });
    expect(archived.archivedAt).toBeTruthy();
    expect((await listStudents()).map((s) => s.id)).not.toContain("student-5");
    expect((await listStudentsByStatus("ARCHIVED")).map((s) => s.id)).toContain(
      "student-5",
    );
    await expect(getStudent("student-5")).resolves.toMatchObject({
      status: "ARCHIVED",
    });

    const reactivated = await updateStudentStatus("student-5", {
      status: "ACTIVE",
    });
    expect(reactivated.status).toBe("ACTIVE");
    expect(reactivated.archivedAt).toBeUndefined();
    expect((await listStudents()).map((s) => s.id)).toContain("student-5");
  });

  it("com atendimento futuro dá 409 com count e só cancela com a opção", async () => {
    const future = await createAppointment({
      studentId: "student-2",
      scheduledAt: "2032-05-10T13:00:00.000Z",
    });

    const error = await updateStudentStatus("student-2", {
      status: "ARCHIVED",
    }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(StudentStatusConflictError);
    expect(error).toMatchObject({
      status: 409,
      code: "HAS_FUTURE_APPOINTMENTS",
      count: 1,
    });
    // Nada mudou: o paciente segue ativo e o atendimento segue pendente.
    expect((await listStudents()).map((s) => s.id)).toContain("student-2");
    await expect(getAppointment(future.id)).resolves.toMatchObject({
      status: "PENDING",
    });

    await expect(
      updateStudentStatus("student-2", {
        status: "ARCHIVED",
        cancelFutureAppointments: true,
      }),
    ).resolves.toMatchObject({ status: "ARCHIVED" });
    await expect(getAppointment(future.id)).resolves.toMatchObject({
      status: "CANCELLED",
    });

    // Reativar não devolve os atendimentos cancelados (PA-05).
    await updateStudentStatus("student-2", { status: "ACTIVE" });
    await expect(getAppointment(future.id)).resolves.toMatchObject({
      status: "CANCELLED",
    });
  });

  it("reativa o paciente que já vinha arquivado", async () => {
    await expect(
      updateStudentStatus(MOCK_ARCHIVED_STUDENT_ID, { status: "ACTIVE" }),
    ).resolves.toMatchObject({ status: "ACTIVE" });
    expect((await listStudentsByStatus("ARCHIVED")).length).toBe(0);
  });

  it("criar atendimento para arquivado dá 409 STUDENT_ARCHIVED", async () => {
    await updateStudentStatus("student-5", { status: "ARCHIVED" });

    await expect(
      createAppointment({
        studentId: "student-5",
        scheduledAt: "2032-06-10T13:00:00.000Z",
      }),
    ).rejects.toMatchObject({ status: 409, code: "STUDENT_ARCHIVED" });
  });

  it("paciente compartilhado: 403; inexistente: 404; corpo inválido: 400", async () => {
    setMockTeamScenario("professional");

    await expect(
      updateStudentStatus("student-shared-1", { status: "ARCHIVED" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      updateStudentStatus("student-inexistente", { status: "ARCHIVED" }),
    ).rejects.toMatchObject({ status: 404, code: "STUDENT_NOT_FOUND" });
    await expect(
      updateStudentStatus("student-1", { status: "OUTRO" as "ACTIVE" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
