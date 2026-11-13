// Formulário da Evolução da sessão (EVO-01). Regras do contrato PROVISÓRIO
// (docs/entrega-4/ESPECIFICACAO-BACKEND.md §3): 0 a 20 critérios, descrição e
// nota até 500, registro descritivo de 1 a 5000, tentativas e acertos de 0 a
// 100, e `successes ≤ attempts`, com `successes` exigindo `attempts` (EV-04).
import { z } from "zod";

import type {
  CreateSessionEvolutionPayload,
  CriterionResult,
  EvolutionContext,
  EvolutionCriterionInput,
  GoalStatus,
  SessionEvolution,
  UpdateSessionEvolutionPayload,
} from "@/api/types";

export const CRITERION_RESULTS = [
  "ACHIEVED",
  "PARTIAL",
  "NOT_ACHIEVED",
  "NOT_OBSERVED",
] as const satisfies readonly CriterionResult[];

export const GOAL_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ACHIEVED",
  "DISCONTINUED",
] as const satisfies readonly GoalStatus[];

export const criterionResultLabels: Record<CriterionResult, string> = {
  ACHIEVED: "Atingido",
  PARTIAL: "Parcial",
  NOT_ACHIEVED: "Não atingido",
  NOT_OBSERVED: "Não observado",
};

/** Mesmos rótulos do detalhe do plano (PLN-04). */
export const goalStatusLabels: Record<GoalStatus, string> = {
  NOT_STARTED: "Não iniciada",
  IN_PROGRESS: "Em andamento",
  ACHIEVED: "Atingida",
  DISCONTINUED: "Descontinuada",
};

export const MAX_CRITERIA = 20;
export const MAX_COUNT = 100;
export const MAX_RECORD = 5000;
export const MAX_TEXT = 500;

export const ATTEMPTS_REQUIRED_MESSAGE =
  "Informe as tentativas para registrar os acertos.";
export const SUCCESSES_OVER_ATTEMPTS_MESSAGE =
  "Os acertos não podem passar das tentativas.";

/** Campo numérico opcional como texto: vazio ou inteiro de 0 a 100. */
const countField = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || (/^\d+$/.test(value) && Number(value) <= MAX_COUNT),
    `Use um número inteiro de 0 a ${MAX_COUNT}.`,
  );

function parseCount(value: string): number | undefined {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
}

export const evolutionCriterionSchema = z
  .object({
    /** Meta do PE; ausente = critério livre. */
    goalId: z.string().optional(),
    description: z
      .string()
      .trim()
      .min(1, "Descreva o critério.")
      .max(MAX_TEXT, `Use no máximo ${MAX_TEXT} caracteres.`),
    successCriterion: z.string().optional(),
    result: z.enum(CRITERION_RESULTS),
    attempts: countField,
    successes: countField,
    note: z.string().max(MAX_TEXT, `Use no máximo ${MAX_TEXT} caracteres.`),
    /** Estado da meta no servidor quando a tela abriu. */
    initialGoalStatus: z.enum(GOAL_STATUSES).optional(),
    /** Estado escolhido em "Atualizar prontuário" (vira `goalUpdates`). */
    goalStatus: z.enum(GOAL_STATUSES).optional(),
  })
  .superRefine((criterion, ctx) => {
    const attempts = parseCount(criterion.attempts);
    const successes = parseCount(criterion.successes);
    if (successes === undefined) return;
    if (attempts === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["successes"],
        message: ATTEMPTS_REQUIRED_MESSAGE,
      });
      return;
    }
    if (successes > attempts) {
      ctx.addIssue({
        code: "custom",
        path: ["successes"],
        message: SUCCESSES_OVER_ATTEMPTS_MESSAGE,
      });
    }
  });

export const evolutionFormSchema = z.object({
  criteria: z
    .array(evolutionCriterionSchema)
    .max(MAX_CRITERIA, `Inclua no máximo ${MAX_CRITERIA} critérios.`),
  descriptiveRecord: z
    .string()
    .trim()
    .min(1, "Escreva o registro descritivo.")
    .max(MAX_RECORD, `Use no máximo ${MAX_RECORD} caracteres.`),
});

export type EvolutionCriterionValues = z.input<typeof evolutionCriterionSchema>;
export type EvolutionFormValues = z.input<typeof evolutionFormSchema>;

/** Critério livre, incluído pelo profissional. */
export function emptyCriterion(): EvolutionCriterionValues {
  return {
    description: "",
    result: "NOT_OBSERVED",
    attempts: "",
    successes: "",
    note: "",
  };
}

/** Valores iniciais: os critérios sugeridos do PE (G-57); sem PE, nenhum. */
export function initialEvolutionValues(
  context: EvolutionContext,
): EvolutionFormValues {
  return {
    criteria: context.plan
      ? context.suggestedCriteria.map((suggested) => ({
          goalId: suggested.goalId,
          description: suggested.description,
          ...(suggested.successCriterion
            ? { successCriterion: suggested.successCriterion }
            : {}),
          result: "NOT_OBSERVED",
          attempts: "",
          successes: "",
          note: "",
          initialGoalStatus: suggested.goalStatus,
          goalStatus: suggested.goalStatus,
        }))
      : [],
    descriptiveRecord: "",
  };
}

/** Valores iniciais da edição (EVO-02): o que a evolução salva já tem. */
export function evolutionToFormValues(
  evolution: SessionEvolution,
  /** Estado atual das metas do PE (`goalId` → status), quando conhecido. */
  goalStatuses?: Readonly<Record<string, GoalStatus>>,
): EvolutionFormValues {
  return {
    criteria: evolution.criteria.map((criterion) => ({
      ...(criterion.goalId ? { goalId: criterion.goalId } : {}),
      description: criterion.description,
      ...(criterion.successCriterion
        ? { successCriterion: criterion.successCriterion }
        : {}),
      result: criterion.result,
      attempts:
        criterion.attempts === undefined ? "" : String(criterion.attempts),
      successes:
        criterion.successes === undefined ? "" : String(criterion.successes),
      note: criterion.note ?? "",
      ...(criterion.goalId && goalStatuses?.[criterion.goalId]
        ? {
            initialGoalStatus: goalStatuses[criterion.goalId],
            goalStatus: goalStatuses[criterion.goalId],
          }
        : {}),
    })),
    descriptiveRecord: evolution.descriptiveRecord,
  };
}

/** "8 de 10 tentativas" quando as duas contagens estão preenchidas. */
export function attemptsLabel(
  attempts: string,
  successes: string,
): string | null {
  const total = parseCount(attempts);
  const hits = parseCount(successes);
  if (total === undefined || hits === undefined || hits > total) return null;
  return `${hits} de ${total} ${total === 1 ? "tentativa" : "tentativas"}`;
}

/** `goalUpdates`: só as metas cujo estado mudou em relação ao aberto na tela. */
function changedGoalUpdates(criteria: ParsedCriterion[]) {
  return criteria.flatMap((criterion) =>
    criterion.goalId &&
    criterion.goalStatus &&
    criterion.goalStatus !== criterion.initialGoalStatus
      ? [{ goalId: criterion.goalId, status: criterion.goalStatus }]
      : [],
  );
}

type ParsedCriterion = z.output<typeof evolutionCriterionSchema>;

function toCriteriaInput(
  criteria: ParsedCriterion[],
): EvolutionCriterionInput[] {
  return criteria.map((criterion) => {
    const attempts = parseCount(criterion.attempts);
    const successes = parseCount(criterion.successes);
    const note = criterion.note.trim();
    return {
      ...(criterion.goalId ? { goalId: criterion.goalId } : {}),
      description: criterion.description,
      ...(criterion.successCriterion
        ? { successCriterion: criterion.successCriterion }
        : {}),
      ...(attempts === undefined ? {} : { attempts }),
      ...(successes === undefined ? {} : { successes }),
      result: criterion.result,
      ...(note ? { note } : {}),
    };
  });
}

/**
 * Corpo do `POST /session-evolution/`. Sem PE, vai só o registro descritivo
 * (G-57). `goalUpdates` leva só as metas cujo estado mudou.
 */
export function toCreatePayload(
  sessionId: string,
  context: EvolutionContext,
  values: EvolutionFormValues,
): CreateSessionEvolutionPayload {
  const parsed = evolutionFormSchema.parse(values);
  const plan = context.plan;
  const criteria = plan ? parsed.criteria : [];
  const goalUpdates = changedGoalUpdates(criteria);

  return {
    sessionId,
    ...(plan ? { planId: plan.id } : {}),
    criteria: toCriteriaInput(criteria),
    descriptiveRecord: parsed.descriptiveRecord,
    ...(goalUpdates.length > 0 ? { goalUpdates } : {}),
  };
}

/**
 * Corpo do `PUT /session-evolution/:id` (EV-09): a lista COMPLETA de critérios
 * e o registro. `goalUpdates` leva só as metas cujo estado mudou.
 */
export function toUpdatePayload(
  values: EvolutionFormValues,
): UpdateSessionEvolutionPayload {
  const parsed = evolutionFormSchema.parse(values);
  const goalUpdates = changedGoalUpdates(parsed.criteria);
  return {
    criteria: toCriteriaInput(parsed.criteria),
    descriptiveRecord: parsed.descriptiveRecord,
    ...(goalUpdates.length > 0 ? { goalUpdates } : {}),
  };
}
