import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { SessionReport } from "@/api/endpoints/session-report";
import { buildSessionReportHtml } from "./sessionReport";

export async function printSessionReport(
  report: SessionReport,
  patientName?: string,
): Promise<void> {
  await Print.printAsync({ html: buildSessionReportHtml(report, patientName) });
}

export async function shareSessionReport(
  report: SessionReport,
  patientName?: string,
): Promise<void> {
  const file = await Print.printToFileAsync({
    html: buildSessionReportHtml(report, patientName),
  });
  await Sharing.shareAsync(file.uri, { mimeType: "application/pdf" });
}
