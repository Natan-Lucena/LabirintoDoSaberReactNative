import { describe, expect, it } from "vitest";

import {
  appointmentReminderMessage,
  buildWhatsAppUrl,
  patientContactMessage,
  pickContactPhone,
} from "@/utils/whatsapp";

describe("AGE-02 WhatsApp", () => {
  it("AC-AGE-02-01 prioriza responsável e normaliza telefone com máscara ou DDI", () => {
    expect(
      pickContactPhone({
        guardianPhone: "(11) 97777-6666",
        phonenumber: "11999990000",
      }),
    ).toBe("(11) 97777-6666");
    expect(buildWhatsAppUrl("(11) 97777-6666", "Olá!")).toBe(
      "https://wa.me/5511977776666?text=Ol%C3%A1!",
    );
    expect(buildWhatsAppUrl("+55 (11) 97777-6666", "Olá!")).toBe(
      "https://wa.me/5511977776666?text=Ol%C3%A1!",
    );
    expect(buildWhatsAppUrl("", "Olá!")).toBeNull();
    expect(
      pickContactPhone({ guardianPhone: null, phonenumber: "11999990000" }),
    ).toBe("11999990000");
  });

  it("AGE-02.1: número nacional com DDD 55 (RS) também recebe o código do país", () => {
    // 10 ou 11 dígitos = DDD + número; o DDD 55 não é o código do país.
    expect(buildWhatsAppUrl("(55) 99999-8888", "Olá!")).toBe(
      "https://wa.me/5555999998888?text=Ol%C3%A1!",
    );
    expect(buildWhatsAppUrl("(55) 3222-1111", "Olá!")).toBe(
      "https://wa.me/555532221111?text=Ol%C3%A1!",
    );
    // Já com o código do país (12 ou 13 dígitos), não duplica.
    expect(buildWhatsAppUrl("+55 (55) 99999-8888", "Olá!")).toBe(
      "https://wa.me/5555999998888?text=Ol%C3%A1!",
    );
    expect(buildWhatsAppUrl("55 (11) 3222-1111", "Olá!")).toBe(
      "https://wa.me/551132221111?text=Ol%C3%A1!",
    );
  });

  it("AC-AGE-02-02 formata lembrete no fuso de São Paulo", () => {
    expect(
      appointmentReminderMessage({
        guardianName: "Ana",
        studentName: "Lia",
        scheduledAt: "2026-04-10T17:00:00Z",
      }),
    ).toBe(
      "Olá, Ana! Passando para lembrar do atendimento de Lia na sexta-feira, 10/04, às 14:00. Qualquer imprevisto, é só avisar por aqui.",
    );
    expect(
      appointmentReminderMessage({
        guardianName: null,
        studentName: "Lia",
        scheduledAt: "2026-04-10T17:00:00Z",
      }),
    ).toMatch(/^Olá! Passando/);
  });

  it("AC-AGE-02-02 usa 'no' para sábado e domingo e 'na' para dias úteis", () => {
    const msg = (scheduledAt: string) =>
      appointmentReminderMessage({ studentName: "Lia", scheduledAt });
    expect(msg("2026-04-11T17:00:00Z")).toContain("no sábado, 11/04");
    expect(msg("2026-04-12T17:00:00Z")).toContain("no domingo, 12/04");
    expect(msg("2026-04-14T17:00:00Z")).toContain("na terça-feira, 14/04");
  });

  it("AC-AGE-02-02 omite apresentação quando educador não tem nome", () => {
    expect(
      patientContactMessage({
        guardianName: "Ana",
        educatorName: "Aline",
        studentName: "Lia",
      }),
    ).toBe("Olá, Ana! Tudo bem? Aqui é Aline, do acompanhamento de Lia.");
    expect(
      patientContactMessage({
        guardianName: null,
        educatorName: null,
        studentName: "Lia",
      }),
    ).toBe("Olá! Tudo bem? Falo sobre o acompanhamento de Lia.");
  });
});
