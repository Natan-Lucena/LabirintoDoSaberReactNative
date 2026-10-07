import { describe, expect, it } from "vitest";

import type { Appointment, Student } from "@/api/types";
import {
  filterPatients,
  nextAppointmentByStudentId,
  patientAvatarTone,
  sortPatientsByName,
} from "@/features/patients/list/selectors";

function makeStudent(overrides: Partial<Student>): Student {
  return {
    id: "patient-1",
    name: "Nome",
    age: 8,
    gender: "female",
    zipcode: "01000-000",
    road: "Rua Fictícia",
    housenumber: "1",
    phonenumber: "11999990000",
    learningTopics: ["Leitura"],
    createdAt: "2026-01-01T12:00:00.000Z",
    educatorId: "educator-1",
    photoUrl: null,
    documents: [],
    educators: [],
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: "appointment-1",
    educatorId: "educator-1",
    studentId: "patient-1",
    scheduledAt: "2026-10-07T13:00:00.000Z",
    status: "PENDING",
    createdAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("PAC-01 selectors", () => {
  const patients = [
    makeStudent({ id: "1", name: "Zeca Alves" }),
    makeStudent({ id: "2", name: "Ágata Souza" }),
  ];

  it("AC-PAC-01-01: busca ignora acento e maiúscula", () => {
    expect(filterPatients(patients, [], "agata", "all")).toEqual([patients[1]]);
    expect(filterPatients(patients, [], "SOUZA", "all")).toEqual([patients[1]]);
  });

  it("ordena alfabeticamente sem modificar os dados da API", () => {
    expect(sortPatientsByName(patients).map((patient) => patient.id)).toEqual([
      "2",
      "1",
    ]);
  });

  it("AC-PAC-01-02: filtra pacientes com atendimento não cancelado hoje em SP", () => {
    const now = new Date("2026-10-07T15:00:00.000Z");
    const appointments = [
      makeAppointment({
        studentId: "1",
        scheduledAt: "2026-10-07T13:00:00.000Z",
      }),
      makeAppointment({
        id: "cancelled",
        studentId: "2",
        scheduledAt: "2026-10-07T14:00:00.000Z",
        status: "CANCELLED",
      }),
    ];

    expect(filterPatients(patients, appointments, "", "today", now)).toEqual([
      patients[0],
    ]);
  });

  it("seleciona o próximo atendimento não cancelado de cada paciente", () => {
    const appointments = [
      makeAppointment({ id: "late", scheduledAt: "2026-10-09T13:00:00.000Z" }),
      makeAppointment({ id: "next", scheduledAt: "2026-10-08T13:00:00.000Z" }),
      makeAppointment({
        id: "cancelled",
        scheduledAt: "2026-10-07T16:00:00.000Z",
        status: "CANCELLED",
      }),
    ];

    expect(
      nextAppointmentByStudentId(
        appointments,
        new Date("2026-10-07T15:00:00.000Z"),
      ).get("patient-1")?.id,
    ).toBe("next");
  });

  it("AC-PAC-01-03: o tom do avatar é determinístico por paciente", () => {
    expect(patientAvatarTone("patient-1")).toBe(patientAvatarTone("patient-1"));
    expect(["mint", "peach", "lavender"]).toContain(
      patientAvatarTone("patient-2"),
    );
  });
});
