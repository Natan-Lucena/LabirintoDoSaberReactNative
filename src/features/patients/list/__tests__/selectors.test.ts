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
    durationMinutes: 50,
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

  it("D14: atendimento futuro já concluído não é o próximo", () => {
    const appointments = [
      makeAppointment({
        id: "done",
        scheduledAt: "2026-10-08T13:00:00.000Z",
        status: "COMPLETED",
      }),
      makeAppointment({ id: "next", scheduledAt: "2026-10-09T13:00:00.000Z" }),
    ];

    expect(
      nextAppointmentByStudentId(
        appointments,
        new Date("2026-10-07T15:00:00.000Z"),
      ).get("patient-1")?.id,
    ).toBe("next");
  });

  describe("REV-PAC: atendimento em andamento", () => {
    const next = (appts: Appointment[], now: string) =>
      nextAppointmentByStudentId(appts, new Date(now)).get("patient-1")?.id;

    it("em andamento (começou há 10 min, 50 min) é o próximo", () => {
      expect(
        next(
          [
            makeAppointment({
              id: "live",
              scheduledAt: "2026-10-07T13:00:00.000Z",
            }),
          ],
          "2026-10-07T13:10:00.000Z",
        ),
      ).toBe("live");
    });

    it("terminado há 1 min não é o próximo", () => {
      expect(
        next(
          [
            makeAppointment({
              id: "over",
              scheduledAt: "2026-10-07T13:00:00.000Z",
            }),
          ],
          "2026-10-07T13:51:00.000Z",
        ),
      ).toBeUndefined();
    });

    it("no instante exato do fim não é o próximo (limite estrito)", () => {
      expect(
        next(
          [
            makeAppointment({
              id: "edge",
              scheduledAt: "2026-10-07T13:00:00.000Z",
            }),
          ],
          "2026-10-07T13:50:00.000Z",
        ),
      ).toBeUndefined();
    });

    it("ignora cancelado e concluído em andamento", () => {
      expect(
        next(
          [
            makeAppointment({ id: "c", status: "CANCELLED" }),
            makeAppointment({ id: "d", status: "COMPLETED" }),
            makeAppointment({
              id: "n",
              scheduledAt: "2026-10-08T13:00:00.000Z",
            }),
          ],
          "2026-10-07T13:10:00.000Z",
        ),
      ).toBe("n");
    });

    it("escolhe o mais cedo entre vários", () => {
      expect(
        next(
          [
            makeAppointment({
              id: "late",
              scheduledAt: "2026-10-09T13:00:00.000Z",
            }),
            makeAppointment({
              id: "live",
              scheduledAt: "2026-10-07T13:00:00.000Z",
            }),
            makeAppointment({
              id: "mid",
              scheduledAt: "2026-10-08T13:00:00.000Z",
            }),
          ],
          "2026-10-07T13:10:00.000Z",
        ),
      ).toBe("live");
    });
  });

  it("AC-PAC-01-03: o tom do avatar é determinístico por paciente", () => {
    expect(patientAvatarTone("patient-1")).toBe(patientAvatarTone("patient-1"));
    expect(["mint", "peach", "lavender"]).toContain(
      patientAvatarTone("patient-2"),
    );
  });
});
