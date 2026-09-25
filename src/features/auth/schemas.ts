import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido."),
  password: z
    .string()
    .min(6, "A senha deve ter entre 6 e 100 caracteres.")
    .max(100, "A senha deve ter entre 6 e 100 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
