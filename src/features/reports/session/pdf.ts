import * as Print from "expo-print";

import type { SessionReport } from "@/api/endpoints/session-report";
import { sharePdfFromBase64 } from "../sharePdf";
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
    base64: true,
  });
  await sharePdfFromBase64(file.base64 ?? "", "relatorio-sessao.pdf");
}
