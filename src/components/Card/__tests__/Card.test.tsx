import { Text } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { Card } from "../index";

// AC-202-04: Card selecionável informa accessibilityState.selected.
describe("AC-202-04 Card selecionável", () => {
  it("expõe papel button quando onPress é fornecido", async () => {
    await render(
      <Card onPress={vi.fn()} accessibilityLabel="Aluno João">
        <Text>João</Text>
      </Card>,
    );
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("reflete accessibilityState.selected quando selected=true", async () => {
    await render(
      <Card onPress={vi.fn()} selected accessibilityLabel="Aluno João">
        <Text>João</Text>
      </Card>,
    );
    expect(screen.getByRole("button").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
