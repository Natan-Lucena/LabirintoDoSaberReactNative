import { createElement } from "react";
import { Pressable } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { toBrasiliaISOString } from "@/utils/date";
import { DateField } from "../DateField";

// Mock mínimo do picker nativo: um botão de teste que simula a escolha de
// uma data fixa pelo usuário, no formato de evento do
// @react-native-community/datetimepicker (`{ type: "set" }`, `Date`).
vi.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: ({
    onChange,
  }: {
    onChange: (event: { type: string }, picked?: Date) => void;
  }) =>
    createElement(Pressable, {
      testID: "mock-datetimepicker",
      accessibilityLabel: "mock-datetimepicker",
      onPress: () => onChange({ type: "set" }, new Date(2026, 2, 15, 9, 30)),
    }),
}));

describe("AC-DS-04-01 DateField rótulo e erro acessíveis", () => {
  it("usa o rótulo como accessibilityLabel do campo", async () => {
    await render(<DateField label="Data" value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Data")).toBeTruthy();
  });

  it("exibe o erro com papel alert e live region polite", async () => {
    await render(
      <DateField
        label="Data"
        value={null}
        onChange={vi.fn()}
        error="Campo obrigatório"
      />,
    );
    const errorNode = screen.getByText("Campo obrigatório");
    expect(errorNode.props.accessibilityRole).toBe("alert");
    expect(errorNode.props.accessibilityLiveRegion).toBe("polite");
  });
});

describe("AC-DS-04-02 DateField ancora no fuso America/Sao_Paulo", () => {
  it("converte a data escolhida para meia-noite em São Paulo", async () => {
    const onChange = vi.fn();
    await render(<DateField label="Data" value={null} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText("Data"));
    await fireEvent.press(screen.getByLabelText("mock-datetimepicker"));

    const expected = new Date(
      toBrasiliaISOString({
        year: 2026,
        month: 3,
        day: 15,
        hour: 0,
        minute: 0,
      }),
    );
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});
