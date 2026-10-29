// Destinos do bloco de planos: lista, criação e detalhe.
export const PLANS_ROUTE = "/plans" as const;

export const afterSavePlanRoute = (planId: string) => planDetailRoute(planId);

export const NEW_PLAN_ROUTE = "/plans/new" as const;

export const PLAN_SUGGESTIONS_ROUTE = "/plans/suggestions" as const;

export const planDetailRoute = (planId: string) =>
  ({
    pathname: "/plans/[id]",
    params: { id: planId },
  }) as const;
