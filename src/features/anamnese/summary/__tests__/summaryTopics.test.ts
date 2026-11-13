import { describe, expect, it } from "vitest";

import { splitSummaryTopics } from "../summaryTopics";

describe("splitSummaryTopics", () => {
  it("separa tópicos colados depois de ponto final", () => {
    expect(
      splitSummaryTopics("- Histórico: paciente feminino.- Queixa: ansiedade."),
    ).toEqual(["Histórico: paciente feminino.", "Queixa: ansiedade."]);
  });

  it("separa tópicos por quebra de linha", () => {
    expect(splitSummaryTopics("- A: um\n- B: dois")).toEqual([
      "A: um",
      "B: dois",
    ]);
  });

  it("não quebra hífen no meio da frase", () => {
    expect(splitSummaryTopics("Rotina pré-escolar e casa-escola")).toEqual([
      "Rotina pré-escolar e casa-escola",
    ]);
  });

  it("devolve o texto como está quando não há marcadores", () => {
    expect(splitSummaryTopics("Texto corrido.")).toEqual(["Texto corrido."]);
    expect(splitSummaryTopics("  ")).toEqual([]);
  });
});
