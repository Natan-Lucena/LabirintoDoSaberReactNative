import { z } from "zod";

const LENGTH_MESSAGE = "A senha deve ter entre 6 e 100 caracteres.";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z.string().min(6, LENGTH_MESSAGE).max(100, LENGTH_MESSAGE),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
