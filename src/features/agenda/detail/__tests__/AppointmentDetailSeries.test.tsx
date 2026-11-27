import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type {
  Appointment,
  AppointmentSeriesDetail,
  SeriesResult,
  Student,
} from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const routerBack = vi.fn();
const routerPush = vi.fn();
const getAppointment = vi.fn();
const updateAppointment = vi.fn();
const getAppointmentSeries = vi.fn();
const cancelAppointmentSeries = vi.fn();

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, push: routerPush }),
}));

vi.mock("@/api/endpoints/appointment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/appointment")>()),
  getAppointment: (...args: unknown[]) => getAppointment(...args),
  updateAppointment: (...args: unknown[]) => updateAppointment(...args),
}));

vi.mock("@/api/endpoints/appointment-series", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/api/endpoints/appointment-series")
  >()),
  getAppointmentSeries: (...args: unknown[]) => getAppointmentSeries(...args),
  cancelAppointmentSeries: (...args: unknown[]) =>
    cancelAppointmentSeries(...args),
}));

vi.mock("@/features/evolution/pending/usePendingEvolutions", async (orig) => ({
  ...(await orig<
    typeof import("@/features/evolution/pending/usePendingEvolutions")
  >()),
  usePendingEvolutions: () => ({ data: [] }),
}));

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({ data: students, isPending: false, isError: false }),
}));

const students: Student[] = [
  {
    id: "student-1",
    name: "Lia Monteiro",
    age: 8,
    gender: "female",
    zipcode: "01000-000",
    road: "Rua Fictícia",
    housenumber: "1",
    phonenumber: "11999990000",
    learningTopics: [],
    createdAt: "2026-01-01T12:00:00Z",
    educatorId: "educator-1",
    photoUrl: null,
    documents: [],
  },
];

function occurrence(index: number, status: Appointment["status"] = "PENDING") {
  const day = String(index * 7).padStart(2, "0");
  return {
    id: `appt-${index}`,
    educatorId: "educator-1",
    studentId: "student-1",
    scheduledAt: `2026-05-${day}T17:00:00.000Z`,
    type: "Psicopedagogia",
    durationMinutes: 50,
    observation: null,
    status,
    createdAt: "2026-04-01T12:00:00Z",
    seriesId: "series-1",
  } as Appointment;
}

function seriesDetail(
  overrides: Partial<AppointmentSeriesDetail> = {},
): AppointmentSeriesDetail {
  return {
    id: "series-1",
    studentId: "student-1",
    educatorId: "educator-1",
    frequency: "WEEKLY",
    firstScheduledAt: "2026-05-07T17:00:00.000Z",
    occurrences: 4,
    durationMinutes: 50,
    createdAt: "2026-04-01T12:00:00Z",
    appointments: [
      occurrence(1, "COMPLETED"),
      occurrence(2, "CANCELLED"),
      occurrence(3),
      occurrence(4),
    ],
    ...overrides,
  };
}

const { AppointmentDetailScreen } =
  await import("@/features/agenda/detail/AppointmentDetailScreen");

function button(name: string) {
  return screen.getByRole("button", { name });
}

describe("AppointmentDetailScreen — série (AGE-06)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    getAppointment.mockReset().mockResolvedValue(occurrence(3));
    updateAppointment.mockReset().mockResolvedValue(occurrence(3));
    getAppointmentSeries.mockReset().mockResolvedValue(seriesDetail());
    cancelAppointmentSeries.mockReset();
  });

  it("AC-AGE-06-04 mostra 'Semanal · 3 de 4' a partir da série do servidor", async () => {
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);

    expect(await screen.findByText("Semanal · 3 de 4")).toBeTruthy();
    expect(getAppointmentSeries).toHaveBeenCalledWith("series-1");
  });

  it("série encerrada mostra 'série encerrada' e não pergunta o escopo", async () => {
    getAppointmentSeries.mockResolvedValue(
      seriesDetail({ endedAt: "2026-05-10T12:00:00.000Z" }),
    );
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);

    expect(await screen.findByText("Semanal · série encerrada")).toBeTruthy();
    await fireEvent.press(button("Editar"));
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-3", mode: "edit" },
    });
  });

  it("SERIES_NOT_FOUND: sem a linha de repetição e com as ações comuns", async () => {
    getAppointmentSeries.mockRejectedValue(
      new ApiError({
        message: "SERIES_NOT_FOUND",
        status: 404,
        code: "SERIES_NOT_FOUND",
      }),
    );
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);

    await waitFor(() => expect(getAppointmentSeries).toHaveBeenCalled());
    await screen.findByText("Lia Monteiro");
    expect(screen.queryByText("Repetição")).toBeNull();
    await waitFor(() =>
      expect(button("Editar").props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(button("Editar"));
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-3", mode: "edit" },
    });
  });

  it("Editar: 'Este e os seguintes' abre o formulário com scope=following", async () => {
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);
    await screen.findByText("Semanal · 3 de 4");

    await fireEvent.press(button("Editar"));
    expect(
      screen.getByText("Alterar só este atendimento ou este e os seguintes?"),
    ).toBeTruthy();
    await fireEvent.press(button("Este e os seguintes"));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-3", mode: "edit", scope: "following" },
    });
  });

  it("Remarcar: 'Só este' segue o fluxo atual, sem scope", async () => {
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);
    await screen.findByText("Semanal · 3 de 4");

    await fireEvent.press(button("Remarcar"));
    await fireEvent.press(button("Só este"));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-3", mode: "reschedule" },
    });
  });

  it("Cancelar só este usa PUT /appointment/:id com status CANCELLED", async () => {
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);
    await screen.findByText("Semanal · 3 de 4");

    await fireEvent.press(button("Cancelar atendimento"));
    await fireEvent.press(button("Só este"));

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-3", {
        status: "CANCELLED",
      }),
    );
    expect(cancelAppointmentSeries).not.toHaveBeenCalled();
  });

  it("Cancelar este e os seguintes avisa a quantidade e chama a rota da série", async () => {
    const cancelled: SeriesResult = {
      series: { ...seriesDetail(), endedAt: "2026-05-10T12:00:00.000Z" },
      created: [occurrence(3, "CANCELLED"), occurrence(4, "CANCELLED")],
      skipped: [],
    };
    cancelAppointmentSeries.mockResolvedValue(cancelled);
    await render(<AppointmentDetailScreen appointmentId="appt-3" />);
    await screen.findByText("Semanal · 3 de 4");

    await fireEvent.press(button("Cancelar atendimento"));
    expect(
      screen.getByText(
        /Os 2 atendimentos pendentes a partir de 21\/05 serão cancelados e a série termina\./,
      ),
    ).toBeTruthy();
    await fireEvent.press(button("Este e os seguintes"));

    await waitFor(() =>
      expect(cancelAppointmentSeries).toHaveBeenCalledWith(
        "series-1",
        "appt-3",
      ),
    );
    expect(updateAppointment).not.toHaveBeenCalled();
  });
});
