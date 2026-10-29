import { createElement } from "react";
import { Pressable } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { Appointment, Student } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const routerBack = vi.fn();
const routerPush = vi.fn();
const createAppointment = vi.fn();
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
  createAppointment: (...args: unknown[]) => createAppointment(...args),
  updateAppointment: (...args: unknown[]) => updateAppointment(...args),
  getAppointment: (...args: unknown[]) => getAppointment(...args),
}));

vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({ data: students, isPending: false, isError: false }),
}));

// Seletor nativo: no modo "date" escolhe 11/04/2026; no modo "time", 15:30.
vi.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: ({
    mode,
    onChange,
  }: {
    mode: string;
    onChange: (event: { type: string }, picked?: Date) => void;
  }) =>
    createElement(Pressable, {
      accessibilityLabel: `seletor-${mode}`,
      onPress: () =>
        onChange(
          { type: "set" },
          mode === "time"
            ? new Date(2026, 3, 11, 15, 30)
            : new Date(2026, 3, 11, 12),
        ),
    }),
}));

function student(id: string, name: string): Student {
  return {
    id,
    name,
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
  };
}

const students = [
  student("student-1", "Lia Monteiro"),
  student("student-2", "Caio Mendes"),
];

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appt-1",
    educatorId: "educator-1",
    studentId: "student-1",
    scheduledAt: "2026-04-10T17:00:00.000Z",
    type: "Avaliação",
    durationMinutes: 50,
    observation: "Antiga",
    status: "PENDING",
    createdAt: "2026-04-01T12:00:00Z",
    ...overrides,
  };
}

const { AppointmentApiError } = await import("@/api/endpoints/appointment");

function conflict(id: string): ApiError {
  return new AppointmentApiError({
    message: "APPOINTMENT_CONFLICT",
    status: 409,
    code: "APPOINTMENT_CONFLICT",
    conflictingAppointmentId: id,
  });
}

const { AppointmentFormScreen } =
  await import("@/features/agenda/form/AppointmentFormScreen");

async function pickStudent(name: string) {
  await fireEvent.press(screen.getByLabelText("Paciente"));
  await fireEvent.press(screen.getByLabelText(name));
}

async function pickDateAndTime() {
  await fireEvent.press(screen.getByLabelText("Data"));
  await fireEvent.press(screen.getByLabelText("seletor-date"));
  await fireEvent.press(screen.getByLabelText("Horário"));
  await fireEvent.press(screen.getByLabelText("seletor-time"));
}

describe("AppointmentFormScreen — novo atendimento (AGE-03)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    createAppointment.mockReset();
    updateAppointment.mockReset();
    getAppointment.mockReset();
  });

  it("bloqueia o envio sem paciente, data e horário", async () => {
    await render(<AppointmentFormScreen />);

    expect(
      screen.getByRole("button", { name: "Agendar atendimento" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("AC-AGE-03-06 pré-preenche paciente e data pelos parâmetros", async () => {
    await render(
      <AppointmentFormScreen studentId="student-2" date="2026-04-10" />,
    );

    expect(screen.getByText("Caio Mendes")).toBeTruthy();
    expect(screen.getByText(/10 de abril de 2026/)).toBeTruthy();
  });

  it("AC-AGE-03-01 envia só o obrigatório, com scheduledAt em ISO UTC", async () => {
    createAppointment.mockResolvedValue(appointment({ id: "novo" }));
    await render(<AppointmentFormScreen />);

    await pickStudent("Lia Monteiro");
    await pickDateAndTime();
    await fireEvent.press(
      screen.getByRole("button", { name: "Agendar atendimento" }),
    );

    await waitFor(() => expect(createAppointment).toHaveBeenCalledOnce());
    const sent = createAppointment.mock.calls[0]![0] as Record<string, unknown>;
    expect(sent).toEqual({
      studentId: "student-1",
      scheduledAt: "2026-04-11T18:30:00.000Z",
    });
    expect(sent).not.toHaveProperty("type");
    expect(sent).not.toHaveProperty("durationMinutes");
    expect(sent).not.toHaveProperty("observation");
    await waitFor(() => expect(routerBack).toHaveBeenCalledOnce());
  });

  it("AC-AGE-03-01 envia tipo, duração e observação quando preenchidos", async () => {
    createAppointment.mockResolvedValue(appointment({ id: "novo" }));
    await render(
      <AppointmentFormScreen studentId="student-1" date="2026-04-10" />,
    );

    await fireEvent.press(screen.getByLabelText("Horário"));
    await fireEvent.press(screen.getByLabelText("seletor-time"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Psicopedagogia" }),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Duração (minutos)"),
      "60",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Observação"),
      "Trazer o caderno",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Agendar atendimento" }),
    );

    await waitFor(() =>
      expect(createAppointment).toHaveBeenCalledWith({
        studentId: "student-1",
        scheduledAt: "2026-04-10T18:30:00.000Z",
        type: "Psicopedagogia",
        durationMinutes: 60,
        observation: "Trazer o caderno",
      }),
    );
  });

  it("valida a duração entre 15 e 240 minutos", async () => {
    await render(
      <AppointmentFormScreen studentId="student-1" date="2026-04-10" />,
    );

    await fireEvent.press(screen.getByLabelText("Horário"));
    await fireEvent.press(screen.getByLabelText("seletor-time"));
    await fireEvent.changeText(
      screen.getByLabelText("Duração (minutos)"),
      "10",
    );

    expect(
      await screen.findByText("A duração deve ser entre 15 e 240 minutos"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Agendar atendimento" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("AC-AGE-03-05 mostra o conflito no campo de horário com o link para o conflitante", async () => {
    createAppointment.mockRejectedValue(conflict("appt-9"));
    await render(
      <AppointmentFormScreen studentId="student-1" date="2026-04-10" />,
    );

    await fireEvent.press(screen.getByLabelText("Horário"));
    await fireEvent.press(screen.getByLabelText("seletor-time"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Agendar atendimento" }),
    );

    expect(
      await screen.findByText("Já existe um atendimento nesse horário"),
    ).toBeTruthy();
    expect(createAppointment).toHaveBeenCalledOnce();
    await fireEvent.press(
      screen.getByRole("button", { name: "Ver atendimento" }),
    );
    expect(routerPush).toHaveBeenCalledWith("/agenda/appt-9");
    expect(routerBack).not.toHaveBeenCalled();
  });
});

describe("AppointmentFormScreen — editar, remarcar e reativar (AGE-03)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    createAppointment.mockReset();
    updateAppointment.mockReset();
    getAppointment.mockReset();
  });

  it("AC-AGE-03-02 editar envia só os campos alterados", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockResolvedValue(appointment({ durationMinutes: 60 }));
    await render(<AppointmentFormScreen appointmentId="appt-1" mode="edit" />);

    await fireEvent.changeText(
      await screen.findByLabelText("Duração (minutos)"),
      "60",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() => expect(updateAppointment).toHaveBeenCalledOnce());
    expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
      durationMinutes: 60,
    });
    expect(updateAppointment.mock.calls[0]![1]).not.toHaveProperty(
      "scheduledAt",
    );
  });

  it("AC-AGE-03-02 limpar a observação envia null", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockResolvedValue(appointment({ observation: null }));
    await render(<AppointmentFormScreen appointmentId="appt-1" mode="edit" />);

    await fireEvent.changeText(await screen.findByLabelText("Observação"), "");
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        observation: null,
      }),
    );
  });

  it("AC-AGE-03-02 remarcar envia só o novo horário", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockResolvedValue(appointment());
    await render(
      <AppointmentFormScreen appointmentId="appt-1" mode="reschedule" />,
    );

    await screen.findByLabelText("Horário");
    await pickDateAndTime();
    await fireEvent.press(
      screen.getByRole("button", { name: "Remarcar atendimento" }),
    );

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        scheduledAt: "2026-04-11T18:30:00.000Z",
      }),
    );
  });

  it("mantém o paciente fixo na edição", async () => {
    getAppointment.mockResolvedValue(appointment());
    await render(<AppointmentFormScreen appointmentId="appt-1" mode="edit" />);

    const field = await screen.findByLabelText("Paciente");
    expect(field.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText("Lia Monteiro")).toBeTruthy();
  });

  it("atendimento concluído só aceita editar a observação", async () => {
    getAppointment.mockResolvedValue(appointment({ status: "COMPLETED" }));
    updateAppointment.mockResolvedValue(appointment());
    await render(<AppointmentFormScreen appointmentId="appt-1" mode="edit" />);

    expect(
      (await screen.findByLabelText("Horário")).props.accessibilityState
        .disabled,
    ).toBe(true);
    expect(screen.getByLabelText("Duração (minutos)").props.editable).toBe(
      false,
    );
    await fireEvent.changeText(
      screen.getByLabelText("Observação"),
      "Nova nota",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar observação" }),
    );

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        observation: "Nova nota",
      }),
    );
  });

  it("reativar envia status PENDING", async () => {
    getAppointment.mockResolvedValue(appointment({ status: "CANCELLED" }));
    updateAppointment.mockResolvedValue(appointment());
    await render(
      <AppointmentFormScreen appointmentId="appt-1" mode="reactivate" />,
    );

    await screen.findByLabelText("Horário");
    await fireEvent.press(
      screen.getByRole("button", { name: "Reativar atendimento" }),
    );
    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        status: "PENDING",
      }),
    );
  });

  it("reativar aceita a remarcação opcional", async () => {
    getAppointment.mockResolvedValue(appointment({ status: "CANCELLED" }));
    updateAppointment.mockResolvedValue(appointment());
    await render(
      <AppointmentFormScreen appointmentId="appt-1" mode="reactivate" />,
    );

    await screen.findByLabelText("Horário");
    await pickDateAndTime();
    await fireEvent.press(
      screen.getByRole("button", { name: "Reativar atendimento" }),
    );
    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        status: "PENDING",
        scheduledAt: "2026-04-11T18:30:00.000Z",
      }),
    );
  });

  it("AC-AGE-03-05 conflito ao remarcar aparece no horário", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockRejectedValue(conflict("appt-7"));
    await render(
      <AppointmentFormScreen appointmentId="appt-1" mode="reschedule" />,
    );

    await screen.findByLabelText("Horário");
    await pickDateAndTime();
    await fireEvent.press(
      screen.getByRole("button", { name: "Remarcar atendimento" }),
    );

    expect(
      await screen.findByText("Já existe um atendimento nesse horário"),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Ver atendimento" }),
    );
    expect(routerPush).toHaveBeenCalledWith("/agenda/appt-7");
  });

  it("mostra a mensagem do 409 de campo não editável, sem reenvio", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockRejectedValue(
      new ApiError({
        message: "APPOINTMENT_NOT_EDITABLE",
        status: 409,
        code: "APPOINTMENT_NOT_EDITABLE",
      }),
    );
    await render(<AppointmentFormScreen appointmentId="appt-1" mode="edit" />);

    await fireEvent.changeText(
      await screen.findByLabelText("Duração (minutos)"),
      "90",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    expect(
      await screen.findByText(
        "Este atendimento não permite alterar horário, tipo ou duração.",
      ),
    ).toBeTruthy();
    expect(updateAppointment).toHaveBeenCalledOnce();
  });

  it("mostra 'Atendimento não encontrado' com Voltar quando o id não existe", async () => {
    getAppointment.mockRejectedValue(
      new ApiError({ message: "NOT_FOUND", status: 400, code: "NOT_FOUND" }),
    );
    await render(<AppointmentFormScreen appointmentId="ghost" mode="edit" />);

    expect(await screen.findByText("Atendimento não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledOnce();
  });
});
