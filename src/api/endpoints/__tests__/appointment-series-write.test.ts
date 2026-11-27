import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  cancelAppointmentSeries,
  createAppointmentSeries,
  getAppointmentSeries,
  updateAppointmentSeries,
} from "@/api/endpoints/appointment-series";
import {
  createAppointment,
  listAppointments,
} from "@/api/endpoints/appointment";
import { MOCK_ARCHIVED_STUDENT_ID } from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockCreatedSeries } from "@/mocks/handlers/appointment-series";
import "@/mocks/install";
import { dayKey, formatTime } from "@/utils/date";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

// Terças, 14:00 em São Paulo, num ano distante para não colidir com as fixtures.
const FIRST = "2031-03-04T17:00:00.000Z";

describe("escritas de série pelo apiClient (AGE-06)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockCreatedSeries();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria a série, grava as ocorrências com seriesId e o detalhe traz todas", async () => {
    const result = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: FIRST,
      frequency: "WEEKLY",
      occurrences: 4,
    });

    expect(result.created).toHaveLength(4);
    expect(result.skipped).toEqual([]);
    expect(result.series).toMatchObject({
      frequency: "WEEKLY",
      occurrences: 4,
    });
    expect(
      (await listAppointments()).filter(
        ({ seriesId }) => seriesId === result.series.id,
      ),
    ).toHaveLength(4);

    const detail = await getAppointmentSeries(result.series.id);
    expect(detail.appointments.map(({ id }) => id)).toEqual(
      result.created.map(({ id }) => id),
    );
  });

  it("pula a ocorrência em conflito e informa a data e o atendimento", async () => {
    const existing = await createAppointment({
      studentId: "student-1",
      scheduledAt: "2031-09-16T17:00:00.000Z",
    });
    const result = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2031-09-02T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 4,
    });

    expect(result.created).toHaveLength(3);
    expect(result.skipped).toEqual([
      {
        scheduledAt: "2031-09-16T17:00:00.000Z",
        reason: "CONFLICT",
        conflictingAppointmentId: existing.id,
      },
    ]);
  });

  it("todas em conflito: 409 APPOINTMENT_CONFLICT", async () => {
    await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2031-05-06T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 2,
    });

    await expect(
      createAppointmentSeries({
        studentId: "student-1",
        scheduledAt: "2031-05-06T17:00:00.000Z",
        frequency: "WEEKLY",
        occurrences: 2,
      }),
    ).rejects.toMatchObject({ status: 409, code: "APPOINTMENT_CONFLICT" });
  });

  it("paciente arquivado: 409 STUDENT_ARCHIVED", async () => {
    await expect(
      createAppointmentSeries({
        studentId: MOCK_ARCHIVED_STUDENT_ID,
        scheduledAt: FIRST,
        frequency: "WEEKLY",
        occurrences: 3,
      }),
    ).rejects.toMatchObject({ status: 409, code: "STUDENT_ARCHIVED" });
  });

  it("rejeita ocorrências fora do limite (quinzenal até 13)", async () => {
    await expect(
      createAppointmentSeries({
        studentId: "student-1",
        scheduledAt: FIRST,
        frequency: "BIWEEKLY",
        occurrences: 14,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("este e os seguintes: muda só a hora das pendentes a partir da escolhida", async () => {
    const { series, created } = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2031-06-03T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 4,
    });

    const result = await updateAppointmentSeries(series.id, {
      fromAppointmentId: created[1]!.id,
      scheduledAt: "2031-06-10T18:00:00.000Z",
    });

    expect(result.created.map(({ id }) => id)).toEqual([
      created[1]!.id,
      created[2]!.id,
      created[3]!.id,
    ]);
    const detail = await getAppointmentSeries(series.id);
    expect(
      detail.appointments.map((a) => formatTime(new Date(a.scheduledAt))),
    ).toEqual(["14:00", "15:00", "15:00", "15:00"]);
    // O dia da semana não muda.
    expect(
      detail.appointments.map((a) => dayKey(new Date(a.scheduledAt))),
    ).toEqual(["2031-06-03", "2031-06-10", "2031-06-17", "2031-06-24"]);
  });

  it("alterar sem nenhum campo: 400; ocorrência de outra série: 400", async () => {
    const { series, created } = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2031-07-01T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 2,
    });

    await expect(
      updateAppointmentSeries(series.id, { fromAppointmentId: created[0]!.id }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      updateAppointmentSeries(series.id, {
        fromAppointmentId: "outra",
        durationMinutes: 60,
      }),
    ).rejects.toMatchObject({ status: 400, code: "APPOINTMENT_NOT_IN_SERIES" });
    await expect(
      updateAppointmentSeries("nao-existe", {
        fromAppointmentId: "x",
        durationMinutes: 60,
      }),
    ).rejects.toMatchObject({ status: 404, code: "SERIES_NOT_FOUND" });
  });

  it("M-03 quinzenal acima de 13 → 400 SERIES_TOO_LONG", async () => {
    await expect(
      createAppointmentSeries({
        studentId: "student-1",
        scheduledAt: FIRST,
        frequency: "BIWEEKLY",
        occurrences: 14,
      }),
    ).rejects.toMatchObject({ status: 400, code: "SERIES_TOO_LONG" });
  });

  it("D-03 conflito com atendimento alheio devolve um id fora da agenda", async () => {
    const result = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2032-01-06T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 3,
      type: "Conflito alheio",
    });
    const own = new Set((await listAppointments()).map(({ id }) => id));

    expect(result.created).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(own.has(result.skipped[0]!.conflictingAppointmentId)).toBe(false);
  });

  it("D-04 e D-11 PUT apaga a observação com null e devolve appointmentId nas puladas", async () => {
    const { series, created } = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2031-10-07T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 2,
      observation: "Antiga",
    });

    const cleared = await updateAppointmentSeries(series.id, {
      fromAppointmentId: created[0]!.id,
      observation: null,
    });
    expect(cleared.created.map(({ observation }) => observation)).toEqual([
      null,
      null,
    ]);

    await createAppointment({
      studentId: "student-1",
      scheduledAt: "2031-10-14T18:00:00.000Z",
    });
    const clash = await updateAppointmentSeries(series.id, {
      fromAppointmentId: created[0]!.id,
      durationMinutes: 70,
    });
    expect(clash.skipped).toEqual([
      expect.objectContaining({ appointmentId: created[1]!.id }),
    ]);
  });

  it("D-06 GET /appointment/ filtra por studentId", async () => {
    const list = await listAppointments({ studentId: "student-1" });

    expect(list.length).toBeGreaterThan(0);
    expect(list.every(({ studentId }) => studentId === "student-1")).toBe(true);
    expect(list.length).toBeLessThan((await listAppointments()).length);
  });

  it("cancelar este e os seguintes encerra a série; repetir é seguro", async () => {
    const { series, created } = await createAppointmentSeries({
      studentId: "student-1",
      scheduledAt: "2031-08-05T17:00:00.000Z",
      frequency: "WEEKLY",
      occurrences: 4,
    });

    const result = await cancelAppointmentSeries(series.id, created[2]!.id);

    expect(result.created.map(({ id }) => id)).toEqual([
      created[2]!.id,
      created[3]!.id,
    ]);
    expect(result.series.endedAt).toBeTruthy();
    const detail = await getAppointmentSeries(series.id);
    expect(detail.appointments.map(({ status }) => status)).toEqual([
      "PENDING",
      "PENDING",
      "CANCELLED",
      "CANCELLED",
    ]);
    await expect(
      cancelAppointmentSeries(series.id, created[2]!.id),
    ).resolves.toMatchObject({ created: [] });
    await expect(
      updateAppointmentSeries(series.id, {
        fromAppointmentId: created[0]!.id,
        durationMinutes: 60,
      }),
    ).rejects.toMatchObject({ status: 409, code: "APPOINTMENT_NOT_EDITABLE" });
  });
});
