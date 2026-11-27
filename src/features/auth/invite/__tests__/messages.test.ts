import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { INVITE_INVALID_MESSAGE, inviteErrorMessage } from "../messages";

describe("inviteErrorMessage", () => {
  it("404 sem code conhecido vira a frase de convite inválido", () => {
    const error = new ApiError({ status: 404, message: "Not Found" });
    expect(inviteErrorMessage(error)).toBe(INVITE_INVALID_MESSAGE);
  });
});
