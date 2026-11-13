import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Report } from "@/api/types";

import { buildReportHtml } from "../reportHtml";

const { fileDelete, shareAsync } = vi.hoisted(() => ({
  fileDelete: vi.fn(),
  shareAsync: vi.fn(),
}));

vi.mock("expo-file-system", () => ({
  Paths: { cache: "file://cache/" },
  File: class {
    uri: string;
    constructor(directory: string, name: string) {
      this.uri = `${directory}${name}`;
    }
    create = vi.fn();
    write = vi.fn();
    delete = fileDelete;
  },
}));
vi.mock("expo-sharing", () => ({ shareAsync }));

const report: Report = {
  id: "r1",
  studentId: "s1",
  studentName: "Ana <b>Lima</b>",
  educatorId: "e1",
  type: "PROGRESS",
  audience: "FAMILY",
  period: { from: "2026-10-01", to: "2026-10-31" },
  sections: ["PATIENT_DATA", "SESSION_METRICS"],
  content: {
    title: "Relatório de progresso",
    generatedAt: "2026-11-01T10:00:00Z",
    professional: { name: "Dra. Bia" },
    patient: { displayName: "Ana", ageYears: 8 },
    sessionMetrics: {
      sessions: 3,
      answered: 20,
      accuracy: 0.75,
      byCategory: [{ category: "reading", accuracy: 0.5 }],
    },
    synthesis: "Evoluiu <script>alert(1)</script>",
  },
  synthesisFailed: false,
  createdAt: "2026-11-01T10:00:00Z",
  shares: [],
};

describe("documento do relatório (REL-02)", () => {
  beforeEach(() => {
    fileDelete.mockReset();
    shareAsync.mockReset();
  });

  it("AC-REL-02-01: só traz as seções do content, escapadas, sem contato", () => {
    const html = buildReportHtml(report);

    expect(html).toContain("Dados do paciente");
    expect(html).toContain("75%");
    expect(html).not.toContain("Evolução das sessões");
    expect(html).not.toContain("Resumo da anamnese");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Lima");
    expect(html).not.toMatch(/telefone|e-mail|cpf|endereço/i);
  });

  it("REL-02.1: datas em DD/MM/AAAA, seção vazia com texto e metas em lista", () => {
    const html = buildReportHtml({
      ...report,
      content: {
        ...report.content,
        evolutions: [],
        planProgress: [
          {
            title: "PDI",
            type: "PDI",
            percent: 50,
            goals: [
              { description: "Meta A", status: "IN_PROGRESS" },
              { description: "Meta B", status: "ACHIEVED" },
            ],
          },
        ],
      },
    });

    expect(html).toContain("01/10/2026 a 31/10/2026");
    expect(html).not.toContain("2026-10-01");
    expect(html).toContain("Sem evoluções no período.");
    expect(html).toContain("<li>Meta A · Em andamento</li>");
    expect(html).toContain("<li>Meta B · Atingida</li>");
  });

  it("AC-REL-02-03: apaga o arquivo temporário depois de compartilhar, mesmo se falhar", async () => {
    const { sharePdfFromBase64 } = await import("../../sharePdf");

    await sharePdfFromBase64("abc", "r.pdf", { deleteAfterShare: true });
    expect(fileDelete).toHaveBeenCalledTimes(1);

    shareAsync.mockRejectedValueOnce(new Error("cancelado"));
    await expect(
      sharePdfFromBase64("abc", "r.pdf", { deleteAfterShare: true }),
    ).rejects.toThrow("cancelado");
    expect(fileDelete).toHaveBeenCalledTimes(2);
  });
});
