import { describe, expect, it } from "vitest";

import type { EvolutionContext, SessionEvolution } from "@/api/types";
import {
  ATTEMPTS_REQUIRED_MESSAGE,
  attemptsLabel,
  emptyCriterion,
  evolutionCriterionSchema,
  evolutionFormSchema,
  evolutionToFormValues,
  initialEvolutionValues,
  SUCCESSES_OVER_ATTEMPTS_MESSAGE,
  toCreatePayload,
  toUpdatePayload,
  type EvolutionCriterionValues,
} from "../schema";

const CONTEXT: EvolutionContext = {
  session: {
    id: "session-1",
    studentId: "student-1",
    studentName: "Paciente Fictício",
    name: "Contagem",
    startedAt: "2026-10-27T13:00:00.000Z",
    finishedAt: "2026-10-27T13:50:00.000Z",
    durationMinutes: 50,
    answeredCount: 3,
    correctCount: 2,
  },
  plan: { id: "plan-1", type: "PE", title: "Contagem até 20" },
  suggestedCriteria: [
    {
      goalId: "goal-1",
      description: "Contar objetos até 10",
      successCriterion: "8 de 10",
      goalStatus: "IN_PROGRESS",
    },
    {
      goalId: "goal-2",
      description: "Associar quantidade e numeral",
      goalStatus: "NOT_STARTED",
    },
  ],
};

function criterion(
  overrides: Partial<EvolutionCriterionValues> = {},
): EvolutionCriterionValues {
  return { ...emptyCriterion(), description: "Contar", ...overrides };
}

function successesError(values: EvolutionCriterionValues): string | undefined {
  const result = evolutionCriterionSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === "successes")
    ?.message;
}

describe("schema da evolução (EVO-01)", () => {
  describe("AC-EVO-01-03: acertos e tentativas", () => {
    it("bloqueia acertos maiores que as tentativas", () => {
      expect(
        successesError(criterion({ attempts: "10", successes: "11" })),
      ).toBe(SUCCESSES_OVER_ATTEMPTS_MESSAGE);
    });

    it("aceita acertos iguais ou menores que as tentativas", () => {
      expect(
        evolutionCriterionSchema.safeParse(
          criterion({ attempts: "10", successes: "10" }),
        ).success,
      ).toBe(true);
      expect(
        evolutionCriterionSchema.safeParse(
          criterion({ attempts: "10", successes: "8" }),
        ).success,
      ).toBe(true);
      expect(
        evolutionCriterionSchema.safeParse(
          criterion({ attempts: "0", successes: "0" }),
        ).success,
      ).toBe(true);
    });

    it("acertos exigem tentativas (EV-04)", () => {
      expect(successesError(criterion({ successes: "3" }))).toBe(
        ATTEMPTS_REQUIRED_MESSAGE,
      );
    });

    it("tentativas e acertos são opcionais", () => {
      expect(evolutionCriterionSchema.safeParse(criterion()).success).toBe(
        true,
      );
      expect(
        evolutionCriterionSchema.safeParse(criterion({ attempts: "4" }))
          .success,
      ).toBe(true);
    });

    it("recusa contagem fora de 0 a 100 ou não inteira", () => {
      for (const attempts of ["101", "-1", "2.5", "dez"]) {
        expect(
          evolutionCriterionSchema.safeParse(criterion({ attempts })).success,
        ).toBe(false);
      }
    });
  });

  it("exige descrição do critério e registro descritivo", () => {
    expect(
      evolutionCriterionSchema.safeParse(criterion({ description: "  " }))
        .success,
    ).toBe(false);
    expect(
      evolutionFormSchema.safeParse({ criteria: [], descriptiveRecord: " " })
        .success,
    ).toBe(false);
    expect(
      evolutionFormSchema.safeParse({
        criteria: [],
        descriptiveRecord: "Ok",
      }).success,
    ).toBe(true);
  });

  it("aceita no máximo 20 critérios", () => {
    const many = Array.from({ length: 21 }, () => criterion());
    expect(
      evolutionFormSchema.safeParse({ criteria: many, descriptiveRecord: "Ok" })
        .success,
    ).toBe(false);
  });

  it("monta o rótulo '8 de 10 tentativas'", () => {
    expect(attemptsLabel("10", "8")).toBe("8 de 10 tentativas");
    expect(attemptsLabel("1", "1")).toBe("1 de 1 tentativa");
    expect(attemptsLabel("", "8")).toBeNull();
    expect(attemptsLabel("5", "8")).toBeNull();
  });

  describe("valores iniciais e corpo do POST", () => {
    it("parte dos critérios sugeridos do PE, sem resultado avaliado", () => {
      const values = initialEvolutionValues(CONTEXT);

      expect(values.descriptiveRecord).toBe("");
      expect(values.criteria).toHaveLength(2);
      expect(values.criteria[0]).toMatchObject({
        goalId: "goal-1",
        description: "Contar objetos até 10",
        successCriterion: "8 de 10",
        result: "NOT_OBSERVED",
        initialGoalStatus: "IN_PROGRESS",
        goalStatus: "IN_PROGRESS",
      });
    });

    it("sem PE, não há critérios (G-57)", () => {
      const { plan: _plan, ...rest } = CONTEXT;
      expect(
        initialEvolutionValues({ ...rest, suggestedCriteria: [] }).criteria,
      ).toEqual([]);
    });

    it("envia planId, critérios convertidos e só os goalUpdates que mudaram", () => {
      const values = initialEvolutionValues(CONTEXT);
      values.criteria[0] = {
        ...values.criteria[0]!,
        result: "ACHIEVED",
        attempts: "10",
        successes: "8",
        note: "  Contou sem ajuda.  ",
        goalStatus: "ACHIEVED",
      };
      values.criteria.push(
        criterion({ description: "  Esperar a vez  ", result: "PARTIAL" }),
      );
      values.descriptiveRecord = "  Sessão tranquila.  ";

      expect(toCreatePayload("session-1", CONTEXT, values)).toEqual({
        sessionId: "session-1",
        planId: "plan-1",
        criteria: [
          {
            goalId: "goal-1",
            description: "Contar objetos até 10",
            successCriterion: "8 de 10",
            attempts: 10,
            successes: 8,
            result: "ACHIEVED",
            note: "Contou sem ajuda.",
          },
          {
            goalId: "goal-2",
            description: "Associar quantidade e numeral",
            result: "NOT_OBSERVED",
          },
          { description: "Esperar a vez", result: "PARTIAL" },
        ],
        descriptiveRecord: "Sessão tranquila.",
        goalUpdates: [{ goalId: "goal-1", status: "ACHIEVED" }],
      });
    });

    it("sem PE, envia só o registro descritivo", () => {
      const { plan: _plan, ...rest } = CONTEXT;
      const context = { ...rest, suggestedCriteria: [] };

      expect(
        toCreatePayload("session-1", context, {
          criteria: [],
          descriptiveRecord: "Só o registro.",
        }),
      ).toEqual({
        sessionId: "session-1",
        criteria: [],
        descriptiveRecord: "Só o registro.",
      });
    });

    it("toCreatePayload recusa acertos acima das tentativas antes do envio", () => {
      const values = initialEvolutionValues(CONTEXT);
      values.criteria[0] = {
        ...values.criteria[0]!,
        attempts: "3",
        successes: "4",
      };
      values.descriptiveRecord = "Registro.";

      expect(() => toCreatePayload("session-1", CONTEXT, values)).toThrow();
    });
  });
});

describe("edição da evolução (EVO-02)", () => {
  const EVOLUTION: SessionEvolution = {
    id: "evolution-1",
    sessionId: "session-1",
    studentId: "student-1",
    educatorId: "educator-1",
    planId: "plan-1",
    planType: "PE",
    sessionDate: "2026-10-27",
    criteria: [
      {
        id: "c1",
        goalId: "goal-1",
        description: "Contar até 10",
        successCriterion: "8 de 10",
        attempts: 10,
        successes: 8,
        result: "ACHIEVED",
        note: "Sem ajuda.",
      },
      { id: "c2", description: "Atenção", result: "PARTIAL" },
    ],
    descriptiveRecord: "Registro.",
    goalUpdates: [],
    createdAt: "2026-10-27T14:00:00.000Z",
    updatedAt: "2026-10-27T14:00:00.000Z",
  };

  it("preenche o formulário com o que a evolução já tem", () => {
    const values = evolutionToFormValues(EVOLUTION);

    expect(values.descriptiveRecord).toBe("Registro.");
    expect(values.criteria[0]).toMatchObject({
      goalId: "goal-1",
      attempts: "10",
      successes: "8",
      note: "Sem ajuda.",
    });
    expect(values.criteria[1]).toMatchObject({
      attempts: "",
      successes: "",
      note: "",
    });
    expect(evolutionFormSchema.safeParse(values).success).toBe(true);
  });

  it("monta o PUT com a lista completa de critérios, sem goalUpdates nem ids", () => {
    const payload = toUpdatePayload(evolutionToFormValues(EVOLUTION));

    expect(payload).toEqual({
      criteria: [
        {
          goalId: "goal-1",
          description: "Contar até 10",
          successCriterion: "8 de 10",
          attempts: 10,
          successes: 8,
          result: "ACHIEVED",
          note: "Sem ajuda.",
        },
        { description: "Atenção", result: "PARTIAL" },
      ],
      descriptiveRecord: "Registro.",
    });
  });

  it("recusa o que o formulário não aceita", () => {
    const values = evolutionToFormValues(EVOLUTION);
    values.descriptiveRecord = "   ";
    expect(() => toUpdatePayload(values)).toThrow();
  });
});
