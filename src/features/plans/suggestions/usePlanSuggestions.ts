import { useState } from "react";
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  acceptPlanSuggestion,
  dismissPlanSuggestion,
  listPlanSuggestions,
} from "@/api/endpoints/plans";
import type { GoalStatus, PlanSuggestion } from "@/api/types";
import { planQueryKeys } from "@/features/plans/hub/usePlans";

export const pendingSuggestionsKey = [
  ...planQueryKeys.all,
  "suggestions",
  "PENDING",
] as const;

const goalStatusLabels: Record<GoalStatus, string> = {
  NOT_STARTED: "Não iniciada",
  IN_PROGRESS: "Em andamento",
  ACHIEVED: "Atingida",
  DISCONTINUED: "Descontinuada",
};

/** Sugestões pendentes de todos os planos do educador. */
export function usePendingSuggestions(): UseQueryResult<PlanSuggestion[]> {
  return useQuery({
    queryKey: pendingSuggestionsKey,
    queryFn: () => listPlanSuggestions("PENDING"),
  });
}

function displayDate(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

/**
 * A mudança proposta em linguagem simples. Com a descrição da meta afetada
 * (quando a tela a conhece), o texto diz qual meta muda (PLN-05).
 */
export function describeSuggestionChange(
  suggestion: PlanSuggestion,
  goalDescription?: string,
): string {
  const change = suggestion.proposedChange;
  const goal = goalDescription ? `a meta “${goalDescription}”` : null;
  switch (suggestion.kind) {
    case "UPDATE_GOAL_STATUS": {
      const status = change.status
        ? goalStatusLabels[change.status]
        : "novo status";
      return goal
        ? `Mudar ${goal} para ${status}`
        : `Mudar meta para ${status}`;
    }
    case "ADD_GOAL":
      return `Nova meta: ${change.description ?? ""}`;
    case "REWRITE_GOAL":
      return goal
        ? `Reescrever ${goal} como: ${change.description ?? ""}`
        : `Reescrever meta: ${change.description ?? ""}`;
    case "SCHEDULE_REVIEW":
      return `Agendar revisão para ${change.nextReviewDate ? displayDate(change.nextReviewDate) : "nova data"}`;
  }
}

const NOT_APPLICABLE_MESSAGE = "Esta sugestão não se aplica mais";
const ALREADY_RESOLVED_MESSAGE = "Esta sugestão já foi resolvida";
const FAILURE_MESSAGE = "Não foi possível concluir. Tente novamente.";

/** Aceitar e descartar sugestões, com a mensagem de cada erro do contrato. */
export function useSuggestionActions(): {
  busyId: string | null;
  message: string;
  accept: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
} {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function removeFromList(id: string): void {
    queryClient.setQueryData<PlanSuggestion[]>(pendingSuggestionsKey, (old) =>
      old?.filter((item) => item.id !== id),
    );
  }

  async function run(
    id: string,
    action: () => Promise<void>,
    successMessage: string,
  ): Promise<void> {
    setBusyId(id);
    setMessage("");
    try {
      await action();
      removeFromList(id);
      setMessage(successMessage);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === "SUGGESTION_NOT_APPLICABLE") {
        removeFromList(id);
        setMessage(NOT_APPLICABLE_MESSAGE);
      } else if (code === "SUGGESTION_ALREADY_RESOLVED") {
        removeFromList(id);
        setMessage(ALREADY_RESOLVED_MESSAGE);
      } else {
        setMessage(FAILURE_MESSAGE);
      }
    } finally {
      setBusyId(null);
      void queryClient.invalidateQueries({ queryKey: planQueryKeys.all });
    }
  }

  return {
    busyId,
    message,
    accept: (id) =>
      run(
        id,
        async () => {
          const plan = await acceptPlanSuggestion(id);
          queryClient.setQueryData(
            [...planQueryKeys.all, "detail", plan.id],
            plan,
          );
        },
        "Sugestão aceita",
      ),
    dismiss: (id) =>
      run(
        id,
        async () => {
          await dismissPlanSuggestion(id);
        },
        "Sugestão descartada",
      ),
  };
}
