import { AccessibilityInfo } from "react-native";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { DsButton } from "../DsButton";
import { getPressScaleStyle } from "../usePressScale";

// AC-DS-03-03: o toque usa scale .98 e respeita "reduzir movimento".
describe("AC-DS-03 getPressScaleStyle", () => {
  it("aplica scale .98 quando pressionado e sem reduzir movimento", () => {
    expect(getPressScaleStyle(true, false)).toEqual({
      transform: [{ scale: 0.98 }],
    });
  });

  it("não aplica nada quando solto", () => {
    expect(getPressScaleStyle(false, false)).toBeUndefined();
  });

  it("não aplica nada quando reduzir movimento está ligado", () => {
    expect(getPressScaleStyle(true, true)).toBeUndefined();
  });
});

describe("AC-DS-03 reduzir movimento integrado a um componente", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não aplica o scale .98 ao pressionar quando o sistema pede reduzir movimento", async () => {
    vi.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(
      true,
    );

    await render(<DsButton label="Salvar" onPress={vi.fn()} />);

    await fireEvent(screen.getByRole("button"), "pressIn");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const flatStyle = [screen.getByRole("button").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.transform).toBeUndefined();
  });
});
