import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/api/endpoints/educator";
import { homeQueryKeys } from "@/features/home/useHomeData";
import {
  permissionsFor,
  type Permissions,
} from "@/features/permissions/permissions";

/** Papel do educador na equipe, lido de `GET /educator/me` (cache compartilhado). */
export function usePermissions(): Permissions {
  const { data } = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: () => getMe(),
  });
  return permissionsFor(data?.clinic);
}
