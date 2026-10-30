import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { FeatureRow } from "../FeatureRow";
import { InfoCard } from "../InfoCard";
import { SectionTitle } from "../SectionTitle";
import { Timeline } from "../Timeline";

// QA-03 (divergência #26): rótulos e papéis de acessibilidade.
describe("QA-03 rótulos e papéis", () => {
  it("SectionTitle anuncia o título como cabeçalho", async () => {
    await render(<SectionTitle title="Próxima sessão" />);
    // Mesmo padrão do teste do AppHeader (papel sem filtro de nome).
    expect(screen.getByRole("header").props.children).toBe("Próxima sessão");
  });

  it("InfoCard tocável lê a descrição como dica (o rótulo continua o título)", async () => {
    await render(
      <InfoCard
        icon="file"
        title="Anamnese"
        description="Última em 29/10/2026"
        onPress={vi.fn()}
      />,
    );
    const card = screen.getByRole("button", { name: "Anamnese" });
    expect(card.props.accessibilityHint).toBe("Última em 29/10/2026");
  });

  it("FeatureRow lê o subtítulo como dica", async () => {
    await render(
      <FeatureRow
        icon="book"
        title="Modelos de anamnese"
        subtitle="Monte os questionários de anamnese"
        onPress={vi.fn()}
      />,
    );
    const row = screen.getByRole("button", { name: "Modelos de anamnese" });
    expect(row.props.accessibilityHint).toBe(
      "Monte os questionários de anamnese",
    );
  });

  it("Timeline aceita um rótulo acessível próprio para a ação", async () => {
    await render(
      <Timeline
        items={[
          {
            id: "1",
            time: "14:00",
            title: "Lia",
            actionLabel: "Lembrete",
            actionAccessibilityLabel: "Enviar lembrete pelo WhatsApp para Lia",
            onActionPress: vi.fn(),
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Enviar lembrete pelo WhatsApp para Lia",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Lembrete")).toBeTruthy();
  });
});
