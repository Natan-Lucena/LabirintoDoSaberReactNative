import { describe, expect, it } from "vitest";

import { color } from "../../../theme";
import { render, screen } from "../../../test-utils/render";
import { Timeline } from "../Timeline";

// AC-DS-05-01: `.timeline-item` com marcadores `--done` e `--active`.
describe("AC-DS-05 Timeline", () => {
  it("marca o item done com o marcador cheio brand-500", async () => {
    await render(
      <Timeline
        items={[
          { id: "1", time: "08:00", title: "Triagem", status: "done" },
          { id: "2", time: "09:00", title: "Sessão", status: "active" },
          { id: "3", time: "10:00", title: "Relatório" },
        ]}
      />,
    );

    const doneMarker = screen.getByTestId("timeline-marker-1");
    const flatStyle = [doneMarker.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.brand[500]);
  });

  it("marca o item active com o tom peach", async () => {
    await render(
      <Timeline
        items={[
          { id: "1", time: "08:00", title: "Triagem", status: "done" },
          { id: "2", time: "09:00", title: "Sessão", status: "active" },
        ]}
      />,
    );

    const activeMarker = screen.getByTestId("timeline-marker-2");
    const flatStyle = [activeMarker.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.peach);
  });

  it("renderiza título e horário de cada item", async () => {
    await render(
      <Timeline items={[{ id: "1", time: "08:00", title: "Triagem" }]} />,
    );
    expect(screen.getByText("08:00")).toBeTruthy();
    expect(screen.getByText("Triagem")).toBeTruthy();
  });
});
