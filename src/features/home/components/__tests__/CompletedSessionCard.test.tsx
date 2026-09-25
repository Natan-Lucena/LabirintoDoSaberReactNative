import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../test-utils/render";
import { CompletedSessionCard } from "../CompletedSessionCard";

// AC-602-02: campo ausente (studentName) não gera texto vazio nem placeholder.
describe("AC-602-02 CompletedSessionCard", () => {
  it("mostra aluno e nome da sessão quando studentName está presente", async () => {
    await render(
      <CompletedSessionCard studentName="Maria" sessionName="Leitura Guiada" />,
    );
    expect(screen.getByText("Maria")).toBeTruthy();
    expect(screen.getByText("Leitura Guiada")).toBeTruthy();
  });

  it("mostra só o nome da sessão quando studentName está ausente", async () => {
    await render(<CompletedSessionCard sessionName="Leitura Guiada" />);
    expect(screen.getByText("Leitura Guiada")).toBeTruthy();
    expect(screen.queryByText("undefined")).toBeNull();
    expect(screen.queryByText("")).toBeNull();
  });
});
