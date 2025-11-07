export type Fornecedor = {
  fornecedor_id: number;
  nome: string;
  cnpj: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: {
    cep?: string | null;
    numero?: string | null;
    logradouro?: string | null;
  } | null;
};