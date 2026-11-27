import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { isValidInviteCode, normalizeInviteCode } =
  await import("@/features/auth/invite/code");

describe("código do convite (EQP-03, AC-EQP-03-03)", () => {
  it("normaliza maiúsculas, espaços e hífens", () => {
    expect(normalizeInviteCode(" ab3k-7mpq ")).toBe("AB3K7MPQ");
  });

  it("aceita códigos válidos mesmo digitados com hífen e minúsculas", () => {
    expect(isValidInviteCode("abcd-2345")).toBe(true);
    expect(isValidInviteCode("AB3K7MPQ")).toBe(true);
  });

  it("recusa 0, O, 1 e I e tamanhos errados", () => {
    expect(isValidInviteCode("ABCD0345")).toBe(false);
    expect(isValidInviteCode("ABCDO345")).toBe(false);
    expect(isValidInviteCode("ABCD1345")).toBe(false);
    expect(isValidInviteCode("ABCDI345")).toBe(false);
    expect(isValidInviteCode("ABCD234")).toBe(false);
    expect(isValidInviteCode("ABCD23456")).toBe(false);
  });
});
