import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../test-utils/render";
import { StatTile } from "../StatTile";

describe("StatTile", () => {
  it("renderiza rótulo e valor", async () => {
    await render(<StatTile label="Total de Sessões" value="4" />);
    expect(screen.getByText("Total de Sessões")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });
});
