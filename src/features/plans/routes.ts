// Destinos do bloco de planos. Telas ainda inexistentes apontam para "Em breve":
// a PLN-02 troca `NEW_PLAN_ROUTE` por `/plans/new` e a PLN-04 troca
// `planDetailRoute` por `/plans/{id}`, cada uma em uma linha.
export const PLANS_ROUTE = "/plans" as const;

export const NEW_PLAN_ROUTE = "/plans/new" as const;

export const planDetailRoute = (_planId: string) =>
  ({
    pathname: "/shell/coming-soon",
    params: { title: "Detalhe do plano" },
  }) as const;
