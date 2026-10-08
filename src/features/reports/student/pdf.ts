import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { buildStudentReportHtml, type StudentReportInput } from "./studentReport";

export async function printStudentReport(
  input: StudentReportInput,
): Promise<void> {
  await Print.printAsync({ html: buildStudentReportHtml(input) });
}

export async function shareStudentReport(
  input: StudentReportInput,
): Promise<void> {
  const file = await Print.printToFileAsync({
    html: buildStudentReportHtml(input),
  });
  await Sharing.shareAsync(file.uri, { mimeType: "application/pdf" });
}
