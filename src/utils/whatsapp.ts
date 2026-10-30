import type { Student } from "@/api/types";
import { formatTime, TIME_ZONE } from "@/utils/date";

export function pickContactPhone(
  student: Pick<Student, "guardianPhone" | "phonenumber">,
): string | null {
  return student.guardianPhone?.replace(/\D/g, "")
    ? student.guardianPhone
    : student.phonenumber || null;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  // 10 ou 11 dígitos = DDD + número (nacional): sempre recebe o código do
  // país, inclusive com o DDD 55 (RS). Com 12 ou 13 dígitos, já tem o 55.
  const number =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function greeting(name: string | null | undefined): string {
  return name?.trim() ? `Olá, ${name.trim()}!` : "Olá!";
}

export function appointmentReminderMessage({
  guardianName,
  studentName,
  scheduledAt,
}: {
  guardianName?: string | null;
  studentName: string;
  scheduledAt: string;
}): string {
  const date = new Date(scheduledAt);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
  const shortDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `${greeting(guardianName)} Passando para lembrar do atendimento de ${studentName} ${/^(sábado|domingo)/.test(weekday) ? "no" : "na"} ${weekday}, ${shortDate}, às ${formatTime(date)}. Qualquer imprevisto, é só avisar por aqui.`;
}

export function patientContactMessage({
  guardianName,
  educatorName,
  studentName,
}: {
  guardianName?: string | null;
  educatorName?: string | null;
  studentName: string;
}): string {
  return `${greeting(guardianName)} Tudo bem? ${educatorName?.trim() ? `Aqui é ${educatorName.trim()}, do acompanhamento de` : "Falo sobre o acompanhamento de"} ${studentName}.`;
}
