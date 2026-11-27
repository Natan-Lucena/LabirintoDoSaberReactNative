import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { helpQueryKeys, listHelpTutorials } from "@/api/endpoints/help";
import type { HelpTutorial } from "@/api/types";

const ONE_HOUR = 60 * 60 * 1000;

export function useHelpTutorials(): UseQueryResult<HelpTutorial[]> {
  return useQuery({
    queryKey: helpQueryKeys.tutorials,
    queryFn: listHelpTutorials,
    staleTime: ONE_HOUR,
  });
}
