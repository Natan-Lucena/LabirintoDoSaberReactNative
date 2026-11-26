import { useState, type ReactElement } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { getScaleApplication } from "@/api/endpoints/scales";
import { ApiError } from "@/api/errors";
import type { PatientOverview } from "@/api/types";
import { FeatureRow, SectionTitle } from "@/components/ds";
import { applyRoute, resultRoute } from "@/features/assessments/routes";

import { pendingLabel, pendingRoute, type PendingTarget } from "./pendings";

const UNAVAILABLE = "Este item não está mais disponível.";

/** Seção "Pendências" da ficha (PAC-10): uma linha por pendência, que abre o destino. */
export function PendingsSection({
  studentId,
  overview,
  onSelectTab,
  onToast,
}: {
  studentId: string;
  overview: PatientOverview;
  onSelectTab: (tab: "plans" | "assessments") => void;
  onToast: (message: string) => void;
}): ReactElement | null {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const rows = overview.pendings.flatMap((pending) => {
    const title = pendingLabel(pending);
    const target = pendingRoute(pending, studentId);
    return title && target ? [{ pending, title, target }] : [];
  });
  if (rows.length === 0) return null;

  async function open(target: PendingTarget): Promise<void> {
    if (target.type === "route") {
      router.push(target.route);
      return;
    }
    if (target.type === "tab") {
      onSelectTab(target.tab);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const application = await getScaleApplication(target.applicationId);
      router.push(
        application.status === "DRAFT"
          ? applyRoute(application.templateId, {
              studentId: application.studentId,
              applicationId: application.id,
            })
          : resultRoute(application.id),
      );
    } catch (error) {
      onToast(
        error instanceof ApiError && error.status === 404
          ? UNAVAILABLE
          : "Não foi possível abrir agora. Tente de novo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <SectionTitle title="Pendências" />
      {rows.map(({ pending, title, target }) => (
        <FeatureRow
          key={pending.kind}
          icon="clipboard"
          title={title}
          subtitle="Toque para abrir"
          onPress={() => void open(target)}
        />
      ))}
    </View>
  );
}
