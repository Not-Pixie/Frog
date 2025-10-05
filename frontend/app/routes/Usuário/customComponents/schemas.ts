import { z } from "zod";

export const companySchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório.")
    .transform((s) => s.trim()),
  configs: z
    .object({
      campo1: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() || undefined : v),
        z.string().optional()
      ),
      campo4: z.preprocess(
        (v) => (typeof v === "string" ? v.trim() || undefined : v),
        z.string().optional()
      ),
    })
    .optional(),
});

export type FormValues = z.infer<typeof companySchema>;

export type Company = {
  id?: string | number;
  nome: string;
  configs?: {
    campo1?: string;
    campo4?: string;
  };
  [k: string]: any;
};

export type Comercio = {
  comercio_id: number,
  nome: string,
  is_proprietario: boolean,
  criado_em: string
};
