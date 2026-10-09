/**
 * As rotas de IA do backend levam cerca de 30 s (medido: 34 s na análise do
 * aluno). O timeout padrão do cliente é 10 s, então elas usam este valor.
 */
export const AI_TIMEOUT_MS = 90_000;
