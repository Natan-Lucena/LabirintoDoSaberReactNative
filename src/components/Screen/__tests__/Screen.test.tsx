import { Text } from "react-native";
import { describe, expect, it } from "vitest";

import { maxContentWidthTablet } from "../../../theme";
import { render, screen } from "../../../test-utils/render";
import { Screen } from "../index";

// AC-203-04 (parte testável: largura máxima em tablet vem do token).
// A safe area em dispositivo real e a comprovação visual em tablet ficam MAN.
describe("AC-203-04 Screen", () => {
  it("aplica a largura máxima do token no contêiner de conteúdo", async () => {
    await render(
      <Screen>
        <Text>conteúdo</Text>
      </Screen>,
    );
    const content = screen.getByTestId("screen-content");
    const flatStyle = [content.props.style]
      .flat()
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.maxWidth).toBe(maxContentWidthTablet);
  });
});
