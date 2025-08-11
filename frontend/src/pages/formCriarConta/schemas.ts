import { z } from "zod";

export const step1Schema = z.object({
    email: z.string().max(150, "Email deve ter no máximo 150 caracteres").regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
    nome: z.string().min(1, "Nome do Proprietário é obrigatório").max(150, "Nome do Proprietário deve ter no máximo 150 caracteres"),
})

export const step2Schema = z.object({
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(255, "Senha deve ter no máximo 255 caracteres"),
    confirmarSenha: z.string().min(6, "Confirmação de Senha é obrigatória").max(255, "Confirmação de Senha deve ter no máximo 255 caracteres"),
})

export const formSchema = z.
    object({
        ...step1Schema.shape,
        ...step2Schema.shape
    })
    .superRefine((data, ctx) => {
        if (data.senha !== data.confirmarSenha) {
            ctx.addIssue({
                path: ["confirmarSenha"],
                code: "custom",
                message: "As senhas devem ser iguais",
        });
            ctx.addIssue({
                path: ["senha"],
                code: "custom",
                message: "As senhas devem ser iguais",
            });
        }
    });

export type FormData = z.infer<typeof formSchema>;