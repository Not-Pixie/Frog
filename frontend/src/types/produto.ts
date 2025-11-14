export type Produto = {
  produto_id: number;
  codigo: number;
  nome: string;
  preco: string;
  quantidade_estoque: number;
  tags?: string | null;
  unimed_id: number;
  categoria_id: number;
  fornecedor_id: number;
  comercio_id: number;
  criado_em: string;
  atualizado_em: string;
  categoriaNome?: string | null;
  fornecedorNome?: string | null;
  unidadeMedidaNome?: string | null;
  unidadeMedidaSigla?: string | null;
};