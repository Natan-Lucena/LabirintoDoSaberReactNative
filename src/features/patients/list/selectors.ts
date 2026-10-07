import type { Appointment, Student } from "@/api/types";
import type { AvatarTone } from "@/components/ds";
import { dayKey, getTodayKey } from "@/utils/date";

export type PatientFilter = "all" | "today";

const AVATAR_TONES: AvatarTone[] = ["mint", "peach", "lavender"];

export function normalizePatientText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function sortPatientsByName(patients: Student[]): Student[] {
  return [...patients].sort((first, second) =>
    normalizePatientText(first.name).localeCompare(
      normalizePatientText(second.name),
    ),
  );
}

export function patientAvatarTone(patientId: string): AvatarTone {
  let hash = 0;
  for (let index = 0; index < patientId.length; index += 1) {
    hash = (hash * 31 + patientId.charCodeAt(index)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

function patientIdsWithAppointmentToday(
  appointments: Appointment[],
  now: Date,
): Set<string> {
  const today = dayKey(now);
  return new Set(
    appointments
      .filter(
        (appointment) =>
          appointment.status !== "CANCELLED" &&
          dayKey(new Date(appointment.scheduledAt)) === today,
      )
      .map((appointment) => appointment.studentId),
  );
}

export function filterPatients(
  patients: Student[],
  appointments: Appointment[],
  query: string,
  filter: PatientFilter,
  now: Date = new Date(),
): Student[] {
  const normalizedQuery = normalizePatientText(query);
  const todayPatientIds =
    filter === "today"
      ? patientIdsWithAppointmentToday(appointments, now)
      : null;

  return patients.filter(
    (patient) =>
      (!normalizedQuery ||
        normalizePatientText(patient.name).includes(normalizedQuery)) &&
      (!todayPatientIds || todayPatientIds.has(patient.id)),
  );
}

export function nextAppointmentByStudentId(
  appointments: Appointment[],
  now: Date = new Date(),
): Map<string, Appointment> {
  const nextAppointments = new Map<string, Appointment>();
  for (const appointment of appointments) {
    const scheduledAt = new Date(appointment.scheduledAt);
    if (appointment.status === "CANCELLED" || scheduledAt < now) {
      continue;
    }
    const current = nextAppointments.get(appointment.studentId);
    if (!current || scheduledAt < new Date(current.scheduledAt)) {
      nextAppointments.set(appointment.studentId, appointment);
    }
  }
  return nextAppointments;
}

export function formatNextAppointment(appointment: Appointment): string {
  const scheduledAt = new Date(appointment.scheduledAt);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(scheduledAt);
  if (dayKey(scheduledAt) === getTodayKey()) {
    return `Hoje às ${time}`;
  }
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(scheduledAt);
  return `${date} às ${time}`;
}
