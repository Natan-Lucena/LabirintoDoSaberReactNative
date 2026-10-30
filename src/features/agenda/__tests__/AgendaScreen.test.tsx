import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Appointment, Student } from "@/api/types";
import { fireEvent, render, screen } from "@/test-utils/render";

const push = vi.fn();
const refetchAppointments = vi.fn();
const refetchStudents = vi.fn();
const online = vi.hoisted(() => ({ value: true }));
let appointments: Appointment[] | undefined;
let students: Student[] | undefined;
let appointmentsPending = false;
let appointmentsError = false;

vi.mock("expo-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => online.value }));
vi.mock("@/features/appointments/useAppointments", () => ({
  useAppointments: () => ({
    data: appointments,
    isPending: appointmentsPending,
    isError: appointmentsError,
    refetch: refetchAppointments,
  }),
}));
vi.mock("@/features/students/useStudents", () => ({
  useStudents: () => ({
    data: students,
    isPending: false,
    isError: false,
    refetch: refetchStudents,
  }),
}));

const { AgendaScreen } = await import("@/features/agenda/AgendaScreen");

function appointment(
  id: string,
  day: string,
  hour: number,
  status: Appointment["status"] = "PENDING",
): Appointment {
  return {
    id,
    educatorId: "educator-1",
    studentId: id,
    scheduledAt: `${day}T${String(hour).padStart(2, "0")}:00:00-03:00`,
    status,
    durationMinutes: 50,
    createdAt: "2026-04-01T12:00:00Z",
  };
}

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

describe("AgendaScreen (AGE-01)", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-04-02T12:00:00Z"));
    push.mockClear();
    online.value = true;
    appointmentsPending = false;
    appointmentsError = false;
    appointments = [
      appointment("lia", "2026-04-02", 10),
      appointment("bia", "2026-04-03", 11),
      appointment("davi", "2026-04-02", 9, "COMPLETED"),
      appointment("caio", "2026-04-02", 12, "CANCELLED"),
    ];
    students = [
      student("lia", "Lia"),
      student("bia", "Bia"),
      student("davi", "Davi"),
      student("caio", "Caio"),
    ];
  });

  it("mostra semana atual, hoje ativo, muda dia e navega semanas (AC-AGE-01-01/02)", async () => {
    await render(<AgendaScreen />);
    expect(screen.getByText("2 atendimentos")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Hoje, 2 de abril" }),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "3 de abril" }));
    expect(screen.getByText("1 atendimento")).toBeTruthy();
    expect(screen.getByText("Bia")).toBeTruthy();
    expect(screen.queryByText("Lia")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Próxima semana" }),
    );
    expect(screen.getByText("Nenhum atendimento neste dia")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Semana anterior" }),
    );
    expect(screen.getByText("Bia")).toBeTruthy();
  });

  it("AGE-01: a seta de semana anterior aponta para a esquerda e a próxima para a direita", async () => {
    await render(<AgendaScreen />);
    const tree = JSON.stringify(screen.toJSON());
    const left = tree.indexOf("m15 18-6-6 6-6");
    const right = tree.indexOf("m9 18 6-6-6-6");
    expect(left).toBeGreaterThan(-1);
    expect(right).toBeGreaterThan(left);
  });

  it("mostra status e abre detalhe e criação com dia selecionado (AC-AGE-01-04)", async () => {
    await render(<AgendaScreen />);
    expect(screen.getByText("Concluído")).toBeTruthy();
    expect(screen.getByText("Cancelado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Lia/ }));
    expect(push).toHaveBeenCalledWith({
      pathname: "/agenda/[id]",
      params: { id: "lia" },
    });
    await fireEvent.press(
      screen.getByRole("button", { name: "Novo atendimento" }),
    );
    expect(push).toHaveBeenCalledWith({
      pathname: "/agenda/new",
      params: { date: "2026-04-02" },
    });
  });

  it("mostra duração e tipo de cada atendimento (AGE-03)", async () => {
    appointments = [
      {
        ...appointment("lia", "2026-04-02", 10),
        type: "Psicopedagogia",
        durationMinutes: 50,
      },
      { ...appointment("davi", "2026-04-02", 9), durationMinutes: 30 },
    ];
    await render(<AgendaScreen />);
    expect(screen.getByText("50 min · Psicopedagogia")).toBeTruthy();
    expect(screen.getByText("30 min")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "10:00, Lia, 50 min · Psicopedagogia",
      }),
    ).toBeTruthy();
  });

  it("mostra carregando (AC-AGE-01-05)", async () => {
    appointments = undefined;
    appointmentsPending = true;
    await render(<AgendaScreen />);
    expect(screen.getByText("Carregando agenda...")).toBeTruthy();
  });

  it("mostra erro com retry (AC-AGE-01-05)", async () => {
    appointments = undefined;
    appointmentsError = true;
    await render(<AgendaScreen />);
    expect(
      screen.getByText("Não foi possível carregar a agenda."),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar de novo" }),
    );
    expect(refetchAppointments).toHaveBeenCalled();
  });

  it("mostra dia vazio e banner offline com dados salvos (AC-AGE-01-05)", async () => {
    appointments = [];
    online.value = false;
    await render(<AgendaScreen />);
    expect(screen.getByText("Nenhum atendimento neste dia")).toBeTruthy();
    expect(
      screen.getByText("Sem conexão - mostrando dados salvos"),
    ).toBeTruthy();
  });
});
