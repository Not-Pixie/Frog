import { z } from "zod";

const precoPreprocess = (val: unknown) => {
  if (typeof val !== "string") return val;
  const cleaned = val.trim().replace(/[^\d\-,.]/g, "").replace(",", ".");
  return cleaned;
};

const schema = z.object({
  nome: z.string().min(1, "Nome do produto é obrigatório"),
  categoria: z.string().optional(),
  fornecedor: z.string().optional(),
  limiteEstoque: z.string().optional(),
  unimed: z.string().min(1, "Unidade é obrigatória"),
  tags: z.string().optional(),

  preco: z
    .preprocess(precoPreprocess, z.string())
    .refine(
      (s) => s === "" || /^\d{1,8}(\.\d{1,2})?$/.test(s),
      {
        message:
          "Máximo 8 dígitos antes do ponto e até 2 casas decimais",
      }
    ),
});

export default schema;