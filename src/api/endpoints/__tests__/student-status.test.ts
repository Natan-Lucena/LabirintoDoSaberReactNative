import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  getAppointmentSeries,
  appointmentSeriesQueryKeys,
} from "@/api/endpoints/appointment-series";
import {
  getStudent,
  isSharedStudent,
  listStudentOverview,
  listStudentsByStatus,
  studentStatus,
  studentStatusQueryKeys,
} from "@/api/endpoints/student-status";
import { listStudents } from "@/api/endpoints/student";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import {
  MOCK_ARCHIVED_STUDENT_ID,
  MOCK_SERIES_ENDED_ID,
  MOCK_SERIES_FOREIGN_ID,
  MOCK_SERIES_ID,
} from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("status do paciente e série pelo apiClient (API-07, leva 3)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockTeamScenario();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockTeamScenario();
  });

  it("monta chaves de query sob o prefixo student e auxiliares com padrão", () => {
    expect(studentStatusQueryKeys.list()).toEqual([
      "student",
      "status",
      "ACTIVE",
    ]);
    expect(studentStatusQueryKeys.overview("ALL")).toEqual([
      "student",
      "overview",
      "ALL",
    ]);
    expect(studentStatusQueryKeys.detail("s1")).toEqual([
      "student",
      "detail",
      "s1",
    ]);
    expect(appointmentSeriesQueryKeys.detail("sr1")).toEqual([
      "appointment",
      "series",
      "sr1",
    ]);
    expect(studentStatus({})).toBe("ACTIVE");
    expect(studentStatus({ status: "ARCHIVED" })).toBe("ARCHIVED");
    expect(isSharedStudent({})).toBe(false);
    expect(isSharedStudent({ access: "SHARED" })).toBe(true);
  });

  describe("GET /student/", () => {
    it("sem status a lista antiga não muda (campos novos ausentes)", async () => {
      const students = await listStudents();

      expect(students).toHaveLength(MOCK_STUDENTS.length);
      expect(students.every((student) => student.status === undefined)).toBe(
        true,
      );
    });

    it("padrão ACTIVE, ARCHIVED traz o arquivado e ALL traz os dois", async () => {
      const active = await listStudentsByStatus();
      expect(active).toHaveLength(5);
      expect(active.every((s) => s.status === "ACTIVE")).toBe(true);

      const archived = await listStudentsByStatus("ARCHIVED");
      expect(archived).toHaveLength(1);
      expect(archived[0]).toMatchObject({
        id: MOCK_ARCHIVED_STUDENT_ID,
        status: "ARCHIVED",
        archivedAt: expect.any(String),
      });

      expect(await listStudentsByStatus("ALL")).toHaveLength(6);
    });

    it("status fora do enum responde 400", async () => {
      await expect(
        apiClient.get("/student/?status=OUTRO"),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("GET /student/:id (PP-09)", () => {
    it("devolve o paciente, inclusive arquivado", async () => {
      await expect(getStudent("student-1")).resolves.toMatchObject({
        id: "student-1",
        access: "OWNER",
        status: "ACTIVE",
      });
      await expect(getStudent(MOCK_ARCHIVED_STUDENT_ID)).resolves.toMatchObject(
        { status: "ARCHIVED" },
      );
    });

    it("404 STUDENT_NOT_FOUND e 403 UNAUTHORIZED", async () => {
      await expect(getStudent("nao-existe")).rejects.toMatchObject({
        status: 404,
        code: "STUDENT_NOT_FOUND",
      });
      await expect(getStudent("mock-student-foreign")).rejects.toMatchObject({
        status: 403,
        code: "UNAUTHORIZED",
      });
    });
  });

  describe("GET /student/overview", () => {
    it("tem um item por paciente da lista, na mesma ordem (PA-08), sem nome", async () => {
      const students = await listStudentsByStatus();
      const overview = await listStudentOverview();

      expect(overview.map((item) => item.studentId)).toEqual(
        students.map((student) => student.id),
      );
      expect(overview.every((item) => !("name" in item))).toBe(true);
    });

    it("acompanha o filtro e o cenário de equipe", async () => {
      const archived = await listStudentOverview("ARCHIVED");
      expect(archived.map((item) => item.studentId)).toEqual([
        MOCK_ARCHIVED_STUDENT_ID,
      ]);

      setMockTeamScenario("admin");
      expect(await listStudentOverview()).toHaveLength(6);
    });

    it("status principal, plano ativo e pendências seguem as regras PA-06 e PA-09", async () => {
      const overview = await listStudentOverview();
      const byId = Object.fromEntries(overview.map((i) => [i.studentId, i]));

      // Plano com revisão vencida: PLAN_REVIEW; uma pendência de cada tipo com targetId.
      expect(byId["student-1"].primaryStatus).toBe("PLAN_REVIEW");
      expect(byId["student-1"].activePlan).toMatchObject({
        id: "mock-plan-1",
        type: "PDI",
      });
      expect(byId["student-1"].activePlan?.percent).toBeGreaterThanOrEqual(0);
      expect(byId["student-1"].pendings).toEqual([
        { kind: "EVOLUTION_PENDING", count: 1, targetId: "mock-session-1" },
        { kind: "PLAN_REVIEW_DUE", count: 1, targetId: "mock-plan-1" },
      ]);
      expect(byId["student-1"].nextAppointment).toBeDefined();

      // count > 1 e ANAMNESIS_MISSING nunca trazem targetId.
      expect(byId["student-5"].pendings).toEqual([
        { kind: "EVOLUTION_PENDING", count: 2 },
      ]);
      expect(byId["student-4"].pendings).toEqual([
        { kind: "ANAMNESIS_MISSING", count: 1 },
      ]);

      // Sem plano ativo e sem pendência: lista vazia, sem activePlan.
      expect(byId["student-3"]).toMatchObject({
        primaryStatus: "NO_PLAN",
        pendings: [],
      });
      expect(byId["student-3"].activePlan).toBeUndefined();
    });

    it("status fora do enum responde 400", async () => {
      await expect(
        apiClient.get("/student/overview?status=X"),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe("GET /appointment/series/:id", () => {
    it("traz todas as ocorrências, por scheduledAt, inclusive canceladas e concluídas (RC-10)", async () => {
      const series = await getAppointmentSeries(MOCK_SERIES_ID);

      expect(series).toMatchObject({
        id: MOCK_SERIES_ID,
        frequency: "WEEKLY",
        occurrences: 5,
      });
      expect(series.endedAt).toBeUndefined();
      expect(series.appointments).toHaveLength(5);
      expect(series.appointments.every((a) => a.seriesId === series.id)).toBe(
        true,
      );
      expect(series.appointments.map((a) => a.status)).toEqual([
        "COMPLETED",
        "CANCELLED",
        "COMPLETED",
        "PENDING",
        "PENDING",
      ]);
      const dates = series.appointments.map((a) => a.scheduledAt);
      expect([...dates].sort()).toEqual(dates);
    });

    it("série encerrada traz endedAt", async () => {
      const series = await getAppointmentSeries(MOCK_SERIES_ENDED_ID);

      expect(series.frequency).toBe("BIWEEKLY");
      expect(series.endedAt).toEqual(expect.any(String));
    });

    it("404 SERIES_NOT_FOUND e 403 UNAUTHORIZED", async () => {
      await expect(getAppointmentSeries("nao-existe")).rejects.toMatchObject({
        status: 404,
        code: "SERIES_NOT_FOUND",
        message: "Série de atendimentos não encontrada.",
      });
      await expect(
        getAppointmentSeries(MOCK_SERIES_FOREIGN_ID),
      ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    });
  });
});
