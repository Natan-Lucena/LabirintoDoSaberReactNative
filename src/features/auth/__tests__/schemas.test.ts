import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/auth/schemas";

describe("loginSchema (AC-401-01)", () => {
  it("accepts a valid email and a password between 6 and 100 chars", () => {
    const result = loginSchema.safeParse({
      email: "educadora@example.com",
      password: "senha123",
    });

    expect(result.success).toBe(true);
  });

  it.each(["not-an-email", "", "sem-arroba.com"])(
    "rejects an invalid email: %s",
    (email) => {
      const result = loginSchema.safeParse({ email, password: "senha123" });

      expect(result.success).toBe(false);
    },
  );

  it.each(["12345", "a".repeat(101)])(
    "rejects a password outside 6-100 chars: length %#",
    (password) => {
      const result = loginSchema.safeParse({
        email: "educadora@example.com",
        password,
      });

      expect(result.success).toBe(false);
    },
  );
});
