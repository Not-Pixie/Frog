import {z} from "zod";


const validateCNPJ = (cnpjRaw: string) => {
  const cnpj = cnpjRaw.replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false; // todos iguais

  const calc = (slice: string, factors: number[]) => {
    let sum = 0;
    for (let i = 0; i < factors.length; i++) {
      sum += Number(slice[i]) * factors[i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstFactors = [5,4,3,2,9,8,7,6,5,4,3,2];
  const secondFactors = [6,5,4,3,2,9,8,7,6,5,4,3,2];

  const dv1 = calc(cnpj.slice(0, 12), firstFactors);
  const dv2 = calc(cnpj.slice(0, 12) + String(dv1), secondFactors);

  return dv1 === Number(cnpj[12]) && dv2 === Number(cnpj[13]);
}

const optionalNonEmptyString = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val === "" ? undefined : val), schema.optional());


export const fornecedorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.preprocess(
    (val) => (typeof val === "string" ? val.replace(/\D/g, "") : val),
    optionalNonEmptyString(
      z
        .string()
        .length(14, "CNPJ deve ter 14 dígitos")
        .refine((v) => validateCNPJ(v), { message: "CNPJ inválido" })
    )
  ),
  telefone: optionalNonEmptyString(
    z.string().min(8, "Telefone inválido").max(15, "Telefone inválido")
  ),
  email: optionalNonEmptyString(
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido")
  ),
  cep: z.preprocess(
    (val) => (typeof val === "string" ? val.replace(/\D/g, "") : val),
    optionalNonEmptyString(z.string().length(8, "CEP deve ter 8 dígitos"))
  ),
  numero: optionalNonEmptyString(z.string().max(10, "Número muito longo")),
});

export type FornecedorForm = z.infer<typeof fornecedorSchema>;