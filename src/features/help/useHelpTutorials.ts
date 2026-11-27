import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { helpQueryKeys, listHelpTutorials } from "@/api/endpoints/help";
import { ApiError } from "@/api/errors";
import type { HelpTutorial } from "@/api/types";

const ONE_HOUR = 60 * 60 * 1000;

/** Backend sem a rota (404 sem code) = ainda sem tutoriais, não erro. */
async function listTutorialsOrEmpty(): Promise<HelpTutorial[]> {
  try {
    return await listHelpTutorials();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && !error.code) {
      return [];
    }
    throw error;
  }
}

export function useHelpTutorials(): UseQueryResult<HelpTutorial[]> {
  return useQuery({
    queryKey: helpQueryKeys.tutorials,
    queryFn: listTutorialsOrEmpty,
    staleTime: ONE_HOUR,
  });
}
