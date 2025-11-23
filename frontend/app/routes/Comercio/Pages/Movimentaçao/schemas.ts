import { z } from "zod";

export const addSchema = z.object({
  produto: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Selecione um produto")),
  quantidade: z.preprocess((v) => {
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  }, z.number().int().min(1, "Quantidade não pode ser menor que 1")),
});