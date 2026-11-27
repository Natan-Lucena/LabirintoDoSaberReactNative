import { createElement } from "react";
import { Pressable } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Appointment, SeriesResult, Student } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const routerBack = vi.fn();
const routerPush = vi.fn();
const createAppointmentSeries = vi.fn();
const updateAppointmentSeries = vi.fn();
const updateAppointment = vi.fn();
const getAppointment = vi.fn();

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, push: routerPush }),
}));

vi.mock("@/api/endpoints/appointment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/appointment")>()),
  updateAppointment: (...args: unknown[]) => updateAppointment(...args),
  getAppointment: (...args: unknown[]) => getAppointment(...args),
}));

vi.mock("@/api/endpoints/appointment-series", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/api/endpoints/appointment-series")
  >()),
  createAppointmentSeries: (...args: unknown[]) =>
    createAppointmentSeries(...args),
  updateAppointmentSeries: (...args: unknown[]) =>
    updateAppointmentSeries(...args),
}));

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({ data: students, isPending: false, isError: false }),
}));

// Seletor nativo: no modo "date" escolhe 11/04/2026; no modo "time", 15:30.
vi.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: ({
    mode,
    onValueChange,
  }: {
    mode: string;
    onValueChange: (event: unknown, picked: Date) => void;
  }) =>
    createElement(Pressable, {
      accessibilityLabel: `seletor-${mode}`,
      onPress: () =>
        onValueChange(
          {},
          mode === "time"
            ? new Date(2026, 3, 11, 15, 30)
            : new Date(2026, 3, 11, 12),
        ),
    }),
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

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appt-3",
    educatorId: "educator-1",
    studentId: "student-1",
    scheduledAt: "2026-04-14T17:00:00.000Z",
    type: "Avaliação",
    durationMinutes: 50,
    observation: "Antiga",
    status: "PENDING",
    createdAt: "2026-04-01T12:00:00Z",
    seriesId: "series-1",
    ...overrides,
  };
}

function result(
  created: Appointment[],
  skipped: SeriesResult["skipped"] = [],
): SeriesResult {
  return {
    series: {
      id: "series-1",
      studentId: "student-1",
      educatorId: "educator-1",
      frequency: "WEEKLY",
      firstScheduledAt: "2026-04-11T18:30:00.000Z",
      occurrences: 8,
      durationMinutes: 50,
      createdAt: "2026-04-01T12:00:00Z",
    },
    created,
    skipped,
  };
}

const { AppointmentFormScreen } =
  await import("@/features/agenda/form/AppointmentFormScreen");

async function fillNewAppointment() {
  await fireEvent.press(screen.getByLabelText("Paciente"));
  await fireEvent.press(screen.getByLabelText("Lia Monteiro"));
  await fireEvent.press(screen.getByLabelText("Data"));
  await fireEvent.press(screen.getByLabelText("seletor-date"));
  await fireEvent.press(screen.getByLabelText("Horário"));
  await fireEvent.press(screen.getByLabelText("seletor-time"));
}

describe("AppointmentFormScreen — repetir (AGE-06)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    createAppointmentSeries.mockReset();
    updateAppointmentSeries.mockReset();
    updateAppointment.mockReset();
    getAppointment.mockReset();
  });

  it("semanal mostra a prévia e envia a série com a frequência e a quantidade", async () => {
    createAppointmentSeries.mockResolvedValue(result([appointment()]));
    await render(<AppointmentFormScreen />);
    await fillNewAppointment();
    await fireEvent.press(screen.getByLabelText("Semanal"));

    expect(
      screen.getByText("8 atendimentos, todo sábado às 15:30, até 30/05"),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Agendar 8 atendimentos" }),
    );

    await waitFor(() =>
      expect(createAppointmentSeries.mock.calls[0]![0]).toMatchObject({
        studentId: "student-1",
        frequency: "WEEKLY",
        occurrences: 8,
        scheduledAt: "2026-04-11T18:30:00.000Z",
      }),
    );
  });

  it("quantidade fora do limite bloqueia o envio", async () => {
    await render(<AppointmentFormScreen />);
    await fillNewAppointment();
    await fireEvent.press(screen.getByLabelText("Quinzenal"));
    await fireEvent.changeText(screen.getByLabelText("Quantas vezes"), "14");

    expect(screen.getByText("Escolha de 2 a 13 atendimentos.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Agendar atendimentos" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("AC-AGE-06-02 mostra as puladas com data e hora e não fecha sozinha", async () => {
    createAppointmentSeries.mockResolvedValue(
      result(
        [appointment()],
        [
          {
            scheduledAt: "2026-04-18T18:30:00.000Z",
            reason: "CONFLICT",
            conflictingAppointmentId: "appt-9",
          },
        ],
      ),
    );
    await render(<AppointmentFormScreen />);
    await fillNewAppointment();
    await fireEvent.press(screen.getByLabelText("Semanal"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Agendar 8 atendimentos" }),
    );

    expect(await screen.findByText("1 agendados")).toBeTruthy();
    expect(
      screen.getByText(
        "1 não foram criados porque o horário já estava ocupado:",
      ),
    ).toBeTruthy();
    expect(screen.getByText("18/04 (sábado) às 15:30")).toBeTruthy();
    expect(routerBack).not.toHaveBeenCalled();

    await fireEvent.press(
      screen.getByRole("button", { name: "Ver atendimento" }),
    );
    expect(routerPush).toHaveBeenCalledWith("/agenda/appt-9");
    await fireEvent.press(screen.getByRole("button", { name: "Concluir" }));
    expect(routerBack).toHaveBeenCalled();
  });

  it("todas em conflito mostra a frase da série", async () => {
    const { AppointmentApiError } = await import("@/api/endpoints/appointment");
    createAppointmentSeries.mockRejectedValue(
      new AppointmentApiError({
        message: "APPOINTMENT_CONFLICT",
        status: 409,
        code: "APPOINTMENT_CONFLICT",
        conflictingAppointmentId: "appt-9",
      }),
    );
    await render(<AppointmentFormScreen />);
    await fillNewAppointment();
    await fireEvent.press(screen.getByLabelText("Semanal"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Agendar 8 atendimentos" }),
    );

    expect(
      await screen.findByText(
        "Todos os horários desta série já estão ocupados. Escolha outro horário.",
      ),
    ).toBeTruthy();
  });
});

describe("AppointmentFormScreen — este e os seguintes (AGE-06)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    updateAppointmentSeries.mockReset();
    updateAppointment.mockReset();
    getAppointment.mockReset().mockResolvedValue(appointment());
  });

  it("AC-AGE-06-03 chama a rota da série com fromAppointmentId e a data travada", async () => {
    updateAppointmentSeries.mockResolvedValue(result([appointment()]));
    await render(
      <AppointmentFormScreen
        appointmentId="appt-3"
        mode="edit"
        scope="following"
      />,
    );

    expect(
      await screen.findByText(
        "Para mudar o dia, cancele os seguintes e crie uma série nova.",
      ),
    ).toBeTruthy();
    await fireEvent.changeText(
      screen.getByLabelText("Duração (minutos)"),
      "60",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(updateAppointmentSeries).toHaveBeenCalledWith("series-1", {
        fromAppointmentId: "appt-3",
        durationMinutes: 60,
      }),
    );
    expect(updateAppointment).not.toHaveBeenCalled();
  });

  it("só apagar a observação não envia a série e mostra a dica", async () => {
    await render(
      <AppointmentFormScreen
        appointmentId="appt-3"
        mode="edit"
        scope="following"
      />,
    );

    await fireEvent.changeText(await screen.findByLabelText("Observação"), "");
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    expect(
      await screen.findByText("Para apagar a observação, use Só este."),
    ).toBeTruthy();
    expect(updateAppointmentSeries).not.toHaveBeenCalled();
  });

  it("AC-AGE-06-03 sem scope usa PUT /appointment/:id (só este)", async () => {
    updateAppointment.mockResolvedValue(appointment());
    await render(<AppointmentFormScreen appointmentId="appt-3" mode="edit" />);

    await fireEvent.changeText(
      await screen.findByLabelText("Duração (minutos)"),
      "60",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-3", {
        durationMinutes: 60,
      }),
    );
    expect(updateAppointmentSeries).not.toHaveBeenCalled();
  });
});
