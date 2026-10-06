import { describe, expect, it } from "vitest";

import { color } from "../../../theme";
import { render, screen } from "../../../test-utils/render";
import { Avatar } from "../Avatar";

// AC-DS-05-01: variantes do `.avatar` do Make (mint, peach, lavender).
describe("AC-DS-05 Avatar", () => {
  it("mostra as iniciais do nome", async () => {
    await render(<Avatar name="Maria Souza" />);
    expect(screen.getByText("MS")).toBeTruthy();
  });

  it("usa uma única inicial para nome com uma palavra", async () => {
    await render(<Avatar name="Maria" />);
    expect(screen.getByText("M")).toBeTruthy();
  });

  it("aplica o tom mint explícito", async () => {
    await render(<Avatar name="Maria Souza" tone="mint" />);
    const view = screen.getByLabelText("Maria Souza");
    const flatStyle = [view.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.brand[100]);
  });

  it("aplica o tom peach explícito", async () => {
    await render(<Avatar name="Maria Souza" tone="peach" />);
    const view = screen.getByLabelText("Maria Souza");
    const flatStyle = [view.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.peach);
  });

  it("aplica o tom lavender explícito", async () => {
    await render(<Avatar name="Maria Souza" tone="lavender" />);
    const view = screen.getByLabelText("Maria Souza");
    const flatStyle = [view.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.lavender);
  });

  it("escolhe o mesmo tom determinístico para o mesmo nome quando não informado", async () => {
    const first = await render(<Avatar name="João Pedro" />);
    const firstStyle = [screen.getByLabelText("João Pedro").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    first.unmount();

    await render(<Avatar name="João Pedro" />);
    const secondStyle = [screen.getByLabelText("João Pedro").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});

    expect(secondStyle.backgroundColor).toBe(firstStyle.backgroundColor);
  });
});
