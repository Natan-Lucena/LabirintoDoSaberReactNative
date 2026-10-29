import { useQuery } from "@tanstack/react-query";

import {
  listAnamneseResponsesByStudent,
  type AnamneseResponse,
} from "@/api/endpoints/anamnese-responses";

export function anamneseResponsesKey(studentId: string) {
  return ["anamnese", "responses", "student", studentId] as const;
}

/**
 * Respostas completas do paciente. Não usa `GET /anamnese/responses/:id`: o
 * 401 dessa rota (D4) seria tratado como sessão expirada.
 */
export function useAnamneseResponses(studentId: string) {
  return useQuery<AnamneseResponse[]>({
    queryKey: anamneseResponsesKey(studentId),
    queryFn: () => listAnamneseResponsesByStudent(studentId),
    enabled: studentId.length > 0,
  });
}
