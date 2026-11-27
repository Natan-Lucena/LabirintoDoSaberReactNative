import { describe, expect, it } from "vitest";

import { primaryStatusLabel } from "@/features/patients/overview/labels";
import {
  pendingLabel,
  pendingRoute,
} from "@/features/patients/overview/pendings";

describe("primaryStatusLabel (AC-PAC-10-01)", () => {
  it("traduz os quatro status e ignora o desconhecido", () => {
    const base = { studentId: "s", pendings: [] };
    expect(primaryStatusLabel({ ...base, primaryStatus: "PDI_ACTIVE" })).toBe(
      "PDI ativo",
    );
    expect(
      primaryStatusLabel({ ...base, primaryStatus: "ASSESSMENT_PENDING" }),
    ).toBe("Avaliação pendente");
    expect(primaryStatusLabel({ ...base, primaryStatus: "NO_PLAN" })).toBe(
      "Sem plano",
    );
    expect(primaryStatusLabel({ ...base, primaryStatus: "PLAN_REVIEW" })).toBe(
      "Plano em revisão",
    );
    expect(
      primaryStatusLabel({
        ...base,
        primaryStatus: "PLAN_REVIEW",
        activePlan: { id: "p", type: "PDI", title: "t", percent: 1 },
      }),
    ).toBe("PDI em revisão");
    expect(
      primaryStatusLabel({ ...base, primaryStatus: "OUTRO" as never }),
    ).toBeUndefined();
    expect(primaryStatusLabel(undefined)).toBeUndefined();
  });
});

describe("pendingRoute (AC-PAC-10-03)", () => {
  it("evolução: sessão com targetId, hub sem", () => {
    expect(
      pendingRoute(
        { kind: "EVOLUTION_PENDING", count: 1, targetId: "ses" },
        "s",
      ),
    ).toEqual({
      type: "route",
      route: {
        pathname: "/evolution/[sessionId]",
        params: { sessionId: "ses", from: "entry" },
      },
    });
    expect(pendingRoute({ kind: "EVOLUTION_PENDING", count: 2 }, "s")).toEqual({
      type: "route",
      route: "/evolution",
    });
  });

  it("plano: detalhe com targetId, aba Planos sem", () => {
    expect(
      pendingRoute({ kind: "PLAN_REVIEW_DUE", count: 1, targetId: "pl" }, "s"),
    ).toEqual({
      type: "route",
      route: { pathname: "/plans/[id]", params: { id: "pl" } },
    });
    expect(pendingRoute({ kind: "PLAN_REVIEW_DUE", count: 2 }, "s")).toEqual({
      type: "tab",
      tab: "plans",
    });
  });

  it("escala: aplicação com targetId, aba Avaliações sem", () => {
    expect(
      pendingRoute({ kind: "SCALE_DRAFT", count: 1, targetId: "ap" }, "s"),
    ).toEqual({ type: "scale", applicationId: "ap" });
    expect(pendingRoute({ kind: "SCALE_DRAFT", count: 3 }, "s")).toEqual({
      type: "tab",
      tab: "assessments",
    });
  });

  it("anamnese: sempre a anamnese do paciente", () => {
    expect(pendingRoute({ kind: "ANAMNESIS_MISSING", count: 1 }, "s9")).toEqual(
      {
        type: "route",
        route: { pathname: "/patients/[id]/anamnese", params: { id: "s9" } },
      },
    );
  });

  it("rótulos no singular e no plural", () => {
    expect(pendingLabel({ kind: "EVOLUTION_PENDING", count: 1 })).toBe(
      "Evolução pendente",
    );
    expect(pendingLabel({ kind: "EVOLUTION_PENDING", count: 3 })).toBe(
      "3 evoluções pendentes",
    );
    expect(pendingLabel({ kind: "SCALE_DRAFT", count: 2 })).toBe(
      "2 escalas em rascunho",
    );
  });
});
