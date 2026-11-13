// Textos compartilhados do prontuário e do hub da evolução (EVO-02).

/** `AAAA-MM-DD` → `DD/MM/AAAA`, sem passar por fuso (é uma data de calendário). */
export function formatSessionDate(day: string): string {
  const [year, month, date] = day.split("-");
  return year && month && date ? `${date}/${month}/${year}` : day;
}

/** "2 de 3 critérios atingidos"; sem critérios, "Sem critérios (só registro descritivo)". */
export function criteriaSummary(achieved: number, total: number): string {
  if (total === 0) return "Sem critérios (só registro descritivo)";
  return `${achieved} de ${total} ${total === 1 ? "critério atingido" : "critérios atingidos"}`;
}

export function achievedCount(criteria: readonly { result: string }[]): number {
  return criteria.filter((criterion) => criterion.result === "ACHIEVED").length;
}
