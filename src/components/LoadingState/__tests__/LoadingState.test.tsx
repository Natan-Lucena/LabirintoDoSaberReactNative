import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { LoadingState } from "../index";

describe("LoadingState", () => {
  it("anuncia carregando com rótulo padrão", async () => {
    await render(<LoadingState />);
    const region = screen.getByRole("progressbar");
    expect(region.props.accessibilityLabel).toBe("Carregando");
  });

  it("aceita rótulo customizado", async () => {
    await render(<LoadingState label="Carregando alunos" />);
    const region = screen.getByRole("progressbar");
    expect(region.props.accessibilityLabel).toBe("Carregando alunos");
  });
});
