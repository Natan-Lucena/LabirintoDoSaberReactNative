// Recorrência (API-07, leva 3; CONTRATOS-BACKEND §5.7): leitura do detalhe da
// série. Contrato PROPOSTO, mock-first. As ocorrências NÃO entram em
// `GET /appointment/` (a agenda dos mocks não muda).
import {
  MOCK_SERIES,
  MOCK_SERIES_ENDED,
  MOCK_SERIES_ENDED_ID,
  MOCK_SERIES_FOREIGN_ID,
  MOCK_SERIES_ID,
} from "@/mocks/fixtures-e5";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const SERIES = {
  [MOCK_SERIES_ID]: MOCK_SERIES,
  [MOCK_SERIES_ENDED_ID]: MOCK_SERIES_ENDED,
};

registerMockHandler(
  { method: "get", path: "/appointment/series/:id" },
  ({ params }) => {
    if (params.id === MOCK_SERIES_FOREIGN_ID) {
      throw new MockApiError(403, "UNAUTHORIZED");
    }
    const series = SERIES[params.id as keyof typeof SERIES];
    if (!series) {
      throw new MockApiError(404, "SERIES_NOT_FOUND");
    }
    return { status: 200, data: structuredClone(series) };
  },
);

export const appointmentSeriesMockHandlersRegistered = true;
