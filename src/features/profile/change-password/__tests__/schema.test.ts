import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "@/features/profile/change-password/schema";

const valid = {
  currentPassword: "atual123",
  newPassword: "novaSenha1",
  confirmPassword: "novaSenha1",
};

describe("changePasswordSchema (REC-03)", () => {
  it("aceita valores válidos", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("recusa confirmação diferente no campo da confirmação", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: "outra",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]).toMatchObject({
        path: ["confirmPassword"],
        message: "As senhas não conferem.",
      });
  });

  it("exige senha atual e nova senha de 6 a 100 caracteres", () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success,
    ).toBe(false);
    const short = "12345";
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: short,
        confirmPassword: short,
      }).success,
    ).toBe(false);
    const long = "a".repeat(101);
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: long,
        confirmPassword: long,
      }).success,
    ).toBe(false);
    const edge = "a".repeat(100);
    expect(
      changePasswordSchema.safeParse({
        ...valid,
        newPassword: edge,
        confirmPassword: edge,
      }).success,
    ).toBe(true);
  });
});
