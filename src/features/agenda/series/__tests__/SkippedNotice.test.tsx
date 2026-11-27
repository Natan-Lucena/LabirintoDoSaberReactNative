import { render, screen } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";

import { SkippedNotice } from "@/features/agenda/series/SkippedNotice";

const item = (n: number) => ({
  scheduledAt: `2026-12-0${n}T13:00:00.000Z`,
  reason: "CONFLICT" as const,
  conflictingAppointmentId: `a${n}`,
});

async function renderNotice(
  count: number,
  doneCount: number,
  doneLabel: "agendados" | "alterados" = "agendados",
) {
  await render(
    <SkippedNotice
      doneCount={doneCount}
      doneLabel={doneLabel}
      skipped={Array.from({ length: count }, (_, i) => item(i + 1))}
      ownAppointmentIds={new Set()}
      onOpen={vi.fn()}
      onDone={vi.fn()}
    />,
  );
}

describe("SkippedNotice (AGE-06)", () => {
  it("usa o singular com 1 ocorrência", async () => {
    await renderNotice(1, 1);
    expect(screen.getByText("1 agendado")).toBeTruthy();
    expect(
      screen.getByText("1 não foi criado porque o horário já estava ocupado:"),
    ).toBeTruthy();
  });

  it("usa o singular na edição", async () => {
    await renderNotice(1, 1, "alterados");
    expect(screen.getByText("1 alterado")).toBeTruthy();
    expect(
      screen.getByText(
        "1 não foi alterado porque o horário já estava ocupado:",
      ),
    ).toBeTruthy();
  });

  it("usa o plural com 2 ou mais", async () => {
    await renderNotice(2, 7);
    expect(screen.getByText("7 agendados")).toBeTruthy();
    expect(
      screen.getByText(
        "2 não foram criados porque o horário já estava ocupado:",
      ),
    ).toBeTruthy();
  });
});
