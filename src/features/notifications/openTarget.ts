// Destino de uma notificação (NOT-01 lista e NOT-02 push): um só lugar para a regra.
import type { Href } from "expo-router";

import { getScaleApplication } from "@/api/endpoints/scales";
import type { AppNotification } from "@/api/types";
import { applyRoute, resultRoute } from "@/features/assessments/routes";
import { evolutionRoute } from "@/features/evolution/register/routes";
import { planDetailRoute } from "@/features/plans/routes";

/** O que o destino precisa do router (testável sem expo-router). */
export interface NotificationRouter {
  push: (href: Href) => void;
}

/**
 * Abre o destino. Só `SCALE_APPLICATION` consulta a API (rascunho ou resultado) e
 * propaga o erro dessa consulta: quem chama decide a mensagem.
 */
export async function openNotificationTarget(
  router: NotificationRouter,
  target: NonNullable<AppNotification["target"]>,
): Promise<void> {
  switch (target.type) {
    case "AGENDA_DAY":
      router.push("/(tabs)/agenda");
      return;
    case "SESSION":
      router.push(evolutionRoute(target.id, "entry"));
      return;
    case "PLAN":
      router.push(planDetailRoute(target.id));
      return;
    case "SCALE_APPLICATION": {
      const application = await getScaleApplication(target.id);
      router.push(
        application.status === "DRAFT"
          ? applyRoute(application.templateId, {
              studentId: application.studentId,
              applicationId: application.id,
            })
          : resultRoute(application.id),
      );
    }
  }
}
