import { describe, expect, it } from "vitest";

import { toApiTimeToAnswer } from "../time";

describe("toApiTimeToAnswer", () => {
  it("G-07: envia milissegundos inteiros não negativos até confirmação do backend", () => {
    expect(toApiTimeToAnswer(1234.8)).toBe(1234);
    expect(toApiTimeToAnswer(-10)).toBe(0);
  });
});
