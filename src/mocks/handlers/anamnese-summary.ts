// Síntese da anamnese por IA (API-05, leva 2). Contrato PROVISÓRIO de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §5 (AS-01 a AS-04), a conferir em API-04.
//
// Este arquivo ENVOLVE os handlers de `anamnese-responses.ts` sem mudar o
// comportamento deles: as três rotas de leitura/edição de respostas passam a
// trazer `summary` e `summaryOutdated` quando existe síntese (AS-02), e a rota
// nova `POST /anamnese/responses/:responseId/summary` a gera e persiste (AS-01).
import type { AnamneseResponse } from "@/api/endpoints/anamnese-responses";
import type { AnamneseSummary, AnamneseSummaryFields } from "@/api/types";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
// Importar o módulo registra as rotas originais, que este arquivo envolve em seguida.
import { MOCK_ANAMNESE_RESPONSES } from "./anamnese-responses";
import { getMockHandler, registerMockHandler } from "./registry";
import type { MockHandler } from "./types";
import { MockApiError } from "./types";

interface StoredSummary extends AnamneseSummary {
  outdated: boolean;
}

/** Sínteses por `responseId`, só em memória. */
const summaries = new Map<string, StoredSummary>();
let aiFailure: "AI_GENERATION_FAILED" | "AI_INVALID_OUTPUT" | null = null;

/** Limpa as sínteses geradas e desliga a falha simulada de IA (testes e cenários manuais). */
export function resetMockAnamneseSummaryState(): void {
  summaries.clear();
  aiFailure = null;
}

/** Faz a próxima geração de síntese falhar (`null` desliga). */
export function setMockAnamneseSummaryFailure(
  code: "AI_GENERATION_FAILED" | "AI_INVALID_OUTPUT" | null,
): void {
  aiFailure = code;
}

type ResponseWithSummary = AnamneseResponse & AnamneseSummaryFields;

function decorate(response: AnamneseResponse): ResponseWithSummary {
  const stored = summaries.get(response.id);
  if (!stored) return response;
  return {
    ...response,
    summary: { text: stored.text, generatedAt: stored.generatedAt },
    summaryOutdated: stored.outdated,
  };
}

function wrap(
  method: "get" | "put",
  path: string,
  map: (data: unknown) => unknown,
): void {
  const original = getMockHandler(method, path);
  if (!original)
    throw new Error(`Handler de anamnese ausente: ${method} ${path}`);
  const handler: MockHandler = async (context) => {
    const result = await original(context);
    return { ...result, data: map(result.data) };
  };
  registerMockHandler({ method, path }, handler);
}

wrap("get", "/anamnese/responses/student/:studentId", (data) =>
  (data as AnamneseResponse[]).map(decorate),
);
wrap("get", "/anamnese/responses/:responseId", (data) =>
  decorate(data as AnamneseResponse),
);
wrap("put", "/anamnese/responses/:responseId", (data) => {
  // Resposta editada depois da síntese: a síntese fica desatualizada (AS-02).
  // O PUT devolve `summary`, mas não `summaryOutdated` (só os GETs trazem).
  const response = data as AnamneseResponse;
  const stored = summaries.get(response.id);
  if (!stored) return response;
  stored.outdated = true;
  return {
    ...response,
    summary: { text: stored.text, generatedAt: stored.generatedAt },
  };
});

function buildSummaryText(response: AnamneseResponse): string {
  // AS-03: respostas do tipo arquivo não vão ao provedor, então nem entram aqui.
  const answered = response.answers.filter(
    (answer) => answer.questionType !== "FileUpload",
  ).length;
  return [
    `- Histórico: síntese de ${answered} respostas da anamnese, para o profissional revisar.`,
    "- Queixa: registrada nas respostas descritivas; confirmar com a família.",
    "- Desenvolvimento: conferir marcos e rotina relatados antes de concluir qualquer coisa.",
    "- Escola: verificar como o apoio escolar aparece nas respostas.",
    "- Pontos de atenção: este texto é uma sugestão, sem diagnóstico.",
  ]
    .join("\n")
    .slice(0, 1500);
}

registerMockHandler(
  { method: "post", path: "/anamnese/responses/:responseId/summary" },
  ({ params }) => {
    const response = MOCK_ANAMNESE_RESPONSES.find(
      (item) => item.id === params.responseId,
    );
    if (!response) throw new MockApiError(404, "RESPONSE_NOT_FOUND");
    if (response.educatorId !== MOCK_EDUCATOR.id)
      throw new MockApiError(403, "UNAUTHORIZED");
    if (
      !response.answers.some((answer) => answer.questionType !== "FileUpload")
    )
      throw new MockApiError(400, "NO_ANSWERS_TO_SUMMARIZE");
    if (aiFailure) throw new MockApiError(500, aiFailure);

    // Gerar de novo substitui a anterior e zera o `summaryOutdated`.
    summaries.set(response.id, {
      text: buildSummaryText(response),
      generatedAt: new Date().toISOString(),
      outdated: false,
    });

    return {
      status: 200,
      data: { ...decorate(structuredClone(response)), summaryOutdated: false },
    };
  },
);

export const anamneseSummaryMockHandlersRegistered = true;
