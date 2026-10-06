import { Text, View } from "react-native";
import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { FieldGrid } from "../FieldGrid";

describe("FieldGrid", () => {
  it("renderiza os dois filhos", async () => {
    await render(
      <FieldGrid>
        <Text>Campo A</Text>
        <Text>Campo B</Text>
      </FieldGrid>,
    );
    expect(screen.getByText("Campo A")).toBeTruthy();
    expect(screen.getByText("Campo B")).toBeTruthy();
  });

  it("usa layout em 2 colunas quando a largura é maior que 360", async () => {
    await render(
      <FieldGrid>
        <View testID="grid-root" />
      </FieldGrid>,
    );
    await fireEvent(screen.getByTestId("grid-root").parent!.parent!, "layout", {
      nativeEvent: { layout: { width: 400, height: 10, x: 0, y: 0 } },
    });
    const flatStyle = [
      screen.getByTestId("grid-root").parent!.parent!.props.style,
    ]
      .flat()
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.flexDirection).toBe("row");
  });

  it("empilha em 1 coluna quando a largura é menor que 360", async () => {
    await render(
      <FieldGrid>
        <View testID="grid-root-narrow" />
      </FieldGrid>,
    );
    await fireEvent(
      screen.getByTestId("grid-root-narrow").parent!.parent!,
      "layout",
      { nativeEvent: { layout: { width: 320, height: 10, x: 0, y: 0 } } },
    );
    const flatStyle = [
      screen.getByTestId("grid-root-narrow").parent!.parent!.props.style,
    ]
      .flat()
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.flexDirection).toBe("column");
  });
});
