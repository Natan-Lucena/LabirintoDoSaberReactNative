// Recorrência (API-07, leva 3; AGE-06; CONTRATOS-BACKEND §5.7). Contrato
// PROPOSTO, mock-first. As séries CRIADAS aqui vivem na memória e suas
// ocorrências ficam em `GET /appointment/` (com `seriesId`); as séries das
// fixtures só têm leitura e NÃO entram na agenda dos mocks.
import type {
  Appointment,
  AppointmentSeries,
  AppointmentSeriesDetail,
  RecurrenceFrequency,
  SeriesResult,
} from "@/api/types";
import {
  MOCK_SERIES,
  MOCK_SERIES_ENDED,
  MOCK_SERIES_ENDED_ID,
  MOCK_SERIES_FOREIGN_ID,
  MOCK_SERIES_ID,
} from "@/mocks/fixtures-e5";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { isMockStudentIdArchived } from "@/mocks/mock-student-status-state";
import { maxOccurrences, seriesDates } from "@/features/agenda/series/preview";
import { dayKey, formatTime, toBrasiliaISOString } from "@/utils/date";
import {
  addMockAppointments,
  findMockConflict,
  getMockAppointments,
  MOCK_FOREIGN_CONFLICT_ID,
  MOCK_FOREIGN_CONFLICT_TYPE,
  nextMockAppointmentId,
} from "./appointment";
import { registerMockHandler } from "./registry";
import { findMockAccessibleStudent } from "./student";
import { MockApiError } from "./types";

const SERIES = {
  [MOCK_SERIES_ID]: MOCK_SERIES,
  [MOCK_SERIES_ENDED_ID]: MOCK_SERIES_ENDED,
};

const createdSeries = new Map<string, AppointmentSeries>();
let nextSeriesId = 1;

/** Limpa as séries criadas (testes). As ocorrências já gravadas ficam na agenda. */
export function resetMockCreatedSeries(): void {
  createdSeries.clear();
}

function occurrencesOf(seriesId: string): Appointment[] {
  return getMockAppointments()
    .filter((appointment) => appointment.seriesId === seriesId)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

function conflictBody(conflictingAppointmentId?: string) {
  return {
    status: 409,
    data: {
      message: "APPOINTMENT_CONFLICT",
      ...(conflictingAppointmentId ? { conflictingAppointmentId } : {}),
    },
  };
}

function badRequest(field: string): never {
  throw new MockApiError(400, "VALIDATION_ERROR", `Invalid ${field}`);
}

function requireCreatedSeries(id: string): AppointmentSeries {
  if (id === MOCK_SERIES_FOREIGN_ID) {
    throw new MockApiError(403, "UNAUTHORIZED");
  }
  const series = createdSeries.get(id);
  if (!series) {
    // As séries das fixtures são só de leitura: sem atendimentos na agenda.
    if (id in SERIES) {
      throw new MockApiError(404, "APPOINTMENT_NOT_FOUND");
    }
    throw new MockApiError(404, "SERIES_NOT_FOUND");
  }
  return series;
}

function requireFrom(seriesId: string, body: unknown): Appointment {
  const fromId = (body as { fromAppointmentId?: unknown }).fromAppointmentId;
  if (typeof fromId !== "string" || fromId === "") {
    badRequest("fromAppointmentId");
  }
  const from = occurrencesOf(seriesId).find(({ id }) => id === fromId);
  if (!from) {
    // §3.5: ocorrência fora da série → 400 (não 404).
    throw new MockApiError(400, "APPOINTMENT_NOT_IN_SERIES");
  }
  return from;
}

registerMockHandler(
  { method: "post", path: "/appointment/series" },
  ({ body }) => {
    const input = body as {
      studentId?: string;
      scheduledAt?: string;
      frequency?: RecurrenceFrequency;
      occurrences?: number;
      type?: string;
      durationMinutes?: number;
      observation?: string;
    };
    if (!input.studentId || !input.scheduledAt) {
      badRequest("studentId");
    }
    if (input.frequency !== "WEEKLY" && input.frequency !== "BIWEEKLY") {
      badRequest("frequency");
    }
    const occurrences = input.occurrences;
    if (
      !Number.isInteger(occurrences) ||
      occurrences! < 2 ||
      occurrences! > 26
    ) {
      badRequest("occurrences");
    }
    // §3.5: quinzenal acima de 13 ou além de 6 meses → 400 SERIES_TOO_LONG.
    if (occurrences! > maxOccurrences(input.frequency)) {
      throw new MockApiError(400, "SERIES_TOO_LONG");
    }
    findMockAccessibleStudent(input.studentId);
    if (isMockStudentIdArchived(input.studentId)) {
      return { status: 409, data: { message: "STUDENT_ARCHIVED" } };
    }

    const durationMinutes = input.durationMinutes ?? 50;
    const seriesId = `mock-series-created-${nextSeriesId++}`;
    const created: Appointment[] = [];
    const skipped: SeriesResult["skipped"] = [];
    for (const date of seriesDates(
      new Date(input.scheduledAt),
      input.frequency,
      occurrences!,
    )) {
      const scheduledAt = date.toISOString();
      const conflicting = findMockConflict({ scheduledAt, durationMinutes });
      if (
        input.type === MOCK_FOREIGN_CONFLICT_TYPE &&
        created.length === 0 &&
        skipped.length === 0
      ) {
        // Conflito com atendimento de outro educador: o id não está na agenda (D-03).
        skipped.push({
          scheduledAt,
          reason: "CONFLICT",
          conflictingAppointmentId: MOCK_FOREIGN_CONFLICT_ID,
        });
        continue;
      }
      if (conflicting) {
        skipped.push({
          scheduledAt,
          reason: "CONFLICT",
          conflictingAppointmentId: conflicting.id,
        });
        continue;
      }
      const appointment: Appointment = {
        id: nextMockAppointmentId(),
        educatorId: MOCK_EDUCATOR.id,
        studentId: input.studentId,
        scheduledAt,
        type: input.type ?? null,
        durationMinutes,
        notifiedAt: null,
        ...(input.observation === undefined
          ? {}
          : { observation: input.observation }),
        status: "PENDING",
        createdAt: new Date().toISOString(),
        seriesId,
      };
      // Marca já na memória para os próximos candidatos da mesma série.
      addMockAppointments([appointment]);
      created.push(appointment);
    }
    if (created.length === 0) {
      return conflictBody(skipped[0]?.conflictingAppointmentId);
    }

    const series: AppointmentSeries = {
      id: seriesId,
      studentId: input.studentId,
      educatorId: MOCK_EDUCATOR.id,
      frequency: input.frequency,
      firstScheduledAt: new Date(input.scheduledAt).toISOString(),
      occurrences: occurrences!,
      ...(input.type === undefined ? {} : { type: input.type }),
      durationMinutes,
      ...(input.observation === undefined
        ? {}
        : { observation: input.observation }),
      createdAt: new Date().toISOString(),
    };
    createdSeries.set(seriesId, series);
    const result: SeriesResult = { series, created, skipped };

    return { status: 201, data: structuredClone(result) };
  },
);

registerMockHandler(
  { method: "get", path: "/appointment/series/:id" },
  ({ params }) => {
    if (params.id === MOCK_SERIES_FOREIGN_ID) {
      throw new MockApiError(403, "UNAUTHORIZED");
    }
    const created = createdSeries.get(params.id);
    if (created) {
      const detail: AppointmentSeriesDetail = {
        ...created,
        appointments: occurrencesOf(created.id),
      };
      return { status: 200, data: structuredClone(detail) };
    }
    const series = SERIES[params.id as keyof typeof SERIES];
    if (!series) {
      throw new MockApiError(404, "SERIES_NOT_FOUND");
    }
    return { status: 200, data: structuredClone(series) };
  },
);

registerMockHandler(
  { method: "put", path: "/appointment/series/:id" },
  ({ body, params }) => {
    const series = requireCreatedSeries(params.id);
    const input = body as {
      scheduledAt?: string;
      durationMinutes?: number;
      type?: string;
      observation?: string | null;
    };
    const from = requireFrom(series.id, body);
    if (
      input.scheduledAt === undefined &&
      input.durationMinutes === undefined &&
      input.type === undefined &&
      input.observation === undefined
    ) {
      badRequest("body");
    }
    // RC-11: só a partir de uma ocorrência PENDING de série não encerrada.
    if (from.status !== "PENDING" || series.endedAt) {
      return { status: 409, data: { message: "APPOINTMENT_NOT_EDITABLE" } };
    }
    // RC-05: só a hora de São Paulo vale; o dia de cada ocorrência não muda.
    const time =
      input.scheduledAt === undefined
        ? undefined
        : formatTime(new Date(input.scheduledAt)).split(":").map(Number);
    const fromTime = new Date(from.scheduledAt).getTime();
    const appointments = getMockAppointments();
    const changed: Appointment[] = [];
    const skipped: SeriesResult["skipped"] = [];

    for (const target of occurrencesOf(series.id)) {
      if (
        target.status !== "PENDING" ||
        new Date(target.scheduledAt).getTime() < fromTime
      ) {
        continue;
      }
      const [year, month, day] = dayKey(new Date(target.scheduledAt))
        .split("-")
        .map(Number);
      const scheduledAt = time
        ? new Date(
            toBrasiliaISOString({
              year: year!,
              month: month!,
              day: day!,
              hour: time[0]!,
              minute: time[1]!,
            }),
          ).toISOString()
        : target.scheduledAt;
      const durationMinutes = input.durationMinutes ?? target.durationMinutes;
      const conflicting = findMockConflict(
        { scheduledAt, durationMinutes },
        target.id,
      );
      if (conflicting) {
        skipped.push({
          appointmentId: target.id,
          scheduledAt,
          reason: "CONFLICT",
          conflictingAppointmentId: conflicting.id,
        });
        continue;
      }
      const updated: Appointment = {
        ...target,
        scheduledAt,
        durationMinutes,
        ...(input.type === undefined ? {} : { type: input.type }),
        ...(input.observation === undefined
          ? {}
          : { observation: input.observation }),
      };
      appointments[appointments.findIndex(({ id }) => id === target.id)] =
        updated;
      changed.push(updated);
    }

    Object.assign(series, {
      ...(input.durationMinutes === undefined
        ? {}
        : { durationMinutes: input.durationMinutes }),
      ...(input.type === undefined ? {} : { type: input.type }),
      ...(input.observation === undefined
        ? {}
        : { observation: input.observation }),
    });
    const result: SeriesResult = { series, created: changed, skipped };

    return { status: 200, data: structuredClone(result) };
  },
);

registerMockHandler(
  { method: "post", path: "/appointment/series/:id/cancel" },
  ({ body, params }) => {
    const series = requireCreatedSeries(params.id);
    const from = requireFrom(series.id, body);
    const fromTime = new Date(from.scheduledAt).getTime();
    const appointments = getMockAppointments();
    const cancelled: Appointment[] = [];

    for (const target of occurrencesOf(series.id)) {
      if (
        target.status !== "PENDING" ||
        new Date(target.scheduledAt).getTime() < fromTime
      ) {
        continue;
      }
      const updated: Appointment = { ...target, status: "CANCELLED" };
      appointments[appointments.findIndex(({ id }) => id === target.id)] =
        updated;
      cancelled.push(updated);
    }
    series.endedAt ??= new Date().toISOString();
    const result: SeriesResult = { series, created: cancelled, skipped: [] };

    return { status: 200, data: structuredClone(result) };
  },
);

export const appointmentSeriesMockHandlersRegistered = true;
