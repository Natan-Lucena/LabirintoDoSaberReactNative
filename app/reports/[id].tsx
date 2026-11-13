import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { ReportPreviewScreen } from "@/features/reports/document/ReportPreviewScreen";

export default function ReportPreviewRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ReportPreviewScreen reportId={id ?? ""} />;
}
