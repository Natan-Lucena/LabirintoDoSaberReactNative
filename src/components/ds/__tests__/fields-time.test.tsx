import { createElement } from "react";
import { Pressable } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { toBrasiliaISOString } from "@/utils/date";
import { TimeField } from "../TimeField";

vi.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: ({
    onValueChange,
    onDismiss,
  }: {
    onValueChange: (event: unknown, picked: Date) => void;
    onDismiss: () => void;
  }) =>
    createElement(Pressable, {
      testID: "mock-datetimepicker",
      accessibilityLabel: "mock-datetimepicker",
      onPress: () => onValueChange({}, new Date(2026, 2, 15, 9, 30)),
      onLongPress: () => onDismiss(),
    }),
}));

describe("AC-DS-04-01 TimeField rótulo e erro acessíveis", () => {
  it("usa o rótulo como accessibilityLabel do campo", async () => {
    await render(<TimeField label="Horário" value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Horário")).toBeTruthy();
  });

  it("exibe o erro com papel alert e live region polite", async () => {
    await render(
      <TimeField
        label="Horário"
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

describe("AC-DS-04-02 TimeField ancora no fuso America/Sao_Paulo", () => {
  it("combina o horário escolhido com o dia de referência em São Paulo", async () => {
    const onChange = vi.fn();
    const referenceDate = new Date(
      toBrasiliaISOString({
        year: 2026,
        month: 4,
        day: 20,
        hour: 0,
        minute: 0,
      }),
    );

    await render(
      <TimeField
        label="Horário"
        value={null}
        referenceDate={referenceDate}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Horário"));
    await fireEvent.press(screen.getByLabelText("mock-datetimepicker"));

    const expected = new Date(
      toBrasiliaISOString({
        year: 2026,
        month: 4,
        day: 20,
        hour: 9,
        minute: 30,
      }),
    );
    expect(onChange).toHaveBeenCalledWith(expected);
  });
});

describe("TimeField cancelar o seletor não altera o valor", () => {
  it("fecha o seletor sem chamar onChange", async () => {
    const onChange = vi.fn();
    await render(
      <TimeField label="Horário" value={null} onChange={onChange} />,
    );

    await fireEvent.press(screen.getByLabelText("Horário"));
    await fireEvent(screen.getByLabelText("mock-datetimepicker"), "longPress");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("mock-datetimepicker")).toBeNull();
  });
});
