import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { Appointment, Student } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";

const routerBack = vi.fn();
const routerPush = vi.fn();
const getAppointment = vi.fn();
const updateAppointment = vi.fn();
const deleteAppointment = vi.fn();

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
  deleteAppointment: (...args: unknown[]) => deleteAppointment(...args),
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

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appt-1",
    educatorId: "educator-1",
    studentId: "student-1",
    scheduledAt: "2026-04-10T17:00:00.000Z",
    type: "Psicopedagogia",
    durationMinutes: 50,
    observation: "Trazer o caderno",
    status: "PENDING",
    createdAt: "2026-04-01T12:00:00Z",
    ...overrides,
  };
}

const { AppointmentDetailScreen } =
  await import("@/features/agenda/detail/AppointmentDetailScreen");

function button(name: string) {
  return screen.queryByRole("button", { name });
}

describe("AppointmentDetailScreen (AGE-03)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    getAppointment.mockReset();
    updateAppointment.mockReset();
    deleteAppointment.mockReset();
  });

  it("mostra paciente, data, horário, tipo, duração, status e observação", async () => {
    getAppointment.mockResolvedValue(appointment());
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    expect(await screen.findByText("Lia Monteiro")).toBeTruthy();
    expect(screen.getByText(/10 de abril de 2026/)).toBeTruthy();
    expect(screen.getByText("14:00")).toBeTruthy();
    expect(screen.getByText("Psicopedagogia")).toBeTruthy();
    expect(screen.getByText("50 min")).toBeTruthy();
    expect(screen.getByText("Pendente")).toBeTruthy();
    expect(screen.getByText("Trazer o caderno")).toBeTruthy();
  });

  it("tocar no paciente abre a ficha dele", async () => {
    getAppointment.mockResolvedValue(appointment());
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Lia Monteiro" }),
    );
    expect(routerPush).toHaveBeenCalledWith("/patients/student-1");
  });

  it("AC-AGE-04-01 PENDING: Iniciar sessão abre o fluxo com paciente e atendimento", async () => {
    getAppointment.mockResolvedValue(appointment());
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await screen.findByText("Lia Monteiro");
    await fireEvent.press(button("Iniciar sessão")!);
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/session/student",
      params: { studentId: "student-1", appointmentId: "appt-1" },
    });
  });

  it.each(["COMPLETED", "CANCELLED"] as const)(
    "AC-AGE-04-04 %s não mostra Iniciar sessão",
    async (status) => {
      getAppointment.mockResolvedValue(appointment({ status }));
      await render(<AppointmentDetailScreen appointmentId="appt-1" />);

      await screen.findByText("Lia Monteiro");
      expect(button("Iniciar sessão")).toBeNull();
    },
  );

  it("AC-AGE-03-04 PENDING oferece remarcar, editar, concluir, cancelar e excluir", async () => {
    getAppointment.mockResolvedValue(appointment());
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await screen.findByText("Lia Monteiro");
    for (const name of [
      "Remarcar",
      "Editar",
      "Marcar como concluído",
      "Cancelar atendimento",
      "Excluir atendimento",
    ]) {
      expect(button(name), name).toBeTruthy();
    }
    expect(button("Reativar")).toBeNull();
    expect(button("Editar observação")).toBeNull();
    expect(button("Iniciar sessão")).toBeTruthy();

    await fireEvent.press(button("Remarcar")!);
    expect(routerPush).toHaveBeenLastCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-1", mode: "reschedule" },
    });
    await fireEvent.press(button("Editar")!);
    expect(routerPush).toHaveBeenLastCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-1", mode: "edit" },
    });
  });

  it("AC-AGE-03-04 CANCELLED oferece reativar, editar observação e excluir", async () => {
    getAppointment.mockResolvedValue(appointment({ status: "CANCELLED" }));
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await screen.findByText("Cancelado");
    expect(button("Reativar")).toBeTruthy();
    expect(button("Editar observação")).toBeTruthy();
    expect(button("Excluir atendimento")).toBeTruthy();
    for (const name of [
      "Remarcar",
      "Editar",
      "Marcar como concluído",
      "Cancelar atendimento",
    ]) {
      expect(button(name), name).toBeNull();
    }

    await fireEvent.press(button("Reativar")!);
    expect(routerPush).toHaveBeenLastCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-1", mode: "reactivate" },
    });
    await fireEvent.press(button("Editar observação")!);
    expect(routerPush).toHaveBeenLastCalledWith({
      pathname: "/agenda/[id]/edit",
      params: { id: "appt-1", mode: "observation" },
    });
  });

  it("AC-AGE-03-04 COMPLETED oferece só editar a observação", async () => {
    getAppointment.mockResolvedValue(appointment({ status: "COMPLETED" }));
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await screen.findByText("Concluído");
    expect(button("Editar observação")).toBeTruthy();
    for (const name of [
      "Reativar",
      "Remarcar",
      "Editar",
      "Marcar como concluído",
      "Cancelar atendimento",
      "Excluir atendimento",
    ]) {
      expect(button(name), name).toBeNull();
    }
  });

  it("marcar como concluído envia status COMPLETED", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockResolvedValue(appointment({ status: "COMPLETED" }));
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Marcar como concluído" }),
    );
    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        status: "COMPLETED",
      }),
    );
  });

  it("AC-AGE-03-03 cancelar só chama a API depois da confirmação", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockResolvedValue(appointment({ status: "CANCELLED" }));
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Cancelar atendimento" }),
    );
    expect(
      screen.getByText("O atendimento fica na agenda como cancelado."),
    ).toBeTruthy();
    expect(updateAppointment).not.toHaveBeenCalled();

    await fireEvent.press(button("Manter")!);
    expect(
      screen.queryByText("O atendimento fica na agenda como cancelado."),
    ).toBeNull();
    expect(updateAppointment).not.toHaveBeenCalled();

    await fireEvent.press(button("Cancelar atendimento")!);
    await fireEvent.press(button("Sim, cancelar")!);
    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith("appt-1", {
        status: "CANCELLED",
      }),
    );
  });

  it("AC-AGE-03-03 excluir só chama a API depois da confirmação e volta", async () => {
    getAppointment.mockResolvedValue(appointment());
    deleteAppointment.mockResolvedValue(undefined);
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Excluir atendimento" }),
    );
    expect(screen.getByText("Excluir atendimento?")).toBeTruthy();
    expect(
      screen.getByText("Ele sai da agenda e não pode ser recuperado."),
    ).toBeTruthy();
    expect(deleteAppointment).not.toHaveBeenCalled();

    await fireEvent.press(button("Manter")!);
    expect(deleteAppointment).not.toHaveBeenCalled();

    await fireEvent.press(button("Excluir atendimento")!);
    await fireEvent.press(button("Excluir")!);
    await waitFor(() =>
      expect(deleteAppointment).toHaveBeenCalledWith("appt-1"),
    );
    await waitFor(() => expect(routerBack).toHaveBeenCalledOnce());
  });

  it("mostra o erro 409 de transição sem reenvio automático", async () => {
    getAppointment.mockResolvedValue(appointment());
    updateAppointment.mockRejectedValue(
      new ApiError({
        message: "INVALID_STATUS_TRANSITION",
        status: 409,
        code: "INVALID_STATUS_TRANSITION",
      }),
    );
    await render(<AppointmentDetailScreen appointmentId="appt-1" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Marcar como concluído" }),
    );

    expect(
      await screen.findByText("Essa mudança de status não é permitida."),
    ).toBeTruthy();
    expect(updateAppointment).toHaveBeenCalledOnce();
  });

  it("mostra 'Atendimento não encontrado' com Voltar para 400 NOT_FOUND", async () => {
    getAppointment.mockRejectedValue(
      new ApiError({ message: "NOT_FOUND", status: 400, code: "NOT_FOUND" }),
    );
    await render(<AppointmentDetailScreen appointmentId="ghost" />);

    expect(await screen.findByText("Atendimento não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledOnce();
  });
});
