import { LocaleConfig } from "react-native-calendars";
import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../test-utils/render";
import { MiniCalendar } from "../MiniCalendar";

describe("MiniCalendar em português (D2)", () => {
  it("configura o locale pt-br como padrão", () => {
    expect(LocaleConfig.defaultLocale).toBe("pt-br");
    const names = LocaleConfig.locales["pt-br"].dayNamesShort;
    expect(names[0]).toBe("dom");
    expect(names).toContain("seg");
  });

  it("mostra os dias da semana em português no cabeçalho", async () => {
    await render(
      <MiniCalendar
        year={2026}
        month={3}
        selectedDayKey="2026-04-02"
        appointmentCounts={{}}
        onSelectDate={() => {}}
        onChangeMonth={() => {}}
      />,
    );
    expect(
      screen.getByText("seg", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(
      screen.queryByText("Mon", { includeHiddenElements: true }),
    ).toBeNull();
  });
});
