import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { Avatar } from "../Avatar";

describe("Avatar com foto", () => {
  it("mostra a foto no lugar das iniciais", async () => {
    await render(
      <Avatar name="Maria Souza" photoUrl="https://exemplo.test/maria.jpg" />,
    );
    const image = screen.getByTestId("avatar-photo");
    expect([image.props.source].flat()[0]).toEqual({
      uri: "https://exemplo.test/maria.jpg",
    });
    expect(screen.queryByText("MS")).toBeNull();
  });

  it("mostra as iniciais sem foto", async () => {
    await render(<Avatar name="Maria Souza" photoUrl={null} />);
    expect(screen.getByText("MS")).toBeTruthy();
    expect(screen.queryByTestId("avatar-photo")).toBeNull();
  });

  it("mostra as iniciais com foto vazia", async () => {
    await render(<Avatar name="Maria Souza" photoUrl="" />);
    expect(screen.getByText("MS")).toBeTruthy();
    expect(screen.queryByTestId("avatar-photo")).toBeNull();
  });

  it("volta às iniciais quando a foto falha", async () => {
    await render(
      <Avatar name="Maria Souza" photoUrl="https://exemplo.test/x.jpg" />,
    );
    await fireEvent(screen.getByTestId("avatar-photo"), "error");
    expect(screen.getByText("MS")).toBeTruthy();
    expect(screen.queryByTestId("avatar-photo")).toBeNull();
  });
});
