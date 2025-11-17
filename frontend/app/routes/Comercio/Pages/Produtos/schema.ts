// deps: zod, @hookform/resolvers/zod
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

  // preco: aceita string vazia (campo opcional) OU um número no formato correto
  preco: z
    .preprocess(precoPreprocess, z.string())
    .refine(
      (s) => s === "" || /^\d{1,8}(\.\d{1,2})?$/.test(s),
      {
        message:
          "Preço inválido — formato: máximo 8 dígitos antes do ponto e até 2 casas decimais (ex: 99999999.99)",
      }
    ),
});

export default schema;