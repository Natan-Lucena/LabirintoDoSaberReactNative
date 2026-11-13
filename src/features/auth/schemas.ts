import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido."),
  password: z
    .string()
    .min(6, "A senha deve ter entre 6 e 100 caracteres.")
    .max(100, "A senha deve ter entre 6 e 100 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z.string().trim().email("Digite um e-mail válido."),
});

export type ForgotPasswordEmailValues = z.infer<
  typeof forgotPasswordEmailSchema
>;

export const resetCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Digite o código de 6 dígitos."),
});

export type ResetCodeValues = z.infer<typeof resetCodeSchema>;

export const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "A senha deve ter entre 6 e 100 caracteres.")
      .max(100, "A senha deve ter entre 6 e 100 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
