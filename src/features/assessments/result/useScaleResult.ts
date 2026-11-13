import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getScaleApplication,
  getScaleTemplate,
  scaleQueryKeys,
} from "@/api/endpoints/scales";
import type { ScaleApplication, ScaleTemplate } from "@/api/types";

export function useScaleApplication(
  id: string,
): UseQueryResult<ScaleApplication> {
  return useQuery({
    queryKey: scaleQueryKeys.application(id),
    queryFn: () => getScaleApplication(id),
  });
}

/** Texto dos itens e rótulos das opções; falha aqui não derruba o resultado. */
export function useResultTemplate(
  templateId: string | undefined,
): UseQueryResult<ScaleTemplate> {
  return useQuery({
    queryKey: scaleQueryKeys.template(templateId ?? ""),
    queryFn: () => getScaleTemplate(templateId as string),
    enabled: Boolean(templateId),
  });
}
